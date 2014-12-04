// Sphere class
// ---------------------------------
// intersect will return an array result
// result[0] = t
// result[1] = (hit - center).x
// result[2] = (hit - center).y
// result[3] = (hit - center).z

function Sphere() {}

Sphere.prototype = {
	intersect: function(origin, direction) {
		RIC.addIntersect();
		var t = MAX_DISTANCE;
		var result = new Array(4);
		result[0] = MAX_DISTANCE;
		var r2 = this.r * this.r;
		var toSphere = this.center.subtract(origin);
		var l = toSphere.dot(toSphere);
		if (l > r2) {
			var d = toSphere.dot(direction);
			if (d <= 0) {
				return t;
			}
			var thc = r2 - l + d * d;
			if (thc <= 0) {
				return t;
			}
			var thc_sqr = Math.sqrt(thc);
			var t_temp = d - thc_sqr;
			if (t_temp > EPSILON) {
				t = t_temp;
				result[0] = t;
				var hit = origin.add(direction.multiply(t)).subtract(this.center);
				result[1] = hit.x;
				result[2] = hit.y;
				result[3] = hit.z;
			} else {
				// if the nearer point is itself
				// check the further point
				t_temp = d + thc_sqr;
				if (t_temp > EPSILON) {
					t = t_temp;	
					result[0] = t;
					var hit = origin.add(direction.multiply(t)).subtract(this.center);
					result[1] = hit.x;
					result[2] = hit.y;
					result[3] = hit.z;
				}
			}
			return result;
		} else {
			var d = toSphere.dot(direction);
			var thc = r2 - l + d * d;
			t_temp = Math.sqrt(thc) + d;
			if (t_temp > EPSILON) {
				// check if the intersection point is itself
				t = t_temp;	
				result[0] = t;
				var hit = origin.add(direction.multiply(t)).subtract(this.center);
				result[1] = hit.x;
				result[2] = hit.y;
				result[3] = hit.z;
			}
			return result;
		}
	},

	intersectS: function(origin, direction) {
		var t = MAX_DISTANCE;
		var r2 = this.r * this.r;
		var toSphere = this.center.subtract(origin);
		var l = toSphere.dot(toSphere);
		if (l > r2) {
			var d = toSphere.dot(direction);
			if (d <= 0) {
				return t;
			}
			var thc = r2 - l + d * d;
			if (thc <= 0) {
				return t;
			}
			var thc_sqr = Math.sqrt(thc);
			var t_temp = d - thc_sqr;
			if (t_temp > EPSILON) {
				t = t_temp;
			} else {
				// if the nearer point is itself
				// check the further point
				t_temp = d + thc_sqr;
				if (t_temp > EPSILON) {
					t = t_temp;
				}
			}
			return t;
		} else {
			var d = toSphere.dot(direction);
			var thc = r2 - l + d * d;
			t_temp = Math.sqrt(thc) + d;
			if (t_temp > EPSILON) {
				// check if the intersection point is itself
				t = t_temp;
			}
			return t;
		}
	},

	intersectVoxel: function(box) {
		return this.boundBox.intersectVoxel(box);
	},

	normal: function(result) {
		var normal = $V(result[1], result[2], result[3]);
		return normal.toUnitVectorN();
	},

	getMaterial: function(result) {
		return this.material;
	},

	// return the nomal vector using normal texture
	// the vector is defined in the tangent space
	normalFromTexture: function(point, vector) {
		var n 		= point.subtract(this.center).toUnitVectorN();
		var t 		= $V(-n.y, n.x, 0).toUnitVectorN();
		var b 		= n.cross(t);
		var normal 	= t.multiply(vector.x);
		normal.addN(b.multiply(vector.y));
		return normal.addN(n.multiply(vector.z));
	},

	// map the point into 2-D texture coordinate
	// using this.north and this.prime vector
	getTextureCoordinate: function(point) {
		var point = point.subtract(this.center);
		var v 	  = 1 - Math.min(Math.acos(point.dot(this.north) / this.r) / Math.PI, 1);
		var dot   = point.dot(this.north);
		point 	  = point.subtract(this.north.multiply(dot));
		var cos   = point.dot(this.prime) / point.modulus();
		var theta = Math.acos(cos);
		var d 	  = point.dot(this.left);
		if (d > 0) {
			theta = Math.PI - theta;
		} else {
			theta = Math.PI + theta;
		}
		var u 	  = theta / 2 / Math.PI;
		return [u, v];
	},

	getSize: function() {
		return 2 * Math.PI * this.r;
	},

	setNorthandPrime: function(north, prime) {
		this.north = north.toUnitVector();
		var tangent = this.north.multiply(prime.dot(this.north));
		this.prime = prime.subtractN(tangent).toUnitVectorN();
		this.left = this.prime.cross(this.north);
	},

	bindTexture: function(textureID) {
		this.useTexture = true;
		this.textureID = textureID;
	},

	bindNormalTexture: function(textureID) {
		this.useNormalTexture = true;
		this.normalTextureID = textureID;
	},

	getBoundBox: function() {
		return this.boundBox;
	},

	calculateBoundBox: function() {
		var tem = $V(this.r, this.r, this.r)
		var min = this.center.subtract(tem);
		var max = this.center.add(tem);
		var box = Box.createNew();
		box.setMinMax(min, max);
		return box;
	}
};

Sphere.createNew = function(R, x, y, z) {
	var S = new Sphere();
	S.center = $V(x, y, z);
	S.north = $V(0, 0, 0);
	S.prime = $V(0, 0, 0);
	S.left 	= $V(0, 0, 0);
	S.useTexture = false;
	S.textureID = -1;
	S.useNormalTexture = false;
	S.normalTextureID = -1;
	S.r = R;
	S.material = Material.createNew();
	S.boundBox = S.calculateBoundBox();
	return S;
}