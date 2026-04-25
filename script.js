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
let currentRefValue = 0; // Global reference for calibration
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
function buildDots() {
  const el = document.getElementById('dots'); el.innerHTML = '';
  QUESTIONS.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'dot' + (i < qi ? ' done' : i === qi ? ' active' : '');
    d.id = 'dot-' + i; el.appendChild(d);
  });
}

function updateAttemptDots() {
  for (let i = 0; i < 3; i++) {
    const dot = document.getElementById('att-' + i);
    if (dot) dot.style.background = i < attempts ? '#ef4444' : '#e5e7eb';
  }
}

function renderMRPTicks(anchorPct, refValue) {
  const q = QUESTIONS[qi];
  const useValue = refValue || q.orig;
  const container = document.getElementById('mrp-ticks');
  container.innerHTML = '';
  if (anchorPct < 5) return;

  const scale = anchorPct / useValue;
  let targetMajorTicks = 6;
  if (anchorPct < 30) targetMajorTicks = 2;
  else if (anchorPct < 55) targetMajorTicks = 4;

  const rawStep = useValue / targetMajorTicks;
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500];
  let majorStep = steps.find(s => s >= rawStep) || steps[steps.length - 1];
  
  let subStep = majorStep / 5;
  if (subStep < 1) subStep = 1;

  for (let val = 0; val <= useValue * 1.5; val += subStep) {
    const pos = val * scale;
    if (pos > 100) break;
    const tick = document.createElement('div');
    const isMajor = (Math.abs(val % majorStep) < 0.1);
    tick.className = 'ruler-tick' + (isMajor ? ' major' : '');
    tick.style.left = pos + '%';
    
    tick.innerHTML = '<div class="tick-line"></div>';
    if (isMajor) {
      const lbl = document.createElement('div');
      lbl.className = 'tick-label';
      lbl.textContent = Math.round(val);
      tick.appendChild(lbl);
    }
    container.appendChild(tick);
  }
}

function renderPctTicks() {
  const container = document.getElementById('pct-ticks');
  container.innerHTML = '';
  // Show ticks every 5% (0, 5, 10, 15...)
  for (let val = 0; val <= 100; val += 5) {
    const tick = document.createElement('div');
    const isMajor = (val % 10 === 0);
    tick.className = 'ruler-tick' + (isMajor ? ' major' : '');
    tick.style.left = val + '%';
    tick.innerHTML = '<div class="tick-line"></div>';
    container.appendChild(tick);
  }
}

function updatePctLabels(pct) {
  const labels = document.querySelectorAll('#pct-labels span');
  labels.forEach((span, i) => {
    const val = i * 10;
    span.style.display = 'block';
    if (pct < 30) {
      if (val !== 0 && val !== 100) span.style.display = 'none';
    } else if (pct < 60) {
      if (val % 20 !== 0) span.style.display = 'none';
    }
  });
}

function makeDraggable() {
  const track = document.getElementById('pct-track');
  const thumb = document.getElementById('master-marker');
  const container = document.getElementById('ruler-container');
  let drag = false;

  function getPct(cx) {
    const r = container.querySelector('.ruler-track-cell').getBoundingClientRect();
    return Math.max(0.1, Math.min(1, (cx - r.left) / r.width));
  }

  let lastValueUnderMarker = 0;

  function move(cx) {
    const q = QUESTIONS[qi];
    if (currentRefValue === 0) currentRefValue = q.orig;

    const pct = getPct(cx) * 100;
    track.style.width = pct + '%';
    
    // Calculate what value is currently under the 100% marker
    const containerRect = container.querySelector('.ruler-track-cell').getBoundingClientRect();
    const markerX = cx - containerRect.left;
    const markerRatio = markerX / containerRect.width;
    
    // Use the currentRefValue to determine what value is at this position
    // (We know that currentRefValue is at 80% width)
    const scale = 80 / currentRefValue;
    lastValueUnderMarker = (markerRatio * 100) / scale;

    renderPctTicks();
    updatePctLabels(pct);
    playTick(pct);
    document.querySelectorAll('.ruler-row').forEach(r => r.classList.remove('wrong', 'correct'));
    // Hide the answer pointer while dragging
    const ptr = document.getElementById('answer-pointer');
    if (ptr) ptr.style.display = 'none';
  }

  function stopDrag() {
    if (!drag) return;
    drag = false;
    
    if (lastValueUnderMarker > 5) {
      currentRefValue = lastValueUnderMarker; // Update reference for next drag
      renderMRPTicks(80, currentRefValue);
      
      track.style.transition = 'width 0.3s ease';
      track.style.width = '80%';
      updatePctLabels(80);
      setTimeout(() => track.style.transition = '', 300);
    }
  }

  thumb.addEventListener('mousedown', e => { drag = true; playSliderStart(); e.preventDefault(); });
  document.addEventListener('mousemove', e => { if (drag) move(e.clientX); });
  document.addEventListener('mouseup', stopDrag);
  thumb.addEventListener('touchstart', e => { drag = true; playSliderStart(); e.preventDefault(); }, { passive: false });
  document.addEventListener('touchmove', e => { if (drag) move(e.touches[0].clientX); }, { passive: true });
  document.addEventListener('touchend', stopDrag);
}

/* ===== LOAD QUESTION ===== */
function loadQ() {
  questionDone = false; attempts = 0; lastTickPct = -1;
  const q = QUESTIONS[qi];

  document.getElementById('qlabel').innerHTML = '<b>' + q.q + '</b>';
  const fb = document.getElementById('fb');
  fb.textContent = '';
  fb.className = 'fb';
  document.getElementById('hint').style.display = 'none';
  document.getElementById('qn').textContent = qi + 1;
  updateAttemptDots();

  QUESTIONS.forEach((_, i) => {
    document.getElementById('toy-' + i).className = 'toy-item' + (i === qi ? ' active' : '');
  });

  const ql = document.getElementById('qlabel');
  ql.classList.remove('pop'); void ql.offsetWidth; ql.classList.add('pop');

  buildDots();

  // Reset rulers
  const track = document.getElementById('pct-track');
  track.style.width = '80%';
  
  // Safely detach answer pointer before mrp-ticks gets cleared
  const pointer = document.getElementById('answer-pointer');
  if (pointer) {
    // Move back to a safe location (body temporarily)
    pointer.style.display = 'none';
    pointer.className = 'answer-pointer';
    document.body.appendChild(pointer);
  }

  // Important: Reset the reference value for the new question
  currentRefValue = q.orig;
  renderMRPTicks(80); 

  // Re-attach pointer to price ruler track cell (outside mrp-ticks)
  if (pointer) {
    const cell = document.querySelector('#ruler-row-price .ruler-track-cell');
    if (cell) cell.appendChild(pointer);
  }
  
  renderPctTicks();
  updatePctLabels(80);

  // Clear ruler feedback
  document.querySelectorAll('.ruler-row').forEach(r => r.classList.remove('wrong', 'correct'));

  const optsEl = document.getElementById('opts'); optsEl.innerHTML = '';
  const labels = q.optLabels || q.opts.map(o => '₹' + o);
  q.opts.forEach((o, idx) => {
    const b = document.createElement('button');
    b.className = 'opt'; b.textContent = labels[idx]; b.dataset.val = o;
    b.onclick = () => answer(o, b, q); optsEl.appendChild(b);
  });
}


/* ===== ANSWER ===== */
function showAnswerPointer(q, isCorrect) {
  // Reset price ruler to original scale
  currentRefValue = q.orig;
  renderMRPTicks(80, q.orig);

  const targetPrice = q.answer;
  // pctPos within the tick area (0..orig mapped to 0..80% of tick container)
  const pctPos = (targetPrice / q.orig) * 80; // 0-100% within tick container
  if (pctPos < 0 || pctPos > 100) return;

  const pointer = document.getElementById('answer-pointer');
  const label   = document.getElementById('answer-pointer-label');
  const ticksEl = document.getElementById('mrp-ticks');
  const cell    = document.querySelector('#ruler-row-price .ruler-track-cell');

  // Make sure pointer is in the cell (not inside mrp-ticks which gets cleared)
  if (pointer.parentElement !== cell) cell.appendChild(pointer);

  // Compute pixel offset: left of mrp-ticks relative to cell + pctPos% of ticks width
  const ticksRect = ticksEl.getBoundingClientRect();
  const cellRect  = cell.getBoundingClientRect();
  const leftPx = (ticksRect.left - cellRect.left) + (pctPos / 100) * ticksRect.width;

  pointer.style.left    = leftPx + 'px';
  pointer.style.display = 'flex';
  pointer.className     = 'answer-pointer' + (isCorrect ? ' correct' : '');
  label.textContent     = '₹' + targetPrice;

  // Re-trigger pop animation
  pointer.style.animation = 'none';
  pointer.offsetHeight;
  pointer.style.animation = '';
}

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

    // RULER FEEDBACK: GREEN pointer at correct price
    document.getElementById('ruler-row-pct').classList.add('correct');
    document.getElementById('ruler-row-price').classList.add('correct');
    showAnswerPointer(q, true);

    playHurrah();
    showCelebration();

    if (nextQTimer) clearTimeout(nextQTimer);
    nextQTimer = setTimeout(() => {
      if (qi < QUESTIONS.length - 1) nextQ();
      else setTimeout(finishGame, 600);
      nextQTimer = null;
    }, 2500);
  } else {
    attempts++; updateAttemptDots();

    // RULER FEEDBACK: RED pointer at correct price
    document.getElementById('ruler-row-pct').classList.add('wrong');
    document.getElementById('ruler-row-price').classList.add('wrong');
    showAnswerPointer(q, false);

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
    finishGame();
  }
}

function resetGame() {
  qi = 0; score = 0; attempts = 0; questionDone = false;
  document.getElementById('sc').textContent = '0';
  buildDots();
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

// Init helpers
function buildDots() {
  const dotsEl = document.getElementById('dots');
  if (!dotsEl) return;
  dotsEl.innerHTML = '';
  QUESTIONS.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'dot';
    d.id = 'dot-' + i;
    dotsEl.appendChild(d);
  });
}

function updateAttemptDots() {
  for (let i = 0; i < 3; i++) {
    const dot = document.getElementById('att-' + i);
    if (dot) dot.style.background = i < attempts ? '#ef4444' : '#e5e7eb';
  }
}

// Global Init
makeDraggable();
loadQ();
