/* Fundo de partículas neon — Three.js
   Pontos com glow aditivo nas cores da marca, deriva orgânica,
   repulsão ao redor do cursor e parallax de scroll.
   Densidade e DPR são reduzidos em telas pequenas / GPUs fracas. */

import * as THREE from '../vendor/three.module.min.js';

export function initParticles(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    });
  } catch {
    return null; // sem WebGL: o fundo em gradiente do CSS assume
  }

  const isMobile = matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  const COUNT = isMobile ? 900 : 2200;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 1, 300);
  camera.position.z = 90;

  // volume maior que a viewport para as bordas nunca ficarem vazias
  const SPREAD_X = 160;
  const SPREAD_Y = 110;
  const SPREAD_Z = 70;

  const positions = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  const mixes = new Float32Array(COUNT);
  const sizes = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * SPREAD_X;
    positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD_Y;
    positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_Z;
    seeds[i] = Math.random();
    mixes[i] = Math.random();
    // maioria pequena, algumas "bokeh" grandes
    sizes[i] = Math.random() < 0.06 ? 5 + Math.random() * 7 : 1 + Math.random() * 2.6;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aMix', new THREE.BufferAttribute(mixes, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  const uniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uMouse: { value: new THREE.Vector2(9999, 9999) },
    uMouseStrength: { value: isMobile ? 0 : 1 },
    uPixelRatio: { value: DPR },
    uColorA: { value: new THREE.Color('#ff2fb3') },
    uColorB: { value: new THREE.Color('#23e6ff') },
    uColorC: { value: new THREE.Color('#ffb02e') },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aSeed;
      attribute float aMix;
      attribute float aSize;
      uniform float uTime;
      uniform float uScroll;
      uniform vec2 uMouse;
      uniform float uMouseStrength;
      uniform float uPixelRatio;
      varying float vMix;
      varying float vTwinkle;

      void main() {
        vMix = aMix;
        vec3 pos = position;

        // deriva orgânica, fase própria por partícula
        float t = uTime * (0.25 + aSeed * 0.35);
        pos.x += sin(t + aSeed * 40.0) * (2.2 + aSeed * 2.5);
        pos.y += cos(t * 0.8 + aSeed * 27.0) * (2.0 + aSeed * 2.2);

        // parallax de scroll: camadas ao fundo sobem mais devagar
        float depth = (pos.z + 35.0) / 70.0; // 0..1
        pos.y += uScroll * mix(4.0, 16.0, depth);
        pos.y = mod(pos.y + 55.0, 110.0) - 55.0;

        // repulsão suave ao redor do cursor
        vec2 toMouse = pos.xy - uMouse;
        float d = length(toMouse);
        float force = smoothstep(26.0, 0.0, d) * 9.0 * uMouseStrength;
        pos.xy += normalize(toMouse + 0.0001) * force;

        vTwinkle = 0.55 + 0.45 * sin(uTime * (1.5 + aSeed * 3.0) + aSeed * 90.0);

        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPixelRatio * (95.0 / -mv.z) * (0.75 + 0.25 * vTwinkle);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;
      varying float vMix;
      varying float vTwinkle;

      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float glow = pow(1.0 - d * 2.0, 2.2);

        vec3 color = vMix < 0.45
          ? mix(uColorA, uColorB, vMix / 0.45)
          : (vMix < 0.9 ? mix(uColorB, uColorA, (vMix - 0.45) / 0.45) : uColorC);

        gl_FragColor = vec4(color, glow * (0.35 + 0.65 * vTwinkle));
      }
    `,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // ---- interação ----
  const mouseTarget = new THREE.Vector2(9999, 9999);
  let scrollTarget = 0;

  function worldFromPointer(clientX, clientY) {
    const ndcX = (clientX / window.innerWidth) * 2 - 1;
    const ndcY = -((clientY / window.innerHeight) * 2 - 1);
    const vH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const vW = vH * camera.aspect;
    mouseTarget.set((ndcX * vW) / 2, (ndcY * vH) / 2);
  }

  if (!isMobile) {
    window.addEventListener('pointermove', (e) => worldFromPointer(e.clientX, e.clientY), { passive: true });
    window.addEventListener('pointerleave', () => mouseTarget.set(9999, 9999), { passive: true });
  }

  function onScroll() {
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    scrollTarget = (window.scrollY / max) * 10;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setPixelRatio(DPR);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // ---- loop ----
  const clock = new THREE.Clock();
  let rafId = 0;
  let running = true;

  function frame() {
    if (!running) return;
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uScroll.value += (scrollTarget - uniforms.uScroll.value) * 0.06;
    uniforms.uMouse.value.lerp(mouseTarget, 0.08);
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }
  frame();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(rafId);
    } else if (!running) {
      running = true;
      clock.getDelta();
      frame();
    }
  });

  return { renderer, scene };
}
