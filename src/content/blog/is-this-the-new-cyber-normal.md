---
title: Is this the new cyber normal?
description: A week of cyber incidents one after another – is this what every week is going to look like and what can we do about it?
date: 2026-10-23T12:00:00
updated: 2026-10-22T12:00:00
draft: false
tags:
  - security
  - llms
socials:
  - https://news.ycombinator.com/item?id=50207115
---

The last week has seen a flurry of severe and critical software vulnerabilities affecting thousands of major sites and sending people into a panic. What's going on here, and what can we do about it?

## The bugs

If we want to understand what's going on in the world of software security at the moment, we need to understand what's going on with all these bugs. I'm not a cybersecurity expert, so I'm going to link to external explanations instead of going into the gory technical details myself as these people are always going to do a better job at that.

### PHP2Shell – [CVE-2026-109618](https://www.cve.org/CVERecord?id=CVE-2026-109618) and [CVE-2026-109619](https://www.cve.org/CVERecord?id=CVE-2026-109619) (a.k.a. "the big one in the news")

Two different security teams, one from California security company Calif (as part of OpenAI's "Patch the Planet" program) and another from Israeli-U.S. cloud security company Wiz (they're part of Google Cloud, apparently), both found these two Remote Code Execution (RCE) bugs in PHP. They were both using frontier AI models (a.k.a. LLMs, specifically GPT-5.6 Sol/Gemini 4 Argon) to find these vulnerabilities and build the exploits.

Interestingly, one of the bugs (CVE-2026-109618) was [found by a security audit](https://thephp.foundation/blog/2026/10/21/todays-php-security-release-and-how-were-strengthening-php-security/#a-first-external-audit-and-increased-security-focus) the PHP Foundation did in 2024 (funded by the [Sovereign Tech Agency](https://en.wikipedia.org/wiki/Sovereign_Tech_Agency) which is coincidentally one of the most interesting things happening in the open source space at the moment) but they basically ignored it because they had bigger concerns and couldn't agree on a fix. The reasoning behind it was that no-one could really figure out how to create an actual exploit based on the theoretical issue.

One thing LLMs are very good at is taking a theoretical security vulnerability, even if that vulnerability is a vague description of what the issue could be, and building it into a full exploit. This has become a major issue in recent months as any notice of a security patch will immediately result in people pointing their LLMs at the codebase, whereupon the agents can very quickly read through diffs until they find something that looks like a security patch, then go backwards to the vulnerability it covers, and follow this all the way to an exploit.

This happens so fast, in fact, that at this point I think it is a reasonable that the moment you announce a security patch should be taken as a last possible date that the full exploit is *not* being publicly or privately distributed.

This PHP2Shell (as it's being marketed, vulnerabilities seem to come bundled with their own marketing departments now) is estimated to affect upwards of 70% of the internet, with thousands of websites from [Wikimedia Foundation](https://diff.wikimedia.org/2026/10/21/impact-of-php-vulnerabilities-on-wikimedia-tools-and-services/) to [DeviantArt](https://x.com/DeviantArt/status/2112874361824899085) to [much of the UK government and Japanese banking systems](https://www.independent.co.uk/tech/security/php-hack-cyber-attack-websites-down-b3071407.html) to [The Traitors BBC programme website](https://www.bbc.co.uk/news/live/ckgel5xp2xv9t?post=asset%3A65d8808b-d5fa-4ee3-aa16-42d183b15c95#post). Vulnerabilities do get found, but they don't normally cause half the internet to shut their servers down, so what's going on?

To understand this, let's look at the [original post from the PHP Group](https://www.php.net/archive/2026.php#2026-10-20-1):

![Screenshot of the PHP announcement "Upcoming Critical PHP Security Release", dated 20 Oct 2026. It says the release is scheduled for Wednesday 21 October 2026 at 14:00 UTC, that it fixes two critical vulnerabilities rated CVSS v4.0 9.2, and that full details will be published with the release.](../../assets/is-this-the-new-cyber-normal/php-notice.png)

Someone called [petecooper](https://news.ycombinator.com/item?id=50193416) posted on [Hacker News](https://www.bleepingcomputer.com/news/security/php-warns-admins-of-two-critical-flaws-emergency-patches-coming-tomorrow/) [about the CVEs](https://news.ycombinator.com/item?id=50167754), apparently unaware that there even was an embargo. This (and other apparent leaks) prompted this hurried statement from the PHP Group and bringing the patch forward from Thursday 22nd to Wednesday 21st. However, the patch still wasn't going to be available till the next day. This unintentional leak included CVSS scores of 10.0 (i.e. _bad_, although weirdly the actual scores were 9.2 instead).
 
Pretty much immediately, this news spread like wildfire and people started panicking. Even though this was found by _"responsible security researchers"_ at _"respectable companies"_, by the time the security patch actually got released, it was [already being exploited in the wild](https://ellio.tech/en/blog/php2shell-what-we-observed-and-what-to-do/)[^already-exploited]. The PHP Foundation [blamed Calif and a company called Chainguard](https://thephp.foundation/blog/2026/10/21/todays-php-security-release-and-how-were-strengthening-php-security/#leak-and-disrupted-disclosure) by saying that Calif leaked a video of the exploit in action (with weird background music and a dancing anime girl) while Chainguard published fixes 6 hours before the embargo was due to lift, both allowing attackers to beat the systems administrators to the punch. The timeline is confusing, but it seems like multiple interconnected things have gone wrong here, all within the space of about 17 hours.

[^already-exploited]: There is some discussion and disagreement about whether any real, working attempts at exploiting this were made before the patch was released.

There's been lots of [discussion](https://news.ycombinator.com/item?id=50188948) about whether AI really is the game changer that completely revolutionises computer security or not. The big AI companies (and they [are big](https://www.wheresyoured.at/ai-had-better-work-out/)) obviously want you to think that it is. [Some people](https://eliastaylor.com/noexploit/) argue that PHP2Shell is overblown because LLMs tend to be paranoid about vulnerabilities and come up with "exploits" that make bad assumptions (like that the server will run PHP code you upload yourself via some existing file inclusion vulnerability) or cheat in some way. As [LiveOverflow points out](https://www.youtube.com/watch?v=SP7y1h0laN0), LLMs make it very easy to create exploit slop that proves nothing and doesn't work, but that doesn't mean that the vulnerability isn't real and easy to exploit using AI. You can have 10,000 bad slop exploits that don't work but if there's one that does, that's all that matters. Maybe we just need to get used to wading through slop to find the important stuff now.

[Others point out](https://news.ycombinator.com/item?id=50189820) that lots of governments ([UK](https://www.ncsc.gov.uk/news/critical-security-issue-affecting-php)[^gov-disclaimer], [EU](https://cert.europa.eu/publications/security-advisories/2026-018), [Japan](https://x.com/takaichi_sanae/status/2112890642590564386), [USA](https://www.cisa.gov/news-events/alerts/2026/10/21/critical-vulnerabilities-php-require-immediate-patching)) got overexcited and released urgent announcements saying everyone had to unplug their computers immediately, so people panicked. I think the reason everyone panicked is that everyone kind of knows that PHP is intensely insecure and they use it anyway, so they're kind of primed for bad news and to overreact. Also, it actually is really quite bad, so maybe panicking is kind of the correct reaction?

[^gov-disclaimer]: Disclaimer: I [kind of](https://en.wikipedia.org/wiki/Quango#United_Kingdom) work for the UK government.

The big takeaway for me from this is that – because of LLMs – the time from "hey I heard there's a bad RCE in this project" to "there are sophisticated, automated, and concerted attacks using an exploit targeting this vulnerability" has gone from weeks/months to hours/minutes. The fact that there's loads of non-working exploit slop just shows how genuine expertise is still required to make these things – if you don't know what you're looking at, you can't tell whether the AI has cheated or made bad assumptions.

**Links:**

- [Hacker News: "Tell HN: 2x PHP RCE CVEs with CVSS 10.0 Incoming" (petecooper, 20 Oct 2026)](https://news.ycombinator.com/item?id=50167754)
- [PHP2Shell – official website](https://www.php2shell.com/) – why does every vulnerability need a name, slogan, and website now?
- [Wiz Research: "PHP2Shell: AI uncovers critical RCE vulnerabilities affecting 70% of the Internet"](https://www.wiz.io/blog/php2shell-php-rce) – these are one of the companies who found the bugs.
- [PHP News Archive: "Upcoming Critical PHP Security Release" (20 Oct 2026)](https://www.php.net/archive/2026.php#2026-10-20-1) – how The PHP Group announced the vulnerability. Note the timelines.
- [Wikipedia: PHP2Shell](https://en.wikipedia.org/wiki/PHP2Shell) – not too detailed but at least they're not trying to sell you anything.
- [AWS Security Blog: "Amazon Threat Intelligence identifies PHP2Shell exploitation prior to public disclosure in MadPot"](https://aws.amazon.com/blogs/security/amazon-threat-intelligence-identifies-php2shell-exploitation-prior-to-public-disclosure-in-madpot/) – they are trying to sell you something, but they're still doing some interesting analysis.

### eMudhra ([CVE-2026-111943](https://www.cve.org/CVERecord?id=CVE-2026-111943) for Golang response)

On the exact same day (20th October 2026), Mozilla announced that they were blocking 8 intermediate certificates signed by Indian certificate authority eMudhra. This happened after a pseudonymous security researcher known only as "Wayne" reported to several big tech firms (such as Mozilla, Apple, Google, Microsoft, etc.) that the certificate authority were using laughably poor quality private keys for their intermediate certificates. Where a secure key might be a 100 digit number, eMudhra were using keys like "115", "56", and "4". They must've been following RFC 1149.5:

<figure>
  <img src="https://imgs.xkcd.com/comics/random_number.png" alt='xkcd comic "Random Number": a code listing with the function int getRandomNumber() that simply returns 4, with the comment "chosen by fair dice roll. guaranteed to be random."' />
  <figcaption><em>Alt:</em> RFC 1149.5 specifies 4 as the standard IEEE-vetted random number. From <a href="https://xkcd.com/221/">xkcd #221</a>, licensed under <a href="https://xkcd.com/license.html">CC BY-NC 2.5</a>.</figcaption>
</figure>

There are no indications that this was found or exploited using AI or LLMs, although researcher [Scott Helme](https://scotthelme.co.uk/eight-bits-of-trust-emudhras-ca-keys-cracked-in-milliseconds/) notes that given a single prompt, Claude was able to recover the private keys of the intermediate certs.

At the time of writing (23rd Oct), eMudhra has [announced](https://emudhra.com/en/press-release/emudhra-to-exit-global-ssl-tls-certificate-business) that it will be retiring from the certificate authority space. In unrelated news, a farmer has announced that he has shut his stable door, following reports of an escaped horse.

**Links:**

- [Mozilla Security Blog: "Protecting Firefox users following the compromise of eMudhra intermediate certificates"](https://blog.mozilla.org/security/2026/10/20/protecting-firefox-users-following-the-compromise-of-emudhra-intermediate-certificates/)
- [Scott Helme: "Eight Bits of Trust; eMudhra's CA keys cracked in milliseconds"](https://scotthelme.co.uk/eight-bits-of-trust-emudhras-ca-keys-cracked-in-milliseconds/)
- [eMudhra press release: "eMudhra to Exit global SSL/TLS Certificate Business"](https://emudhra.com/en/press-release/emudhra-to-exit-global-ssl-tls-certificate-business)
- [eMudhra Intermediate CA Compromise – research announcement and trust store checker](https://emudhra.we-have-a-problem.com/)

### Railway bug

The next day, cloud provider Railway announced that they found evidence that hackers had accessed and even decrypted environment variables from their platform, which often hold secrets such as database credentials, API keys, etc. In their statement, they said that they believed that this was part of a concerted effort aimed at compromising companies that provide AI inference.

What would the end goal be here? At the time of writing (23rd Oct), we have very little information to go on. Is this "unauthorized third party" (official announcements of "some randos got into our computers" always find a way to make it seem like a terms of service agreement, maybe that way they think people won't pay attention to it) trying to spy on people using AI inference to see what they're doing, even stealing new models or research? Or maybe they're trying to build a network of compromised inference providers for their own nefarious generative AI purposes (like finding more PHP bugs).

**Links:**

- [Railway Blog: "Security Disclosure: Wednesday October 21st"](https://blog.railway.com/p/security-disclosure-wednesday-october-21st)
- [Hacker News discussion of the Railway security disclosure](https://news.ycombinator.com/item?id=50188228)

### GitLab ([CVE-2026-97229](https://www.cve.org/CVERecord?id=CVE-2026-97229) and [CVE-2026-110264](https://www.cve.org/CVERecord?id=CVE-2026-110264))

On 12th October 2026, [GitLab warned](https://www.bleepingcomputer.com/news/security/gitlab-warns-of-max-severity-rce-flaw-in-regex-compiler-engine/) of a [max severity bug](https://docs.gitlab.com/releases/patches/patch-release-gitlab-19-4-2-released/) in GitLab CI/CD's regular expression parsing that could enable attackers to execute arbitrary code (another RCE) using a specially crafted regex. This is a CVSS score of 10.0 which is the maximum possible, meaning "this is pretty much as bad as they come"[^cvss-types]. This was followed on 21st October 2026 by [yet another regex integer overflow RCE](https://docs.gitlab.com/releases/patches/patch-release-gitlab-19-5-1-released/), another 10.0.

[^cvss-types]: GitLab is using CVSS 3.1 while PHP is using CVSS 4.0 here, which means they're following slightly different metrics to calculate the CVSS score, meaning you can't directly compare them.

This follows hot on the heels of yet another 10.0 CVSS CVE from last month ([CVE-2026-85706](https://www.cve.org/CVERecord?id=CVE-2026-85706)), that time related to [path traversal](https://www.bleepingcomputer.com/news/security/gitlab-urges-users-to-patch-max-severity-path-traversal-flaw/). All three of these bugs were reported through GitLab's HackerOne bug bounty program. When it became clear that LLMs could research vulnerabilities and write exploits, there was a lot of talk about shutting down bug bounty programs because they didn't make sense anymore. I'm sure GitLab are glad they didn't do that now.

Although GitLab is used very widely across academia, government, and private companies, this doesn't seem to have got as much attention. CVEs in GitLab are obviously very serious, especially for private companies, as a lot of their vitally important intellectual property is stored in there, and having that leak could be disastrous. Often, companies put their GitLab instance behind a VPN/firewall so that they aren't publicly accessible, which greatly reduces the risk associated with this. It's also not entirely clear whether these CVEs require specific conditions like publicly accessible projects, user self-registration, etc. It does seem like [CVE-2026-110264](https://www.cve.org/CVERecord?id=CVE-2026-110264) requires at least one public project, but I can't find any information on the conditions around the earlier CVE.

There's no indication that these were discovered using AI or LLMs. They may have been, but there's no reason at this point to think they were.

**Links:**

- [GitLab Docs: "GitLab Critical Patch Release: 19.4.2, 19.3.5, 19.2.8"](https://docs.gitlab.com/releases/patches/patch-release-gitlab-19-4-2-released/)
- [GitLab Docs: "GitLab Critical Patch Release: 19.5.1, 19.4.3, 19.3.6, 19.2.9, 19.1.9, 19.0.10, 18.11.13"](https://docs.gitlab.com/releases/patches/patch-release-gitlab-19-5-1-released/)
- [Hacker News discussion: "GitLab critical patch release"](https://news.ycombinator.com/item?id=50185869)
- [BleepingComputer: "GitLab warns of max severity code execution vulnerability"](https://www.bleepingcomputer.com/news/security/gitlab-warns-of-max-severity-rce-flaw-in-regex-compiler-engine/)
- [Lobsters discussion: "GitLab warns of max severity code execution vulnerability"](https://lobste.rs/s/tehays/gitlab_warns_max_severity_code_execution)
- [GitLab Security detection rule: Org-mode render error burst](https://gitlab.com/gitlab-security-oss/tldr/-/blob/main/Detections/platforms/GitLab/Vulnerability%20Detections/org_mode_render_error_burst.md)
- [GitLab Security detection rule: Onigmo native worker crash](https://gitlab.com/gitlab-security-oss/tldr/-/blob/main/Detections/platforms/GitLab/Vulnerability%20Detections/onigmo_native_worker_crash.md)

### musl libc bug

On 21st October, a bug in musl's libc related to regex (libc has regex? Apparently...) was announced that leads to denial of service at least, if not code execution. As far as I can tell, this is entirely coincidental in timing and not related to the GitLab bugs, which both also seem to be integer overflows when parsing untrusted regular expressions, one reported on the exact same day. Who knew a regex engine was such a security issue – is regex the new font rendering? The GitLab bugs were both found by a Swede called [Johan Carlsson (joaxcar)](https://hackerone.com/joaxcar?type=user) while the musl bug was reported by [Julien Voisin](https://dustri.org/), a French self-proclaimed "open sourcerer".

**Links:**

- [oss-security: "CVE-2026-107891: musl libc: multiple integer overflow in regcomp"](https://www.openwall.com/lists/oss-security/2026/10/21/18)
- [Lobsters discussion of the musl regcomp CVE](https://lobste.rs/s/dldfel/cve_2026_107891_musl_libc_multiple)

### LiteLLM

Ah, hello my old friend LiteLLM. Proving that, when you're made of metal and 200 feet tall, lightning can in fact strike twice. It's not a good sign that when someone asks whether you've heard of the big 2026 LiteLLM compromise, you have to ask "which one?" In a piece of good fortune, the whole PHP2Shell and all the others have cannibalised much of the attention, meaning this isn't getting quite the same traction as last time in March, despite being similarly bad.

This time, it's a malicious version on the Python Package Index (PyPI) and Docker images. For those who don't remember, LiteLLM had a [very similar thing](https://snyk.io/blog/poisoned-security-scanner-backdooring-litellm/) happen back in March, where a malicious package was uploaded to the litellm package on PyPI that used the [`.pth` files](https://www.trendmicro.com/en_gb/research/26/c/inside-litellm-supply-chain-compromise.html) to autoload malicious code (yeah, it was bad).

This compromise again took advantage of `.pth` files and this time also the `sitecutomize.py` file for autoloading malicious payloads, running in the preload step as soon as the Python interpreter starts up. According to the [analysis from Wiz](https://www.wiz.io/blog/litellm-compromised-steals-credentials), the payload has "strong indications of LLM-aided development" – things like overly verbose variable names, overly defensive error handling, brittle edge cases, and all the comments saying "this is where it really bites", "it's worth sitting with that", "lean into that", and "that stays yours" [repeatedly](https://claudisms.ai/)[^not-claudisms].

[^not-claudisms]: Ok, maybe not this last point.

According to LiteLLM, the incident occurred because the attacker had access to credentials for GitHub CLI which allowed them to run CI jobs. LiteLLM note that Claude Code will apparently sometimes embed a user's GitHub CLI OAuth token into response bodies which could cause them to appear in LiteLLM logs.

**Links:**

- [Wiz Blog: "LiteLLM Compromised, Steals Credentials"](https://www.wiz.io/blog/litellm-compromised-steals-credentials)
- [LiteLLM: "Contained: Oct 21, 2026 LiteLLM release v1.107.0 Compromised"](https://docs.litellm.ai/blog/security-incident-oct-21-2026)
- [Hacker News discussion: "Compromised LiteLLM 1.107.0 on PyPI Installs a Credential Stealer and Backdoor"](https://news.ycombinator.com/item?id=50181114)

### PingCAP

On October 19th 2026, an enterprise software company called "PingCAP" that develops a database called "TiDB" revealed "unauthorised access to PingCAP" with "no evidence that data stored in TiDB was impacted". At the same time, a cyber extortion group called "FulcrumSec" (a.k.a. the "Threatspians"[^crime-against-wordplay]) said they had exfiltrated 10.6 TB of data from PingCAP and publicly released a torrent with 200 GB of data, as a "stage one release" (you've gotta get people invested in the sequel).

They also posted full details of what they took and some of the excellent security practices of PingCAP, including _putting client AWS secret access keys inside Jira tickets_ and _attaching massive unredacted logs to Jira tickets including OpenAI, Anthropic, Gemini, xAI API keys_. Yikes. If you're willing to visit the cyber extortion group's website, they do a pretty interesting write-up of it. Gone are the days of shoddy broken English back when the Russians had to write these things up without LLMs to do it for them and remind them of definite and indefinite articles.[^clarify-russians]

The good news for PingCAP is that not finding evidence of data extraction is actually incredibly easy. In fact, I'm doing it for thousands of companies right now, for free. I'm sure there's a business proposal in there somewhere. All you have to do is not look (see also: U+1F648). To be fair, I think their argument is that no data _inside TiDB instances_ was compromised. 10.6 TB seems like a lot of data if that's the case. There's clearly still tons of customer data.

[^crime-against-wordplay]: If these reprehensible criminals are ever brought to justice, I propose their longest sentence be for crimes against wordplay. Truly atrocious.

[^clarify-russians]: To clarify, there's no evidence that this group are Russian hackers. They seem to be primarily financially motivated, so they could be from anywhere and everywhere. You get my point though – back in the day, you could tell the Russian phishing campaigns from their grammatical peculiarities. Nowadays it's lost all of its charm, all because of AI.

**Links:**

- [Hacker News discussion: "PingCap TiDB Leaks"](https://news.ycombinator.com/item?id=50173716)
- [PingCAP: "October 2026 Security Incident Report: Unauthorized Access to PingCAP Cloud Resources"](https://www.pingcap.com/trust-hub/security/security-update-october-2026/) – PingCAP's detailed and highly reliable analysis of the incident.
- [FulcrumSec: "The PingCAP TiDB Cloud Leaks"](https://fulcrumsec.vg/pingcap/) – heads up, this is the website of a known cyber extortion group. Don't say I didn't warn you. It is pretty interesting, though.

### Linux vulnerabilities accidentally posted in wrong group chat

Linux kernel development all happens through mailing lists. Naturally, some of those are about security sensitive things, so these are private. Over the night of 21st-22nd October 2026, the Zero Day Initiative (ZDI), a software vulnerability initiative owned by Trend Micro, reported a bunch of high severity (upwards of 9.0 CVSS) CVEs to the public mailing list, instead of the private one. Naturally, the assumption is that anyone with an LLM and a heart full of dreams will then be able to take those reports and turn them into active exploits within a matter of minutes. This isn't quite as bad as that time [Pete Hegseth accidentally texted details of upcoming military strikes in Yemen to The Atlantic](https://www.theatlantic.com/politics/archive/2025/03/trump-administration-accidentally-texted-me-its-war-plans/682151/)[^trump-people], but it's still interesting how seriously people take this now.

[^trump-people]: Fortunately, being the upstanding and trustworthy citizen that he is and someone who bases his administrative recruitment decisions on what's best for the country as opposed to personal loyalty and piety to the president's personal agenda of emolument, the president ensured that all [those](https://en.wikipedia.org/wiki/Mike_Waltz) [responsible](https://en.wikipedia.org/wiki/Pete_Hegseth) were swiftly [removed](https://en.wikipedia.org/wiki/United_States_Secretary_of_Defense) [from](https://en.wikipedia.org/wiki/List_of_ambassadors_of_the_United_States_to_the_United_Nations) his administration, never to be seen in Washington again.

**Links:**

- [Phoronix: "Several Linux Kernel Vulnerabilities Accidentally Posted To Public Kernel Mailing List"](https://www.phoronix.com/news/LKML-New-Trend-Vulnerabilities)

## Is this the new normal?

I think it's fair to say these last few days have been abnormally active in terms of all of these cyber incidents and security disclosures. There are many commenters on the Hacker News discussions for these incidents that say that this is nothing and it's only going to get worse. Honestly, I've not decided yet. To be honest, if you'd asked me 4 years ago how far LLMs would go, I'd never have guessed they'd get as good as they are right now. Even so, people do tend to get overexcited by these announcements and suggest that we are going to live in a world where no software is secure and everyone is vulnerable.

It's worth noting that while a lot of the online discussion around this focusses on AI and LLMs, only some of these disclosures were researched or created with LLMs. We don't know about some of them like the PingCAP one, but there's clear evidence that many criminal and state-sponsored groups are using AI to do more hacking and faster. Why wouldn't they? It seems to be pretty good at it. Many of these vulnerabilities were good old fashioned software vulnerabilities found and written using human meat fingers, but the online conversation focusses on the exciting, scary new thing. Why wouldn't it?

You can see why organisations like NHS England decided to [take all of their open source code private](https://keepthingsopen.com/) (even though that was a silly decision). When these LLMs are so good that anyone can point their agent at some open source code and find tons of vulnerabilities, then write full exploits for them, that is concerning for many. So what's the solution here?

## What can we do about it?

The NHS approach: **close source everything**. (A.k.a. the [Madagascar approach](https://knowyourmeme.com/memes/shut-down-everything))

**Pros:**

- Your code isn't online anymore, so people can't point their LLMs at it and do things like analyse every commit for security fixes, find tons of previously unknown critical bugs, etc.

**Cons:**

- The open source community and the future of computing are slightly worse off for every open source repository taken offline.
- You can't close source every codebase in the world – some things like programming languages (which are often the source of critical bugs) rely on open source to function. Making Python a closed source project would be catastrophic to the world of computing.
- It's only closed source until someone leaks it. And they probably will eventually. And when they do, you won't have had the years of public scrutiny on the codebase that keeps it clean and secure in the first place.
- Sometimes you use a programming language where this doesn't really matter, like Python and Java where you can recover source code from bytecode.
- LLMs can even reverse engineer compiled binaries pretty effectively.
- If the code used to be online, that old version still is. You have to assume that someone will have it somewhere. [Shellshock](https://en.wikipedia.org/wiki/Shellshock_(software_bug)) was in GNU Bash from 1989 until 2014 before it was fixed, and that's one of the most widely used programs on the planet.
- It makes me sad :(

The AI-embracer approach: **if you can't beat 'em, join 'em**. In other words, they can't use LLMs to find vulnerabilities if we've already run our better LLMs on our code faster and with more money and better models.

**Pros:**

- Makes a few very wealthy tech CEOs very happy.
- Will find tons of bugs.

**Cons:**

- Makes a few very wealthy tech CEOs very happy.
- Will find tons of bugs. (Someone is gonna have to fix those.)
- Costs loads of money.
- Even though AI makes it easier, it still requires expertise and deep technical knowledge to do this stuff properly (for now).

The optimist approach: **universally better, standardised approaches to reporting, handling, and mitigating security vulnerabilities followed by all companies having top-notch security postures, well-understood risks, well-documented processes, and so on**.

**Pros:**

- Lovely idea.
- Why didn't anyone else think of this?
- Gee, we are so clever. Have we just solved this?

**Cons:**

- We do not live in this world. We will never live in this world.
- Did I mention this is actually quite hard? And possibly impossible?
- Expensive.

There are some easy wins we could get from this moving forwards, like "never announce details of a critical vulnerability before the patch is ready to install", but in this case unintentional leaks meant everyone knew about the vulnerabilities even before the official announcement. Maybe even that's asking too much. In this case, it was a series of mistakes from multiple people and companies that led to or accelerated the exploit being in active use hours before the patch was available, hence everyone taking their servers offline. AWS have since said they saw someone trying out this vulnerability from 17th October, before any of these leaks happened.

Even something like minimum release age which gained popularity after [shalk/debug](https://www.sonatype.com/blog/npm-chalk-and-debug-packages-hit-in-software-supply-chain-attack), [Shai-Hulud](https://aws.amazon.com/blogs/security/defending-against-supply-chain-attacks-like-chalk-debug-and-the-shai-hulud-worm/), & March LiteLLM incidents, as it means big updates that fix widely exploited vulnerabilities don't get patched for a few days, giving attackers ample time to hack you to pieces. At the very least, we could maybe do with some better client management to avoid everyone panicking and taking all their servers offline.

Maybe we just need to accept that if you expose something to the wider internet, it will get hacked, and plan accordingly. Maybe it's our expectations that are at fault.

## Conclusion

There's definitely a story about AI and security here. It's changing the world of software, and it's not yet clear whether that's for the better or the worse. Money has a way of warping truth like matter warps spacetime, and there's enough money in AI to cause whatever the truth equivalent of a medium-sized black hole is. There's an incredible amount of money being spent on AI and it all wants you to think that it's going to change everything about your life, including software and security. That doesn't mean it's not true, of course.

Some people say automated analysis tools led to loads of new bugs being found back in the '10s, and now the same thing is happening again. It feels categorically different to me, but perhaps there will be an initial period of escalating bug reports before it all settles down and goes back to how it was. I suspect not. Some people say this is only happening because humans wrote all the dodgy code in the first place – once AI is writing all of the code to start with, there'll be no vulnerabilities because LLMs are better at writing secure code than humans. I am not convinced by this argument.

While I'm not making many predictions about the future (because I don't want to look like an idiot in 12 months' time when I'm inevitably proven wrong), I will say that the software industry is going to change, and open source is going to change, and it is our collective responsibility as members of the software community to make sure that this change is for the benefit of all of us, not special interests and private corporations.

## Updates

This is a developing story – I'll note any updates in here. I wrote this in somewhat of a hurry, so I may also make some incremental improvements to the wording and evidencing behind some bits.
