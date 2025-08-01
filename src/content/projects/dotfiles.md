---
title: "Dotfiles"
description: "Drew's terminal setup dotfiles."
date: "2024-07-15"
repoURL: "https://github.com/drewsilcock/dotfiles"
tags:
  - terminal
  - setup
---

I've had a few people enquire after my terminal setup, so I put my dotfiles up on GitHub so that anyone else can quickly spin it up and use it.

It includes configurations for things like neovim and tmux as well as automatically installing a bunch of CLI tools I can't live without, like [ripgrep](https://github.com/BurntSushi/ripgrep), [bat](https://github.com/sharkdp/bat), [eza](https://eza.rocks/) and [delta](https://github.com/dandavison/delta), among many others.

It's also got a big list in the README of all the tools I like to install on a fresh machine - you might find something you've not heard of or used before, so it's worth a look!

## My go-to tools

Here are some of my absolute go-to day-to-day tools:

### For writing code

When I'm working in the terminal, I use [neovim](https://neovim.io/) with the [NvChad](https://nvchad.com/) setup. This comes pre-bundled with everything you could need to package managers and LSP installers, so check out the [NvChad docs](https://nvchad.com/docs/config/walkthrough) to see how to set it up.

When I'm writing code on my local machine, I use [VSCode](https://code.visualstudio.com/) with the [Catppuccin](https://github.com/catppuccin/vscode) theme.

### For writing Go code

Although I use VSCode for most code editing, I really like [Goland from IntelliJ](https://www.jetbrains.com/go/) - the code completion and debugging tools are excellent.

### For making notes

I use [Obsidian](https://obsidian.md/) for all my note-taking and knowledge management. People rave about the graph-linking capabilities, but I pretty much just use it to splurge out some thoughts and ideas in meetings. I really like how there's just a "today's notes" button so that I don't have to think about what to call each note.

### For version control management

Obviously, I use git for version control, but I also use [Sublime Merge](https://www.sublimemerge.com/) as a git GUI. I really like the graph view and find it just much easier to perform common actions like creating branches, merging branches, rebasing, etc. There is a small charge for the full version with the dark mode but it's very much worth it IMO.

### Application launcher

I used [Alfred](https://www.alfredapp.com/) for a long, but I've long since moved onto the [Raycast](https://www.raycast.com/) gravy train and the gravy is sweet.

### Window management

I use [Rectangle](https://rectangleapp.com/) for window management - it's free and does everything I need it to do.

### Terminal

I tried out a few different terminals and I really like the configuration from [Alacritty](https://alacritty.org/), but I just end up using [iTerm2](https://iterm2.com/).

### Menu bar calendar

It's a really minor thing, but I find [Itsycal](https://www.mowglii.com/itsycal/) to be a really nice little calendar app that sits in the menu bar. I change the system time to just be a small analog clock and then turn Itsycal's menu bar entry into my actual date and time indicator - it gives you a lot more control.

### Database management

I use [TablePlus](https://tableplus.com/) for my database management - it's got a nice, clean GUI that feels both modern and intuitive and also not incredibly bloated like the other ones (\*\*cough\*\* DataGrip \*\*cough\*\*).

## Top CLI tools

I listed a few CLI tools already, here's a list of my favourite CLI tools that I use on a daily basis:

- [Fish Shell](https://fishshell.com/) - you can get the same kind of setup from zsh, but you have to put a lot
  more effort in. With Fish, it all comes out of the box. Also I like the more modern
  shell scripting syntax.
- [eza](https://eza.rocks/) - we're well into the 21st century now, why do we still need to use the
  same `ls` written in the 80s? eza is ls but better. It used to be called exa but
  then the exa maintainer disappeared, so the community forked it as eza.
- [Starship](https://starship.rs) - a prompt that is pretty, unobtrusive and only tells you the things it
  thinks you need to know. For instance, it'll show you the current Python version,
  but only if it detects you're in a Python project.
- [jq](https://jqlang.github.io/jq/) - a JSON processor, useful for formatting JSON output from APIs and for
  manipulating JSON objects so that you can pass them around between scripts or iterate
  over them.
- [fd](https://github.com/sharkdp/fd) - like `find` but a billion times faster, and more intuitive to use.
- [bat](https://github.com/sharkdp/bat) - like `cat` but with syntax highlighting and line numbers.
- [hexyl](https://github.com/sharkdp/hexyl) - command-line hex viewer, with syntax highlighting.
- [ripgrep](https://github.com/BurntSushi/ripgrep) - like `grep` but much faster and doesn't feel like it's from the 90s.
- [delta](https://github.com/dandavison/delta) - a better differ for git, with more human readable output, syntax highlighting,
  etc.
- [task](https://taskfile.dev/) - stop writing makefiles for Go projects (in fact, stop writing makefiles
  altogether, but that's a different conversation). Task is a task runner that uses
  a `Taskfile.yml` to define tasks and dependencies in an intuitive and human readable
  way.
- [tealdeer](https://github.com/dbrgn/tealdeer) - 95% of the time when I don't know how to use a CLI tool, I just want
  to know the most common use cases. [tldr](https://tldr.sh/) is a collaborative community-driven effort to simplify man pages into something
  that I can quickly read and understand. Tealdeer is a CLI interface to the tldr
  repository.
- [bottom](https://github.com/ClementTsang/bottom) - like `top` but better. I've tried a few of these and this is the one
  I like the most.
- [atuin](https://atuin.sh/) - sync your shell history across multiple machines. I have disabled the
  up arrow and enabled the ctrl-r search, so really I'm just using it so I can search
  my shell history from any machine.
- [rye](https://rye.astral.sh/guide/installation/) - rye is like pyenv and Poetry bundled together. It's also really fast,
  which is nice. It uses uv for package management which makes it insanely fast to
  install Python packages (no really, it is). It's from the same guy who created [ruff](https://astral.sh/ruff) and [uv](https://github.com/astral-sh/uv) , both excellent tools.
- [ncdu](https://dev.yorhel.nl/ncdu) - a disk usage analyzer with an ncurses interface.

## Fonts

Fonts are such a personal choice that I really think you should use whatever you feel like - I have always liked [Ubuntu Mono](https://design.ubuntu.com/font) for some reason, so I use the [Ubuntu Mono Nerd Font](https://github.com/ryanoasis/nerd-fonts/releases).

## Colour schemes and themes

I go through about a new colour scheme every month, but at the moment I'm into [catppuccin](https://github.com/catppuccin/catppuccin) - it's just really soothing and pastelly. They've also got a setup / config for every conceivable tool and text editor, so it's nice to have it all consistent with each other.
