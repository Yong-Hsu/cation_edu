/** @type {WebGLRenderingContext} */
var gl;
var program;

// import object
var g_objDoc = null; // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model

// lighting information 
var lightPos = vec4(-200.0, -200.0, -200.0, 1.0);
var emission_le = vec3(1.0, 1.0, 1.0); // la = ld = ls = le
// material information
var ambient_ka = vec3(0.0, 0.0, 0.0);
var diffuse_kd = vec3(1.0, 0.8, 0.0); 
var specular_ks = vec3(1.0, 1.0, 1.0);
var shininess = 20.0;

init();
function init() {
	// webgl setup
	canvas = document.getElementById("gl-canvas");
	gl = WebGLUtils.setupWebGL(canvas);
	gl.enable(gl.DEPTH_TEST);

	const ext = gl.getExtension('OES_element_index_uint');
	if (!ext) {
		console.log('Warning: Unable to use an extension');
	}

	gl.viewport(0.0, 0.0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// camera setting
	M  = transform(0, [1, 1, 1], [1, 1, 1], [0.0, 0.0, 0.0]);
	var eye = vec3(0.0, 0.0, -180.0);
	var at  = vec3(0, 0, 0);
	var up  = vec3(0.0, 1.0, 0.0);
	var V   = lookAt(eye, at, up);
	// perspective(fovy, aspect, near, far)
	var P = perspective(45, 1, 50, 800);

	var modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	var viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
	gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(M));
	gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(V));
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(P));

	// lighting information
	var lightPosLoc = gl.getUniformLocation(program, "lightPos");
	var emission_leLoc = gl.getUniformLocation(program, "emission_le");
	var diffuse_kdLoc = gl.getUniformLocation(program, "diffuse_kd");
	var ambient_kaLoc = gl.getUniformLocation(program, "ambient_ka");
	var specular_ksLoc = gl.getUniformLocation(program, "specular_ks");
	var shininessLoc = gl.getUniformLocation(program, "shininess");
	gl.uniform4fv(lightPosLoc, flatten(lightPos));
	gl.uniform3fv(emission_leLoc, flatten(emission_le));
	gl.uniform3fv(diffuse_kdLoc, flatten(diffuse_kd));
	gl.uniform3fv(ambient_kaLoc, flatten(ambient_ka));	
	gl.uniform3fv(specular_ksLoc, flatten(specular_ks));
	gl.uniform1f(shininessLoc, shininess);	

	// object loading
	var model = initObject(gl, "../res/mask.obj", 60);
	setTimeout(() => {
		render(0, model);
	}, 400);
};

function initObject(gl, obj_filename, scale) {
	// Get the storage locations of attribute and uniform variables
	program.a_Position = gl.getAttribLocation(program, "a_Position");
	program.a_Normal = gl.getAttribLocation(program, "a_Normal");
	program.a_Color = gl.getAttribLocation(program, "a_Color");
	
	// Prepare empty buffer objects for vertex coordinates, colors, and normals
	var model = initVertexBuffers(gl);

	// Start reading the OBJ file
	readOBJFile(obj_filename, gl, model, scale, true);
	
	return model;
}

// Create a buffer object and perform the initial configuration
function initVertexBuffers(gl) {
	var o = new Object();
	o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
	o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
	o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
	o.indexBuffer = gl.createBuffer();

	return o;
}

// Create a buffer object, assign it to attribute variables, and enable the
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
	var buffer = gl.createBuffer(); // Create a buffer object
	
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
	gl.enableVertexAttribArray(a_attribute); // Enable the assignment

	return buffer;
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

// DrawElements (which most frameworks do) you can only reference 65k vertices per draw call
function render(view, model) {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
		// OBJ and all MTLs are available
		// console.log('onReadComplete');
		g_drawingInfo = onReadComplete(gl, model, g_objDoc);
	}
	if (!g_drawingInfo) {
		return;
	}
	// g_drawingInfo = onReadComplete(gl, model, g_objDoc);
	gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
}

function transform(angle, direction, s, t) {
	var R  = rotate(angle, direction);
	var Rx = rotateX(angle);
	var Ry = rotateY(angle);
	var Rz = rotateZ(angle);
	var T  = translate(t[0], t[1], t[2]);
	var S  = scalem(s[0], s[1], s[2]);

	return mult(mult(T, R), S);
}