function Texture () {}

Texture.prototype = {
	getTextureColor: function(u, v) {
		var color = $V(0, 0, 0);
		for (var i = 0; i < this.textures.length; ++i) {
			color.addN(this.textures[i].getTextureColor(u, v));
		}
		return color.multiplyN(1 / this.textures.length);
	},

	getNormalCoordinate: function(u, v) {
		if (this.normals.length == 0) {
			return $V(0, 0, 1);
		} else {
			var normal = this.normals[0].getTextureColor(u, v);
			return normal;
		}
	},

	pushTexture: function(tga) {
		this.textures.push(tga);
	},

	pushNormal: function(tga) {
		this.normals.push(tga);
	}

};

Texture.createNew = function(path) {
	var T = new Texture();
	T.textures = new Array();
	T.normals = new Array();
	return T;
}