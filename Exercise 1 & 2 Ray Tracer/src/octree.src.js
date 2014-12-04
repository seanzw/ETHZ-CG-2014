function OCTree () {}

OCTree.prototype = {
	generate: function(obj) {
		this.obj = obj;
		this.box = obj.getBoundBox();

		this.root = OCLeafNode.createNew();
		var ini_index = obj.getIndex();
		this.root.setPrimitive(ini_index);

		// this.root = this.root.recurSplitWithoutAxis(0.5, this.box, this.obj, this.max_level, 0, this.min_objs, 'z');
		this.root = this.root.recurSplitAuto(this.box, this.obj, this.max_level, 0, this.min_objs);
	},

	intersect: function(origin, direction, hit, normal, material) {
		return this.root.recurIntersect(origin, direction, this.box, this.obj);
	}
};

OCTree.createNew = function(max_level, min_objs) {
	var O = new OCTree();
	O.root = null;
	O.box = null;
	O.obj = null;
	O.max_level = max_level;
	O.min_objs = min_objs;
	O.level = 0;
	return O;
}

function OCInternalNode () {}

OCInternalNode.prototype = {
	setLeft: function(left) {
		this.left = left;
	},

	setRight: function(right) {
		this.right = right;
	},

	toString: function() {
		return 'internal';
	},

	setFromInternalNode: function(node) {
		this.axis = node.axis;
		this.ratio = node.ratio;
		this.left = node.left;
		this.right = node.right;
	},

	getChildBox: function(box, box_left, box_right) {
		box.split(this.axis, this.ratio, box_left, box_right);
	},

	recurIntersect: function(origin, direction, box, obj) {
		var t = box.intersect(origin, direction);
		if (t == MAX_DISTANCE) {
			var result = new Array(1);
			result[0] = MAX_DISTANCE;
			return result;
		}

		var box_left  	 = Box.createNew();
		var box_right 	 = Box.createNew();
		var result_right = new Array(5);
		var result_left  = new Array(5);
		this.getChildBox(box, box_left, box_right);
		
		if (this.left.toString() == 'leaf') {
			var t_left = box_left.intersect(origin, direction);
			if (t_left < MAX_DISTANCE) {
				result_left = this.left.intersect(origin, direction, obj);
			} else {
				result_left[0] = MAX_DISTANCE;
			}	
		} else {
			result_left = this.left.recurIntersect(origin, direction, box_left, obj);
		}

		if (this.right.toString() == 'leaf') {
			var t_right = box_right.intersect(origin, direction);
			if (t_right < MAX_DISTANCE) {
				result_right = this.right.intersect(origin, direction, obj);
			} else {
				result_right[0] = MAX_DISTANCE;
			}	
		} else {
			result_right = this.right.recurIntersect(origin, direction, box_right, obj);
		}

		if (result_left[0] < result_right[0]) {
			return result_left;
		} else {
			return result_right;
		}
	}
};

// create a new internal oc tree node
// ----------------------------------------
// @parameter: axis 		-	 the axis to split
// @parameter: coodrdinate	-	 where to split, belongs to [0, 1]
OCInternalNode.createNew = function(axis, ratio) {
	var O = new OCInternalNode();
	O.axis = axis;
	O.ratio = ratio;
	O.left = null;
	O.right = null;
	return O;
}

function OCLeafNode() {}

OCLeafNode.prototype = {
	// push new primitive into the list
	// i is the index of the primitive
	pushPrimitive: function(i) {
		this.primitives.push(i);
		return this.primitives;
	},

	setPrimitive: function(arr) {
		this.primitives = arr;
	},

	// return a OCInternal node conatining two leaf nodes
	// -----------------------------------------------------
	// @parameter: axis				-	which axis to split
	// @parameter: ratio			-	where to split
	// @parameter: box				- 	bounding box of this leaf node
	// @parameter: obj				-	the object to be split
	// @parameter: box_left(out)	- 	the bounding box of the left leaf node
	// @parameter: box_right(out)	- 	the bounding box of the right leaf node
	split: function(axis, ratio, box, obj, box_left, box_right) {
		// initialize the nodes
		var left = OCLeafNode.createNew();
		var right = OCLeafNode.createNew();
		var internal = OCInternalNode.createNew(axis, ratio);

		// split the box
		box.split(axis, ratio, box_left, box_right);

		// split the primitives
		for (var i = 0; i < this.primitives.length; ++i) {
			var index = this.primitives[i];
			flag1 = true;
			flag2 = true;
			if (obj.intersectVoxel(index, box_left)) {
				left.pushPrimitive(index);
			} else {
				flag1 = false;
			}
			if (obj.intersectVoxel(index, box_right)) {
				right.pushPrimitive(index);
			} else {
				flag2 = false;
			}
			if (flag1 == false && flag2 == false) {
				console.log('this triangle is missing: ' + index.toString());
			}
		}

		internal.setLeft(left);
		internal.setRight(right);
		return internal;
	},

	splitAuto: function(box, obj, box_left, box_right) {

		var box_left_x 	= Box.createNew();
		var box_right_x = Box.createNew();
		var internal_x 	= OCInternalNode.createNew();
		var cost_x  	= this.bestSplitAlongAxis('x', box, obj, box_left_x, box_right_x, internal_x);

		var box_left_y 	= Box.createNew();
		var box_right_y = Box.createNew();
		var internal_y 	= OCInternalNode.createNew();
		var cost_y		= this.bestSplitAlongAxis('y', box, obj, box_left_y, box_right_y, internal_y);

		var box_left_z 	= Box.createNew();
		var box_right_z = Box.createNew();
		var internal_z 	= OCInternalNode.createNew();
		var cost_z		= this.bestSplitAlongAxis('z', box, obj, box_left_z, box_right_z, internal_z);

		if (cost_x < cost_y) {
			if (cost_x < cost_z) {
				box_left.setFromBox(box_left_x);
				box_right.setFromBox(box_right_x);
				return internal_x;
			} else {
				box_left.setFromBox(box_left_z);
				box_right.setFromBox(box_right_z);
				return internal_z;
			}
		} else {
			if (cost_y < cost_z) {
				box_left.setFromBox(box_left_y);
				box_right.setFromBox(box_right_y);
				return internal_y;
			} else {
				box_left.setFromBox(box_left_z);
				box_right.setFromBox(box_right_z);
				return internal_z;
			}
		}
	},

	// given an axis and find the best split ratio
	// return the ratio
	// ratio is calculated by 0.1 step
	bestSplitAlongAxis: function(axis, box, obj, box_left, box_right, internal) {
		var cost  = MAX_DISTANCE;
		var box_left_temp = Box.createNew();
		var box_right_temp = Box.createNew();
		for (var ratio_temp = 0.1; ratio_temp < 1; ratio_temp += 0.1) {
			var internal_temp = this.split(axis, ratio_temp, box, obj, box_left_temp, box_right_temp);
			var probability = box.getSurfaceRatio(axis, ratio_temp);
			var cost_temp = 1 + probability[0] * internal_temp.left.primitives.length + probability[1] * internal_temp.right.primitives.length;
			if (cost_temp < cost) {
				cost = cost_temp;
				box_left.setFromBox(box_left_temp);
				box_right.setFromBox(box_right_temp);
				internal.setFromInternalNode(internal_temp);
			}
		}
		return cost;
	},

	splitWithoutAxis: function(ratio, box, obj, box_left, box_right, last_axis) {

		switch(last_axis) {
			case 'x': {
				var box_left_y 	= Box.createNew();
				var box_right_y = Box.createNew();
				var internal_y 	= this.split('y', ratio, box, obj, box_left_y, box_right_y);
				var cost_y		= Math.abs(internal_y.left.primitives.length - internal_y.right.primitives.length);

				var box_left_z 	= Box.createNew();
				var box_right_z = Box.createNew();
				var internal_z 	= this.split('z', ratio, box, obj, box_left_z, box_right_z);
				var cost_z		= Math.abs(internal_z.left.primitives.length - internal_z.right.primitives.length);

				if (cost_y < cost_z) {
					box_left.setFromBox(box_left_y);
					box_right.setFromBox(box_right_y);
					return internal_y;
				} else {
					box_left.setFromBox(box_left_z);
					box_right.setFromBox(box_right_z);
					return internal_z;
				}
			}

			case 'y': {
				var box_left_x 	= Box.createNew();
				var box_right_x = Box.createNew();
				var internal_x 	= this.split('x', ratio, box, obj, box_left_x, box_right_x);
				var cost_x		= Math.abs(internal_x.left.primitives.length - internal_x.right.primitives.length);

				var box_left_z 	= Box.createNew();
				var box_right_z = Box.createNew();
				var internal_z 	= this.split('z', ratio, box, obj, box_left_z, box_right_z);
				var cost_z		= Math.abs(internal_z.left.primitives.length - internal_z.right.primitives.length);

				if (cost_x <= cost_z) {
					box_left.setFromBox(box_left_x);
					box_right.setFromBox(box_right_x);
					return internal_x;
				} else {
					box_left.setFromBox(box_left_z);
					box_right.setFromBox(box_right_z);
					return internal_z;
				}
			}

			case 'z': {
				var box_left_x 	= Box.createNew();
				var box_right_x = Box.createNew();
				var internal_x 	= this.split('x', ratio, box, obj, box_left_x, box_right_x);
				var cost_x		= Math.abs(internal_x.left.primitives.length - internal_x.right.primitives.length);

				var box_left_y 	= Box.createNew();
				var box_right_y = Box.createNew();
				var internal_y 	= this.split('y', ratio, box, obj, box_left_y, box_right_y);
				var cost_y		= Math.abs(internal_y.left.primitives.length - internal_y.right.primitives.length);

				if (cost_y <= cost_x) {
					box_left.setFromBox(box_left_y);
					box_right.setFromBox(box_right_y);
					return internal_y;
				} else {
					box_left.setFromBox(box_left_x);
					box_right.setFromBox(box_right_x);
					return internal_x;
				}
			}
		}
	},

	recurSplit: function(axis, ratio, box, obj, max_level, cur_level, min_objs) {
		var box_left = Box.createNew();
		var box_right = Box.createNew();
		var internal = this.split(axis, ratio, box, obj, box_left, box_right);
		if (cur_level == max_level) {
			return internal;
		}
		cur_level += 1;
		if (internal.left.primitives.length > min_objs) {
			internal.left = internal.left.recurSplit(axis, ratio, box_left, obj, max_level, cur_level, min_objs);
		}

		if (internal.right.primitives.length > min_objs) {
			internal.right = internal.right.recurSplit(axis, ratio, box_right, obj, max_level, cur_level, min_objs);
		}

		return internal;
	},

	recurSplitWithoutAxis: function(ratio, box, obj, max_level, cur_level, min_objs, last_axis) {
		var box_left = Box.createNew();
		var box_right = Box.createNew();
		var internal = this.splitWithoutAxis(ratio, box, obj, box_left, box_right, last_axis);
		if (cur_level == max_level) {
			return internal;
		}
		cur_level += 1;
		if (internal.left.primitives.length > min_objs) {
			internal.left = internal.left.recurSplitWithoutAxis(ratio, box_left, obj, max_level, cur_level, min_objs, internal.axis);
		}

		if (internal.right.primitives.length > min_objs) {
			internal.right = internal.right.recurSplitWithoutAxis(ratio, box_right, obj, max_level, cur_level, min_objs, internal.axis);
		}

		return internal;
	},

	recurSplitAuto: function(box, obj, max_level, cur_level, min_objs) {
		var box_left = Box.createNew();
		var box_right = Box.createNew();
		var internal = this.splitAuto(box, obj, box_left, box_right);
		if (cur_level == max_level) {
			return internal;
		}
		cur_level += 1;
		if (internal.left.primitives.length > min_objs) {
			internal.left = internal.left.recurSplitAuto(box_left, obj, max_level, cur_level, min_objs);
		}

		if (internal.right.primitives.length > min_objs) {
			internal.right = internal.right.recurSplitAuto(box_right, obj, max_level, cur_level, min_objs);
		}

		return internal;
	},

	intersect: function(origin, direction, obj) {
		return obj.intersectList(origin, direction, this.primitives);
	},

	toString: function() {
		return 'leaf';
	}
};

OCLeafNode.createNew = function() {
	var O = new OCLeafNode();
	O.primitives = new Array();
	return O;
}