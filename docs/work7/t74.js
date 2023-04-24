/** @type {WebGLRenderingContext} */
var gl;
var program;
var g_tex_ready = 0;

// initial vertices 
var pointsArray = [];
var normalsArray = [];
var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);
normalsArray.push(vec4(0, 0, -1, 1), vec4(0, 0, -1, 1), vec4(0, 0, -1, 1),
					vec4(0, 0, -1, 1), vec4(0, 0, -1, 1), vec4(0, 0, -1, 1));
pointsArray.push(vec4(-1, -1, 0.999, 1),
				vec4(-1, 1, 0.999, 1),
				vec4(1, -1, 0.999, 1),
				vec4(1, 1, 0.999, 1),
				vec4(1, -1, 0.999, 1),
				vec4(-1, 1, 0.999, 1));

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

	// mvp matrix
	M = mat4();
	V = mat4();
	P = mat4();
	var eye = vec3(0.0, 0.0, -1.0);
	// texture matrix
	var Mtex = mat4();

	// pass matrices 
	var modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	var viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
	gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(M));
	gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(V));
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(P));

	var MtexLoc = gl.getUniformLocation(program, "Mtex");
	gl.uniformMatrix4fv(MtexLoc, false, flatten(Mtex));

	var eyeLoc = gl.getUniformLocation(program, 'eye');
	gl.uniform3fv(eyeLoc, flatten(eye));

	// tentrahendron drawing 
	gl.vBuffer = null;
	gl.nBuffer = null;
	initSphere(divisionLevel = 7);

	// load sphere texture map
	var image0 = document.createElement('img');
	image0.crossorigin = 'anonymous';
	image0.src = '../res/textures/normalmap.png';
	image0.onload = function () {
		var texture0 = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0)
		gl.bindTexture(gl.TEXTURE_2D, texture0);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image0);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	};

	gl.uniform1i(gl.getUniformLocation(program, "texMapSphere"), 0);

	// load cubemap
	var cubemap = ['../res/cubemaps/terrain_cubemap/terrain_posx.png', // POSITIVE_X
		'../res/cubemaps/terrain_cubemap/terrain_negx.png', // NEGATIVE_X
		'../res/cubemaps/terrain_cubemap/terrain_posy.png', // POSITIVE_Y
		'../res/cubemaps/terrain_cubemap/terrain_negy.png', // NEGATIVE_Y
		'../res/cubemaps/terrain_cubemap/terrain_posz.png', // POSITIVE_Z
		'../res/cubemaps/terrain_cubemap/terrain_negz.png' // NEGATIVE_
	]; 

	var texture1 = gl.createTexture();
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture1);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	for (var i = 0; i < 6; ++i) {
		var image1 = document.createElement('img');
		image1.crossorigin = 'anonymous';
		image1.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;
		image1.onload = function (event) {
			var img = event.target;
			gl.activeTexture(gl.TEXTURE1);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
			gl.texImage2D(img.textarget, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
			++g_tex_ready;
		};
		image1.src = cubemap[i];
	}
	gl.uniform1i(gl.getUniformLocation(program, "texMapCube"), 1);

	setTimeout(() => {
		if (g_tex_ready >= 6)	render();
	}, 300);
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	var reflectiveLoc = gl.getUniformLocation(program, "reflective");
	var reflective = 0.0;
	gl.uniform1f(reflectiveLoc, reflective);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	reflective = 2.0;
	gl.uniform1f(reflectiveLoc, reflective);
	gl.drawArrays(gl.TRIANGLES, 6, pointsArray.length - 6);
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

	gl.nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.nBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
	var vNormal = gl.getAttribLocation(program, 'vNormal');
	gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vNormal);
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
	normalsArray.push(va, vb, vc);
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