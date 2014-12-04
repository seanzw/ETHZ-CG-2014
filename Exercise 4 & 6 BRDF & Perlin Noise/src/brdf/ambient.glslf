precision mediump float;

uniform vec3 materialAmbientColor;
uniform vec3 materialDiffuseColor;
uniform vec3 materialSpecularColor;

uniform vec3 lightPosition[3];
uniform vec3 lightColor[3];
uniform vec3 globalAmbientLightColor;

// this is an example uniform that is connected to the slide bar.
uniform float dummyUniform1;
uniform float dummyUniform2;

varying vec2 vTC;
varying vec3 vN;
varying vec4 vP;

void main(void) {
	vec3 color = globalAmbientLightColor * materialAmbientColor;
	gl_FragColor = clamp(vec4(color, 1.), 0., 1.);
}
