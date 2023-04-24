/** @type {WebGLRenderingContext} */
var gl;
var program;

// initial vertices 
var pointsArray = [];
var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);
// lighting information
var normalsArray = [];

// subdivision level of the sphere
var divisionLevel = 4;

// light information 
var lightPos = vec4(1.0, 1.0, 1.0, 1.0);
var emission_le = vec3(1.0, 1.0, 1.0); // la = ld = ls = le
// material information
var ambient_ka = vec3(0.0, 0.0, 0.0);
var diffuse_kd = vec3(1.0, 0.8, 0.0); // diffuse reflection coefficient
var specular_ks = vec3(1.0, 1.0, 1.0);
var shininess = 20.0;

// animation effect
var isOrbit = false;
var radius = 3;
var alpha = 0;
var eye = vec3(radius * Math.sin(alpha), 0.0, radius * Math.cos(alpha));
var up, at, V, viewMatrixLoc;

var id = null;

init();
function init() {
	const coarsenButton = document.getElementById('increase');
	const divideButton = document.getElementById('decrease');
	const toggleOrbit = document.getElementById('orbit');

	const radianceSlider = document.getElementById('radianceSlider');
	const ambientSlider = document.getElementById('ambientSlider');
	const diffuseSlider = document.getElementById('diffuseSlider');
	const specularSlider = document.getElementById('specularSlider');
	const shininessSlider = document.getElementById('shininessSlider');

	const canvas = document.getElementById('gl-canvas');
	gl = WebGLUtils.setupWebGL(canvas);
	gl.enable(gl.DEPTH_TEST);
	// gl.enable(gl.CULL_FACE);

	// setup
	gl.viewport(0.0, 0.0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// m0del matrix
	// M  = transform(0, [1, 1, 1], [1, 1, 1], [0.0, 0.0, 0.0]);
	M = mat4();
	// view matrix
	at = vec3(0, 0, 0);
	up = vec3(0.0, 1.0, 0.0);
	V = lookAt(eye, at, up);
	// projection matrix
	var P = perspective(45, 1, 0.1, 4);

	// pass matrices 
	var modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
	gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(M));
	gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(V));
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(P));

	// pass lighting parameters
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

	// tentrahendron drawing 
	gl.vBuffer = null;
	gl.nBuffer = null;
	initSphere(divisionLevel);

	// change subdivision level
	// bug: speed up when subdivide and orbit
	coarsenButton.addEventListener("click", function () {
		subdivideLevel(0);
		cancelAnimationFrame(id);
		id = null;
		render();
	});
	divideButton.addEventListener("click", function () {
		subdivideLevel(1);
		cancelAnimationFrame(id);
		id = null;
		render();
	});

	toggleOrbit.addEventListener("click", function () {
		isOrbit = !isOrbit;
		render();
	});

	radianceSlider.addEventListener('input', function () {
		emission_le = scale(radianceSlider.value / 20.0, vec3(1.0, 1.0, 1.0));
		gl.uniform3fv(emission_leLoc, flatten(emission_le));
		cancelAnimationFrame(id);
		id = null;
		render();
	});
	ambientSlider.addEventListener('input', function () {
		ambient_ka = scale(ambientSlider.value / 20.0, vec3(1.0, 0.0, 1.0));
		gl.uniform3fv(ambient_kaLoc, flatten(ambient_ka));
		cancelAnimationFrame(id);
		id = null;
		render();
	});
	diffuseSlider.addEventListener('input', function () {
		diffuse_kd = scale(diffuseSlider.value / 20.0, vec3(1.0, 0.8, 0.0));
		gl.uniform3fv(diffuse_kdLoc, flatten(diffuse_kd));
		cancelAnimationFrame(id);
		id = null;
		render();
	});
	specularSlider.addEventListener('input', function () {
		specular_ks = scale(specularSlider.value / 20.0, vec3(1.0, 1.0, 1.0));
		gl.uniform3fv(specular_ksLoc, flatten(specular_ks));
		cancelAnimationFrame(id);
		id = null;
		render();
	});
	shininessSlider.addEventListener('input', function () {
		shininess = 1000 * shininessSlider.value / 20.0;
		gl.uniform1f(shininessLoc, shininess);
		cancelAnimationFrame(id);
		id = null;
		render();
	});
	
	render();
}

function render() {
	if (isOrbit) {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		alpha += 0.1;
		V = lookAt(eye, at, up);
		eye = vec3(radius * Math.sin(alpha), 0.0, radius * Math.cos(alpha));

		gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(V));
		gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
		id = requestAnimationFrame(render);
	} else {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
	}
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
	pointsArray.push(v1, v2, v3);
	normalsArray.push(v1, v2, v3);
}

function subdivideLevel(type) {
	if (type == 1 && divisionLevel <= 6) divisionLevel += 1;
	else if (type == 0 && divisionLevel >= 1) divisionLevel -= 1;

	pointsArray = [];
	normalsArray = [];
	initSphere(divisionLevel);
}

// transform matrix
function transform(angle, direction, s, t) {
	var R = rotate(angle, direction);
	var Rx = rotateX(angle);
	var Ry = rotateY(angle);
	var Rz = rotateZ(angle);
	var T = translate(t[0], t[1], t[2]);
	var S = scalem(s[0], s[1], s[2]);

	return mult(mult(T, R), S);
}