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
uniform float currentTime;
uniform float frequence;
uniform float noisePower;

varying vec2 vTC;
varying vec3 vN;
varying vec4 vP;
varying vec3 vUp;
varying vec3 vObjectSpacePosition;

const float octave = 10.0;

vec3 lightBlue      = vec3(0. / 255., 197. / 255., 225. / 255.);
vec3 oceanBlue      = vec3(28. / 255., 107. / 255., 160. / 255.);
vec3 forestGreen    = vec3(38. / 255., 106. / 255., 46. / 255.);
vec3 lightGreen     = vec3(78. / 255., 225. / 255., 78. / 255.);
vec3 cloudWhite     = vec3(243. / 255., 242. / 255., 231. / 255.);
vec3 desertSand     = vec3(237. / 255., 201. / 255., 175. / 255.);
vec3 gold           = vec3(225. / 255., 215. / 255., 0. / 255.);

// function used to generate 3D Perlin noise
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float PerlinNoise(vec3 P)
{
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));  
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
}

float getPerlinNoise(vec3 P, float amp) {
    float n = 0.0;
    float frequence = 1.0;
    for (float i = 0.0; i < octave; ++i) {
        n += amp * PerlinNoise(frequence * P);
        frequence *= 2.0;
        amp *= persistence;
    }
    return n;
}

float getSimplePerlinNoise(vec3 P, float amp) {
    float n = 0.0;
    float frequence = 1.0;
    for (float i = 0.0; i < 5.0; ++i) {
        n += amp * PerlinNoise(frequence * P);
        frequence *= 2.0;
        amp *= persistence;
    }
    return n;
}

vec4 getEarthColor(vec3 P, vec3 shift) {
    float scale = 1.0;
    vec3 temp = scale * P + shift;
    float noise = (getPerlinNoise(temp, 1.));
    if (noise < 0.1) {
        return vec4(mix(oceanBlue, lightBlue, noise + 0.9), 1.0);
    } else if (noise < 0.2) {
        return vec4(mix(desertSand, gold, noise * 3.), 0.0);
    } else {
        return vec4(mix(forestGreen, lightGreen, noise), 0.0);
    }
}

float bumpMapping(vec3 P) {
    float scale = 1.0;
    vec3 shift = vec3(100.0);
    vec3 temp = scale * P + shift;
    float noise = getSimplePerlinNoise(temp, 1.0);
    return noise;
}

vec3 computeNormal(vec3 P, vec3 normal, vec3 tangent) {
    float eps = 0.01;
    vec3 bitangent = cross(normal, tangent);
    float b0 = bumpMapping(P);
    float b1 = bumpMapping(P + eps * tangent);
    float b2 = bumpMapping(P + eps * bitangent);
    return normalize(normal + (b1 - b0) * bitangent + (b2 - b0) * tangent);
}

vec3 getColor(vec3 P, float currentTime, vec3 shift) {
    // first get the earth color
    vec3 earthColor = getEarthColor(P, vec3(100.)).xyz;
    float scale = 2.;
    vec3 v = vec3(0.3, 0.4, 0.05) * currentTime;
    vec3 temp = scale * P + shift + v;
    float noise = getPerlinNoise(temp, 0.5);
    noise = clamp(noise, 0.0, 1.0);
    return mix(earthColor, cloudWhite, noise);
}

void main(void) {
    vec3 material = getColor(vObjectSpacePosition, currentTime, vec3(100.));
    vec3 vNormal = normalize(vN);
    vec3 x = normalize(cross(vNormal, normalize(vUp)));
    vNormal = computeNormal(vObjectSpacePosition, vNormal, x);
    vec3 amb_color = globalAmbientLightColor * material;
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
            dif_color = dif_color + attenuation * c * material * lightColor[i];
            vec3 R = reflect(-toLight, vNormal);
            spe_color = spe_color + attenuation * (pow(max(dot(R, eye), 0.), materialSpecularPower)) * materialSpecularColor * lightColor[i];
        }
    }
    vec3 color = amb_color + dif_color + spe_color;
    
    gl_FragColor = clamp(vec4(color, 1.), 0., 1.);
}
