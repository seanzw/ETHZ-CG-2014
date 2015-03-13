// infinite cylinder class

function Cylinder() {}

Cylinder.prototype = {
	// constant for axis
	infinite: 100000,

	intersect: function(origin, direction) {
		// first map the vectors into 2-D
		var origin2D = origin.dotMultiply(this.axis);
		var direction2D = direction.dotMultiply(this.axis);
		var ratio = direction2D.modulus();


		// transform the elliptic cylinder into a unit cylinder
		// get the new origin
		var originHomo = origin2D.toVector4();
		var originNew = this.transMat.multiplyVec4(originHomo);
		originNew = originNew.toVector3();

		// get the new direction
		var point = origin2D.add(direction2D);
		var pointHomo = point.toVector4();
		var pointNew = this.transMat.multiplyVec4(pointHomo);
		pointNew = pointNew.toVector3();

		var directionNew = pointNew.subtract(originNew);
		directionNew.toUnitVectorN();

		var t = MAX_DISTANCE;
		var l = originNew.dot(originNew);
		if (l > 1) {
			var d = - originNew.dot(directionNew);
			if (d > 0) {
				var thc = 1 - l + d * d;
				if (thc > 0) {
					var thcSqr = Math.sqrt(thc);
					var t_temp = d - thcSqr;
					if (t_temp > EPSILON) {
						t = t_temp;
					} else {
						t_temp = d + thcSqr;
						if (t_temp > EPSILON) {
							t = t_temp;
						}
					}
				}
			}
		} else {
			var d = -originNew.dot(directionNew);
			var thc = 1 - l + d * d;
			t_temp = Math.sqrt(thc) + d;
			if (t_temp > EPSILON) {
				t = t_temp;
			}
		}

		if (t == MAX_DISTANCE) {
			return t;
		} else {
			var hit = originNew.add(directionNew.multiply(t));
			hit = hit.toVector4();

			// map this back to real world
			hit = this.transMatInv.multiplyVec4(hit);
			hit = hit.toVector3();
			hit = hit.subtractN(origin);
			t = hit.modulus();

			// use the ratio to get the real t
			t /= ratio;
			return t;
		}

	},

	normal: function(point) {
		var point2D = point.dotMultiply(this.axis);
		var point2DHomo = point2D.toVector4();
		var tanVec1 = this.transNorm.multiplyVec4(point2DHomo);
		var tanVec2 = $V(1, 1, 1).subtractN(this.axis);
		tanVec1 = tanVec1.toVector3();
		var normal = tanVec1.cross(tanVec2);
		normal.dotMultiplyN(this.axis);
		var pro = point2D.dot(normal);
		if (pro < 0) {
			normal.multiplyN(-1);
		}
		normal.toUnitVectorN();
		return normal;
	}
};

// axis should be a 3-D vector
// for example, if the axis is y-axis, then axis should be $V(1, 0, 1), and ry should just be 1
Cylinder.createNew = function(rx, ry, rz, axis) {
	var C = new Cylinder();
	C.transMat = Matrix4.createNew(1 / rx, 0, 0, 0, 0, 1 / ry, 0, 0, 0, 0, 1 / rz, 0, 0, 0, 0, 1);
	C.transMatInv = Matrix4.createNew(rx, 0, 0, 0, 0, ry, 0, 0, 0, 0, rz, 0, 0, 0, 0, 1);
	C.transNorm = Matrix4.createNew(0, - rx * rx, - rx * rx, 0, ry * ry, 0, - ry * ry, 0, rz * rz, rz * rz, 0, 0, 0, 0, 0, 1);
	C.axis = axis;
	C.material = Material.createNew();
	return C;
}