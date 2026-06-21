import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Keyboard Clicker — Idle Gaming" },
      { name: "description", content: "Pulsa, sube de nivel y desbloquea teclados legendarios en este juego idle/clicker." },
      { property: "og:title", content: "Keyboard Clicker" },
      { property: "og:description", content: "Juego idle/clicker de teclado con prestigio, combos y eventos." },
    ],
  }),
  component: KeyboardClicker,
});

// ---------- Types & Data ----------
type Upgrade = { id: string; name: string; desc: string; baseCost: number; power: number; icon: string };
type Generator = { id: string; name: string; baseCost: number; cps: number; icon: string };
type Keyboard = { id: string; name: string; unlockAt: number; stars: number; gradient: string };
type Achievement = { id: string; name: string; check: (s: State) => boolean };
type Mission = { id: string; name: string; goal: number; type: "clicks" | "upgrades" | "keys" | "combo"; reward: number; progress: number; done: boolean };

const UPGRADES: Upgrade[] = [
  { id: "u1", name: "Dedos Rápidos", desc: "+1 por tecla", baseCost: 50, power: 1, icon: "✋" },
  { id: "u2", name: "Teclado Mecánico", desc: "+5 por tecla", baseCost: 500, power: 5, icon: "⌨️" },
  { id: "u3", name: "RGB Gamer", desc: "+10 por tecla", baseCost: 5000, power: 10, icon: "🌈" },
  { id: "u4", name: "Teclado Premium", desc: "+50 por tecla", baseCost: 50000, power: 50, icon: "💎" },
  { id: "u5", name: "Teclado Profesional", desc: "+100 por tecla", baseCost: 500000, power: 100, icon: "🏆" },
  { id: "u6", name: "Teclado Cuántico", desc: "+500 por tecla", baseCost: 10000000, power: 500, icon: "⚛️" },
];

const GENERATORS: Generator[] = [
  { id: "g1", name: "Mono Escribiendo", baseCost: 100, cps: 1, icon: "🐒" },
  { id: "g2", name: "Secretario", baseCost: 1000, cps: 8, icon: "🧑‍💼" },
  { id: "g3", name: "Estudiante", baseCost: 10000, cps: 50, icon: "🎓" },
  { id: "g4", name: "Programador", baseCost: 100000, cps: 300, icon: "👨‍💻" },
  { id: "g5", name: "Hacker", baseCost: 1000000, cps: 1800, icon: "🕵️" },
  { id: "g6", name: "IA", baseCost: 12000000, cps: 11000, icon: "🤖" },
  { id: "g7", name: "Superordenador", baseCost: 150000000, cps: 75000, icon: "🖥️" },
  { id: "g8", name: "Centro de Datos", baseCost: 2000000000, cps: 500000, icon: "🏢" },
];

const KEYBOARDS: Keyboard[] = [
  { id: "k1", name: "Normal", unlockAt: 0, stars: 1, gradient: "linear-gradient(135deg,#555,#888)" },
  { id: "k2", name: "RGB", unlockAt: 10000, stars: 2, gradient: "linear-gradient(135deg,#ff0080,#7928ca,#0070f3)" },
  { id: "k3", name: "Hacker Verde", unlockAt: 100000, stars: 3, gradient: "linear-gradient(135deg,#003b00,#00ff41)" },
  { id: "k4", name: "Carbono", unlockAt: 1000000, stars: 3, gradient: "linear-gradient(135deg,#1a1a1a,#3a3a3a)" },
  { id: "k5", name: "Oro", unlockAt: 10000000, stars: 4, gradient: "linear-gradient(135deg,#b8860b,#ffd700)" },
  { id: "k6", name: "Diamante", unlockAt: 100000000, stars: 4, gradient: "linear-gradient(135deg,#b9f2ff,#00d4ff)" },
  { id: "k7", name: "Galaxia", unlockAt: 1000000000, stars: 5, gradient: "linear-gradient(135deg,#0b0033,#7928ca,#ff0080)" },
  { id: "k8", name: "Neón", unlockAt: 10000000000, stars: 5, gradient: "linear-gradient(135deg,#00ffea,#ff00e1)" },
  { id: "k9", name: "Cyberpunk", unlockAt: 100000000000, stars: 5, gradient: "linear-gradient(135deg,#fcee0a,#ff003c,#00f0ff)" },
  { id: "k10", name: "Legendario", unlockAt: 1000000000000, stars: 5, gradient: "linear-gradient(135deg,#ff00cc,#333399,#00ffd5)" },
];

const LEVEL_NAMES = ["Novato", "Escribiente", "Gamer", "Programador", "Hacker", "Experto", "Leyenda del Teclado"];

const ACHIEVEMENTS: Achievement[] = [
  { id: "a1", name: "100 teclas", check: (s) => s.totalKeys >= 100 },
  { id: "a2", name: "1.000 teclas", check: (s) => s.totalKeys >= 1000 },
  { id: "a3", name: "10.000 teclas", check: (s) => s.totalKeys >= 10000 },
  { id: "a4", name: "100.000 teclas", check: (s) => s.totalKeys >= 100000 },
  { id: "a5", name: "Primer combo", check: (s) => s.bestCombo >= 2 },
  { id: "a6", name: "Combo x10", check: (s) => s.bestCombo >= 10 },
  { id: "a7", name: "Combo x50", check: (s) => s.bestCombo >= 50 },
  { id: "a8", name: "10 mejoras compradas", check: (s) => Object.values(s.upgrades).reduce((a, b) => a + b, 0) >= 10 },
  { id: "a9", name: "Primer prestigio", check: (s) => s.prestige >= 1 },
  { id: "a10", name: "10 prestigios", check: (s) => s.prestige >= 10 },
];

type State = {
  keys: number;
  totalKeys: number;
  manualKeys: number;
  autoKeys: number;
  xp: number;
  level: number;
  prestige: number;
  chips: number;
  upgrades: Record<string, number>;
  generators: Record<string, number>;
  currentKeyboard: string;
  unlockedKeyboards: string[];
  achievements: string[];
  bestCombo: number;
  playTime: number;
  sound: boolean;
  prestigeUpgrades: Record<string, number>;
  missions: Mission[];
};

const SAVE_KEY = "kbclicker-save-v1";

const defaultState = (): State => ({
  keys: 0, totalKeys: 0, manualKeys: 0, autoKeys: 0,
  xp: 0, level: 1, prestige: 0, chips: 0,
  upgrades: {}, generators: {},
  currentKeyboard: "k1", unlockedKeyboards: ["k1"],
  achievements: [], bestCombo: 0, playTime: 0, sound: true,
  prestigeUpgrades: {},
  missions: [],
});

const PRESTIGE_UPGRADES = [
  { id: "p1", name: "+5% producción", cost: 1, bonus: 0.05 },
  { id: "p2", name: "+10% producción", cost: 3, bonus: 0.10 },
  { id: "p3", name: "+25% experiencia", cost: 2, bonus: 0.25 },
  { id: "p4", name: "+50% velocidad generadores", cost: 5, bonus: 0.50 },
  { id: "p5", name: "+100% ganancias", cost: 10, bonus: 1.0 },
];

// ---------- helpers ----------
const fmt = (n: number): string => {
  if (n < 1000) return Math.floor(n).toString();
  const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx"];
  let i = 0;
  let v = n;
  while (v >= 1000 && i < units.length - 1) { v /= 1000; i++; }
  return v.toFixed(2) + units[i];
};

const xpForLevel = (lvl: number) => Math.floor(50 * Math.pow(1.35, lvl - 1));
const upgradeCost = (u: Upgrade, owned: number) => Math.floor(u.baseCost * Math.pow(1.18, owned));
const genCost = (g: Generator, owned: number) => Math.floor(g.baseCost * Math.pow(1.15, owned));

// Audio via WebAudio
let audioCtx: AudioContext | null = null;
const playTone = (freq: number, dur: number, type: OscillatorType = "square", vol = 0.05) => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.stop(audioCtx.currentTime + dur);
  } catch {}
};

function KeyboardClicker() {
  const [state, setState] = useState<State>(() => {
    if (typeof window === "undefined") return defaultState();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return { ...defaultState(), ...JSON.parse(raw) };
    } catch {}
    return defaultState();
  });

  const [floaters, setFloaters] = useState<{ id: number; x: number; y: number; text: string; color: string }[]>([]);
  const [combo, setCombo] = useState(0);
  const [comboTimer, setComboTimer] = useState(0);
  const [notifs, setNotifs] = useState<{ id: number; text: string; type: string }[]>([]);
  const [event, setEvent] = useState<{ type: string; until: number; mult: number } | null>(null);
  const [goldenKey, setGoldenKey] = useState<{ x: number; y: number; id: number } | null>(null);
  const [shake, setShake] = useState(false);
  const [tab, setTab] = useState<"upgrades" | "generators" | "prestige" | "stats" | "missions">("upgrades");
  const floaterId = useRef(0);
  const notifId = useRef(0);
  const lastClickTime = useRef(0);

  // Save
  useEffect(() => {
    const t = setInterval(() => {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
    }, 2000);
    return () => clearInterval(t);
  }, [state]);

  // Derived
  const currentKb = KEYBOARDS.find(k => k.id === state.currentKeyboard) || KEYBOARDS[0];
  const xpNeed = xpForLevel(state.level);
  const levelName = LEVEL_NAMES[Math.min(LEVEL_NAMES.length - 1, Math.floor(state.level / 5))];
  const prestigeMult = 1 + state.prestige * 0.25 + (state.prestigeUpgrades["p1"] || 0) * 0.05 + (state.prestigeUpgrades["p2"] || 0) * 0.10 + (state.prestigeUpgrades["p5"] || 0) * 1.0;
  const eventMult = event && Date.now() < event.until ? event.mult : 1;
  const levelMult = 1 + (state.level - 1) * 0.1;
  const perClickBase = 1 + UPGRADES.reduce((sum, u) => sum + (state.upgrades[u.id] || 0) * u.power, 0);
  const perClick = Math.floor(perClickBase * levelMult * prestigeMult * eventMult);
  const cps = Math.floor(
    GENERATORS.reduce((sum, g) => sum + (state.generators[g.id] || 0) * g.cps, 0)
    * levelMult * prestigeMult * eventMult
    * (1 + (state.prestigeUpgrades["p4"] || 0) * 0.5)
  );
  const prestigeReq = 1_000_000 * Math.pow(10, state.prestige);
  const canPrestige = state.totalKeys >= prestigeReq;
  const chipsGain = Math.floor(Math.sqrt(state.totalKeys / 1_000_000));

  // Achievements check
  useEffect(() => {
    const newAch = ACHIEVEMENTS.filter(a => !state.achievements.includes(a.id) && a.check(state));
    if (newAch.length > 0) {
      setState(s => ({ ...s, achievements: [...s.achievements, ...newAch.map(a => a.id)] }));
      newAch.forEach(a => pushNotif(`🏆 Logro: ${a.name}`, "achievement"));
      if (state.sound) playTone(880, 0.2, "triangle", 0.08);
    }
  }, [state.totalKeys, state.bestCombo, state.prestige]);

  // Unlock keyboards
  useEffect(() => {
    KEYBOARDS.forEach(k => {
      if (state.totalKeys >= k.unlockAt && !state.unlockedKeyboards.includes(k.id)) {
        setState(s => ({ ...s, unlockedKeyboards: [...s.unlockedKeyboards, k.id] }));
        pushNotif(`⌨️ Nuevo teclado: ${k.name}`, "unlock");
      }
    });
  }, [state.totalKeys]);

  function pushNotif(text: string, type: string) {
    const id = notifId.current++;
    setNotifs(n => [...n, { id, text, type }]);
    setTimeout(() => setNotifs(n => n.filter(x => x.id !== id)), 3500);
  }

  // Auto income + playtime + combo decay
  useEffect(() => {
    const t = setInterval(() => {
      setState(s => {
        const earn = cps;
        const xpEarn = Math.floor(earn * 0.02 * (1 + (s.prestigeUpgrades["p3"] || 0) * 0.25));
        let lvl = s.level; let xp = s.xp + xpEarn;
        while (xp >= xpForLevel(lvl)) { xp -= xpForLevel(lvl); lvl++; }
        if (lvl > s.level && s.sound) playTone(660, 0.15, "sine", 0.06);
        return { ...s, keys: s.keys + earn, totalKeys: s.totalKeys + earn, autoKeys: s.autoKeys + earn, xp, level: lvl, playTime: s.playTime + 1 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [cps]);

  // Combo decay
  useEffect(() => {
    if (combo === 0) return;
    const t = setInterval(() => {
      setComboTimer(v => {
        if (v <= 0) { setCombo(0); return 0; }
        return v - 100;
      });
    }, 100);
    return () => clearInterval(t);
  }, [combo]);

  // Random events
  useEffect(() => {
    const t = setInterval(() => {
      if (event && Date.now() < event.until) return;
      const r = Math.random();
      if (r < 0.15) {
        setGoldenKey({ x: 20 + Math.random() * 60, y: 20 + Math.random() * 60, id: Date.now() });
        setTimeout(() => setGoldenKey(g => g && g.id === Date.now() ? null : g), 6000);
      } else if (r < 0.22) {
        setEvent({ type: "Lluvia de Teclas x5", until: Date.now() + 10000, mult: 5 });
        pushNotif("🌧️ Lluvia de Teclas x5!", "event");
        if (state.sound) playTone(440, 0.3, "sawtooth", 0.08);
      } else if (r < 0.26) {
        setEvent({ type: "Error del Sistema x10", until: Date.now() + 5000, mult: 10 });
        pushNotif("⚡ Error del Sistema x10!", "event");
        if (state.sound) playTone(220, 0.4, "square", 0.08);
      }
    }, 20000);
    return () => clearInterval(t);
  }, [event, state.sound]);

  // Missions generation
  useEffect(() => {
    if (state.missions.filter(m => !m.done).length < 3) {
      const templates: Omit<Mission, "id" | "progress" | "done">[] = [
        { name: "Pulsa 500 veces", goal: 500, type: "clicks", reward: 1000 },
        { name: "Pulsa 2000 veces", goal: 2000, type: "clicks", reward: 5000 },
        { name: "Compra 3 mejoras", goal: 3, type: "upgrades", reward: 2000 },
        { name: "Consigue 5000 teclas", goal: 5000, type: "keys", reward: 3000 },
        { name: "Haz combo x20", goal: 20, type: "combo", reward: 10000 },
      ];
      const t = templates[Math.floor(Math.random() * templates.length)];
      setState(s => ({ ...s, missions: [...s.missions, { ...t, id: "m" + Date.now() + Math.random(), progress: 0, done: false }] }));
    }
  }, [state.missions.length]);

  const handleClick = useCallback((e?: React.MouseEvent) => {
    const now = Date.now();
    const dt = now - lastClickTime.current;
    lastClickTime.current = now;
    let newCombo = combo;
    if (dt < 400) newCombo = Math.min(combo + 1, 50);
    else newCombo = 1;
    setCombo(newCombo);
    setComboTimer(1500);

    const comboMult = newCombo >= 50 ? 50 : newCombo >= 20 ? 20 : newCombo >= 10 ? 10 : newCombo >= 5 ? 5 : newCombo >= 2 ? 2 : 1;
    const gain = perClick * comboMult;

    setState(s => {
      const xpEarn = Math.floor(1 * (1 + (s.prestigeUpgrades["p3"] || 0) * 0.25));
      let lvl = s.level; let xp = s.xp + xpEarn;
      while (xp >= xpForLevel(lvl)) { xp -= xpForLevel(lvl); lvl++; }
      const missions = s.missions.map(m => {
        if (m.done) return m;
        let p = m.progress;
        if (m.type === "clicks") p += 1;
        if (m.type === "combo") p = Math.max(p, newCombo);
        return { ...m, progress: p };
      });
      return {
        ...s, keys: s.keys + gain, totalKeys: s.totalKeys + gain,
        manualKeys: s.manualKeys + gain, xp, level: lvl,
        bestCombo: Math.max(s.bestCombo, newCombo),
        missions,
      };
    });

    // floater
    const x = e ? e.nativeEvent.offsetX : 50 + Math.random() * 100;
    const y = e ? e.nativeEvent.offsetY : 100;
    const fid = floaterId.current++;
    const color = comboMult >= 10 ? "#ff00e1" : comboMult >= 5 ? "#ffd700" : comboMult >= 2 ? "#00ffea" : "#fff";
    setFloaters(f => [...f, { id: fid, x, y, text: `+${fmt(gain)}`, color }].slice(-20));
    setTimeout(() => setFloaters(f => f.filter(x => x.id !== fid)), 900);

    if (newCombo >= 20) { setShake(true); setTimeout(() => setShake(false), 200); }
    if (state.sound) playTone(800 + Math.random() * 200, 0.04, "square", 0.03);
  }, [combo, perClick, state.sound]);

  // Keyboard listener
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      handleClick();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClick]);

  const buyUpgrade = (u: Upgrade) => {
    const owned = state.upgrades[u.id] || 0;
    const cost = upgradeCost(u, owned);
    if (state.keys < cost) return;
    setState(s => {
      const missions = s.missions.map(m => m.type === "upgrades" && !m.done ? { ...m, progress: m.progress + 1 } : m);
      return { ...s, keys: s.keys - cost, upgrades: { ...s.upgrades, [u.id]: owned + 1 }, missions };
    });
    if (state.sound) playTone(523, 0.1, "triangle", 0.06);
  };

  const buyGen = (g: Generator) => {
    const owned = state.generators[g.id] || 0;
    const cost = genCost(g, owned);
    if (state.keys < cost) return;
    setState(s => ({ ...s, keys: s.keys - cost, generators: { ...s.generators, [g.id]: owned + 1 } }));
    if (state.sound) playTone(440, 0.1, "triangle", 0.06);
  };

  const doPrestige = () => {
    if (!canPrestige) return;
    if (!confirm(`¿Renacer? Ganarás ${chipsGain} Chips Dorados pero perderás teclas, mejoras y generadores.`)) return;
    setState(s => ({
      ...defaultState(),
      prestige: s.prestige + 1,
      chips: s.chips + chipsGain,
      achievements: s.achievements,
      unlockedKeyboards: s.unlockedKeyboards,
      prestigeUpgrades: s.prestigeUpgrades,
      sound: s.sound,
    }));
    pushNotif("✨ ¡Renacimiento completado!", "prestige");
    if (state.sound) playTone(1046, 0.4, "sine", 0.1);
  };

  const buyPrestigeUpgrade = (id: string, cost: number) => {
    if (state.chips < cost) return;
    setState(s => ({ ...s, chips: s.chips - cost, prestigeUpgrades: { ...s.prestigeUpgrades, [id]: (s.prestigeUpgrades[id] || 0) + 1 } }));
    if (state.sound) playTone(880, 0.2, "sine", 0.08);
  };

  const claimMission = (m: Mission) => {
    if (m.progress < m.goal || m.done) return;
    setState(s => ({
      ...s, keys: s.keys + m.reward, totalKeys: s.totalKeys + m.reward,
      missions: s.missions.map(x => x.id === m.id ? { ...x, done: true } : x).filter(x => !x.done),
    }));
    pushNotif(`🎁 Misión completada: +${fmt(m.reward)}`, "achievement");
  };

  const clickGoldenKey = () => {
    if (!goldenKey) return;
    setState(s => ({ ...s, keys: s.keys + 1000 * perClick, totalKeys: s.totalKeys + 1000 * perClick }));
    pushNotif("🔑 ¡Tecla Dorada! +1000x", "event");
    setGoldenKey(null);
    if (state.sound) playTone(1320, 0.3, "sine", 0.1);
  };

  const selectKb = (id: string) => {
    if (!state.unlockedKeyboards.includes(id)) return;
    setState(s => ({ ...s, currentKeyboard: id }));
  };

  const playTimeFmt = () => {
    const t = state.playTime;
    const h = Math.floor(t / 3600).toString().padStart(2, "0");
    const m = Math.floor((t % 3600) / 60).toString().padStart(2, "0");
    const s = (t % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <div style={styles.app as any}>
      <style>{globalCss}</style>

      {/* Notifications */}
      <div style={styles.notifs as any}>
        {notifs.map(n => (
          <div key={n.id} className="notif" style={styles.notif as any}>{n.text}</div>
        ))}
      </div>

      <div style={styles.layout as any} className={shake ? "shake" : ""}>
        {/* LEFT */}
        <aside style={styles.side as any}>
          <div style={styles.panel as any}>
            <div style={styles.label as any}>NIVEL</div>
            <div style={styles.bigNum as any}>{state.level}</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>{levelName}</div>
            <div style={styles.xpBar as any}>
              <div style={{ ...styles.xpFill, width: `${(state.xp / xpNeed) * 100}%` } as any} />
            </div>
            <div style={{ fontSize: 11, textAlign: "center", marginTop: 4 }}>{fmt(state.xp)} / {fmt(xpNeed)} XP</div>
          </div>

          <div style={styles.panel as any}>
            <div style={styles.label as any}>TECLADO ACTUAL</div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>{currentKb.name}</div>
            <div style={{ color: "#ffd700", marginTop: 2 }}>{"★".repeat(currentKb.stars)}{"☆".repeat(5 - currentKb.stars)}</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>POR CLIC: <span style={{ color: "#00ffea" }}>+{fmt(perClick)}</span></div>
            <div style={{ fontSize: 12 }}>MULT: <span style={{ color: "#ff00e1" }}>x{prestigeMult.toFixed(2)}</span></div>
          </div>

          <div style={styles.panel as any}>
            <div style={styles.tabsRow as any}>
              {(["upgrades", "generators", "missions"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ ...styles.tabBtn, ...(tab === t ? styles.tabBtnActive : {}) } as any}>
                  {t === "upgrades" ? "MEJORAS" : t === "generators" ? "AUTO" : "MISIONES"}
                </button>
              ))}
            </div>
            <div style={{ maxHeight: 360, overflowY: "auto", marginTop: 8 }}>
              {tab === "upgrades" && UPGRADES.map(u => {
                const owned = state.upgrades[u.id] || 0;
                const cost = upgradeCost(u, owned);
                const can = state.keys >= cost;
                return (
                  <button key={u.id} onClick={() => buyUpgrade(u)} disabled={!can} style={{ ...styles.itemBtn, opacity: can ? 1 : 0.5 } as any}>
                    <div style={{ fontSize: 22 }}>{u.icon}</div>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>{u.desc}</div>
                      <div style={{ fontSize: 10, color: "#7928ca" }}>NIVEL {owned}</div>
                    </div>
                    <div style={styles.costPill as any}>⌨ {fmt(cost)}</div>
                  </button>
                );
              })}
              {tab === "generators" && GENERATORS.map(g => {
                const owned = state.generators[g.id] || 0;
                const cost = genCost(g, owned);
                const can = state.keys >= cost;
                return (
                  <button key={g.id} onClick={() => buyGen(g)} disabled={!can} style={{ ...styles.itemBtn, opacity: can ? 1 : 0.5 } as any}>
                    <div style={{ fontSize: 22 }}>{g.icon}</div>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{g.name}</div>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>+{fmt(g.cps)}/s</div>
                      <div style={{ fontSize: 10, color: "#7928ca" }}>x{owned}</div>
                    </div>
                    <div style={styles.costPill as any}>⌨ {fmt(cost)}</div>
                  </button>
                );
              })}
              {tab === "missions" && state.missions.map(m => (
                <div key={m.id} style={styles.itemBtn as any}>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</div>
                    <div style={styles.xpBar as any}><div style={{ ...styles.xpFill, width: `${Math.min(100, (m.progress / m.goal) * 100)}%` } as any} /></div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>{fmt(m.progress)}/{fmt(m.goal)} · 🎁 {fmt(m.reward)}</div>
                  </div>
                  <button onClick={() => claimMission(m)} disabled={m.progress < m.goal} style={styles.claimBtn as any}>✓</button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER */}
        <main style={styles.center as any}>
          <div style={{ textAlign: "center" }}>
            <div style={styles.label as any}>CLICS TOTALES</div>
            <div style={styles.megaCounter as any}>{fmt(state.keys)}</div>
            <div style={{ opacity: 0.7, fontSize: 14 }}>+{fmt(perClick)} por clic · +{fmt(cps)}/s</div>
            {combo > 1 && (
              <div style={{ ...styles.combo, color: combo >= 20 ? "#ff00e1" : combo >= 10 ? "#ffd700" : "#00ffea" } as any}>
                COMBO x{combo}
              </div>
            )}
            {event && Date.now() < event.until && (
              <div style={styles.eventBanner as any}>⚡ {event.type} — {Math.ceil((event.until - Date.now()) / 1000)}s</div>
            )}
          </div>

          <div style={styles.kbWrap as any} onClick={handleClick}>
            <div style={{ ...styles.kb, background: currentKb.gradient } as any} className="kbglow">
              <div style={styles.kbInner as any}>
                {"QWERTYUIOPASDFGHJKLZXCVBNM".split("").map((c, i) => (
                  <div key={i} style={styles.key as any}>{c}</div>
                ))}
              </div>
            </div>
            {floaters.map(f => (
              <div key={f.id} className="floater" style={{ left: f.x, top: f.y, color: f.color } as any}>{f.text}</div>
            ))}
            {goldenKey && (
              <div className="golden" onClick={(e) => { e.stopPropagation(); clickGoldenKey(); }}
                style={{ position: "absolute", left: `${goldenKey.x}%`, top: `${goldenKey.y}%` } as any}>🔑</div>
            )}
          </div>

          <div style={styles.panel as any}>
            <div style={styles.label as any}>TECLADOS DESBLOQUEADOS ({state.unlockedKeyboards.length}/{KEYBOARDS.length})</div>
            <div style={styles.kbGrid as any}>
              {KEYBOARDS.map(k => {
                const unlocked = state.unlockedKeyboards.includes(k.id);
                const selected = k.id === state.currentKeyboard;
                return (
                  <button key={k.id} onClick={() => selectKb(k.id)}
                    style={{ ...styles.kbCard, borderColor: selected ? "#00ffea" : "rgba(255,255,255,0.1)", opacity: unlocked ? 1 : 0.4 } as any}>
                    <div style={{ height: 40, borderRadius: 6, background: unlocked ? k.gradient : "#222" } as any} />
                    <div style={{ fontSize: 11, marginTop: 4, fontWeight: 600 }}>{k.name}</div>
                    <div style={{ fontSize: 10, color: "#ffd700" }}>{"★".repeat(k.stars)}</div>
                    <div style={{ fontSize: 9, opacity: 0.6 }}>{unlocked ? "✓" : fmt(k.unlockAt)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        {/* RIGHT */}
        <aside style={styles.side as any}>
          <div style={{ ...styles.panel, borderColor: "#7928ca" } as any}>
            <div style={{ ...styles.label, color: "#c4a4ff" } as any}>◉ RENACIMIENTO {state.prestige}</div>
            <div style={{ marginTop: 8, fontSize: 12 }}>MULTIPLICADOR GLOBAL: <span style={{ color: "#ff00e1", fontWeight: 700 }}>x{prestigeMult.toFixed(2)}</span></div>
            <div style={{ fontSize: 11, marginTop: 8, opacity: 0.7 }}>Al Renacimiento {state.prestige + 1}</div>
            <div style={styles.xpBar as any}>
              <div style={{ ...styles.xpFill, width: `${Math.min(100, (state.totalKeys / prestigeReq) * 100)}%`, background: "linear-gradient(90deg,#7928ca,#ff00e1)" } as any} />
            </div>
            <div style={{ fontSize: 10, textAlign: "center" }}>{fmt(state.totalKeys)} / {fmt(prestigeReq)}</div>
            <button onClick={doPrestige} disabled={!canPrestige} style={{ ...styles.prestigeBtn, opacity: canPrestige ? 1 : 0.4 } as any}>
              RENACER {canPrestige && `(+${chipsGain} 💎)`}
            </button>
            <div style={{ fontSize: 11, marginTop: 6, textAlign: "center" }}>Chips: <span style={{ color: "#ffd700" }}>💎 {state.chips}</span></div>
          </div>

          <div style={styles.panel as any}>
            <div style={styles.label as any}>ESTADÍSTICAS</div>
            <div style={styles.statRow as any}><span>Clics Totales:</span><span>{fmt(state.totalKeys)}</span></div>
            <div style={styles.statRow as any}><span>Manuales:</span><span>{fmt(state.manualKeys)}</span></div>
            <div style={styles.statRow as any}><span>Automáticos:</span><span>{fmt(state.autoKeys)}</span></div>
            <div style={styles.statRow as any}><span>Mejor combo:</span><span>x{state.bestCombo}</span></div>
            <div style={styles.statRow as any}><span>Prestigios:</span><span>{state.prestige}</span></div>
            <div style={styles.statRow as any}><span>Logros:</span><span>{state.achievements.length}/{ACHIEVEMENTS.length}</span></div>
            <div style={styles.statRow as any}><span>Tiempo:</span><span>{playTimeFmt()}</span></div>
          </div>

          <div style={styles.panel as any}>
            <div style={styles.label as any}>POTENCIADORES (PRESTIGIO)</div>
            {PRESTIGE_UPGRADES.map(p => {
              const owned = state.prestigeUpgrades[p.id] || 0;
              const can = state.chips >= p.cost;
              return (
                <button key={p.id} onClick={() => buyPrestigeUpgrade(p.id, p.cost)} disabled={!can}
                  style={{ ...styles.itemBtn, opacity: can ? 1 : 0.5 } as any}>
                  <div style={{ flex: 1, textAlign: "left", fontSize: 12 }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 10, opacity: 0.6 }}>Nivel {owned}</div>
                  </div>
                  <div style={{ ...styles.costPill, background: "rgba(121,40,202,0.3)" } as any}>💎 {p.cost}</div>
                </button>
              );
            })}
          </div>

          <div style={styles.panel as any}>
            <div style={styles.label as any}>LOGROS</div>
            <div style={{ maxHeight: 120, overflowY: "auto", fontSize: 11 }}>
              {ACHIEVEMENTS.map(a => (
                <div key={a.id} style={{ padding: 3, opacity: state.achievements.includes(a.id) ? 1 : 0.4 }}>
                  {state.achievements.includes(a.id) ? "🏆" : "🔒"} {a.name}
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setState(s => ({ ...s, sound: !s.sound }))} style={styles.soundBtn as any}>
            {state.sound ? "🔊 SONIDO: SÍ" : "🔇 SONIDO: NO"}
          </button>
        </aside>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at top, #1a0033 0%, #0a0118 50%, #000 100%)",
    color: "#fff",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: 12,
    overflow: "hidden",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "300px 1fr 320px",
    gap: 12,
    maxWidth: 1600,
    margin: "0 auto",
  },
  side: { display: "flex", flexDirection: "column", gap: 12 },
  center: { display: "flex", flexDirection: "column", gap: 16, alignItems: "stretch" },
  panel: {
    background: "linear-gradient(135deg, rgba(30,10,60,0.7), rgba(10,5,30,0.9))",
    border: "1px solid rgba(121,40,202,0.4)",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 0 20px rgba(121,40,202,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
  },
  label: { fontSize: 11, letterSpacing: 2, color: "#c4a4ff", fontWeight: 700 },
  bigNum: { fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1, textShadow: "0 0 20px rgba(0,255,234,0.5)" },
  xpBar: { height: 8, background: "rgba(0,0,0,0.5)", borderRadius: 4, overflow: "hidden", marginTop: 6, border: "1px solid rgba(121,40,202,0.3)" },
  xpFill: { height: "100%", background: "linear-gradient(90deg,#00ffea,#7928ca)", transition: "width 0.3s", boxShadow: "0 0 10px rgba(0,255,234,0.5)" },
  megaCounter: { fontSize: 56, fontWeight: 900, lineHeight: 1, textShadow: "0 0 30px rgba(0,255,234,0.6), 0 0 60px rgba(121,40,202,0.4)", margin: "4px 0" },
  combo: { fontSize: 32, fontWeight: 900, marginTop: 8, textShadow: "0 0 20px currentColor", animation: "pulse 0.3s" },
  eventBanner: { marginTop: 8, padding: "6px 12px", display: "inline-block", background: "linear-gradient(90deg,#ff00e1,#7928ca)", borderRadius: 20, fontWeight: 700, fontSize: 13 },
  kbWrap: { position: "relative", aspectRatio: "2/1", maxHeight: 360, cursor: "pointer", userSelect: "none" },
  kb: { width: "100%", height: "100%", borderRadius: 16, padding: 20, boxShadow: "0 0 40px rgba(121,40,202,0.4), inset 0 0 20px rgba(0,0,0,0.5)", border: "2px solid rgba(255,255,255,0.1)" },
  kbInner: { display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6, height: "100%", alignContent: "center" },
  key: { background: "rgba(0,0,0,0.6)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.1)", textShadow: "0 0 6px currentColor" },
  kbGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px,1fr))", gap: 8, marginTop: 8 },
  kbCard: { background: "rgba(0,0,0,0.4)", border: "2px solid", borderRadius: 8, padding: 6, cursor: "pointer", color: "#fff" },
  tabsRow: { display: "flex", gap: 4 },
  tabBtn: { flex: 1, padding: "6px 4px", fontSize: 10, fontWeight: 700, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(121,40,202,0.3)", color: "#c4a4ff", borderRadius: 6, cursor: "pointer", letterSpacing: 1 },
  tabBtnActive: { background: "linear-gradient(135deg,#7928ca,#ff00e1)", color: "#fff" },
  itemBtn: { display: "flex", alignItems: "center", gap: 8, width: "100%", padding: 8, marginBottom: 6, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(121,40,202,0.2)", borderRadius: 8, color: "#fff", cursor: "pointer" },
  costPill: { background: "rgba(0,255,100,0.2)", color: "#0f0", padding: "4px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, border: "1px solid rgba(0,255,100,0.3)" },
  claimBtn: { background: "linear-gradient(135deg,#00ffea,#7928ca)", border: "none", color: "#fff", padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 700 },
  prestigeBtn: { width: "100%", marginTop: 10, padding: 12, background: "linear-gradient(135deg,#7928ca,#ff00e1)", border: "none", color: "#fff", fontWeight: 900, fontSize: 14, letterSpacing: 2, borderRadius: 8, cursor: "pointer", boxShadow: "0 0 20px rgba(255,0,225,0.4)" },
  statRow: { display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12, borderBottom: "1px solid rgba(121,40,202,0.1)" },
  soundBtn: { padding: 10, background: "rgba(0,255,234,0.1)", border: "1px solid #00ffea", color: "#00ffea", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 },
  notifs: { position: "fixed", top: 16, right: 16, zIndex: 100, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" },
  notif: { background: "linear-gradient(135deg,#7928ca,#ff00e1)", padding: "10px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, boxShadow: "0 4px 20px rgba(0,0,0,0.5), 0 0 20px rgba(255,0,225,0.4)" },
};

const globalCss = `
@keyframes floatUp { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-80px); opacity: 0; } }
.floater { position: absolute; font-weight: 900; font-size: 22px; pointer-events: none; text-shadow: 0 0 10px currentColor; animation: floatUp 0.9s ease-out forwards; z-index: 5; }
@keyframes pulse { 0% { transform: scale(0.8); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
@keyframes shake { 0%,100% { transform: translate(0,0); } 25% { transform: translate(-4px,2px); } 50% { transform: translate(4px,-2px); } 75% { transform: translate(-2px,-2px); } }
.shake { animation: shake 0.2s; }
.kbglow { transition: transform 0.05s; }
.kbglow:active { transform: scale(0.98); }
.notif { animation: slideIn 0.3s ease-out; }
@keyframes slideIn { from { transform: translateX(120%); } to { transform: translateX(0); } }
@keyframes goldenSpin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
.golden { font-size: 48px; cursor: pointer; animation: goldenSpin 2s linear infinite; filter: drop-shadow(0 0 20px #ffd700); z-index: 10; }
@media (max-width: 1024px) {
  .layout, [class*="layout"] { grid-template-columns: 1fr !important; }
}
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background: rgba(121,40,202,0.5); border-radius: 3px; }
::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
`;
