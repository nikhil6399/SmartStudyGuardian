import { StudyAlarm } from '../types';

let activeIntervalId: number | null = null;
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended' && typeof sharedAudioCtx.resume === 'function') {
      Promise.resolve(sharedAudioCtx.resume()).catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export function playAlarmChimeOnce(tone: StudyAlarm['tone'] = 'bell'): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const notes =
      tone === 'focus'
        ? [523.25, 659.25, 783.99]
        : tone === 'chime'
        ? [587.33, 783.99, 880.0, 1046.5]
        : [659.25, 880.0, 659.25, 880.0];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = tone === 'chime' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.18);
      gain.gain.setValueAtTime(0.001, now + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.22, now + idx * 0.18 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.34);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.18);
      osc.stop(now + idx * 0.18 + 0.36);
    });
  } catch {
    // Ignore audio context autoplay restriction safely
  }
}

export function startAlarmRingLoop(tone: StudyAlarm['tone'] = 'bell'): void {
  stopAlarmRingLoop();
  playAlarmChimeOnce(tone);
  activeIntervalId = window.setInterval(() => {
    playAlarmChimeOnce(tone);
  }, 2000);
}

export function stopAlarmRingLoop(): void {
  if (activeIntervalId !== null) {
    window.clearInterval(activeIntervalId);
    activeIntervalId = null;
  }
}

export function formatTime12h(hhmm: string): string {
  if (typeof hhmm !== 'string') return '';
  const [hRaw, mRaw] = hhmm.split(':').map(Number);
  if (Number.isNaN(hRaw) || Number.isNaN(mRaw)) return hhmm;
  const period = hRaw >= 12 ? 'PM' : 'AM';
  const h12 = hRaw % 12 === 0 ? 12 : hRaw % 12;
  return `${String(h12).padStart(2, '0')}:${String(mRaw).padStart(2, '0')} ${period}`;
}

export function getNextAlarmSummary(alarms: StudyAlarm[], isHindi: boolean): string | null {
  if (!Array.isArray(alarms)) return null;
  const enabled = alarms.filter((a) => a && a.enabled && typeof a.time === 'string');
  if (enabled.length === 0) return null;
  const now = new Date();
  const currentJsDay = now.getDay(); // 0=Sun..6=Sat
  const currentIsoDay = currentJsDay === 0 ? 7 : currentJsDay;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let bestDiff = Infinity;
  let bestAlarm: StudyAlarm | null = null;

  for (const alarm of enabled) {
    const [hh, mm] = alarm.time.split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) continue;
    const alarmMinutes = hh * 60 + mm;
    const daysList = Array.isArray(alarm.days) ? alarm.days : [];

    for (let offset = 0; offset < 7; offset++) {
      const checkDay = ((currentIsoDay - 1 + offset) % 7) + 1;
      const dayAllowed = daysList.length === 0 || daysList.includes(checkDay);
      if (!dayAllowed) continue;
      let diffMin = offset * 1440 + (alarmMinutes - nowMinutes);
      if (offset === 0 && diffMin <= 0) continue;
      if (diffMin < bestDiff) {
        bestDiff = diffMin;
        bestAlarm = alarm;
      }
      break;
    }
  }

  if (!bestAlarm || !Number.isFinite(bestDiff)) return null;
  const hrs = Math.floor(bestDiff / 60);
  const mins = bestDiff % 60;
  const dur = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  return isHindi
    ? `अगला अलार्म: ${formatTime12h(bestAlarm.time)} (${dur} में)`
    : `Next alarm: ${formatTime12h(bestAlarm.time)} (in ${dur})`;
}
