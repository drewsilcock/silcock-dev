---
title: Calculating the overlap of aerial photos
description: Calculate the overlap of aerial photos for photogrammetry.
date: 2014-07-31
tags: [science]
---

The setup is as follows: you have a camera attached to a UAV which is taking pictures regularly every five seconds, and you need at least 80% overlap between the photos in order to properly stitch them together into a Digital Elevation Model (DEM). What do you do? How far apart should each photo be? How fast do you need to fly your UAV in order to achieve this?

This post demonstrates how to go about calculating the required maximum distance between successive photos in order to ensure a certain percentage overlap between those photos, as a function of the required overlap, the angle of view of the camera and your height above the ground.

I then go on to show how to simply work out how fast you need to fly your UAV to achieve this overlap, given the time between successive photographs.

## Calculating inter-photo distance

The geometry of the situation is shown below:

![geometry of overlap](/media/archive/calculating-overlap/overlap.svg)

Let's call the inter-photo distance $$ d_{int} $$, the angle of view $$ \alpha_y $$, the height $$ h $$ and the required overlap fraction $$ \omega $$ (i.e. if we want 80% overlap, then $$ \omega = 0.8 $$).

$$
d_{int}      = 2h\tan\left(\frac{\alpha_y}{2}\right) - \text{overlap}
$$
$$
~~~~~~~~~~~~~~~~~~ = 2h\tan\left(\frac{\alpha_y}{2}\right) - 2h\omega\tan\left(\frac{\alpha_y}{2}\right)
$$
$$
~            = 2h\tan\left(\frac{\alpha_y}{2}\right)\left[ 1 - \omega \right]
$$

## Calculating UAV speed

The speed that a UAV must fly at, $$v_{UAV}$$ , given the time interval between successive photos, $$t_{int}$$, is then simply given by:

$$
v_{UAV} = \frac{d_{int}}{t_{int}} = \frac{2h\tan\left(\frac{\alpha_y}{2}\right)\left[ 1 - \omega \right]}{t_{int}}
$$

Taking a reasonable value for the angle of view, $$\alpha_y = 48.9^{\circ}$$, the time interval betweem successive photos, $$t_{int} = 5$$ seconds and taking $$\omega = 0.8$$ thus gives the very reasonable value for the velocity of the UAV as:

$$
v_{UAV} = 0.182h ~ \text{meters/second}
$$

So if you're taking photos at a reasonable $$ h = 50 $$ meters, then:

$$
v_{UAV} = 9.09 ~ \text{meters/second}
$$

Luckily, this is a very reasonable value! (Remembering that this is the *maximum* speed you can go before your overlap becomes too small for proper photogrammetry.)
