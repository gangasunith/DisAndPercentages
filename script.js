const QUESTIONS = [
  // LEVEL 1: Find Discount Amount
  {
    toy: 0, name: 'Ball', orig: 200, disc: 10, type: 'amount',
    q: 'Ball costs ₹200 with 10% off. What is the discount amount?',
    answer: 20, opts: [20, 10, 30, 25], hint: '₹200 × 10 ÷ 100 = ₹20'
  },
  {
    toy: 1, name: 'Doll', orig: 500, disc: 20, type: 'amount',
    q: 'Doll costs ₹500 with 20% off. What is the discount amount?',
    answer: 100, opts: [100, 50, 150, 80], hint: '₹500 × 20 ÷ 100 = ₹100'
  },

  // LEVEL 2: Find Final Price
  {
    toy: 2, name: 'Robot', orig: 400, disc: 25, type: 'final',
    q: 'Robot costs ₹400 with 25% off. What is the final price?',
    answer: 300, opts: [300, 350, 320, 280], hint: '₹400 − ₹100 = ₹300'
  },
  {
    toy: 3, name: 'Teddy', orig: 600, disc: 15, type: 'final',
    q: 'Teddy costs ₹600 with 15% off. What is the final price?',
    answer: 510, opts: [510, 540, 480, 525], hint: '₹600 − ₹90 = ₹510'
  },

  // LEVEL 3: Find Original Price
  {
    toy: 4, name: 'Car', orig: 800, disc: 30, type: 'original',
    q: 'Car costs ₹560 after 30% off. What was the original price?',
    answer: 800, opts: [800, 750, 850, 700], hint: '₹560 ÷ 0.70 = ₹800'
  },
  {
    toy: 5, name: 'Game', orig: 1000, disc: 35, type: 'original',
    q: 'Game costs ₹650 after 35% off. What was the original price?',
    answer: 1000, opts: [1000, 900, 1100, 950], hint: '₹650 ÷ 0.65 = ₹1000'
  },

  // LEVEL 4: Compare
  {
    toy: 6, name: 'Yoyo', orig: 300, disc: 20, type: 'compare',
    q: 'Yoyo A: ₹300 at 20% off. Yoyo B: ₹250 at 10% off. Which is cheaper?',
    answer: 225,
    opts: [225, 240, 250, 180],
    optLabels: ['Yoyo B ₹225', 'Yoyo A ₹240', 'Same', '₹180'],
    hint: 'A: ₹240 | B: ₹225 → Yoyo B cheaper'
  }
];

let qi = 0, score = 0, attempts = 0, questionDone = false, soundOn = true;
let audioCtx = null, lastTickPct = -1, nextQTimer = null;
let mrpLocked = false;
let lockedMRP = 0;
/* ===== AUDIO ENGINE ===== */
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTick(pct) {
  if (!soundOn) return;
  const rounded = Math.round(pct / 5) * 5;
  if (rounded === lastTickPct) return;
  lastTickPct = rounded;
  try {
    const ctx = getAudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 300 + (pct / 100) * 600;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.10, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.07);
  } catch (e) { }
}

/*cheer sound */
function playHurrah() {
  if (!soundOn) return;
  try {
    const ctx = getAudioCtx();
    // Rising arpeggio: C4 E4 G4 C5 E5
    const notes = [262, 330, 392, 523, 659];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t); osc.stop(t + 0.38);
    });
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator(), g2 = ctx.createGain();
        osc2.connect(g2); g2.connect(ctx.destination);
        osc2.type = 'sine'; osc2.frequency.value = 1200;
        g2.gain.setValueAtTime(0.18, ctx.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc2.start(ctx.currentTime); osc2.stop(ctx.currentTime + 0.42);
      } catch (e) { }
    }, 380);
  } catch (e) { }
}

function playWrong() {
  if (!soundOn) return;
  try {
    const ctx = getAudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.25);
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
  } catch (e) { }
}

function playSliderStart() {
  if (!soundOn) return;
  try {
    const ctx = getAudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 440; osc.type = 'sine';
    gain.gain.setValueAtTime(0.10, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.12);
  } catch (e) { }
}

/*CELEBRATION */
const CELEBRATIONS = ['🎉 Brilliant!', '⭐ Superstar!', '🏆 Amazing!', '🎊 Fantastic!', '👏 Well done!', '🌟 Excellent!'];

function showCelebration(customMsg, duration = 1800) {
  const div = document.createElement('div');
  div.className = 'celebration';
  const txt = document.createElement('div');
  txt.className = 'cele-text';
  txt.textContent = customMsg || CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
  div.appendChild(txt);
  document.body.appendChild(div);
  requestAnimationFrame(() => {
    txt.style.opacity = '1';
    txt.style.animation = 'celebPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards';
  });
  const colors = ['#ff6b35', '#fbbf24', '#06d6a0', '#3b82f6', '#a855f7', '#ec4899', '#22c55e'];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-piece';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.top = '-10px';
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.width = (6 + Math.random() * 10) + 'px';
    c.style.height = (6 + Math.random() * 10) + 'px';
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    c.style.animationDuration = (1.2 + Math.random() * 1.8) + 's';
    c.style.animationDelay = (Math.random() * 0.4) + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3000);
  }

  setTimeout(() => div.remove(), duration);
}

/*  TICK BUILDERS  */
function buildPctTicks() {
  const el = document.getElementById('pticks'); el.innerHTML = '';
  [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach(v => {
    const s = document.createElement('span'); s.className = 'tlbl'; s.textContent = v + '%'; el.appendChild(s);
  });
}

function buildPriceTicks(orig) {
  const el = document.getElementById('rpticks');
  el.innerHTML = '';

  const max = orig * 1.25; // ⭐ extend beyond MRP
  const step = orig <= 200 ? 25 : orig <= 500 ? 50 : orig <= 1000 ? 100 : 200;

  for (let v = 0; v <= max; v += step) {
    const s = document.createElement('span');
    s.className = 'tlbl';
    s.textContent = '₹' + v;
    el.appendChild(s);
  }
}

function buildDots() {
  const el = document.getElementById('dots'); el.innerHTML = '';
  QUESTIONS.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'dot' + (i < qi ? ' done' : i === qi ? ' active' : '');
    d.id = 'dot-' + i; el.appendChild(d);
  });
}

function updateAttemptDots() {
  for (let i = 0; i < 3; i++) document.getElementById('att-' + i).className = 'att-dot' + (i < attempts ? ' used' : '');
}

function lockAndReveal() {
  if (mrpLocked) return;
  const q = QUESTIONS[qi];
  mrpLocked = true;
  lockedMRP = q.orig;

  const pbox = document.querySelector('.ruler-box-pct');
  pbox.style.transition = 'width 0.4s ease';
  pbox.style.width = '80%';

  playHurrah();
  document.getElementById('pct-marker').style.display = 'none';
  document.getElementById('price-marker').style.display = 'none';

  // Highlight the lock
  const prt = document.getElementById('price-thumb');
  prt.style.filter = 'brightness(1.2) saturate(1.5)';
  setTimeout(() => prt.style.filter = '', 600);
}

function makeDraggable(trackId, isPrice) {
  const track = document.getElementById(trackId);
  let drag = false;
  function getPct(cx) { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (cx - r.left) / r.width)); }

  function move(cx) {
    if (mrpLocked && isPrice) return; // Price is locked, only % moves it

    const q = QUESTIONS[qi];
    const pct = getPct(cx) * 100;

    if (!mrpLocked) {
      if (isPrice) {
        document.getElementById('price-thumb').style.left = pct + '%';
        document.getElementById('price-fill').style.width = pct + '%';
        const val = Math.round((pct / 80) * q.orig);
        document.getElementById('price-thumb').dataset.val = '₹' + val;
      } else {
        document.getElementById('pct-thumb').style.left = pct + '%';
        document.getElementById('pct-fill').style.width = pct + '%';
        document.getElementById('pct-thumb').dataset.val = Math.round(pct) + '%';
      }

      // CHECK FOR LOCK
      const pL = parseFloat(document.getElementById('price-thumb').style.left);
      const pVal = Math.round((pL / 80) * q.orig);
      const pctVal = Math.round(parseFloat(document.getElementById('pct-thumb').style.left));

      if (Math.abs(pVal - q.gp) < Math.max(5, q.orig * 0.02) && Math.abs(pctVal - q.gpPct) < 3) {
        drag = false;
        lockAndReveal();
      }
    } else {
      // LOCKED MODE: % moves Price
      if (!isPrice) {
        document.getElementById('pct-thumb').style.left = pct + '%';
        document.getElementById('pct-fill').style.width = pct + '%';
        document.getElementById('pct-thumb').dataset.val = Math.round(pct) + '%';

        const pricePhysical = pct * 0.8;
        document.getElementById('price-thumb').style.left = pricePhysical + '%';
        document.getElementById('price-fill').style.width = pricePhysical + '%';
        const val = Math.round((pct / 100) * q.orig);
        document.getElementById('price-thumb').dataset.val = '₹' + val;

        playTick(pct);
      }
    }
  }

  const thumb = track.querySelector('.thumb');
  thumb.addEventListener('mousedown', e => { drag = true; lastTickPct = -1; playSliderStart(); e.preventDefault(); });
  document.addEventListener('mousemove', e => { if (drag) move(e.clientX); });
  document.addEventListener('mouseup', () => { drag = false; });

  thumb.addEventListener('touchstart', e => { drag = true; lastTickPct = -1; playSliderStart(); e.preventDefault(); }, { passive: false });
  document.addEventListener('touchmove', e => { if (drag) move(e.touches[0].clientX); }, { passive: true });
  document.addEventListener('touchend', () => { drag = false; });

  track.addEventListener('click', e => { if (e.target === thumb) return; move(e.clientX); });
}


/* ===== LOAD QUESTION ===== */
function loadQ() {
  mrpLocked = false;
  lockedMRP = 0;
  questionDone = false; attempts = 0; lastTickPct = -1;
  const q = QUESTIONS[qi];

  // Calculate Given Price (gp) and Given Percentage (gpPct) for locking
  if (q.type === 'original') {
    // e.g. Car costs 560 after 30% off. GP=560, GPPct=70.
    q.gp = Math.round(q.answer * (100 - q.disc) / 100);
    q.gpPct = 100 - q.disc;
  } else {
    // Normal cases: Lock at the Original Price (100%)
    q.gp = q.orig;
    q.gpPct = 100;
  }

  // Calculate the percentage that represents the correct answer
  if (q.type === 'amount') q.ansPct = q.disc;
  else if (q.type === 'pct') q.ansPct = q.answer;
  else if (q.type === 'original') q.ansPct = 100;
  else if (q.type === 'compare') q.ansPct = (q.answer / q.orig) * 100;
  else q.ansPct = 100 - q.disc; // For 'final' type

  document.getElementById('qlabel').innerHTML = '<b>' + q.q + '</b>';
  document.getElementById('fb').textContent = '';
  document.getElementById('fb').className = 'fb';
  document.getElementById('hint').style.display = 'none';
  document.getElementById('pct-marker').style.display = 'none';
  document.getElementById('price-marker').style.display = 'none';
  document.getElementById('qn').textContent = qi + 1;
  updateAttemptDots();

  QUESTIONS.forEach((_, i) => {
    document.getElementById('toy-' + i).className = 'toy-item' + (i === qi ? ' active' : '');
  });

  const ql = document.getElementById('qlabel');
  ql.classList.remove('pop'); void ql.offsetWidth; ql.classList.add('pop');

  buildPriceTicks(q.orig);
  buildDots();

  document.querySelector('.ruler-box-pct').style.width = '100%';

  // Reset sliders to 100% of the initial track
  document.getElementById('pct-fill').style.width = '100%';
  document.getElementById('pct-thumb').style.left = '100%';
  document.getElementById('pct-thumb').dataset.val = '100%';

  document.getElementById('price-fill').style.width = '100%';
  document.getElementById('price-thumb').style.left = '100%';
  document.getElementById('price-thumb').dataset.val = '₹' + Math.round(q.orig * 1.25);

  // Starting the price thumb at the far right (100% of track, which is 1.25x the original price)
  // allows kids to drag it leftward to find the "lock" point.

  const optsEl = document.getElementById('opts'); optsEl.innerHTML = '';
  const labels = q.optLabels || q.opts.map(o => '₹' + o);
  q.opts.forEach((o, idx) => {
    const b = document.createElement('button');
    b.className = 'opt'; b.textContent = labels[idx]; b.dataset.val = o;
    b.onclick = () => answer(o, b, q); optsEl.appendChild(b);
  });
}

function applyDiscountFromLockedMRP(pct) {
}

/* ===== ANSWER ===== */
function answer(chosen, btn, q) {
  if (questionDone) return;
  const fb = document.getElementById('fb');

  if (chosen === q.answer) {
    questionDone = true;
    btn.classList.add('correct');
    document.querySelectorAll('.opt').forEach(b => b.disabled = true);
    score++;
    document.getElementById('sc').textContent = score;
    fb.className = 'fb ok';
    document.getElementById('hint').style.display = 'none';
    document.getElementById('dot-' + qi).className = 'dot done';

    // Celebration and automatic transition
    playHurrah();
    showCelebration();

    if (nextQTimer) clearTimeout(nextQTimer);
    nextQTimer = setTimeout(() => {
      if (qi < QUESTIONS.length - 1) {
        nextQ();
      } else {
        setTimeout(finishGame, 600);
      }
      nextQTimer = null;
    }, 2500);
  } else {
    attempts++; updateAttemptDots();

    // Show visual hints for sliders
    const q = QUESTIONS[qi];
    const mPct = document.getElementById('pct-marker');
    const mPrice = document.getElementById('price-marker');

    if (!mrpLocked) {
      // Guide them to LOCK the price first
      mPct.style.left = q.gpPct + '%';
      mPrice.style.left = (q.gp / q.orig) * 80 + '%';
    } else {
      // Once locked, guide them to the FINAL ANSWER
      mPct.style.left = q.ansPct + '%';
      mPrice.style.left = (q.ansPct * 0.8) + '%';
    }
    mPct.style.display = 'block';
    mPrice.style.display = 'block';

    btn.classList.add('wrong'); playWrong();
    setTimeout(() => btn.classList.remove('wrong'), 600);
    if (attempts >= 3) {
      questionDone = true;
      document.querySelectorAll('.opt').forEach(b => {
        b.disabled = true;
        if (+b.dataset.val === q.answer) b.classList.add('correct');
      });
      fb.textContent = 'No more attempts!'; fb.className = 'fb no';
      const h = document.getElementById('hint');
      h.style.display = 'block'; h.textContent = '💡 ' + q.hint;
      applyPct(q.disc, true);
      document.getElementById('dot-' + qi).className = 'dot done';
      if (qi >= QUESTIONS.length - 1) {
        if (nextQTimer) clearTimeout(nextQTimer);
        nextQTimer = setTimeout(finishGame, 1500);
      }
    } else {
      fb.textContent = 'Wrong! ' + (3 - attempts) + ' attempt' + (3 - attempts > 1 ? 's' : '') + ' left.';
      fb.className = 'fb no';
    }
  }
}

function finishGame() {
  let title = '👍 GOOD JOB! 👍';
  if (score >= 6) title = '🏆 EXCELLENT! 🏆';
  else if (score <= 3) title = '💪 TRY AGAIN! 💪';

  const finalMsg = title + '\nFinal Score: ' + score + ' / 7';
  showCelebration(finalMsg, 4000);

  // Automatically restart after the score reveal
  setTimeout(resetGame, 4200);
}

function nextQ() {
  if (nextQTimer) { clearTimeout(nextQTimer); nextQTimer = null; }
  if (qi < QUESTIONS.length - 1) {
    const content = document.querySelector('.scene-content');
    content.classList.add('changing');
    setTimeout(() => {
      qi++; loadQ();
      setTimeout(() => content.classList.remove('changing'), 50);
    }, 350);
  } else {
    // On the last question, "Next" finishes the game
    finishGame();
  }
}

function resetGame() {
  qi = 0; score = 0; attempts = 0; questionDone = false;
  document.getElementById('sc').textContent = '0';
  QUESTIONS.forEach((_, i) => document.getElementById('dot-' + i).className = 'dot');
  loadQ();
}

function goBack() { window.history.back(); }

function toggleSound() {
  soundOn = !soundOn;
  const btn = document.getElementById('soundBtn');
  if (btn) btn.innerHTML = `<i style='font-size:22px' class='fa'>${soundOn ? '&#xf028;' : '&#xf026;'}</i>`;
}

const fsBtn = document.getElementById('fsBtn');
function toggleFullscreen() {
  const elem = document.querySelector('.scene');
  if (!document.fullscreenElement) elem.requestFullscreen();
  else document.exitFullscreen();
}
document.addEventListener('fullscreenchange', () => {
  fsBtn.innerHTML = document.fullscreenElement
    ? '<i class="material-icons" style="font-size:28px">fullscreen_exit</i>'
    : '<i class="material-icons" style="font-size:32px">fullscreen</i>';
});

// Init
buildPctTicks();
makeDraggable('pct-track', false);
makeDraggable('price-track', true);
loadQ();
