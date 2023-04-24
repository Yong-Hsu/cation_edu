/** @type {WebGLRenderingContext} */
var gl;
var vertices = [
	vec4(-0.5, -0.5, 0.5, 1.0),
	vec4(-0.5, 0.5, 0.5, 1.0),
	vec4(0.5, 0.5, 0.5, 1.0),
	vec4(0.5, -0.5, 0.5, 1.0),
	vec4(-0.5, -0.5, -0.5, 1.0),
	vec4(-0.5, 0.5, -0.5, 1.0),
	vec4(0.5, 0.5, -0.5, 1.0),
	vec4(0.5, -0.5, -0.5, 1.0)
];
var indices = [
	0, 1,
	0, 4,
	0, 3,
	1, 5,
	1, 2,
	2, 6,
	2, 3,
	3, 7,
	4, 7,
	4, 5,
	5, 6,
	6, 7
];
var vertexColors = Array(8).fill([1.0, 0.0, .0, 1.0])
				.concat(Array(8).fill([0.0, 1.0, 0.0, 1.0]), 
						Array(8).fill([0.0, 0.0, 1.0, 1.0]));
indices = indices.concat(indices.map(element => element + 8), 
						indices.map(element => element + 16));

init();
function init() {
	const canvas = document.getElementById('gl-canvas');
	gl = WebGLUtils.setupWebGL(canvas); //found in
	
	if (!gl) {
		alert("WebGL isn't available");
	}
	
	// setup
	gl.viewport(0.0, 0.0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// m0del matrix: scale and translate to move diagonal to 000 111
	M  = transform(0, [1, 1, 1], [1, 1, 1], [0.5, 0.5, 0.5]);
	M1 = transform(45, [0, 0, 1], [1, 1, 1], [0.5, 0.5, 0.5]);
	M2 = transform(45, [0.5, -1, 1.1], [1, 1, 1], [0.5, 0.5, 0.5]);

	for (let i = 0; i < 8; i++) {
		vertices.push(mult(M1, vertices[i]));
	}
	for (let i = 0; i < 8; i++) {
		vertices.push(mult(M2, vertices[i]));
	}
	for (let i = 0; i < 8; i++) {
		vertices[i] = mult(M, vertices[i]);
	}

	// view matrix
	var eye = vec3(3, 0.5, 0.5);
	var at  = vec3(0.5, 0.5, 0.5);
	var up  = vec3(0.0, 0.0, 1.0);
	var V   = lookAt(eye, at, up);

	// projection matrix
	var P = perspective(45, 1, 0.5, 4);

	// pass uniform matrices 
	var modelViewMatrix = V; 
	var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(P));
	
	// vertices buffer
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
	var vPosition = gl.getAttribLocation(program, 'vPosition');
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	// color buffer 
	var cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW);
	var fragColor = gl.getAttribLocation(program, 'fragColor');
	gl.vertexAttribPointer(fragColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(fragColor);

	// draw indices buffer
	var indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

	render();
}

function render()
{	
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_BYTE, 0);
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