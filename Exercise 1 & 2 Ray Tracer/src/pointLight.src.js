// PointLight Class
function PointLight() {}

PointLight.prototype = {
	setPos: function(x, y, z) {
		this.pos.setElements(x, y, z);
		return this.pos;
	},

	setColor: function(r, g, b) {
		this.color.setElements(r, g, b);
		return this.color;
	},

	setIntensity: function(amb, dif, spc) {
		this.ambient = amb;
		this.diffuse = dif;
		this.specular = spc;
	},

	getPosition: function() {
		return [this.pos];
	},

	getDiffuse: function() {
		return this.diffuse;
	}
};

PointLight.createNew = function() {
	var ptl = new PointLight();
	ptl.pos = $V(0, 0, 0);
	ptl.color = $V(0, 0, 0);
	ptl.ambient = 0;
	ptl.diffuse = 0;
	ptl.specular = 0;
	ptl.intensity = 10000.0;
	return ptl;
}