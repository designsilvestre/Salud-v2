/* Salud Odontologia · site v2 · JS puro + Lenis (smooth scroll, ref. ADA) */
(() => {
  'use strict';
  document.documentElement.classList.add('js');

  // ===== Config =====
  // PENDENTE: confirmar WhatsApp oficial (99209-6463 ou 99232-5593)
  const WA = '5522992096463';
  const MSG = {
    geral: 'Olá! Vim pelo site e gostaria de agendar uma avaliação.',
    dra: 'Olá! Vim pelo site e gostaria de agendar uma avaliação.',
    depoimentos: 'Olá! Assisti aos depoimentos no site e quero agendar uma avaliação.',
    duvida: 'Olá! Vim pelo site e tenho uma dúvida:',
    trat: t => `Olá! Vim pelo site e tenho interesse em ${t}.`,
    quiz: (ans, res) => `Olá! Fiz o teste no site. Respostas: ${ans}. Resultado: ${res}.`
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => matchMedia('(max-width: 767px)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const band = (p, a, b) => clamp((p - a) / (b - a));
  const smooth = t => t * t * t * (t * (t * 6 - 15) + 10);
  const progress = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight)); };
  const easeOut = t => 1 - Math.pow(1 - t, 5);            // ~ cubic-bezier(.22,1,.36,1)
  const SCRUB = .14;                                      // atraso tipo GSAP scrub:1
  const follow = (cur, target) => Math.abs(target - cur) < .0004 ? target : cur + (target - cur) * SCRUB;
  const setVar = (el, k, v) => { if (el._v?.[k] !== v) { (el._v ||= {})[k] = v; el.style.setProperty(k, v); } };

  // ===== Smooth scroll (Lenis lerp .1, como na ADA) =====
  const lenis = (!reduce && window.Lenis) ? new window.Lenis({ lerp: .1, smoothWheel: true, wheelMultiplier: 1 }) : null;
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a || a.getAttribute('href').length < 2) return;
    const t = document.querySelector(a.getAttribute('href')); if (!t) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(t, { offset: -70, duration: 1.4 }) : t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  // ===== Títulos: entrada por palavra com máscara =====
  function splitWords(el) {
    let d = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const m = document.createElement('span'); m.className = 'wm';
            const i = document.createElement('span'); i.className = 'wi'; i.style.setProperty('--d', d++); i.textContent = part;
            m.appendChild(i); frag.appendChild(m);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el); el.classList.add('split');
  }
  const heads = [...document.querySelectorAll('.h2, .foot__title')].filter(h => !h.closest('.hero, .voices'));
  heads.forEach(splitWords);
  const hio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); hio.unobserve(e.target); } }), { threshold: .3 });
  heads.forEach(h => hio.observe(h));

  const waLink = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
  const track = (section, extra = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'whatsapp_click', section, ...extra });
    if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-wa]');
    if (!a) return;
    const k = a.dataset.wa;
    let text = typeof MSG[k] === 'string' ? MSG[k] : MSG.geral;
    if (k === 'trat') text = MSG.trat(a.dataset.treatment || 'um tratamento');
    if (k === 'quiz') text = MSG.quiz(a.dataset.answers || '', a.dataset.result || '');
    a.href = waLink(text); a.target = '_blank'; a.rel = 'noopener';
    track(a.closest('section,header,footer,dialog')?.id || k, { treatment: a.dataset.treatment });
  });

  // ===== Navbar =====
  const nav = document.getElementById('nav');
  const burger = nav.querySelector('.nav__burger');
  const drawer = document.getElementById('menu');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open)); drawer.hidden = open;
  });
  drawer.addEventListener('click', e => { if (e.target.tagName === 'A') { burger.setAttribute('aria-expanded', 'false'); drawer.hidden = true; } });
  let lastY = scrollY;

  // ===== Hero =====
  const hero = document.querySelector('.hero');
  const stage = hero.querySelector('.hero__stage');
  const video = hero.querySelector('.hero__video');
  const title = hero.querySelector('.hero__title');
  const run = hero.querySelector('.hero__run-text');
  const pickVideo = () => {
    const m = isMobile();
    const src = m ? video.dataset.srcMobile : video.dataset.srcDesktop;
    if (video.dataset.current === src) return;
    video.src = src; video.dataset.current = src;
    if (!reduce) video.play().catch(() => {});
  };
  pickVideo();
  if (reduce) { video.removeAttribute('autoplay'); video.pause(); }

  const heroRaw = () => {
    const span = hero.offsetHeight - 2 * innerHeight, y = scrollY - hero.offsetTop;
    return { p: clamp(y / span), ov: clamp((y - span) / innerHeight) };
  };
  function heroFrame(p, ov) {
    if (reduce) p = 0;
    setVar(stage, '--ov', (ov * .45).toFixed(3));
    setVar(stage, '--bl', (ov * 4).toFixed(2) + 'px');
    const a = smooth(band(p, 0, .5));   // divisa abre em ~90vh de scroll (ref. ADA, pin longo)
    const split = 50 - 50 * a;
    setVar(stage, '--split', split.toFixed(3) + '%');
    setVar(stage, '--h1o', (1 - easeOut(band(p, .05, .3))).toFixed(3));
    setVar(stage, '--h1y', (easeOut(band(p, .05, .3)) * 24).toFixed(1) + 'px');
    // linha horizontal
    const r = band(p, .32, 1);   // linear: a frase corre na velocidade do scroll
    const w = run.scrollWidth, vw = innerWidth;
    const x = vw - r * (w);           // de 100vw até -(w - 100vw)
    setVar(stage, '--runx', Math.min(vw, x).toFixed(1) + 'px');
    setVar(stage, '--runo', band(p, .28, .36).toFixed(3));
    const tago = easeOut(band(p, .88, .97));
    setVar(stage, '--tago', tago.toFixed(3));
    hero.classList.toggle('is-end', tago > .5);
    // corte de cor no H1 no mobile (divisa horizontal)
    if (isMobile()) {
      const tr = title.getBoundingClientRect();
      const divY = innerHeight * split / 100;
      setVar(stage, '--cut', (clamp((divY - tr.top) / tr.height, 0, 1) * 100).toFixed(2) + '%');
    }
    return p;
  }

  // ===== Reveal (IntersectionObserver) =====
  document.querySelectorAll('.bento .tile').forEach((t, i) => { t.classList.add('rise'); t.style.setProperty('--i', i); });
  document.querySelectorAll('.facts, .dra__team-body, .local__body').forEach(el => el.classList.add('rise'));
  document.querySelectorAll('.faq details, .faq__cta').forEach((el, i) => { el.classList.add('rise'); el.style.setProperty('--i', i); });
  document.querySelectorAll('.convite__body > *').forEach((el, i) => { el.classList.add('rise', 'rise--seq'); el.style.setProperty('--i', i); });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.rise').forEach(el => io.observe(el));
  // clip-path zerado anula a interseção do próprio elemento: observa o pai
  const cio2 = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.querySelectorAll('.reveal-clip').forEach(c => c.classList.add('is-in')); cio2.unobserve(e.target); }
  }), { threshold: .2 });
  document.querySelectorAll('.reveal-clip').forEach(el => cio2.observe(el.parentElement));

  // ===== Contadores com spring (22/26/1) =====
  function spring(from, to, { k = 22, c = 26, m = 1 } = {}, onUpdate) {
    let x = from, v = 0, last = performance.now();
    const step = now => {
      const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
      const f = -k * (x - to), d = -c * v; v += ((f + d) / m) * dt; x += v * dt;
      if (Math.abs(x - to) < .005 && Math.abs(v) < .005) { onUpdate(to); return; }
      onUpdate(x); requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const counters = document.querySelectorAll('[data-count]');
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, to = +el.dataset.count, dec = +(el.dataset.decimals || 0);
    cio.unobserve(el);
    if (reduce) return;
    const fmt = v => dec ? v.toFixed(dec).replace('.', ',') : Math.round(v).toString();
    spring(0, to, { k: 22, c: 26, m: 1 }, v => { el.textContent = fmt(v); });
  }), { threshold: .6 });
  counters.forEach(el => cio.observe(el));

  // ===== Painel de tratamento: lateral (desktop) / bottom sheet (celular) =====
  const TREAT = {
    implantes: ['01', 'Implantes', 'Para repor um ou mais dentes com firmeza.', 'O implante repõe um ou mais dentes com uma raiz artificial fixada no osso. Na avaliação, a equipe analisa o seu caso e explica as etapas, o tempo e os cuidados.', []],
    protocolo: ['02', 'Prótese Protocolo', 'Para quem perdeu todos os dentes de uma arcada.', 'A prótese é fixada sobre implantes e devolve a mastigação e a segurança para sorrir. O plano é apresentado antes de começar, com cada etapa explicada.', ['protocolo-a', 'protocolo-3', 'protocolo-b']],
    facetas: ['03', 'Lentes e Facetas', 'Para ajustar cor, forma e alinhamento.', 'Lâminas finas que ajustam cor, forma e alinhamento dos dentes. O planejamento é feito junto com você antes de começar.', ['facetas-1', 'facetas-2', 'facetas-3', 'facetas-4']],
    ortodontia: ['04', 'Ortodontia', 'Para alinhar os dentes e a mordida.', 'Aparelhos para alinhar os dentes e corrigir a mordida, com acompanhamento em cada etapa.', ['ortodontia-1', 'ortodontia-2']],
    geral: ['05', 'Clínica Geral', 'Para prevenção, limpeza e restaurações.', 'Prevenção, limpeza, restaurações, clareamento e tratamento de canal. A base para manter a saúde da boca em dia.', ['geral-1', 'geral-2']]
  };
  const modal = document.getElementById('modal');
  const dIn = modal.querySelector('.drawer__in');
  let dTimer;
  function openDrawer(key) {
    const [n, t, forTxt, txt, cases] = TREAT[key];
    modal.querySelector('.drawer__n').textContent = n;
    modal.querySelector('.h3').textContent = t;
    modal.querySelector('.drawer__for').textContent = forTxt;
    modal.querySelector('.drawer__text').textContent = txt;
    modal.querySelector('[data-wa]').dataset.treatment = t;
    const box = modal.querySelector('.drawer__cases');
    box.hidden = !cases.length;
    modal.querySelector('.drawer__grid').innerHTML = cases.map(c => `<figure><picture><source srcset="assets/img/casos/${c}.webp" type="image/webp"><img src="assets/img/casos/${c}.jpg" alt="Caso de ${t} de paciente da Salud" loading="lazy"></picture></figure>`).join('');
    modal.querySelector('.drawer__body').scrollTop = 0;
    clearTimeout(dTimer); dIn.style.transform = '';
    modal.showModal();
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('is-open')));
  }
  function closeDrawer() {
    if (!modal.open) return;
    modal.classList.remove('is-open'); dIn.style.transform = '';
    clearTimeout(dTimer); dTimer = setTimeout(() => modal.close(), reduce ? 0 : 560);
  }
  document.querySelectorAll('[data-modal]').forEach(b => b.addEventListener('click', () => openDrawer(b.dataset.modal)));
  modal.querySelector('.drawer__x').addEventListener('click', closeDrawer);
  modal.addEventListener('click', e => { if (e.target === modal) closeDrawer(); });
  modal.addEventListener('cancel', e => { e.preventDefault(); closeDrawer(); });  // ESC com animação
  // bottom sheet: arrastar a alça para baixo fecha
  (() => {
    const grip = modal.querySelector('.drawer__grip'); let y0 = null, dy = 0;
    grip.addEventListener('pointerdown', e => { if (!isMobile()) return; y0 = e.clientY; dy = 0; grip.setPointerCapture(e.pointerId); dIn.style.transition = 'none'; });
    grip.addEventListener('pointermove', e => { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); dIn.style.transform = `translateY(${dy}px)`; });
    const end = () => { if (y0 === null) return; y0 = null; dIn.style.transition = ''; if (dy > 110) closeDrawer(); else dIn.style.transform = ''; };
    grip.addEventListener('pointerup', end); grip.addEventListener('pointercancel', end);
  })();

  // ===== Player =====
  const player = document.getElementById('player');
  const pv = player.querySelector('video');
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-video]');
    if (!b) return;
    pv.src = b.dataset.video; player.showModal(); pv.play().catch(() => {});
  });
  player.addEventListener('close', () => { pv.pause(); pv.removeAttribute('src'); pv.load(); });
  player.querySelector('.modal__x').addEventListener('click', () => player.close());
  player.addEventListener('click', e => { if (e.target === player) player.close(); });

  // ===== Quiz =====
  const QUIZ = [
    { q: 'O que mais te incomoda hoje?', o: [['Falta de um ou mais dentes', 'imp'], ['Uso dentadura ou ponte e quero algo fixo', 'pro'], ['Cor ou formato dos dentes', 'fac'], ['Dentes tortos', 'ort']] },
    { q: 'Há quanto tempo você convive com isso?', o: [['Menos de 1 ano', ''], ['De 1 a 5 anos', ''], ['Mais de 5 anos', '']] },
    { q: 'Você sente medo ou ansiedade no dentista?', o: [['Sim, bastante', 'med'], ['Um pouco', ''], ['Não', '']] },
    { q: 'Quando gostaria de começar?', o: [['O quanto antes', ''], ['Nos próximos meses', ''], ['Ainda estou pesquisando', '']] }
  ];
  const RESULT = {
    imp: ['Implantes', 'Para repor dentes com firmeza, o implante costuma ser o caminho mais indicado.'],
    pro: ['Prótese Protocolo', 'Para quem quer trocar a dentadura por algo fixo, a prótese protocolo sobre implantes é a opção mais avaliada.'],
    fac: ['Lentes e Facetas', 'Para ajustar cor e formato, lentes e facetas costumam resolver com planejamento.'],
    ort: ['Ortodontia', 'Para alinhar os dentes, o tratamento ortodôntico é o ponto de partida.']
  };
  const deck = document.querySelector('.deck');
  const ringFg = document.querySelector('.ring__fg');
  const ringI = document.querySelector('.ring__i');
  document.querySelector('.ring__t').textContent = QUIZ.length;
  const C = 2 * Math.PI * 46;
  let picks = [];   // [{text, tag}] na ordem respondida: permite voltar
  function setRing(i) { ringFg.style.strokeDashoffset = String(C * (1 - i / QUIZ.length)); ringI.textContent = Math.min(i + 1, QUIZ.length); }
  function buildQuiz() {
    deck.innerHTML = ''; picks = []; setRing(0);
    QUIZ.forEach((item, i) => {
      const c = document.createElement('div');
      c.className = 'qcard'; c.dataset.i = i;
      c.innerHTML = `<div class="qcard__top">${i ? '<button class="qcard__back" type="button">Voltar</button>' : ''}<span class="qcard__step">${i + 1} de ${QUIZ.length}</span></div><h3>${item.q}</h3><div class="qcard__opts">${item.o.map(([t, tag]) => `<button type="button" data-tag="${tag}">${t}</button>`).join('')}</div>`;
      deck.prepend(c);
    });
    restack();
  }
  function restack() {
    const live = [...deck.querySelectorAll('.qcard:not(.is-out)')].reverse();
    live.forEach((c, d) => { c.dataset.depth = d; c.style.zIndex = 10 - d; c.inert = d > 0; });
  }
  function goBack() {
    if (!picks.length) return;
    deck.querySelector('.qcard--result')?.remove();
    picks.pop();
    const outs = [...deck.querySelectorAll('.qcard.is-out')];
    const prev = outs.sort((a, b) => b.dataset.i - a.dataset.i)[0];
    if (prev) { prev.classList.remove('is-out'); prev.inert = false; }
    setRing(picks.length); restack();
    prev?.querySelector('.is-picked')?.focus({ preventScroll: true });
  }
  deck.addEventListener('click', e => {
    if (e.target.closest('.qcard__back')) { goBack(); return; }
    const b = e.target.closest('.qcard__opts button'); if (!b) return;
    const card = b.closest('.qcard');
    card.querySelectorAll('.is-picked').forEach(x => x.classList.remove('is-picked'));
    b.classList.add('is-picked');   // ao voltar, a resposta anterior aparece marcada
    picks.push({ text: b.textContent, tag: b.dataset.tag });
    card.classList.add('is-out');
    const next = picks.length;
    setRing(next);
    if (next === QUIZ.length) showResult(); else restack();
  });
  function showResult() {
    const tags = picks.map(p => p.tag).filter(Boolean);
    const main = tags.find(t => RESULT[t]) || 'imp';
    const [name, txt] = RESULT[main];
    const extra = tags.includes('med') ? ' Como você sente ansiedade, vale conversar também sobre a sedação inalatória.' : '';
    const c = document.createElement('div');
    c.className = 'qcard qcard--result'; c.dataset.depth = 0; c.style.zIndex = 20;
    c.innerHTML = `<div class="qcard__top"><button class="qcard__back" type="button">Voltar</button></div><p class="eyebrow" style="margin-bottom:.75rem">Seu resultado</p><h3 class="h3">${name}</h3><p>${txt}${extra}</p><p class="qcard__note">A indicação final é feita na avaliação presencial.</p><a class="btn" href="#" data-wa="quiz">Enviar resultado</a><button class="qcard__restart" type="button">Refazer o teste</button>`;
    const a = c.querySelector('[data-wa]'); a.dataset.answers = picks.map(p => p.text).join(' | '); a.dataset.result = name;
    c.querySelector('.qcard__restart').addEventListener('click', buildQuiz);
    deck.appendChild(c);
    ringI.textContent = QUIZ.length;
  }
  buildQuiz();
  // entrada: cards espalhados em tamanhos variados se recolhem na pilha (ref. Rebelliously scatter-to-deck)
  if (!reduce) {
    const SC = [[-46, -14, -9, .82], [34, 12, 7, .7], [-18, 22, -4, .9], [52, -20, 11, .76]];
    [...deck.querySelectorAll('.qcard')].forEach(c => { const [x, y, r, k] = SC[c.dataset.i % 4]; c.style.setProperty('--sx', x + '%'); c.style.setProperty('--sy', y + '%'); c.style.setProperty('--sr', r + 'deg'); c.style.setProperty('--ss', k); c.style.setProperty('--sd', (c.dataset.i * 90) + 'ms'); });
    deck.classList.add('is-scattered');
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { setTimeout(() => deck.classList.remove('is-scattered'), 250); o.disconnect(); } }, { threshold: .45 }).observe(deck);
  }

  // ===== Assinatura: cards → fileira → círculo → portal =====
  const FACES = ['01-jose-paulo', '02-canal', '03-qualidade2', '04-qualidade', '05-eliana', '06-rejane', '07-marlene', '08-cristina', '09-delizete', '10-sedacao', '11-araci', '12-luana', '13-simone'];
  const voices = document.querySelector('.voices');
  const vStage = voices.querySelector('.voices__stage');
  const cardsBox = voices.querySelector('.voices__cards');
  const N = FACES.length;
  const MODE = N >= 8 ? 'full' : N >= 4 ? 'short' : 'single';
  const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
  const faces = FACES.map((f, i) => {
    const el = document.createElement('div');
    el.className = 'face';
    const src = i === 0 ? f + '-lg' : f; // card do portal em alta, para não pixelar ao crescer
    el.innerHTML = `<picture><source srcset="assets/img/faces/${src}.webp" type="image/webp"><img src="assets/img/faces/${src}.jpg" alt="" loading="lazy" width="240" height="320"></picture>`;
    cardsBox.appendChild(el);
    const side = i % 4;
    return {
      el, x: 0, y: 0, r: 0, s: .7, vx: 0, vy: 0, vr: 0, vs: 0,
      sx: (rnd() * 2 - 1) * 800, sy: (rnd() * 2 - 1) * 450, sr: (rnd() * 2 - 1) * 90,
      ox: side === 0 ? -1600 : side === 1 ? 1600 : 0, oy: side === 2 ? -1100 : side === 3 ? 1100 : 0,
      k: i === 0 ? 220 : 55, c: i === 0 ? 30 : 18
    };
  });
  if (reduce || MODE === 'single') voices.classList.add('is-static');

  let vP = 0;
  const portalW = () => isMobile() ? Math.min(innerWidth * .7, 300, innerHeight * .33) : Math.min(innerWidth * .3, 400, innerHeight * .45);  // celular baixo: portal menor para caber legenda e CTA
  const cardW = () => faces[1].el.offsetWidth || 88;
  const portalScale = () => portalW() / cardW();
  // o card do portal é desenhado já no tamanho final e reduzido por escala: cresce nítido, sem borrão de upscale
  function sizePortalCard() { const w = portalW(), el = faces[0].el; el.style.width = w + 'px'; el.style.height = (w * 4 / 3) + 'px'; el.style.margin = `${-w * 2 / 3}px 0 0 ${-w / 2}px`; }
  sizePortalCard(); addEventListener('resize', sizePortalCard);
  function targets(p) {
    const mob = isMobile();
    const sc = mob ? .45 : 1;
    const W = innerWidth, H = innerHeight;
    const radius = Math.min(Math.min(W, H) * .4, 360 * (mob ? .7 : 1));
    const gap = Math.min(96 * (mob ? .7 : 1), (W - 40) / N);
    const enter = 1 - band(p, 0, .10);
    return faces.map((f, i) => {
      let t;
      if (p < .08 || (MODE === 'short' && p < .08)) {
        t = { x: f.sx * sc + f.ox * enter, y: f.sy * sc + f.oy * enter, r: f.sr, s: .7 };
      } else if (p < .22 || MODE === 'short') {
        t = { x: (i - (N - 1) / 2) * gap, y: 140 * (mob ? .6 : 1), r: 0, s: .9 };
      } else {
        const ang = (i / N) * 360 - 90, rad = ang * Math.PI / 180;
        t = { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius + (mob ? 60 : 30), r: ang + 90, s: 1 };
      }
      // portal: card 0 cresce e desce até o centro
      if (i === 0) {
        const g = band(p, .38, .48);
        if (g > 0) { t.x = t.x * (1 - g); t.y = t.y * (1 - g); t.r = t.r * (1 - g); t.s = t.s + g * (portalScale() - t.s); }
      }
      return t;
    });
  }
  let springsActive = false, lastT = 0;
  function voicesFrame(now) {
    const dt = Math.min((now - lastT) / 1000 || 0.016, 1 / 30); lastT = now;
    const T = targets(vP);
    let moving = false;
    faces.forEach((f, i) => {
      const t = T[i];
      for (const [kx, kv, tv] of [['x', 'vx', t.x], ['y', 'vy', t.y], ['r', 'vr', t.r], ['s', 'vs', t.s]]) {
        const force = -f.k * (f[kx] - tv), damp = -f.c * f[kv];
        f[kv] += (force + damp) * dt; f[kx] += f[kv] * dt;
        if (Math.abs(f[kx] - tv) > .05 || Math.abs(f[kv]) > .05) moving = true;
      }
      // celular: os outros rostos saem antes do portal crescer (tela estreita, ref. Rebelliously mobile)
      const fade = i === 0 ? 1 - band(vP, .60, .62) : 1 - (isMobile() ? band(vP, .31, .37) : band(vP, .50, .56));
      const k = i === 0 ? cardW() / portalW() : 1;
      f.el.style.transform = `translate(${f.x}px, ${f.y}px) rotate(${f.r}deg) scale(${f.s * k})`;
      f.el.style.opacity = fade;
      if (i === 0) {
        const arc = band(vP, .52, .58);
        const r0 = Math.min(80, 12 / Math.max(f.s * k, .15));  // raio visual constante de 12px em qualquer escala
        f.el.style.borderRadius = `${r0 + arc * 9987}px ${r0 + arc * 9987}px ${r0}px ${r0}px`;
      }
    });
    if (moving) requestAnimationFrame(voicesFrame); else springsActive = false;
  }
  function voicesScroll(p) {
    if (voices.classList.contains('is-static')) return;
    vP = clamp(p * .93);  // coreografia termina em ~75% da seção; o resto é o carrossel no portal
    vStage.style.setProperty('--to', String(1 - (isMobile() ? band(vP, .30, .36) : band(vP, .33, .40))));  // título visível desde a entrada, centralizado (ref. Rebelliously)
    vStage.style.setProperty('--ts', String(.92 + .08 * band(vP, 0, .10)));
    vStage.style.setProperty('--dark', (smooth(band(vP, .50, .58)) * 150) + '%');
    vStage.style.setProperty('--wo', String(band(vP, .62, .70)));
    vStage.style.setProperty('--pw', portalW() + 'px');
    const po = band(vP, .57, .60);
    vStage.style.setProperty('--po', String(po));
    voices.classList.toggle('is-portal', po > .5);
    if (!springsActive) { springsActive = true; lastT = performance.now(); requestAnimationFrame(voicesFrame); }
  }
  // ===== Portal vira carrossel de depoimentos (ref. Rebelliously "Voices") =====
  const VOICES = [
    ['José Paulo', 'Prótese protocolo', 'depo-jose-paulo', 'faces/01-jose-paulo-lg'],
    ['Araci', 'Atendimento', 'depo-araci', 'portal/p-araci'],
    ['Eliana', 'Facetas', 'depo-eliana', 'portal/p-eliana'],
    ['Marlene', 'Facetas', 'depo-marlene', 'portal/p-marlene'],
    ['Luana', 'Atendimento', 'depo-luana', 'portal/p-luana'],
    ['Simone', 'Atendimento', 'depo-simone', 'portal/p-simone'],
    ['Paciente', 'Canal e especialidades', 'depo-canal', 'portal/p-canal']
  ];
  const vPlay = voices.querySelector('.voices__play'); let vPic = vPlay.querySelector('picture');
  const vCap = voices.querySelector('.voices__caption'), vI = voices.querySelector('.voices__i');
  voices.querySelector('.voices__n').textContent = VOICES.length;
  let vIdx = 0, vBusy = false;
  VOICES.slice(1).forEach(v => { const im = new Image(); im.src = `assets/img/${v[3]}.jpg`; }); // pré-carrega
  function showVoice(i) {
    if (vBusy) return; vBusy = true;
    vIdx = (i + VOICES.length) % VOICES.length;
    const [name, what, vid, img] = VOICES[vIdx];
    // crossfade: a foto nova entra por cima da atual já decodificada, sem nunca mostrar o que está atrás do portal
    const pic = document.createElement('picture'); pic.className = 'voices__next';
    pic.innerHTML = `<source srcset="assets/img/${img}.webp" type="image/webp"><img src="assets/img/${img}.jpg" alt="" width="600" height="800">`;
    const im = pic.querySelector('img');
    voices.classList.add('is-swap');
    (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => {
      vPlay.insertBefore(pic, vPic.nextSibling);
      requestAnimationFrame(() => requestAnimationFrame(() => pic.classList.add('is-in')));
      vPlay.dataset.video = `assets/video/depoimentos/${vid}.mp4`;
      vPlay.querySelector('.voices__sr').textContent = `Assistir depoimento de ${name}`;
      setTimeout(() => { vCap.innerHTML = `<strong>${name}</strong> · <span>${what}</span>`; vI.textContent = vIdx + 1; voices.classList.remove('is-swap'); }, reduce ? 0 : 220);
      setTimeout(() => { vPic.remove(); pic.classList.remove('voices__next', 'is-in'); vPic = pic; vBusy = false; }, reduce ? 0 : 520);
    });
  }
  voices.querySelectorAll('.voices__arrow').forEach(b => b.addEventListener('click', () => showVoice(vIdx + +b.dataset.dir)));
  voices.addEventListener('keydown', e => { if (!voices.classList.contains('is-portal')) return; if (e.key === 'ArrowRight') showVoice(vIdx + 1); if (e.key === 'ArrowLeft') showVoice(vIdx - 1); });

  if (!voices.classList.contains('is-static')) {
    // posição inicial: espalhados fora da tela
    faces.forEach(f => { f.x = f.sx + f.ox; f.y = f.sy + f.oy; f.r = f.sr; });
  }

  const rSec = document.querySelector('.reviews');

  // ===== Avaliações do Google: API (api/reviews.php) com fallback para as fixas do HTML =====
  // Fase 1: Places API (até 5, com foto) + as fixas. Fase 2: Business Profile API (todas). Ver README.
  (function googleReviews() {
    const cols = [...rSec.querySelectorAll('.gcol__track')];
    if (!cols.length || location.protocol === 'file:') return;
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const initials = n => n.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
    const G = rSec.querySelector('.gcard__g')?.outerHTML || '';
    // fixas: lidas do próprio HTML (só a primeira cópia de cada coluna)
    const fixed = cols.flatMap(c => [...c.querySelectorAll('.gcard:not([aria-hidden])')]).map(li => ({
      name: li.querySelector('cite').textContent, text: li.querySelector('p').textContent.replace(/^“|”$/g, ''), photo: ''
    }));
    const card = (r, k, hidden) => `<li class="gcard"${hidden ? ' aria-hidden="true"' : ''}><blockquote><p>“${esc(r.text)}”</p><footer>${
      r.photo ? `<img class="gcard__av gcard__av--img" src="${esc(r.photo)}" alt="" width="42" height="42" loading="lazy" referrerpolicy="no-referrer">`
              : `<span class="gcard__av gcard__av--${k % 4}" aria-hidden="true">${esc(initials(r.name))}</span>`
    }<span class="gcard__who"><cite>${esc(r.name)}</cite><span>Avaliação no Google${r.when ? ' · ' + esc(r.when) : ''}</span></span>${G}</footer></blockquote></li>`;
    const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 6000);
    fetch('api/reviews.php', { signal: ctrl.signal }).then(r => r.ok ? r.json() : null).then(d => {
      if (!d || !Array.isArray(d.reviews) || !d.reviews.length) return;
      const seen = new Set(d.reviews.map(r => r.name.toLowerCase()));
      const all = [...d.reviews.map(r => ({ ...r, text: r.text.length > 240 ? r.text.slice(0, 237).trim() + '…' : r.text })), ...fixed.filter(r => !seen.has(r.name.toLowerCase()))];
      const per = Math.ceil(all.length / cols.length);
      cols.forEach((c, ci) => {
        const part = all.slice(ci * per, ci * per + per); if (!part.length) return;
        const html = part.map((r, i) => card(r, ci * per + i, false)).join('');
        c.innerHTML = html + part.map((r, i) => card(r, ci * per + i, true)).join('');
      });
      if (d.rating) { const sc = rSec.querySelector('.reviews__score span'); if (sc) sc.textContent = Number(d.rating).toFixed(1).replace('.', ','); }
      if (d.total) { const ct = rSec.querySelector('.reviews__count'); if (ct) ct.textContent = `Nota no Google, com ${d.total} avaliações.`; }
    }).catch(() => {});
  })();

  // ===== Mapa: carrega sozinho quando a seção está a ~1 tela de distância =====
  const mapBox = document.getElementById('map');
  const loadMap = () => {
    if (mapBox.dataset.loaded) return; mapBox.dataset.loaded = '1';
    mapBox.innerHTML = '<iframe title="Mapa da Salud Odontologia" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=R.+Dr.+Ernesto+Bras%C3%ADlio,+74,+Nova+Friburgo,+RJ&output=embed"></iframe>';
  };
  const mio = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { loadMap(); mio.disconnect(); } }, { rootMargin: '100% 0px' });
  mio.observe(mapBox);
  mapBox.querySelector('.map__load')?.addEventListener('click', loadMap); // reserva, caso o observer não dispare

  // ===== Convite: rostos entram em cascata; rodapé: nome gigante desliza =====
  const convite = document.querySelector('.convite');
  const footEl = document.querySelector('.foot'), footGiant = document.querySelector('.foot__giant');
  convite.querySelectorAll('.convite__grid picture').forEach((pic, i) => pic.style.setProperty('--i', (i * 7) % 12));
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { convite.classList.add('is-in'); o.disconnect(); } }), { threshold: .2 }).observe(convite);
  const S2 = { cv: 0, fx: 0 };
  // Dra.: frase acende por palavra, foto com leve recuo, foto da equipe cresce de card a largura total
  const dQuote = document.querySelector('.dra__quote p');
  dQuote.innerHTML = dQuote.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  const dWords = [...dQuote.children];
  const dPhoto = document.querySelector('.dra__photo'), dTeams = [...document.querySelectorAll('.dra__team-photo')];
  const rvSec = document.querySelector('.reviews'), mapEl = document.getElementById('map');
  const enter = (el, k = .85) => { const r = el.getBoundingClientRect(); return clamp((innerHeight - r.top) / (innerHeight * k)); };
  const S3 = { dp: 0, dt: [0, 0], rc: 0, ma: 0 };
  if (reduce) dWords.forEach(w => w.classList.add('on'));
  function midFrame() {
    if (reduce) return;
    const line = innerHeight * .72;
    for (const w of dWords) { const on = w.getBoundingClientRect().top < line; if (w._on !== on) { w._on = on; w.classList.toggle('on', on); } }
    S3.dp = follow(S3.dp, enter(dPhoto, 1.6)); setVar(dPhoto, '--dp', S3.dp.toFixed(3));
    dTeams.forEach((el, i) => { const raw = clamp(enter(el, 1) * 1.15 - i * .15); S3.dt[i] = follow(S3.dt[i], smooth(raw)); setVar(el, '--dt', S3.dt[i].toFixed(3)); });  // a segunda abre logo depois da primeira
    S3.rc = follow(S3.rc, smooth(enter(rvSec, 1.1))); setVar(rvSec, '--rc', (S3.rc * 150).toFixed(2) + '%');
    S3.ma = follow(S3.ma, smooth(enter(mapEl, .9))); setVar(mapEl, '--ma', S3.ma.toFixed(3));
  }
  function closingFrame() {
    midFrame();
    if (reduce) return;
    const cr = convite.getBoundingClientRect();
    S2.cv = follow(S2.cv, clamp(1 - cr.bottom / (innerHeight + cr.height)));
    setVar(convite, '--cv', S2.cv.toFixed(3));
    // rodapé fica parado embaixo e é revelado quando o convite sobe (ref. Rebelliously); o nome assenta no fim
    const reveal = clamp((innerHeight - cr.bottom) / footEl.offsetHeight);
    S2.fx = follow(S2.fx, (1 - reveal) * 12);
    setVar(footGiant, '--fx', S2.fx.toFixed(2));
  }

  // ===== Botão flutuante =====
  const fab = document.querySelector('.fab');

  // ===== Sem medo (ADA: foto fixa + texto que preenche) =====
  const fear = document.querySelector('.fear');
  const fStage = fear.querySelector('.fear__stage');
  const giant = fear.querySelector('.fear__giant');
  giant.innerHTML = giant.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  const gWords = [...giant.children];
  // marcação de caneta sob "se sentir seguro" (desenha antes da troca de passo)
  const tail = gWords.slice(-3);
  const mark = document.createElement('span'); mark.className = 'fear__mark';
  tail[0].before(mark); tail.forEach((w, i) => { mark.append(w); if (i < tail.length - 1) mark.append(' '); });
  mark.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 300 28" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M4 15 C 70 7, 170 5, 296 11"/><path pathLength="1" d="M26 22 C 110 16, 200 15, 280 19"/></svg>');
  const drawMark = on => { if (mark._on !== on) { mark._on = on; mark.classList.toggle('is-drawn', on); } };  // traço por tempo, com easing longo (mais suave que preso ao scroll)
  const fearRaw = () => progress(fear);
  function fearFrame(p) {
    const pinned = !isMobile() && !reduce;
    if (pinned) {
      // o texto sempre entra de baixo e sobe com o scroll, em qualquer altura de tela: as palavras cruzam a linha de leitura e acendem
      const start = innerHeight * .42, travel = start + Math.max(0, giant.offsetHeight - innerHeight * .5);
      setVar(fStage, '--gy', (start - band(p, 0, .5) * travel).toFixed(1) + 'px');
      if (p > .44) drawMark(true); else if (p < .4) drawMark(false);
      setVar(fStage, '--go', (1 - band(p, .56, .64)).toFixed(3));
      const eo = easeOut(band(p, .6, .72));
      setVar(fStage, '--eo', eo.toFixed(3));
      setVar(fStage, '--ps', (1.08 - .08 * band(p, 0, 1)).toFixed(4));
      fear.classList.toggle('is-end', eo > .5);
    }
    // a palavra preenche antes de chegar à altura de leitura (72% da tela)
    const line = innerHeight * (pinned ? .72 : .8);
    for (const w of gWords) { const on = w.getBoundingClientRect().top < line; if (w._on !== on) { w._on = on; w.classList.toggle('on', on); } }
    if (!pinned) drawMark(!!tail[2]._on);  // celular: desenha quando a última palavra acende (transição CSS)
  }
  if (reduce) { gWords.forEach(w => w.classList.add('on')); drawMark(true); }
  // vídeo ilustrativo: carrega perto da tela, toca só quando visível
  const fVid = fear.querySelector('.fear__video');
  new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { if (!fVid.poster) fVid.poster = fVid.dataset.poster; if (!fVid.src) fVid.src = fVid.dataset.src; if (!reduce) fVid.play().catch(() => {}); }
    else fVid.pause();
  }), { rootMargin: '50% 0px' }).observe(fVid);

  // ===== Empilhamento: seção seguinte sobe por cima, a de baixo escurece e desfoca =====
  const stacks = [...document.querySelectorAll('.stack')];
  function stackFrame() {
    if (reduce) return;
    for (const el of stacks) {
      setVar(el, '--st', Math.min(0, innerHeight - el.offsetHeight) + 'px');
      const next = el.nextElementSibling; if (!next) continue;
      const t = clamp(1 - next.getBoundingClientRect().top / innerHeight);
      setVar(el, '--ov', (t * .45).toFixed(3));
      setVar(el, '--bl', (t * 4).toFixed(2) + 'px');
      // coberta por completo: some e deixa de receber clique
      const covered = t >= .999; if (el._cov !== covered) { el._cov = covered; el.classList.toggle('is-covered', covered); }
    }
  }

  // ===== Loop único (rAF) com scrub suavizado =====
  const S = { hp: 0, hov: 0, fp: 0, vp: 0 };
  const hint = document.querySelector('.hint'), sprog = document.querySelector('.sprog');
  let lastMove = performance.now(), prevY = scrollY;
  function frame(time) {
    if (lenis) lenis.raf(time);
    const h = heroRaw();
    // hero com atraso de ~1s, como o scrub:1 do GSAP na ADA
    S.hp = Math.abs(h.p - S.hp) < .0004 ? h.p : S.hp + (h.p - S.hp) * .065; S.hov = follow(S.hov, h.ov);
    S.fp = follow(S.fp, fearRaw());
    S.vp = follow(S.vp, progress(voices));
    heroFrame(S.hp, S.hov);
    fearFrame(S.fp);
    voicesScroll(S.vp);
    stackFrame();
    closingFrame();
    // indicadores: barra lateral nas seções presas + "Role" no hero e quando a pessoa para
    const now = performance.now(); if (Math.abs(scrollY - prevY) > .5) { lastMove = now; prevY = scrollY; }
    const fr = fear.getBoundingClientRect(), vr2 = voices.getBoundingClientRect();
    let sp = -1;
    if (h.p > 0 && h.p < 1) sp = h.p;
    else if (!isMobile() && fr.top <= 1 && fr.bottom >= innerHeight - 1) sp = S.fp;
    else if (vr2.top <= 1 && vr2.bottom >= innerHeight - 1) sp = S.vp;
    sprog.classList.toggle('is-on', sp >= 0 && !reduce);
    if (sp >= 0) setVar(sprog, '--sp', sp.toFixed(3));
    const idle = now - lastMove > 2000;
    hint.classList.toggle('is-hero', h.p < .05);
    hint.classList.toggle('is-on', !reduce && (scrollY < 10 || (sp >= 0 && sp < .95 && idle && !voices.classList.contains('is-portal'))));
    const y = scrollY;
    const solid = h.p >= .55 || h.ov > 0 || y > hero.offsetTop + hero.offsetHeight;
    nav.classList.toggle('is-solid', solid);
    nav.classList.toggle('is-over-film', !solid && !isMobile());
    if (y < 80) nav.classList.remove('is-hidden');
    else if (y - lastY > 4) nav.classList.add('is-hidden');
    else if (y - lastY < -4) nav.classList.remove('is-hidden');
    lastY = y;
    const vr = voices.getBoundingClientRect();
    const inVoices = vr.top < innerHeight * .5 && vr.bottom > innerHeight * .5;
    // o botão flutuante some enquanto outro CTA de agendar está na tela (hero, portal, convite, rodapé)
    const ctaOnScreen = el => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
    const heroCta = h.p < 1 || h.ov < .85;
    fab.classList.toggle('is-hidden', heroCta || inVoices || ctaOnScreen(convite) || ctaOnScreen(footEl));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  addEventListener('resize', () => { pickVideo(); });

  // modal/player param o smooth scroll enquanto abertos
  [document.getElementById('modal'), document.getElementById('player')].forEach(d => {
    new MutationObserver(() => { if (!lenis) return; d.open ? lenis.stop() : lenis.start(); }).observe(d, { attributes: true, attributeFilter: ['open'] });
  });
})();
