---
title: Custom Jekyll plugins with GitHub Pages
description: How to use custom Jekyll plugins with GitHub Pages
date: 2014-07-29
tags: [coding]
archive: true
---

So GitHub Pages is a fantastic resource for hosting your personal or organisation site on GitHub, for free. It even supports Jekyll! only thing is, it doesn't support custom plugins because of the `--safe` flag that it compiles your site with. So what do you do?

Well, if you compile the site using `jekyll` yourself, then push the resulting compiled HTML to your GitHub Pages repository, then it works perfectly! You get your custom plugins, and you get your free GitHub Pages hosting.

So how do you organise the source and compiled code?

Some people, like [Charlie Park](http://charliepark.org/jekyll-with-plugins/), recommend two repos, one with the source code (e.g. `github.com/username/username.github.io.raw` for the website source code and `github.com/username/username.github.io` for the compiled HTML). I don't particularly like this; it's one project, it should be one repo.

Others, like [Alexandre Rademaker](http://arademaker.github.io/blog/2011/12/01/github-pages-jekyll-plugins.html), have two separate branches (a `master` for compiled HTML and a `source` for the Jekyll source), and change branches then copy the contents of `_site` into the master branch every time you want to push to your website.

I like the idea of separate branches within the same repo, but messing about with copying `_site` seems laborious and unnecessary. Here's my solution:

Two branches: source and master.

Master contains compiled HTML, source contains the Jekyll source.

In the `.gitignore` of the `source` branch, you put the following:

```bash showLineNumbers
_site
```

Then, when you run `jekyll build` and Jekyll produces all the HTML in `_site`, git doesn't recognise it. That means that we can `cd` into `_site`, and seeing as git doesn't know the difference, we can make `_site` itself into its own git repository.

Assuming you're starting off with a bog standard single branch Pages repo, you run:
```bash showLineNumbers
# Make sure _site is empty before we begin
rm -rf _site/*

# Make new source branch
git checkout -b source

# Tell Jekyll to ignore this dir
touch .nojekyll

# Tell git to track source remote branch
git branch --set-upstream source origin/source

# Upload your branch to GitHub
git push origin source

# Locally delete the original master branch
git branch -D master

# Make a new git repository within _site
cd _site
git init

# Tell Jekyll to ignore this directory
touch .nojekyll

# Set the remote repository to push the HTML to
git remote add origin https://github.com/username/username.github.io

# Tell it to push to the master remote branch
git branch --set-upstream master origin/master
```

Now you've got your source branch set up in your root directory and master branch set up in your `_site` directory, ready for rapid building and deployment of your Jekyll website.

Now each time you want to build your site locally, you just need to run:
```bash showLineNumbers
jekyll build
cd _site
git add .
git commit
git push origin master
```
and you have successfully built and deployed your website with Jekyll. Note that by default Jekyll does not copy `.nojekyll` over to `_site` where we need it, because it is a dotfile, so you need to put the following in your `_config.yml`:

```yaml showLineNumbers
include: .nojekyll
```

Now, to automate this process, I wrote a small bash script to build, commit and push your site all in one command. Here is the [gist of it](https://gist.github.com/drewsberry/1b9fc80682edd8bcecc4), and this is the script:

```bash showLineNumbers
#!/bin/bash
 
if [[ -z "$1" ]]; then
  echo "Please enter a git commit message"
  exit
fi
 
jekyll build && \
  cd _site && \
  git add . && \
  git commit -am "$1" && \
  git push origin master && \
  cd .. && \
  echo "Successfully built and pushed to GitHub."
```

So if I wanted to build my site locally and push it to my repository with the commit message "Latest build", I would run:

```bash showLineNumbers
jekgit.sh "Latest build"
```
