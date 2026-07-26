/**
 * aesthetic-pomodoro
 * -------------------
 * A pomodoro timer with three switchable backgrounds (rain, cafe,
 * forest) and ambient sound generated live with the Web Audio API —
 * no audio files to download, so the whole thing works offline and
 * ships as three small source files.
 */

const RING_CIRCUMFERENCE = 2 * Math.PI * 92;

const clockEl = document.getElementById("clock");
const modeLabelEl = document.getElementById("modeLabel");
const ringProgressEl = document.getElementById("ringProgress");
const startPauseBtn = document.getElementById("startPauseBtn");
const resetBtn = document.getElementById("resetBtn");
const sceneSwitch = document.getElementById("sceneSwitch");
const sceneLayer = document.getElementById("sceneLayer");
const sessionRow = document.querySelector(".session-row");
const soundToggle = document.getElementById("soundToggle");
const soundLabel = document.getElementById("soundLabel");
const volumeSlider = document.getElementById("volumeSlider");
const sessionCountEl = document.getElementById("sessionCount");

ringProgressEl.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;

/* ---------------- Timer state ---------------- */

let totalSeconds = 25 * 60;
let remainingSeconds = totalSeconds;
let running = false;
let intervalId = null;
let currentMode = "focus";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function renderClock() {
  clockEl.textContent = formatTime(remainingSeconds);
  const progress = 1 - remainingSeconds / totalSeconds;
  ringProgressEl.style.strokeDashoffset = `${RING_CIRCUMFERENCE * (1 - progress)}`;
}

function tick() {
  remainingSeconds -= 1;
  if (remainingSeconds <= 0) {
    remainingSeconds = 0;
    renderClock();
    completeSession();
    return;
  }
  renderClock();
}

function startPause() {
  if (running) {
    clearInterval(intervalId);
    running = false;
    startPauseBtn.textContent = "start";
    fadeAudio(false);
  } else {
    intervalId = setInterval(tick, 1000);
    running = true;
    startPauseBtn.textContent = "pause";
    if (soundToggle.checked) fadeAudio(true);
  }
}

function resetTimer() {
  clearInterval(intervalId);
  running = false;
  remainingSeconds = totalSeconds;
  startPauseBtn.textContent = "start";
  renderClock();
  fadeAudio(false);
}

function completeSession() {
  clearInterval(intervalId);
  running = false;
  startPauseBtn.textContent = "start";
  fadeAudio(false);

  if (currentMode === "focus") {
    incrementSessionCount();
  }

  if (Notification && Notification.permission === "granted") {
    new Notification(currentMode === "focus" ? "Focus session done" : "Break's over");
  }
}

/* ---------------- Session presets ---------------- */

sessionRow.addEventListener("click", (e) => {
  const btn = e.target.closest(".session-btn");
  if (!btn) return;

  document.querySelectorAll(".session-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  const mins = parseInt(btn.dataset.mins, 10);
  currentMode = btn.dataset.mode;
  modeLabelEl.textContent = currentMode === "focus" ? "focus" : "break";
  totalSeconds = mins * 60;
  resetTimer();
});

startPauseBtn.addEventListener("click", startPause);
resetBtn.addEventListener("click", resetTimer);

/* ---------------- Session count (persisted per day) ---------------- */

function todayKey() {
  const d = new Date();
  return `pomodoro-sessions-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function incrementSessionCount() {
  const key = todayKey();
  const count = parseInt(localStorage.getItem(key) || "0", 10) + 1;
  localStorage.setItem(key, String(count));
  renderSessionCount();
}

function renderSessionCount() {
  const count = parseInt(localStorage.getItem(todayKey()) || "0", 10);
  sessionCountEl.textContent = `${count} session${count === 1 ? "" : "s"} completed today`;
}

renderSessionCount();

/* ---------------- Scene switching ---------------- */

const SCENE_PARTICLE_BUILDERS = {
  rain: buildRainScene,
  cafe: buildCafeScene,
  forest: buildForestScene,
};

function clearScene() {
  sceneLayer.innerHTML = "";
}

function buildRainScene() {
  clearScene();
  const count = 60;
  for (let i = 0; i < count; i++) {
    const drop = document.createElement("div");
    drop.className = "raindrop";
    const height = 40 + Math.random() * 60;
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.height = `${height}px`;
    drop.style.animationDuration = `${0.6 + Math.random() * 0.6}s`;
    drop.style.animationDelay = `${Math.random() * 2}s`;
    sceneLayer.appendChild(drop);
  }
}

function buildCafeScene() {
  clearScene();
  const count = 5;
  for (let i = 0; i < count; i++) {
    const wisp = document.createElement("div");
    wisp.className = "steam";
    wisp.style.left = `${20 + Math.random() * 60}%`;
    wisp.style.height = `${60 + Math.random() * 40}px`;
    wisp.style.animationDuration = `${5 + Math.random() * 3}s`;
    wisp.style.animationDelay = `${Math.random() * 4}s`;
    sceneLayer.appendChild(wisp);
  }
}

function buildForestScene() {
  clearScene();
  const count = 18;
  for (let i = 0; i < count; i++) {
    const leaf = document.createElement("div");
    leaf.className = "leaf";
    leaf.style.left = `${Math.random() * 100}%`;
    leaf.style.animationDuration = `${8 + Math.random() * 6}s`;
    leaf.style.animationDelay = `${Math.random() * 6}s`;
    sceneLayer.appendChild(leaf);
  }
}

function setScene(name) {
  document.body.dataset.scene = name;
  document.querySelectorAll(".scene-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.scene === name)
  );
  SCENE_PARTICLE_BUILDERS[name]?.();
  if (soundToggle.checked && running) {
    stopAmbience();
    startAmbience(name);
  }
}

sceneSwitch.addEventListener("click", (e) => {
  const btn = e.target.closest(".scene-btn");
  if (!btn) return;
  setScene(btn.dataset.scene);
});

buildRainScene();

/* ---------------- Ambient audio (Web Audio API, no files) ---------------- */

let audioCtx = null;
let ambienceNodes = [];
let masterGain = null;

function ensureAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = volumeSlider.value / 100;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function makeNoiseBuffer(ctx, seconds = 2) {
  const bufferSize = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function startAmbience(scene) {
  const ctx = ensureAudioCtx();
  stopAmbience();

  const noise = ctx.createBufferSource();
  noise.buffer = makeNoiseBuffer(ctx);
  noise.loop = true;

  const filter = ctx.createBiquadFilter();

  if (scene === "rain") {
    filter.type = "highpass";
    filter.frequency.value = 1200;
  } else if (scene === "cafe") {
    filter.type = "lowpass";
    filter.frequency.value = 500;
  } else {
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 0.6;
  }

  const gain = ctx.createGain();
  gain.gain.value = 0;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  noise.start();

  gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);

  ambienceNodes = [noise, gain];

  if (scene === "forest") startBirdChirps(ctx);
}

let chirpTimeoutId = null;

function startBirdChirps(ctx) {
  const chirp = () => {
    if (!ambienceNodes.length) return;
    const osc = ctx.createOscillator();
    const chirpGain = ctx.createGain();
    osc.type = "sine";
    const base = 1800 + Math.random() * 800;
    osc.frequency.setValueAtTime(base, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(base * 0.7, ctx.currentTime + 0.12);
    chirpGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    chirpGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    chirpGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(chirpGain);
    chirpGain.connect(masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    chirpTimeoutId = setTimeout(chirp, 1500 + Math.random() * 3000);
  };
  chirpTimeoutId = setTimeout(chirp, 1000);
}

function stopAmbience() {
  clearTimeout(chirpTimeoutId);
  ambienceNodes.forEach((n) => {
    try {
      n.stop?.();
      n.disconnect?.();
    } catch {}
  });
  ambienceNodes = [];
}

function fadeAudio(shouldPlay) {
  if (!soundToggle.checked) return;
  if (shouldPlay) {
    startAmbience(document.body.dataset.scene);
  } else {
    stopAmbience();
  }
}

soundToggle.addEventListener("change", () => {
  soundLabel.textContent = soundToggle.checked ? "ambient sound on" : "ambient sound off";
  if (soundToggle.checked && running) {
    startAmbience(document.body.dataset.scene);
  } else {
    stopAmbience();
  }
});

volumeSlider.addEventListener("input", () => {
  if (masterGain) masterGain.gain.value = volumeSlider.value / 100;
});

/* ---------------- Boot ---------------- */

renderClock();

if ("Notification" in window && Notification.permission === "default") {
  document.body.addEventListener(
    "click",
    () => {
      Notification.requestPermission();
    },
    { once: true }
  );
}
