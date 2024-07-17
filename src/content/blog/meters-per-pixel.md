---
title: Calculating meters per pixel from aerial photographs
description: Calculate the meters per pixel of a camera from its resolution, height, and angle of view.
date: 2014-07-21
tags: [science]
---

## Aim

Say you're doing some aerial photogrammetry, for scientific purposes. Then you need to know those pernickety little details like the resolution that your pictures will produce, and the precision you can infer from this. This post shows how to calculate how many meters each pixel of a photo taken by a particular camera corresponds to, given the required information.

The trigonometry assumes that you are flying a UAV with the camera facing directly downwards. The example values given are those taken from the Canon Ixus 132 I am using for my aerial photogrammetry project.

## Trigonometry

Firstly, let's look at how we can go from the information we have to the information we need. We need to know the following to completely determine the <abbr title="Meters Per Pixel">MPP</abbr> (meters per pixel):

* Resolution of the camera
* Height from which photo was taken
* Angle of view of the camera

Then let us parametrise the situation as follows:

* Ground distances photographed in horizontal and vertical, respectively: $$x$$ and $$y$$
* Resolution of camera: $$r_x$$ and $$r_y$$
* Height from which photo was taken: $$h$$
* Angle of view of the camera: $$\alpha_x$$ and $$\alpha_y$$
* MMP: $$\mu_x$$ and $$\mu_y$$

The following diagrams illustrate the horizontal and vertical views that the camera sees:

![horizontal view](/media/archive/meters-per-pixel/horizontal_view.svg)

-----

![vertical view](/media/archive/meters-per-pixel/vertical_view.svg)

It is clear by basic trigonometry that the tangent of half the angle of view is equal to half the ratio of the ground distance and the height. As parametrised:

$$
\tan\left(\frac{\alpha_x}{2}\right) = \frac{x}{2h}
$$

$$
\tan\left(\frac{\alpha_y}{2}\right) = \frac{y}{2h}
$$

Rearranging this for $$x$$ and $$y$$:

$$
x = 2h\tan\left(\frac{\alpha_x}{2}\right)
$$

$$
y = 2h\tan\left(\frac{\alpha_y}{2}\right)
$$

Then the MMP is given by:

$$
\mu_x = \frac{x}{r_x} = \frac{2h\tan\left(\frac{\alpha_x}{2}\right)}{r_x}
$$

$$
\mu_y = \frac{y}{r_y} = \frac{2h\tan\left(\frac{\alpha_y}{2}\right)}{r_y}
$$

## Finding camera resolution

The camera resolution should be displayed on the camera specifications, or in the camera settings dialogue. If you don't have access to this information, it can also be read directly from the EXIF metadata using [`exiftool`](http://www.sno.phy.queensu.ca/~phil/exiftool/):

```bash showLineNumbers
> exiftool photo.jpg
...
Image Size: 4608x3456 # This is the camera resolution
...
```

## Finding angle of view

The angle of view of a camera can be calculated from the camera's effective focal length, $$f$$ (which excluding macro photography is approximately equal to the stated focal length), and the dimension of the sensor in that direction, $$d$$ as follows:

$$
\alpha = 2\arctan\left(\frac{d}{2f}\right)
$$

The focal length is stated on the camera specs. For my Ixus 132 the stated focal length is 5.0 mm.

To find the dimension of the camera sensor, you need to know what type of sensor it is. It'll either be a CCD sensor (Charge Coupled Device) or a CMOD sensor (Complementary Metal-Oxide Semiconductor).

This image, courtesy of [gizmag](http://www.gizmag.com/camera-sensor-size-guide/26684/pictures#1), show the dimensions of various common sensor sizes:

![sensor sizes](/media/archive/meters-per-pixel/sensor_sizes.jpg)

If your sensor is not listed here, then Wikipedia has a full table of listings for every sensor imaginable over on the page for [Image sensor format](https://en.wikipedia.org/wiki/Image_sensor_format#Table_of_sensor_formats_and_sizes).

For instance, my camera has a 1/2.3" CCD, meaning it has dimensions 6.17 mm by 4.55 mm.

Thus, plugging these values into the equation above, my camera has angles of view of:

$$
\alpha_x = 63.3^{\circ}
$$

$$
\alpha_y = 48.9^{\circ}
$$

## Conclusion

Then plugging these values into the formula given above, the MMP as a function of height is:

$$
\mu_x = 0.2675h ~\text{mm/pixel}
$$

$$
\mu_y = 0.2631h ~\text{mm/pixel}
$$

Where $$h$$ is in meters. Thus at a typical UAV flight height of $$h = 100~\text{m}$$ , the MMP is 2.68 cm per pixel in the horizontal and 2.63 cm per pixel in the vertical.
