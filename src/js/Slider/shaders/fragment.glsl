varying vec2 vUv;

uniform float u_aspect;
uniform float u_time;
uniform sampler2D u_textures[COUNT];
uniform float u_progress;
uniform float u_parallax;
uniform float u_scale;
uniform float u_noiseScale;

float fbm(vec3 x, int NUM_OCTAVES) {
	float v = 0.0;
	float a = 0.5;
	vec3 shift = vec3(100);
	for (int i = 0; i < NUM_OCTAVES; ++i) {
		v += a * cnoise(x);
		x = x * 2.0 + shift;
		a *= 0.5;
	}
	return v;
}

float getNoise() {
  float size = 0.3;

  float xLine = -size + (1.0 + size * 2.0) * (1.0 - u_progress);

  vec3 noiseCoords = vec3(vUv.x * u_noiseScale, vUv.y * u_noiseScale, u_time);

  float value = xLine + fbm(noiseCoords, NOISE_OCTAVES) * size;

  return value;
}

vec2 scale(vec2 coord, float value) {
  coord -= vec2(0.5);
  coord *= 1.0 - (value - 1.0);
  coord += vec2(0.5);
  
  return coord;
}

void main() {
  float noiseX = getNoise();
  float lineNoiseIntensity = smoothstep(noiseX - 0.05, noiseX, vUv.x);

  float distortionNoise = cnoise(vec3(vUv, u_time));

  float parallaxProgress = pow(u_progress, 2.0);

  vec2 prevCoords = vUv + distortionNoise * lineNoiseIntensity;
  prevCoords.x += parallaxProgress * u_parallax;

  vec2 nextCoords = vUv + distortionNoise * (1.0 - lineNoiseIntensity);
  nextCoords = scale(nextCoords, 1.0 + (u_scale - 1.0) * (1.0 - parallaxProgress));
  
  vec4 prev = texture2D(u_textures[PREV_INDEX], prevCoords);
  vec4 next = texture2D(u_textures[NEXT_INDEX], nextCoords);
  
  vec3 color = mix(prev.rgb, next.rgb, lineNoiseIntensity);

  gl_FragColor = vec4(color, 1.0);
}
