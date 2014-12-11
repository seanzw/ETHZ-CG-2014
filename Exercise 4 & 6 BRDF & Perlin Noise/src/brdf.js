// brdf.js
// computer graphics exercise 4

var gl = null;
var canvas = null;

var shadersList = new Array();
var shaders = new Array();
var currentShader = 0;

var currentMaterial = 0;
var showTeapot = true;

var showCode = false;

var currentTime = 0.0;

// 3 point light sources
var lights = new Array();
lights.push({position: new Float32Array([10, 10, 10]), color: new Float32Array([1, 1, 1])});
// lights.push({position: new Float32Array([10, 10, 10]), color: new Float32Array([0, 0, 0])});
// lights.push({position: new Float32Array([10, 10, 10]), color: new Float32Array([0, 0, 0])});

lights.push({position: new Float32Array([-10, -10, 2]), color: new Float32Array([1, 1, 1])});
lights.push({position: new Float32Array([-2, 5, -10]), color: new Float32Array([1, 1, 1])});

// global ambient light
var global_ambient = new Float32Array([0.2, 0.2, 0.2]);

// projection and model-view matrices
var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

// per-shader material parameters controllers (slider controls)
// adopted and modified from Ivo Steinmann's solution.
var shaderOptionsList = new Array();
// shader option class
function ShaderOptions() {
	this.controls = new Array();
}

function init() {
	canvas = document.getElementById("screen");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	initGL(canvas);
	showMessage(gl ? "WebGL initialized" : "Failed to initialize WebGL");

	// load objects
	initSphere();
	initTeapot();
	showMessage("Scene loaded");

	// load all shaders and shader options
	loadShaders();
	showShader(); // enable code editor
	
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// register event handlers
	canvas.onmousedown = handleMouseDown;
	document.onmouseup = handleMouseUp;
	canvas.onmousemove = handleMouseMove;
	document.onkeydown = keyboard;
	window.addEventListener('resize', reshape, false);

	captureTabWithinTextarea();

	showMessage("");
	showMessage("shift-space: toggle material");
	showMessage("shift-enter: toggle model");

	animate();
}

function loadShaders() {
	resetOptions();
	resetShaders();

	// add shaders in the header
	for(i = 0 ; i < shadersList.length ; ++i) {
		shaderOptionsList[shadersList[i]] = new ShaderOptions();
		addShader(shadersList[i]);
	}
	
	// import (asynchronously) and compile all the shaders present in the header
	SHADER_LOADER.load( 
		function(data)
		{
			for(var i = 0 ; i < shadersList.length ; ++i) {
				var shaderName = shadersList[i];
				shaders[i] = { vertex: null, fragment: null, program: null };
				shaders[i].vertex = data[shaderName].vertex;
				shaders[i].fragment = data[shaderName].fragment;
				shaders[i].program = createProgram(shaderName, shaders[i].vertex, shaders[i].fragment);
			}
			selectShader(currentShader);
			document.getElementById("shaderSelector").value = shadersList[currentShader];
		}
	);
}

function resetShaders() {
	// remove all shader script nodes that are already added
	var head = document.getElementsByTagName('head')[0];
	var nodes = head.children;
	for (var i = nodes.length - 1; i != 0; --i) {
		if (nodes[i].nodeName == 'SCRIPT' &&
				(nodes[i].getAttribute('type') == 'x-shader/x-vertex' ||
				 nodes[i].getAttribute('type') == 'x-shader/x-fragment')) {
			// delete it
			head.removeChild(nodes[i]);
		}
	}

	// remove all items in the dropbox menu
	var select = document.getElementById("shaderSelector");
	while (select.options.length > 0) {
		select.remove(0);
	}
}

function resetOptions() {
	shaderOptionsList = new Array();
	// clear material property set
	for (var i = 0; i < materials.length; i++) {
		materials[i].options = new Array();
	}
}

// create the script tags, so that the shaders can be loaded by AJAX
function addShader(name) {
	var shaderTag;
	
	shaderTag = document.createElement('script');
	shaderTag.setAttribute("data-src","brdf/"+name+".glslv?" + new Date().getTime());	// to workaround the ajax caching
	shaderTag.setAttribute("data-name",name);
	shaderTag.setAttribute("type","x-shader/x-vertex");
	document.getElementsByTagName('head')[0].appendChild(shaderTag);
	
	shaderTag = document.createElement('script');
	shaderTag.setAttribute("data-src","brdf/"+name+".glslf?" + new Date().getTime());
	shaderTag.setAttribute("data-name",name);
	shaderTag.setAttribute("type","x-shader/x-fragment");
	document.getElementsByTagName('head')[0].appendChild(shaderTag);
	
	// embed the slider information associated to the shader
	//shaderTag = document.createElement('script');
	//shaderTag.setAttribute("src","brdf/"+name+".js?" + new Date().getTime());
	//shaderTag.setAttribute("type","text/javascript");
	//document.getElementsByTagName('head')[0].appendChild(shaderTag);

	// load it async using ajax instead
	$.getJSON("brdf/" + name + ".json", { t: new Date().getTime() },
		function (data) {
			// load the controls
			shaderOptionsList[name].controls = data;
			// store the default values to the material property set
			for (var mi = 0; mi < materials.length; mi++) {
				var mat = materials[mi];
				mat.options[name] = new Array();
				for (var oi = 0; oi < data.length; oi++) {
					mat.options[name][oi] = data[oi].default[mi];
				}
			}
		}
	);

	var select = document.getElementById("shaderSelector").options;
	select[select.length] = new Option(name);
}

// select the shader and put the code in the textareas
function selectShader(idx) {
	switchShader(idx);
	document.getElementById('editor_vshader').value = shaders[idx].vertex;
	document.getElementById('editor_fshader').value = shaders[idx].fragment;
}

// recompile the shader using the textareas
function compileShader() {
	shaders[currentShader].vertex = document.getElementById('editor_vshader').value;
	shaders[currentShader].fragment = document.getElementById('editor_fshader').value;
	
	var shader = shaders[currentShader].program;

	// disable all enabled vertex array objects before switching to the new shader
	if(shader) {
		if (shader.vertexPositionAttribute >= 0)
			gl.disableVertexAttribArray(shader.vertexPositionAttribute);
		if (shader.vertexNormalAttribute >= 0)
			gl.disableVertexAttribArray(shader.vertexNormalAttribute);
		if (shader.textureCoordAttribute >= 0)
			gl.disableVertexAttribArray(shader.textureCoordAttribute);
	}

	shaders[currentShader].program = createProgram(shadersList[currentShader], shaders[currentShader].vertex, shaders[currentShader].fragment);
	shader = shaders[currentShader].program;
	
	if(shaders[currentShader].program) {
		gl.useProgram(shaders[currentShader].program);

		// enable vertex array objects that are used by the new shader
		if (shader.vertexPositionAttribute >= 0)
			gl.enableVertexAttribArray(shader.vertexPositionAttribute);
		if (shader.vertexNormalAttribute >= 0)
			gl.enableVertexAttribArray(shader.vertexNormalAttribute);
		if (shader.textureCoordAttribute >= 0)
			gl.enableVertexAttribArray(shader.textureCoordAttribute);
	}

	// reset slide bars
	// better read off the current values from the controls and set them to the uniforms
	updateOptionControls();
}

// set uniforms

function setTransformationMatrices() {
	try {
		var s = shaders[currentShader].program;
		gl.uniformMatrix4fv(s.pMatrixUniform, false, pMatrix);
		gl.uniformMatrix4fv(s.mvMatrixUniform, false, mvMatrix);

		var normalMatrix = mat3.create();
		mat4.toInverseMat3(mvMatrix, normalMatrix);
		mat3.transpose(normalMatrix);
		gl.uniformMatrix3fv(s.nMatrixUniform, false, normalMatrix);
	} catch(e) {}
}

function setMaterialProperties() {
	try {
		var m = materials[currentMaterial];
		var s = shaders[currentShader].program;
		gl.uniform3fv(s.ambientColorUniform, m.ambient);
		gl.uniform3fv(s.diffuseColorUniform, m.diffuse);
		gl.uniform3fv(s.specularColorUniform, m.specular);

		// set options
		var shaderName = shadersList[currentShader];
		for (var i = 0; i < s.optionUniforms.length; i++) {
			gl.uniform1f(s.optionUniforms[i], m.options[shaderName][i]);
		}
	} catch(e) {}
}

function setLights() {
	try {
		var s = shaders[currentShader].program;
		for (i = 0; i < 3; i++) {
			// transform the light positions according to the current model-view matrix
			// so that the lights are not fixed with the eyes position.
			var pos = new Float32Array(lights[i].position);
			mat4.multiplyVec3(mvMatrix, pos);
			gl.uniform3fv(s.pointLightingLocationUniform[i], pos);
			gl.uniform3fv(s.pointLightingColorUniform[i], lights[i].color);
		}
		gl.uniform3fv(s.globalAmbientLightingColorUniform, global_ambient);
	} catch(e) {}
}

function setCurrentTime() {
	try {
		var s = shaders[currentShader].program;
		gl.uniform1f(s.currentTimeUniform, currentTime);
		currentTime += 0.0005;
	} catch(e) {}
}

function switchShader(newShaderIndex) {
	if (	newShaderIndex >= 0 &&
			newShaderIndex < shaders.length &&
			shaders[newShaderIndex].program) {
		var shader = shaders[currentShader].program;

		if(shader) {
			// disable all enabled vertex array objects before switching to the new shader
			if (shader.vertexPositionAttribute >= 0)
				gl.disableVertexAttribArray(shader.vertexPositionAttribute);
			if (shader.vertexNormalAttribute >= 0)
				gl.disableVertexAttribArray(shader.vertexNormalAttribute);
			if (shader.textureCoordAttribute >= 0)
				gl.disableVertexAttribArray(shader.textureCoordAttribute);
		}

		currentShader = newShaderIndex;
		shader = shaders[currentShader].program;
		
		if(shader) {
			gl.useProgram(shader);

			// enable vertex array objects that are used by the new shader
			if (shader.vertexPositionAttribute >= 0)
				gl.enableVertexAttribArray(shader.vertexPositionAttribute);
			if (shader.vertexNormalAttribute >= 0)
				gl.enableVertexAttribArray(shader.vertexNormalAttribute);
			if (shader.textureCoordAttribute >= 0)
				gl.enableVertexAttribArray(shader.textureCoordAttribute);
		}

		// update slide bars
		updateOptionControls();
	}
}

function updateOptionControls() {
	// load controls for current shader
	var shader = shaders[currentShader].program;
	var opt = shaderOptionsList[shadersList[currentShader]];
	var o = document.getElementById('editor_options');        
	try {            
		o.innerHTML = "";

		for (var i=0; i<opt.controls.length; i++) {
			var ctrl = opt.controls[i];

			var outer = document.createElement('div');
			outer.setAttribute("class", "slider");

			// create label
			var l = document.createElement('div');
			l.setAttribute("class", "slider_label");
			l.innerHTML = ctrl.label;
			outer.appendChild(l);

			// get the value
			var value = materials[currentMaterial].options[shadersList[currentShader]][i];

			// create slider
			var c = document.createElement('input');
			c.setAttribute("class", "slider_control");
			c.setAttribute("type", "range");
			c.setAttribute("min", ctrl.min);
			c.setAttribute("max", ctrl.max);
			c.setAttribute("step", ctrl.step); 
			c.setAttribute("onInput", "setOptionValue(" + i + ", this.value); document.getElementById('" + "control_display_" + ctrl.uniform + "').innerHTML = this.value;"); 
			c.value = value;
			outer.appendChild(c);

			// create display value
			var d = document.createElement('div');
			d.setAttribute("class", "slider_value");
			d.setAttribute("id", "control_display_"+ctrl.uniform);
			d.innerHTML = value;
			outer.appendChild(d);

			// outer & break
			o.appendChild(outer);

			if (shader.optionUniforms[i])
				gl.uniform1f(shader.optionUniforms[i], value);
		}

		if (opt.controls.length == 0) {
			o.innerHTML = "<div class=\"slider\">No parameters available</div>";
		}
	} catch(e) {
		console.log(e);
	}
}

function setOptionValue(idx, value) {
	var shaderName = shadersList[currentShader];
	var options = materials[currentMaterial].options[shaderName];
	options[idx] = value;
}

function locateAttribsAndUniforms(shaderName, shaderProgram) {
	// get attribute and uniform locations and store them for later uses

	// if an attribute is defined but not used in the shader (eg does not
	// contribute the final fragment color), it is stripped out and is not
	// locatable by getAttribLocation function, which instead returns -1.  on
	// the other hand, getUniformLocation returns null in such cases, and
	// subsequent calls using the uniform location are silently ignored.

	gl.useProgram(shaderProgram);

	// get vertex attribute locations
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertexPosition");
	shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "vertexNormal");
	shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "textureCoord");

	// get uniform locations for transformation matrices
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "modelViewMatrix");
	shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "normalMatrix");

	// get uniform locations for material properties
	shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "materialAmbientColor");
	shaderProgram.diffuseColorUniform = gl.getUniformLocation(shaderProgram, "materialDiffuseColor");
	shaderProgram.specularColorUniform = gl.getUniformLocation(shaderProgram, "materialSpecularColor");

	shaderProgram.currentTimeUniform = gl.getUniformLocation(shaderProgram, "currentTime");

	// get uniform locations for lights
	shaderProgram.pointLightingLocationUniform = new Array();
	shaderProgram.pointLightingColorUniform = new Array();
	for (i = 0; i < 3; i++) {
		shaderProgram.pointLightingLocationUniform[i] =
			gl.getUniformLocation(shaderProgram, "lightPosition[" + i + "]");
		shaderProgram.pointLightingColorUniform[i] =
			gl.getUniformLocation(shaderProgram, "lightColor[" + i + "]");
	}
	shaderProgram.globalAmbientLightingColorUniform =
		gl.getUniformLocation(shaderProgram, "globalAmbientLightColor");

	// get uniform locations for options (slide bars)
	locateOptionUniforms(shaderName, shaderProgram);
}

function locateOptionUniforms(shaderName, shaderProgram) {
	// get uniform locations for options
	shaderProgram.optionUniforms = new Array();    
	var opt = shaderOptionsList[shaderName];
	for (var i=0; i<opt.controls.length; i++) {
		var ctrl = opt.controls[i]; 
		shaderProgram.optionUniforms[i] = gl.getUniformLocation(shaderProgram, ctrl.uniform);
	}
}

function display() {
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// an alternative way to rotate eye position:
	// apply eye translation and rotation to the projection matrix
	//
	//var tempMatrix = mat4.create();
	//mat4.perspective(40, canvas.width / canvas.height, 0.1, 100, pMatrix);
	//mat4.lookAt([0, 0, 10], [0, 0, 0], [0, 1, 0], tempMatrix);
	//mat4.multiply(tempMatrix, rotationMatrix);
	//mat4.multiply(pMatrix, tempMatrix);
	//
	// then start with identity matrix as model-view instead of setting eye position
	//
	//mat4.identity(mvMatrix);
	//
	// with this done, no need to apply rotation to light positions.

	// set projection matrix
	mat4.perspective(40, canvas.width / canvas.height, 0.1, 100, pMatrix);

	// set model view matrix
	mat4.lookAt([0, 0, 10], [0, 0, 0], [0, 1, 0], mvMatrix);
	mat4.multiply(mvMatrix, rotationMatrix);

	setMaterialProperties();
	setLights();
	setCurrentTime();

	// make two objects look in a similar scale
	if (showTeapot) mat4.scale(mvMatrix, [0.2, 0.2, 0.2]);
	else mat4.scale(mvMatrix, [1.2, 1.2, 1.2]);

	setTransformationMatrices();

	if (showTeapot) drawTeapot();
	else drawSphere();
}

function reshape() {
	// adapt size of the canvas depending if the code editor is enabled
	if(showCode) {
		canvas.style.left = '640px';
		canvas.width = window.innerWidth - 640;
		canvas.height = window.innerHeight;
	}
	else {
		canvas.style.left = '0px';
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}	
	display();
}

// keep it responsive!
function animate() {
	requestAnimFrame(animate);
	display();
}

// manage model-view matrix stack

function mvPushMatrix() {
	var copy = mat4.create();
	mat4.set(mvMatrix, copy);
	mvMatrixStack.push(copy);
}

function mvPopMatrix() {
	if (mvMatrixStack.length == 0) {
		throw "Invalid popMatrix!";
	}
	mvMatrix = mvMatrixStack.pop();
}

// mouse event handling

var rotationMatrix = mat4.create();
mat4.identity(rotationMatrix);

var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

var rotation = quat4.create([0, 0, 0, 1]);
var last_rotation = null;
var speed_factor = 8;

function handleMouseDown(event) {
	if (event.button == 2) return;	// ignore right clicks
	mouseDown = true;
	var d = Math.min(canvas.width, canvas.height);
	lastMouseX = speed_factor * (event.layerX - canvas.width / 2) / d;
	lastMouseY = -speed_factor * (event.layerY - canvas.height / 2) / d;
	last_rotation = quat4.create(rotation);
}

function handleMouseUp(event) {
	mouseDown = false;
}

// augument quat4 of glMatrix
quat4.createFromAxisAngle = function(axis, angle) {
	if (vec3.length(axis)) {
		vec3.normalize(axis);
		var s = Math.sin(angle/2);
		var c = Math.cos(angle/2);
		return quat4.create([axis[0]*s, axis[1]*s, axis[2]*s, c]);
	} else {
		return quat4.create([0, 0, 0, 1]);
	}
}

function handleMouseMove(event) {
	if (!mouseDown) return;

	var d = Math.min(canvas.width, canvas.height);
	var x = speed_factor * (event.layerX - canvas.width / 2) / d;
	var y = -speed_factor * (event.layerY - canvas.height / 2) / d;
	var z = 1;

	var v0 = vec3.create([lastMouseX, lastMouseY, z]);
	var v1 = vec3.create([x, y, z]);
	vec3.normalize(v0);
	vec3.normalize(v1);
	var axis = vec3.create();
	vec3.cross(v0, v1, axis);
	var sa = Math.sqrt(vec3.dot(axis, axis));
	var ca = vec3.dot(v0, v1);
	var angle = Math.atan2(sa, ca);

	if (x*x + y*y > 1) angle *= 1.0 + 0.2 * (Math.sqrt(x*x + y*y) - 1.0);

	// axis-angle representation -> quaternion
	var qrot = quat4.createFromAxisAngle(axis, angle);

	quat4.multiply(qrot, last_rotation);
	quat4.normalize(qrot);
	quat4.set(qrot, rotation);
	quat4.toMat4(rotation, rotationMatrix);
	mat4.transpose(rotationMatrix);	// because opengl rotation matrix is column-major?
}

// keyboard event handling

function keyboard(event) {
	var keyCode = event.keyCode;
	var keyStr = String.fromCharCode(keyCode);

	// returning false prevents further propagation of the event

	if (event.shiftKey && keyStr == " ") {
		toggleMaterial();
		return false;
	} else if (event.shiftKey && keyCode == 13) {
		toggleModel();
		return false;
	//} else if (keyStr.toLowerCase() == "e") {
	//	exportPNG();
	//	//return false;
	//} else if (keyStr.toLowerCase() == "h") {
	//	showMessage("************************");
	//	showMessage("<enter>: change model");
	//	showMessage("<space>: change material");
	//	showMessage("<mouse drag>: rotate");
	//	showMessage("e: export as image");
	//	showMessage("************************");
	}
}

// helper functions

function showMessage(msg) {
	//document.getElementById("message").textContent = msg;
	var obj = document.getElementById("message");
	obj.insertBefore(document.createElement("br"), obj.firstChild);
	obj.insertBefore(document.createTextNode(msg.toUpperCase()), obj.firstChild);
}

function toggleMaterial() {
	currentMaterial = (currentMaterial + 1) % materials.length;
	updateOptionControls();
}

function toggleModel() {
	showTeapot = !showTeapot;
}

function exportPNG() {
	var data = canvas.toDataURL("image/png");
	data = data.replace("image/png", "image/octet-stream");
	document.getElementById("exportLink").href = data;
	document.getElementById("exportLink").download = "cg-ex4-export.png";	// not supported by safari yet
	document.getElementById("exportLink").click();
}

function exportShaders() {
	document.getElementById("exportLink").href = "data:text/plain;base64," + btoa(document.getElementById("editor_fshader").value);
	document.getElementById("exportLink").download = "custom.glslf";	// not supported by safari yet
	document.getElementById("exportLink").click();
	
	document.getElementById("exportLink").href = "data:text/plain;base64," + btoa(document.getElementById("editor_vshader").value);
	document.getElementById("exportLink").download = "custom.glslv";	// not supported by safari yet
	document.getElementById("exportLink").click();
}

function showShader() {
	if(showCode) {
		document.getElementById('show_button').innerHTML = 'Show Shader Code';
		document.getElementById('editor').style.display = 'none';
		showCode = false;
	}
	else {
		document.getElementById('show_button').innerHTML = 'Hide Shader Code';
		document.getElementById('editor').style.display = 'block';
		showCode = true;
	}
	reshape();
}

// taken from http://stackoverflow.com/a/6140696
function captureTabWithinTextarea() {
	$("textarea").keydown(function(e) {
		if(e.keyCode === 9) { // tab was pressed
			// get caret position/selection
			var start = this.selectionStart;
			var end = this.selectionEnd;

			var $this = $(this);
			var value = $this.val();

			// set textarea value to: text before caret + tab + text after caret
			$this.val(value.substring(0, start)
				+ "\t"
				+ value.substring(end));

			// put caret at right position again (add one for the tab)
			this.selectionStart = this.selectionEnd = start + 1;

			// prevent the focus lose
			e.preventDefault();
		}
	});
}

// webgl things + shaders

function initGL(canvas) {
	// init webgl
	var props = {preserveDrawingBuffer: true};	// for image export
	try { gl = canvas.getContext("webgl", props) || canvas.getContext("experimental-webgl", props); }
	catch (e) {}

	if (!gl) alert("Failed to initialize WebGL. Your browser may not support it.");
}

function createProgram(shaderName, vShader, fShader) {
	
	// compile vertex code
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vShader);
	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		showMessage("compile error");
		alert("[Shader compile error: " + shaderName + ".glslv]\n" + gl.getShaderInfoLog(vertexShader));
		return null;
	}
	
	// compile fragment code
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fShader);
	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		showMessage("compile error");
		alert("[Shader compile error: " + shaderName + ".glslf]\n" + gl.getShaderInfoLog(fragmentShader));
		return null;
	}

	// create program
	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		showMessage("not defined shader");
		return null;
	}

	// get attribute and uniform locations and store them for later uses
	locateAttribsAndUniforms(shaderName, shaderProgram);

	return shaderProgram;
}

// Provides requestAnimationFrame in a cross browser way.
// taken from Google WebGL Utils
window.requestAnimFrame = (function() {
	return window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
		window.setTimeout(callback, 1000/60);
	};
})();

