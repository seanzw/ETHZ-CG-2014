precision mediump float;

uniform vec3 materialAmbientColor;
uniform vec3 materialDiffuseColor;
uniform vec3 materialSpecularColor;

uniform float intensity;

uniform vec3 lightPosition[3];
uniform vec3 lightColor[3];
uniform vec3 globalAmbientLightColor;

varying vec2 vTC;
varying vec3 vN;
varying vec4 vP;

void main(void) {
	vec3 vNormal = normalize(vN);
	vec3 amb_color = globalAmbientLightColor * materialAmbientColor;
	vec3 vPosition = vP.xyz / vP.w;
	vec3 dif_color = vec3(0, 0, 0);
	for (int i = 0; i < 3; ++i) {
		vec3 lightP = lightPosition[i] - vPosition;
		float attenuation = intensity / length(lightP);
		vec3 toLight = normalize(lightP);
		dif_color = dif_color + max(dot(toLight, vNormal), 0.) * attenuation * materialDiffuseColor * lightColor[i];
	}
	vec3 color = amb_color + dif_color;
	gl_FragColor = clamp(vec4(color, 1.), 0., 1.);
}
