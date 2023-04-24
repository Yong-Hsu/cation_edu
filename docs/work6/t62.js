

/** @type {WebGLRenderingContext} */
var gl;

var pointsArray = [
	vec4(-4.0, -1.0, -1.0, 1.0),
	vec4(4.0, -1.0, -1.0, 1.0),
	vec4(4.0, -1.0, -21.0, 1.0),

	vec4(-4.0, -1.0, -21.0, 1.0),
	vec4(-4.0, -1.0, -1.0, 1.0),
	vec4(4.0, -1.0, -21.0, 1.0)
]

init();
function init() {
	var wrappingMenu = document.getElementById('wrappingMode');
	var filterMenu = document.getElementById('filterMode');

	const canvas = document.getElementById('gl-canvas');
	gl = WebGLUtils.setupWebGL(canvas);

	if (!gl) {
		alert("WebGL isn't available");
	}

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

	// setup
	gl.viewport(0.0, 0.0, canvas.width, canvas.height);
	gl.clearColor(30 / 355, 144 / 255, 0.9, 1.0);
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// m0del matrix
	M = transform(0, [1, 1, 1], [1, 1, 1], [0.0, 0.0, 0.0]);
	// view matrix
	var V = mat4();
	// projection matrix
	var P = perspective(90, 1, 0.1, 25);

	// pass matrices 
	var modelViewMatrix = mult(V, M);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(P));

	// vertices buffer
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
	var vPosition = gl.getAttribLocation(program, 'vPosition');
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	// generate texture
	// todo: take a look at numbers
	var texSize = 64;
	var textureImg = createCheckerBoard(texSize, 4, 4);

	// create texture
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	// set texture filtering parameters
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, textureImg);
	gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

	// push texture coordinates and texmap to shader
	var texCoord = [
		vec2(2.5, 0.0), 
		vec2(-1.5, 0.0), 
		vec2(-1.5, 10.0),

		vec2(2.5, 10.0),
		vec2(2.5, 0.0),
		vec2(-1.5, 10.0)
	];

	var tBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW);
	var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
	gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vTexCoord);

	render();
	
	wrappingMenu.addEventListener('click', function () {
		if (wrappingMenu.selectedIndex == 0) {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
			requestAnimationFrame(render);
		} else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			requestAnimationFrame(render);
		}
	});
	// DIFFERENCE
	filterMenu.addEventListener('click', function () {
		if (filterMenu.selectedIndex <= 1) {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST + filterMenu.selectedIndex);
		} else if (filterMenu.selectedIndex <= 3) {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST + filterMenu.selectedIndex - 2);
		} else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST + filterMenu.selectedIndex - 4);
			gl.generateMipmap(gl.TEXTURE_2D);
		}
		requestAnimationFrame(render);
	});
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
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

function createCheckerBoard(texSize, numRows, numCols) {
	// todo: procedurally generated
	var myTexels = new Uint8Array(4*texSize*texSize); 
	// texSize is the resolution
	
	for (var i = 0; i < texSize; ++i) {
		for (var j = 0; j < texSize; ++j) {
			var patchx = Math.floor(i / (texSize / numRows));
			var patchy = Math.floor(j / (texSize / numCols));
			var c = (patchx % 2 !== patchy % 2 ? 255 : 0);
			var idx = 4 * (i * texSize + j);
			myTexels[idx] = myTexels[idx + 1] = myTexels[idx + 2] = c;
			myTexels[idx + 3] = 255;
		}
	}
	
	return myTexels;
}