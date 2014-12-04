// Material class
// ambient, diffuse and specular are 3-D vector
// spec_exp is the specular exponent
function Material() {}
Material.prototype = {
	setAmbient: function(r, g, b) {
		this.ambient.setElements(r, g, b);
		return this.ambient;
	},

	setDiffuse: function(r, g, b) {
		this.diffuse.setElements(r, g, b);
		return this.diffuse;
	},

	setSpecular: function(r, g, b) {
		this.specular.setElements(r, g, b);
		return this.specular;
	},

	setFromMaterial: function(material) {
		this.setAmbient(material.ambient.x, material.ambient.y, material.ambient.z);
		this.setDiffuse(material.diffuse.x, material.diffuse.y, material.diffuse.z);
		this.setSpecular(material.specular.x, material.specular.y, material.specular.z);
		this.spec_exp = material.spec_exp;
		this.refract_bool = material.refract_bool;
		this.refract_index = material.refract_index;
		return this;
	}
};


Material.createNew = function() {
	var M = new Material();
	M.ambient = $V(0, 0, 0),
	M.diffuse = $V(0, 0, 0),
	M.specular = $V(0, 0, 0),
	M.spec_exp = 32;
	M.refract_bool = false;
	M.refract_index = 1;
	return M;
}