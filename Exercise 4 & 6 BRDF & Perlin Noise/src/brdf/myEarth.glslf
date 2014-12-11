precision mediump float;

uniform vec3 materialAmbientColor;
uniform vec3 materialDiffuseColor;
uniform vec3 materialSpecularColor;

uniform float materialSpecularPower;
uniform float intensity;

uniform vec3 lightPosition[3];
uniform vec3 lightColor[3];
uniform vec3 globalAmbientLightColor;

uniform float persistenceEarth;
uniform float currentTime;
uniform float frequence;
uniform float noisePower;

varying vec2 vTC;
varying vec3 vN;
varying vec4 vP;
varying vec3 vUp;
varying vec3 vObjectSpacePosition;

const float octave = 5.0;
const float PI = 3.14159;

vec3 lightBlue      = vec3(0. / 255., 0. / 255., 205. / 255.);
vec3 oceanBlue      = vec3(0. / 255., 0. / 255., 128. / 255.);
vec3 forestGreen    = vec3(38. / 255., 106. / 255., 46. / 255.);
vec3 lightGreen     = vec3(78. / 255., 225. / 255., 78. / 255.);
vec3 cloudWhite     = vec3(243. / 255., 242. / 255., 231. / 255.);
vec3 desertSand     = vec3(237. / 255., 201. / 255., 175. / 255.);
vec3 gold           = vec3(225. / 255., 215. / 255., 0. / 255.);
vec3 earthBrown     = vec3(161. / 255., 64. / 255., 43. / 255.);
vec3 earthYellow    = vec3(225. / 255., 169. / 255., 95. / 255.);

vec4 mod289(vec4 x) {
    return fract(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289((34.0 * x + 1.0) + x);
}

vec3 interpolate(vec3 t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
}

vec4 interpolate(vec4 t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// @index: each component is an index after permutation
// @g: the gradient vector coresponding to the index
// just sample over the unit sphere, therefore no need to normalize
// sample over 2 * PI to avoid discontinuity
void getGradientSphere3D(vec4 index, out vec3 g00, out vec3 g01, out vec3 g10, out vec3 g11) {
    vec4 temp = fract(index * (1.0 / 17.0));
    vec4 theta =  2.0 * PI * temp;
    vec4 phi = 2.0 * PI * fract(temp * 17.0);
    vec4 zTemp = cos(theta);
    vec4 sTemp = sin(theta);
    vec4 xTemp = sTemp * cos(phi);
    vec4 yTemp = sTemp * sin(phi);
    g00 = vec3(xTemp.x, yTemp.x, zTemp.x);
    g01 = vec3(xTemp.y, yTemp.y, zTemp.y);
    g10 = vec3(xTemp.z, yTemp.z, zTemp.z);
    g11 = vec3(xTemp.w, yTemp.w, zTemp.w);
}

float PerlinNoise3D(vec3 P) {
    // integer part of P
    vec3 Pi0 = floor(P);
    vec3 Pi1 = Pi0 + vec3(1.0);
    // fraction part of P
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);

    vec4 permuteX0  = vec4(Pi0.xxxx);
    vec4 permuteX1  = vec4(Pi1.xxxx);
    vec4 permuteY   = vec4(Pi0.yy, Pi1.yy);
    vec4 permuteZ   = vec4(Pi0.z, Pi1.z, Pi0.z, Pi1.z);

    // permuate the integer vertice to get the index
    vec4 permuteT   = permute(permuteY + permute(permuteZ));
    vec4 index0 = permute(permuteX0 + permuteT);
    vec4 index1 = permute(permuteX1 + permuteT);

    vec3 g000, g001, g010, g011, g100, g101, g110, g111;
    getGradientSphere3D(index0, g000, g001, g010, g011);
    getGradientSphere3D(index0, g100, g101, g110, g111);

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

    return n_xyz;
}

float terbulance3D(vec3 P, float amp, float persistence) {
    float n = 0.0;
    float frequence = 1.0;
    for (float i = 0.0; i < octave; ++i) {
        n += amp * PerlinNoise3D(frequence * P);
        frequence *= 2.0;
        amp *= persistence;
    }
    return n;
}

// @index: each component is an index after permutation
// @g: the gradient vector coresponding to the index
// just sample over the unit sphere, therefore no need to normalize
// use sphere coordinate in 4 dimention, sample grid is 7 * 7 * 6
void getGradientSphere4D(vec4 index, out vec4 g00, out vec4 g01, out vec4 g10, out vec4 g11) {
    // get all the angle
    vec4 temp = fract(index * (1.0 / 7.0));
    vec4 theta =  2.0 * PI * temp;
    temp = fract(temp * 7.0);
    vec4 phi0 = 2.0 * PI * temp;
    temp = fract(temp * 6.0);
    vec4 phi1 = 2.0 * PI * temp;

    // get all the Euclidean coordinate
    vec4 wTemp = cos(theta);
    vec4 sTemp = sin(theta);
    vec4 xTemp = sTemp * cos(phi0);
    sTemp = sTemp * sin(phi0);
    vec4 yTemp = sTemp * cos(phi1);
    vec4 zTemp = sTemp * sin(phi1);

    // construct all the gradient
    g00 = vec4(xTemp.x, yTemp.x, zTemp.x, wTemp.x);
    g01 = vec4(xTemp.y, yTemp.y, zTemp.y, wTemp.y);
    g10 = vec4(xTemp.z, yTemp.z, zTemp.z, wTemp.z);
    g11 = vec4(xTemp.w, yTemp.w, zTemp.w, wTemp.w);
}

float PerlinNoise4D(vec4 P) {
    // integer part of P
    vec4 Pi0 = floor(P);
    vec4 Pi1 = Pi0 + vec4(1.0);

    // fraction part of P
    vec4 Pf0 = fract(P);
    vec4 Pf1 = Pf0 - vec4(1.0);

    vec4 permuteX0  = vec4(Pi0.xxxx);
    vec4 permuteX1  = vec4(Pi1.xxxx);
    vec4 permuteY0  = vec4(Pi0.yyyy);
    vec4 permuteY1  = vec4(Pi1.yyyy);
    vec4 permuteZ   = vec4(Pi0.zz, Pi1.zz);
    vec4 permuteW   = vec4(Pi0.w, Pi1.w, Pi0.w, Pi1.w);

    // permute the integer vertice to get the index
    vec4 permuteT   = permute(permuteZ + permute(permuteW));
    vec4 permuteT0  = permute(permuteY0 + permuteT);
    vec4 permuteT1  = permute(permuteY1 + permuteT);
    vec4 index00    = permute(permuteX0 + permuteT0);
    vec4 index01    = permute(permuteX0 + permuteT1);
    vec4 index10    = permute(permuteX1 + permuteT0);
    vec4 index11    = permute(permuteX1 + permuteT1);

    // get all the gradient
    vec4 g0000, g0001, g0010, g0011;
    getGradientSphere4D(index00, g0000, g0001, g0010, g0011);

    vec4 g0100, g0101, g0110, g0111;
    getGradientSphere4D(index01, g0100, g0101, g0110, g0111);

    vec4 g1000, g1001, g1010, g1011;
    getGradientSphere4D(index10, g1000, g1001, g1010, g1011);

    vec4 g1100, g1101, g1110, g1111;
    getGradientSphere4D(index11, g1100, g1101, g1110, g1111);

    // projection
    float n0000 = dot(g0000, Pf0);
    float n1111 = dot(g1111, Pf1);
    float n0001 = dot(g0001, vec4(Pf0.xyz, Pf1.w));
    float n0011 = dot(g0010, vec4(Pf0.xy, Pf1.zw));
    float n0111 = dot(g0111, vec4(Pf0.x, Pf1.yzw));
    float n1110 = dot(g1110, vec4(Pf1.xyz, Pf0.w));
    float n1100 = dot(g1100, vec4(Pf1.xy, Pf0.zw));
    float n1000 = dot(g1000, vec4(Pf1.x, Pf0.yzw));
    float n0010 = dot(g0010, vec4(Pf0.xy, Pf1.z, Pf0.w));
    float n0110 = dot(g0110, vec4(Pf0.x, Pf1.yz, Pf0.w));
    float n0100 = dot(g0100, vec4(Pf0.x, Pf1.y, Pf0.zw));
    float n1101 = dot(g1101, vec4(Pf1.xy, Pf0.z, Pf0.w));
    float n1001 = dot(g1001, vec4(Pf1.x, Pf0.yz, Pf1.w));
    float n1011 = dot(g1011, vec4(Pf1.x, Pf0.y, Pf1.zw));
    float n0101 = dot(g0101, vec4(Pf0.x, Pf1.y, Pf0.z, Pf1.w));
    float n1010 = dot(g1010, vec4(Pf1.x, Pf0.y, Pf1.z, Pf0.w));

    // mix everything
    vec4 fade_xyzw = interpolate(Pf0);
    vec4 n_w0 = mix(vec4(n0000, n0100, n0010, n0110), vec4(n0001, n0101, n0011, n0111), fade_xyzw.w);
    vec4 n_w1 = mix(vec4(n1000, n1100, n1010, n1110), vec4(n1001, n1101, n1011, n1111), fade_xyzw.w);
    vec4 n_zw = mix(vec4(n_w0.xy, n_w1.xy), vec4(n_w0.zw, n_w1.zw), fade_xyzw.z);
    vec2 n_yzw = mix(n_zw.xz, n_zw.yw, fade_xyzw.y);
    float n_xyzw = mix(n_yzw.x, n_yzw.y, fade_xyzw.x);

    return n_xyzw;
}

float terbulance4D(vec4 P, float amp, float persistence) {
    float n = 0.0;
    float frequence = 1.0;
    for (float i = 0.0; i < octave; ++i) {
        n += amp * PerlinNoise4D(frequence * P);
        frequence *= 2.0;
        amp *= persistence;
    }
    return n;
}

vec4 getEarthColor(vec3 P, vec3 shift) {
    float scale = 1.0;
    vec3 temp = scale * P + shift;
    float noise = (terbulance3D(temp, 1.0, persistenceEarth));
    if (noise < 0.1) {
        return vec4(mix(oceanBlue, lightBlue, noise + 0.9), 1.0);
    } else if (noise < 0.2) {
        return vec4(mix(earthYellow, desertSand, noise * 3.), 0.0);
    } else {
        return vec4(mix(desertSand, earthBrown, noise), 0.0);
    }
}

float bumpMapping(vec3 P) {
    float scale = 2.0;
    vec3 shift = vec3(100.0);
    vec3 temp = scale * P + shift;
    float noise = cos(terbulance3D(temp, 1.0, persistenceEarth));
    return noise;
}

void computeNormal(vec3 P, inout vec3 normal, vec3 tangent) {
    float eps = 0.5;
    vec3 bitangent = cross(normal, tangent);
    float b0 = bumpMapping(P);
    float b1 = bumpMapping(P + eps * tangent);
    float b2 = bumpMapping(P + eps * bitangent);
    normal = normalize(normal + (b1 - b0) * bitangent + (b2 - b0) * tangent);
}

vec3 calculate(vec3 P, float currentTime, vec3 shift, inout vec3 normal, vec3 tangent) {
    // first get the earth color
    vec4 earthColor = getEarthColor(P, vec3(100.));
    if (earthColor.w == 0.0) {
        computeNormal(P, normal, tangent);
    }
    float scale = 2.;
    vec3 v = vec3(0.3, 0.4, 0.05) * currentTime;
    vec3 temp = scale * P + shift + v;
    float noise = terbulance3D(temp, 0.5, 0.5);
    noise = clamp(noise, 0.0, 1.0);
    return mix(earthColor.xyz, cloudWhite, noise);
}

void main(void) {
    vec3 vNormal = normalize(vN);
    vec3 x = normalize(cross(vNormal, normalize(vUp)));
    vec3 material = calculate(vObjectSpacePosition, currentTime, vec3(100.), vNormal, x);
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
            spe_color = spe_color + attenuation * (pow(max(dot(R, eye), 0.), materialSpecularPower)) * lightColor[i];

        }
    }
    vec3 color = amb_color + dif_color + spe_color;
    
    gl_FragColor = clamp(vec4(color, 1.), 0., 1.);
}
