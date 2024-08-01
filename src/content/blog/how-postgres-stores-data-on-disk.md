---
title: How Postgres stores data on disk – this one's a page turner
description: A high-level overview of how PostgreSQL stores data on disk, covering segments, pages and more.
date: 2024-07-18T00:00:00.000Z
tags:
  - postgres
  - databases
draft: true
---

I remember when I first started on server-side applications – the kind that need to persist data – and not getting what the big deal about databases was. Why are databases such a big thing? Can't we just store some data on disk and read / write from it when we need to? (**Spoiler:** no.)

Once I started working with real-life applications instead of just hobby projects, I realised that databases are basically magic, and SQL is the arcane tongue that allows you to channel that magic. In fact, it's easy to think of databases like a black box where you make sure your tables are indexed sensibly and your queries aren't doing anything silly, and the rest _just happens_.

But really, databases aren't _that_ complicated. I mean, they kind of are but if you dig inside the database engine a bit, you realise that it's really just some immensely powerful and clever abstractions and that, like most software, most of the actual complexity in these pieces of software comes from the edge cases, often around concurrency.

I'd like crack open the hard shell of database engines with some friendly introductions to those who are familiar with relational databases but don't know their inner machinations. I'm going to talk about PostgreSQL because that's what I'm most familiar with, and it's also the most popular database in use by developers according to the [Stack Overflow Developer Survey 2023](https://survey.stackoverflow.co/2023/#section-most-popular-technologies-databases) and [Stack Overflow Developer Survey 2024](https://survey.stackoverflow.co/2024/technology#1-databases).

To start things off, I'm going to discuss how Postgres actually stores data on disk. I mean, it's all just files, right?

## Ok, so what does a nice fresh Postgres install look like

Postgres stores all its data in a directory sensibly called `/var/lib/postgresql/data` [^1] . Let's spin up an empty Postgres installation with Docker and mount the data directory in a local folder so that we can see what's going on in there. (Feel free to follow along and explore the files for yourself!)

[^1]: Technically, the data directory is whatever you specify in environment variable `PGDATA` and it's possible to put some of the cluster config files elsewhere, but the only reason you'd be messing with any of that is if you were hosting multiple clusters on the same machine using different Postgres server instances, which is a more advanced use case than we're interesting in here.

```shell
docker run --rm -v ./pg-data:/var/lib/postgresql/data -e POSTGRES_PASSWORD=password postgres:16
```

You should see a bunch of text saying all kinds of interesting things like `selecting dynamic shared memory implementation ... posix` and `performing post-bootstrap initialization ... ok` and then eventually `LOG:  database system is ready to accept connections`. Now kill the server with ctrl-C so that we can have a look at what files have been created.

```console
$ ls -l pg-data
drwx------     -   base/
drwx------     -   global/
drwx------     -   pg_commit_ts/
drwx------     -   pg_dynshmem/
.rw-------@ 5.7k   pg_hba.conf
.rw-------@ 2.6k   pg_ident.conf
drwx------     -   pg_logical/
drwx------     -   pg_multixact/
drwx------     -   pg_notify/
drwx------     -   pg_replslot/
drwx------     -   pg_serial/
drwx------     -   pg_snapshots/
drwx------     -   pg_stat/
drwx------     -   pg_stat_tmp/
drwx------     -   pg_subtrans/
drwx------     -   pg_tblspc/
drwx------     -   pg_twophase/
.rw-------     3   PG_VERSION
drwx------     -   pg_wal/
drwx------     -   pg_xact/
.rw-------@   88   postgresql.auto.conf
.rw-------@  30k   postgresql.conf
.rw-------    36   postmaster.opts
```

There's a lot of folders here, but if you look, most of them are empty.

Before we dig into these, a quick terminology overview:

| Term                        | Meaning                                                                                                                                                                                                                                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database cluster            | The term 'cluster' is a bit overloaded here - we're using it the [same way that the Postgres docs use it](https://www.postgresql.org/docs/current/creating-cluster.html), meaning a single instance of a PostgreSQL server which is running multiple databases on the same machine (where each database is created with `create database mydbname`). |
| Database connection         | When a client connects to the Postgres server, it initiates a database connection. When this happens, Postgres creates a sub-process on the server.                                                                                                                                                                                                  |
| Database session            | Once the connection has been authenticated, the client has established a session, which it can then use to execute SQL.                                                                                                                                                                                                                              |
| Transaction a.k.a. tx, xact | SQL is executed within the session inside transactions, which are units of work which are executed, committed and succeed or fail as a single unit of work. If a transaction fails, it is rolled back and all the changes made in the transaction are undone.                                                                                        |
| Snapshot                    | Each transaction sees its own copy of the database, called its snapshot. If you have multiple sessions reading and writing the same data at the same time, they will in general not see the exact same data but will see different snapshots depending on the exact timing of the transactions. It's possible to synchronise and export snapshots.   |
| Schema                      | A database consists of multiple schemas (or _schemata_, if you're being pretentious), each of which is a logical namespace for tables, functions, triggers and every thing that databases store. The default schema is called `public` and if you don't specify a schema, it's the same as manually specifying `public`.                             |
| Table                       | A database consists of multiple tables, each of which represents a single unordered collection of items with a particular number of columns, each of a specific type.                                                                                                                                                                                |
| Tablespace                  | A tablespace is a physical separation (as opposed to schemas, which are a logical separation). We'll see more about tablespaces later.                                                                                                                                                                                                               |
| Row                         | A table consists of multiple unordered rows, each of which is a single collection of data points defining a specific _thing_.                                                                                                                                                                                                                        |
| Tuple                       | A tuple is very similar to a row, but a tuple is immutable. The state of a specific row at a specific time is a tuple, but a tuple is a more general term for a collection of data points. When you return data from a query, you can get tuples.                                                                                                    |

Now let's do a quick overview of what all these top-level files and folders are for. You don't need to worry about every single one of these – most of them cover more complicated use cases, which is why they're empty for us – but I still think it's interesting to know what each files and folder is for.

| Directory                 | Explanation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `  base/`                | Contains a subdirectory for each database. Inside each sub-directory are the files with the actual data in them. We'll dig into this more in a second.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `  global/`              | Directly contains files for cluster-wide tables like `pg_database`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `  pg_commit_ts/`        | As the name suggests, contains timestamps for transaction commits. We don't have any commits or transactions yet, so this is empty.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `  pg_dynshmem/`         | Postgres uses multiple processes (not multiple threads, although there has been [discussion around it](https://www.postgresql.org/message-id/31cc6df9-53fe-3cd9-af5b-ac0d801163f4%40iki.fi)) so in order to share memory between processes, Postgres has a dynamic shared memory subsystem. This can use [`shm_open`](https://man7.org/linux/man-pages/man3/shm_open.3.html), [`shmget`](https://man7.org/linux/man-pages/man2/shmget.2.html) or [`mmap`](https://man7.org/linux/man-pages/man2/mmap.2.html) on Linux – by default it uses `shm_open`. The shared memory object files are stored in this folder.                                                                                                                                                      |
| `  pg_hba.conf`          | This is the [Host-Based Authentication (HBA) file](https://www.postgresql.org/docs/current/auth-pg-hba-conf.html) which allows you to configure access to your cluster based on hostname. For instance, by default this file has `host all all 127.0.0.1/32 trust` which means "trust anyone connecting to any database without a password if they're conencting from localhost". If you've ever wondered why you don't need to put your password in when running `psql` on the same machine as the server, this is why.                                                                                                                                                                                                                                              |
| `  pg_ident.conf`        | This is a [user name mapping file](https://www.postgresql.org/docs/current/auth-username-maps.html) which isn't particularly interesting for our purposes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `  pg_logical/`          | Contains status data for logical decoding. We don't have time to talk about how the Write-Ahead Log (WAL) works, but in short, Postgres writes changes that it's going to make to the WAL, then if it crashes it can just re-read and re-run all the operations in the WAL to get back to the expected database state. This process of retrieving the expected database state from the WAL is called logical decoding and Postgres stores files related to this process in here.                                                                                                                                                                                                                                                                                      |
| `  pg_multixact/`        | "xact" is what the Postgres calls transactions so this contains status data for multitransactions. Multitransactions are a [thing that happens when you've got multiple sessions](https://www.highgo.ca/2020/06/12/transactions-in-postgresql-and-their-mechanism/) who are all trying to do a row-level lock on the same rows.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `  pg_notify/`           | In Postgres you can [listen for changes on a channel and notify listeners of changes](https://tapoueh.org/blog/2018/07/postgresql-listen-notify/). This is useful if you have an application that wants to action something whenever a particular event happens. For instance, if you have an application that wants to know every time a row is added or updated in a particular table so that it can synchronise with an external system. You can set up a trigger which notifies all the listeners whenever this change occurs. Your application can then listen for that notification and update the external data store however it wants to.                                                                                                                     |
| `  pg_replslot/`         | Replication is the mechanism by which databases can synchronise between multiple running server instances. For instance, if you have some really important data that you don't want to lose, you could set up a couple of replicas so that if your main database dies and you lose all your data, you can recover from one of the replicas. This can be physical replication (literally copying disk files) and logical replication (basically copying the WAL to all the replicas so that the main database can eb reconstructed from the replica's WAL via logical decoding.) This folder contains data for the various replication slots, which are a way of ensuring WAL entries are kept for particular replicas even when it's not needed by the main database. |
| `  pg_serial/`           | Contains information on committed serialisable transactions. Serialisable transactions are the highest level of strictness for transaction isolation, which you can read more about [in the docs](https://www.postgresql.org/docs/current/transaction-iso.html).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `  pg_snapshots/`        | Contains exported snapshots, used e.g. by `pg_dump` which can dump a database in parallel.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `  pg_stat/`             | Postgres calculates statistics for the various tables which it uses to inform sensible query plans and plan executions. For instance, if the query planner knows it needs to do a sequential scan across a table, it can look at approximately how many rows are in that table to determine how much memory should be allocated. This folder contains permanent statistics files calculated form the tables. Understanding statistics is really important to analysing and fixing poor query performance.                                                                                                                                                                                                                                                             |
| `  pg_stat_tmp/`         | Similar to `pg_stat/` apart from this folder contains temporary files relating to the statistics that Postgres keeps, not the permanent files.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `  pg_subtrans/`         | Subtransactions are another kind of transaction, like multitransactions. They're a way to split a single transaction into multiple smaller subtransactions, and this folder contains status data for them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `  pg_tblspc/`           | Contains symbolic references to the different tablespaces. A [tablespace](https://www.postgresql.org/docs/current/manage-ag-tablespaces.html) is a physical location which can be used to store some of the database objects, as configured by the DB administrator. For instance, if you have a really frequently used index, you could use a tablespace to put that index on a super speedy expensive solid state drive while the rest of the table sits on a cheaper, slower disk.                                                                                                                                                                                                                                                                                 |
| `  pg_twophase/`         | It's possible to ["prepare"](https://www.postgresql.org/docs/current/sql-prepare-transaction.html) transactions, which means that the transaction is dissociated from the current session and is stored on disk. This is useful for two-phase commits, where you want to commit changes to multiple systems at the same time and ensure that both transactions either fail and rollback or succeed and commit                                                                                                                                                                                                                                                                                                                                                         |
| `  PG_VERSION`           | This one's easy – it's got a single number in which is the major version of Postgres we're in, so in this case we'd expect this to have the number `16` in.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `  pg_wal/`              | This is where the Write-Ahead Log (WAL) files are stored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `  pg_xact/`             | Contains status data for transaction commits, i.e. metadata logs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `  postgresql.auto.conf` | This contains server configuration parameters, like `postgresql.conf`, but is automatically written to by `alter system` commands, which are SQL commands that you can run to dynamically modify server parameters.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `  postgresql.conf`      | This file contains all the possible server parameters you can configure for a Postgres instance. This goes all the way from `autovacuum_naptime` to `zero_damaged_pages`. If you want to understand all the possible Postgres server parameters and what they do in human language, I'd highly recommend checking out [postgresqlco.nf](https://postgresqlco.nf/)                                                                                                                                                                                                                                                                                                                                                                                                     |
| `  postmaster.opts`      | This simple file contains the full CLI command used to invoke Postgres the last time that it was run.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

There's also a file called `postmaster.pid` which you only see while the Postgres process is actively running, which contains information about the postmaster process ID, what port its listening on, what time it started, etc. We won't see that here because we stopped our Postgres server to examine the files.

So that was quite intense – don't worry if you didn't fully understand what all those things mean – it's all super interesting stuff but you don't need to follow most of that to understand what we're going to talk about, which is the actual database storage.

## Let's talk about database storage already

Okay, so we mentioned the `base/` directory above, which has a subdirectory for each individual database in your cluster. Let's take a look at what we've got here:

```console
$ ls -l pg-data/base
drwx------ -   1/
drwx------ -   4/
drwx------ -   5/
```

Wait, why are there already 3 folders in here? We haven't even created any databases yet.

The reason is that when you start up a fresh Postgres server, Postgres will automatically create 3 databases for you. They are:

- `postgres` – when you connect to a server, you need the name of a database to connect to, but you don't always know what the name is. This is also true of database management tools. While it's not strictly necessary, you can almost always rely on the `postgres` database existing – once you've connected to this empty, default database, you can list all the other databases on the server, create new databases, and so on.
- `template0`, `template1` – as the name suggests, these databases are templates used to create future databases.

Why are the subdirectories called numbers instead of names?

Well in Postgres, all the system tables for things like namespaces, roles, tables and functions use an Object IDentifier (OID) to identify them. In this case, `1`, `4` and `5` are the OIDs for `postgres`, `template0` and `template1`.

## Let's make our own database

These in-built tables don't have anything in them and are generally pretty boring, so let's create ourselves a new database and put them data in so that we can examine the data files themselves.

First, let's run and detach the Postgres container so that we can query it.

```shell
docker run -d --rm -v ./pg-data:/var/lib/postgresql/data -e POSTGRES_PASSWORD=password postgres:16
```

We could use anything as our play dataset, but I like geography so let's make a table with some countries in. Let's download some country data into our container and load it into a new database.

We can use a local tool like psql or TablePlus to examine the database, but we're going to just exec into the container and use psql from inside the container. This way, we don't have to worry about mapping ports or mismatching psql and Postgres server versions. (Also, it's easier for everyone to follow along at home.)

```shell
curl 'https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.csv' --output ./pg-data/countries.csv

pg_container_id=$(docker ps --filter expose=5432 --format "{{.ID}}")
docker exec -it $pg_container_id psql -U postgres
```

Here we're getting the container ID of the running Postgres container by filtering by containers which expose port 5432 as Postgres does and putting that into the `docker exec` command to give us an interactive psql shell. The `-U postgres` is because the default Postgres user in the official Docker image is `postgres`, not `root` which is the psql default.

If that works, you should see something like:

```console
psql (16.3 (Debian 16.3-1.pgdg120+1))
Type "help" for help.

postgres=#
```

Now let's create our new database and load the data in: [^2]

```sql
create database blogdb;
\c blogdb;

create table countries (
  id integer primary key generated always as identity,
  name text not null unique,
  alpha_2 char(2) not null,
  alpha_3 char(3) not null,
  numeric_3 char(3) not null,
  iso_3166_2 text not null,
  region text,
  sub_region text,
  intermediate_region text,
  region_code char(3),
  sub_region_code char(3),
  intermediate_region_code char(3)
);

copy countries (
  name,
  alpha_2,
  alpha_3,
  numeric_3,
  iso_3166_2,
  region,
  sub_region,
  intermediate_region,
  region_code,
  sub_region_code,
  intermediate_region_code
)
from '/var/lib/postgresql/data/countries.csv'
delimiter ',' csv header;

-- Check that the data got loaded into the table ok.
select * from countries limit 10;

-- Should say 249.
select count(*) from countries;
```

[^2]: You might be wondering why the numeric country code is stored as `char(3)` instead of `integer`. You could store it as an integer if you want, but – exactly like phone numbers – it doesn't make any sense to say "Austria ÷ Afghanistan = Antarctica" (even though numerically it's true) so what's the point in storing it as an integer? Really it's still a 3-character identifier, it's just restricting the available characters to 0-9 instead of a-z as with the alpha-2 and alpha-3 country codes.

Great, so we've got a table with 249 rows and a single index corresponding to our unique constraint on the `name` column.

## Show me the files

Let's take another look at our `base/` folder:

```console
$ ls -l pg-data/base
drwx------ -   1/
drwx------ -   4/
drwx------ -   5/
drwx------ -   16388/
```

In this case it's pretty obvious that our `blogdb` is `16388` but if you're working with loads of database on the same cluster, you might not know. If you're following along from home, it probably has a different value. If you want to find out, simply do:

```sql
postgres=# select oid, datname from pg_database;
  oid  |  datname
-------+-----------
     5 | postgres
 16388 | blogdb
     1 | template1
     4 | template0
(4 rows)
```

Let's have a peek at what's inside this folder:

```console
$ cd pg-data/base/16388
$ ls -l .
.rw------- 8.2k   112
.rw------- 8.2k   113
.rw------- 8.2k   174
.rw------- 8.2k   175
.rw------- 8.2k   548
.rw------- 8.2k   549
.rw-------    0   826
.rw------- 8.2k   827
.rw------- 8.2k   828
.rw------- 123k   1247
.rw-------  25k   1247_fsm
.rw------- 8.2k   1247_vm
.rw------- 475k   1249
.rw-------  25k   1249_fsm
...
.rw-------  25k   16390_fsm
.rw-------    0   16393
.rw------- 8.2k   16394
.rw-------  16k   16395
.rw-------  16k   16397
.rw-------  524   pg_filenode.map
.rw------- 160k   pg_internal.init
.rw-------    3   PG_VERSION
$ ls -l | wc -l
306
$ du -h .
7.6M    .
```

There's a surprising number of files in there considering we've only got 249 rows. So what's going on?

There are a few useful system catalogs that we can use to make sense of this:

```sql
-- First, let's get the OID of the 'public' namespace that our table lives in - you need
-- to run this in the 'blogdb' database, otherwise you'll get the OID of the 'public'
-- namespace for the database you're currently connected to.
blogdb=# select to_regnamespace('public')::oid;
 to_regnamespace
-----------------
            2200
(1 row)

-- Now let's list all the tables, indexes, etc. that live in this namespace.
blogdb=# select * from pg_class
blogdb=# where relnamespace = to_regnamespace('public')::oid;
  oid  |      relname       | relnamespace | reltype | reloftype | relowner | relam | relfilenode | reltablespace | relpages | reltuples | relallvisible | reltoastrelid | relhasindex | relisshared | relpersistence | relkind | relnatts | relchecks | relhasrules | relhastriggers | relhassubclass | relrowsecurity | relforcerowsecurity | relispopulated | relreplident | relispartition | relrewrite | relfrozenxid | relminmxid | relacl | reloptions | relpartbound
-------+--------------------+--------------+---------+-----------+----------+-------+-------------+---------------+----------+-----------+---------------+---------------+-------------+-------------+----------------+---------+----------+-----------+-------------+----------------+----------------+----------------+---------------------+----------------+--------------+----------------+------------+--------------+------------+--------+------------+--------------
 16389 | countries_id_seq   |         2200 |       0 |         0 |       10 |     0 |       16389 |             0 |        1 |         1 |             0 |             0 | f           | f           | p              | S       |        3 |         0 | f           | f              | f              | f              | f                   | t              | n            | f              |          0 |            0 |          0 |        |            |
 16390 | countries          |         2200 |   16392 |         0 |       10 |     2 |       16390 |             0 |        4 |       249 |             0 |         16393 | t           | f           | p              | r       |       12 |         0 | f           | f              | f              | f              | f                   | t              | d            | f              |          0 |          743 |          1 |        |            |
 16395 | countries_pkey     |         2200 |       0 |         0 |       10 |   403 |       16395 |             0 |        2 |       249 |             0 |             0 | f           | f           | p              | i       |        1 |         0 | f           | f              | f              | f              | f                   | t              | n            | f              |          0 |            0 |          0 |        |            |
 16397 | countries_name_key |         2200 |       0 |         0 |       10 |   403 |       16397 |             0 |        2 |       249 |             0 |             0 | f           | f           | p              | i       |        1 |         0 | f           | f              | f              | f              | f                   | t              | n            | f              |          0 |            0 |          0 |        |            |
(4 rows)
```

We can see here that we've only actually got 4 table-like objects – the rest of the files in this folder are boilerplate – if you look in the DB folders for `template0`, `template1` or `postgres` (i.e. `1/`, `2/`, or `5/`) you'll see that almost all of the files are exactly the same as our `blogdb` database.

So what are these `pg_class` objects and how do they relate to all these files?

Well we can see that `countries` is there with oid and relfilenode values of 16390 – that's our actual table. There's also `countries_pkey` with oid and relfilenode values of 16395 – that's the index for our primary key. There's `countries_name_key` with 16397 – the index for our name unique constraint – and finally `countries_id_seq` with 16389 – the sequence used to generate new ID values (we use `primary key generated always as identity`, which just like `serial` generates new values in a numerically increasing sequence).

The relfilenode here corresponds to the "filenode" of the object, which is the name of the file on disk. Let's start off with our `countries` table.

```console
$ ls -l 16390*
.rw-------@ 33k   16390
.rw-------@ 25k   16390_fsm
```

For a general object, you're likely to see three or more files: [^3]

- `{filenode}` – Postgres splits large objects into multiple files called segments, to avoid issues some operating systems have with large files (mostly historical, to be honest). By default these are 1 GB in size, although this is configurable. This is the first segment file.
- `{filenode}.1`, `{filenode}.2` – these are the subsequent segment files. We don't have > 1 GB of data yet so we don't have these.
- `{filenode}_fsm` – this is the [Free Space Map (FSM)](https://www.postgresql.org/docs/current/storage-fsm.html) file for the object, which contains a binary tree telling you how much free space is available in each page of the heap. Don't worry, we're going to explain exactly what the heap and pages are in a minute.
- `{filenode}_vm` – this is the [Visibility Map (VM)](https://www.postgresql.org/docs/current/storage-vm.html) file for the object, which tells you about the visibility of tuples in your pages. We'll go into this a bit more later as well.

[^3]: There's also a filed called `{filenode}_init` which is used to store initialisation information for unlogged tables, but you won't see these unless you're using unlogged tables.

## What's the heap?

All these segment data files together (excluding the FSM and VM) are called the *heap*.

Something really important about tables which isn't obvious at first is that, even though they might have sequential primary keys, tables are *not ordered*. (Hence why we need a separate sequence object to be able to produce the sequential ID values.) For this reason tables are sometimes called a "bag" of rows

## Next page please

Todo

Diagram

## What about indexes?

Todo

## Why would I ever need to know any of this?

There's a few reasons:

- It's interesting!
- It helps understand how Postgres queries your data on disk, how MVCC works and lots more that's really useful when you're trying to gain a deep understanding of how your database works for the purpose of fine-tuning performance.
- In certain rare circumstances, it can actually be quite useful for data recovery. For instance, say you have some unlogged table. (An unlogged table is done where changes aren't written to the WAL, which can be useful for performance reasons but means a database recovery via logical decoding the WAL will not include any of the unlogged table data.) Let's say that for some bizarre reason this unlogged table has vitally important data in – maybe you've been called in to help with disaster recovery for a company that doesn't know what they're doing and accidentally set the table to unlogged, then their server crashed. If you restart the server, Postgres will wipe clean the whole unlogged table because it will restore the database state from the WAL. However, if you copy out the raw database files, you can use the knowledge you have gained from this post to recover the contents of the data. (There's probably a tool that does this already, but if not you could write your own – that would be an interesting project...)
- It's a good conversation starter at parties. [^3]

[^3] It's not, please don't do this unless you don't want to be invited back to said parties.

## Further reading

- [Ketan Singh – How Postgres Stores Rows](https://ketansingh.me/posts/how-postgres-stores-rows/)
- [PostgreSQL Documentation – Chapter 73. Database Physical Storage](https://www.postgresql.org/docs/current/storage.html)
- [PostgreSQL Documentation – F.25. pageinspect — low-level inspection of database pages](https://www.postgresql.org/docs/current/pageinspect.html)
- [Advanced SQL (Summer 2020), U Tübingen – DB2 — Chapter 03 — Video #09 — Row storage in PostgreSQL, heap file page layout](https://www.youtube.com/watch?v=L-dw1yRFYVg)
- [15-445/645 Intro to Database Systems (Fall 2019), Carnegie Mellon University – 03 - Database Storage I](https://www.youtube.com/watch?v=1D81vXw2T_w)

## Future topics

Database engines is an endlessly interesting topic, and there's lots more I'd like to write about in this series. Some ideas are:

- How Postgres handles concurrency – MVCC is the real MVP
- How Postgres turns a SQL string into data – understanding the query planner (cf. https://xuanwo.io/2024/02-what-i-talk-about-when-i-talk-about-query-optimizer-part-1/, https://www.sqlite.org/whybytecode.html, https://www.sqlite.org/queryplanner-ng.html)
- How Postgres ensures data integrity – where's WAL

If you'd like me to write about one of these, leave a comment below 🙂
