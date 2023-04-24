

/** @type {WebGLRenderingContext} */
var gl;
var vertices;
var theta;
var thetaLoc;

init();

function init() {
	console.log("onload");
	// initialize_the_system
	const canvas = document.getElementById('gl-canvas');
	gl = WebGLUtils.setupWebGL(canvas); //found in
	
	// 1
	// gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	// gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
	// gl.clear(gl.COLOR_BUFFER_BIT);
	// console.trace("Ended");

	// 2
	if (!gl) {
		alert("WebGL isn't available");
	}

	vertices = [
		vec2(0.0, 0.0),
	];

	var rep = 50
	for (let i = 0; i < rep; i++) {
		vertices.push(vec2(0.5 * Math.sin(0 + i*2*Math.PI/rep), 
						   0.5 * Math.cos(0 + i*2*Math.PI/rep)));
	}
	vertices.push(vec2(0, 0.5));

	// a rectangular area of the display window
	gl.viewport(0.0, 0.0, canvas.width, canvas.height);
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	// load shaders and initialize attribute buffers
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
	// Load the data into the GPU, put data into VBO, vertex buffer object
	var buffer = gl.createBuffer();
	//  gl.ARRAY_BUFFER parameter indicates that the data in the buffer will be vertex attribute data rather than indices to the data
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	// flatten: put the data into types that the GPU needs,  put data into the VBO
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

	// Associate out shader variables with our data buffer
	var vPosition = gl.getAttribLocation(program, 'vPosition');
	// must describe the form of the data in the vertex array (gl.vertexAttribPointer), link the shader program with the vertices
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	// We have to enable the vertex attributes that are in the shaders   
	gl.enableVertexAttribArray(vPosition);

	theta = 0.0;
	thetaLoc = gl.getUniformLocation(program, "theta");

	render();
}

function render()
{	
	setTimeout(() => {
		// give color to the frame
		gl.clear(gl.COLOR_BUFFER_BIT);
		// display the vertices after those data has been on the GPU
		theta += 0.1;
		gl.uniform1f(thetaLoc, theta);
		gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length);

		requestAnimationFrame(render);
	}, 20);
}