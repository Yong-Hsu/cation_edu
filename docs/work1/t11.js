

init();

function init() {
	const canvas = document.getElementById('gl-canvas');
	/** @type {WebGLRenderingContext} */
	let gl = WebGLUtils.setupWebGL(canvas); //found in

	// 2
	if (!gl) {
		alert("WebGL isn't available");
	}
	
	var vertices = [
		vec2(1.0, 1.0),
		vec2(0.0, 1.0),
		vec2(1.0, -1.0),
		vec2(-1.0, -1.0)
	]

	gl.viewport(0.0, 0.0, canvas.width, canvas.height);
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	// load shaders and initialize atribute buffers
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program)
	
	// Load the data into the GPU
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW)

	// Associate out shader variables with our data buffer
	var vPosition = gl.getAttribLocation(program, 'vPosition');
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, vertices.length);
}