// homogenius matrix class

function Matrix4() {}

Matrix4.prototype = {
	multiplyVec4: function(vector) {
		var V = Vector4.createNew(0, 0, 0, 0);
		V.addN(this.col1.multiply(vector.x));
		V.addN(this.col2.multiply(vector.y));
		V.addN(this.col3.multiply(vector.z));
		V.addN(this.col4.multiply(vector.w));
		return V;
	},

	// transform the direction vector
	// a direction can be taken as a point - origin(M - O)
	// therefore the new directoin is Mat * M - Mat * O
	// so we can just disregard the translation
	transformDirection: function(direction) {
		var V = this.multiplyVec4(direction);
		return V.subtractN(this.col4);
	}
};

// store the matrix in col vector4
Matrix4.createNew = function(a11, a12, a13, a14, a21, a22, a23, a24, a31, a32, a33, a34, a41, a42, a43, a44) {
	var m = new Matrix4();
	m.col1 = Vector4.createNew(a11, a21, a31, a41);
	m.col2 = Vector4.createNew(a12, a22, a32, a42);
	m.col3 = Vector4.createNew(a13, a23, a33, a43);
	m.col4 = Vector4.createNew(a14, a24, a34, a44);
	return m;
}