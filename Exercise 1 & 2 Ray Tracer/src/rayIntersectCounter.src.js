function RayIntersectCounter() {}

RayIntersectCounter.createNew = function() {
	var R = new RayIntersectCounter();
	R.nbIntersect = 0;
	R.nbRay = 0;
	R.nbAverage = 0;
	R.flag = false;
	return R;
};

RayIntersectCounter.prototype.addIntersect = function() {
	if (this.flag == true) {
		this.nbIntersect += 1;
	}
};

RayIntersectCounter.prototype.stop = function() {
	this.flag = false;
}

RayIntersectCounter.prototype.addRay = function() {
	this.nbRay += 1;
};

RayIntersectCounter.prototype.clear = function() {
	this.nbIntersect = 0;
	this.nbRay = 0;
	this.flag = true;
};

RayIntersectCounter.prototype.getInformation = function() {
	this.nbAverage = this.nbIntersect / this.nbRay;
	console.log('Total intersection test: ' + this.nbIntersect.toString());
	console.log('Total Ray: ' + this.nbRay.toString());
	console.log('Intersection test for each ray: ' + this.nbAverage.toString());
};