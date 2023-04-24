/** @type {WebGLRenderingContext} */
var gl;
var canvas;

var maxNumTriangles = 1000;
var maxNumVertices = 3 * maxNumTriangles;
var index = 0;

var points = [];
var triangles = [];
var circles = [];
var triangle_idx = 1;
var draw_circle_step = 0;
var center;

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
	
	if (!gl) {
		alert("WebGL isn't available");
	}
	
	gl.viewport(0.0, 0.0, canvas.width, canvas.height);
	gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

	// get all elements
	var clearColorMenu = document.getElementById("ClearColors");
	var clearButton = document.getElementById("ClearButton");
	var drawColorMenu = document.getElementById("DrawColors");
	var drawModeMenu = document.getElementById("drawMode");
	drawModeMenu.selectedIndex = 0;
	drawColorMenu.selectedIndex = 0;

	// load shaders and initialize atribute buffers
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
	// Load the data into the GPU, create two seperate buffers
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
	canvas.addEventListener("click", function(event) {
		var bbox = event.target.getBoundingClientRect();
		var t = vec2(-1 + 2 * (event.clientX - bbox.left) / canvas.width,
					-1 + 2 * (canvas.height - event.clientY + bbox.top) / canvas.height);

		if (!(drawModeMenu.selectedIndex == 2 && draw_circle_step == 1)) {
			// bind sub buffer for vertices
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * index, flatten(t));

			// bind sub buffer for colors
			gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
			var verticeColor = colors[drawColorMenu.selectedIndex];
			gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec4'] * index, flatten(verticeColor));
		}
		
		if (drawModeMenu.selectedIndex == 1)	draw_circle_step = 0;
		if (drawModeMenu.selectedIndex == 2)	triangle_idx = 1;
		
		if (drawModeMenu.selectedIndex == 0 || (triangle_idx != 3 && draw_circle_step != 1)) {			
			if (drawModeMenu.selectedIndex == 0)	{draw_circle_step = 0; triangle_idx = 1;}
			if (drawModeMenu.selectedIndex == 1)	triangle_idx ++;
			if (drawModeMenu.selectedIndex == 2)	{draw_circle_step = 1; center = t;}
			points.push(index++);

		} else if (drawModeMenu.selectedIndex == 1) {
			points.pop();
			triangles.push(points.pop());
			triangle_idx = 1;
			index ++;
			
		} else if (drawModeMenu.selectedIndex == 2) {
			circles.push(points.pop());
			var r = Math.sqrt(Math.pow(t[0] - center[0], 2) + Math.pow(t[1] - center[1], 2));

			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * index, flatten(getCircleVertices(center, r, 48)));

			gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
			var verticeColor = Array(49).fill(colors[drawColorMenu.selectedIndex]);
			gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec4'] * index, flatten(verticeColor));
							 
			draw_circle_step = 0;
			index += 49;
		}

		render();
	});

	clearButton.addEventListener("click", function() {
		var bgColor = colors[clearColorMenu.selectedIndex];
		gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);

		render();
	});

	render();
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT);
	for (let i = 0; i < points.length; i++) {
		gl.drawArrays(gl.POINTS, points[i], 1);
	}
	for (let i = 0; i < triangles.length; i++) {
		gl.drawArrays(gl.TRIANGLES, triangles[i], 3);
	}
	for (let i = 0; i < circles.length; i++) {
		gl.drawArrays(gl.TRIANGLE_FAN, circles[i], 50);
	}
}

function getCircleVertices(center, r, rep) {
	var vertices = [];
	for (let i = 0; i <= rep; i++) {	// there are total 49 + 1 buffer places to read
		vertices.push(vec2(r * Math.sin(2*Math.PI * i/rep) + center[0], 
						   r * Math.cos(2*Math.PI * i/rep) + center[1]));
	}
	return vertices;
}