/** @type {WebGLRenderingContext} */
var gl;

var pointsArray = [];
var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);

var divisionLevel = 4;

init();
function init() {
	const canvas = document.getElementById('gl-canvas');
	gl = WebGLUtils.setupWebGL(canvas);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
	// gl.frontFace(gl.CW);

	// setup
	gl.viewport(0.0, 0.0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	const coarsenButton = document.getElementById('increase');
	const divideButton = document.getElementById("decrease");
	
	// m0del matrix
	M  = transform(0, [1, 1, 1], [1, 1, 1], [0.0, 0.0, 0.0]);
	// view matrix
	// var eye = vec3(-3.0, 0.0, -3.0);
	var eye = vec3(0.0, 0.0, 3.0);
	var at  = vec3(0, 0, 0);
	var up  = vec3(0.0, 1.0, 0.0);
	var V   = lookAt(eye, at, up);
	// projection matrix  
	var P = perspective(45, 1, 0.1, 4);
	
	// pass matrices 
	var modelViewMatrix = mult(V, M); 
	var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(P));
	
	// tentrahendron drawing 
	gl.vBuffer = null;
	initSphere(divisionLevel);

	// vertices buffer
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
	var vPosition = gl.getAttribLocation(program, 'vPosition');
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	coarsenButton.addEventListener("click", function() {
		if (divisionLevel >= 1) {
			divisionLevel -= 1;
			pointsArray = [];

			initSphere(divisionLevel);
			requestAnimationFrame(render);
		}
	});

	divideButton.addEventListener("click", function() {
		if (divisionLevel <= 6) {
			divisionLevel += 1;
			pointsArray = [];

			initSphere(divisionLevel);
			requestAnimationFrame(render);
		}
	});
	
	render();
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

function initSphere(numSubdivs) {
	tetrahedron(va, vb, vc, vd, numSubdivs);

	gl.deleteBuffer(gl.vBuffer);
	gl.vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(program, 'vPosition');
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
}

function tetrahedron(v1, v2, v3, v4, numSubdivs) {
	if (numSubdivs == 0) {
		pointsArray.push(v1, v2, v3);
		pointsArray.push(v1, v4, v2);
		pointsArray.push(v1, v3, v4);
		pointsArray.push(v2, v3, v4);
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

	if (numSubdivs - 1 != 0) {
		divideTriangle(v1, v12, v31, numSubdivs - 1);
		divideTriangle(v12, v23, v31, numSubdivs - 1);
		divideTriangle(v12, v2, v23, numSubdivs - 1);
		divideTriangle(v31, v23, v3, numSubdivs - 1);
	} else {
		pointsArray.push(v1, v12, v31);
		pointsArray.push(v12, v23, v31);
		pointsArray.push(v12, v2, v23);
		pointsArray.push(v31, v23, v3);
	}
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