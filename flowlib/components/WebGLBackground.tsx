'use client'

import { useEffect, useRef } from 'react'

// ── Shared vertex shader ──────────────────────────────────────────────────────
const VERT = `
attribute vec4 position;
void main() { gl_Position = position; }
`

// ── Hero: dark animated background with subtle blue-indigo diagonal shimmer ───
// Deep charcoal base with barely-there animated blue waves — premium dark feel
const HERO_FRAG = `
precision highp float;
uniform vec2  resolution;
uniform float time;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;

  float t = time * 0.5;

  /* two overlapping diagonal wave sets */
  float d = uv.x * 0.707 + uv.y * 0.707;
  float a = sin(d * 22.0 + t)         * 0.5 + 0.5;
  float b = sin(d * 44.0 - t * 1.3)   * 0.5 + 0.5;
  float c = sin(d * 11.0 + t * 0.4)   * 0.5 + 0.5;
  float n = a * 0.5 + b * 0.3 + c * 0.2;

  /* dark charcoal → subtle blue-indigo shimmer */
  vec3 base   = vec3(0.063, 0.063, 0.078);  /* #101013 */
  vec3 accent = vec3(0.082, 0.098, 0.196);  /* #15193200 blue */
  gl_FragColor = vec4(mix(base, accent, n * 0.7), 1.0);
}
`

// ── Title: transparent aurora that glows behind the h1 headline ──────────────
// Flowing horizontal bands: electric blue → violet → cyan — semi-transparent
// so the hero background shows through. Canvas uses alpha:true + blending.
const TITLE_FRAG = `
precision highp float;
uniform vec2  resolution;
uniform float time;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  float t  = time * 0.55;

  /* warp horizontal axis with a slow vertical sine for organic flow */
  float x  = uv.x + sin(uv.y * 4.5 + t * 0.55) * 0.13;

  /* three overlapping aurora bands */
  float w1 = sin(x * 10.0 + t)         * 0.5 + 0.5;
  float w2 = sin(x * 17.0 - t * 1.1)   * 0.5 + 0.5;
  float w3 = sin(x *  7.0 + t * 0.38)  * 0.5 + 0.5;
  float aurora = pow(w1 * 0.50 + w2 * 0.30 + w3 * 0.20, 1.5);

  /* vignette: full opacity in centre, fade at top/bottom and side edges */
  float vy = smoothstep(0.0, 0.28, uv.y) * smoothstep(1.0, 0.72, uv.y);
  float vx = smoothstep(0.0, 0.05, uv.x) * smoothstep(1.0, 0.95, uv.x);
  float mask = vy * vx;

  /* electric blue → violet → cyan colour ramp */
  vec3 blue   = vec3(0.15, 0.35, 1.00);   /* #2659ff */
  vec3 violet = vec3(0.55, 0.12, 0.92);   /* #8c1eeb */
  vec3 cyan   = vec3(0.00, 0.70, 1.00);   /* #00b2ff */

  vec3 col = mix(blue, violet, w1 * 0.85);
  col      = mix(col,  cyan,   w2 * w3 * 0.55);
  col     += 0.06;  /* lift blacks slightly */

  float alpha = aurora * mask * 0.68;
  gl_FragColor = vec4(col, alpha);
}
`

// ── Dark CTA: domain-warped fractal noise with blue/purple glow ──────────────
// Uses fBm domain-warping (Inigo Quilez technique) for organic flowing motion
const DARK_FRAG = `
precision highp float;
uniform vec2  resolution;
uniform float time;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i),                hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 6; i++) {
    v   += amp * noise(p);
    p   *= 2.02;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  uv.x   *= resolution.x / resolution.y;

  float t = time * 0.18;

  /* domain warping: two passes of fBm to distort coordinates */
  vec2 q = vec2(fbm(uv + t * 0.3),
                fbm(uv + vec2(1.0, 1.0)));
  vec2 r = vec2(fbm(uv + 1.2 * q + vec2(1.7,  9.2) + 0.15 * t),
                fbm(uv + 1.2 * q + vec2(8.3,  2.8) + 0.13 * t));

  float f = fbm(uv + 1.4 * r);
  float c = clamp(f, 0.0, 1.0);

  /* deep navy → mid blue → bright blue */
  vec3 col = mix(vec3(0.02, 0.04, 0.12),
                 vec3(0.10, 0.25, 0.65), c * c * 2.5);
  col      = mix(col,
                 vec3(0.23, 0.51, 0.97), clamp(c - 0.35, 0.0, 1.0) * 1.8);
  col     *= 0.75 + f * 0.5;

  gl_FragColor = vec4(col, 1.0);
}
`

// ── WebGL helpers ─────────────────────────────────────────────────────────────
function buildShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader error:', gl.getShaderInfoLog(s))
    return null
  }
  return s
}

function buildProgram(gl: WebGLRenderingContext, fragSrc: string) {
  const vert = buildShader(gl, gl.VERTEX_SHADER, VERT)
  const frag = buildShader(gl, gl.FRAGMENT_SHADER, fragSrc)
  if (!vert || !frag) return null
  const prog = gl.createProgram()!
  gl.attachShader(prog, vert)
  gl.attachShader(prog, frag)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(prog))
    return null
  }
  return prog
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props { variant: 'hero' | 'dark' | 'title'; className?: string }

export function WebGLBackground({ variant, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // title variant needs a transparent canvas so the hero bg shows through
    const transparent = variant === 'title'
    const gl = canvas.getContext('webgl', {
      antialias:         false,
      alpha:             transparent,
      premultipliedAlpha: false,
    })
    if (!gl) return

    const fragSrc =
      variant === 'hero'  ? HERO_FRAG  :
      variant === 'title' ? TITLE_FRAG :
                            DARK_FRAG
    const prog = buildProgram(gl, fragSrc)
    if (!prog) return

    gl.useProgram(prog)

    if (transparent) {
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.clearColor(0, 0, 0, 0)
    }

    // Full-screen quad (triangle strip)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(prog, 'position')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

    const uRes  = gl.getUniformLocation(prog, 'resolution')
    const uTime = gl.getUniformLocation(prog, 'time')

    // ── Sizing: read from parent because canvas is position:absolute ──────
    const parent = canvas.parentElement ?? canvas
    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w   = parent.clientWidth  || window.innerWidth
      const h   = parent.clientHeight || window.innerHeight
      canvas.width  = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    setSize()

    const ro = new ResizeObserver(setSize)
    ro.observe(parent)

    // ── Render loop ───────────────────────────────────────────────────────
    const t0 = performance.now()
    let raf: number
    const tick = () => {
      if (transparent) gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, (performance.now() - t0) * 0.001)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [variant])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        display: 'block', pointerEvents: 'none',
      }}
      className={className}
    />
  )
}
