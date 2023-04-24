

/** @type {WebGLRenderingContext} */
var gl;
var canvas;

var maxNumTriangles = 500;
var maxNumVertices = 3 * maxNumTriangles;
var index = 0;

var colors = [
	vec4(0.0, 0.0, 0.0, 1.0), // black
	vec4(1.0, 0.0, 0.0, 1.0), // red
	vec4(1.0, 1.0, 0.0, 1.0), // yellow
	vec4(0.0, 1.0, 0.0, 1.0), // green
	vec4(0.0, 0.0, 1.0, 1.0), // blue
	vec4(1.0, 0.0, 1.0, 1.0), // magenta
	vec4(0.0, 1.0, 1.0, 1.0)  // cyan
];

init();
function init() {
	canvas = document.getElementById('gl-canvas');
	gl = WebGLUtils.setupWebGL(canvas); 

	var clearColorMenu = document.getElementById("ClearColors");
	var clearButton = document.getElementById("ClearButton");
	var drawColorMenu = document.getElementById("DrawColors");

	if (!gl) {
		alert("WebGL isn't available");
	}
	
	gl.viewport(0.0, 0.0, canvas.width, canvas.height);
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	// load shaders and initialize atribute buffers
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
	// Load the data into the GPU
	// have to put buffer and attribute association in the same place for different buffers
	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, maxNumVertices * sizeof['vec2'], gl.STATIC_DRAW);
	var vPosition = gl.getAttribLocation(program, 'vPosition');
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	var cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, maxNumVertices * sizeof['vec4'], gl.STATIC_DRAW);
	var fragColor = gl.getAttribLocation(program, 'fragColor');
	gl.vertexAttribPointer(fragColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(fragColor);
	
	// mouse listener
	canvas.addEventListener("click", function(event){
		var bbox = event.target.getBoundingClientRect();

		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		var t = vec2(-1 + 2 * (event.clientX - bbox.left) / canvas.width,
					 -1 + 2 * (canvas.height - event.clientY + bbox.top) / canvas.height);
		// updates a subset of a buffer object's data store
		gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * index, flatten(t));

		if (drawColorMenu.selectedIndex == -1)	drawColorMenu.selectedIndex = 0;
		var verColor = colors[drawColorMenu.selectedIndex];

		gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
		gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec4'] * index, flatten(verColor));

		index ++;
	});

	clearButton.addEventListener("click", function(event){
		var bgColor = colors[clearColorMenu.selectedIndex];
		gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
	});

	render();
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, index);
	window.requestAnimationFrame(render, canvas);
}