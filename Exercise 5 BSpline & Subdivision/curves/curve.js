
showConstruction = false;
showNodeConnections = true;

var Curve = function() {
	this.timeKnot = new Knot(0,0,true);
	this.knots = new Array();
	this.nodes = new Array();
};

Curve.prototype.draw = function(ctx)
{
    if (showNodeConnections) {
		// Connect nodes with a line
        setColors(ctx,'rgb(10,70,160)');
        for (var i = 1; i < this.nodes.length; i++) {
            drawLine(ctx, this.nodes[i-1].x, this.nodes[i-1].y, this.nodes[i].x, this.nodes[i].y);
        }
		// Draw nodes
		setColors(ctx,'rgb(10,70,160)','white');
		for (var i = 0; i < this.nodes.length; i++) {
			this.nodes[i].draw(ctx);
		}
    }

	ctx.lineWidth = 2;
    setColors(ctx,'black');
    
	// TODO: Draw the curve
    // you can use: drawLine(ctx, x1, y1, x2, y2);
    
    bspline = new BSpline();
    bspline.construct(this.knots, this.nodes);
    for (var i = 1; i < bspline.getNum(); ++i) {
        drawLine(ctx, bspline.getX(i - 1), bspline.getY(i - 1), bspline.getX(i), bspline.getY(i));
    }

	ctx.lineWidth = 1;

    if (this.nodes.length >= 4) {
		// TODO: Show how the curve is constructed
		// you can use: drawLine(ctx, x1, y1, x2, y2);
		// you can use: drawCircle(ctx, x, y, radius);


        // De Boor construction
        if (showConstruction) {
			
			// ...
			var deBoor = bspline.getConstruct(this.timeKnot.value, this.knots, this.nodes);
            if (deBoor != null) {
                for (var i = 1; i < 4; ++i) {

                    

                    // draw the lines
                    setColors(ctx,'rgb(10,70,160)');
                    for (var j = 0; j < deBoor.xTemp[i].length - 1; ++j) {
                        drawLine(ctx, deBoor.xTemp[i][j], deBoor.yTemp[i][j], deBoor.xTemp[i][j + 1], deBoor.yTemp[i][j + 1]);
                    }

                    // draw the nodes
                    setColors(ctx,'rgb(10,70,160)','white');
                    for (var j = 0; j < deBoor.xTemp[i].length; ++j) {
                        var node = new Node(deBoor.xTemp[i][j], deBoor.yTemp[i][j]);
                        node.draw(ctx);
                    }
                }
            }
        }

    }
}

Curve.prototype.addNode = function(x,y)
{
    this.nodes.push(new Node(x,y));
	if (this.knots.length == 0) {
        this.knots.push(new Knot(0,0,false));
        this.knots.push(new Knot(1,1,false));
        this.knots.push(new Knot(2,2,false));
        this.knots.push(new Knot(3,3,false));
        this.knots.push(new Knot(4,4,false));
    } else {
        this.knots.push(new Knot(this.knots[this.knots.length-1].value+1,this.knots.length,false));
    }
}


