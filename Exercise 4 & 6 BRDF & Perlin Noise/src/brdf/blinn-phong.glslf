precision mediump float;

uniform vec3 materialAmbientColor;
uniform vec3 materialDiffuseColor;
uniform vec3 materialSpecularColor;

uniform float materialSpecularPower;
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
	vec3 eye = normalize(-vPosition);
	vec3 dif_color = vec3(0, 0, 0);
	vec3 spe_color = vec3(0, 0, 0);
	for (int i = 0; i < 3; ++i) {
		vec3 toLight = lightPosition[i] - vPosition;
		float attenuation = intensity / length(toLight);
		toLight = normalize(toLight);
		float c = dot(toLight, vNormal);
		if (c > 0.) {
			dif_color = dif_color + attenuation * c * materialDiffuseColor * lightColor[i];
			vec3 h = normalize(eye + toLight);
			spe_color = spe_color + attenuation * (pow(max(dot(h, vNormal), 0.), materialSpecularPower)) * materialSpecularColor * lightColor[i];
		}
	}
	vec3 color = amb_color + dif_color + spe_color;
	// vec3 color = dif_color;
	gl_FragColor = clamp(vec4(color, 1.), 0., 1.);
}
