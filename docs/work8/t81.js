/** @type {WebGLRenderingContext} */
var gl;

var pointsArray = [
	vec4(-2.0, -1.0, -1.0, 1.0),
	vec4(-2.0, -1.0, -5.0, 1.0),
	vec4(2.0, -1.0, -5.0, 1.0),

	vec4(2.0, -1.0, -1.0, 1.0),
	vec4(-2.0, -1.0, -1.0, 1.0),
	vec4(2.0, -1.0, -5.0, 1.0),

	vec4(0.25, -0.5, -1.25, 1.0),
	vec4(0.25, -0.5, -1.75, 1.0),
	vec4(0.75, -0.5, -1.25, 1.0),

	vec4(0.75, -0.5, -1.75, 1.0),
	vec4(0.75, -0.5, -1.25, 1.0),
	vec4(0.25, -0.5, -1.75, 1.0),

	vec4(-1.0, -1.0, -2.5, 1.0),
	vec4(-1.0, -1.0, -3.0, 1.0),
	vec4(-1.0, 0.0, -2.5, 1.0),

	vec4(-1.0, 0.0, -3.0, 1.0),
	vec4(-1.0, 0.0, -2.5, 1.0),
	vec4(-1.0, -1.0, -3.0, 1.0)
]

init();
function init() {
	const canvas = document.getElementById('gl-canvas');
	gl = WebGLUtils.setupWebGL(canvas);

	if (!gl) {
		alert("WebGL isn't available");
	}

	// setup
	gl.viewport(0.0, 0.0, canvas.width, canvas.height);
	gl.clearColor(30 / 355, 144 / 255, 0.9, 1.0);
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// mvp matrix
	var P = perspective(90, 1, 0.1, 25);
	var modelViewMatrix = mat4();
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(P));

	// vertices buffer
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
	var vPosition = gl.getAttribLocation(program, 'vPosition');
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	// create texture
	var image = document.createElement('img');
	image.crossorigin = 'anonymous';
	image.onload = function () {
		gl.activeTexture(gl.TEXTURE0)
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	};
	image.src = '../res/xamp23.png';
	gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

	var texCoord = [
		vec2(0.0, 0.0),
		vec2(0.0, -1.0),
		vec2(1.0, -1.0),

		vec2(1.0, 0.0),
		vec2(0.0, 0.0),
		vec2(1.0, 1.0),

		vec2(0.25, -1.25),
		vec2(0.25, -1.75),
		vec2(0.75, -1.25),
	
		vec2(0.75, -1.75),
		vec2(0.75, -1.25),
		vec2(0.25, -1.75),
	
		vec2(-1.0, -2.5),
		vec2(-1.0, -3.0),
		vec2(0.0, -2.5),
	
		vec2(0.0, -3.0),
		vec2(0.0, -2.5),
		vec2(-1.0, -3.0)
	];

	var tBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW);
	var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
	gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vTexCoord);

	// single color texture
	gl.activeTexture(gl.TEXTURE1);
	var texture1 = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture1);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0]));
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.uniform1i(gl.getUniformLocation(program, "texMap1"), 1);

	setTimeout(() => {
		render();
	}, 80);
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT);

	var typeLoc = gl.getUniformLocation(program, "type");
	var type = 0.0;
	gl.uniform1f(typeLoc, type);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	var type = 1.0;
	gl.uniform1f(typeLoc, type);
	gl.drawArrays(gl.TRIANGLES, 6, 12);
}