/** @type {WebGLRenderingContext} */
var gl;

// import object
var g_objDoc = null; // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model

// coordinates
var pointsArray = [
	vec4(-2.0, -1.0, -1.0, 1.0),
	vec4(2.0, -1.0, -5.0, 1.0),
	vec4(-2.0, -1.0, -5.0, 1.0),

	vec4(2.0, -1.0, -1.0, 1.0),
	vec4(2.0, -1.0, -5.0, 1.0),
	vec4(-2.0, -1.0, -1.0, 1.0)
]
var texCoord = [
	vec2(0.0, 0.0),
	vec2(1.0, 1.0),
	vec2(0.0, 1.0),

	vec2(1.0, 0.0),
	vec2(1.0, 1.0),
	vec2(0.0, 0.0)
];

// lighting information 
var center = vec3(0.0, 3.0, -3.0);
var radius = 1.0;
var theta = 3.0; var beta = 0.0;
var isOrbit = false; var isJump = false;
var lightPos = getLightPos(theta);

// material information
var emission_le = vec3(1.0, 1.0, 1.0); // la = ld = ls = le
var ambient_ka = vec3(0.0, 0.0, 0.0);
var diffuse_kd = vec3(1.0, 0.8, 0.0);
var specular_ks = vec3(1.0, 1.0, 1.0);
var shininess = 20.0;

// for fbo purposes
var frameBufferObject;

init();
function init() {
	// webgl setup
	canvas = document.getElementById("gl-canvas");
	gl = WebGLUtils.setupWebGL(canvas);
	gl.enable(gl.DEPTH_TEST);

	gl.viewport(0.0, 0.0, 512, 512);
	gl.clearColor(0.117, 0.564, 0.9, 1.0);

	const ext = gl.getExtension('OES_element_index_uint');
	const ext2 = gl.getExtension('OES_texture_float');
	if (!ext) {
		console.log('Warning: Unable to use an extension');
	}

	/* --------------------------------------------------------------------------------
	* Initialization
	*/

	var programQuad = initShaders(gl, "vertex-shader-quad", "fragment-shader-quad");
	var program = initShaders(gl, "vertex-shader", "fragment-shader");

	// projection and view matrix for the light
	var lightProjection = perspective(120, 1, 1, 10); // perspective projection matrix
	var lightView = lookAt(vec3(lightPos), vec3(0.0, 0.0, -3.0), vec3(0.0, 0.0, 1.0));
	var lightPV = mult(lightProjection, lightView);
	

	/* --------------------------------------------------------------------------------
	* Quad program
	*/
	
	gl.useProgram(programQuad);

	// bind attribute values
	programQuad.vBuffer = createDataArrayBuffer(gl, flatten(pointsArray), 4, gl.FLOAT);
	programQuad.tBuffer = createDataArrayBuffer(gl, flatten(texCoord), 2, gl.FLOAT);
	programQuad.vPosition = gl.getAttribLocation(programQuad, "vPosition");
	programQuad.vTexCoord = gl.getAttribLocation(programQuad, "vTexCoord");
	programQuad.type = gl.getUniformLocation(programQuad, "type");

	// new uniform matrices
	var M = mat4();
	var V = mat4();
	var P = perspective(90, 1, 0.1, 20);
	gl.uniformMatrix4fv(gl.getUniformLocation(programQuad, "modelMatrix"), false, flatten(M));
	gl.uniformMatrix4fv(gl.getUniformLocation(programQuad, "viewMatrix"), false, flatten(V));
	gl.uniformMatrix4fv(gl.getUniformLocation(programQuad, "projectionMatrix"), false, flatten(P));
	gl.uniformMatrix4fv(gl.getUniformLocation(programQuad, "vpMatrixFromLight"), false, flatten(lightPV));
	gl.uniform1f(gl.getUniformLocation(programQuad, "type"), 0.0);

	// init texture 
	gl.activeTexture(gl.TEXTURE0);
	initTexture(gl, programQuad, '../res/xamp23.png');

	/* ---------------------------------------------------------------------------------
	* The shader for the teapot
	*/
	gl.useProgram(program);

	// camera setting
	M = transform(0, [1, 1, 1], [1, 1, 1], [0.0, -0.5, -3.0]);

	gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelMatrix"), false, flatten(M));
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "viewMatrix"), false, flatten(V));
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(P));
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "vpMatrixFromLight"), false, flatten(lightPV));
	gl.uniform1f(gl.getUniformLocation(program, "type"), 0.0);

	// lighting information
	gl.uniform4fv(gl.getUniformLocation(program, "lightPos"), flatten(lightPos));
	gl.uniform3fv(gl.getUniformLocation(program, "emission_le"), flatten(emission_le));
	gl.uniform3fv(gl.getUniformLocation(program, "diffuse_kd"), flatten(diffuse_kd));
	gl.uniform3fv(gl.getUniformLocation(program, "ambient_ka"), flatten(ambient_ka));
	gl.uniform3fv(gl.getUniformLocation(program, "specular_ks"), flatten(specular_ks));
	gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);

	// rendering
	var model = initObject(gl, program, "../res/teapot.obj", 0.3);
	setTimeout(function () {
		render(model, program, programQuad);
	}, 200);

	/* ---------------------------------------------------------------------------------
	* toggle functionality
	*/

	var toggleLightCir = document.getElementById('toggleLightCir');
	var toggleObj = document.getElementById('toggleObj');
	// toggleLightCir.addEventListener('click', function () {
	// 	isOrbit = !isOrbit;
	// 	render(model, program, programQuad);
	// });
	// toggleObj.addEventListener('click', function () {
	// 	isJump = !isJump;
	// 	render(model, program, programQuad);
	// });
}



/*
* Render functions
*/
function render(model, program, programQuad) {
	
	frameBufferObject = initFramebufferObject(gl, 512, 512);
	// render from lights and store in frameBufferObject
	gl.bindFramebuffer(gl.FRAMEBUFFER, frameBufferObject);
	// gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, frameBufferObject.width, frameBufferObject.height);

	render_quad(programQuad);
	render_obj(program, model);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	gl.viewport(0, 0, 512, 512);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// bind the texture to the quad
	gl.useProgram(programQuad);
	gl.activeTexture(gl.TEXTURE1);
	gl.uniform1i(gl.getUniformLocation(programQuad, "texShadow"), 1);
	gl.bindTexture(gl.TEXTURE_2D, frameBufferObject.texture);

	gl.uniform1f(gl.getUniformLocation(programQuad, "type"), 1.0);
	gl.useProgram(program);
	gl.uniform1f(gl.getUniformLocation(program, "type"), 1.0);
	render_quad(programQuad);
	render_obj(program, model);

	// if (isJump || isOrbit) {
	// 	if (isJump) {
	// 		beta = beta + 0.01;
	// 		M = translate(0.0, -0.5 + 0.5 * Math.sin(beta), -3.0);
	// 		gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelMatrix"), false, flatten(M));
	// 	}
	// 	if (isOrbit) {
	// 		theta = theta + 0.02;
	// 		lightPos = getLightPos(theta);
	// 		gl.uniform4fv(gl.getUniformLocation(program, "lightPos"), flatten(lightPos));
	// 	}

	// 	window.requestAnimationFrame(function () {
	// 		render(model, program, programQuad);
	// 	});
	// }
}

function render_quad(programQuad) {
	gl.useProgram(programQuad);

	initAttributeVariable(gl, programQuad.vPosition, programQuad.vBuffer);
	initAttributeVariable(gl, programQuad.vTexCoord, programQuad.tBuffer);

	gl.bindBuffer(gl.ARRAY_BUFFER, programQuad.vBuffer);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function render_obj(program, model) {
	gl.useProgram(program);
	initAttributeVariable(gl, program.a_Position, model.vertexBuffer);
	initAttributeVariable(gl, program.a_Normal, model.normalBuffer);
	initAttributeVariable(gl, program.a_Color, model.colorBuffer);
	
	if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
		// OBJ and all MTLs are available
		console.log('onReadComplete');
		g_drawingInfo = onReadComplete(gl, model, g_objDoc);
	}
	if (!g_drawingInfo) {
		console.log('onRead InComplete');
	}

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
	gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
}

function initTexture(gl, program, image_path) {
	var image = document.createElement('img');
	image.crossorigin = 'anonymous';

	image.onload = function () {
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	};

	image.src = image_path;
	gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
}


/*---------------------------------------------------------------------------------
* Utility function for loading attribute values 
*/
function initFramebufferObject(gl, width, height) {
	var framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	var renderbuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
	// stencil buffer also in fbo

	var shadowMap = gl.createTexture();
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, shadowMap);
	// Filling the texture will happen as soon as we render to the framebuffer
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	framebuffer.texture = shadowMap;
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowMap, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

	var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
	if (status !== gl.FRAMEBUFFER_COMPLETE) {
		console.log('Framebuffer object is incomplete: ' + status.toString());
	}

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	framebuffer.width = width;
	framebuffer.height = height;

	return framebuffer;
}

function initAttributeVariable(gl, attribute, buffer) {
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(attribute, buffer.num, buffer.type, false, 0, 0);
	gl.enableVertexAttribArray(attribute);
}

// function for the quad
function createDataArrayBuffer(gl, data, num, type) {
	var buffer = gl.createBuffer(); // Create a buffer object

	// Write data to the buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

	// Store information to assign it to attribute variable later
	buffer.num = num;
	buffer.type = type;

	return buffer;
}

// Create a buffer object, assign it to attribute variables, this is solely used for the obj
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
	var buffer = gl.createBuffer(); // Create a buffer object

	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
	gl.enableVertexAttribArray(a_attribute); // Enable the assignment

	buffer.num = num;
	buffer.type = type;

	return buffer;
}


/* ---------------------------------------------------------------------------------
* Utility function for loading obj. file 
*/
function initObject(gl, program, obj_filename, scale) {
	// Get the storage locations of attribute and uniform variables
	program.a_Position = gl.getAttribLocation(program, "a_Position");
	program.a_Normal = gl.getAttribLocation(program, "a_Normal");
	program.a_Color = gl.getAttribLocation(program, "a_Color");

	// Prepare empty buffer objects for vertex coordinates, colors, and normals
	var model = initVertexBuffers(gl, program);

	// Start reading the OBJ file
	readOBJFile(obj_filename, gl, model, scale, true);

	return model;
}

// Create a buffer object and perform the initial configuration
function initVertexBuffers(gl, program) {
	var o = new Object();
	o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
	o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
	o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
	o.indexBuffer = gl.createBuffer();

	return o;
}

// Read a file
function readOBJFile(fileName, gl, model, scale, reverse) {
	var request = new XMLHttpRequest();

	request.onreadystatechange = function () {
		if (request.readyState === 4 && request.status !== 404) {
			onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
		}
	};
	request.open("GET", fileName, true); // Create a request to get file
	request.send(); // Send the request
}

// OBJ file has been read
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
	var objDoc = new OBJDoc(fileName); // Create a OBJDoc object
	var result = objDoc.parse(fileString, scale, reverse);

	if (!result) {
		g_objDoc = null;
		g_drawingInfo = null;
		console.log("OBJ file parsing error.");
		return;
	}
	g_objDoc = objDoc;
}

// OBJ File has been read completely
function onReadComplete(gl, model, objDoc) {
	// Acquire the vertex coordinates and colors from OBJ file
	var drawingInfo = objDoc.getDrawingInfo();

	// Write date into the buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

	// Write the indices to the buffer object
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

	return drawingInfo;
}



/*---------------------------------------------------------------------------------
* Utility function for model 
*/
function transform(angle, direction, s, t) {
	var R = rotate(angle, direction);
	var Rx = rotateX(angle);
	var Ry = rotateY(angle);
	var Rz = rotateZ(angle);
	var T = translate(t[0], t[1], t[2]);
	var S = scalem(s[0], s[1], s[2]);

	return mult(mult(T, R), S);
}

function getLightPos(theta) {
	return vec4(radius * Math.cos(theta) + center[0], center[1], radius * Math.sin(theta) + center[2], 1.0);
}