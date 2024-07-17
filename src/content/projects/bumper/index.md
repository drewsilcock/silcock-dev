---
title: "Bumper"
description: "Another version bumper, but this one is mine."
date: "2024-07-15"
tags:
  - go
  - git
repoURL: "https://github.com/drewsilcock/bumper"
---

## About

Bumper is a version bumper that I wrote because I was fed up of having to manually update the versions and do all the commits and branches and tags and everything. None of the other version bumpers (of which there are many) do exactly what I wanted, so I wrote my own.

## Assumptions

Bumper is really useful if you are following certain key assumptions:

- You are using git flow.
- You use `main` and `dev` as the primary and development branches (although this could be easily changed).
- You do deployments by tagging on `main`.
- You use GitLab / GitHub for creating releases.
- You use a standard format for changelogs that matches the same that I use.

## Usage

Install with `git install github.com/drewsilcock/bumper@latest`, cd into your project directory and just run `bumper` (presuming GOBIN is in your PATH).

It'll prompt you for anything it needs and will handle the rest.

**Note:** Bumper will fail if you do not match the specific criteria that I've outlined above and additional requirements (like ensuring you have no local uncommitted changes). There is currently no "rolling-back" feature, so if it fails mid-way through you have to manually discard any changes and reset the branch.
