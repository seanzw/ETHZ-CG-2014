// camera class

function Camera() {}

Camera.prototype = {
	setDisplay: function(d, theta, width, height) {
		this.d = d;
		this.theta = theta;
		this.width = width;
		this.height = height;
		this.ratio = width / height;
		this.realHeight = 2 * this.d * Math.tan(this.theta / 360 * Math.PI);
		this.realWidth = this.realHeight * this.ratio;
		this.realPixel = this.realWidth / this.width;
	},

	setPos: function(x, y, z) {
		this.pos.setElements(x, y, z);
		return this.pos;
	},

	setLook: function(x, y, z) {
		this.look.setElements(x, y, z);
		this.look.toUnitVectorN();
		this.left = this.up.cross(this.look);
		return this.look;
	},

	setUp: function(x, y, z) {
		this.up.setElements(x, y, z);
		this.up.toUnitVectorN();
		this.left = this.up.cross(this.look);
		return this.up;
	},

	getD: function() {
		return this.d;
	},

	// calculate the real size of a pixel
	calculateRealSize: function(t) {
		return this.realPixel * t / this.d;
	},

	shootRay: function(pixelX, pixelY) {
		var x = this.left.multiply((0.5 - pixelX / this.width) * this.realWidth);
		var y = this.up.multiply((0.5 - pixelY / this.height) * this.realHeight);
		var direction = this.look.multiply(this.d);
		direction.addN(x);
		direction.addN(y);
		direction.toUnitVectorN();
		return direction;
	},

	shootRayStereoscopic: function(pixelX, pixelY, displace, origin_left, direction_left, origin_right, direction_right) {
		var x = this.left.multiply((0.5 - pixelX / this.width) * this.realWidth);
		var y = this.up.multiply((0.5 - pixelY / this.height) * this.realHeight);
		var direction = this.look.multiply(this.d);
		
		origin_left.addN(this.pos.add(this.left.multiply(displace)));
		direction_left.addN(direction.subtract(this.left.multiply(displace)));
		direction_left.addN(x);
		direction_left.addN(y);
		direction_left.toUnitVectorN();

		origin_right.addN(this.pos.add(this.left.multiply(-displace)));
		var right = direction.add(this.left.multiply(displace));
		direction_right.addN(right.addN(x).addN(y));
		direction_right.toUnitVectorN();
	},

	// shoot ray with aperture considered
	// @pixelX: x coordinate of pixel
	// @pixelY: y coordinate of pixel
	// @i: the i^th ray
	shootRayAperture: function(pixelX, pixelY, i, origin, direction) {
		// get the new origin
		var theta = i / this.rayNum * 2 * Math.PI;
		var shift = this.up.multiply(this.aperture * Math.sin(theta));
		shift.addN(this.left.multiply(this.aperture * Math.cos(theta)));
		var origin_shift = this.pos.add(shift);
		origin.setElements(origin_shift.x, origin_shift.y, origin_shift.z);

		// get the original direction
		var x = this.left.multiply((0.5 - pixelX / this.width) * this.realWidth);
		var y = this.up.multiply((0.5 - pixelY / this.height) * this.realHeight);
		direction.setElements(0, 0, 0);
		direction.addN(this.look.multiply(this.d));
		direction.addN(x);
		direction.addN(y);
		direction.toUnitVectorN();

		// calculate the intersection point of the origin ray and the focus plane
		var t = this.focus / this.look.dot(direction);
		var intersect = this.pos.add(direction.multiplyN(t));
		var direction_shift = intersect.subtract(origin_shift);
		direction_shift.toUnitVectorN();
		direction.setElements(direction_shift.x, direction_shift.y, direction_shift.z);
	}
};

Camera.createNew = function() {
	var cam = new Camera();
	cam.pos = $V(0, 0, 0);
	cam.look = $V(0, 0, 1);
	cam.up = $V(-1, 0, 0);
	cam.left = cam.up.cross(cam.look);
	cam.setDisplay(1.0, 40, 800, 600);

	// parameter for simulating depth field
	cam.aperture = 0.5;
	cam.focus = 7;
	cam.rayNum = 30;
	return cam;
}