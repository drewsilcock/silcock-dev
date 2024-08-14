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

## Let's create another table

Last time we made a table full of all of the ISO 3166 codes

<a href="https://commons.wikimedia.org/wiki/User:Pbuergler">Pbuergler</a>, <a href="https://commons.wikimedia.org/wiki/File:Ramses_II_British_Museum.jpg">Ramses II British Museum</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0/legalcode" rel="license">CC BY-SA 3.0</a>
