
// TODO: implement your bspline code here

var BSpline = function() {
    this.step = 0.01;
    this.degree = 3;
    this.xArr = new Float32Array();
    this.yArr = new Float32Array();
}

BSpline.prototype.construct = function(knots, nodes) {
    if (nodes.length >= 4) {
        var i = 0;
        var curKnot = this.degree;
        var xTemp = new Float32Array(this.degree + 1);
        var yTemp = new Float32Array(this.degree + 1);
        var num = Math.floor((knots[knots.length - this.degree - 1].value - knots[curKnot].value) / this.step);
        this.xArr = new Float32Array(num);
        this.yArr = new Float32Array(num);
        for (var t = knots[curKnot].value + this.step; t <= knots[knots.length - this.degree - 1].value; t += this.step) {
            if (t > knots[curKnot].value) {
                ++curKnot;
            }
            if (i > num - 1) {
                break;
            }
            
            for (var j = 0; j < xTemp.length; ++j) {
                xTemp[j] = nodes[curKnot - this.degree - 1 + j].x;
                yTemp[j] = nodes[curKnot - this.degree - 1 + j].y;
            }

            for (var n = 0; n < this.degree; ++n) {
                for (var k = 0; k < this.degree - n; ++k) {
                    var alpha = (t - knots[curKnot - this.degree + k + n].value) / (knots[curKnot + k].value - knots[curKnot - this.degree + k + n].value);
                    xTemp[k] = (1 - alpha) * xTemp[k] + alpha * xTemp[k + 1];
                    yTemp[k] = (1 - alpha) * yTemp[k] + alpha * yTemp[k + 1];
                }
            }
            this.xArr[i] = xTemp[0];
            this.yArr[i] = yTemp[0];
            ++i;
        }
    }
};

BSpline.prototype.getNum = function() {
    return this.xArr.length;
};

BSpline.prototype.getX = function(i) {
    return this.xArr[i];
};

BSpline.prototype.getY = function(i) {
    return this.yArr[i];
};


BSpline.prototype.getConstruct = function(t, knots, nodes) {
    if (nodes.length >= 4) {
        curKnot = this.degree + 1;
        if (t <= knots[curKnot - 1].value || t >= knots[knots.length - this.degree - 1].value) {
            return;
        }
        while (curKnot <= knots.length - this.degree - 1) {
            if (t > knots[curKnot].value) {
                ++curKnot;
                continue;
            } else {
                var xTemp = new Float32Array(this.degree + 1);
                var yTemp = new Float32Array(this.degree + 1);
                var knotsTemp = new Float32Array(2 * this.degree);
                var deBoor = new DeBoor(this.degree);
                for (var j = 0; j < xTemp.length; ++j) {
                    xTemp[j] = nodes[curKnot - this.degree - 1 + j].x;
                    yTemp[j] = nodes[curKnot - this.degree - 1 + j].y;
                }
                for (var j = 0; j < knotsTemp.length; ++j) {
                    knotsTemp[j] = knots[curKnot - this.degree + j].value;
                }
                deBoor.evaluate(t, xTemp, yTemp, knotsTemp);
                return deBoor;
            }
        }
    }
};


var DeBoor = function(degree) {
    this.degree = degree;
    this.xTemp = new Array(this.degree + 1);
    this.yTemp = new Array(this.degree + 1);
};

DeBoor.prototype.evaluate = function(t, x, y, knots) {
    if (x.length != this.degree + 1 || y.length != this.degree + 1) {
        throw "The length of x, y or knots is not agreed with the degree of the B-Spline.";
    }
    this.xTemp[0] = new Float32Array(this.degree + 1);
    this.yTemp[0] = new Float32Array(this.degree + 1);
    for (var i = 0; i < x.length; ++i) {
        this.xTemp[0][i] = x[i];
        this.yTemp[0][i] = y[i];
    }
    for (var n = 0; n < this.degree; ++n) {
        this.xTemp[n + 1] = new Float32Array(this.degree - n);
        this.yTemp[n + 1] = new Float32Array(this.degree - n);
        for (var k = 0; k < this.degree - n; ++k) {
            var alpha = (t - knots[k + n]) / (knots[k + this.degree] - knots[k + n]);
            this.xTemp[n + 1][k] = (1 - alpha) * this.xTemp[n][k] + alpha * this.xTemp[n][k + 1];
            this.yTemp[n + 1][k] = (1 - alpha) * this.yTemp[n][k] + alpha * this.yTemp[n][k + 1];
        }
    }
};