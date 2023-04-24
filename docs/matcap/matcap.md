<html lang="en">
<script src="../angel_common/initShaders.js"></script>
<script src="../angel_common/webgl-utils.js"></script>
<script src="../angel_common/MV.js"></script>
<script type="text/javascript" src="../angel_common/OBJParser.js"> </script>
<script src="matcap/matcap.js"></script>
<script src="matcap/quaternion.js"></script>

<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>

<style>
	.img-circle {
		border-radius: 50%;
	}

	.matcap-image {
		float: left;
		width: 42px;
		height: 42px;
		margin: 3px;
	}
</style>

<script id="vertex-shader" type="x-shader/x-vertex">
	precision highp float;
	attribute vec3 a_Position;
	attribute vec3 a_Normal;

	varying vec4 vPos;
	varying vec3 vNorm;

	uniform mat4 modelMatrix;
	uniform mat4 viewMatrix;
	uniform mat4 projectionMatrix;

	void main()
	{
		vPos = vec4(a_Position, 1.0);
		vNorm = normalize(vec3(modelMatrix * vec4(a_Normal, 0.0))); 

		gl_Position = projectionMatrix * viewMatrix * modelMatrix * vPos;
	}
</script>

<script id="fragment-shader" type="x-shader/x-fragment">
	precision highp float;

	varying vec3 vNorm;

	uniform mat4 modelMatrix;
	uniform mat4 viewMatrix;

	uniform sampler2D matcapTexture; 

	void main()
	{
		// Move normal to view space
		highp vec2 muv = vec2(viewMatrix * vec4(normalize(vNorm), 0)) * 0.5 + vec2(0.5, 0.5);
		// read texture inverting Y value
		gl_FragColor = texture2D(matcapTexture, vec2(1.0-muv.x, muv.y));
	}
</script>

> Refresh the page if the object is not loaded.
<body oncontextmenu="return false;">
	<canvas id='gl-canvas' height="512" width="512">
        "WebGL isn't available"
    </canvas>
	<button type="button" class="btn btn-primary btn-sm" id="toggleMove"> Toggle rotating </button>

> The last line's seven materials comes from real-life photography.
>
> And the others come from the [MatCaps GitHub repositry](https://github.com/nidorx/matcaps).

</body>



<div class="panel panel-default", style="width: 512px;">
	<div class="panel-heading">Select material</div>
	<div class="panel-body" id="matcap-list">
</div>

<!-- import json
from os import listdir

# Replace this with the path to the folder
folder_path = "../res/matCap512"

# Get the names of all the files in the folder
file_names = listdir(folder_path)

# Write the file names to a JSON file
with open("index.json", "w") as outfile:
    json.dump(file_names, outfile) -->

</html>

