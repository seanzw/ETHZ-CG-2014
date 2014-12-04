// objects class
// this is the layer between scene and basic primitive
// ------------------------------------------------------
// objs 		-	array of objects
// boxes		-	array of bounding AABB, here we assume all the bounding boxes do not intersect
// useOCTree	- 	bool, whether using OC Tree to accelerate
// octree 		-	referrence to the oc tree

function Objects() {}

Objects.prototype = {
	pushObject: function(obj) {
		this.objs.push(obj);
		var box = obj.getBoundBox();
		this.boxes.push(box);
		this.boundBox.unionN(box);
	},

	pushTex: function(tex) {
		this.textures.push(tex);
		return this.textures;
	},

	pushNormal: function(nor) {
		this.normalTextures.push(nor);
		return this.normalTextures;
	},

	calculateMipMapResize: function(t, i, textureSize, camera) {
		var realPixelSize = camera.calculateRealSize(t);
		var objSize = this.objs[i].getSize();
		return  textureSize / (objSize / realPixelSize);
	},

	generateOCTree: function(max_level, min_objs) {
		this.useOCTree = true;
		this.octree = OCTree.createNew(max_level, min_objs);
		// use the bound box th generate oc tree
		this.octree.generate(this);
	},

	getBoundBox: function() {
		return this.boundBox;
	},

	getIndex: function() {
		var arr = new Array(this.objs.length);
		for (var i = 0; i < arr.length; ++i) {
			arr[i] = i;
		}
		return arr;
	},

	intersectVoxel: function(index, box) {
		return this.boxes[index].intersectVoxel(box);
	},

	intersectList: function(origin, direction, list) {
		var result = [MAX_DISTANCE, -1];
		for (var i = 0; i < list.length; ++i) {
			var index = list[i];
			var result_temp = this.objs[index].intersect(origin, direction);
			if (result_temp[0] < result[0]) {
				result = new Array(2);
				result[0] = result_temp[0];
				result[1] = index;
				for (var j = 1; j < result_temp.length; ++j) {
					result.push(result_temp[j]);
				}
			}
		}
		return result;
	},

	intersect: function(origin, direction, camera, normal, material) {
		var t = MAX_DISTANCE;
		var nor_temp = $V(0, 0, 0);
		var material_temp = Material.createNew();
		if (this.useOCTree == false) {
			for (var i = 0; i < this.objs.length; ++i) {
				var result = this.objs[i].intersect(origin, direction);
				if (result[0] < t) {
					t = result[0];
					var hit = origin.add(direction.multiply(t));
					if (this.objs[i].useNormalTexture == true) {
						var textureWidth = this.normalTextures[this.objs[i].normalTextureID].getWidth();
						var mipmapResize = this.calculateMipMapResize(t, i, textureWidth, camera);
						var normal_uv = this.objs[i].getTextureCoordinate(hit);
						var normal_tbn = this.normalTextures[this.objs[i].normalTextureID].getNormal(normal_uv[0], normal_uv[1], mipmapResize);
						var nor_temp = this.objs[i].normalFromTexture(hit, normal_tbn);
						normal.setElements(nor_temp.x, nor_temp.y, nor_temp.z);
					} else {
						nor_temp = this.objs[i].normal(result);
						normal.setElements(nor_temp.x, nor_temp.y, nor_temp.z);
					}

					if (this.objs[i].useTexture == true) {
						var textureWidth = this.textures[this.objs[i].textureID].getWidth();
						var mipmapResize = this.calculateMipMapResize(t, i, textureWidth, camera);
						var uv = this.objs[i].getTextureCoordinate(hit);
						var texColor = this.textures[this.objs[i].textureID].getTextureColor(uv[0], uv[1], mipmapResize);
						material.setAmbient(texColor.x, texColor.y, texColor.z);
						material.setDiffuse(texColor.x, texColor.y, texColor.z);
						material.setSpecular(texColor.x, texColor.y, texColor.z);
					} else {
						material.setFromMaterial(this.objs[i].getMaterial(result));
					}
				}
			}
		} else {
			var result = this.octree.intersect(origin, direction);
			t = result[0];
			if (t == MAX_DISTANCE) {
				return t;
			}
			var i = result[1];
			// retrive the information
			var result_temp = new Array(result.length - 1);
			result_temp[0] = t;
			for (var j = 2; j < result.length; ++j) {
				result_temp[j - 1] = result[j];
			}
			var hit = origin.add(direction.multiply(t));

			if (this.objs[i].useNormalTexture == true) {
				var textureWidth = this.normalTextures[this.objs[i].normalTextureID].getWidth();
				var mipmapResize = this.calculateMipMapResize(t, i, textureWidth, camera);
				var normal_uv = this.objs[i].getTextureCoordinate(hit);
				var normal_tbn = this.normalTextures[this.objs[i].normalTextureID].getNormal(normal_uv[0], normal_uv[1], mipmapResize);
				var nor_temp = this.objs[i].normalFromTexture(hit, normal_tbn);
				normal.setElements(nor_temp.x, nor_temp.y, nor_temp.z);
			} else {
				nor_temp = this.objs[i].normal(result_temp);
				normal.setElements(nor_temp.x, nor_temp.y, nor_temp.z);
			}

			if (this.objs[i].useTexture == true) {
				var textureWidth = this.textures[this.objs[i].textureID].getWidth();
				var mipmapResize = this.calculateMipMapResize(t, i, textureWidth, camera);
				var uv = this.objs[i].getTextureCoordinate(hit);
				var texColor = this.textures[this.objs[i].textureID].getTextureColor(uv[0], uv[1], mipmapResize);
				material.setAmbient(texColor.x, texColor.y, texColor.z);
				material.setDiffuse(texColor.x, texColor.y, texColor.z);
				material.setSpecular(texColor.x, texColor.y, texColor.z);
			} else {
				material.setFromMaterial(this.objs[i].getMaterial(result_temp));
			}
		}
		return t;
	},

	intersectS: function(origin, direction) {
		if (this.useOCTree == false) {
			var t = MAX_DISTANCE;
			for (var i = 0; i < this.objs.length; ++i) {
				var t_temp = this.objs[i].intersectS(origin, direction);
				if (t_temp < t) {
					t = t_temp;
				}
			}
			return t;
		} else {
			var result = this.octree.intersect(origin, direction);
			return result[0];
		}
	}
};

Objects.createNew = function() {
	var O 				= new Objects();
	O.objs 				= new Array();
	O.boxes 			= new Array();
	O.textures 			= new Array();
	O.normalTextures	= new Array();
	O.boundBox 			= Box.createNew();
	O.useOCTree 		= false;
	O.octree 			= null;
	return O;
}