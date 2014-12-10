precision mediump float;

uniform vec3 materialAmbientColor;
uniform vec3 materialDiffuseColor;
uniform vec3 materialSpecularColor;

uniform float materialSpecularPower;
uniform float intensity;

uniform vec3 lightPosition[3];
uniform vec3 lightColor[3];
uniform vec3 globalAmbientLightColor;

uniform float persistence;
uniform float noiseFrequency;
uniform float period;
uniform float noisePower;

varying vec3 vN;
varying vec4 vP;
varying vec3 vUp;
varying vec3 vObjectSpacePosition;

const float octave = 10.0;

vec3 diffuseLo  = vec3(0.35, 0.177, 0.07);
vec3 diffuseHi  = vec3(0.80, 0.30, 0.10);
vec3 specularLo = vec3(0.3);
vec3 specularHi = vec3(1.0);

vec4 mod256(vec4 x) {
    return fract(x * (1.0 / 256.0)) * 256.0;
}

vec4 permute(vec4 x) {
    return mod256((34.0 * x + 1.0) + x);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 interpolate(vec3 t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float getStep(float x) {
    float t0 = step(x, 1.0 / 3.0);
    float t1 = fract(x * 3.0);
    float t2 = 2.0 * step(t1, 0.5) - 1.0;
    float t3 = fract(t1 * 2.0);
    float t4 = 2.0 * step(t3, 0.5) - 1.0;
    float t5 = 1.0 - step(x, 2.0 / 3.0);
    float t6 = t5 + t4 - t5 * t4;
    return t0 * t2 * t6;
}


// @index: each component represent one index after permuation
// @fraction: the difference between P and vertice Q, i.e. P - Q
// @return: the gradient vector
// use getStep to generate the gradient
vec3 getGradient(float index) {
    float x = fract(index * (1.0 / 12.0));
    float y = fract(x + 1.0 / 3.0);
    float z = fract(y + 1.0 / 3.0);
    return vec3(getStep(x), getStep(y), getStep(z));
}

float PerlinNoise3D(vec3 P) {
    // integer part of P
    vec3 Pi0 = floor(P);
    vec3 Pi1 = Pi0 + vec3(1.0);
    // fraction part of P
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);

    // vector used in permuation
    // index = x + permute(y + permute(z));
    // 000
    // 001
    // 010
    // 011
    // 100
    // 101
    // 110
    // 111
    vec4 permuteX0  = vec4(Pi0.xxxx);
    vec4 permuteX1  = vec4(Pi1.xxxx);
    vec4 permuteY   = vec4(Pi0.yy, Pi1.yy);
    vec4 permuteZ   = vec4(Pi0.z, Pi1.z, Pi0.z, Pi1.z);

    // permuate the integer vertice to get the index
    vec4 permuteT   = permute(permuteY + permute(permuteZ));
    vec4 index0 = permute(permuteX0 + permuteT);
    vec4 index1 = permute(permuteX1 + permuteT);

    // get the gradient
    // since all the gradients have length sqrt(2), we can normalize it in the end
    vec3 g000 = getGradient(index0.x);
    vec3 g001 = getGradient(index0.y);
    vec3 g010 = getGradient(index0.z);
    vec3 g011 = getGradient(index0.w);
    vec3 g100 = getGradient(index1.x);
    vec3 g101 = getGradient(index1.y);
    vec3 g110 = getGradient(index1.z);
    vec3 g111 = getGradient(index1.w);

    // // normalize the gradient
    // vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    // g000 *= norm0.x;
    // g010 *= norm0.y;
    // g100 *= norm0.z;
    // g110 *= norm0.w;
    // vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    // g001 *= norm1.x;
    // g011 *= norm1.y;
    // g101 *= norm1.z;
    // g111 *= norm1.w;

    // projection
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));  
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    // vectorize the mix procedure
    vec3 fade_xyz = interpolate(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);

    return n_xyz * (1.0 / 1.414);
}

float getPerlinNoise3D(vec3 P, float amp) {
    float n = 0.0;
    float frequence = 1.0;
    for (float i = 0.0; i < octave; ++i) {
        n += amp * PerlinNoise3D(frequence * P);
        frequence *= 2.0;
        amp *= persistence;
    }
    return n;
}

void getBand(vec3 P, out vec3 diffuse, out vec3 specular) {

    float noise = getPerlinNoise3D(noiseFrequency * P, 0.5);

    noise = abs(cos(period * length(P * vec3(0.0, 0.5, 1.0)) + noisePower * noise));
    diffuse = mix(diffuseLo, diffuseHi, noise);
    specular = mix(specularLo, specularHi, noise);
}

void main(void) {
    vec3 diffuse, specular;
    getBand(vObjectSpacePosition, diffuse, specular);
    vec3 vNormal = normalize(vN);
    vec3 x = normalize(cross(vNormal, normalize(vUp)));
    vec3 y = cross(vNormal, x);
    vec3 amb_color = globalAmbientLightColor * diffuseLo;
    vec3 vPosition = vP.xyz / vP.w;
    vec3 eye = normalize(-vPosition);
    vec3 dif_color = vec3(0, 0, 0);
    vec3 spe_color = vec3(0, 0, 0);
    for (int i = 0; i < 3; ++i) {
        vec3 lightP = lightPosition[i] - vPosition;
        float attenuation = intensity / length(lightP);
        vec3 toLight = normalize(lightP);
        float c = dot(toLight, vNormal);
        if (c > 0.) {
            dif_color = dif_color + attenuation * c * lightColor[i] * diffuse;
            vec3 R = reflect(-toLight, vNormal);
            spe_color = spe_color + attenuation * (pow(max(dot(R, eye), 0.), materialSpecularPower)) * specular * lightColor[i];
        }
    }
    vec3 color = amb_color + dif_color + spe_color;
    
    gl_FragColor = clamp(vec4(color, 1.), 0., 1.);
}
