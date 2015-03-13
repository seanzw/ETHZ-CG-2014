function AreaLight () {}

AreaLight.prototype.setPos = function(position) {
	this.position = position;
};

AreaLight.prototype.setRadius = function(r) {
	this.radius = r;
};

AreaLight.prototype.setOrientation = function(orientation) {
	this.orientation = orientation;
};

AreaLight.prototype.setColor = function(r, g, b) {
	this.color.setElements(r, g, b);
};

AreaLight.prototype.setIntensity = function(ambient, diffuse, specular) {
	this.ambient = ambient;
	this.diffuse = diffuse;
	this.specular = specular;
};

// use monte carlo to return sample point lights
AreaLight.prototype.getPosition = function() {
	var positions = new Array(50);
	for (var i = positions.length - 1; i >= 0; i--) {
		positions[i] = this.sampleUniformDisk().addN(this.position);
	};
	return positions;
	// return [this.position];
};

AreaLight.prototype.sampleUniformDisk = function() {
	var v1 = Math.random();
	var v2 = Math.random();
	var theta = 2 * Math.PI * v2;
	var r = Math.sqrt(v1) * this.radius;

	return this.x.multiply(r * Math.cos(theta)).addN(this.y.multiply(r * Math.sin(theta)));
};

AreaLight.prototype.getDiffuse = function() {
	return this.diffuse;
};


AreaLight.createNew = function(position, orientation, radius) {
	var A = new AreaLight();
	A.position = position;
	A.radius = radius;
	A.orientation = orientation;
	A.x = $V(orientation.y, - orientation.x, 0).toUnitVectorN();
	A.y = A.x.cross(orientation);
	A.color = $V(0, 0, 0);
	A.ambient = 0;
	A.diffuse = 0;
	A.specular = 0;
	return A;
};