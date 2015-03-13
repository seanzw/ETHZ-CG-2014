vec4 mod289(vec4 x) {
    return fract(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289((34.0 * x + 1.0) + x);
}

vec3 interpolate(vec3 t) {
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

float terbulance3D(vec3 P, float amp) {
    float n = 0.0;
    float frequence = 1.0;
    for (float i = 0.0; i < octave; ++i) {
        n += amp * PerlinNoise3D(frequence * P);
        frequence *= 2.0;
        amp *= persistence;
    }
    return n;
}