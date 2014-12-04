
// MAX_DISTANCE: constant for the maximum distance in intersect
var MAX_DISTANCE = 100000;
var EPSILON		 = 0.0001;

// the gloabal scene object
var scene;

// the counter for the ray
var RIC;

// 0. set up the scene described in the exercise sheet (this is called before the rendering loop)
function loadScene() {
	scene = Scene.createNew();
	scene.globalAmbient = 0.2;
	RIC = RayIntersectCounter.createNew();

	// create the spheres
	var sphere_red = Sphere.createNew(2.0, 0, 0, 0);
	sphere_red.material.setAmbient(0.75, 0, 0);
	sphere_red.material.setDiffuse(1, 0, 0);
	sphere_red.material.setSpecular(1, 1, 1);
	sphere_red.material.spec_exp = 32.0;

	var sphere_blue = Sphere.createNew(0.5, 1.25, 1.25, 3);
	sphere_blue.material.setAmbient(0, 0, 0.75);
	sphere_blue.material.setDiffuse(0, 0, 1);
	sphere_blue.material.setSpecular(0.5, 0.5, 1);
	sphere_blue.material.spec_exp = 16.0;
	sphere_blue.material.refract_bool = true;
	sphere_blue.material.refract_index = 1.5;

	// create the ellipsoid
	var ellipsoid = Ellipsoid.createNew($V(1.25, 1.25, 3), 0.25, 0.75, 0.5);
	ellipsoid.material.setAmbient(0, 0, 0.75);
	ellipsoid.material.setDiffuse(0, 0, 1);
	ellipsoid.material.setSpecular(0.5, 0.5, 1);
	ellipsoid.material.spec_exp = 16.0;
	ellipsoid.material.refract_bool = true;
	ellipsoid.material.refract_index = 1.5;

	// create the cylinder
	var cylinder = Cylinder.createNew(2, 1, 1, $V(1, 0, 1));
	cylinder.material.setAmbient(0.75, 0, 0);
	cylinder.material.setDiffuse(1, 0, 0);
	cylinder.material.setSpecular(1, 1, 1);
	cylinder.material.spec_exp = 32.0;

	// create the hamisphere
	var sphere_conic = Conic.createNew(1, 1, 1, -4, 0, 0, 0, 0, 0, 0);
	sphere_conic.material.setAmbient(0.75, 0, 0);
	sphere_conic.material.setDiffuse(1, 0, 0);
	sphere_conic.material.setSpecular(1, 1, 1);
	sphere_conic.material.spec_exp = 32.0;

	var plane_conic = Conic.createNew(0, 0, 0, 0, 0, 0, -1, 0, 0, 1);
	plane_conic.material.setAmbient(0.75, 0.75, 0);
	plane_conic.material.setDiffuse(1, 1, 0);
	plane_conic.material.setSpecular(1, 1, 1);
	plane_conic.material.spec_exp = 32.0;

	var hamisphere = Intersection.createNew(sphere_conic, plane_conic);

	// create the intersection of two spheres
	var sphere1_conic = Conic.createNew(1, 1, 1, 11.875, 0, 0, -2.5, 0, -2.5, -6)
	sphere1_conic.material.setAmbient(0, 0, 0.75);
	sphere1_conic.material.setDiffuse(0, 0, 1);
	sphere1_conic.material.setSpecular(0.5, 0.5, 1);
	sphere1_conic.material.spec_exp = 16.0;

	var sphere2_conic = Conic.createNew(1, 1, 1, 9.625, 0, 0, -0.5, 0, -2.5, -6)
	sphere2_conic.material.setAmbient(0, 0, 0.75);
	sphere2_conic.material.setDiffuse(0, 0, 1);
	sphere2_conic.material.setSpecular(0.5, 0.5, 1);
	sphere2_conic.material.spec_exp = 16.0;

	var sphere_intersect = Intersection.createNew(sphere1_conic, sphere2_conic);

	// create the intersect of two sphere

	if (ModuleId.Bonus2 == true) {
		var areaLight = AreaLight.createNew($V(10, 10, 10), $V(-10, -10, -10).toUnitVectorN(), 1);
		areaLight.setColor(1, 1, 1);
		areaLight.setIntensity(0, 1, 1);
		scene.pushLight(areaLight);
	} else {
		// create the point light
		var pointLight = PointLight.createNew();
		pointLight.setPos(10, 10, 10);
		pointLight.setColor(1, 1, 1);
		pointLight.setIntensity(0, 1, 1);
		scene.pushLight(pointLight);
	}

	if (ModuleId.B4 == true) {
		scene.camera.setDisplay(8.5, 40, width, height);
		sphere_red.material.setAmbient(1, 1, 0);
		sphere_red.material.setDiffuse(1, 1, 0);
		sphere_blue.material.setAmbient(0, 1, 1);
		sphere_blue.material.setDiffuse(0, 1, 1);
	} else {
		scene.camera.setDisplay(1, 40, width, height);
	}

	// create the scene
	if (ModuleId.B3 == true) {
		scene.pushObj(cylinder);
		scene.pushObj(ellipsoid);
	} else if (ModuleId.C1 == true) {
		scene.pushObj(hamisphere);
		scene.pushObj(sphere_intersect);
	} else if (ModuleId.C2 == true) {
		if (ModuleId.China == false) {
			scene.pushTex(Targa.createNew('./data/Earth.tga', true));
			scene.pushTex(Targa.createNew('./data/Moon.tga', true));
			scene.pushNormal(Targa.createNew('./data/EarthNormal.tga', true));
			scene.pushNormal(Targa.createNew('./data/MoonNormal.tga', true));
		} else {
			scene.pushTex(Targa.createNew('./data/Earth-2.tga', true));
			scene.pushTex(Targa.createNew('./data/Moon-2.tga', true));
			scene.pushNormal(Targa.createNew('./data/EarthNormal-2.tga', true));
			scene.pushNormal(Targa.createNew('./data/MoonNormal-2.tga', true));
		}
		sphere_red.setNorthandPrime($V(0, 1, 1), $V(-1, 1, -1));
		sphere_blue.setNorthandPrime($V(0, 1, 1), $V(-1, 1, -1));
		sphere_red.bindTexture(0);
		sphere_red.bindNormalTexture(0);
		sphere_blue.bindTexture(1);
		sphere_blue.bindNormalTexture(1);
		scene.pushObj(sphere_red);
		scene.pushObj(sphere_blue);
	} else if (ModuleId.C3 == true) {
		var mesh1 = Mesh.createNew('./data/sphere.obj');
		var mat  = Matrix4.createNew(2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1);
		mesh1.applyMatrix(mat);
		mesh1.generateOCTree(7, 3);
		mesh1.setMaterial(0.75, 0, 0, 1, 0, 0, 1, 1, 1, 32)
		scene.pushObj(mesh1);

		var mesh2 = Mesh.createNew('./data/sphere.obj');
		var mat  = Matrix4.createNew(0.5, 0, 0, 1.25, 0, 0.5, 0, 1.25, 0, 0, 0.5, 3, 0, 0, 0, 1);
		mesh2.applyMatrix(mat);
		mesh2.generateOCTree(7, 4);
		mesh2.setMaterial(0, 0, 0.75, 0, 0, 1, 0.5, 0.5, 1, 16)
		scene.pushObj(mesh2);
	} else if (ModuleId.D1 == true) {
		for (var i = 0; i < 10; ++i) {
			for (var j = 0; j < 10; ++j) {
				for (var k = 0; k < 10; ++k) {
					var sphere_blue = Sphere.createNew(0.25, i - 4.5, j - 4.5, - k * k * k);
					sphere_blue.material.setAmbient(0, 0, 0.75);
					sphere_blue.material.setDiffuse(0, 0, 1);
					sphere_blue.material.setSpecular(0.5, 0.5, 1);
					sphere_blue.material.spec_exp = 16.0;
					scene.pushObj(sphere_blue);
				}
			}
		}
		scene.generateOCTree(10, 2);
	} else if (ModuleId.Bonus3 == true) {
		// create the spheres
		var sphere = Sphere.createNew(2.0, 0, 0, 0);
		sphere.material.setAmbient(0.7, 0.7, 0.7);
		scene.pushObj(sphere);

		var plane_up = Mesh.createNew('./data/plane.obj');
		plane_up.setMaterial(0.7, 0.7, 0.7, 1, 1, 1, 1, 1, 1, 32);
		var theta = Math.PI / 2;
		var mat_rotate = Matrix4.createNew(1, 0, 0, 0, 0, Math.cos(theta), -Math.sin(theta), 0, 0, Math.sin(theta), Math.cos(theta), 0, 0, 0, 0, 1);
		plane_up.applyMatrix(mat_rotate);
		var mat_translation = Matrix4.createNew(1, 0, 0, 0, 0, 1, 0, 2, 0, 0, 1, 0, 0, 0, 0, 1);
		plane_up.applyMatrix(mat_translation);
		scene.pushObj(plane_up);

		var plane_down = Mesh.createNew('./data/plane.obj');
		plane_down.setMaterial(0.7, 0.7, 0.7, 1, 1, 1, 1, 1, 1, 32);
		var theta = - Math.PI / 2;
		var mat_rotate = Matrix4.createNew(1, 0, 0, 0, 0, Math.cos(theta), -Math.sin(theta), 0, 0, Math.sin(theta), Math.cos(theta), 0, 0, 0, 0, 1);
		plane_down.applyMatrix(mat_rotate);
		var mat_translation = Matrix4.createNew(1, 0, 0, 0, 0, 1, 0, -2, 0, 0, 1, 0, 0, 0, 0, 1);
		plane_down.applyMatrix(mat_translation);
		scene.pushObj(plane_down);

		scene.shading = 'ambientOcclusion';
		scene.globalAmbient = 0.8;
	} else {
		scene.pushObj(sphere_red);
		scene.pushObj(sphere_blue);
	}
	scene.camera.setPos(0, 0, 10);
	scene.camera.setUp(0, 1, 0);
	scene.camera.setLook(0, 0, -1);
	

}

function trace(color, pixelX, pixelY) {
	if (pixelX == 154 && pixelY == 434) {
		console.log('debug');
	}

/*	if (ModuleId.C2) {
		var color_temp = scene.textures[0].getTextureColor(pixelX / width, 1 - pixelY / height);
		color.setElements(color_temp.x, color_temp.y, color_temp.z);
		return;
	}*/

	RIC.addRay();

	// Make sure each ray is in the center of the pixel
	pixelX += 0.5;
	pixelY += 0.5;

	// check whether recursive	
	if (ModuleId.B1 == true) {
		scene.rayRecurThre = 6;
		//scene.shading = 'natural';
	}

	if (ModuleId.B2 == true) {
		// get 16 samples
		for (var i = 0; i < 16; ++i) {
			var direction = scene.camera.shootRay(pixelX + 0.5 - Math.random(), pixelY + 0.5 - Math.random());
			var color_temp = scene.rayTracing(scene.camera.pos, direction);
			color.addN(color_temp);
		}
		color.multiplyN(1 / 16);
		return;
	}

	if (ModuleId.B4 == true) {
		var direction_left = $V(0, 0, 0);
		var direction_right = $V(0, 0, 0);
		var origin_left = $V(0, 0, 0);
		var origin_right = $V(0, 0, 0);
		scene.camera.shootRayStereoscopic(pixelX, pixelY, 0.5, origin_left, direction_left, origin_right, direction_right);
		var color_left = scene.rayTracing(origin_left, direction_left);
		var color_right = scene.rayTracing(origin_right, direction_right);

		color.setElements(0.3 * color_left.x + 0.59 * color_left.y + 0.11 * color_left.z, color_right.y, color_right.z);
		return;
	}

	if (ModuleId.Bonus1 == true) {
		var color_aperture = $V(0, 0, 0);
		for (var i = 0; i < scene.camera.rayNum; ++i) {
			var origin = $V(0, 0, 0);
			var direction = $V(0, 0, 0);
			scene.camera.shootRayAperture(pixelX, pixelY, i, origin, direction);
			color_aperture.addN(scene.rayTracing(origin, direction));
		}
		color_aperture.multiplyN(1 / scene.camera.rayNum);
		color.setElements(color_aperture.x, color_aperture.y, color_aperture.z);
		return;
	}

	var direction = scene.camera.shootRay(pixelX, pixelY);
	var color_temp = scene.rayTracing(scene.camera.pos, direction);

	color.setElements(color_temp.x, color_temp.y, color_temp.z);

	if (pixelX == 365 && pixelY == 177) {
		console.log(color);
	}
}
