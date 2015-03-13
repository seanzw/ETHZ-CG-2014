<head profile="http://gmpg.org/xfn/11">

<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />

<meta name="viewport" content="width=device-width, initial-scale = 1 user-scalable=no" />

<meta name = "viewport" content = "height = device-height, initial-scale = 1 user-scalable=no" />

<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

<meta name="keywords" content="ETHZ-CG-2014">

<meta name="description" content="ETHZ-CG-2014">

<meta name="author" content="Zhengrong Wang">

<meta property="og:title" content="ETHZ-CG-2014" />

<meta property="og:type" content="project" />

<meta property="og:url" content="https://zerowong.github.io/ETHZ-CG-2014" />

</head>
ETH-Zuerich Computer Graphics 2014
==========

This is the ETHZ Computer Graphics 2014 assignments, with JavaScript and WebGL. 

- [Ray Tracer](./Exercise 1 & 2 Ray Tracer/rayTracer.html)<br/>
- [BRDF with Perlin Noise](./Exercise 4 & 6 BRDF & Perlin Noise/src/lab_brdf.html)<br/>
- [BSpline](./Exercise 5 BSpline & Subdivision/curves/bsplineEditor.html)<br/>
- [Surface Subdivision](./Exercise 5 BSpline & Subdivision/surfaces/subdivision.html)<br/>

## Ex1 - 2: Ray Tracer

This is a ray tracer. It may be slow since it doesn't using WebGL. You can pass the following module IDs by the get method.

### C1 Boolean operation

Notice that all the implicit surface required here (sphere, plane) can be represented as quardric. So I first implement a conic class. It contains a matrix C and all the points on the conic would satisfy P^{T}CP=0. Hence the ray-object intersection test is just solving a quadratic equation.

The class Intersect is used to hanle the intersection of conics. When doing the ray-object intersection test, we first intersect the ray with all the objects and get the interval [tmin, tmax]. Any point along the ray within the interval are inside the object. Then we find the intersection of all the intervals. If we get null set, then the ray does not intersect the object.

### C2 Texture mapping and bump mapping

For this part there are quite a lot of details to talk about.

- First of all I use the two angular parameters of sphere coordinate as the texture coordinate [u, v]. The advantage of this approach is that the parameters are uniformed over the whole sphere.

- As for the bump mapping, I use the derivative of the sphere coordinate as the base vector of the tangent space, which is also quite easy to calculate.

- I use mipmap to anti-alias. First when the texture is loaded, all the mipmap textures are generated. When the ray hits a point, I calculate the real size of the point. And also the point must be on some horizontal line in the texture, I calculate the real length of this line on the object. With the ratio between the real length of the line and the real size of the hit point can I decide which level of mipmap texture I should use.
To be more spercific, here we are dealing with the sphere. If a ray hits the sphere somewhere, let's say P. Actually every pixel is not a point but also with its width and height in world coordinate, we should also regard P not as a point but as a patch. Hence with similarity we can get the real width of P. Then we calculate the length of the __latitude__ and divide it by the real width of P. This is the ratio we should used in mipmap.

### C3 Triangle Mesh

For this part there is not much to talk about. Just implement the Mesh class and calculate the normal. And without OC tree it's really slow to render it.

For ray-triangle intersect, I use [Möller–Trumbore intersection algorithm](http://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm).

What's more, when it comes to the self intersection problem, since the mesh itself is not a perfect sphere, I get some wierd triangle shadow. I get rid of this by modify the threshold for self intersect. However then the shadow looks un real. I check the referrence picture and it has the same problem.

I think there must be some better way to avoid this. For example I think it would be better if we can determine the threshold locally using the information of adjacent triangles or something. However with the `.obj` format it's difficult to implement.

### D1 OC Tree

I first implement the triangle-voxel intersect test. As for the other primitives such like sphere, I use their bound box to test whether they are intersect with the voxel. This is not the exact solution, but I think it's enough for the generation of the OC Tree.

The OC Tree can be used with the Mesh class or a higher level, Objects class. When used with Mesh, it builds a local OC tree for the mesh itself. And with objects it will build an OC tree for the whole scene and take the mesh (if there is any mesh in the scene) as a single object.

However this naive implementation is very slow. Since it randomly pick an axis and split it at the middle point, it would be a good solution if the objects are unifomly distributed. However here the 1000 spheres are scattered along the z-axis with a cubic function, which makes it realy inefficient.

Therefore I used the cost function of KD tree to improve the OC tree. For each split I first pick 9 positions (from 0.1 to 0.9 with step length 0.1) and calculate the cost. Do this for all three axis and then pick the one with lowest cost.

I also implement a simple class to count the ray intersect test. For this part I used the termination criteria for 10 levels and the cost is 59 intersect test per ray(including the intersect test during searching the OC tree). increasing the max-level doesn't improve the performance as more intersect test with the bound box.

### Bonus 2 Area Light

There is nothing much to talk about here. Just uniformly sample 50 point lights and use them to generate the soft shadow.

### Bonus 3 Ambient Occlusion

I tried to use other objects than sphere, but it just turns out to be so slow. So I just put a sphere and 2 planes. With 50 samples the ambient occlusion is acceptable.

## Ex4 & 6: BRDF and Perlin Noise

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

### Wood
Apply 3D Perlin noise to get a wood texture.

### Marble
Apply 3D Perlin noise to get a marble texture.

### Earth
Use 4D Perlin noise to animate the cloud. And 3D Perlin noise to generate the surface.

## Ex5: BSpline and Surface Subdivision

This the solution for exercise 5.

### BSpline
Not much to say about BSpline. Just use de Boor algorithm to generate points on the spline and connect them.

### Surface Subdivision
#### Loop
Loop's algorithm can only deal with triangle mesh. And it's easy to implement. Use different weight for the boundary and then everything is fine.
#### Catmull-Clark
Here I found three ways to deal with the boundary.([here](http://xrt.wikidot.com/blog:_start/tag/catmull/category/blog)). I choose the second one and the boundary looks quite well.

It takes every boundary edge as infinitely sharp creases, which means the edge point on this boundary edge will be the average of two endpoints of this edge. And all the boundary vertices are treated as creases vertices. The new vertice is a weighted average of the old vertice (3/4) and two other boundary vertices(1/8).