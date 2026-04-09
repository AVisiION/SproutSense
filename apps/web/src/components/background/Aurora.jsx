/**
 * Aurora.jsx — components/background/
 * Animated aurora background using WebGL fragment shader.
 * Source: React Bits (https://reactbits.dev/backgrounds/aurora)
 * Tuned for SproutSense cyan × teal × green palette.
 *
 * Props:
 *   colorStops  {string[]}  Array of CSS hex colours for the aurora bands.
 *   amplitude   {number}    Wave amplitude (default 1.0).
 *   blend       {number}    Blend factor 0–1 (default 0.5).
 *   speed       {number}    Animation speed multiplier (default 0.5).
 */
import { useRef, useEffect } from 'react';
import { getCSSVariableValue } from '../../utils/colorUtils';

const VERT = `
precision mediump float;
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
uniform float u_time;
uniform float u_amplitude;
uniform float u_blend;
uniform vec2  u_resolution;
uniform vec3  u_color0;
uniform vec3  u_color1;
uniform vec3  u_color2;
uniform vec3  u_color3;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i.x + i.y * 57.0);
  float b = hash(i.x + 1.0 + i.y * 57.0);
  float c = hash(i.x + (i.y + 1.0) * 57.0);
  float d = hash(i.x + 1.0 + (i.y + 1.0) * 57.0);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float t  = u_time * 0.18;

  // Three layered aurora waves
  float wave1 = sin(uv.x * 3.0 + t * 1.2) * 0.5 + 0.5;
  float wave2 = sin(uv.x * 5.0 - t * 0.9 + 1.4) * 0.5 + 0.5;
  float wave3 = sin(uv.x * 2.0 + t * 0.6 + 2.8) * 0.5 + 0.5;

  float band1 = smoothstep(0.55, 0.75, uv.y + (wave1 - 0.5) * u_amplitude * 0.35);
  float band2 = smoothstep(0.35, 0.60, uv.y + (wave2 - 0.5) * u_amplitude * 0.28);
  float band3 = smoothstep(0.15, 0.45, uv.y + (wave3 - 0.5) * u_amplitude * 0.20);

  float n = noise(uv * 4.0 + t * 0.5);

  vec3 col = u_color0;
  col = mix(col, u_color1, band1 * (0.65 + n * 0.35));
  col = mix(col, u_color2, band2 * (0.55 + n * 0.45));
  col = mix(col, u_color3, band3 * (0.45 + n * 0.55));

  // Vignette
  float vig = 1.0 - smoothstep(0.4, 1.2, length(uv - 0.5) * 1.5);
  col *= vig;

  // Blend factor dims the aurora
  col = mix(u_color0, col, u_blend);

  gl_FragColor = vec4(col, 1.0);
}
`;

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

function compileShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('[Aurora] shader error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function Aurora({
  colorStops = ['--aurora-primary', '--aurora-secondary', '--aurora-tertiary', '--aurora-bg'],
  amplitude  = 1.2,
  blend      = 0.6,
  speed      = 0.4,
}) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { antialias: false });
    if (!gl) return;

    // Resolve CSS variable colors
    const resolvedStops = colorStops.map(stop => {
      // If it's a CSS variable name, resolve it
      if (typeof stop === 'string' && stop.startsWith('--')) {
        return getCSSVariableValue(stop);
      }
      return stop;
    });

    const vert = compileShader(gl, gl.VERTEX_SHADER,   VERT);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vert || !frag) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uTime  = gl.getUniformLocation(prog, 'u_time');
    const uAmp   = gl.getUniformLocation(prog, 'u_amplitude');
    const uBlend = gl.getUniformLocation(prog, 'u_blend');
    const uRes   = gl.getUniformLocation(prog, 'u_resolution');
    const uC0    = gl.getUniformLocation(prog, 'u_color0');
    const uC1    = gl.getUniformLocation(prog, 'u_color1');
    const uC2    = gl.getUniformLocation(prog, 'u_color2');
    const uC3    = gl.getUniformLocation(prog, 'u_color3');

    const stops = [...resolvedStops];
    while (stops.length < 4) stops.push('#000000');

    gl.uniform1f(uAmp,   amplitude);
    gl.uniform1f(uBlend, blend);
    gl.uniform3fv(uC0,   hexToRgb(stops[0]));
    gl.uniform3fv(uC1,   hexToRgb(stops[1]));
    gl.uniform3fv(uC2,   hexToRgb(stops[2]));
    gl.uniform3fv(uC3,   hexToRgb(stops[3]));

    let start = null;

    const resize = () => {
      canvas.width  = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const frame = (ts) => {
      if (!start) start = ts;
      const elapsed = (ts - start) * 0.001 * speed;
      gl.uniform1f(uTime, elapsed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteBuffer(buf);
    };
  }, [colorStops, amplitude, blend, speed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position : 'fixed',
        inset     : 0,
        width     : '100%',
        height    : '100%',
        zIndex    : 0,
        display   : 'block',
        pointerEvents: 'none',
      }}
    />
  );
}
