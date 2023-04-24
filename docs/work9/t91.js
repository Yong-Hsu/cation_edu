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
	vec2(1.0, -1.0),
	vec2(0.0, -1.0),

	vec2(1.0, 0.0),
	vec2(1.0, 1.0),
	vec2(0.0, 0.0)
];
var type;

// lighting information 
var center = vec3(0.0, 3.0, -3.0);
var radius = 1.5;
var lightPos = getLightPos(0.0);

var theta = 0.0; var beta = 0.0;
var isOrbit = true; var isJump = true;

var Mat_s; var shadowModelLoc; var Mat_p;

// material information
var emission_le = vec3(1.0, 1.0, 1.0); // la = ld = ls = le
var ambient_ka = vec3(0.0, 0.0, 0.0);
var diffuse_kd = vec3(1.0, 0.8, 0.0); 
var specular_ks = vec3(1.0, 1.0, 1.0);
var shininess = 20.0;

var M;

init();
function init() {
	// webgl setup
	canvas = document.getElementById("gl-canvas");
	gl = WebGLUtils.setupWebGL(canvas);
	gl.enable(gl.DEPTH_TEST);
	// gl.enable(gl.CULL_FACE);
	// gl.enable(gl.BLEND);

	gl.viewport(0.0, 0.0, canvas.width, canvas.height);
	gl.clearColor(30 / 355, 144 / 255, 0.9, 1.0);

	const ext = gl.getExtension('OES_element_index_uint');
	if (!ext) {
		console.log('Warning: Unable to use an extension');
	}

	// init shaders for different programs
	var programQuad = initShaders(gl, "vertex-shader-quad", "fragment-shader-quad");
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	var P = perspective(90, 1, 0.1, 20);
	var V = mat4(); // debugging if needed
	// var V = lookAt(vec3(0.0, 6.0, -3.0), vec3(0.0, 0.0, -3.0), vec3(0.0, 0.0, 1.0));

	/* --------------------------------------------------------------------------------
	* The shader for the quad
	*/
	gl.useProgram(programQuad);

	// bind attribute values
	programQuad.vBuffer = createDataArrayBuffer(gl, flatten(pointsArray), 4, gl.FLOAT);
	programQuad.tBuffer = createDataArrayBuffer(gl, flatten(texCoord), 2, gl.FLOAT);
	programQuad.vPosition = gl.getAttribLocation(programQuad, "vPosition");
	programQuad.vTexCoord = gl.getAttribLocation(programQuad, "vTexCoord");

	// new uniform matrices
	M = mat4();
	gl.uniformMatrix4fv(gl.getUniformLocation(programQuad, "modelMatrix"), false, flatten(M));
	gl.uniformMatrix4fv(gl.getUniformLocation(programQuad, "viewMatrix"), false, flatten(V));
	gl.uniformMatrix4fv(gl.getUniformLocation(programQuad, "projectionMatrix"), false, flatten(P));

	// create texture
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

	// lighting information
	gl.uniform4fv(gl.getUniformLocation(program, "lightPos"), flatten(lightPos));
	gl.uniform3fv(gl.getUniformLocation(program, "emission_le"), flatten(emission_le));
	gl.uniform3fv(gl.getUniformLocation(program, "diffuse_kd"), flatten(diffuse_kd));
	gl.uniform3fv(gl.getUniformLocation(program, "ambient_ka"), flatten(ambient_ka));
	gl.uniform3fv(gl.getUniformLocation(program, "specular_ks"), flatten(specular_ks));
	gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);

	// object loading
	var model = initObject(gl, program, "../res/teapot.obj", 0.25);
	setTimeout(function () {
		render(model, program, programQuad);
	}, 200);


	/* ---------------------------------------------------------------------------------
	* Project shadows
	*/
	uniformShadowModelMatrix(gl, program, M);

	/* ---------------------------------------------------------------------------------
	* toggle functionality
	*/
	var toggleLightCir = document.getElementById('toggleLightCir');
	var toggleObj = document.getElementById('toggleObj');
	toggleLightCir.addEventListener('click', function () {
		isOrbit = !isOrbit;
		render(model, program, programQuad);
	});
	toggleObj.addEventListener('click', function () {
		isJump = !isJump;
		render(model, program, programQuad);
	});
}


/*
* Render functions
*/
function render(model, program, programQuad) {
	// have to initializae the attribute values before doing the draw
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
	render_quad(programQuad);
	render_obj(program, model);

	if (isJump || isOrbit) {
		if (isJump) {
			beta = beta + 0.01;
			M = translate(0.0, -0.5 + 0.6 * Math.sin(beta), -3.0);
			gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelMatrix"), false, flatten(M));
			uniformShadowModelMatrix(gl, program, M);
		}
		if (isOrbit) {
			theta = theta + 0.02;
			lightPos = getLightPos(theta);
			gl.uniform4fv(gl.getUniformLocation(program, "lightPos"), flatten(lightPos));
			uniformShadowModelMatrix(gl, program, M);
		}
		
		window.requestAnimationFrame(function() {
			render(model, program, programQuad);
		});
	}
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
		// console.log('onReadComplete');
		g_drawingInfo = onReadComplete(gl, model, g_objDoc);
	}
	if (!g_drawingInfo) {
		return;
	}

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
	
	var typeLoc = gl.getUniformLocation(program, "type"); 
	type = 1.0;
	gl.uniform1f(typeLoc, type);
	gl.depthFunc(gl.GREATER);
	gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_INT, 0);

	type = 0.0;
	gl.uniform1f(typeLoc, type);
	gl.depthFunc(gl.LESS);
	gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
}



/*
* Utility function for loading attribute values 
*/
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



/*
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



/*
* Utility function for model 
*/
function transform(angle, direction, s, t) {
	var R  = rotate(angle, direction);
	var Rx = rotateX(angle);
	var Ry = rotateY(angle);
	var Rz = rotateZ(angle);
	var T  = translate(t[0], t[1], t[2]);
	var S  = scalem(s[0], s[1], s[2]);

	return mult(mult(T, R), S);
}

function getLightPos(theta) {
	return vec4(radius * Math.cos(theta) + center[0], center[1], radius * Math.sin(theta) + center[2], 1.0);
}

function uniformShadowModelMatrix (gl, program, M) {
	Mat_p = mat4(
		vec4(1.0, 0.0, 0.0, 0.0),
		vec4(0.0, 1.0, 0.0, 0.0),
		vec4(0.0, 0.0, 1.0, 0.0),
		vec4(0.0, -1.0 / (lightPos[1] - (-1.0 - 0.05)), 0.0, 0.0)
	);

	Mat_s = mult(mult(mult(
		translate(lightPos[0], lightPos[1], lightPos[2]), Mat_p),
		translate(-lightPos[0], -lightPos[1], -lightPos[2])), 
		M);

	gl.uniformMatrix4fv(gl.getUniformLocation(program, "shadowModelMatrix"), false, flatten(Mat_s));
}



// potential solution for subpage webgl conflicts
// Use different uniform variable names for each page: You can assign different names to the uniform variables in each page to avoid conflicts.

// Use separate WebGL programs for each page: Instead of using a single WebGL program for both pages, you can create separate WebGL programs for each page. This will allow each page to have its own set of uniform variables without interference from the other page.

// Use a namespace for the uniform variables: You can use a namespace to prefix the uniform variable names in each page, which will make it easier to distinguish between the variables used by each page.

// Use a shared WebGL context: If you need to share data between the two pages, you can create a shared WebGL context that both pages can use. This will allow you to use the same set of uniform variables in both pages without conflicts.