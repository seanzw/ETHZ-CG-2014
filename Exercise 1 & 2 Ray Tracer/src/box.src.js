function Box() {}

Box.prototype = {
	intersect: function(origin, direction) {
		RIC.addIntersect();
		var tMin 	= this.min.subtract(origin).dotDivide(direction);
		var tMax 	= this.max.subtract(origin).dotDivide(direction);
		var t1 	 	= tMin.min(tMax);
		var t2		= tMin.max(tMax);
		var tNear 	= Math.max(t1.x, t1.y, t1.z);
		var tFar	= Math.min(t2.x, t2.y, t2.z);
		if (tNear > tFar) {
			return MAX_DISTANCE;
		} else {
			if (tNear > 0) {
				return tNear;
			} else if (tFar > 0) {
				return tFar;
			} else {
				return MAX_DISTANCE;
			}
		}
	},

	setFromBox: function(box) {
		this.min = box.min.dup();
		this.max = box.max.dup();
		this.surface = box.surface;
	},

	setMinMax: function(min, max) {
		this.min = min.min(max);
		this.max = max.max(max);
		this.surface = this.getSurface();
	},

	split: function(axis, ratio, box_1, box_2) {
		var min_new = this.min.dup();
		var max_new = this.max.dup();
		switch(axis) {
			case 'x': {
				var x_delta = this.max.x - this.min.x;
				max_new.x = min_new.x = this.min.x + ratio * x_delta;
				break;
			}
			case 'y': {
				var y_delta = this.max.y - this.min.y;
				max_new.y = min_new.y = this.min.y + ratio * y_delta;
				break;
			}	
			case 'z': {
				var z_delta = this.max.z - this.min.z;
				max_new.z = min_new.z = this.min.z + ratio * z_delta;
				break;
			}
			default: break;
		}
		box_1.setMinMax(this.min, max_new);
		box_2.setMinMax(min_new, this.max);
	},

	getSurface: function() {
		var diag = this.max.subtract(this.min);
		return 2 * (diag.x * diag.y + diag.x * diag.y + diag.y * diag.z);
	},

	getSurfaceRatio: function(axis, ratio) {
		var diag = this.max.subtract(this.min);
		var xy   = diag.x * diag.y;
		var yz   = diag.y * diag.z;
		var xz   = diag.x * diag.z;
		var sur  = xy + yz + xz;
		switch (axis) {
			case 'x': {
				var pro1 = (yz + ratio * (xy + xz)) / sur;
				var pro2 = (yz + (1 - ratio) * (xy + xz)) / sur;
				return [pro1, pro2];
			}
			case 'y': {
				var pro1 = (xz + ratio * (xy + yz)) / sur;
				var pro2 = (xz + (1 - ratio) * (xy + yz)) / sur;
				return [pro1, pro2];
			}
			case 'z': {
				var pro1 = (xy + ratio * (yz + xz)) / sur;
				var pro2 = (xy + (1 - ratio) * (yz + xz)) / sur;
				return [pro1, pro2];
			}
		}
	},

	vertexInside: function(v) {
		if (v.x >= this.min.x && v.x <= this.max.x &&
			v.y >= this.min.y && v.y <= this.max.y &&
			v.z >= this.min.z && v.z <= this.max.z) {
			return true;
		}
		return false;
	},

	triOutsideSlab: function(v1, v2, v3) {
		if (v1.x < this.min.x &&
			v2.x < this.min.x &&
			v3.x < this.min.x) {
			return true;
		}

		if (v1.x > this.max.x &&
			v2.x > this.max.x &&
			v3.x > this.max.x) {
			return true;
		}

		if (v1.y < this.min.y &&
			v2.y < this.min.y &&
			v3.y < this.min.y) {
			return true;
		}

		if (v1.y > this.max.y &&
			v2.y > this.max.y &&
			v3.y > this.max.y) {
			return true;
		}

		if (v1.z < this.min.z &&
			v2.z < this.min.z &&
			v3.z < this.min.z) {
			return true;
		}

		if (v1.z > this.max.z &&
			v2.z > this.max.z &&
			v3.z > this.max.z) {
			return true;
		}

		return false;
	},

	getDiagonals: function() {
		var arr = new Array(8);
		arr[0] = this.min;
		arr[1] = this.max.subtract(arr[0]).toUnitVectorN();
		arr[2] = $V(this.max.x, this.min.y, this.min.z);
		arr[3] = $V(this.min.x, this.max.y, this.max.z).subtract(arr[2]).toUnitVectorN();
		arr[4] = $V(this.min.x, this.max.y, this.min.z);
		arr[5] = $V(this.max.x, this.min.y, this.max.z).subtract(arr[4]).toUnitVectorN();
		arr[6] = $V(this.max.x, this.max.y, this.min.z);
		arr[7] = $V(this.min.x, this.min.y, this.max.z).subtract(arr[6]).toUnitVectorN();
		return arr;
	},

	unionN: function(box) {
		this.min.minN(box.min);
		this.max.maxN(box.max);
		return this;
	},

	union: function(box) {
		var B = Box.createNew();
		B.setFromBox(this);
		return B.unionN(box);
	},

	intersectVoxel: function(box) {
		var min = this.min;
		var max = this.max;
		if (box.min.x > max.x) {
			return false;
		}

		if (box.max.x < min.x) {
			return false;
		}

		if (box.min.y > max.y) {
			return false;
		}

		if (box.max.y < min.y) {
			return false;
		}

		if (box.min.z > max.z) {
			return false;
		}

		if (box.max.z < min.z) {
			return false;
		}

		return true;
	}
};

Box.createNew = function() {
	var B = new Box();
	B.min = $V(0, 0, 0);
	B.max = $V(0, 0, 0);
	B.surface = 0;
	return B;
}