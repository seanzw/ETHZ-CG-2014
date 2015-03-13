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
uniform float noisePower;
uniform float objectSize;

varying vec2 vTC;
varying vec3 vN;
varying vec4 vP;
varying vec3 vUp;
varying vec3 vObjectSpacePosition;

const float octave = 5.0;

vec3 lightBlue      = vec3(0. / 255., 0. / 255., 205. / 255.);
vec3 oceanBlue      = vec3(0. / 255., 0. / 255., 128. / 255.);
// vec3 forestGreen    = vec3(38. / 255., 106. / 255., 46. / 255.);
// vec3 lightGreen     = vec3(78. / 255., 225. / 255., 78. / 255.);
vec3 cloudWhite     = vec3(255. / 255., 255. / 255., 255. / 255.);
// vec3 desertSand     = vec3(237. / 255., 201. / 255., 175. / 255.);
// vec3 gold           = vec3(225. / 255., 215. / 255., 0. / 255.);
// vec3 earthBrown     = vec3(161. / 255., 64. / 255., 43. / 255.);
// vec3 earthYellow    = vec3(225. / 255., 169. / 255., 95. / 255.);

vec3 color_sand = vec3(241.0/255.0, 214.0/255.0, 145.0/255.0);
vec3 color_green = vec3(141.0/229.0, 195.0/255.0, 83.0/255.0);
vec3 color_darkgreen = vec3(103.0/229.0, 188.0/255.0, 13.0/255.0);

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

vec4 fade(vec4 t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float PerlinNoise3D(vec3 P)
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

// Classic Perlin noise 4D
float PerlinNoise4D(vec4 P)
{
    vec4 Pi0 = floor(P); // Integer part for indexing
    vec4 Pi1 = Pi0 + 1.0; // Integer part + 1
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec4 Pf0 = fract(P); // Fractional part for interpolation
    vec4 Pf1 = Pf0 - 1.0; // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = vec4(Pi0.zzzz);
    vec4 iz1 = vec4(Pi1.zzzz);
    vec4 iw0 = vec4(Pi0.wwww);
    vec4 iw1 = vec4(Pi1.wwww);

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 ixy00 = permute(ixy0 + iw0);
    vec4 ixy01 = permute(ixy0 + iw1);
    vec4 ixy10 = permute(ixy1 + iw0);
    vec4 ixy11 = permute(ixy1 + iw1);

    vec4 gx00 = ixy00 * (1.0 / 7.0);
    vec4 gy00 = floor(gx00) * (1.0 / 7.0);
    vec4 gz00 = floor(gy00) * (1.0 / 6.0);
    gx00 = fract(gx00) - 0.5;
    gy00 = fract(gy00) - 0.5;
    gz00 = fract(gz00) - 0.5;
    vec4 gw00 = vec4(0.75) - abs(gx00) - abs(gy00) - abs(gz00);
    vec4 sw00 = step(gw00, vec4(0.0));
    gx00 -= sw00 * (step(0.0, gx00) - 0.5);
    gy00 -= sw00 * (step(0.0, gy00) - 0.5);

    vec4 gx01 = ixy01 * (1.0 / 7.0);
    vec4 gy01 = floor(gx01) * (1.0 / 7.0);
    vec4 gz01 = floor(gy01) * (1.0 / 6.0);
    gx01 = fract(gx01) - 0.5;
    gy01 = fract(gy01) - 0.5;
    gz01 = fract(gz01) - 0.5;
    vec4 gw01 = vec4(0.75) - abs(gx01) - abs(gy01) - abs(gz01);
    vec4 sw01 = step(gw01, vec4(0.0));
    gx01 -= sw01 * (step(0.0, gx01) - 0.5);
    gy01 -= sw01 * (step(0.0, gy01) - 0.5);

    vec4 gx10 = ixy10 * (1.0 / 7.0);
    vec4 gy10 = floor(gx10) * (1.0 / 7.0);
    vec4 gz10 = floor(gy10) * (1.0 / 6.0);
    gx10 = fract(gx10) - 0.5;
    gy10 = fract(gy10) - 0.5;
    gz10 = fract(gz10) - 0.5;
    vec4 gw10 = vec4(0.75) - abs(gx10) - abs(gy10) - abs(gz10);
    vec4 sw10 = step(gw10, vec4(0.0));
    gx10 -= sw10 * (step(0.0, gx10) - 0.5);
    gy10 -= sw10 * (step(0.0, gy10) - 0.5);

    vec4 gx11 = ixy11 * (1.0 / 7.0);
    vec4 gy11 = floor(gx11) * (1.0 / 7.0);
    vec4 gz11 = floor(gy11) * (1.0 / 6.0);
    gx11 = fract(gx11) - 0.5;
    gy11 = fract(gy11) - 0.5;
    gz11 = fract(gz11) - 0.5;
    vec4 gw11 = vec4(0.75) - abs(gx11) - abs(gy11) - abs(gz11);
    vec4 sw11 = step(gw11, vec4(0.0));
    gx11 -= sw11 * (step(0.0, gx11) - 0.5);
    gy11 -= sw11 * (step(0.0, gy11) - 0.5);

    vec4 g0000 = vec4(gx00.x,gy00.x,gz00.x,gw00.x);
    vec4 g1000 = vec4(gx00.y,gy00.y,gz00.y,gw00.y);
    vec4 g0100 = vec4(gx00.z,gy00.z,gz00.z,gw00.z);
    vec4 g1100 = vec4(gx00.w,gy00.w,gz00.w,gw00.w);
    vec4 g0010 = vec4(gx10.x,gy10.x,gz10.x,gw10.x);
    vec4 g1010 = vec4(gx10.y,gy10.y,gz10.y,gw10.y);
    vec4 g0110 = vec4(gx10.z,gy10.z,gz10.z,gw10.z);
    vec4 g1110 = vec4(gx10.w,gy10.w,gz10.w,gw10.w);
    vec4 g0001 = vec4(gx01.x,gy01.x,gz01.x,gw01.x);
    vec4 g1001 = vec4(gx01.y,gy01.y,gz01.y,gw01.y);
    vec4 g0101 = vec4(gx01.z,gy01.z,gz01.z,gw01.z);
    vec4 g1101 = vec4(gx01.w,gy01.w,gz01.w,gw01.w);
    vec4 g0011 = vec4(gx11.x,gy11.x,gz11.x,gw11.x);
    vec4 g1011 = vec4(gx11.y,gy11.y,gz11.y,gw11.y);
    vec4 g0111 = vec4(gx11.z,gy11.z,gz11.z,gw11.z);
    vec4 g1111 = vec4(gx11.w,gy11.w,gz11.w,gw11.w);

    vec4 norm00 = taylorInvSqrt(vec4(dot(g0000, g0000), dot(g0100, g0100), dot(g1000, g1000), dot(g1100, g1100)));
    g0000 *= norm00.x;
    g0100 *= norm00.y;
    g1000 *= norm00.z;
    g1100 *= norm00.w;

    vec4 norm01 = taylorInvSqrt(vec4(dot(g0001, g0001), dot(g0101, g0101), dot(g1001, g1001), dot(g1101, g1101)));
    g0001 *= norm01.x;
    g0101 *= norm01.y;
    g1001 *= norm01.z;
    g1101 *= norm01.w;

    vec4 norm10 = taylorInvSqrt(vec4(dot(g0010, g0010), dot(g0110, g0110), dot(g1010, g1010), dot(g1110, g1110)));
    g0010 *= norm10.x;
    g0110 *= norm10.y;
    g1010 *= norm10.z;
    g1110 *= norm10.w;

    vec4 norm11 = taylorInvSqrt(vec4(dot(g0011, g0011), dot(g0111, g0111), dot(g1011, g1011), dot(g1111, g1111)));
    g0011 *= norm11.x;
    g0111 *= norm11.y;
    g1011 *= norm11.z;
    g1111 *= norm11.w;

    float n0000 = dot(g0000, Pf0);
    float n1000 = dot(g1000, vec4(Pf1.x, Pf0.yzw));
    float n0100 = dot(g0100, vec4(Pf0.x, Pf1.y, Pf0.zw));
    float n1100 = dot(g1100, vec4(Pf1.xy, Pf0.zw));
    float n0010 = dot(g0010, vec4(Pf0.xy, Pf1.z, Pf0.w));
    float n1010 = dot(g1010, vec4(Pf1.x, Pf0.y, Pf1.z, Pf0.w));
    float n0110 = dot(g0110, vec4(Pf0.x, Pf1.yz, Pf0.w));
    float n1110 = dot(g1110, vec4(Pf1.xyz, Pf0.w));
    float n0001 = dot(g0001, vec4(Pf0.xyz, Pf1.w));
    float n1001 = dot(g1001, vec4(Pf1.x, Pf0.yz, Pf1.w));
    float n0101 = dot(g0101, vec4(Pf0.x, Pf1.y, Pf0.z, Pf1.w));
    float n1101 = dot(g1101, vec4(Pf1.xy, Pf0.z, Pf1.w));
    float n0011 = dot(g0011, vec4(Pf0.xy, Pf1.zw));
    float n1011 = dot(g1011, vec4(Pf1.x, Pf0.y, Pf1.zw));
    float n0111 = dot(g0111, vec4(Pf0.x, Pf1.yzw));
    float n1111 = dot(g1111, Pf1);

    vec4 fade_xyzw = fade(Pf0);
    vec4 n_0w = mix(vec4(n0000, n1000, n0100, n1100), vec4(n0001, n1001, n0101, n1101), fade_xyzw.w);
    vec4 n_1w = mix(vec4(n0010, n1010, n0110, n1110), vec4(n0011, n1011, n0111, n1111), fade_xyzw.w);
    vec4 n_zw = mix(n_0w, n_1w, fade_xyzw.z);
    vec2 n_yzw = mix(n_zw.xy, n_zw.zw, fade_xyzw.y);
    float n_xyzw = mix(n_yzw.x, n_yzw.y, fade_xyzw.x);
    return 2.2 * n_xyzw;
}

float getPerlinNoise(vec3 P, vec3 scale, vec3 shift, float amp, float frequency, float persistence) {
    vec3 t = scale * P + shift;
    float n = 0.0;
    for (float i = 0.0; i < octave; ++i) {
        n += amp * PerlinNoise3D(frequency * t);
        frequency *= 2.0;
        amp *= persistence;
    }
    return n;
}

float getPerlinNoise(vec4 P, vec4 scale, vec4 shift, float amp, float frequency, float persistence) {
    vec4 t = scale * P + shift;
    float n = 0.0;
    for (float i = 0.0; i < octave; ++i) {
        n += amp * PerlinNoise4D(frequency * t);
        frequency *= 2.0;
        amp *= persistence;
    }
    return n;
}

// use 4D Perlin Noise to get the cloud
float computeClouds() {
    float amplitude = 2.0;
    float frequency = 1.75;
    float persistence = 0.5;
    vec4 scale = vec4(0.75, 0.75, 0.75, 5.0) * objectSize;
    vec4 shift = vec4(0.0);

    float noise = getPerlinNoise(vec4(vObjectSpacePosition, currentTime), scale, shift, amplitude, frequency, persistence);
    if (noise > 0.0) {
        return clamp(noise, 0.0, 1.0);
    }
    return 0.0;
}

vec3 computeLand() {
    float amplitude = 1.5;
    float frequency = 0.5;
    float persistence = 0.75;
    vec3 scale = vec3(10.0) * objectSize;
    vec3 shift = vec3(0.0);

    float noise = getPerlinNoise(vObjectSpacePosition, scale, shift, amplitude, frequency, persistence);

    //dessert
    if (noise < 0.0) {
        return mix(color_sand, color_green, noise);
    }
    // forrest
    return mix(color_green, color_darkgreen, noise);
}

vec4 getSurfaceColor() {
    float amplitude = 2.0;
    float frequency = 2.0;
    float persistence = 0.55;
    vec3 scale = vec3(0.5) * objectSize;
    vec3 shift = vec3(0.0);

    float noise = getPerlinNoise(vObjectSpacePosition, scale, shift, amplitude, frequency, persistence);

    // water
    if (noise < 0.5) {
        noise = clamp(noise, -0.5, 0.5);
        return vec4(mix(oceanBlue, lightBlue, noise + 0.5), 0.0);
    }

    // beach
    if (noise < 0.8) {
        return vec4(mix(color_sand, color_green, noise), noise);
    }
    // land
    return vec4 (computeLand(), noise);
}

float bumpMapping(vec3 shift) {
    float amplitude = 1.5;
    float frequency = 0.5;
    float persistence = 0.75;
    vec3 scale = vec3(1.0) * objectSize;

    float noise = getPerlinNoise(vObjectSpacePosition, scale, shift, amplitude, frequency, persistence);

    return noise;
}

vec3 computeEarthNormals(vec3 N, float height, float cloudiness) {
    float eps = 0.5;
    float aX = bumpMapping(vec3(eps, 0.0, 0.0));
    float aY = bumpMapping(vec3(0.0, eps, 0.0));
    float aZ = bumpMapping(vec3(0.0, 0.0, eps));
    
    mat3 rotX = mat3(1., 0., 0.,
                     0., cos(aX), -sin(aX),
                     0., sin(aX), cos(aX));
    
    mat3 rotY = mat3(cos(aY), 0., sin(aY),
                     0., 1., 0.,
                     -sin(aY), 0., cos(aY));
    
    mat3 rotZ = mat3(cos(aZ), -sin(aZ), 0.,
                     sin(aZ), cos(aZ), 0.,
                     0., 0., 1.);
    
    N = rotX * rotY * rotZ * N;
    
    return normalize(N - max(1.0 - height, 0.0));
}

vec3 step = vec3(0.2, 0.4, 0.78)*2.0;

void main(void) {
    vec3 vNormal = normalize(vN);
    vec3 x = normalize(cross(vNormal, normalize(vUp)));

    float cloudNoise = clamp(computeClouds(), 0.0, 1.0);
    
    vec4 surfaceColor = getSurfaceColor();
    bool is_ocean = (surfaceColor.w == 0.0);


    if (!is_ocean)
        vNormal = computeEarthNormals(vNormal, surfaceColor.w, cloudNoise);

    vec3 material = mix(surfaceColor.xyz, cloudWhite, cloudNoise);

    vec3 amb_color = globalAmbientLightColor * material;
    vec3 vPosition = vP.xyz / vP.w;
    vec3 eye = normalize(-vPosition);
    vec3 dif_color = vec3(0, 0, 0);
    vec3 spe_color = vec3(0, 0, 0);
    for (int i = 0; i < 1; ++i) {
        vec3 lightP = lightPosition[i] - vPosition;
        float attenuation = intensity / length(lightP);
        vec3 toLight = normalize(lightP);
        float c = dot(toLight, vNormal);
        if (c > 0.) {
            dif_color = dif_color + attenuation * c * material * lightColor[i];
            vec3 R = reflect(-toLight, vNormal);
            spe_color = spe_color + attenuation * (pow(max(dot(R, eye), 0.), materialSpecularPower)) * lightColor[i];
            if (!is_ocean) {
                spe_color = 0.25 * spe_color;
            }
        }
    }
    vec3 color = amb_color + dif_color + spe_color;
    
    gl_FragColor = clamp(vec4(color, 1.), 0., 1.);
}
