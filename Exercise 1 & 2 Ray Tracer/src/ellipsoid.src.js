// ellipsoid class
// the ellipsoid should be alined along axis x, y, z
// TO DO: support any ellipsoid with rotate transform

function Ellipsoid() {}

Ellipsoid.prototype = {
	intersect: function(origin, direction) {
		var originHomo = origin.toVector4();
		var originNew = this.transMat.multiplyVec4(originHomo);
		originNew = originNew.toVector3();

		var point = origin.add(direction);
		var pointHomo = point.toVector4();
		var pointNew = this.transMat.multiplyVec4(pointHomo);
		pointNew = pointNew.toVector3();

		var directionNew = pointNew.subtract(originNew);
		directionNew.toUnitVectorN();

		// do the intersect detect with a unit sphere centered at (0, 0, 0)
		var t = MAX_DISTANCE;
		var l = originNew.dot(originNew);
		if (l > 1) {
			var d = -originNew.dot(directionNew);
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

		// check if we have intersect
		if (t == MAX_DISTANCE) {
			return t;
		} else {
			// get the hitPoint and normal vector in 3-D world
			var hit = originNew.add(directionNew.multiply(t));
			hit = hit.toVector4();
			hit = this.transMatInv.multiplyVec4(hit);
			hit = hit.toVector3();
			hit = hit.subtractN(origin);
			t = hit.modulus();
			return t;
		}
	},

	normal: function(point) {
		var x = point.x;
		var y = point.y;
		var z = point.z;
		var tanVec1 = $V(- (y - this.center.y) * this.rx * this.rx, (x - this.center.x) * this.ry * this.ry, 0);
		var tanVec2 = $V(0, (z - this.center.z) * this.ry * this.ry, - (y - this.center.y) * this.rz * this.rz);
		var normal = tanVec2.cross(tanVec1);
		var pro = normal.dot(point.subtract(this.center));
		if (pro < 0) {
			normal.multiplyN(-1);
		}
		normal.toUnitVectorN();
		return normal;
	}


};

Ellipsoid.createNew = function(center, rx, ry, rz) {
	var E = new Ellipsoid();
	E.transMat = Matrix4.createNew(1 / rx, 0, 0, -center.x / rx, 0, 1 / ry, 0, -center.y / ry, 0, 0, 1 / rz, -center.z / rz, 0, 0, 0, 1);
	E.transMatInv = Matrix4.createNew(rx, 0, 0, center.x, 0, ry, 0, center.y, 0, 0, rz, center.z, 0, 0, 0, 1);
	E.material = Material.createNew();
	E.center = center;
	E.rx = rx;
	E.ry = ry;
	E.rz = rz;
	return E;
}