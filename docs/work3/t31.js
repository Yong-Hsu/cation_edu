/** @type {WebGLRenderingContext} */
var gl;
var vertices;
var indices;
var vertexColors = [
	[0.0, 0.0, 0.0, 1.0], // black
	[1.0, 0.0, 0.0, 1.0], // red
	[1.0, 1.0, 0.0, 1.0], // yellow
	[0.0, 1.0, 0.0, 1.0], // green
	[0.0, 0.0, 1.0, 1.0], // blue
	[1.0, 0.0, 1.0, 1.0], // magenta
	[1.0, 1.0, 1.0, 1.0], // white
	[0.0, 1.0, 1.0, 1.0]  // cyan
];

init();
function init() {
	const canvas = document.getElementById('gl-canvas');
	gl = WebGLUtils.setupWebGL(canvas); 
	
	if (!gl) {
		alert("WebGL isn't available");
	}
	
	// setup
	gl.viewport(0.0, 0.0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	vertices = [
		vec4(-0.5, -0.5, 0.5, 1.0),
		vec4(-0.5, 0.5, 0.5, 1.0),
		vec4(0.5, 0.5, 0.5, 1.0),
		vec4(0.5, -0.5, 0.5, 1.0),
		vec4(-0.5, -0.5, -0.5, 1.0),
		vec4(-0.5, 0.5, -0.5, 1.0),
		vec4(0.5, 0.5, -0.5, 1.0),
		vec4(0.5, -0.5, -0.5, 1.0)
	];

	indices = [
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

	// model matrix: scale and translate to move diagonal to 000 111
	var angle = 0;
	var direction = [1, -1, 4];
	var s_x = 1; var s_y = 1; var s_z = 1;
	var t_x = 0.5; var t_y = 0.5; var t_z = 0.5;

	var R  = rotate(angle, direction);
	var Rx = rotateX(angle);
	var Ry = rotateY(angle);
	var Rz = rotateZ(angle);
	var T  = translate(t_x, t_y, t_z);
	var S  = scalem(s_x, s_y, s_z);

	var M = mult(mult(T, R), S);

	// view matrix
	// orthgraphic view, see around the point
	var eye = vec3(0.5, 0.5, 0.5);
	var at  = vec3(0, 0, 0);
	var up  = vec3(-1.0, -1.0, 1.0);
	var V   = lookAt(eye, at, up);

	// projection matrix
	var ProjectMat = mat4();

	// pass modelViewMatrix,
	// var P = ortho(-2.0, 2.0, -2.0, 2.0, -2.0, 2.0)
	var modelViewMatrix = mult(ProjectMat, mult(V, M));
	var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	
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

function render() {	
	gl.clear(gl.COLOR_BUFFER_BIT);
	// gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
	gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_BYTE, 0);
}