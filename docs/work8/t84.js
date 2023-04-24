/** @type {WebGLRenderingContext} */
var gl;

var type;
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

// animated light
var center = vec3(0.0, 2.0, -2.0);
var radius = 2.0;
var theta = 0.0;
var light = vec3(radius * Math.cos(theta), 2.0, radius * Math.sin(theta) - 2.0);
var Mat_s; var shadowModelLoc; var Mat_p;
var isOrbit = true;

init();
function init() {
	const canvas = document.getElementById('gl-canvas');
	gl = WebGLUtils.setupWebGL(canvas, {alpha: false});
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	

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

	// project shadows
	Mat_p = mat4(
		vec4(1.0, 0.0, 0.0, 0.0),
		vec4(0.0, 1.0, 0.0, 0.0),
		vec4(0.0, 0.0, 1.0, 0.0),
		vec4(0.0, -1.0 / (light[1] - (-1.0 - 0.01)), 0.0, 0.0)
		// yg minus epsilon here
	);
	Mat_s = mult(mult(translate(light[0], light[1], light[2]), Mat_p), translate(-light[0], -light[1], -light[2])); // *mat4()
	shadowModelLoc = gl.getUniformLocation(program, "shadowModelMatrix")
	gl.uniformMatrix4fv(shadowModelLoc, false, flatten(Mat_s));

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
	}, 50);

	var toggle = document.getElementById('toggle');
	toggle.addEventListener('click', function() {
		isOrbit = !isOrbit;
		render();
	});
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// draw arrays, order is important
	var typeLoc = gl.getUniformLocation(program, "type"); //visibility
	type = 2.0;
	gl.uniform1f(typeLoc, type);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.depthFunc(gl.GREATER);
	type = 0.0;
	gl.uniform1f(typeLoc, type);
	gl.drawArrays(gl.TRIANGLES, 6, 12);

	gl.depthFunc(gl.LESS);
	type = 1.0;
	gl.uniform1f(typeLoc, type);
	gl.drawArrays(gl.TRIANGLES, 6, 12);

	if(isOrbit) {
		theta = theta + 0.01;
		light = vec3(radius * Math.cos(theta), 2.0, radius * Math.sin(theta) - 2.0);

		Mat_s = mult(mult(translate(light[0], light[1], light[2]), Mat_p), translate(-light[0], -light[1], -light[2])); // *mat4()
		gl.uniformMatrix4fv(shadowModelLoc, false, flatten(Mat_s));
		requestAnimationFrame(render);
	}		
}

function transform(angle, direction, s, t) {
	var R = rotate(angle, direction);
	var Rx = rotateX(angle);
	var Ry = rotateY(angle);
	var Rz = rotateZ(angle);
	var T = translate(t[0], t[1], t[2]);
	var S = scalem(s[0], s[1], s[2]);

	return mult(mult(T, R), S);
}