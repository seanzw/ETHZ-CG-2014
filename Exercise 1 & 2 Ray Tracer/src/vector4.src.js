// Vector4 class

function Vector4() {}

Vector4.prototype = {

	dup: function() {
		var V = Vector4.createNew(this.x, this.y, this.z, this.w);
		return V;
	},

	//transform the Vector4 to Vector3
	toVector3: function() {
		if (Math.abs(this.w) > EPSILON) {
			var V = $V(this.x / this.w, this.y / this.w, this.z / this.w);
			return V;
		} else {
			return 'infinite';
		}
	},

	toUnitVector3: function() {
		var V = this.toVector3();
		return V.toUnitVector();;
	},

	// dot operation
	dot: function(vector) {
		var product = 0;
		product += this.x * vector.x;
		product += this.y * vector.y;
		product += this.z * vector.z;
		product += this.w * vector.w;
		return product;
	},

	multiplyN: function(scale) {
		this.x *= scale;
		this.y *= scale;
		this.z *= scale;
		this.w *= scale;
		return this;
	},

	multiply: function(scale) {
		var V = this.dup();
		return V.multiplyN(scale);
	},

	addN: function(vector) {
		this.x += vector.x;
		this.y += vector.y;
		this.z += vector.z;
		this.w += vector.w;
		return this;
	},

	add: function(vector) {
		var V = this.dup();
		return V.addN(vector);
	},

	subtractN: function(vector) {
		this.x -= vector.x;
		this.y -= vector.y;
		this.z -= vector.z;
		this.w -= vector.w;
		return this;
	}

};

Vector4.createNew = function(a1, a2, a3, a4) {
	var V = new Vector4();
	V.x = a1; 
	V.y = a2;
	V.z = a3;
	V.w = a4;
	return V;
}