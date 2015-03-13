
// DO NOT change the content of this file except for implementing the computeNormals() function
// to load a mesh you need to call: var myMesh = readOBJ('./data/mesh.obj');

//-------------------------------------------------------------
// all the intersect function should return an array result
// result[0] = t
// result[1] = index of the triangle
// result[2] = s
// result[3] = u
// result[4] = v

function Mesh() {}

Mesh.createNew = function(path) {
	console.log("Reading OBJ file: " + path);
	var M = new Mesh();
	M.V = new Array(); // array of vertices
	M.F = new Array(); // array of triangles
	M.N = new Array(); // array of normals
	M.mtr = Material.createNew();
	M.boundBox = Box.createNew();
	M.selfIntersectThre = EPSILON;
	M.octree = null;
	M.useOCTree = false;
	M.useTexture = false;
	M.useNormalTexture = false;
	var req = new XMLHttpRequest();
	req.open('GET', path, false);
	
	req.send(null);
	M.load(req.response);
	M.computeNormals();
	M.computeBoundBox();
	console.log("OBJ file successfully loaded (nbV: " + M.nbV() + ", nbF: " + M.nbF() + ")");
	
	return M;
};


Mesh.prototype.computeNormals = function() {

	// first calculate the normal for each face and the area
	var FNS = new Array();

	// also the get the which face the vertex are in
	var index = new Array(this.nbV());
	for (var i = 0; i < index.length; ++i) {
		index[i] = new Array;
	}

	var flag = new Array(this.nbV());
	for (var i = 0; i < this.nbF(); ++i) {
		var x = this.F[i].x;
		var y = this.F[i].y;
		var z = this.F[i].z;
		index[x].push(i);
		index[y].push(i);
		index[z].push(i);
		var edge1 = this.V[y].subtract(this.V[x]);
		var edge2 = this.V[z].subtract(this.V[x]);
		var FN = edge1.cross(edge2);
		var S  = FN.modulus();
		FN.multiplyN(1 / S);
		FNS.push(Vector4.createNew(FN.x, FN.y, FN.z, S));
	}
	
	for (var i = 0; i < this.nbV(); ++i) {
		var normal = $V(0, 0, 0);
		var S_total = 0;
		for (var j = 0; j < index[i].length; ++j) {
			var fns_this = FNS[index[i][j]];
			var S = fns_this.w;
			normal.addN($V(fns_this.x, fns_this.y, fns_this.z).multiplyN(S));;
			S_total += S;
		}
		normal.multiplyN(1 / S);
		this.N[i] = normal.toUnitVectorN();
	}	
};

Mesh.prototype.computeBoundBox = function() {
	var vMax = this.V[0].dup();
	var vMin = this.V[0].dup();
	for (var i = 0; i < this.nbV(); ++i) {
		vMax.maxN(this.V[i]);
		vMin.minN(this.V[i]);
	}
	this.boundBox.setMinMax(vMin, vMax);
	var diag = vMax.subtract(vMin);
	if (diag.x < EPSILON || diag.y < EPSILON || diag.z < EPSILON) {
		this.selfIntersectThre = EPSILON;
	} else {
		this.selfIntersectThre = vMax.subtract(vMin).modulus() / this.nbF() * 18;
	}
};

Mesh.prototype.nbV = function() { // number of vertices
	return this.V.length;
};

Mesh.prototype.nbF = function() { // number of triangles
	return this.F.length;
};
	
Mesh.prototype.load = function (data) {

	// v float float float
	var vertex_pattern = /v( +[\d|\.|\+|\-|e]+)( +[\d|\.|\+|\-|e]+)( +[\d|\.|\+|\-|e]+)/;
	// f vertex vertex vertex
	var face_pattern1 = /f( +\d+)( +\d+)( +\d+)/
	// f vertex/uv vertex/uv vertex/uv
	var face_pattern2 = /f( +(\d+)\/(\d+))( +(\d+)\/(\d+))( +(\d+)\/(\d+))/;
	// f vertex/uv/normal vertex/uv/normal vertex/uv/normal
	var face_pattern3 = /f( +(\d+)\/(\d+)\/(\d+))( +(\d+)\/(\d+)\/(\d+))( +(\d+)\/(\d+)\/(\d+))/;
	// f vertex//normal vertex//normal vertex//normal
	var face_pattern4 = /f( +(\d+)\/\/(\d+))( +(\d+)\/\/(\d+))( +(\d+)\/\/(\d+))/;

	
	var lines = data.split( "\n" );

	for ( var i = 0; i < lines.length; i ++ ) {

		var line = lines[ i ];
		line = line.trim();

		var result;

		if ( line.length === 0 || line.charAt( 0 ) === '#' ) {
			continue;
		}
		else if ( ( result = vertex_pattern.exec( line ) ) !== null ) {

			// ["v 1.0 2.0 3.0", "1.0", "2.0", "3.0"]
			this.V.push( $V(
				parseFloat( result[ 1 ] ),
				parseFloat( result[ 2 ] ),
				parseFloat( result[ 3 ] )
			) );

		}
		else if ( ( result = face_pattern1.exec( line ) ) !== null ) {

			// ["f 1 2 3", "1", "2", "3"]
			this.F.push( $V(
				parseInt( result[ 1 ] ) - 1 ,
				parseInt( result[ 2 ] ) - 1 ,
				parseInt( result[ 3 ] ) - 1 
			) );

		} else if ( ( result = face_pattern2.exec( line ) ) !== null ) {

			// ["f 1/1 2/2 3/3", " 1/1", "1", "1", " 2/2", "2", "2", " 3/3", "3", "3"]
			this.F.push( $V(
				parseInt( result[ 2 ] ) - 1 ,
				parseInt( result[ 5 ] ) - 1 ,
				parseInt( result[ 8 ] ) - 1 
			) );

		} else if ( ( result = face_pattern3.exec( line ) ) !== null ) {

			// ["f 1/1/1 2/2/2 3/3/3", " 1/1/1", "1", "1", "1", " 2/2/2", "2", "2", "2", " 3/3/3", "3", "3", "3"]
			this.F.push( $V(
				parseInt( result[ 2 ] ) - 1 ,
				parseInt( result[ 6 ] ) - 1 ,
				parseInt( result[ 10 ] ) - 1 
			) );

		} else if ( ( result = face_pattern4.exec( line ) ) !== null ) {

			// ["f 1//1 2//2 3//3", " 1//1", "1", "1", " 2//2", "2", "2", " 3//3", "3", "3"]
			this.F.push( $V(
				parseInt( result[ 2 ] ) - 1,
				parseInt( result[ 5 ] ) - 1,
				parseInt( result[ 8 ] ) - 1 
			) );

		}

	}
	
};

Mesh.prototype.setMaterial = function(amb_r, amb_g, amb_b, dif_r, dif_g, dif_b, spc_r, spc_g, spc_b, spec_exp) {
	this.mtr.setAmbient(amb_r, amb_g, amb_b);
	this.mtr.setDiffuse(dif_r, dif_g, dif_b);
	this.mtr.setSpecular(spc_r, spc_g, spc_b);
	this.mtr.spec_exp = spec_exp;
};

Mesh.prototype.generateOCTree = function(max_level, min_objs) {
	this.useOCTree = true;
	this.octree = OCTree.createNew(max_level, min_objs);
	this.octree.generate(this);
};

Mesh.prototype.intersect = function(origin, direction) {
	if (this.useOCTree == false) {
		var result = [MAX_DISTANCE, -1];
		var t_temp = this.boundBox.intersect(origin, direction);
		if (t_temp == MAX_DISTANCE) {
			return result;
		}
		for (var i = 0; i < this.nbF(); ++i) {
			var x = this.F[i].x;
			var y = this.F[i].y;
			var z = this.F[i].z;
			var result_temp = this.intersectTriangle(origin, direction, this.V[x], this.V[y], this.V[z]);
			if (result_temp[0] < result[0]) {
				result = result_temp;
				result[1] = i;
			}
		}
		return result;
	} else {
		return this.octree.intersect(origin, direction);
	}
};

Mesh.prototype.intersectS = function(origin, direction) {
	var t 			= MAX_DISTANCE;
	var t_temp 		= this.boundBox.intersect(origin, direction);
	if (t_temp == MAX_DISTANCE) {
		return t;
	}
	if (this.useOCTree == false) {
		for (var i = 0; i < this.nbF(); ++i) {
			var hit_temp = $V(0, 0, 0);
			var x = this.F[i].x;
			var y = this.F[i].y;
			var z = this.F[i].z;
			var t_temp = this.intersectTriangleS(origin, direction, this.V[x], this.V[y], this.V[z], hit_temp);
			if (t_temp < t) {
				t = t_temp;
			}
		}
		if (t < this.selfIntersectThre) {
			return MAX_DISTANCE;
		}
		return t;
	} else {
		var result = this.octree.intersect(origin, direction);
		if (result[0] < this.selfIntersectThre) {
			return MAX_DISTANCE;
		}
		return result[0];
	}
};

// Phong shading to get the normal vector
Mesh.prototype.normal = function(result) {
	var index = result[1];
	var s = result[2];
	var u = result[3];
	var v = result[4];
	var x = this.F[index].x;
	var y = this.F[index].y;
	var z = this.F[index].z;
	var normal = this.N[x].multiply(s).addN(this.N[y].multiply(u)).addN(this.N[z].multiply(v));
	return normal.toUnitVectorN();
};

Mesh.prototype.getMaterial = function(result) {
	return this.mtr;
};

Mesh.prototype.intersectTriangle = function(origin, direction, v1, v2, v3) {
	RIC.addIntersect();
	var edge1 = v2.subtract(v1);
	var edge2 = v3.subtract(v1);

	var pvec = direction.cross(edge2);
	var det  = edge1.dot(pvec);

	var result = [MAX_DISTANCE, -1, 0, 0, 0];
	
	// the ray is parallel to the plane
	if (det > -EPSILON && det < EPSILON) {
		return result;
	} else {
		var inv_det = 1 / det;
		var tvec = origin.subtract(v1);
		var u = tvec.dot(pvec) * inv_det;

		if (u < 0 || u > 1.0) {
			return result;
		}

		var qvec = tvec.cross(edge1);
		var v = direction.dot(qvec) * inv_det;
		if (v < 0.0 || v > 1.0) {
			return result;
		}

		if (u + v > 1.0) {
			return result;
		}

		var t = edge2.dot(qvec) * inv_det;
		if (t < EPSILON) {
			return result;
		}

		var s = 1 - u - v;
		result[0] = t;
		result[2] = s;
		result[3] = u;
		result[4] = v;
		return result;
	}
};

Mesh.prototype.intersectTriangleS = function(origin, direction, v1, v2, v3) {
	RIC.addIntersect();
	var edge1 = v2.subtract(v1);
	var edge2 = v3.subtract(v1);

	var pvec = direction.cross(edge2);
	var det  = edge1.dot(pvec);
	
	// the ray is parallel to the plane
	if (det > -EPSILON && det < EPSILON) {
		return MAX_DISTANCE;
	} else {
		var inv_det = 1 / det;
		var tvec = origin.subtract(v1);
		var u = tvec.dot(pvec) * inv_det;

		if (u < 0 || u > 1.0) {
			return MAX_DISTANCE;
		}

		var qvec = tvec.cross(edge1);
		var v = direction.dot(qvec) * inv_det;
		if (v < 0.0 || v > 1.0) {
			return MAX_DISTANCE;
		}

		if (u + v > 1.0) {
			return MAX_DISTANCE;
		}

		var t = edge2.dot(qvec) * inv_det;
		if (t < EPSILON) {
			return MAX_DISTANCE;
		}

		return t;
	}
};

// return t and index of which triangle to be intersect in the list
// used in OC Tree
Mesh.prototype.intersectList = function(origin, direction, list) {
	var result = new Array(5);
	result[0] = MAX_DISTANCE;
	for (var i = 0; i < list.length; ++i) {
		var index = list[i];
		var x = this.F[index].x;
		var y = this.F[index].y;
		var z = this.F[index].z;
		var result_temp = this.intersectTriangle(origin, direction, this.V[x], this.V[y], this.V[z]);
		if (result_temp[0] < result[0]) {
			result = result_temp;
			result[1] = index;
		}
	}
	return result;
};

Mesh.prototype.material = function(result) {
	return this.mtr;
};

Mesh.prototype.applyMatrix = function(mat) {
	for (var i = 0; i < this.nbV(); ++i) {
		var homo = this.V[i].toVector4();
		var vNew = mat.multiplyVec4(homo).toVector3();
		if (vNew === 'infinite') {
			this.V[i] = $V(MAX_DISTANCE, MAX_DISTANCE, MAX_DISTANCE);
		} else {
			this.V[i] = vNew;
		}
	}
	this.computeBoundBox();
	this.computeNormals();
};

Mesh.prototype.getBoundBox = function() {
	return this.boundBox;
};

Mesh.prototype.getIndex = function() {
	var arr = new Array(this.nbF());
	for (var i = 0; i < arr.length; ++i) {
		arr[i] = i;
	}
	return arr;
};

// intersection test for triangle and box
Mesh.prototype.intersectVoxel = function(index, box) {
	var f = this.F[index];
	var v1 = this.V[f.x];
	var v2 = this.V[f.y];
	var v3 = this.V[f.z];

	// vertex inside box test
	if (box.vertexInside(v1)) {
		return true;
	}

	if (box.vertexInside(v2)) {
		return true;
	}

	if (box.vertexInside(v3)) {
		return true;
	}

	// vertex outside slab test
	if (box.triOutsideSlab(v1, v2, v3)) {
		return false;
	}

	// edge inside box test
	var p1 = v2.subtract(v1);
	var t1 = p1.modulus();

	var p2 = v3.subtract(v1);
	var t2 = p2.modulus();

	var p3 = v3.subtract(v2);
	var t3 = p3.modulus();

	if (box.intersect(v1, p1.toUnitVectorN()) < t1) {
		return true;
	}

	if (box.intersect(v1, p2.toUnitVectorN()) < t2) {
		return true;
	}

	if (box.intersect(v2, p3.toUnitVectorN()) < t3) {
		return true;
	}

	// diagonal intersect test
	var diagonals = box.getDiagonals();
	for (var i = 0; i < 8; i += 2) {
		var origin = diagonals[i];
		var direction = diagonals[i + 1];
		var t = this.intersectTriangleS(origin, direction, v1, v2, v3);
		if (t < MAX_DISTANCE) {
			return true;
		}
	}

	return false;
};