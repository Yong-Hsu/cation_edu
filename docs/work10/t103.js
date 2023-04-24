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
var shininess = 30.0;

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
	gl.clearColor(0.117, 0.564, 0.9, 1.0);

	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// quaternion track ball
	var q_rot = new Quaternion();
	var q_inc = new Quaternion();
	// camera setting
	M = transform(0, [1, 1, 1], [1, 1, 1], [0.0, 0.0, 0.0]);
	var eye = vec3(0.0, 0.0, -180.0);
	var at = vec3(0, 0, 0);
	var up = vec3(0.0, 1.0, 0.0);
	var V = lookAt(q_rot.apply(eye), at, q_rot.apply(up));
	var P = perspective(45, 1, 50, 800);
	// dollying and panning
	var pan_and_eye = [0.0, 0.0, -length(subtract(eye, at))];
	initEventHandlers(canvas, q_rot, q_inc, pan_and_eye);

	// uniform matrices
	var modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	var viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
	gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(M));
	gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(V));
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(P));

	// lighting information
	gl.uniform4fv(gl.getUniformLocation(program, "lightPos"), flatten(lightPos));
	gl.uniform3fv(gl.getUniformLocation(program, "emission_le"), flatten(emission_le));
	gl.uniform3fv(gl.getUniformLocation(program, "diffuse_kd"), flatten(diffuse_kd));
	gl.uniform3fv(gl.getUniformLocation(program, "ambient_ka"), flatten(ambient_ka));
	gl.uniform3fv(gl.getUniformLocation(program, "specular_ks"), flatten(specular_ks));
	gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);

	// object loading
	// var model = initObject(gl, "../res/engraving.obj", 60);
	var model = initObject(gl, "../res/mask.obj", 60);

	// render
	var render = function () {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		var c = subtract(
			at, 
			add(scale(pan_and_eye[0], q_rot.apply(vec3(1.0, 0.0, 0.0))), 
				scale(pan_and_eye[1], q_rot.apply(up)))
		);

		// console.log(c);
		var V2 = lookAt(
			add(q_rot.apply(vec3(0, 0, pan_and_eye[2])), c), 
			c, 
			q_rot.apply(up)
		);
		gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(V2));

		gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
		requestAnimationFrame(render);
	}

	setTimeout(() => {
		g_drawingInfo = checkModel(model);
		render();
	}, 150);
};

// function for handling mouse movements
function initEventHandlers(canvas, q_rot, q_inc, pan_and_eye) {
	var dragging = false; // Dragging or not
	var lastX = -1, lastY = -1; // Last position of the mouse
	var u, v;
	var action = 0;

	canvas.onmousedown = function (ev) { // Mouse is pressed
		var rect = ev.target.getBoundingClientRect();
		var x = (ev.clientX - rect.left) / canvas.width; x = 1 - 2*x;
		var y = (ev.clientY - rect.top) / canvas.height; y = 1 - 2*y;

		var d2 = x*x + y*y;
		u = vec3(x, y, d2 <= 1/2 ? Math.sqrt(1 - d2) : 1 / 2 / Math.sqrt(d2));

		// Start dragging if a mouse is in <canvas>
		if (-1 <= x && x < 1 && -1 <= y && y < 1) {
			lastX = x; lastY = y;
			dragging = true;
			action = ev.button + 1;
		}
	};

	// Mouse is released
	canvas.onmouseup = function (ev) {
		dragging = false; 
	};

	canvas.onmousemove = function (ev) { // Mouse is moved
		var rect = ev.target.getBoundingClientRect();
		var x = (ev.clientX - rect.left) / canvas.width; x = 1 - 2*x;
		var y = (ev.clientY - rect.top) / canvas.height; y = 1 - 2*y;

		var d2 = x*x + y*y;
		v = vec3(x, y, d2 <= 1/2 ? Math.sqrt(1 - d2) : 1 / 2 / Math.sqrt(d2));

		if (dragging) {
			switch (action) {
				case 1: { // orbit
					q_inc = q_inc.make_rot_vec2vec(normalize(u), normalize(v));
					q_rot = q_rot.multiply(q_inc);
					// seperate the calculation here and outside
				}
				break;
				case 2: { // dolly
					pan_and_eye[2] = pan_and_eye[2] + 100 * (y - lastY);
				}
				break;
				case 3: {  // pan
					pan_and_eye[0] += (x - lastX) * 100;
					pan_and_eye[1] += (y - lastY) * 100;
				}
				break;
			}
		}

		lastX = x, lastY = y;
		u = v;
	};
}

/*
* Object load functions
*/
function checkModel(model) {
	if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
		// OBJ and all MTLs are available
		console.log('onReadComplete');
		g_drawingInfo = onReadComplete(gl, model, g_objDoc);
		return g_drawingInfo;
	}
	if (!g_drawingInfo) {
		return;
	}
}

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

function transform(angle, direction, s, t) {
	var R = rotate(angle, direction);
	var Rx = rotateX(angle);
	var Ry = rotateY(angle);
	var Rz = rotateZ(angle);
	var T = translate(t[0], t[1], t[2]);
	var S = scalem(s[0], s[1], s[2]);

	return mult(mult(T, R), S);
}