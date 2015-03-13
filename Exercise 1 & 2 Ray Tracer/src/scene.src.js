// Scene class
function Scene() {}

Scene.prototype = {
	pushObj: function(obj) {
		this.objs.pushObject(obj);
	},

	pushTex: function(tex) {
		this.objs.pushTex(tex);
	},

	pushNormal: function(nor) {
		this.objs.pushNormal(nor);
	},

	pushLight: function(light) {
		this.lights.push(light);
	},

	generateOCTree: function(max_level, min_objs) {
		this.objs.generateOCTree(max_level, min_objs);
	},

	// function using Phong Shading to calculate the illumination
	phongShading: function(material, point, normal, color) {
		color.setElements(0, 0, 0);
		color.addN(material.ambient.multiply(this.globalAmbient));
		for (var i = 0; i < this.lights.length; ++i) {
			var light_pos = this.lights[i].getPosition();
			var color_temp = $V(0, 0, 0);
			for (var j = 0; j < light_pos.length; ++j) {

				var toLight = light_pos[j].subtract(point);
				var light_distance = toLight.modulus();
				toLight.multiplyN(1 / light_distance);
				// detect the shadow
				var t = MAX_DISTANCE;
				t = this.objs.intersectS(point, toLight);
				if (t < light_distance - EPSILON) {
					continue;
				}

				// the point is directly illuminated by the light
				var toView = this.camera.pos.subtract(point);
				toView.toUnitVectorN();
				var Rm = toLight.reflect(normal);
				var diffuseTerm = toLight.dot(normal);
				if (diffuseTerm > 0) {
					color_temp.addN(material.diffuse.multiply(diffuseTerm * this.lights[i].getDiffuse()));
					color_temp.addN(material.specular.multiply(Math.max(0, Math.pow(Rm.dot(toView), material.spec_exp))));
				}
			}
			color_temp.multiplyN(1 / light_pos.length);
			color.addN(color_temp);
		}
		color.minScaleN(1.0);
		return color;
	},

	// this is the shading fuction inctroduced in the course
	// it's much like the Phong Shading
	// it only calculates the ambient and diffuse term
	// reflect and refract term will be decided by raytracing(calling function)
	naturalShading: function(material, point, normal) {
		var color = $V(0, 0, 0);

		// ambient term
		color.addN(material.ambient.multiply(this.globalAmbient));
		for (var i = 0; i < this.lights.length; ++i) {
			var toLight = this.lights[i].pos.subtract(point);
			var r2 = toLight.dot(toLight);
			toLight.toUnitVectorN();

			// detect the shadow
			var t = MAX_DISTANCE;
			t = this.objs.intersectS(point, toLight);
			if (t < MAX_DISTANCE) {
				continue;
			}

			var cosin = toLight.dot(normal);
			if (cosin > 0) {

				// diffuse term
				// depending on the intensity of light and distance from the light
				color.addN(material.diffuse.dotMultiply(this.lights[i].color.multiply(this.lights[i].getIntensity() / (4 * Math.PI * r2) * cosin)));
			}
		}
		color.minScaleN(1.0);
		return color;
	},

	// this is used to generate the ambient occlusion
	ambientOcclutsion: function(material, point, normal) {
		var color = $V(0, 0, 0);
		var ambient = $V(this.globalAmbient, this.globalAmbient, this.globalAmbient);
		for (var i = 0; i < this.nbIteration; ++i) {
			var direction = this.sampleSphere();
			if (direction.dot(normal) < 0) {
				direction.multiplyN(-1);
			}
			var distance = this.objs.intersectS(point, direction);
			if (distance < MAX_DISTANCE) {
				continue;
			} else {
				color.addN(ambient);
			}
		}
		color.multiplyN(1 / this.nbIteration).dotMultiplyN(material.ambient);
		return color;
	},

	sampleSphere: function() {
		var theta = Math.acos(2 * Math.random() - 1);
		var phi = 2 * Math.PI * Math.random();
		var x = Math.sin(theta) * Math.cos(phi);
		var y = Math.sin(theta) * Math.sin(phi);
		var z = Math.cos(theta);
		return $V(x, y, z);
	},

	// recursive ray tracing function
	// rayRecurNum is the number of ray tracing recursion
	// rayRecurThre is the max number of ray tracing
	rayTracing: function(origin, direction) {
		var color = $V(0, 0, 0);
		var distance = MAX_DISTANCE;
		var normal = $V(0, 0, 0);
		var material = Material.createNew();
		distance = this.objs.intersect(origin, direction, this.camera, normal, material);
		if (distance < MAX_DISTANCE) {
			this.rayRecurNum++;

			// new origin
			origin = origin.add(direction.multiply(distance));

			// get the prime color
			if (this.shading == 'Phong') {
				this.phongShading(material, origin, normal, color);
			} else if (this.shading == 'ambientOcclusion') {
				color = this.ambientOcclutsion(material, origin, normal);
			} else {
				color = this.naturalShading(material, origin, normal);
			}


			// check if reach the end of recursion
			if (this.rayRecurNum < this.rayRecurThre) {
				
				// direction of reflection ray
				var direction_reflect = direction.reflect(normal);
				direction_reflect.multiplyN(-1);

				// get the color of reflection ray
				var color_reflect = this.rayTracing(origin, direction_reflect);

				// check if the material is refractive
				var color_refract = $V(0, 0, 0);
				
				if (material.refract_bool == true) {
					// check if the ray is inside the material
					var dot = normal.dot(direction);
					var eta = 1 / material.refract_index;
					if (dot > 0) {
						// the ray shoots out from the object
						eta = 1 / eta;
						normal.multiplyN(-1);
					}
					var direction_refract = direction.refract(normal, eta);
					if (direction_refract.x != 0 || direction_refract.y != 0 || direction_refract.z != 0) {
						// get the refract ray
						color_refract = this.rayTracing(origin, direction_refract);
					}
				}
				
				color.multiplyN(0.5);
				color_reflect.multiplyN(0.5);
				color_refract.multiplyN(0.5);
				color.addN(color_reflect);
				color.addN(color_refract);
			}
			this.rayRecurNum--;
			return color;
		} else {
			return color;
		}
	}
};

Scene.createNew = function() {
	var sce = new Scene();
	sce.camera = Camera.createNew();
	sce.objs = Objects.createNew();
	sce.lights = new Array();
	sce.textures = new Array();
	sce.normalTextures = new Array();
	sce.globalAmbient = 0.0;

	// by default no ray tracing recursion
	sce.rayRecurNum = 0;
	sce.rayRecurThre = 1;

	// by default the shading is Phong shading
	sce.shading = 'Phong';
	sce.nbIteration = 50;
	return sce;
}