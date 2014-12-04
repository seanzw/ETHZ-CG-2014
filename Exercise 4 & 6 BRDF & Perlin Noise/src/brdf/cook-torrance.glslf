precision mediump float;

uniform vec3 materialAmbientColor;
uniform vec3 materialDiffuseColor;
uniform vec3 materialSpecularColor;

uniform float intensity;
uniform float ior;
uniform float m1;
uniform float w1;
uniform float m2;
uniform float kd;

float PI = 3.14159265358979323846264;

uniform vec3 lightPosition[3];
uniform vec3 lightColor[3];
uniform vec3 globalAmbientLightColor;

varying vec2 vTC;
varying vec3 vN;
varying vec4 vP;

void main() {
    vec3 vNormal = normalize(vN);
    vec3 vPosition = vP.xyz / vP.w;
    vec3 eye = normalize(-vPosition);
    vec3 ambColor = materialAmbientColor * globalAmbientLightColor;
    vec3 difColor = vec3(0, 0, 0);
    vec3 speColor = vec3(0, 0, 0);
    float f0 = pow((ior - 1.0) / (ior + 1.0), 2.0);
    for (int i = 0; i < 3; ++i) {
        vec3 toLight = lightPosition[i] - vPosition;
        float attenuation = intensity / length(toLight);
        toLight = normalize(toLight);
        float nl = dot(toLight, vNormal);
        float nr = dot(eye, vNormal);
        if (nl > 0. && nr > 0.) {
            difColor = difColor + attenuation * nl * materialDiffuseColor * lightColor[i];
            vec3 h = normalize(toLight + eye);
            float nh = max(0., dot(vNormal, h));
            float hr = max(0., dot(h, eye));

            // Beckmann distribution
            float tanAlpha2 = (1.0 - nh * nh) / (nh * nh);
            float D1 = exp(-(tanAlpha2 / (m1 * m1))) / (PI * pow(m1, 2.0) * pow(nh, 4.0));
            float D2 = exp(-(tanAlpha2 / (m2 * m2))) / (PI * pow(m2, 2.0) * pow(nh, 4.0));
            float D = w1 * D1 + (1.0 - w1) * D2;

            float G = min(1.0, min((2.0 * nh * nr) / nr, (2.0 * nh * nl) / nr));

            // schlick approximation to calculate fresnel
            float F = f0 + (1.0 - f0) * pow(1.0 - nl, 5.0);

            float Rs = (F * G * D) / (nr * nl);
            speColor = speColor + attenuation * Rs * nl * materialSpecularColor * lightColor[i];
        }
    }

    vec3 color = ambColor + kd * difColor + (1.0 - kd) * speColor;
    gl_FragColor = clamp(vec4(color, 1.), 0., 1.);
}