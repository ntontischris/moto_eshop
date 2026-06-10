/* Velocità S15 — raw-WebGL hero ripple engine. Loaded ONLY via dynamic import
   (see hero-ripple-provider.tsx) so none of this ships in the initial bundle and
   the Lighthouse gate (#39) is untouched. No react-three-fiber, no three: raw
   WebGL on the home route per PRD.

   Fail-safe by construction: start() returns a disposer no matter what. If the
   GL context, texture (CORS taint), or shader compile fails, it silently leaves
   the server-rendered poster as the LCP element and the permanent fallback — no
   throw, no blank canvas (the canvas only fades in via .is-live once drawing).

   Caller (provider) guarantees desktop + fine-pointer + motion-allowed before
   invoking. The shader uniform contract mirrors the approved prototype:
   uTex cover-fitted via uRes/uImg; uMouse (smoothed lerp); uStr (mouse-speed
   ripple, decaying); uVelo (scroll velocity → chromatic aberration, decaying);
   uTime. DPR capped at 1.5; rAF pauses off-screen and when the tab is hidden. */

import {
  cappedDevicePixelRatio,
  pointerSpeedToStrength,
  scrollVelocityToChroma,
} from "./hero-ripple";

type Disposer = () => void;

const VERTEX_SRC =
  "attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;vUv.y=1.-vUv.y;gl_Position=vec4(p,0.,1.);}";

const FRAGMENT_SRC =
  "precision mediump float;varying vec2 vUv;uniform sampler2D uTex;uniform vec2 uRes,uImg,uMouse;uniform float uStr,uVelo,uTime;" +
  "void main(){vec2 s=uRes/uImg;float sc=max(s.x,s.y);vec2 sz=uImg*sc;vec2 off=(uRes-sz)*.5;vec2 uv=(vUv*uRes-off)/sz;uv.y=clamp(uv.y,0.,1.);" +
  "vec2 asp=vec2(uRes.x/uRes.y,1.);float d=distance(vUv*asp,uMouse*asp);float rip=smoothstep(.38,0.,d)*uStr;" +
  "vec2 dir=normalize(vUv-uMouse+1e-5);uv+=dir*rip*.05;uv+=vec2(sin(uv.y*14.+uTime*.6),0.)*rip*.012;" +
  "float ca=.0026*uVelo+rip*.012;" +
  "float r=texture2D(uTex,uv+vec2(ca,0.)).r;float g=texture2D(uTex,uv).g;float b=texture2D(uTex,uv-vec2(ca,0.)).b;" +
  "gl_FragColor=vec4(r,g,b,1.);}";

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  src: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("shader alloc failed");
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "shader compile failed");
  }
  return shader;
}

function buildProgram(gl: WebGLRenderingContext): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("program alloc failed");
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error("program link failed");
  }
  gl.useProgram(program);
  return program;
}

function uploadTexture(
  gl: WebGLRenderingContext,
  image: HTMLImageElement,
): void {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Throws (and is caught upstream) if the image is CORS-tainted.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

function bindFullScreenTriangle(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
): void {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const loc = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
}

interface RippleState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  strength: number;
  targetStrength: number;
  velocity: number;
}

/* Runs the GL render loop and wires pointer / scroll / visibility listeners.
   Returns a disposer that stops the loop and removes every listener. */
function runRenderLoop(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  canvas: HTMLCanvasElement,
  hero: HTMLElement,
  image: HTMLImageElement,
): Disposer {
  const u = (name: string) => gl.getUniformLocation(program, name);
  const uRes = u("uRes");
  const uMouse = u("uMouse");
  const uStr = u("uStr");
  const uVelo = u("uVelo");
  const uTime = u("uTime");
  gl.uniform2f(u("uImg"), image.naturalWidth, image.naturalHeight);

  const dpr = cappedDevicePixelRatio(window.devicePixelRatio);
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener("resize", resize, { passive: true });

  const state: RippleState = {
    x: 0.5,
    y: 0.5,
    targetX: 0.5,
    targetY: 0.5,
    strength: 0,
    targetStrength: 0,
    velocity: 0,
  };

  const onPointerMove = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const next = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
    state.targetStrength = pointerSpeedToStrength(
      { x: state.targetX, y: state.targetY },
      next,
    );
    state.targetX = next.x;
    state.targetY = next.y;
  };
  hero.addEventListener("mousemove", onPointerMove, { passive: true });

  let lastScrollY = window.scrollY;
  let lastScrollAt = performance.now();
  const onScroll = () => {
    const now = performance.now();
    const dt = now - lastScrollAt || 16;
    const pxPerSec = ((window.scrollY - lastScrollY) / dt) * 1000;
    state.velocity = scrollVelocityToChroma(pxPerSec);
    lastScrollY = window.scrollY;
    lastScrollAt = now;
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  let onScreen = true;
  const observer = new IntersectionObserver(
    (entries) => {
      onScreen = entries[0]?.isIntersecting ?? false;
    },
    { threshold: 0 },
  );
  observer.observe(canvas);

  const start = performance.now();
  let frame = 0;
  const render = () => {
    frame = requestAnimationFrame(render);
    // Pause all GL work when off-screen or the tab is hidden (zero rAF cost).
    if (!onScreen || document.hidden) return;

    state.x += (state.targetX - state.x) * 0.08;
    state.y += (state.targetY - state.y) * 0.08;
    state.strength += (state.targetStrength - state.strength) * 0.06;
    state.targetStrength *= 0.94;
    state.velocity *= 0.92;

    gl.uniform2f(uMouse, state.x, state.y);
    gl.uniform1f(uStr, state.strength);
    gl.uniform1f(uVelo, state.velocity);
    gl.uniform1f(uTime, (performance.now() - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  frame = requestAnimationFrame(render);
  canvas.classList.add("is-live");

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", resize);
    window.removeEventListener("scroll", onScroll);
    hero.removeEventListener("mousemove", onPointerMove);
    observer.disconnect();
    canvas.classList.remove("is-live");
  };
}

/* Entry point. Resolves the hero/canvas/poster, creates the GL context, loads a
   CORS-anonymous texture, and starts the loop — every failure path silently
   no-ops and returns a disposer. Never throws. */
export function start(): Disposer {
  const noop: Disposer = () => {};
  const hero = document.querySelector<HTMLElement>("[data-hero-entrance]");
  const canvas = document.querySelector<HTMLCanvasElement>(
    "[data-hero-ripple-canvas]",
  );
  const poster = document.querySelector<HTMLImageElement>(
    "[data-hero-ripple-source]",
  );
  if (!hero || !canvas || !poster) return noop;

  const gl =
    canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    }) ?? null;
  if (!gl) return noop;

  let dispose: Disposer = noop;
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => {
    try {
      const program = buildProgram(gl);
      bindFullScreenTriangle(gl, program);
      uploadTexture(gl, image);
      dispose = runRenderLoop(gl, program, canvas, hero, image);
    } catch {
      /* shader / CORS / GL failure — static poster stays, no canvas paint */
    }
  };
  image.onerror = () => {
    /* texture failed to load — static poster stays */
  };
  image.src = poster.currentSrc || poster.src;

  return () => {
    image.onload = null;
    image.onerror = null;
    dispose();
  };
}
