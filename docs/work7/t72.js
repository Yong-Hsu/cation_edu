/** @type {WebGLRenderingContext} */
var gl;
var program;
var g_tex_ready = 0;

// initial vertices 
var pointsArray = [];
var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);
pointsArray.push(vec4(-1, -1, 0.999, 1),
				vec4(-1, 1, 0.999, 1),
				vec4(1, -1, 0.999, 1),
				vec4(1, 1, 0.999, 1),
				vec4(1, -1, 0.999, 1),
				vec4(-1, 1, 0.999, 1));

// subdivision level of the sphere
var divisionLevel = 1;

init();
function init() {
	const canvas = document.getElementById('gl-canvas');
	gl = WebGLUtils.setupWebGL(canvas);
	gl.enable(gl.DEPTH_TEST);

	// setup
	gl.viewport(0.0, 0.0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// model matrix
	M = mat4();
	// view matrix
	var at = vec3(0, 0, 0);
	var up = vec3(0.0, 1.0, 0.0);
	var eye = vec3(0.0, 0.0, -0.999);
	// V = lookAt(eye, at, up);
	V = mat4();
	// projection matrix
	// var P = perspective(45, 1, 0.1, 4);
	P = mat4();
	// texture matrix
	var Mtex = mat4();

	// The texture coordinate used to access a cubemap is a 3D direction vector which represents a direction from the center of the cube to the value to be accessed.

	// pass matrices 
	var modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	var viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
	gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(M));
	gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(V));
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(P));

	var MtexLoc = gl.getUniformLocation(program, "Mtex");
	gl.uniformMatrix4fv(MtexLoc, false, flatten(Mtex));

	// tentrahendron drawing 
	gl.vBuffer = null;
	gl.nBuffer = null;
	initSphere(divisionLevel = 6);

	// load local images
	var cubemap = ['../res/textures/cm_left.png', // POSITIVE_X
		'../res/textures/cm_right.png', // NEGATIVE_X
		'../res/textures/cm_top.png', // POSITIVE_Y
		'../res/textures/cm_bottom.png', // NEGATIVE_Y
		'../res/textures/cm_back.png', // POSITIVE_Z
		'../res/textures/cm_front.png']; // NEGATIVE_

	// gl.activeTexture(gl.TEXTURES);
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	for (var i = 0; i < 6; ++i) {
		var image = document.createElement('img');
		image.crossorigin = 'anonymous';
		image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;
		image.onload = function (event) {
			var image = event.target;
			// gl.activeTexture(gl.TEXTURE0);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(image.textarget, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
			++g_tex_ready;
		};
		image.src = cubemap[i];
	}
	gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

	setTimeout(() => {
		if (g_tex_ready >= 6)	render();
	}, 600);
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

function initSphere(numSubdivs) {
	tetrahedron(va, vb, vc, vd, numSubdivs);

	gl.deleteBuffer(gl.vBuffer);
	gl.deleteBuffer(gl.nBuffer);

	gl.vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
	var vPosition = gl.getAttribLocation(program, 'vPosition');
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
}

function tetrahedron(v1, v2, v3, v4, numSubdivs) {
	if (numSubdivs == 0) {
		push_triangle(v1, v2, v3);
		push_triangle(v1, v4, v2);
		push_triangle(v1, v3, v4);
		push_triangle(v2, v3, v4);
	} else {
		divideTriangle(v1, v2, v3, numSubdivs);
		divideTriangle(v1, v4, v2, numSubdivs);
		divideTriangle(v1, v3, v4, numSubdivs);
		divideTriangle(v2, v3, v4, numSubdivs);
	}
}

function divideTriangle(v1, v2, v3, numSubdivs) {
	var v12 = normalize(scale(0.5, add(v1, v2)), true);
	var v23 = normalize(scale(0.5, add(v2, v3)), true);
	var v31 = normalize(scale(0.5, add(v3, v1)), true);

	push_triangle(v1, v12, v31);
	push_triangle(v12, v23, v31);
	push_triangle(v12, v2, v23);
	push_triangle(v31, v23, v3);

	if (numSubdivs - 1 != 0) {
		divideTriangle(v1, v12, v31, numSubdivs - 1);
		divideTriangle(v12, v23, v31, numSubdivs - 1);
		divideTriangle(v12, v2, v23, numSubdivs - 1);
		divideTriangle(v31, v23, v3, numSubdivs - 1);
	}
}

function push_triangle(v1, v2, v3) {
	var va = vec4(v1[0]*0.5, v1[1]*0.5, v1[2]*0.5, 1.0);
	var vb = vec4(v2[0]*0.5, v2[1]*0.5, v2[2]*0.5, 1.0);
	var vc = vec4(v3[0]*0.5, v3[1]*0.5, v3[2]*0.5, 1.0);
	pointsArray.push(va, vb, vc);
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