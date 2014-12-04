ethz-computer-graphics-BRDF
===========================
This is my solution to BRDF exercise of ethz computer graphics 2014. There are two materials, polished steel and hematite. The default material is steel. If you want to get hematite, please adjust the parameters as described in each BRDF. You can always modify the brightness by changing the intensity of the three point light source.

### Lambertian
The Lambertian BRDF is not enought to simulate the steel and hematite since there is no specular term.

### Phong
Phong is not enought to render the steel as it always gives a plastic feeling. The only thing we can do is modify the shineness of the material. Hematite looks good.

### Blinn-Phong
Blinn-Phong uses the halfway vector and simplify the calculation. Steel still looks like plastic.

### Ward
Ward's anisotropic model is enough to model these two materials. I find a precise and cheaper formula from [Cornell University](http://www.graphics.cornell.edu/~bjw/wardnotes.pdf). For steel alphaX is 0.2 and alphaY = 0.8. For Hematite alphaX = alphaY = 0.2. And the result is pretty good.

### Cook-Torrance
Here the steel looks nice. The hematite is also very good. And I use two weighted Beckmann distributions.

For Steel the IOR is 2.5. 

For Hematite the IOR is 2.9. The both Beckmann distribution is set to 0.2. Kd equals 0.3.


### Spatially Varying BRDF
I tried to use perlin noise but still can't figure out how to generate the rusty steel. Here I just generate some weird marble texture. The generator of perlin noise comes from [here](https://github.com/ashima/webgl-noise)