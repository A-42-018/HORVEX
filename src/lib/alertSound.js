// New-order chime, synthesised with the Web Audio API (no audio file to ship).
// Browsers keep audio suspended until the page has had a click or key press, so
// call unlockAudio() on the first gesture; before that playChime() stays silent
// rather than erroring, and the visual alert still shows.
let context;

function getContext() {
  if (context) return context;
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) return null;
  context = new AudioContextClass();
  return context;
}

/** Call from a user gesture (click / key press). */
export function unlockAudio() {
  const ctx = getContext();
  if (ctx?.state === "suspended") ctx.resume().catch(() => {});
}

function ring(ctx) {
  const start = ctx.currentTime + 0.02;
  // A rising two-note "ding-ding": 880 Hz then 1320 Hz.
  [880, 1320].forEach((frequency, index) => {
    const at = start + index * 0.16;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.55);
  });
}

/** Plays the chime if the browser allows it; never throws. */
export function playChime() {
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "running") ring(ctx);
    else ctx.resume().then(() => ctx.state === "running" && ring(ctx)).catch(() => {});
  } catch {
    // Audio is a nicety; the badge and alert card carry the message.
  }
}
