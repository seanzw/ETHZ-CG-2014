// class for intersection of some conics
function Intersection() {}

Intersection.prototype = {
	intersect: function(origin, direction) {
		var t = MAX_DISTANCE;
		var t_min_arr = new Array();
		var t_max_arr = new Array();
		for (var i = 0; i < this.conics.length; ++i) {
			var t_temp = this.conics[i].intersect_range(origin, direction);
			t_min_arr.push(t_temp[0]);
			t_max_arr.push(t_temp[1]);
		}
		var result = this.findIntersect(t_min_arr, t_max_arr);
		var t_min = result[0];
		var t_max = result[1];
		var index = result[2];
		if (t_min < t_max && t_min > 0) {
			t = t_min;
		} else if (t_min < 0 && t_max > 0) {
			t = t_max;
		}
		var hit = origin.add(direction.multiply(t));
		return [t, index, hit.x, hit.y, hit.z];
	},

	// find the intersect of all the range
	// index tells which conic is hit by the ray
	findIntersect: function(data_min, data_max) {
		var t_min = - MAX_DISTANCE;
		var t_max = MAX_DISTANCE;
		var index = -1;
		for (var i = 0; i < data_min.length; ++i) {
			t_min = Math.max(data_min[i], t_min);
			t_max = Math.min(data_max[i], t_max);
			if (t_min == data_min[i]) {
				index = i;
			}
		}
		return [t_min, t_max, index];
	},

	intersectS: function(origin, direction) {
		var t = MAX_DISTANCE;
		for (var i = 0; i < this.conics.length; ++i) {
			var t_temp = this.conics[i].intersect(origin, direction);
			if (t_temp < MAX_DISTANCE) {
				return t_temp;
			}
		}
		return t;
	},

	getMaterial: function(result) {
		return this.conics[result[1]].getMaterial();
	},

	normal: function(result) {
		var hit = $V(result[2], result[3], result[4]);
		return this.conics[result[1]].normal(hit);
	},

	getBoundBox: function() {
		return this.boundBox;
	}
};

Intersection.createNew = function(conic1, conic2) {
	var I = new Intersection();
	I.conics = new Array();
	I.conics.push(conic1);
	I.conics.push(conic2);
	I.boundBox = conic1.getBoundBox().union(conic2.getBoundBox());
	return I;
}
