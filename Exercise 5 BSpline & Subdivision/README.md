ethz-computer-graphics-BSpline & Surface Subdivision
===========================
This the solution for exercise 5.

### BSpline
Not much to say about BSpline. Just use de Boor algorithm to generate points on the spline and connect them.

### Surface Subdivision
#### Loop
Loop's algorithm can only deal with triangle mesh. And it's easy to implement. Use different weight for the boundary and then everything is fine.
#### Catmull-Clark
Here I found three ways to deal with the boundary.([here](http://xrt.wikidot.com/blog:_start/tag/catmull/category/blog)). I choose the second one and the boundary looks quite well.

It takes every boundary edge as infinitely sharp creases, which means the edge point on this boundary edge will be the average of two endpoints of this edge. And all the boundary vertices are treated as creases vertices. The new vertice is a weighted average of the old vertice (3/4) and two other boundary vertices(1/8).