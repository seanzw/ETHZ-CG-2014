/*
 *	@author Romain Prévost (ETH Zürich / Disney Research Zürich)
 *  Original code by zz85 / http://twitter.com/blurspline / http://www.lab4games.net/zz85/blog
 */

LoopSubdivisionModifier = function ( subdivisions ) {

	this.subdivisions = (subdivisions === undefined ) ? 1 : subdivisions;

};

// Applies the "modify" pattern
LoopSubdivisionModifier.prototype.modify = function ( geometry ) {

	var repeats = this.subdivisions;


	/*
	 * Loop subdivision only works on triangular meshes, so before starting the subdivision
	 * I convert the Quad faces to 2 Triangular faces
	 */
	var triFaces = [];
	for ( i = 0, il = geometry.faces.length; i < il; i++ ) {
		face = geometry.faces[ i ];
		if ( face instanceof THREE.Face3 ) {
			triFaces.push(face);
		}
		else if( face instanceof THREE.Face4 ) {
			triFaces.push(new THREE.Face3(face.a,face.b,face.c));
			triFaces.push(new THREE.Face3(face.c,face.d,face.a));
		}
	}
	geometry.faces = triFaces;
	/*
	 * done...
	 */


	while ( repeats-- > 0 ) {
		this.smooth( geometry );
	}

	delete geometry.__tmpVertices;

	geometry.computeFaceNormals();
	geometry.computeVertexNormals();

};

// Performs one iteration of Subdivision
LoopSubdivisionModifier.prototype.smooth = function ( geometry ) {

	function hashEdge( a, b ) {
		return Math.min( a, b ) + "_" + Math.max( a, b );
	}
	function getEdge( a, b, map ) {
		var key = hashEdge(a,b);
		return map[ key ];
	}
	function newFace( faces, a, b, c ) {
		faces.push( new THREE.Face3( a, b, c ) );
	}
	function oppositeVertex( face, a, b ) {
		if(face.a != a && face.a != b) return face.a;
		if(face.b != a && face.b != b) return face.b;
		if(face.c != a && face.c != b) return face.c;
		console.log('Error: the opposite vertex couldn\'t be found');
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
	for ( i = 0, il = oldVertices.length; i < il; i++ ) {
		vvMap[ i ] = [];
	}

	var face;
	for ( i = 0, il = oldFaces.length; i < il; i++ ) {
		face = oldFaces[ i ];
		processEdge( face.a, face.b, oldEdges, i, vvMap );
		processEdge( face.b, face.c, oldEdges, i, vvMap );
		processEdge( face.c, face.a, oldEdges, i, vvMap );
	}

	/******************************************************
	 *
	 *	For each edge, create a new Edge Vertex
	 *
	 *******************************************************/
	var newEdgeVertices = [];

	// TODO ...
	var k = oldVertices.length;

	for (var key in oldEdges) {
		if (oldEdges.hasOwnProperty(key)) {
			oldEdges[key].newVertex = k;
			k++;
			var edge = oldEdges[key];
			var newVertice = new THREE.Vector3();
			if (edge.faces.length == 1) {
				// an edge at the boundary
				newVertice.add(oldVertices[edge.a]);
				newVertice.add(oldVertices[edge.b]);
				newVertice.divideScalar(2);
			} else if (edge.faces.length == 2) {
				// an interior edge
				newVertice.add(oldVertices[edge.a]);
				newVertice.add(oldVertices[edge.b]);
				newVertice.multiplyScalar(3);

				for (var j = 0; j < edge.faces.length; ++j) {
					var face = oldFaces[edge.faces[j]];
					var vvId = oppositeVertex(face, edge.a, edge.b);
					newVertice.add(oldVertices[vvId]);
				}

				newVertice.divideScalar(8.0);
			}

			newEdgeVertices.push(newVertice);
		}
	}

	/******************************************************
	 *
	 *	Reposition each source vertices.
	 *
	 *******************************************************/

	var newSourceVertices = [];

	// TODO ...
	for (var vvId = 0; vvId < oldVertices.length; ++vvId) {
		var newVertice = new THREE.Vector3();

		// Calculate the beta
		var k = vvMap[vvId].length;
		var beta = 1 / k * (5 / 8 - Math.pow(3 / 8 + 1 / 4 * Math.cos(2 * Math.PI / k), 2));

		var isBoundary = false;

		for (var j = 0; j < vvMap[vvId].length; ++j) {
			var neighborVetrticeId = vvMap[vvId][j];
			if (getEdge(vvId, neighborVetrticeId, oldEdges).faces.length == 1) {
				// this is a vertice on the boundary
				if (isBoundary) {
					newVertice.add(oldVertices[neighborVetrticeId]);
					break;
				} else {
					// reset the vertice
					isBoundary = true;
					newVertice.set(0, 0, 0);
					newVertice.add(oldVertices[neighborVetrticeId]);
				}
			} else if (!isBoundary) {
				// this is an interior vertice
				newVertice.add(oldVertices[neighborVetrticeId]);
			}
		}

		if (isBoundary) {
			newVertice.divideScalar(6.0);
			newVertice.add(oldVertices[vvId]);
			newVertice.multiplyScalar(3 / 4);
			console.log("a boundary vertice");
		} else {
			newVertice.multiplyScalar(beta / (1 - k * beta));
			newVertice.add(oldVertices[vvId]);
			newVertice.multiplyScalar(1 - k * beta);
		}

		newSourceVertices.push(newVertice);
	}


	var newVertices = newSourceVertices.concat(newEdgeVertices);
						   
	/******************************************************
	 *
	 *	Generate the faces
	 *
	 *******************************************************/

	var newFaces = [];

	// TODO ...
	for (var j = 0; j < oldFaces.length; ++j) {
		var face = oldFaces[j];
		var v1 = face.a;
		var v2 = face.b;
		var v3 = face.c;

		var v12 = getEdge(v1, v2, oldEdges).newVertex;
		var v23 = getEdge(v2, v3, oldEdges).newVertex;
		var v31 = getEdge(v3, v1, oldEdges).newVertex;

		newFace(newFaces, v1, v12, v31);
		newFace(newFaces, v2, v23, v12);
		newFace(newFaces, v3, v31, v23);
		newFace(newFaces, v12, v23, v31);
	}

	// Overwrite old arrays
	geometry.vertices = newVertices;
	geometry.faces = newFaces;

};

