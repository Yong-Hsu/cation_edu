<section>
<script src="t15.js"></script>

<script id="vertex-shader" type="x-shader/x-vertex">
	attribute vec4 vPosition;
	uniform float theta;

	void main()
	{
		gl_Position.x = vPosition.x;
		gl_Position.y = 0.5*sin(theta) + vPosition.y;
		gl_Position.z = 0.0;
		gl_Position.w = 1.0;
	}
</script>

<script id="fragment-shader" type="x-shader/x-fragment">
	precision mediump float;
	varying vec4 fColor;

	void main()
	{
		gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
	}
</script>

<canvas id='gl-canvas' height="512" width="512"/><canvas>
</section>

## markdown javascript same page test
link to javascript code