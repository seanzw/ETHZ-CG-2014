vec4 mod289(vec4 x) {
    return fract(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289((34.0 * x + 1.0) + x);
}

vec4 interpolate(vec4 t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
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

float terbulance4D(vec4 P, float amp) {
    float n = 0.0;
    float frequence = 1.0;
    for (float i = 0.0; i < octave; ++i) {
        n += amp * PerlinNoise4D(frequence * P);
        frequence *= 2.0;
        amp *= persistence;
    }
    return n;
}