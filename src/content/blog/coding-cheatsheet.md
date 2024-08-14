---
title: Coding cheatsheet
description: "Quick snippets of easy-to-forget but often used commands, tricks and tips."
date: 2014-07-15
tags:
  - cheatsheet
archive: true
---

Here's a load of quick snippets of easy-to-forget but often used commands, tricks and tips. It's got useful info about git, Vim, Python and Perl.

## Git

### First commands

These are the things you need to do when using `git` on a new computer:

```bash
# Change username associated with commits
git config --global user.name "<USER>"

# Change email associated with commits
git config --global user.email <EMAIL>

# Cache uname and passwd for convenience (only on git >= 1.7.9)
git config --global credential.helper cache

# Push to current branch only by default
git config --global push.default current

# Tell git to use vim as text editor
git config --global core.editor vim

# Tell git to colour its output
git config --global color.ui true
```

### Adding remote

Add remote repository:

```bash
git remote add origin https://github.com/username/repository.git
```

Then subsequently set local branch to track remote branch:

```bash
git branch --set-upstream master origin/<branch>
```

### Setting up git submodules

Adding submodules in a git repository is as simple as editing the file `.gitmodules` in the root of the repository, with the following syntax:

{% comment %}
I'm not sure what highlighter to use for this. If anyone knows a better one, do let me know.
{% endcomment %}

```python
[submodule "libfoo"]
    path = include/foo
    url = git://github.com/foo/libfoo.git

[submodule "libbar"]
    path = include/bar
    url = git://github.com/bar/libbar.git
```

Then a quick:

```bash
git submodule init
git submodule update
```

### Updating git submodules

You might be tempted to think that updating all your submodules from their respective remotes is as simple as running `git submodule update`. But no, what that does is update the submodules to the version checked out in the remote of the root repo. What you need is to update the version of the submodules that is checked out by the root repo. Here's how to do it, assuming your submodule is called `subm`:

```bash
# Change into your submodule directory
cd subm

# Pull from the submodule remote
git pull origin master # Or whatever remote/branch you're updating from

# Go back into the root repo directory
cd ..

# Check out the updated submodule
git commit -am "Update subm"
```

And you're done! It can be a bit annoying for updating loads of subdirectories, so I'm working on a short script to do it all for you. I'll update here once I finish it.

### Git subsubmodules

If you've got nested submodules (i.e. a submodule within another submodule), then you need to do alter this slightly to update the nested submodules. As well as having each submodule within your submodule containing a `[submodule "foobar"]` within both your root `.gitmodules` and your submodule `.gitmodules`, you need to do the following from within the root repository to update all submodules and subsubmodules:

```bash
git submodule update --init --recursive
```

## Vim

### Vim functions

Here's the syntax for declaring vim script functions:

```vim
functions MyFunction ()
    do first thing
    do second thing
endfunction
```

And you then call it in Vim with:

```vim
:call MyFunction()
```

### Recognise custom filetypes

I've got `moo.vim` files in my `~/.vim/after/syntax` and `~/.vim/after/ftplugin`, for all `moo` files with extension `.moo`. To get Vim to recognise these `.moo` files and apply the Vim scripts associated therewith, I need to create a file called `moo.vim` in `~/.vim/ftdetect/`, which contains the following:

```vim
au BufRead,BufNewFile *.moo set filetype=moo
```

_Note_: You may have to wipe your `~/.vim/view` before Vim recognises old files as this new filetype.

### Editing over scp

Vim comes with the ability to edit files remotely over scp. This can be achieved via:

```vim
vim scp://user@servername//path/to/file
```

However, trying to save gives the error:

```vim
E382: Cannot write, 'buftype' option is set
```

In fact, running `set buftype?` reveals that `buftype` is set to `nofile`, meaning the buffer cannot be saved to file. This can be bypassed by using `:Nwrite` from the [netrw.vim](http://www.vim.org/scripts/script.php?script_id=1075) that comes bundled with Vim 7.0:

```vim
:Nwrite
```

## sshfs

To allow other non-root users to access a filesystem mounted over ssh, use:

```bash
sshfs -o allow_other user@servername:/path/to/content /path/to/local/mountpoint
```

## Photoshop

Whilst I don't generally like expensive proprietary software, particularly photoshop, given the importance of this small technique to my current project (on which I will write a full post soon), I felt it important to include how to mask parts of photos in Photoshop, ready to be imported into programs like [PhotoScan](http://www.agisoft.ru/products/photoscan) (another piece of incredibly expensive proprietary software).

1. Firstly, select the region you want to mask (or keep unmasked, whichever is easier). The `w` key switches between the Quick Selection and Magic Wand tools, both useful in their own rights.
2. Next, in the "_Channels_" group, click "_New channel_" at the bottom of the group box. The image should now turn black.
3. If you want to mask the selection, press `<CMD><SHIFT>I` to invert the selection and press `<SHIFT><F5>`; select "_White_" and press `<CR>`. If you want to mask everything apart from the selection, then simply press `<SHIFT><F5>`, select "_White_" and press `<CR>`
4. Save the file as a format supporting alpha channels by pressing `<CMD><SHIFT>S`. For PhotoScan imports, `TIFF` is recommended. Tick the box called "_Alpha Channels_" and press `<CR>` twice to save.
5. (**optional**) In PhotoScan, after loading the photos into the workspace with _Workflow_>_Add photos_/_Add folder_, click _Tools_>_Import_>_Import masks..._. Make sure that "_Method_" is set to "_From Alpha_" and click okay. The masked areas will then be darkened to indicate they are masked.

**Bonus Tip:** To import masks from one photo into another, simpler drag the channel onto the new photo.

Note that this is based on the ancient CS3 that's installed on the Mac I'm currently using, and may not apply to newer versions.

## Python

### argparse

Skeleton `argparse` template:

```python
# Import the library
import argparse

# Description of the program
parser = argparse.ArgumentParser(description="Short description of the Python program.")

# A compulsory positional argument
parser.add_argument("compulsory", help="Description of argument, what it does and what the options are.")

# A required normal argument
parser.add_argument("-o", "--option", required=True, help="Short description")

# An optional true/false argument
parser.add_argument("-v", "--verbose", action="store_true", help="Short description")

# Specifying the type
parser.add_argument("-f", "--float", type=float, help="Short description")

# Specifying the default value
parser.add_argument("-n", "--name", default="drew", help="Short description")

# Parse the arguments
args = parser.parse_args()

# Accessing the values of the arguments
myArgument = args.compulsory
myName = args.name
```

### Replace `~` with home directory

This is just a fun little script that replaces `~` in a string with the path to the user directory, e.g. `/home/drew`. Useful for taking input and output filenames from input, and want people to be able to use their familiar tilde.

```python
import re
import os

# Replace '~' in fname with path to user dir
fname = re.sub("~", os.environ['HOME'], fname)
```

### Increase size of pyplot legend

Sometimes, the legend in matplotlib isn't quite big enough. Increase it with:

```python
plt.legend(loc="upper left", shadow=True, borderpad=1)
```

### Fix spacing in pyplot multiplots

Every time I do a subplot in pyplot, I get annoyed at the spacing, and every time I forget that all you need to do is put the following in your script and it will automagically sort the spacing out for you:

```python
plt.tight_layout()
```

Why is this not a standard part of matplotlib? I don't know.

### Change x or y ticks on pyplot plot

You can use either `np.arange` or specify the ticks yourself:

```python
# Automatically generate ticks for x axis
plt.xticks(np.arange(min(x), max(x)+1, step))

# Manually specify ticks for y axis
plt.yticks([-1, 5.2, 9.0, 43, 109])
```

### Set custom limits on pyplot plot

Here you can both retrieve and set the x and y limits with `plt.xlim` and `plt.ylim`:

```python
plt.xlim() # Returns the current x axis limits
plt.ylim() # Returns the current y axis limits

plt.xlim(0, 127) # Sets the x axis limits
plt.ylim(159, 4) # Sets the y axis limits
```

### Find the properties of an object

To find the properties of an object, you can do the following:

```python
object.__dict__ # Works in some cases
dir(object) # Should work in all cases

# For example...
dir(__builtins__)
> ['ArithmeticError', 'AssertionError',
    ...
   'upgrade', 'vars', 'xrange', 'zip']

__builtins__.__dict__
> {'bytearray': <type 'bytearray'>, 'IndexError': <type 'exceptions.IndexError'>,
>   ...,
>  'OverflowError': <type 'exceptions.OverFlowError'>}
```

## Perl

### Pie

Probably the most useful thing that `perl` can do is `perl -pi -e`, often lovingly called Perl Pie. The syntax is:

```bash
perl -pi -e "s/string to find/string to replace/g" filenames
```

This replaces `string to find` with `string to replace` in filenames. This is fully regex compatible. For instance, if I wanted to replace `mispelt` with `misspelt` in all files ending in `.txt`, I would run:

```bash
perl -pi -e "s/mispelt/misspelt/g" *.txt
```
