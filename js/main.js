/* Santo Neon — interações da home
   GSAP (entrada do herói + reveals de scroll), teste da câmera,
   formulário progressivo que "acende" e envia pro WhatsApp. */

import { initParticles } from './particles.js';

/* ============================================================
   CONFIGURAÇÃO — trocar antes de publicar
   ============================================================ */
const WHATSAPP_NUMBER = '5511999999999'; // TODO: número real com DDI+DDD, só dígitos
const INSTAGRAM_URL = 'https://instagram.com/santoneon'; // TODO: @ real

const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- links de contato ---------- */
const waLink = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

document.getElementById('whatsFab').href = waLink('Olá, Santo Neon! Vi o site e quero um orçamento.');
document.getElementById('footerZap').href = waLink('Olá, Santo Neon!');
document.getElementById('footerInsta').href = INSTAGRAM_URL;
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- fundo de partículas ---------- */
if (!prefersReducedMotion) {
  try {
    initParticles(document.getElementById('fx'));
  } catch (err) {
    console.warn('Partículas desativadas:', err);
  }
}

/* ---------- glow que segue o cursor ---------- */
const finePointer = matchMedia('(pointer: fine)').matches;
if (finePointer && !prefersReducedMotion) {
  document.body.classList.add('has-pointer');
  const glow = document.querySelector('.cursor-glow');
  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
  addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function follow() {
    gx += (tx - gx) * 0.08;
    gy += (ty - gy) * 0.08;
    glow.style.transform = `translate(${gx}px, ${gy}px)`;
    requestAnimationFrame(follow);
  })();
}

/* ============================================================
   GSAP
   ============================================================ */
function whenGsapReady(cb) {
  if (window.gsap && window.ScrollTrigger) return cb();
  let tries = 0;
  const t = setInterval(() => {
    if (window.gsap && window.ScrollTrigger) { clearInterval(t); cb(); }
    else if (++tries > 200) clearInterval(t);
  }, 25);
}

whenGsapReady(() => {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  if (prefersReducedMotion) {
    document.getElementById('heroNeon').classList.add('is-lit');
    return; // conteúdo já é 100% visível sem JS/motion
  }

  /* ---- nav compacta ao rolar ---- */
  const nav = document.querySelector('.nav');
  ScrollTrigger.create({
    start: 40,
    onEnter: () => nav.classList.add('is-scrolled'),
    onLeaveBack: () => nav.classList.remove('is-scrolled'),
  });

  /* ---- entrada do herói ---- */
  const heroNeon = document.getElementById('heroNeon');
  heroNeon.classList.add('is-off');

  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro
    .from('.nav', { y: -30, opacity: 0, duration: .7 })
    .from('.hero-eyebrow', { y: 20, opacity: 0, duration: .6 }, '-=.35')
    .from('.hero-line', { y: 40, opacity: 0, duration: .7 }, '-=.3')
    .add(neonStrike(heroNeon), '-=.15')
    .from('.hero-sub', { y: 24, opacity: 0, duration: .6 }, '-=.6')
    .from('.hero-ctas .btn', { y: 20, opacity: 0, stagger: .12, duration: .5 }, '-=.35')
    .from('.hero-badges li', { y: 14, opacity: 0, stagger: .1, duration: .45 }, '-=.3')
    .from('.scroll-hint', { opacity: 0, duration: .8 }, '-=.2');

  /* letreiro "pegando": pisca irregular e estabiliza aceso */
  function neonStrike(el) {
    const tl = gsap.timeline();
    const onOff = [.06, .05, .12, .04, .09, .05, .16, .04, .08];
    let lit = false;
    onOff.forEach((d) => {
      lit = !lit;
      tl.to(el, {
        duration: d,
        ease: 'none',
        onStart: () => el.classList.toggle('is-off', !lit),
      });
    });
    tl.set(el, {
      onComplete: () => { el.classList.remove('is-off'); el.classList.add('is-lit'); },
    });
    return tl;
  }

  /* ---- reveals genéricos ---- */
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 36,
      opacity: 0,
      duration: .8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%' },
    });
  });
  gsap.utils.toArray('[data-reveal-group]').forEach((group) => {
    gsap.from(group.children, {
      y: 44,
      opacity: 0,
      duration: .8,
      stagger: .14,
      ease: 'power3.out',
      scrollTrigger: { trigger: group, start: 'top 84%' },
    });
  });

  /* ---- marquee infinito ---- */
  const marquee = document.querySelector('[data-marquee]');
  if (marquee) {
    const track = marquee.querySelector('.marquee-track');
    for (let i = 0; i < 5; i++) marquee.appendChild(track.cloneNode(true));
    gsap.to(marquee.children, {
      xPercent: -100,
      repeat: -1,
      duration: 22,
      ease: 'none',
    });
  }

  /* ---- passos do processo acendem em sequência ---- */
  const steps = gsap.utils.toArray('[data-step]');
  ScrollTrigger.create({
    trigger: '.steps',
    start: 'top 75%',
    onEnter: () =>
      steps.forEach((s, i) => setTimeout(() => s.classList.add('is-active'), 260 * i)),
  });
  gsap.from(steps, {
    y: 40,
    opacity: 0,
    stagger: .12,
    duration: .7,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.steps', start: 'top 82%' },
  });

  /* ---- tilt 3D nos cards e no viewfinder ---- */
  if (finePointer) {
    document.querySelectorAll('[data-tilt]').forEach((el) => {
      const qx = gsap.quickTo(el, 'rotationY', { duration: .5, ease: 'power2.out' });
      const qy = gsap.quickTo(el, 'rotationX', { duration: .5, ease: 'power2.out' });
      gsap.set(el, { transformPerspective: 900 });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        qx(((e.clientX - r.left) / r.width - 0.5) * 7);
        qy(-((e.clientY - r.top) / r.height - 0.5) * 7);
      });
      el.addEventListener('pointerleave', () => { qx(0); qy(0); });
    });
  }
});

/* ============================================================
   Teste da câmera
   ============================================================ */
const viewfinder = document.getElementById('viewfinder');
const btnCheap = document.getElementById('btnCheap');
const btnSanto = document.getElementById('btnSanto');
const vfLabel = document.getElementById('vfLabel');
const vfCaption = document.getElementById('vfCaption');

function setCameraMode(cheap) {
  viewfinder.classList.toggle('mode-cheap', cheap);
  viewfinder.classList.toggle('mode-santo', !cheap);
  btnCheap.classList.toggle('is-active', cheap);
  btnSanto.classList.toggle('is-active', !cheap);
  btnCheap.setAttribute('aria-selected', String(cheap));
  btnSanto.setAttribute('aria-selected', String(!cheap));
  vfLabel.textContent = cheap ? 'LED genérico' : 'LED flicker-free';
  vfCaption.textContent = cheap
    ? 'Flicker de alta frequência: listras, estouro e cor lavada em qualquer vídeo.'
    : 'Luz contínua e estável: nítido em qualquer câmera, em qualquer story.';
}
btnCheap.addEventListener('click', () => setCameraMode(true));
btnSanto.addEventListener('click', () => setCameraMode(false));

/* ============================================================
   Formulário progressivo — cada resposta "acende" o pedido
   ============================================================ */
const form = document.getElementById('leadForm');
const answers = { tipo: null, local: null, tamanho: null, cor: 'rosa' };

/* chips de seleção única por grupo */
document.querySelectorAll('.chips').forEach((groupEl) => {
  const group = groupEl.dataset.group;
  groupEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    groupEl.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-selected'));
    chip.classList.add('is-selected');
    answers[group] = chip.dataset.value;
    chip.closest('.q').classList.add('is-done');

    if (group === 'tamanho') {
      document.getElementById('sizeFields').hidden = chip.dataset.value !== 'sim';
    }
    updateProgress();
  });
});

/* preview: texto digitado acende no painel */
const previewNeon = document.getElementById('previewNeon');
const inputTexto = document.getElementById('inputTexto');
inputTexto.addEventListener('input', () => {
  previewNeon.textContent = inputTexto.value.trim() || 'sua marca';
});

/* preview: cor */
const SWATCH_COLORS = { rosa: '#ff2fb3', ciano: '#23e6ff', 'âmbar': '#ffb02e', verde: '#3dffa0' };
document.getElementById('swatches').addEventListener('click', (e) => {
  const sw = e.target.closest('.swatch');
  if (!sw) return;
  document.querySelectorAll('.swatch').forEach((s) => s.classList.remove('is-active'));
  sw.classList.add('is-active');
  answers.cor = sw.dataset.color;
  document.querySelector('.preview-frame').style.setProperty('--preview-color', SWATCH_COLORS[answers.cor]);
});

/* progresso do pedido */
const progressFill = document.getElementById('progressFill');
const progressPct = document.getElementById('progressPct');
const inputNome = document.getElementById('inputNome');
const inputZap = document.getElementById('inputZap');

function updateProgress() {
  const parts = [
    Boolean(answers.tipo),
    Boolean(answers.local),
    Boolean(answers.tamanho),
    inputNome.value.trim().length >= 2,
    onlyDigits(inputZap.value).length >= 10,
  ];
  const pct = Math.round((parts.filter(Boolean).length / parts.length) * 100);
  progressFill.style.width = `${pct}%`;
  progressPct.textContent = `${pct}%`;
  document.querySelector('[data-q="contato"]').classList.toggle('is-done', parts[3] && parts[4]);
}
[inputNome, inputZap].forEach((el) => el.addEventListener('input', updateProgress));

/* máscara leve de telefone BR */
function onlyDigits(v) { return v.replace(/\D/g, ''); }
inputZap.addEventListener('input', () => {
  const d = onlyDigits(inputZap.value).slice(0, 11);
  let out = d;
  if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length > 7) out = `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  inputZap.value = out;
});

/* envio: monta a mensagem e abre o WhatsApp já preenchido */
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = inputNome.value.trim();
  const zap = onlyDigits(inputZap.value);
  const errorEl = document.getElementById('formError');

  inputNome.classList.toggle('is-invalid', nome.length < 2);
  inputZap.classList.toggle('is-invalid', zap.length < 10);
  if (nome.length < 2 || zap.length < 10) {
    errorEl.hidden = false;
    return;
  }
  errorEl.hidden = true;

  const texto = inputTexto.value.trim();
  const empresa = document.getElementById('inputEmpresa').value.trim();
  const largura = document.getElementById('inputLargura').value;
  const altura = document.getElementById('inputAltura').value;
  const tamanho =
    answers.tamanho === 'sim' && (largura || altura)
      ? `${largura || '?'} x ${altura || '?'} cm`
      : 'A definir (preciso de orientação)';

  const linhas = [
    'Olá, Santo Neon! Quero um orçamento ⚡',
    `• Projeto: ${answers.tipo || 'A definir'}`,
    `• Local: ${answers.local || 'A definir'}`,
    texto ? `• Texto do neon: "${texto}"` : null,
    `• Cor: ${answers.cor}`,
    `• Tamanho: ${tamanho}`,
    `• Nome: ${nome}`,
    empresa ? `• Empresa/Instagram: ${empresa}` : null,
    '(pedido montado no site)',
  ].filter(Boolean);

  window.open(waLink(linhas.join('\n')), '_blank', 'noopener');

  form.hidden = true;
  document.querySelector('.preview-panel').hidden = true;
  document.getElementById('formSuccess').hidden = false;
});

/* refazer pedido */
document.getElementById('btnAgain').addEventListener('click', () => {
  document.getElementById('formSuccess').hidden = true;
  document.querySelector('.preview-panel').hidden = false;
  form.hidden = false;
});
