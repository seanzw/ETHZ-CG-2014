precision mediump float;

float PI = 3.14159265358979323846264;

uniform vec3 materialAmbientColor;
uniform vec3 materialDiffuseColor;
uniform vec3 materialSpecularColor;

uniform float alphaX;
uniform float alphaY;
uniform float intensity;

uniform vec3 lightPosition[3];
uniform vec3 lightColor[3];
uniform vec3 globalAmbientLightColor;

varying vec2 vTC;
varying vec3 vN;
varying vec4 vP;

void main(void) {
    vec3 vNormal = normalize(vN);
    vec3 ambColor = globalAmbientLightColor * materialAmbientColor;
    vec3 vPosition = vP.xyz / vP.w;
    vec3 eye = normalize(-vPosition);
    vec3 x = normalize(cross(vNormal, eye));
    vec3 y = cross(vNormal, x);
    vec3 difColor = vec3(0, 0, 0);
    vec3 speColor = vec3(0, 0, 0);
    for (int i = 0; i < 3; ++i) {
        vec3 toLight = lightPosition[i] - vPosition;
        float attenuation = intensity / length(toLight);
        toLight = normalize(toLight);
        float nl = dot(toLight, vNormal);
        float nr = dot(eye, vNormal);
        if (nl > 0. && nr > 0.) {
            difColor = difColor + attenuation * nl * materialDiffuseColor * lightColor[i];
            vec3 h = normalize(toLight + eye);
            float e = exp(- (pow(dot(h, x) / alphaX, 2.) + pow(dot(h, y) / alphaY, 2.)) / (pow(dot(h, vNormal), 2.)));
            float kSpe = e / (4. * PI * alphaX * alphaY * sqrt(nl * nr));
            speColor = speColor + attenuation * kSpe * nl * materialSpecularColor * lightColor[i];
        }
    }
    vec3 color = ambColor + difColor + speColor;
    gl_FragColor = clamp(vec4(color, 1.), 0., 1.);
}
