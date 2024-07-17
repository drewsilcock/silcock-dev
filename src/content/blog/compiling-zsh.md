---
title: Compiling zsh without root
description: Tutorial to compiling zsh on a machine without root access.
date: 2014-07-15
tags:
  - zsh
archive: true
---

This article describes how to compile zshell on a Linux machine without root, for instance when working remotely on a server on which you do not have root.

## Step 1: Dependencies

### ncurses

To compile `zsh`, you need `ncurses`. This needs to be compiled with the flag `-fPIC`. This can be achieved as follows:

```bash
# Download the ncurses gzipped tarball
wget ftp://ftp.invisible-island.net/ncurses/ncurses.tar.gz

# Extract gzipped tarball
tar -zxvf ncurses.tar.gz

# Move into root ncurses source directory
cd ncurses

# Set cflags and c++ flags to compile with Position Independent Code enabled
export CXXFLAGS=' -fPIC'
export CFLAGS=' -fPIC'

# Produce Makefile and config.h via config.status
./configure --prefix=$HOME/.local --enable-shared

# Compile
make

# Deduce environment information and build private terminfo tree
cd progs
./capconvert
cd ..
```

Now before installing the compiled files, you should check to make sure that ncurses has compiled correctly by running:

```bash
./test/ncurses
```

If this successfully opens a prompt with multiple options, then ncurses has been successfully compiled, and you can install it:

```bash
# Install ncurses to $HOME/.local
make install
```

Note that the `--enable-shared` configure flag ensures that libtool builds shared libraries for ncurses, needed for `zsh` later on.

### icmake

Now, this may be all you need, but if you don't have it installed, you also need the documentation builder `yodl`, which in turn needs `icmake`. If these are installed already, you can skip straight ahead to Part 2.

Firstly, `icmake` is installed via:

```bash
# Download icmake source from Sourcefourge
wget http://downloads.sourceforge.net/project/icmake/icmake/7.21.00/icmake_7.21.00.orig.tar.gz

# Unpack archive (change version as appropriate)
tar -zxvf icmake_7.21.00.orig.tar.gz
cd icmake-7.21.00
```

Now the `INSTALL.im` file needs to be altered to reflect our local installation. This means replacing all the file installation locations with local directories as such, where <USER> should be replaced with your username:

```c
#define BINDIR      "/home/<USER>/.local/bin"
#define SKELDIR     "/home/<USER>/.local/share/icmake"
#define MANDIR      "/home/<USER>/.local/share/man"
#define LIBDIR      "/home/<USER>/.local/lib/icmake"
#define CONFDIR     "/home/<USER>/.local/config/icmake"
#define DOCDIR      "/home/<USER>/.local/share/doc/icmake"
#define DOCDOCDIR   "/home/<USER>/.local/share/doc/icmake-doc"
```

Now run the following to compile icmake:

```bash
./icm_bootstrap /
```

Now, technically, this will compile all the files you actually need in `tmp`, but if you further want to install the files to \~/.local, then you simply run:

```bash
./icm_install strip all
```

If you then want to clear up the temporary compiled files, delete the directory `tmp` with `rm -rf tmp`.

### yodl

Now to move onto yodl. Again, we need to specify that we want to install locally by putting `BASE = "/home/as1423/.local" at the start of the function `setLocations()`located at the end of`INSTALL.im', so that the function looks like:

```c
void setLocations()
{
    BASE        = "/home/as1423/.local";

    // make sure that BIN, STD_INCLUDE, MAN, DOC and DOCDOC all are
    // absolute paths

    BIN         = BASE + "/bin";
    DOC         = BASE + "/share/doc/yodl";
    DOCDOC      = BASE + "/share/doc/yodl-doc";
    MAN         = BASE + "/share/man";
    STD_INCLUDE = BASE + "/share/yodl";

    COMPILER = "gcc";
}
```

In addition, we need to tell `build` to look in our local directory for `icmake` instead of the standard `/usr/bin` or `/usr/local/bin`. This means editing the hashbang at the top of `build` to look as follows, where again <USER> is replaced by your UNIX username:

```bash
#!/home/<USER>/.local/bin/icmake -qt/tmp/yodl
```

Now that `build` knows that we want to run our locally compiled `icmake`, we can actually build `yodl`:

```bash
# In root directory of yodl source
./build programs
./build man
./build manual
./build macros
```

There may be a LaTeX error when running `./build manual`, but just ignore this, because it's not vital.

Now we're ready to actually install yodl:

```bash
./build install programs /
./build install man /
./build install manual /
./build install macros /
./build install docs /
```

Note that the `/` designates that we are installing with respect to the root of our filesystem. This is fine, though, because we've already specified in `INSTALL.im` that we want everything to be installed locally into `$HOME/.local$. Now `yodl\` should be successfully installed.

## Step 2: Tell environment where ncurses is

Before compiling `zsh`, you need to tell your environment where your newly compiled files are (if you haven't already). This can be achieved with:

```bash
INSTALL_PATH='$HOME/.local'

export PATH=$INSTALL_PATH/bin:$PATH
export LD_LIBRARY_PATH=$INSTALL_PATH/lib:$LD_LIBRARY_PATH
export CFLAGS=-I$INSTALL_PATH/include
export CPPFLAGS="-I$INSTALL_PATH/include" LDFLAGS="-L$INSTALL_PATH/lib"
```

## Step 3: Compiling `zsh`

Now, we're finally ready to move onto compiling `zsh`:

```bash
# Clone zsh repository from git
git clone git://github.com/zsh-users/zsh.git

# Move into root zsh source directory
cd zsh

# Produce config.h.in, needed to produce config.status from ./configure
autoheader

# Produce the configure file from aclocal.m4 and configure.ac
autoconf

# Give autotools a timestamp for recompilation
date < stamp-h.in

# Produce Makefile and config.h via config.status
./configure --prefix=$HOME/.local --enable-shared

# Compile
make

# Install
make install
```

## Step 4: Enjoy `zsh`!

After these steps have been completed, zsh should be ready and compiled to use in your \~/.local/bin folder. If you like `zsh`, you'll love `ohmyzsh`. This can be installed by:

```bash
curl -L http://install.ohmyz.sh | sh
```

Or if you don't want o execute shell scripts from arbitrary non-https website, you can use git:

```bash
# Clone repository into local dotfiles
git clone git://github.com/robbyrussell/oh-my-zsh.git ~/.oh-my-zsh

# Copy template file into home directory
cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc
```

Once you've done this, edit oh-my-zsh to your needs, e.g. if you want to change the theme, replace `ZSH_THEME="robbyrussell" with the theme of your choice. I particularly enjoy `jonathan\`.

And finally, change your shell to `zsh`:

```bash
chsh -s $HOME/.local/bin/zsh
```

Now sit back and enjoy your effortless tab completion, directory movement and integrated git information.

## Troubleshooting

If, when installing `zsh`, either `make` or `make install` fail despite all other programs being compiled and present, you may need to run `make realclean` to remove ALL compiled files, and start the compilation from `autoheader`. This sometimes happens if you run `./configure` before installing `yodl`, meaning the `config.h` and `Makefile` files have been built without knowledge of `yodl` and need to be purged.

If `zsh` isn't recognising the `ncurses` library when running `./configure`, and instead giving the following error:

```bash
configure: error: "No terminal handling library was found on your system.
This is probably a library called 'curses' or 'ncurses'. You may
need to install a package called 'curses-devel' or 'ncurses-devel' on your
system."
See `config.log' for more details.
```

Then this means that you haven't got the `ncurses` library in your library path. You can add it to your environment by re-running the commands in Part 2, in particular the final command exporting `CPPFLAGS` and `LDFLAGS`.

## References

<a href="https://unix.stackexchange.com/questions/123597/building-zsh-without-admin-priv-no-terminal-handling-library-found">This stackoverflow post</a>

<a href="https://en.wikipedia.org/wiki/GNU_build_system#mediaviewer/File:Autoconf-automake-process.svg">This autotools flow chart from Wikipedia</a>

<a href="https://github.com/zsh-users/zsh/blob/master/INSTALL">The somewhat cryptic and involved zsh INSTALL file.</a>
