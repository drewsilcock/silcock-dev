---
title: Proper line numbers with Jekyll
description: How to get beautiful line numbers in Jekyll code blocks.
date: 2014-07-18
tags:
  - jekyll
archive: true
---

By default, Jekyll uses the (excellent) Pygments syntax highlighter for code blocks. While this works well, the line numbers it produces are less than satisfactory.

Here's the default `lineno` option, `inline`:

![lineno=inline](/media/archive/proper-linenumbers/lineno_w_inline.png)

This works, but has two main visual and practical problems:

1. There is no visual separation between the line numbers and the code, causing them to visually become indistinct, and
2. When trying to copy code from the codeblocks, the line numbers are included, annoyingly.

So what's the alternative?

Well, Pygments has inbuilt the `table` option, which separates the code from the linenumbers, ostensibly fixing both of these problems. Let's take a look:

![lineno=table](/media/archive/proper-linenumbers/lineno_w_table.png)

Well, as you can see, this doesn't really look good either. The main problems are:

1. The size of the line number table is inconsistent between codeblocks, and
2. The line numbers don't align with the actual lines of code

So let's get rid of the `lineno` option altogether, and get our beautiful but functional line numbers through [CSS counters](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Counters), as described in an article by [Alex Peattie](http://alexpeattie.com/blog/github-style-syntax-highlighting-with-pygments/).

## CSS File

Alex's CSS is as follows:

```c
pre {
    counter-reset: line-numbering;
    border: solid 1px #d9d9d9;
    border-radius: 0;
    background: #fff;
    padding: 0;
    line-height: 23px;
    margin-bottom: 30px;
    white-space: pre;
    overflow-x: auto;
    word-break: inherit;
    word-wrap: inherit;
}

pre a::before {
  content: counter(line-numbering);
  counter-increment: line-numbering;
  padding-right: 1em; /* space after numbers */
  width: 25px;
  text-align: right;
  opacity: 0.7;
  display: inline-block;
  color: #aaa;
  background: #eee;
  margin-right: 16px;
  padding: 2px 10px;
  font-size: 13px;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

pre a:first-of-type::before {
  padding-top: 10px;
}

pre a:last-of-type::before {
  padding-bottom: 10px;
}

pre a:only-of-type::before {
  padding: 10px;
}
```

Here's what it produces after adding it to your `syntax.css`:

![beautiful linenumbers](/media/archive/proper-linenumbers/lineno_beautiful.png)

Note those important lines at the end of `pre a::before`:

```c
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
```

This tell the browser to ignore the line numbers when copying, solving one of our initial problems.

In addition, the background grey of `#eee` gives the visual distinction between line numbers and code that we were lacking from `lineno=inline`. And, of course, they align properly with the actual lines of code, unlike `lineno=table`.

On top of this, the `padding` gives the line numbers a consistent spacing and the solid border given by `border: solid 1px #d9d9d9;` gives the code a clear separation from the main text.

## Lineanchors

It's not quite that simple, though. These CSS counters need the `lineanchors` option to be given for each codeblock, or it ends up looking like this:

![without lineanchors](/media/archive/proper-linenumbers/lineno_wo_lineanchors.png)

To solve this, you can either just put `lineanchors` in every `highlight` Liquid tag, which is a bit annoying and can easily be forgotten, or you can use a global plugin to allow you to specify global Pygments options in your `_config.yml`. Such a plugin is available [here](https://gist.github.com/danasilver/8121699), thanks to [Dana Silver](https://github.com/danasilver).

Using this plugin, you can simply specify as follows in your `_config.yml`:

```yaml
pygments_options: ['lineanchors']
```

Then you don't need to put it in each codeblock tag and can forget about it!

Unfortuantely, GitHub Pages doesn't allow for custom Jekyll plugins for security reasons, so unless you want to build the site locally and push the resulting html, you're gonna have to stick to putting `lineanchors` in each tag. Up to you which you want to do.

## Scroll bar

Another problem I had, although I am unsure whether this problem is universal/reproducible, is that an annoying y-scroll bar appeared, even when there was no need for it. This is what it looked like:

![annoying scroll bar](/media/archive/proper-linenumbers/lineno_w_yscroll.png)

Now, I haven't come all this way just to be bested by an annoying y-scroll bar, so I added in this bit of CSS to Alex's code to get rid of it:

```c
/* In pre { .. } */
overflow-y: hidden;
```

This is placed in `pre { .. }`, just after `overflow-x: auto;`.

After this, I finally had the beautiful line numbers that Pygments natively lacks.

**Update:** *5-8-14*

Dana's global configs Jekyll plugin is incompatible with the new Jekyll 2.2.0 release which both I and GitHub Pages are now using. So it looks like until I get round to sorting out why the plugin is incompatible, you'll need to actually type `highlight lang lineanchors` for each individual code block. Annoying.

I always forget to do this, and could not be bothered to go through each codeblock in each blog post I've written, so here's a simple bash script to replace all instances of the `highlight lang` Liquid tag with its `lineanchors` equivalent:

```bash
#!/bin/bash

# Adds lineanchors option to all codeblock Liquid tags

languages=( vim python perl ruby yaml css html bash cpp c )
posts="path/to/posts"

for lang in "${languages[@]}"
do
    :
    perl -pi -e "s/highlight $lang/highlight $lang lineanchors/g" $posts
done
```

Change `$posts` to correspond to the location of your blog posts, the contents of which you wish to replace. If you're using more lexers, just add them into the languages array.
