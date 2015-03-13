function Conic() {}

Conic.prototype = {
	// the ray can be represented as O + tM
	// the intersect point should satisfy:
	// (O + tM)' * C * (O + tM) = 0
	// t^2 * M' * C * M + t * (M' * C * O + O' * C * M) + O' * C * O = 0
	intersect: function(origin, direction) {
		var t 	= MAX_DISTANCE;
		var M 	= origin.add(direction).toVector4();
		var O 	= origin.toVector4();
		var CM 	= this.mat.multiplyVec4(M);
		var CO 	= this.mat.multiplyVec4(O);
		var a 	= M.dot(CM);
		var b 	= M.dot(CO) + O.dot(CM);
		var c 	= O.dot(CO);
		if (Math.abs(a) > EPSILON) {
			var det = b * b - 4 * a * c;
			if (det <= 0) {
				return t;
			} else {
				var det_sqrt = Math.sqrt(det);
				var t1 = (- b - det_sqrt) / 2 / a;
				var t2 = (- b + det_sqrt) / 2 / a;
				var hit1 = (O.add(M.multiply(t1))).toVector3();
				if (hit1 == 'infinite') {
					t1 = MAX_DISTANCE;
				} else{
					t1 = hit1.subtract(origin).dot(direction);
				};
				var hit2 = (O.add(M.multiply(t2))).toVector3();
				if (hit2 == 'infinite') {
					t2 = MAX_DISTANCE;
				} else{
					t2 = hit2.subtract(origin).dot(direction);
				};
				var t_min_temp = Math.max(Math.min(t1, t2), 0);
				if (t_min_temp > EPSILON) {
					t = t_min_temp;
				}
				return t;
			}
		} else {
			var t_min_temp = - c / b;
			var hit = (O.add(M.multiply(t_min_temp))).toVector3();
			if (hit == 'infinite') {
					t_min_temp = MAX_DISTANCE;
				} else{
					t_min_temp = hit.subtract(origin).dot(direction);
				};
			if (t_min_temp > EPSILON) {
				t = t_min_temp;
			}
			return t;
		}
	},

	// the same as intersect, but return the t_min and t_max
	// used in bool operation
	intersect_range: function(origin, direction) {
		var t_min 	= - MAX_DISTANCE;
		var t_max	= - MAX_DISTANCE;
		var M 		= origin.add(direction).toVector4();
		var O 		= origin.toVector4();
		var CM 		= this.mat.multiplyVec4(M);
		var CO 		= this.mat.multiplyVec4(O);
		var a 		= M.dot(CM);
		var b 		= M.dot(CO) + O.dot(CM);
		var c 		= O.dot(CO);
		if (Math.abs(a) > EPSILON) {
			var det = b * b - 4 * a * c;
			if (det <= 0) {
				return [t_min, t_max];
			} else {
				var det_sqrt = Math.sqrt(det);
				var t1 = (- b - det_sqrt) / 2 / a;
				var t2 = (- b + det_sqrt) / 2 / a;
				var hit1 = (O.add(M.multiply(t1))).toVector3();
				if (hit1 === 'infinite') {
					t1 = this.judgeInfinite(c, origin, direction);
				} else {
					t1 = hit1.subtract(origin).dot(direction);
				}
				var hit2 = (O.add(M.multiply(t2))).toVector3();
				if (hit2 === 'infinite') {
					t2 = this.judgeInfinite(c, origin, direction);
				} else {
					t2 = hit2.subtract(origin).dot(direction);
				}

				var t_max_temp = Math.max(t1, t2);
				var t_min_temp = Math.min(t1, t2);
				if (t_min_temp > EPSILON) {
					t_min = t_min_temp;
				}
				if (t_max_temp > EPSILON) {
					t_max = t_max_temp;
				}
				return [t_min, t_max];
			}
		} else {
			var t_min_temp = - c / b;
			var hit = (O.add(M.multiply(t_min_temp))).toVector3();
			if (hit == 'infinite') {
				t_min_temp = this.judgeInfinite(c, origin, direction);
			} else {
				t_min_temp = hit.subtract(origin).modulus();
			}
			if (t_min_temp > EPSILON) {
				t_min = t_min_temp;
				t_max = MAX_DISTANCE;
			}
			return [t_min, t_max];
		}
	},

	normal: function(point) {
		var homo = point.toVector4();
		var norm = this.mat.multiplyVec4(homo);
		norm.w = 1;
		norm = norm.toUnitVector3();
		return norm;
	},

	getMaterial: function() {
		return this.material;
	},

	getBoundBox: function() {
		return Box.createNew();
	},

	// when the hit point is infinite point
	// this function tells the point is inside or outside
	judgeInfinite: function(c, origin, direction) {
		var M = origin.add(direction.multiply(MAX_DISTANCE)).toVector4();
		var d = M.dot(this.mat.multiplyVec4(M));
		if (Math.abs(c) < EPSILON) {
			c = 1;
		}
		if (c * d > 0) {
			return - MAX_DISTANCE;
		} else {
			return MAX_DISTANCE;
		}
	}
};

// suppose a point in homogenius coordinate
// M = [X Y Z W]'
// C is the 4 by 4 conic matrix
// M'CM = 0
// x2 * X^2 + y2 * Y^2 + z2 * Z^2 + w2 * W^2 + xy * X * Y + xz * X * Z + yz * Y * Z + xw * X * W + yw * Y * W + zw * Z * W = 0
// C = [x2 		xy/2 	xz/2 	xw/2
// 	 	xy/2 	y2		yz/2	yw/2
// 	 	xz/2 	yz/2	z2		zw/2
// 	 	xw/2	yw/2	zw/2	w2  ]
Conic.createNew = function(x2, y2, z2, w2, xy, xz, xw, yz, yw, zw) {
	var C = new Conic();
	C.mat = Matrix4.createNew(x2, xy/2, xz/2, xw/2, xy/2, y2, yz/2, yw/2, xz/2, yz/2, z2, zw/2, xw/2, yw/2, zw/2, w2);
	C.material = Material.createNew();
	return C;
}