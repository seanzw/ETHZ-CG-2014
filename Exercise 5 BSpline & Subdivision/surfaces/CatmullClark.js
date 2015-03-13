/*
 *	@author Romain Prévost (ETH Zürich / Disney Research Zürich)
 *  Original code by zz85 / http://twitter.com/blurspline / http://www.lab4games.net/zz85/blog
 */

CatmullClarkModifier = function( subdivisions ) {
	
	this.subdivisions = (subdivisions === undefined ) ? 1 : subdivisions;
	
};

CatmullClarkModifier.prototype.constructor = CatmullClarkModifier;

// Applies the "modify" pattern
CatmullClarkModifier.prototype.modify = function ( geometry ) {
	
	var repeats = this.subdivisions;
	
	while ( repeats-- > 0 ) {
		this.smooth( geometry );
	}

	delete geometry.__tmpVertices;

	geometry.computeFaceNormals();
	geometry.computeVertexNormals();
};

// Performs an iteration of Catmull-Clark Subdivision
CatmullClarkModifier.prototype.smooth = function ( geometry ) {

	function hashEdge( a, b ) {
		return Math.min( a, b ) + "_" + Math.max( a, b );
	}
	function getEdge( a, b, map ) {
		var key = hashEdge(a,b);
		return map[ key ];
	}
	function newFace( faces, a, b, c, d ) {
		faces.push( new THREE.Face4( a, b, c, d ) );
	}

	function computeCentroid( face, vertices ) {
		var centroid = new THREE.Vector3();
		centroid.set(0, 0, 0);

		if ( face instanceof THREE.Face3 ) {
			centroid.add( vertices[ face.a ] );
			centroid.add( vertices[ face.b ] );
			centroid.add( vertices[ face.c ] );
			centroid.divideScalar( 3 );
		} else if ( face instanceof THREE.Face4 ) {
			centroid.add( vertices[ face.a ] );
			centroid.add( vertices[ face.b ] );
			centroid.add( vertices[ face.c ] );
			centroid.add( vertices[ face.d ] );
			centroid.divideScalar( 4 );
		}

		return centroid;
	}

	function processEdge( vA, vB, edgeMap, faceId, vvMap ) {

		var key = hashEdge(vA,vB);
		var edge;

		if ( key in edgeMap ) {
			edge = edgeMap[ key ];
		} else {

			edge = {
				a: vA, // oldVertex i
				b: vB, // oldVertex j
				newVertex: null, // use this know the new vertex index
				faces: [] // neighboring faces
			};

			edgeMap[ key ] = edge;
			vvMap[ vA ].push( vB );
			vvMap[ vB ].push( vA );
		}

		edge.faces.push( faceId );
	}

	var i, il;

	/******************************************************
	 *
	 * Preprocess Geometry to generate connectivity Lookup
	 *
	 *******************************************************/

	var oldVertices = geometry.vertices;
	var oldFaces = geometry.faces;
	var oldEdges = {}; // hash map storing information for each edge. for an edge between vertices i and j, the key is hashEdge(i,j) and the value is getEdge(oldEdges,i,j) == oldEdge[hashMap(i,j)]. see processEdge for details
	var vvMap = new Array( oldVertices.length ); // for each vertex i, vvMap[i] is an array with the neighboring vertices
	var vfMap = new Array( oldVertices.length ); // for each vertex i, vfMap[i] is an array with the neighboring faces
	for ( i = 0, il = oldVertices.length; i < il; i++ ) {
		vvMap[ i ] = [];
		vfMap[ i ] = [];
	}

	var face;
	for ( i = 0, il = oldFaces.length; i < il; i++ ) {
		face = oldFaces[ i ];
		if ( face instanceof THREE.Face3 ) {
			processEdge(face.a, face.b, oldEdges, i, vvMap);
			processEdge(face.b, face.c, oldEdges, i, vvMap);
			processEdge(face.c, face.a, oldEdges, i, vvMap);
			vfMap[face.a].push(i);
			vfMap[face.b].push(i);
			vfMap[face.c].push(i);
		}
		else if( face instanceof THREE.Face4 ) {
			processEdge(face.a, face.b, oldEdges, i, vvMap);
			processEdge(face.b, face.c, oldEdges, i, vvMap);
			processEdge(face.c, face.d, oldEdges, i, vvMap);
			processEdge(face.d, face.a, oldEdges, i, vvMap);
			vfMap[face.a].push(i);
			vfMap[face.b].push(i);
			vfMap[face.c].push(i);
			vfMap[face.d].push(i);
		}
	}

	/******************************************************
	 *
	 *	For each face, create a new Face Vertex
	 *
	 *******************************************************/
	var newFaceVertices = [];

	// TODO ...
	for (i = 0, il = oldFaces.length; i < il; ++i) {
		face = oldFaces[i];
		newFaceVertices.push(computeCentroid(face, oldVertices));
	}

	/******************************************************
	 *
	 *	For each edge, create a new Edge Vertex
	 *
	 *******************************************************/

	var newEdgeVertices = [];
	var numFaceVertices = newFaceVertices.length;
	var numOldVertices = oldVertices.length;
	var k = 0;

	// TODO ...
	for (var key in oldEdges) {
		var edge = oldEdges[key];
		if (edge.faces.length == 2) {
			// this is an interior edge
			var newVertice = new THREE.Vector3();
			newVertice.add(oldVertices[edge.a]);
			newVertice.add(oldVertices[edge.b]);
			newVertice.add(newFaceVertices[edge.faces[0]]);
			newVertice.add(newFaceVertices[edge.faces[1]]);
			newVertice.divideScalar(4.0);
			newEdgeVertices.push(newVertice);
			oldEdges[key].newVertex = k;
			k++;
		} else if (edge.faces.length == 1) {
			// this is a boundary edge
			// and a boundary edge is tagged as sharp
			var newVertice = new THREE.Vector3();
			newVertice.add(oldVertices[edge.a]);
			newVertice.add(oldVertices[edge.b]);
			newVertice.divideScalar(2.0);
			newEdgeVertices.push(newVertice);
			oldEdges[key].newVertex = k;
			k++;			
		} else {
			throw "Not Correct Mesh!";
		}
	}

	/******************************************************
	 *
	 *	Reposition each source vertices.
	 *
	 *******************************************************/

	var newSourceVertices = [];

	for (i = 0; i < numOldVertices; ++i) {
		var newVertice = new THREE.Vector3();
		var n = vvMap[i].length;
		var isBoundary = n != vfMap[i].length;

		if (!isBoundary) {

			var F = new THREE.Vector3();
			for (var j = 0; j < vfMap[i].length; ++j) {
				F.add(newFaceVertices[vfMap[i][j]]);
			}
			F.divideScalar(vfMap[i].length);

			var R = new THREE.Vector3();
			for (var j = 0; j < n; ++j) {
				R.add(oldVertices[i]);
				R.add(oldVertices[vvMap[i][j]]);
			}
			R.divideScalar(2 * n);

			// an interior vertice
			newVertice.add(oldVertices[i]);
			newVertice.multiplyScalar((n - 3) / 2);

			newVertice.add(R);
			newVertice.multiplyScalar(2.0);

			newVertice.add(F);
			newVertice.divideScalar(n);
			newSourceVertices.push(newVertice);

		} else {
			// this is a boundary vertice
			// this point is tagged as crease
			newVertice.add(oldVertices[i]);
			newVertice.multiplyScalar(6.0);
			
			for (var j = 0; j < n; ++j) {
				if (getEdge(i, vvMap[i][j], oldEdges).faces.length == 1) {
					newVertice.add(oldVertices[vvMap[i][j]]);
				}
			}

			newVertice.divideScalar(8.0);
			newSourceVertices.push(newVertice);
		}
	}

	var newVertices = newSourceVertices.concat(newFaceVertices,newEdgeVertices);

	/******************************************************
	 *
	 *	Generate the faces
	 *
	 *******************************************************/

	var newFaces = [];

	// TODO ...
	for (i = 0, il = oldFaces.length; i < il; ++i) {
		face = oldFaces[i];
		if (face instanceof THREE.Face4) {
			var v1 = face.a;
			var v2 = face.b;
			var v3 = face.c;
			var v4 = face.d;

			var v12 = getEdge(v1, v2, oldEdges).newVertex + numOldVertices + numFaceVertices;
			var v23 = getEdge(v2, v3, oldEdges).newVertex + numOldVertices + numFaceVertices;
			var v34 = getEdge(v3, v4, oldEdges).newVertex + numOldVertices + numFaceVertices;
			var v41 = getEdge(v4, v1, oldEdges).newVertex + numOldVertices + numFaceVertices;

			var f = i + numOldVertices;

			newFace(newFaces, v1, v12, f, v41);
			newFace(newFaces, v2, v23, f, v12);
			newFace(newFaces, v3, v34, f, v23);
			newFace(newFaces, v4, v41, f, v34);
		} else if (face instanceof THREE.Face3) {
			var v1 = face.a;
			var v2 = face.b;
			var v3 = face.c;

			var v12 = getEdge(v1, v2, oldEdges).newVertex + numOldVertices + numFaceVertices;
			var v23 = getEdge(v2, v3, oldEdges).newVertex + numOldVertices + numFaceVertices;
			var v31 = getEdge(v3, v1, oldEdges).newVertex + numOldVertices + numFaceVertices;

			var f = i + numOldVertices;

			newFace(newFaces, v1, v12, f, v31);
			newFace(newFaces, v2, v23, f, v12);
			newFace(newFaces, v3, v31, f, v23);
		}
	}

	// Overwrite old arrays
	geometry.vertices = newVertices;
	geometry.faces = newFaces;
	
};
