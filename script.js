const QUESTIONS = [
  { toy: 0, name: 'Ball',  orig: 200, disc: 25 },
  { toy: 1, name: 'Doll',  orig: 350, disc: 20 },
  { toy: 2, name: 'Robot', orig: 500, disc: 30 },
  { toy: 3, name: 'Teddy', orig: 150, disc: 10 },
  { toy: 4, name: 'Car',   orig: 400, disc: 15 },
];

let qi = 0, score = 0, attempts = 0, questionDone = false;
let soundOn = true;

/* ===== AUDIO ENGINE ===== */
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// Tick sound while dragging — short click at pitch mapped to position
let lastTickPct = -1;
function playTick(pct) {
  if (!soundOn) return;
  const rounded = Math.round(pct / 5) * 5;
  if (rounded === lastTickPct) return;
  lastTickPct = rounded;

  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Pitch rises from 300Hz at 0% to 900Hz at 100%
    const freq = 300 + (pct / 100) * 600;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.07);
  } catch(e) {}
}

// Correct answer jingle
function playCorrect() {
  if (!soundOn) return;
  try {
    const ctx = getAudioCtx();
    const notes = [523, 659, 784, 1047]; // C E G C
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'triangle';
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  } catch(e) {}
}

// Wrong answer buzz
function playWrong() {
  if (!soundOn) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.25);
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch(e) {}
}

// Slider start pop
function playSliderStart() {
  if (!soundOn) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 440;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch(e) {}
}

/* ===== TICK BUILDERS ===== */
function buildPctTicks() {
  const el = document.getElementById('pticks');
  el.innerHTML = '';
  [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach(v => {
    const s = document.createElement('span');
    s.className = 'tlbl';
    s.textContent = v + '%';
    el.appendChild(s);
  });
}

function buildPriceTicks(orig) {
  const el = document.getElementById('rpticks');
  el.innerHTML = '';
  const step = orig <= 200 ? 25 : orig <= 500 ? 50 : 100;
  for (let v = 0; v <= orig; v += step) {
    const s = document.createElement('span');
    s.className = 'tlbl';
    s.textContent = '₹' + v;
    el.appendChild(s);
  }
}

function buildDots() {
  const el = document.getElementById('dots');
  el.innerHTML = '';
  QUESTIONS.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'dot' + (i < qi ? ' done' : i === qi ? ' active' : '');
    d.id = 'dot-' + i;
    el.appendChild(d);
  });
}

function updateAttemptDots() {
  for (let i = 0; i < 3; i++) {
    document.getElementById('att-' + i).className = 'att-dot' + (i < attempts ? ' used' : '');
  }
}

/* ===== SLIDER LOGIC ===== */
function applyPct(pct, animated) {
  const orig = QUESTIONS[qi].orig;
  pct = Math.round(pct / 5) * 5;
  pct = Math.max(0, Math.min(100, pct));

  const discAmt = Math.round(orig * pct / 100);
  const frac = pct / 100;

  ['pct-fill', 'pct-thumb', 'price-fill', 'price-thumb'].forEach(id => {
    document.getElementById(id).style.transition =
      animated ? 'left .45s ease, width .45s ease' : 'none';
  });
  if (animated) {
    setTimeout(() => {
      ['pct-fill', 'pct-thumb', 'price-fill', 'price-thumb'].forEach(id =>
        document.getElementById(id).style.transition = 'none'
      );
    }, 500);
  }

  document.getElementById('pct-fill').style.width  = (frac * 100) + '%';
  document.getElementById('pct-thumb').style.left  = (frac * 100) + '%';
  document.getElementById('price-fill').style.width = (frac * 100) + '%';
  document.getElementById('price-thumb').style.left = (frac * 100) + '%';

  document.getElementById('live-pct').textContent = pct + '%';
  document.getElementById('live-amt').textContent = '₹' + discAmt.toLocaleString();

  // play tick on drag
  if (!animated) playTick(pct);
}

function makeDraggable(trackId) {
  const track = document.getElementById(trackId);
  let drag = false;

  function getPct(cx) {
    const r = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (cx - r.left) / r.width));
  }
  function move(cx) { applyPct(getPct(cx) * 100, false); }

  const thumb = track.querySelector('.thumb');

  thumb.addEventListener('mousedown', e => {
    drag = true;
    lastTickPct = -1;
    playSliderStart();
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => { if (drag) move(e.clientX); });
  document.addEventListener('mouseup', () => { drag = false; });

  thumb.addEventListener('touchstart', e => {
    drag = true;
    lastTickPct = -1;
    playSliderStart();
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchmove', e => { if (drag) move(e.touches[0].clientX); }, { passive: true });
  document.addEventListener('touchend', () => { drag = false; });

  track.addEventListener('click', e => { if (e.target === thumb) return; move(e.clientX); });
}

/* ===== OPTIONS ===== */
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(correct, orig) {
  const wrongs = new Set();
  [5, 10, 15, 20, 25, 30].forEach(s => {
    const v = correct + s; if (v !== correct && v > 0 && v < orig) wrongs.add(v);
    const v2 = correct - s; if (v2 !== correct && v2 > 0) wrongs.add(v2);
  });
  return shuffle([correct, ...shuffle([...wrongs]).slice(0, 3)]);
}

/* ===== LOAD QUESTION ===== */
function loadQ() {
  questionDone = false;
  attempts = 0;
  lastTickPct = -1;
  const q = QUESTIONS[qi];
  const discAmt = Math.round(q.orig * q.disc / 100);

  document.getElementById('pval').textContent = '₹' + q.orig;
  document.getElementById('dbadge').textContent = 'Discount: ' + q.disc + '%';
  document.getElementById('qlabel').innerHTML = 'What is the discount<br>amount on the <b>' + q.name + '</b>?';
  document.getElementById('fb').textContent = '';
  document.getElementById('fb').className = 'fb';
  document.getElementById('hint').style.display = 'none';
  document.getElementById('nxtbtn').style.display = 'none';
  document.getElementById('qn').textContent = qi + 1;
  updateAttemptDots();

  QUESTIONS.forEach((_, i) => {
    document.getElementById('toy-' + i).className = 'toy-item' + (i === qi ? ' active' : '');
  });

  const pc = document.getElementById('pcard');
  pc.classList.remove('pop');
  void pc.offsetWidth;
  pc.classList.add('pop');

  buildPriceTicks(q.orig);
  buildDots();

  document.getElementById('pct-fill').style.width = '0%';
  document.getElementById('pct-thumb').style.left = '0%';
  document.getElementById('price-fill').style.width = '0%';
  document.getElementById('price-thumb').style.left = '0%';
  setTimeout(() => applyPct(q.disc, true), 200);

  const optsEl = document.getElementById('opts');
  optsEl.innerHTML = '';
  buildOptions(discAmt, q.orig).forEach(o => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.textContent = '₹' + o;
    b.onclick = () => answer(o, b, discAmt, q);
    optsEl.appendChild(b);
  });
}

/* ===== ANSWER ===== */
function answer(chosen, btn, correct, q) {
  if (questionDone) return;
  const fb = document.getElementById('fb');

  if (chosen === correct) {
    questionDone = true;
    btn.classList.add('correct');
    document.querySelectorAll('.opt').forEach(b => b.disabled = true);
    if (attempts === 0) score++;
    document.getElementById('sc').textContent = score;
    fb.textContent = '🎉 Correct! Well done!';
    fb.className = 'fb ok';
    document.getElementById('hint').style.display = 'none';
    document.getElementById('dot-' + qi).className = 'dot done';
    playCorrect();
    if (qi < QUESTIONS.length - 1) {
      document.getElementById('nxtbtn').style.display = 'inline-block';
    } else {
      setTimeout(() => {
        fb.textContent = (score >= 4 ? '🏆 Excellent! ' : '👍 Good try! ') + 'Final score: ' + score + ' / 5';
        fb.className = 'fb ok';
      }, 400);
    }
  } else {
    attempts++;
    updateAttemptDots();
    btn.classList.add('wrong');
    playWrong();
    setTimeout(() => btn.classList.remove('wrong'), 600);

    if (attempts >= 3) {
      questionDone = true;
      document.querySelectorAll('.opt').forEach(b => {
        b.disabled = true;
        if (parseInt(b.textContent.replace('₹', '')) === correct) b.classList.add('correct');
      });
      fb.textContent = 'No more attempts!';
      fb.className = 'fb no';
      const h = document.getElementById('hint');
      h.style.display = 'block';
      h.textContent = 'Step by step: ₹' + q.orig + ' × ' + q.disc + ' ÷ 100 = ₹' + correct + '. The discount is ₹' + correct + '!';
      applyPct(q.disc, true);
      document.getElementById('dot-' + qi).className = 'dot done';
      if (qi < QUESTIONS.length - 1) document.getElementById('nxtbtn').style.display = 'inline-block';
      else setTimeout(() => { fb.textContent = 'Final score: ' + score + ' / 5'; fb.className = 'fb ok'; }, 400);
    } else {
      fb.textContent = 'Wrong! ' + (3 - attempts) + ' attempt' + (3 - attempts > 1 ? 's' : '') + ' left.';
      fb.className = 'fb no';
    }
  }
}

function nextQ() { qi++; loadQ(); }

function resetGame() {
  qi = 0; score = 0; attempts = 0; questionDone = false;
  document.getElementById('sc').textContent = '0';
  loadQ();
}

function goBack() { window.history.back(); }

function toggleSound() {
  soundOn = !soundOn;
  const btn = document.querySelector('.icon-btn .fa-volume-up')?.parentElement ||
              [...document.querySelectorAll('.icon-btn')].find(b => b.innerHTML.includes('f028'));
  // just toggle the flag — icon could be swapped here if needed
}

function toggleDropdown(menuId) {
  document.querySelectorAll('.dropdown-menu').forEach(m => { if (m.id !== menuId) m.style.display = 'none'; });
  const menu = document.getElementById(menuId);
  menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
}

function selectOption(targetId, element) {
  document.getElementById(targetId).innerText = element.innerText;
  element.parentElement.style.display = 'none';
}

document.addEventListener('click', e => {
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
  }
});

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
makeDraggable('pct-track');
makeDraggable('price-track');
loadQ();
