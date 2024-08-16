---
title: How Postgres stores oversized values – let's raise a TOAST
description: Postgres internals part 2 – oversized values and TOASTable types
date: 2024-08-14
updated: 2024-08-14T15:14:00.000Z
tags:
  - postgres
  - databases
draft: true
socials: []
---

_This post is part 2 of a series on Postgres internals – for part 1, see [How Postgres stores data on disk – this one's a page turner](/blog/how-postgres-stores-data-on-disk)_.

Where we left off last time, we had a table stored as heap segments, with each segment containing a bunch of pages, each of size 8 KiB. This was working fantastically for our table of countries, but you might be wondering – if each page is 8 KiB in size and a single row can't span multiple pages, what happens if we've got a single value which is bigger than 8 KiB?

Let's find out.

## Recap

_**(If you've already followed through [part 1](/blog/how-postgres-stores-data-on-disk), feel free to [skip over this bit](http://localhost:4321/blog/how-postgres-stores-oversized-values/#lets-create-another-table).)**_

Last time we spin up a fresh Postgres instance and inserted a load of countries in from CSV. You can re-create this by running:

```bash
mkdir pg-data

curl 'https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.csv' \
    --output ./pg-data/countries.csv

docker run -d --rm -v ./pg-data:/var/lib/postgresql/data -e POSTGRES_PASSWORD=password postgres:16

pg_container_id=$(docker ps --filter expose=5432 --format "{{.ID}}")

docker exec $pg_container_id psql -U postgres -c 'create database blogdb; create extension pageinspect;'
docker exec $pg_container_id psql -U postgres blogdb -c "$(cat << 'EOF'
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
  with csv header;
EOF)"
```

From this we explained how Postgres stores tables in separate 1 GiB files called segments, with each segment consisting of a series of pages of 8 KiB each. Each page has a number of tuples within it which represents a snapshot view of a row at a particular time. Updating or deleting a row does not remove the tuple but instead creates a new tuple at the end of the last page. The old or "dead" tuple is only cleared out once Postgres runs a vacuum.

The filename of the first segment is stored in `base/{database oid}/{filenode}` where OID = Object IDentifier and filenode is an integer that starts off equal to table OID but diverges over time as the database runs vacuums and other operations. You can find your database's OID and table's filenode by running:

```sql
-- Database object ID
select oid from pg_database where datname = 'blogdb';

-- Table filenode
select relfilenode from pg_class where relname = 'countries';
```

Within each row there is a secret column not returned from `select *` called `ctid` that refers to the tuple's physical location on disk. It looks like `(page index, tuple index within page)`, e.g. `(3, 7)` refers to tuple #7 within page #3. You can return this secret column by simply doing `select ctid, *` instead of `select *`.

You can use the built-in [`pageinspect`](https://www.postgresql.org/docs/current/pageinspect.html) extension to examine page headers and their raw data using `page_header()` and `heap_page_items()` functions alongside `get_raw_page()`.

## Let's create another table

Last time we made a table of countries from the ISO 3611-1 spec. Let's say now that we want to add some of the greatest creative works that these countries have to offer (that also happen to have their copyright expired).

To prepare for this, we'll create a new table for these culturally important creative works.

If you didn't go through the recap steps above, make sure your database is running:

```shell
docker run -d --rm -v ./pg-data:/var/lib/postgresql/data -e POSTGRES_PASSWORD=password postgres:16
pg_container_id=$(docker ps --filter expose=5432 --format "{{.ID}}")
```

**Reminder:** To open an interactive psql session, run:

```shell
docker exec -it $pg_container_id psql -U postgres blogdb
```

Here's our table schema:

```sql
create table creative_works (
  id integer primary key generated always as identity,
  title text,
  authors jsonb,
  -- In real life this would probably be a many-to-many relationship instead of
  -- one-to-many, just take a look at:
  -- https://en.wikipedia.org/wiki/Wikipedia:Lamest_edit_wars/Ethnic_feuds#People
  country_id integer references countries (id),
  content text
);
```

I've prepared three poems of varying length and formatted it as CSV so that you can quickly load it into your database:

```shell
curl 'https://drew.silcock.dev/data/poems.csv' --output ./pg-data/poems.csv
```

Next let's copy the CSV into our new table – we'll use a temporary table to resolve the country code to country ID.

```sql
begin;

create temporary table creative_works_temp (
  title text,
  authors jsonb,
  country_code char(2),
  content text
) on commit drop;

copy creative_works_temp (title, authors, country_code, content)
from '/var/lib/postgresql/data/poems.csv'
with csv header;

insert into creative_works
select cw.title, cw.authors, c.id, cw.content
from creative_works_temp cw
left join countries c on c.alpha_2 = cw.country_code;

end;
```

Just like before, we're going to use the `pageinspect` functions to explore what the raw data looks like[^eliot-nationality]:

[^eliot-nationality]: T. S. Eliot was born an American but later renounced his American citizenship to become a naturalised British citizen. The Waste Land was written in 1922 after his move to England but before his transition from American to British citizen, so I've put "US" down for country – don't @ me.

```sql
blogdb=# select id, title, authors, country_id, length(content) from creative_works;
 id |        title         |                                       authors                                       | country_id | length
----+----------------------+-------------------------------------------------------------------------------------+------------+--------
 12 | Ozymandias           | [{"name": "Percy Bysshe Shelley", "birth_year": 1792, "death_year": 1822}]          |        235 |    631
 13 | Ode on a Grecian Urn | [{"name": "Keats, John", "birth_year": 1795, "death_year": 1821}]                   |        235 |   2442
 14 | The Waste Land       | [{"name": "Eliot, T. S. (Thomas Stearns)", "birth_year": 1888, "death_year": 1965}] |        236 |  19950
(3 rows)

blogdb=# select lp, lp_off, lp_flags, lp_len, t_xmin, t_xmax, t_field3, t_ctid, t_infomask2, t_infomask, t_hoff, t_bits, t_oid, length(t_data)
blogdb-# from heap_page_items(get_raw_page('creative_works', 0));
 lp | lp_off | lp_flags | lp_len | t_xmin | t_xmax | t_field3 | t_ctid | t_infomask2 | t_infomask | t_hoff | t_bits | t_oid | length
----+--------+----------+--------+--------+--------+----------+--------+-------------+------------+--------+--------+-------+--------
  1 |   7408 |        1 |    781 |   1074 |      0 |        8 | (0,1)  |           5 |       2818 |     24 |        |       |    757
  2 |   5536 |        1 |   1868 |   1074 |      0 |        8 | (0,2)  |           5 |       2818 |     24 |        |       |   1844
  3 |   5360 |        1 |    174 |   1074 |      0 |        8 | (0,3)  |           5 |       2822 |     24 |        |       |    150
(3 rows)
```

We can see that we have added three classic poems to our table of increasing length:

- [Ozymandias](https://en.wikipedia.org/wiki/Ozymandias) by [Percy Bysshe Shelley](https://en.wikipedia.org/wiki/Percy_Bysshe_Shelley) – a short but intense exploration of the futility of hubris and how time washes away even the greatest of empires. Clocking in at 631 characters, this is the shortest poem of the lot. The size of the whole row is 757 bytes which makes sense – 631 for the actual poem and 126 for the title, authors and country ID[^ozymandias].
- [Ode on a Grecian Urn](https://en.wikipedia.org/wiki/Ode_on_a_Grecian_Urn) by [John Keats](https://en.wikipedia.org/wiki/John_Keats) – a slightly longer 1,819 character ode praising an ancient Greek urn and the scenes depicted on it. This poem is 2,442 bytes long, and yet the whole row is only 1,844 bytes 🤔
- [The Waste Land](https://en.wikipedia.org/wiki/The_Waste_Land) by [T. S. Eliot](https://en.wikipedia.org/wiki/T._S._Eliot) – the 434 lines of this 1922 poem are split between 5 sections and flows between different styles, times, places, narrators and themes. This is by far the longest at 19,950 characters yet the tuple in the heap table is only 150 bytes!

[^ozymandias]: Fun fact: Ozymandias was written as a playful challenge between Shelley and his friend [Horace Smith](<https://en.wikipedia.org/wiki/Horace_Smith_(poet)>), who tasked each other with having a sonnet published in _The Examiner_ under pen names with the title of and under the topic of Ozymandias, the Greek name for the pharaoh Ramesses II. They both managed to get their sonnets published but Shelley's version is now one of the most popular and impactful poems in the English language, so think we can say that Shelley won the competition.

## Show me the data

We can figure out what's going on by looking at the raw data for each row. Let's write a little helper Bash function for this:

```shell
function print-row-data {
  query="with cw as (
    select ctid
    from creative_works where title = '$1'
  )
  select t_data
  from heap_page_items(
    get_raw_page(
      'creative_works',
      (select (ctid::text::point)[0]::bigint from cw)
    )
  )
  where t_ctid = (select ctid from cw)"
  row_data=$(docker exec $pg_container_id psql -U postgres blogdb --tuples-only -c "$query" | cut -c4-)
  # You can replace `hexyl` for `xxd` if you don't have hexyl installed.
  echo $row_data | xxd -r -p | hexyl
}
```

Let's start with Ozymandias:

```shell
$ print-row-data 'Ozymandias'
┌────────┬─────────────────────────┬─────────────────────────┬────────┬────────┐
│00000000│ 01 00 00 00 17 4f 7a 79 ┊ 6d 61 6e 64 69 61 73 c3 │•⋄⋄⋄•Ozy┊mandias×│
│00000010│ 01 00 00 40 58 00 00 d0 ┊ 03 00 00 20 04 00 00 80 │•⋄⋄@X⋄⋄×┊•⋄⋄ •⋄⋄×│
│00000020│ 0a 00 00 00 0a 00 00 00 ┊ 14 00 00 00 08 00 00 10 │_⋄⋄⋄_⋄⋄⋄┊•⋄⋄⋄•⋄⋄•│
│00000030│ 08 00 00 10 6e 61 6d 65 ┊ 62 69 72 74 68 5f 79 65 │•⋄⋄•name┊birth_ye│
│00000040│ 61 72 64 65 61 74 68 5f ┊ 79 65 61 72 50 65 72 63 │ardeath_┊yearPerc│
│00000050│ 79 20 42 79 73 73 68 65 ┊ 20 53 68 65 6c 6c 65 79 │y Bysshe┊ Shelley│
│00000060│ 20 00 00 00 00 80 00 07 ┊ 20 00 00 00 00 80 1e 07 │ ⋄⋄⋄⋄×⋄•┊ ⋄⋄⋄⋄×••│
│00000070│ eb 00 00 00 04 0a 00 00 ┊ 49 20 6d 65 74 20 61 20 │×⋄⋄⋄•_⋄⋄┊I met a │
│00000080│ 74 72 61 76 65 6c 6c 65 ┊ 72 20 66 72 6f 6d 20 61 │travelle┊r from a│
│00000090│ 6e 20 61 6e 74 69 71 75 ┊ 65 20 6c 61 6e 64 2c 0a │n antiqu┊e land,_│
│000000a0│ 57 68 6f 20 73 61 69 64 ┊ e2 80 94 e2 80 9c 54 77 │Who said┊××××××Tw│
│000000b0│ 6f 20 76 61 73 74 20 61 ┊ 6e 64 20 74 72 75 6e 6b │o vast a┊nd trunk│
│000000c0│ 6c 65 73 73 20 6c 65 67 ┊ 73 20 6f 66 20 73 74 6f │less leg┊s of sto│
│000000d0│ 6e 65 0a 53 74 61 6e 64 ┊ 20 69 6e 20 74 68 65 20 │ne_Stand┊ in the │
│000000e0│ 64 65 73 65 72 74 2e 20 ┊ 2e 20 2e 20 2e 20 4e 65 │desert. ┊. . . Ne│
│000000f0│ 61 72 20 74 68 65 6d 2c ┊ 20 6f 6e 20 74 68 65 20 │ar them,┊ on the │
│00000100│ 73 61 6e 64 2c 0a 48 61 ┊ 6c 66 20 73 75 6e 6b 20 │sand,_Ha┊lf sunk │
│00000110│ 61 20 73 68 61 74 74 65 ┊ 72 65 64 20 76 69 73 61 │a shatte┊red visa│
│00000120│ 67 65 20 6c 69 65 73 2c ┊ 20 77 68 6f 73 65 20 66 │ge lies,┊ whose f│
│00000130│ 72 6f 77 6e 2c 0a 41 6e ┊ 64 20 77 72 69 6e 6b 6c │rown,_An┊d wrinkl│
│00000140│ 65 64 20 6c 69 70 2c 20 ┊ 61 6e 64 20 73 6e 65 65 │ed lip, ┊and snee│
│00000150│ 72 20 6f 66 20 63 6f 6c ┊ 64 20 63 6f 6d 6d 61 6e │r of col┊d comman│
│00000160│ 64 2c 0a 54 65 6c 6c 20 ┊ 74 68 61 74 20 69 74 73 │d,_Tell ┊that its│
│00000170│ 20 73 63 75 6c 70 74 6f ┊ 72 20 77 65 6c 6c 20 74 │ sculpto┊r well t│
│00000180│ 68 6f 73 65 20 70 61 73 ┊ 73 69 6f 6e 73 20 72 65 │hose pas┊sions re│
│00000190│ 61 64 0a 57 68 69 63 68 ┊ 20 79 65 74 20 73 75 72 │ad_Which┊ yet sur│
│000001a0│ 76 69 76 65 2c 20 73 74 ┊ 61 6d 70 65 64 20 6f 6e │vive, st┊amped on│
│000001b0│ 20 74 68 65 73 65 20 6c ┊ 69 66 65 6c 65 73 73 20 │ these l┊ifeless │
│000001c0│ 74 68 69 6e 67 73 2c 0a ┊ 54 68 65 20 68 61 6e 64 │things,_┊The hand│
│000001d0│ 20 74 68 61 74 20 6d 6f ┊ 63 6b 65 64 20 74 68 65 │ that mo┊cked the│
│000001e0│ 6d 2c 20 61 6e 64 20 74 ┊ 68 65 20 68 65 61 72 74 │m, and t┊he heart│
│000001f0│ 20 74 68 61 74 20 66 65 ┊ 64 3b 0a 41 6e 64 20 6f │ that fe┊d;_And o│
│00000200│ 6e 20 74 68 65 20 70 65 ┊ 64 65 73 74 61 6c 2c 20 │n the pe┊destal, │
│00000210│ 74 68 65 73 65 20 77 6f ┊ 72 64 73 20 61 70 70 65 │these wo┊rds appe│
│00000220│ 61 72 3a 0a 4d 79 20 6e ┊ 61 6d 65 20 69 73 20 4f │ar:_My n┊ame is O│
│00000230│ 7a 79 6d 61 6e 64 69 61 ┊ 73 2c 20 4b 69 6e 67 20 │zymandia┊s, King │
│00000240│ 6f 66 20 4b 69 6e 67 73 ┊ 3b 0a 4c 6f 6f 6b 20 6f │of Kings┊;_Look o│
│00000250│ 6e 20 6d 79 20 57 6f 72 ┊ 6b 73 2c 20 79 65 20 4d │n my Wor┊ks, ye M│
│00000260│ 69 67 68 74 79 2c 20 61 ┊ 6e 64 20 64 65 73 70 61 │ighty, a┊nd despa│
│00000270│ 69 72 21 0a 4e 6f 74 68 ┊ 69 6e 67 20 62 65 73 69 │ir!_Noth┊ing besi│
│00000280│ 64 65 20 72 65 6d 61 69 ┊ 6e 73 2e 20 52 6f 75 6e │de remai┊ns. Roun│
│00000290│ 64 20 74 68 65 20 64 65 ┊ 63 61 79 0a 4f 66 20 74 │d the de┊cay_Of t│
│000002a0│ 68 61 74 20 63 6f 6c 6f ┊ 73 73 61 6c 20 57 72 65 │hat colo┊ssal Wre│
│000002b0│ 63 6b 2c 20 62 6f 75 6e ┊ 64 6c 65 73 73 20 61 6e │ck, boun┊dless an│
│000002c0│ 64 20 62 61 72 65 0a 54 ┊ 68 65 20 6c 6f 6e 65 20 │d bare_T┊he lone │
│000002d0│ 61 6e 64 20 6c 65 76 65 ┊ 6c 20 73 61 6e 64 73 20 │and leve┊l sands │
│000002e0│ 73 74 72 65 74 63 68 20 ┊ 66 61 72 20 61 77 61 79 │stretch ┊far away│
│000002f0│ 2e e2 80 9d 0a          ┊                         │.×××_   ┊        │
└────────┴─────────────────────────┴─────────────────────────┴────────┴────────┘
```

We can see here the first 4 bytes are the ID, then the title, then a bunch of bytes for the jsonb blob containing the authors (Postgres does not store jsonb values as plain strings but that's a story for another post), then we can see `eb 00 00 00` – this is the country ID (in my database, the UK has ID 235 = 0xeb) – then we have the 4 bytes `04 0a 00 00` and finally the poem itself, in full. We mentioned those pesky 4 bytes in the last blog post that holds the varlena metadata – we're going to talk about them again a little bit later on in this post.

Let's take a look at Keats:

```shell
$ print-row-data 'Ode on a Grecian Urn' | head -n 30
┌────────┬─────────────────────────┬─────────────────────────┬────────┬────────┐
│00000000│ 02 00 00 00 2b 4f 64 65 ┊ 20 6f 6e 20 61 20 47 72 │•⋄⋄⋄+Ode┊ on a Gr│
│00000010│ 65 63 69 61 6e 20 55 72 ┊ 6e b3 01 00 00 40 50 00 │ecian Ur┊n×•⋄⋄@P⋄│
│00000020│ 00 d0 03 00 00 20 04 00 ┊ 00 80 0a 00 00 00 0a 00 │⋄×•⋄⋄ •⋄┊⋄×_⋄⋄⋄_⋄│
│00000030│ 00 00 0b 00 00 00 09 00 ┊ 00 10 08 00 00 10 6e 61 │⋄⋄•⋄⋄⋄_⋄┊⋄••⋄⋄•na│
│00000040│ 6d 65 62 69 72 74 68 5f ┊ 79 65 61 72 64 65 61 74 │mebirth_┊yeardeat│
│00000050│ 68 5f 79 65 61 72 4b 65 ┊ 61 74 73 2c 20 4a 6f 68 │h_yearKe┊ats, Joh│
│00000060│ 6e 00 20 00 00 00 00 80 ┊ 03 07 20 00 00 00 00 80 │n⋄ ⋄⋄⋄⋄×┊•• ⋄⋄⋄⋄×│
│00000070│ 1d 07 00 00 eb 00 00 00 ┊ f2 1a 00 00 8c 09 00 00 │••⋄⋄×⋄⋄⋄┊×•⋄⋄×_⋄⋄│
│00000080│ 00 54 68 6f 75 20 73 74 ┊ 69 00 6c 6c 20 75 6e 72 │⋄Thou st┊i⋄ll unr│
│00000090│ 61 76 00 69 73 68 27 64 ┊ 20 62 72 00 69 64 65 20 │av⋄ish'd┊ br⋄ide │
│000000a0│ 6f 66 20 71 00 75 69 65 ┊ 74 6e 65 73 73 18 2c 0a │of q⋄uie┊tness•,_│
│000000b0│ 20 03 01 02 31 66 6f 73 ┊ 00 74 65 72 2d 63 68 69 │ •••1fos┊⋄ter-chi│
│000000c0│ 6c 02 64 01 27 73 69 6c ┊ 65 6e 63 00 65 20 61 6e │l•d•'sil┊enc⋄e an│
│000000d0│ 64 20 73 6c 00 6f 77 20 ┊ 74 69 6d 65 2c 00 0a 53 │d sl⋄ow ┊time,⋄_S│
│000000e0│ 79 6c 76 61 6e 20 00 68 ┊ 69 73 74 6f 72 69 61 00 │ylvan ⋄h┊istoria⋄│
│000000f0│ 6e 2c 20 77 68 6f 20 63 ┊ 00 61 6e 73 74 20 74 68 │n, who c┊⋄anst th│
│00000100│ 75 00 73 20 65 78 70 72 ┊ 65 73 02 73 05 5c 41 20 │u⋄s expr┊es•s•\A │
│00000110│ 66 6c 6f 77 00 65 72 79 ┊ 20 74 61 6c 65 00 20 6d │flow⋄ery┊ tale⋄ m│
│00000120│ 6f 72 65 20 73 77 00 65 ┊ 65 74 6c 79 20 74 68 00 │ore sw⋄e┊etly th⋄│
│00000130│ 61 6e 20 6f 75 72 20 72 ┊ 00 68 79 6d 65 3a 0a 57 │an our r┊⋄hyme:_W│
│00000140│ 68 00 61 74 20 6c 65 61 ┊ 66 2d 00 66 72 69 6e 67 │h⋄at lea┊f-⋄fring│
│00000150│ 27 64 20 00 6c 65 67 65 ┊ 6e 64 20 68 00 61 75 6e │'d ⋄lege┊nd h⋄aun│
│00000160│ 74 73 20 61 62 04 6f 75 ┊ 01 66 79 20 73 68 61 04 │ts ab•ou┊•fy sha•│
│00000170│ 70 65 05 63 4f 66 20 64 ┊ 65 00 69 74 69 65 73 20 │pe•cOf d┊e⋄ities │
│00000180│ 6f 72 41 01 62 74 61 6c ┊ 73 2c 01 0c 6f c0 66 20 │orA•btal┊s,•_o×f │
│00000190│ 62 6f 74 68 06 e9 05 01 ┊ 00 49 6e 20 54 65 6d 70 │both•×••┊⋄In Temp│
│000001a0│ 65 01 01 24 74 68 65 20 ┊ 64 61 6c 01 01 3d 66 20 │e••$the ┊dal••=f │
│000001b0│ 41 72 63 61 64 8c 79 3f ┊ 05 30 02 91 6d 65 6e 01 │Arcad×y?┊•0•×men•│
│000001c0│ 28 00 67 6f 64 73 20 61 ┊ 72 65 11 01 31 73 65 3f │(⋄gods a┊re••1se?│
```

I've cut it off at 30 lines because we don't really need to see the whole thing. Again, we see `02 00 00 00` for the row ID, the title as a plain string followed by the jsonb blob then the country ID – again `eb 00 00 00` – next we have the 4-byte varlena metadata `2f 1a 00 00` before we get into the data.

You'll notice that the data looks a little bit different this time – it starts off looking normal but over time more and more of the text turns into gibberish! This is because Postgres has decided that the string is sufficiently long that it needs compressing to fit it into the page. What you're looking at here is the compressed version of the poem. Compression is a fascinating topic which I could do a whole blog series on in itself. Without going into too much detail, Postgres uses the [`pglz`](https://doxygen.postgresql.org/pg__lzcompress_8c_source.html) compression algorithm which is an implementation of the [LZ compression algorithm](https://en.wikipedia.org/wiki/LZ77_and_LZ78). This uses a simple history table to refer back to previously seen values instead of repeating them. For instance, the poem starts `Thou still...` on the first line and `Thou foster-child...` on the second line, but you can see that the second `Thou ` has been replaced with `03 01 02 31` which encodes the previously seen instance of `Thou `, thereby saving 1 byte. (Okay, not that impressive in this case, but it obviously reduces space over the course of the whole poem a lot!)

This explains why the row was only 1,844 bytes long when the poem itself is 2,442 characters.

Finally, let's look at The Waste Land:

```shell
$ print-row-data 'The Waste Land'
┌────────┬─────────────────────────┬─────────────────────────┬────────┬────────┐
│00000000│ 03 00 00 00 1f 54 68 65 ┊ 20 57 61 73 74 65 20 4c │•⋄⋄⋄•The┊ Waste L│
│00000010│ 61 6e 64 db 01 00 00 40 ┊ 64 00 00 d0 03 00 00 20 │and×•⋄⋄@┊d⋄⋄×•⋄⋄ │
│00000020│ 04 00 00 80 0a 00 00 00 ┊ 0a 00 00 00 1d 00 00 00 │•⋄⋄×_⋄⋄⋄┊_⋄⋄⋄•⋄⋄⋄│
│00000030│ 0b 00 00 10 08 00 00 10 ┊ 6e 61 6d 65 62 69 72 74 │•⋄⋄••⋄⋄•┊namebirt│
│00000040│ 68 5f 79 65 61 72 64 65 ┊ 61 74 68 5f 79 65 61 72 │h_yearde┊ath_year│
│00000050│ 45 6c 69 6f 74 2c 20 54 ┊ 2e 20 53 2e 20 28 54 68 │Eliot, T┊. S. (Th│
│00000060│ 6f 6d 61 73 20 53 74 65 ┊ 61 72 6e 73 29 00 00 00 │omas Ste┊arns)⋄⋄⋄│
│00000070│ 20 00 00 00 00 80 60 07 ┊ 20 00 00 00 00 80 ad 07 │ ⋄⋄⋄⋄×`•┊ ⋄⋄⋄⋄××•│
│00000080│ ec 00 00 00 01 12 ed 4e ┊ 00 00 24 2d 00 00 ff 66 │×⋄⋄⋄••×N┊⋄⋄$-⋄⋄×f│
│00000090│ 00 00 d5 61 00 00       ┊                         │⋄⋄×a⋄⋄  ┊        │
└────────┴─────────────────────────┴─────────────────────────┴────────┴────────┘
```

This row is puny by comparison. It's got the usual ID, title, authors and country ID (this time `ec 00 00 00` = 236 = USA), then `01 12 ed 4e` for the varlena metadata, but then instead of the poem it's just got 14 bytes of gibbberish – where's it gone‽

## Let's talk about TOAST

I've managed to go all the main thus far without actually explaining what anything has got to do with TOAST or even what TOAST is, but now I can't avoid it.

**TOAST** = **T**he **O**versized-**A**ttribute **S**torage **T**echnique
