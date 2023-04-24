

/** @type {WebGLRenderingContext} */
var gl;
var canvas;

var maxNumTriangles = 500;
var maxNumVertices = 3 * maxNumTriangles;
var index = 0;

var mode = 0;
var triangle_idx = 1;
var points = [];
var triangles = [];

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
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	// get all elements
	var clearColorMenu = document.getElementById("ClearColors");
	var clearButton = document.getElementById("ClearButton");
	var drawColorMenu = document.getElementById("DrawColors");
	var drawModeMenu = document.getElementById("drawMode");

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
	canvas.addEventListener("click", function(event){
		if(drawModeMenu.selectedIndex == -1)	drawModeMenu.selectedIndex = 0;

		// bind sub buffer for vertices
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		var bbox = event.target.getBoundingClientRect();
		var t = vec2(-1 + 2 * (event.clientX - bbox.left) / canvas.width,
						-1 + 2 * (canvas.height - event.clientY + bbox.top) / canvas.height);
		console.log(t);
		gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * index, flatten(t));

		// bind sub buffer for colors
		gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
		if (drawColorMenu.selectedIndex == -1)	drawColorMenu.selectedIndex = 0;
		var verticeColor = colors[drawColorMenu.selectedIndex];
		gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec4'] * index, flatten(verticeColor));

		if(drawModeMenu.selectedIndex == 0 || triangle_idx != 3) {
			points.push(index++);
			if(drawModeMenu.selectedIndex == 1)
				triangle_idx ++;
		
		} else {
			points.pop();
			triangles.push(points.pop());
			triangle_idx = 1;
			index ++;
		}
		// console.log('-');
		// console.log(points);
		// console.log(triangles);

		render();
	});

	clearButton.addEventListener("click", function(){
		var bgColor = colors[clearColorMenu.selectedIndex];
		gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);

		render();
	});

	render();
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT);

	var idx_point = 0;
	var idx_tri = 0;

	var idx_buffer = 0;
	var count = 0;
	var drawType;

	// just loop two vertice array separately
	for (let i = 0; i < index; i++) {
		if(points[idx_point] == i && points != []) {
			if (drawType == 1) {
				gl.drawArrays(gl.TRIANGLES, idx_buffer, count);
				idx_buffer += count;
				count = 0;
			}  
			if (i == index - 1) {
				count ++;
				gl.drawArrays(gl.POINTS, idx_buffer, count);
			}

			drawType = 0;
			count ++;
			idx_point ++;

		} else if (triangles[idx_tri] == i - 2 && triangles != []) {
			if (drawType == 0) {
				gl.drawArrays(gl.POINTS, idx_buffer, count);
				idx_buffer += count;
				count = 0;
			} 
			if (i == index - 1) {
				count += 3;
				gl.drawArrays(gl.TRIANGLES, idx_buffer, count);
				i += 2;
			}

			drawType = 1;
			count += 3;
			idx_tri ++;
		}
	}
}