---
title: QuEST Rust Wrapper
description: Rust wrapper around the Quantum Exact Simulation Toolkit (QuEST).
date: 2024-07-15T00:00:00.000Z
tags:
  - rust
  - quantum-computing
repoURL: "https://github.com/drewsilcock/quest-rs"
packageURL: "https://crates.io/crates/quest-rs"
---

## About

QuEST (Quantum Exact Simulation Toolkit) is a C library for doing exact simulations of quantum circuits.
more information about QuEST, check out [their repository](https://github.com/QuEST-Kit/QuEST) and [their website](https://quest.qtechtheory.org/).

This QuEST-rs project is a Rust wrapper around the QuEST library, allowing you to use QuEST in your Rust projects. There's also a template you can use to start up a new Rust project using the QuEST library.

## Using the library

The library is up on crates.io so all you need to do is:

```shell
cargo add quest-rs
```

## Current status

It was a fully implemented wrapper around the original library back when I wrote it, but that was like 4 years ago and I've not updated it since then, so there's probably a bit of work that would need to be done to update it to the latest version.

Still, if you want to see how to wrap up C/C++ libraries in Rust or have an interest in quantum computing, have a look.

**[Check out the repository here](https://github.com/drewsilcock/quest-rs)**
