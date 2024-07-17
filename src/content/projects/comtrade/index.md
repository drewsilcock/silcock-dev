---
title: "Comtrade"
description: "Parser for COMTRADE signal file format written in pure Rust."
date: "2024-07-15"
repoURL: "https://github.com/drewsilcock/comtrade"
packageURL: "https://crates.io/crates/comtrade"
---

## About

This is a pure Rust parser for the COMTRADE signal file format. I wrote it a couple of years ago and management to get it working to a point where it has more functionality than most other parsers I've seen.

For the uninitiated, "comtrade" can mean 3 possible things:

- A UN-maintained database of global trading data.
- Your communist friend needs to work on his spelling.
- A file format for signals from electrical power systems that is maintained by the IEEE.

This parser concerns the latter, namely the [**Com**mon format for **Tra**nsient **D**ata **E**xchange for power systems](https://en.wikipedia.org/wiki/Comtrade). I'm gonna be honest, given the naming conflict and the poor quality of the acronym, I think it's probably one of the worst technical acronym's I've come across. (Let me know if you've got a worse one! I love to see them.)

COMTRADE files typically contains several channels which can be either analog or digital. Digital channels are typically used for things like statuses (e.g. breaker status) while analog channels are used for things like voltage, current, power, etc. For typical 3-phase systems, there will be at least one channel per phase.

If you're interested about how to write a file format parser in Rust, take a look at [`src/parser.rust`](https://github.com/drewsilcock/comtrade/blob/main/src/parser.rs) - it's a very simple parser that's mostly just based on regexp matching, there's no fancy parsing libraries used.

## COMTRADE file format specs

There are actually 3 different versions of the spec: [IEEE C37.111-1991](https://standards.ieee.org/ieee/C37.111/2644/), [IEEE C37.111-1999](https://standards.ieee.org/ieee/C37.111/2645/) and [IEEE C37.111-2013](https://standards.ieee.org/ieee/C37.111/3795/).

The newer versions of the spec include additional useful functionality including things like different encoding mechanisms, combining multiple files into one, and more.

## Motivation

COMTRADE is a fairly niche file format, andd there's very few parsers available for it. The main one that everyone seems to use is the Python "comtrade" library (See [PyPI package](https://pypi.org/project/comtrade/) and [GitHub repo](https://github.com/dparrini/python-comtrade)). This library has pretty good support for the various COMTRADE spec features, although last time I used it I had a few issues with it using 32-bit floats and ints for all values when I needed 64-bit floating point precision - I put up [a PR for implementing this](https://github.com/dparrini/python-comtrade/pull/33) which has since been merged, so this isn't a problem anymore.

Mainly, I'd spent so much time understanding the minutiae of the COMTRADE spec for a project that I was working on at work that I thought it'd be fun to try to write a functioning parser, and I like writing Rust code, so I thought I'd give it a go.

The COMTRADE file format is really very simple - for the most part, it's just a matter of knowing what values come after what other values, and what specific format they are stored in. There's a few places which are slightly more difficult where you have to read one parameter before you can understand how many rows to expect in another part of the file, but on the whole it's super simple. You certainly don't need any of these proper parsing tools that people use for parsing programming languages, like [GNU Bison](https://www.gnu.org/software/bison/).

## Crate

This project is deployed on crates.io, check it out here: https://crates.io/crates/comtrade. Apparently it has 573 downloads at the time of writing, although they're probably all bots.

To install comtrade to use in your project:

```bash
cargo add comtrade
```

## Current status

This project is in a working state and can be used, but it's not been battle tested so there are bound to be a few bugs and areas for usability improvements. It's got a few tests, but not as many as I'd like.
