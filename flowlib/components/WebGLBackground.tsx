'use client'

import { useEffect, useRef } from 'react'

// ── Shared vertex shader (full-screen quad) ─────────────────────────────────
const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

// ── Hero: subtle animated diagonal stripe texture on warm off-white ──────────
const HERO_FRAG = `
precision mediump float;
uniform vec2  u_res;
uniform float u_time;

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;

  float speed  = u_time * 0.05;
  float d      = uv.x * 0.62 + uv.y * 0.38;
  float stripe = sin(d * 38.0 + speed) * 0.5 + 0.5;
  stripe = smoothstep(0.3, 0.7, stripe);

  /* very subtle warm off-white range */
  float b = mix(0.946, 0.964, stripe);
  gl_FragColor = vec4(b * 0.998, b * 0.990, b * 0.976, 1.0);
}
`

// ── Dark: flowing noise with lime-green glow ─────────────────────────────────
const DARK_FRAG = `
precision mediump float;
uniform vec2  u_res;
uniform float u_time;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i),            hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  uv.x   *= u_res.x / u_res.y;

  float t = u_time * 0.14;

  float n  = noise(uv * 2.2 + t * 0.35);
  n += noise(uv * 5.0 - t * 0.45) * 0.50;
  n += noise(uv * 10.0 + t * 0.20) * 0.25;
  n /= 1.75;

  float glow = smoothstep(0.50, 0.88, n) * 0.20;

  vec3 dark = vec3(0.047, 0.047, 0.047);   /* #0c0c0c */
  vec3 lime = vec3(0.773, 0.961, 0.000);   /* #c5f500 */
  vec3 col  = mix(dark, lime, glow);

  gl_FragColor = vec4(col, 1.0);
}
`

// ── Helpers ───────────────────────────────────────────────────────────────────
function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  return s
}

function buildProgram(gl: WebGLRenderingContext, fragSrc: string): WebGLProgram {
  const prog = gl.createProgram()!
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, fragSrc))
  gl.linkProgram(prog)
  return prog
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  variant: 'hero' | 'dark'
  className?: string
}

export function WebGLBackground({ variant, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl')
    if (!gl) return

    const prog = buildProgram(gl, variant === 'hero' ? HERO_FRAG : DARK_FRAG)
    gl.useProgram(prog)

    // Full-screen quad
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1,  1, -1,  -1, 1,  1, 1]),
      gl.STATIC_DRAW,
    )

    const aPosLoc  = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPosLoc)
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0)

    const uResLoc  = gl.getUniformLocation(prog, 'u_res')
    const uTimeLoc = gl.getUniformLocation(prog, 'u_time')

    const startTime = performance.now()
    let raf: number

    const resize = () => {
      const dpr = window.devicePixelRatio ?? 1
      canvas.width  = canvas.offsetWidth  * dpr
      canvas.height = canvas.offsetHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const render = () => {
      const t = (performance.now() - startTime) * 0.001
      gl.uniform2f(uResLoc, canvas.width, canvas.height)
      gl.uniform1f(uTimeLoc, t)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [variant])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className ?? ''}`}
    />
  )
}
