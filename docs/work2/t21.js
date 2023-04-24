

/** @type {WebGLRenderingContext} */
var gl;
var canvas;

var maxNumTriangles = 500;
var maxNumVertices = 3 * maxNumTriangles;
var index = 0;

init();
function init() {
	canvas = document.getElementById('gl-canvas');
	gl = WebGLUtils.setupWebGL(canvas); 

	if (!gl) {
		alert("WebGL isn't available");
	}
	
	gl.viewport(0.0, 0.0, canvas.width, canvas.height);
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
	
	// load shaders and initialize atribute buffers
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
	// Load the data into the GPU
	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, maxNumVertices * sizeof['vec2'], gl.STATIC_DRAW)
	
	// Associate out shader variables with our data buffer
	var vPosition = gl.getAttribLocation(program, 'vPosition');
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	
	// mouse listener
	canvas.addEventListener("click", function(event){
		var bbox = event.target.getBoundingClientRect();

		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		var t = vec2(-1 + 2 * (event.clientX - bbox.left) / canvas.width,
					 -1 + 2 * (canvas.height - event.clientY + bbox.top) / canvas.height);
		// updates a subset of a buffer object's data store
		gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * index, flatten(t));
		index ++;
	});

	render();
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, index);
	window.requestAnimationFrame(render, canvas);
}