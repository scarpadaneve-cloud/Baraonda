import React, { useEffect, useRef, useState, useCallback } from "react";

const W = 460;
const H = 760;
const RIVER_Y = 380;
const RIVER_H = 44;
const BRIDGE_XS = [120, 340];
const BRIDGE_W = 52;

// ---------- MAZZO ----------
const CARDS = {
  spadaccino:  { key: "spadaccino", name: "Spadaccino", cost: 3, count: 1, hp: 700, dmg: 90, hit: 60, range: 32, speed: 0.9, sight: 180, r: 11, color: "#b45309", proj: null, icon: "⚔️", desc: "Combattente equilibrato con spada lunga" },
  balestriere: { key: "balestriere", name: "Balestriere", cost: 3, count: 1, hp: 330, dmg: 78, hit: 100, range: 165, speed: 0.8, sight: 220, r: 10, color: "#57534e", proj: "arrow", icon: "🏹", desc: "Dardi pesanti a grande gittata" },
  lupi:        { key: "lupi", name: "Branco di Lupi", cost: 2, count: 3, hp: 120, dmg: 48, hit: 34, range: 24, speed: 1.6, sight: 170, r: 7, color: "#6b7280", proj: null, icon: "🐺", desc: "3 belve rapide, perfette in gruppo" },
  ariete:      { key: "ariete", name: "Ariete d'Assedio", cost: 4, count: 1, hp: 1900, dmg: 150, hit: 84, range: 34, speed: 0.45, sight: 9999, r: 14, color: "#8a5a2b", proj: null, icon: "🐏", buildingOnly: true, desc: "Lentissimo, punta solo le torri" },
  piromante:   { key: "piromante", name: "Piromante", cost: 4, count: 1, hp: 380, dmg: 105, splash: 48, hit: 96, range: 145, speed: 0.85, sight: 240, r: 10, color: "#9a3412", proj: "fire", icon: "🔥", desc: "Sfere di fuoco con danno ad area" },
  cavaliere:   { key: "cavaliere", name: "Cavaliere a Cavallo", cost: 4, count: 1, hp: 620, dmg: 95, hit: 64, range: 34, speed: 1.4, sight: 200, r: 12, color: "#7c2d12", proj: null, icon: "🐎", desc: "Carica veloce, colpi pesanti" },
  guardia:     { key: "guardia", name: "Guardia", cost: 2, count: 1, hp: 950, dmg: 55, hit: 70, range: 30, speed: 0.75, sight: 170, r: 12, color: "#475569", proj: null, icon: "🛡️", desc: "Solido difensore con scudo pesante" },
  assassino:   { key: "assassino", name: "Assassino", cost: 3, count: 1, hp: 400, dmg: 135, hit: 48, range: 28, speed: 1.55, sight: 190, r: 10, color: "#581c87", proj: null, icon: "🗡️", desc: "Colpi rapidi e letali, ma fragile" },
  stregone:    { key: "stregone", name: "Stregone", cost: 4, count: 1, hp: 440, dmg: 72, hit: 55, range: 160, speed: 0.85, sight: 230, r: 10, color: "#4c1d95", proj: "bolt", icon: "⚡", desc: "Fulmini rapidi a media gittata" },
  golem:       { key: "golem", name: "Golem di Pietra", cost: 6, count: 1, hp: 2600, dmg: 140, hit: 95, range: 38, speed: 0.45, sight: 170, r: 16, color: "#3f3f46", proj: null, icon: "🗿", desc: "Colosso di pietra: lento ma quasi indistruttibile" },
};

const DECK = Object.keys(CARDS);
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const makeTowers = () => [
  { x: 115, y: 170, side: "e", king: false, hp: 1000, maxHp: 1000, r: 22, range: 165, dmg: 42, hit: 52, cd: 0, alive: true,
    cracks: [[0.2, 0.1, 0.5, 0.4], [-0.4, -0.2, -0.1, 0.3]] },
  { x: 345, y: 170, side: "e", king: false, hp: 1000, maxHp: 1000, r: 22, range: 165, dmg: 42, hit: 52, cd: 0, alive: true,
    cracks: [[0.1, -0.3, 0.4, 0.1], [0.3, 0.4, 0.1, 0.0]] },
  { x: 230, y: 62, side: "e", king: true, hp: 1700, maxHp: 1700, r: 26, range: 170, dmg: 55, hit: 55, cd: 0, alive: true, active: false,
    cracks: [[0.2, 0.0, 0.5, 0.3], [-0.3, -0.3, 0.0, 0.1]] },
  { x: 115, y: 590, side: "p", king: false, hp: 1000, maxHp: 1000, r: 22, range: 165, dmg: 42, hit: 52, cd: 0, alive: true,
    cracks: [[0.0, 0.2, 0.3, 0.5], [-0.5, -0.1, -0.2, 0.3]] },
  { x: 345, y: 590, side: "p", king: false, hp: 1000, maxHp: 1000, r: 22, range: 165, dmg: 42, hit: 52, cd: 0, alive: true,
    cracks: [[0.3, -0.2, 0.5, 0.1], [0.1, 0.3, -0.1, 0.5]] },
  { x: 230, y: 700, side: "p", king: true, hp: 1700, maxHp: 1700, r: 26, range: 170, dmg: 55, hit: 55, cd: 0, alive: true, active: false,
    cracks: [[-0.2, 0.1, 0.2, 0.4], [0.4, -0.2, 0.1, 0.0]] },
];

export default function App() {
  const canvasRef = useRef(null);
  const gRef = useRef(null);
  const phaseRef = useRef("idle");
  const mouseRef = useRef({ x: 0, y: 0, inside: false });
  const [phase, setPhase] = useState("idle");
  const [ui, setUi] = useState({ elixir: 5, elixirFrac: 0.5, hand: [], next: null, crownsP: 0, crownsE: 0, time: "3:00", timeFrac: 1, double: false, selected: -1, dragging: -1, sudden: false });

  const setPhaseBoth = useCallback((p) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const startGame = useCallback(() => {
    const deck = shuffle(DECK);
    gRef.current = {
      units: [], shots: [], towers: makeTowers(),
      pElixir: 5, eElixir: 5,
      hand: deck.slice(0, 4), queue: deck.slice(4),
      selected: -1, dragging: -1,
      dragTap: false, dragMoved: false, dragPrevSel: false, dragSX: 0, dragSY: 0,
      timer: 180 * 60, sudden: false, suddenTimer: 60 * 60,
      crownsP: 0, crownsE: 0,
      aiT: 120, aiPlan: [],
      double: false, over: null, fx: [], shake: 0, banner: null, bannerT: 0,
    };
    setPhaseBoth("running");
  }, [setPhaseBoth]);

  const playCard = useCallback((i, drag, e) => {
    const g = gRef.current;
    if (!g || phaseRef.current !== "running") return;
    if (drag) {
      g.dragging = i;
      g.dragPrevSel = g.selected === i;
      g.selected = i;
      g.dragTap = true;
      g.dragMoved = false;
      g.dragSX = e ? e.clientX : 0;
      g.dragSY = e ? e.clientY : 0;
    } else {
      g.selected = g.selected === i ? -1 : i;
    }
  }, []);

  useEffect(() => {
    const keyDown = (e) => {
      if (["1", "2", "3", "4"].includes(e.key)) playCard(parseInt(e.key, 10) - 1);
      if (e.code === "Enter" && phaseRef.current !== "running") {
        e.preventDefault();
        startGame();
      }
    };
    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, [playCard, startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    // helper roundRect con fallback (Safari vecchi non hanno ctx.roundRect)
    const rr = (x, y, w, h, r) => {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, Math.max(0.5, w), h, r);
      else ctx.rect(x, y, w, h);
    };

    // ---------- cache sfondo (evita ~200 gradienti per frame) ----------
    const bgCanvas = document.createElement("canvas");
    bgCanvas.width = W;
    bgCanvas.height = H;
    const bctx = bgCanvas.getContext("2d");
    const drawArenaCache = () => {
      const t = 46;
      for (let ty = 0; ty < Math.ceil(H / t); ty++) {
        for (let tx = 0; tx < Math.ceil(W / t); tx++) {
          const light = (tx + ty) % 2 === 0;
          const grd = bctx.createLinearGradient(tx * t, ty * t, tx * t, ty * t + t);
          if (light) { grd.addColorStop(0, "#63a04b"); grd.addColorStop(1, "#568c41"); }
          else { grd.addColorStop(0, "#568c41"); grd.addColorStop(1, "#497a38"); }
          bctx.fillStyle = grd;
          bctx.fillRect(tx * t, ty * t, t, t);
        }
      }
      bctx.strokeStyle = "rgba(0,0,0,0.18)";
      bctx.lineWidth = 6;
      bctx.strokeRect(3, 3, W - 6, H - 6);
      bctx.strokeStyle = "rgba(255,255,255,0.08)";
      bctx.lineWidth = 2;
      bctx.strokeRect(8, 8, W - 16, H - 16);
    };
    drawArenaCache();

    const riverGrad = ctx.createLinearGradient(0, RIVER_Y - RIVER_H / 2, 0, RIVER_Y + RIVER_H / 2);
    riverGrad.addColorStop(0, "#2a6394");
    riverGrad.addColorStop(0.5, "#3f86c3");
    riverGrad.addColorStop(1, "#2a6394");

    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.36, W / 2, H / 2, H * 0.75);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.24)");

    const toCanvas = (e) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * W,
        y: ((e.clientY - r.top) / r.height) * H,
        in: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom,
      };
    };

    const canDeployP = (g, x, y) => {
      if (y > RIVER_Y + RIVER_H / 2 + 8 && y < H - 10 && x > 12 && x < W - 12) return true;
      const lt = g.towers[0];
      const rt = g.towers[1];
      if (!lt.alive && x < 230 && y > lt.y + 55 && y < RIVER_Y - 10) return true;
      if (!rt.alive && x >= 230 && y > rt.y + 55 && y < RIVER_Y - 10) return true;
      return false;
    };

    const deploy = (g, key, x, y, side) => {
      const c = CARDS[key];
      for (let i = 0; i < c.count; i++) {
        const ang = (i / c.count) * Math.PI * 2 + Math.random() * 0.5;
        const d = c.count > 1 ? 15 : 0;
        g.units.push({
          key, side,
          x: x + Math.cos(ang) * d,
          y: y + Math.sin(ang) * d,
          hp: c.hp, maxHp: c.hp,
          cd: 30, face: side === "p" ? -Math.PI / 2 : Math.PI / 2,
          walkT: Math.random() * 10, flash: 0, moving: false,
          card: c,
        });
      }
      g.fx.push({ x, y, t: 22, dur: 22, color: side === "p" ? "rgba(147,197,253,0.9)" : "rgba(252,165,165,0.9)", ring: true, rad: 24 });
    };

    const finish = (g, result) => {
      if (g.over) return;
      g.over = result;
      setPhaseBoth(result === "win" ? "win" : result === "lose" ? "dead" : "draw");
    };

    const damage = (g, ent, dmg) => {
      ent.hp -= dmg;
      if (ent.card) {
        ent.flash = 6;
        if (ent.hp <= 0) {
          g.fx.push({ x: ent.x, y: ent.y, t: 24, color: "rgba(230,230,230,0.7)", poof: true, rad: ent.card.r * 1.6 });
          for (let i = 0; i < 8; i++) {
            const a = Math.random() * Math.PI * 2;
            g.fx.push({ x: ent.x, y: ent.y, vx: Math.cos(a) * (1 + Math.random() * 2), vy: Math.sin(a) * (1 + Math.random() * 2), t: 18, color: ent.card.color, puff: true });
          }
        }
      } else if (ent.hp <= 0 && ent.alive !== undefined) {
        ent.alive = false;
        g.shake = 14;
        g.fx.push({ x: ent.x, y: ent.y, t: 40, color: "#d4d4d8", big: true });
        for (let i = 0; i < 14; i++) {
          const a = Math.random() * Math.PI * 2;
          g.fx.push({ x: ent.x, y: ent.y, vx: Math.cos(a) * (1.5 + Math.random() * 3), vy: Math.sin(a) * (1.5 + Math.random() * 3), t: 30, color: "#a8a29e", puff: true });
        }
        if (ent.side === "e") {
          g.crownsP += ent.king ? 3 : 1;
          g.banner = ent.king ? "👑 CORONA DISTRUTTA!" : "💥 TORRE NEMICA DISTRUTTA!";
          g.bannerT = 120;
          if (ent.king) finish(g, "win");
        } else {
          g.crownsE += ent.king ? 3 : 1;
          g.banner = ent.king ? "💀 LA TUA CORONA È CADUTA!" : "💀 TORRE PERSA!";
          g.bannerT = 120;
          if (ent.king) finish(g, "lose");
        }
        if (!ent.king) {
          const king = g.towers.find((t) => t.side === ent.side && t.king);
          if (king && !king.active) {
            king.active = true;
            g.fx.push({ x: king.x, y: king.y, t: 30, dur: 30, color: "#fbbf24", ring: true, rad: 34 });
          }
        }
        if (g.sudden && !g.over) finish(g, g.crownsP > g.crownsE ? "win" : "lose");
      }
    };

    const nearestBridge = (x) =>
      Math.abs(x - BRIDGE_XS[0]) < Math.abs(x - BRIDGE_XS[1]) ? BRIDGE_XS[0] : BRIDGE_XS[1];

    const findTarget = (g, u) => {
      let best = null;
      let bestD = Infinity;
      if (!u.card.buildingOnly) {
        for (const e of g.units) {
          if (e.side === u.side || e.hp <= 0) continue;
          const d = Math.hypot(e.x - u.x, e.y - u.y);
          if (d < u.card.sight && d < bestD) { best = e; bestD = d; }
        }
      }
      if (best) return best;
      let bt = null;
      let btD = Infinity;
      for (const t of g.towers) {
        if (!t.alive || t.side === u.side) continue;
        const d = Math.hypot(t.x - u.x, t.y - u.y);
        if (d < btD) { bt = t; btD = d; }
      }
      return bt;
    };

    // ============ IA ============
    const aiThink = (g, dt) => {
      g.eElixir = Math.min(10, g.eElixir + dt / (g.double ? 84 : 168));
      g.aiT -= dt;

      if (g.aiPlan.length > 0 && g.aiT <= 0) {
        const step = g.aiPlan.shift();
        if (g.eElixir >= CARDS[step.key].cost) {
          g.eElixir -= CARDS[step.key].cost;
          deploy(g, step.key, step.x, step.y, "e");
        }
        g.aiT = 65;
        return;
      }
      if (g.aiT > 0) return;

      const threats = g.units
        .filter((u) => u.side === "p" && u.hp > 0 && u.y < RIVER_Y + 36)
        .sort((a, b) => a.y - b.y);
      const threat = threats[0];

      if (threat) {
        const tough = threat.maxHp >= 800;
        const swarm = threats.filter((u) => Math.abs(u.x - threat.x) < 70).length;
        let want;
        if (tough) want = ["piromante", "guardia", "stregone", "balestriere"];
        else if (swarm >= 3) want = ["stregone", "piromante", "balestriere"];
        else want = ["spadaccino", "guardia", "assassino", "lupi", "balestriere"];
        const k = want.find((w) => CARDS[w].cost <= g.eElixir);
        if (k) {
          g.eElixir -= CARDS[k].cost;
          const laneTower = g.towers.filter((t) => t.side === "e" && t.alive && !t.king)
            .sort((a, b) => Math.hypot(a.x - threat.x, a.y - threat.y) - Math.hypot(b.x - threat.x, b.y - threat.y))[0];
          const tx = laneTower ? laneTower.x : 230;
          const ty = laneTower ? laneTower.y : 120;
          const a = Math.atan2(threat.y - ty, threat.x - tx);
          const dx = tx + Math.cos(a) * 60;
          const dy = ty + Math.sin(a) * 60;
          deploy(g, k, Math.max(20, Math.min(W - 20, dx)), Math.max(70, Math.min(RIVER_Y - 30, dy)), "e");
          g.aiT = 110 + Math.random() * 70;
        } else {
          g.aiT = 45;
        }
        return;
      }

      const pushThreshold = g.double ? 7 : 8.5;
      if (g.eElixir >= pushThreshold) {
        const lane = BRIDGE_XS[Math.random() < 0.5 ? 0 : 1];
        const tankOpts = ["ariete", "golem", "cavaliere"].filter((k) => CARDS[k].cost <= g.eElixir);
        const tank = tankOpts.length ? tankOpts[Math.floor(Math.random() * Math.min(2, tankOpts.length))] : "cavaliere";
        g.eElixir -= CARDS[tank].cost;
        let y = 140 + Math.random() * 100;
        const pLt = g.towers[3];
        const pRt = g.towers[4];
        if (!pLt.alive && lane === BRIDGE_XS[0]) y = Math.max(y, pLt.y - 90);
        if (!pRt.alive && lane === BRIDGE_XS[1]) y = Math.max(y, pRt.y - 90);
        deploy(g, tank, lane + (Math.random() * 20 - 10), Math.min(y, RIVER_Y - 60), "e");
        const sup = ["stregone", "balestriere", "piromante", "guardia"][Math.floor(Math.random() * 4)];
        g.aiPlan.push({ key: sup, x: lane + (Math.random() * 30 - 15), y: 120 + Math.random() * 60 });
        g.aiT = 120 + Math.random() * 80;
      } else if (g.eElixir >= 5 && Math.random() < 0.4) {
        const opts = DECK.filter((d) => CARDS[d].cost <= g.eElixir);
        const k = opts[Math.floor(Math.random() * Math.min(3, opts.length))];
        if (k) {
          g.eElixir -= CARDS[k].cost;
          deploy(g, k, BRIDGE_XS[Math.random() < 0.5 ? 0 : 1], 160 + Math.random() * 100, "e");
        }
        g.aiT = 140 + Math.random() * 90;
      } else {
        g.aiT = 80 + Math.random() * 60;
      }
    };

    // ============ RENDER ============
    const drawRiver = () => {
      const top = RIVER_Y - RIVER_H / 2;
      ctx.fillStyle = riverGrad;
      ctx.fillRect(0, top, W, RIVER_H);
      ctx.fillStyle = "#3a5f2b";
      ctx.fillRect(0, top - 4, W, 4);
      ctx.fillRect(0, top + RIVER_H, W, 4);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      const off = (performance.now() / 26) % 64;
      for (let i = -1; i < W / 64 + 1; i++) {
        ctx.fillRect(i * 64 + off, RIVER_Y - 9, 22, 2.5);
        ctx.fillRect(i * 64 + off + 32, RIVER_Y + 4, 16, 2.5);
        ctx.fillRect(i * 64 + off + 12, RIVER_Y + 15, 20, 2);
      }
    };

    const drawBridges = () => {
      for (const bx of BRIDGE_XS) {
        const top = RIVER_Y - RIVER_H / 2 - 6;
        const h = RIVER_H + 12;
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(bx - BRIDGE_W / 2 - 2, top + 2, BRIDGE_W + 4, h);
        ctx.fillStyle = "#6b4a2a";
        ctx.fillRect(bx - BRIDGE_W / 2, top, BRIDGE_W, h);
        for (let yy = top + 1; yy < top + h - 4; yy += 6) {
          ctx.fillStyle = yy % 12 < 6 ? "#93683d" : "#7d5530";
          ctx.fillRect(bx - BRIDGE_W / 2 + 2, yy, BRIDGE_W - 4, 5);
        }
        ctx.strokeStyle = "#caa87e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx - BRIDGE_W / 2 + 2, top - 2);
        ctx.lineTo(bx - BRIDGE_W / 2 + 2, top + h + 2);
        ctx.moveTo(bx + BRIDGE_W / 2 - 2, top - 2);
        ctx.lineTo(bx + BRIDGE_W / 2 - 2, top + h + 2);
        ctx.stroke();
      }
    };

    const drawTower = (t) => {
      const team = t.side === "p" ? { main: "#3b82f6", dark: "#1d4ed8" } : { main: "#dc2626", dark: "#991b1b" };
      const s = t.r;
      if (!t.alive) {
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.beginPath();
        ctx.ellipse(t.x, t.y + s * 0.6, s * 1.1, s * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#6b6560";
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + 0.4;
          const d = s * 0.55;
          ctx.fillRect(t.x + Math.cos(a) * d - 5, t.y + Math.sin(a) * d * 0.7 - 4, 10, 9);
        }
        ctx.fillStyle = "#8a837c";
        ctx.fillRect(t.x - 11, t.y - 5, 22, 11);
        ctx.fillStyle = "#57534e";
        ctx.fillRect(t.x - 7, t.y - 8, 14, 7);
        return;
      }
      const hpFrac = Math.max(0, t.hp / t.maxHp);
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(t.x + 4, t.y + s * 0.75, s * 1.1, s * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      if (!t._g1) {
        t._g1 = ctx.createLinearGradient(t.x - s, t.y - s, t.x + s, t.y + s);
        t._g1.addColorStop(0, "#c8c3bd");
        t._g1.addColorStop(0.5, "#e7e4e0");
        t._g1.addColorStop(1, "#9a938c");
      }
      ctx.fillStyle = t._g1;
      ctx.fillRect(t.x - s, t.y - s, s * 2, s * 2);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(t.x - s, t.y + s - 5, s * 2, 5);
      ctx.strokeStyle = "rgba(0,0,0,0.1)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(t.x - s, t.y - s + (s * 2 / 4) * i);
        ctx.lineTo(t.x + s, t.y - s + (s * 2 / 4) * i);
        ctx.stroke();
      }
      ctx.fillStyle = "#8a837c";
      const mw = s * 2 / 5;
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(t.x - s + i * mw, t.y - s - 4, mw, 7);
        ctx.fillRect(t.x - s + i * mw, t.y + s - 3, mw, 6);
      }
      if (hpFrac < 0.6) {
        ctx.strokeStyle = "rgba(20,15,10,0.55)";
        ctx.lineWidth = 1.6;
        for (const c of t.cracks) {
          ctx.beginPath();
          ctx.moveTo(t.x + c[0] * s, t.y + c[1] * s);
          ctx.lineTo(t.x + c[2] * s, t.y + c[3] * s);
          ctx.stroke();
        }
      }
      if (!t._g2) {
        t._g2 = ctx.createRadialGradient(t.x - 4, t.y - 5, 2, t.x, t.y, s * 0.66);
        t._g2.addColorStop(0, team.main);
        t._g2.addColorStop(1, team.dark);
      }
      ctx.fillStyle = t._g2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, s * 0.64, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(t.x, t.y, s * 0.78, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = t.king ? "bold 13px serif" : "bold 10px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t.king ? "👑" : "✚", t.x, t.y + 0.5);
      if (t.king && !t.active) {
        ctx.fillStyle = "rgba(10,10,30,0.45)";
        ctx.beginPath();
        ctx.arc(t.x, t.y, s * 0.64, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "9px serif";
        ctx.fillText("💤", t.x, t.y + 0.5);
      }
      ctx.strokeStyle = "#44403c";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y - s - 4);
      ctx.lineTo(t.x, t.y - s - 15);
      ctx.stroke();
      const wave = Math.sin(performance.now() / 240 + t.x) * 1.5;
      ctx.fillStyle = team.main;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y - s - 15);
      ctx.lineTo(t.x + 9 + wave, t.y - s - 12);
      ctx.lineTo(t.x, t.y - s - 8);
      ctx.closePath();
      ctx.fill();
      const bw = t.king ? 54 : 46;
      const by = t.y - s - 26;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      rr(t.x - bw / 2 - 1.5, by - 1.5, bw + 3, 10, 4);
      ctx.fill();
      ctx.fillStyle = "#111827";
      rr(t.x - bw / 2, by, bw, 7, 3);
      ctx.fill();
      ctx.fillStyle = t.side === "p" ? "#3b82f6" : "#ef4444";
      rr(t.x - bw / 2, by, bw * hpFrac, 7, 3);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 8px monospace";
      ctx.textBaseline = "middle";
      ctx.fillText(String(Math.ceil(Math.max(0, t.hp))), t.x, by + 4.5);
    };

    const drawUnit = (u, now) => {
      const c = u.card;
      const walk = u.moving ? Math.sin(u.walkT * 1.6) * 3.5 : 0;
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.beginPath();
      ctx.ellipse(u.x, u.y + c.r * 0.75, c.r * 0.95, c.r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(u.x, u.y);
      ctx.rotate(u.face + Math.PI / 2);

      if (u.key === "lupi") {
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.ellipse(0, c.r * 0.2, c.r * 0.55, c.r * 0.95, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#4b5563";
        ctx.fillRect(-c.r * 0.5 + walk * 0.4, -c.r * 0.2, 3, 5);
        ctx.fillRect(c.r * 0.5 - walk * 0.4, -c.r * 0.2, 3, 5);
        ctx.fillRect(-c.r * 0.5 - walk * 0.4, c.r * 0.6, 3, 5);
        ctx.fillRect(c.r * 0.5 + walk * 0.4, c.r * 0.6, 3, 5);
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(0, -c.r * 0.65, c.r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#52525b";
        ctx.beginPath();
        ctx.moveTo(-3, -c.r * 1.05);
        ctx.lineTo(3, -c.r * 1.05);
        ctx.lineTo(0, -c.r * 1.45);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#4b5563";
        ctx.beginPath();
        ctx.moveTo(-c.r * 0.4, -c.r * 0.95);
        ctx.lineTo(-c.r * 0.15, -c.r * 1.3);
        ctx.lineTo(-c.r * 0.02, -c.r * 0.95);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(c.r * 0.4, -c.r * 0.95);
        ctx.lineTo(c.r * 0.15, -c.r * 1.3);
        ctx.lineTo(c.r * 0.02, -c.r * 0.95);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = u.cd < c.hit * 0.4 ? "#fca5a5" : "#fbbf24";
        ctx.fillRect(-c.r * 0.35, -c.r * 0.75, 2, 2);
        ctx.fillRect(c.r * 0.35 - 2, -c.r * 0.75, 2, 2);
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, c.r * 1.1);
        ctx.quadraticCurveTo(walk, c.r * 1.6, -walk * 1.2, c.r * 2);
        ctx.stroke();
      } else if (u.key === "cavaliere") {
        ctx.fillStyle = "#5b3a1e";
        ctx.beginPath();
        ctx.ellipse(0, c.r * 0.2, c.r * 0.6, c.r * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#43290f";
        const legA = u.moving ? walk : 0;
        ctx.fillRect(-c.r * 0.55 + legA * 0.5, -c.r * 0.5, 4, 8);
        ctx.fillRect(c.r * 0.55 - legA * 0.5, -c.r * 0.5, 4, 8);
        ctx.fillRect(-c.r * 0.55 - legA * 0.5, c.r * 0.9, 4, 8);
        ctx.fillRect(c.r * 0.55 + legA * 0.5, c.r * 0.9, 4, 8);
        ctx.fillStyle = "#5b3a1e";
        ctx.beginPath();
        ctx.ellipse(-c.r * 0.45, -c.r * 1.15, c.r * 0.38, c.r * 0.55, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(0, -c.r * 1.5, 3, c.r * 0.6);
        ctx.fillStyle = "#292018";
        ctx.beginPath();
        ctx.arc(-c.r * 0.15, -c.r * 0.95, c.r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(c.r * 0.35, 0, c.r * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#d6d3d1";
        ctx.beginPath();
        ctx.arc(c.r * 0.35, -c.r * 0.05, c.r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#8a5a2b";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-c.r * 0.1, c.r * 0.1);
        ctx.lineTo(-c.r * 0.1, -c.r * 1.9);
        ctx.stroke();
        ctx.fillStyle = "#e5e7eb";
        ctx.beginPath();
        ctx.moveTo(-c.r * 0.1 - 2.5, -c.r * 1.9);
        ctx.lineTo(-c.r * 0.1 + 2.5, -c.r * 1.9);
        ctx.lineTo(-c.r * 0.1, -c.r * 2.25);
        ctx.closePath();
        ctx.fill();
      } else if (u.key === "ariete") {
        ctx.fillStyle = "#5b3a1e";
        ctx.fillRect(-c.r * 0.9, -c.r, c.r * 1.8, c.r * 2);
        ctx.fillStyle = "#8a5a2b";
        ctx.beginPath();
        ctx.moveTo(-c.r * 1.1, -c.r * 0.2);
        ctx.lineTo(0, -c.r * 1.25);
        ctx.lineTo(c.r * 1.1, -c.r * 0.2);
        ctx.lineTo(c.r * 0.9, c.r * 0.1);
        ctx.lineTo(-c.r * 0.9, c.r * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(i * c.r * 0.4, -c.r * 1.1 + Math.abs(i) * c.r * 0.18);
          ctx.lineTo(i * c.r * 0.4, c.r * 0.05);
          ctx.stroke();
        }
        ctx.fillStyle = "#3f2a12";
        const spin = u.walkT * 2;
        for (const wy of [-c.r * 0.55, c.r * 0.55]) {
          ctx.beginPath();
          ctx.arc(-c.r * 0.85, wy, 5, 0, Math.PI * 2);
          ctx.arc(c.r * 0.85, wy, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#a1785a";
          ctx.beginPath();
          ctx.moveTo(-c.r * 0.85 - Math.cos(spin) * 4, wy - Math.sin(spin) * 4);
          ctx.lineTo(-c.r * 0.85 + Math.cos(spin) * 4, wy + Math.sin(spin) * 4);
          ctx.stroke();
        }
        ctx.fillStyle = "#d6c9b8";
        ctx.beginPath();
        ctx.ellipse(0, -c.r * 1.35, c.r * 0.45, c.r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#8a7250";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(-c.r * 0.35, -c.r * 1.55, c.r * 0.3, Math.PI * 0.5, Math.PI * 1.5);
        ctx.arc(c.r * 0.35, -c.r * 1.55, c.r * 0.3, Math.PI * 1.5, Math.PI * 0.5);
        ctx.stroke();
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(-2, -c.r * 1.45, 2, 2);
        ctx.fillRect(0, -c.r * 1.45, 2, 2);
      } else {
        // figura umanoide
        ctx.fillStyle = "#3f3f46";
        ctx.beginPath();
        ctx.ellipse(-c.r * 0.42, walk * 0.5, c.r * 0.28, c.r * 0.5, 0, 0, Math.PI * 2);
        ctx.ellipse(c.r * 0.42, -walk * 0.5, c.r * 0.28, c.r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        if (!c._bg) {
          c._bg = ctx.createLinearGradient(-c.r, -c.r, c.r, c.r);
          c._bg.addColorStop(0, c.color);
          c._bg.addColorStop(1, "rgba(0,0,0,0.45)");
        }
        ctx.fillStyle = c._bg;
        ctx.beginPath();
        ctx.ellipse(0, 0, c.r * 0.85, c.r * 0.68, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = u.side === "p" ? "#1d4ed8" : "#991b1b";
        ctx.stroke();
        ctx.fillStyle = "#d6d3d1";
        ctx.beginPath();
        ctx.ellipse(-c.r * 0.72, -c.r * 0.2, c.r * 0.26, c.r * 0.2, -0.5, 0, Math.PI * 2);
        ctx.ellipse(c.r * 0.72, -c.r * 0.2, c.r * 0.26, c.r * 0.2, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e8c39e";
        ctx.beginPath();
        ctx.arc(0, -c.r * 0.35, c.r * 0.36, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#a8a29e";
        ctx.beginPath();
        ctx.arc(0, -c.r * 0.42, c.r * 0.36, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-c.r * 0.36, -c.r * 0.44, c.r * 0.72, 2.5);
        ctx.fillStyle = u.side === "p" ? "#60a5fa" : "#f87171";
        ctx.beginPath();
        ctx.ellipse(0, -c.r * 0.85, c.r * 0.14, c.r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        const lunge = u.cd > c.hit - 12 ? 3 : 0;
        if (u.key === "spadaccino") {
          ctx.save();
          ctx.translate(c.r * 0.55, -c.r * 0.5 - lunge);
          ctx.rotate(0.25);
          ctx.fillStyle = "#f1f1f3";
          ctx.fillRect(-1.5, -c.r * 1.6, 3, c.r * 1.5);
          ctx.fillStyle = "#92400e";
          ctx.fillRect(-3.5, 0, 7, 3);
          ctx.fillStyle = "#78350f";
          ctx.fillRect(-1.5, 3, 3, 6);
          ctx.restore();
        } else if (u.key === "balestriere") {
          ctx.save();
          ctx.translate(0, -c.r * 0.8 - lunge * 0.5);
          ctx.fillStyle = "#5b3a1e";
          ctx.fillRect(-c.r * 0.85, -2.5, c.r * 1.7, 5);
          ctx.strokeStyle = "#8a5a2b";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, c.r * 0.85, -Math.PI * 0.75, -Math.PI * 0.25);
          ctx.stroke();
          ctx.strokeStyle = "#d6d3d1";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-c.r * 0.62, -c.r * 0.62);
          ctx.lineTo(0, 3);
          ctx.lineTo(c.r * 0.62, -c.r * 0.62);
          ctx.stroke();
          ctx.fillStyle = "#44403c";
          ctx.fillRect(-1, -6, 2, 8);
          ctx.restore();
        } else if (u.key === "piromante") {
          ctx.strokeStyle = "#44403c";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(c.r * 0.5, c.r * 0.3);
          ctx.lineTo(c.r * 0.3, -c.r * 1.2 - lunge);
          ctx.stroke();
          const flick = Math.sin(now / 60 + u.walkT) * 2;
          ctx.fillStyle = "rgba(249,115,22,0.35)";
          ctx.beginPath();
          ctx.arc(c.r * 0.3, -c.r * 1.5, 8 + flick, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#f97316";
          ctx.beginPath();
          ctx.arc(c.r * 0.3, -c.r * 1.5, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fef3c7";
          ctx.beginPath();
          ctx.arc(c.r * 0.3, -c.r * 1.5, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#7c2d12";
          ctx.beginPath();
          ctx.arc(0, -c.r * 0.42, c.r * 0.4, Math.PI, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      if (u.flash > 0) {
        ctx.globalAlpha = Math.min(0.75, u.flash / 8);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(u.x, u.y, c.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      const bw = c.r * 2.2;
      const by = u.y - c.r - 10;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      rr(u.x - bw / 2 - 1, by - 1, bw + 2, 5.5, 2.5);
      ctx.fill();
      ctx.fillStyle = u.side === "p" ? "#3b82f6" : "#ef4444";
      rr(u.x - bw / 2, by, bw * Math.max(0, u.hp / u.maxHp), 4, 2);
      ctx.fill();
    };

    const drawShot = (sh) => {
      const a = Math.atan2(sh.py - sh.y, sh.px - sh.x);
      const p = Math.min(1, Math.max(0, sh.travel / Math.max(1, sh.dist0)));
      const arc = Math.sin(p * Math.PI) * 10;
      ctx.save();
      ctx.translate(sh.x, sh.y - arc);
      ctx.rotate(a);
      if (sh.kind === "fire") {
        ctx.fillStyle = "rgba(249,115,22,0.3)";
        ctx.beginPath();
        ctx.ellipse(-9, 0, 8, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fef3c7";
        ctx.beginPath();
        ctx.arc(1, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = "#8a5a2b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-9, 0);
        ctx.lineTo(4, 0);
        ctx.stroke();
        ctx.fillStyle = "#e5e7eb";
        ctx.beginPath();
        ctx.moveTo(4, -2.5);
        ctx.lineTo(9, 0);
        ctx.lineTo(4, 2.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#d6d3d1";
        ctx.beginPath();
        ctx.moveTo(-9, 0);
        ctx.lineTo(-12, -2.5);
        ctx.lineTo(-12, 2.5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    };

    // ============ LOOP ============
    const loop = (now) => {
      const g = gRef.current;
      const running = phaseRef.current === "running";
      const dt = Math.min((now - last) / 16.67, 2.5);
      last = now;

      if (running && g && !g.over) {
        g.pElixir = Math.min(10, g.pElixir + dt / (g.double ? 84 : 168));
        aiThink(g, dt);

        if (g.sudden) {
          g.suddenTimer -= dt;
          if (g.suddenTimer <= 0) {
            const pAlive = g.towers.filter((t) => t.side === "p" && t.alive);
            const eAlive = g.towers.filter((t) => t.side === "e" && t.alive);
            const minP = pAlive.length ? Math.min(...pAlive.map((t) => t.hp / t.maxHp)) : 0;
            const minE = eAlive.length ? Math.min(...eAlive.map((t) => t.hp / t.maxHp)) : 0;
            finish(g, minP === minE ? "draw" : minP > minE ? "win" : "lose");
          }
        } else {
          g.timer -= dt;
          if (g.timer <= 60 * 60 && !g.double) {
            g.double = true;
            g.banner = "🧪 ELISIR DOPPIO!";
            g.bannerT = 120;
          }
          if (g.timer <= 0) {
            if (g.crownsP !== g.crownsE) finish(g, g.crownsP > g.crownsE ? "win" : "lose");
            else {
              g.sudden = true;
              g.banner = "⚔️ MORTE IMPROVVISA!";
              g.bannerT = 150;
            }
          }
        }

        for (const u of g.units) {
          if (u.hp <= 0) continue;
          if (u.flash > 0) u.flash -= dt;
          const target = findTarget(g, u);
          if (!target) continue;
          const dist = Math.hypot(target.x - u.x, target.y - u.y) - (target.r || target.card.r) - u.card.r;
          u.face = Math.atan2(target.y - u.y, target.x - u.x);
          u.cd -= dt;
          if (dist <= u.card.range) {
            u.moving = false;
            if (u.cd <= 0) {
              u.cd = u.card.hit;
              if (u.card.proj) {
                const sx = u.x + Math.cos(u.face) * u.card.r;
                const sy = u.y + Math.sin(u.face) * u.card.r;
                g.shots.push({
                  x: sx, y: sy, target, px: target.x, py: target.y,
                  dmg: u.card.dmg, splash: u.card.splash || 0,
                  side: u.side, kind: u.card.proj,
                  dist0: Math.hypot(target.x - sx, target.y - sy), travel: 0,
                });
              } else {
                damage(g, target, u.card.dmg);
                g.fx.push({ x: (u.x + target.x) / 2, y: (u.y + target.y) / 2, t: 7, color: "rgba(255,255,255,0.85)" });
              }
            }
          } else {
            u.moving = true;
            u.walkT += dt * (u.card.speed > 1.5 ? 0.5 : 0.35);
            let gx = target.x;
            let gy = target.y;
            const meSide = u.y < RIVER_Y - 26 ? "top" : u.y > RIVER_Y + 26 ? "bottom" : "mid";
            const tSide = target.y < RIVER_Y - 26 ? "top" : target.y > RIVER_Y + 26 ? "bottom" : "mid";
            const needCross = meSide !== "mid" && tSide !== "mid" && meSide !== tSide;
            if (needCross) {
              const bx = nearestBridge(u.x);
              const inBand = Math.abs(u.y - RIVER_Y) < RIVER_H / 2 + 4;
              if (inBand) {
                // sul ponte: prima si allinea, poi avanza dritto
                if (Math.abs(u.x - bx) > 3) {
                  gx = bx;
                  gy = u.y;
                } else {
                  gx = u.x;
                  gy = RIVER_Y + (u.side === "p" ? -1 : 1) * (RIVER_H / 2 + 10);
                }
              } else if (Math.abs(u.y - RIVER_Y) < 170 && Math.abs(u.x - bx) > 24) {
                gx = bx;
                gy = RIVER_Y + (u.side === "p" ? 40 : -40);
              }
            }
            const a = Math.atan2(gy - u.y, gx - u.x);
            u.x += Math.cos(a) * u.card.speed * dt * 0.8;
            u.y += Math.sin(a) * u.card.speed * dt * 0.8;
            // sicurezza: mai nel fiume fuori dai ponti
            if (Math.abs(u.y - RIVER_Y) < RIVER_H / 2 - 4) {
              const bx = nearestBridge(u.x);
              if (Math.abs(u.x - bx) > BRIDGE_W / 2 - 6) {
                u.y = RIVER_Y + (u.y > RIVER_Y ? 1 : -1) * (RIVER_H / 2 - 4);
              }
            }
            if (Math.random() < 0.05) {
              g.fx.push({ x: u.x + (Math.random() * 8 - 4), y: u.y + u.card.r * 0.7, t: 14, color: "rgba(120,110,80,0.35)", puff: true });
            }
          }
        }

        // separazione
        const alive = g.units.filter((u) => u.hp > 0);
        for (let i = 0; i < alive.length; i++) {
          for (let j = i + 1; j < alive.length; j++) {
            const a = alive[i];
            const b = alive[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const d = Math.hypot(dx, dy);
            const min = a.card.r + b.card.r;
            if (d > 0 && d < min) {
              const push = (min - d) / 2;
              const nx = dx / d;
              const ny = dy / d;
              a.x -= nx * push * 0.6;
              a.y -= ny * push * 0.6;
              b.x += nx * push * 0.6;
              b.y += ny * push * 0.6;
            }
          }
        }

        for (const t of g.towers) {
          if (!t.alive) continue;
          if (t.king && !t.active) continue;
          t.cd -= dt;
          if (t.cd > 0) continue;
          let best = null;
          let bestD = Infinity;
          for (const u of g.units) {
            if (u.hp <= 0 || u.side === t.side) continue;
            const d = Math.hypot(u.x - t.x, u.y - t.y) - u.card.r;
            if (d < t.range && d < bestD) { best = u; bestD = d; }
          }
          if (best) {
            t.cd = t.hit;
            g.shots.push({
              x: t.x, y: t.y - 10, target: best, px: best.x, py: best.y,
              dmg: t.dmg, splash: 0, side: t.side, kind: "arrow",
              dist0: Math.hypot(best.x - t.x, best.y - t.y), travel: 0,
            });
          }
        }

        for (const sh of g.shots) {
          const tgt = sh.target && sh.target.hp > 0 && (sh.target.alive === undefined || sh.target.alive) ? sh.target : null;
          if (tgt) { sh.px = tgt.x; sh.py = tgt.y; }
          const a = Math.atan2(sh.py - sh.y, sh.px - sh.x);
          const step = 6 * dt;
          sh.x += Math.cos(a) * step;
          sh.y += Math.sin(a) * step;
          sh.travel += step;
          if (sh.kind === "fire" && Math.random() < 0.5) {
            g.fx.push({ x: sh.x, y: sh.y, t: 10, color: "rgba(249,115,22,0.45)", puff: true });
          }
          if (Math.hypot(sh.px - sh.x, sh.py - sh.y) < 8 || sh.travel > sh.dist0 + 120) {
            sh.dead = true;
            if (sh.splash > 0) {
              for (const u of g.units) {
                if (u.hp > 0 && u.side !== sh.side && Math.hypot(u.x - sh.px, u.y - sh.py) < sh.splash) {
                  damage(g, u, sh.dmg);
                }
              }
              g.fx.push({ x: sh.px, y: sh.py, t: 16, dur: 16, color: "#f97316", ring: true, rad: sh.splash });
            } else if (tgt) {
              damage(g, tgt, sh.dmg);
              g.fx.push({ x: sh.px, y: sh.py, t: 8, color: "rgba(255,255,255,0.8)" });
            }
          }
        }
        g.shots = g.shots.filter((s) => !s.dead);
        g.units = g.units.filter((u) => u.hp > 0);

        for (const f of g.fx) {
          f.t -= dt;
          if (f.vx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 0.05 * dt; }
        }
        g.fx = g.fx.filter((f) => f.t > 0);
        if (g.shake > 0) g.shake -= dt;
        if (g.bannerT > 0) g.bannerT -= dt;
      }

      // ============ RENDER ============
      const g2 = gRef.current;
      ctx.save();
      if (g2 && g2.shake > 0) {
        ctx.translate((Math.random() - 0.5) * g2.shake * 0.8, (Math.random() - 0.5) * g2.shake * 0.8);
      }

      ctx.drawImage(bgCanvas, 0, 0);

      if (g2) {
        if (running) {
          ctx.fillStyle = "rgba(120,190,255,0.10)";
          ctx.fillRect(0, RIVER_Y + RIVER_H / 2 + 8, W, H - RIVER_Y - RIVER_H / 2 - 8);
          if (!g2.towers[0].alive) {
            ctx.fillRect(0, g2.towers[0].y + 55, 230, RIVER_Y - 10 - (g2.towers[0].y + 55));
          }
          if (!g2.towers[1].alive) {
            ctx.fillRect(230, g2.towers[1].y + 55, W - 230, RIVER_Y - 10 - (g2.towers[1].y + 55));
          }
        }

        drawRiver();
        drawBridges();

        for (const t of g2.towers) drawTower(t);

        for (const f of g2.fx) {
          ctx.globalAlpha = Math.min(1, f.t / 10);
          if (f.ring) {
            ctx.strokeStyle = f.color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(f.x, f.y, Math.max(0, f.rad * (1 - f.t / (f.dur || 22))), 0, Math.PI * 2);
            ctx.stroke();
          } else if (f.big) {
            ctx.font = "22px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("💥", f.x, f.y);
          } else if (f.poof) {
            ctx.fillStyle = f.color;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.rad * (1 - f.t / 24), 0, Math.PI * 2);
            ctx.fill();
          } else if (f.puff) {
            ctx.fillStyle = f.color;
            ctx.beginPath();
            ctx.arc(f.x, f.y, 4 * (1 - f.t / 14) + 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = f.color;
            ctx.beginPath();
            ctx.arc(f.x, f.y, 4 * (f.t / 20), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;

        for (const u of g2.units) drawUnit(u, now);
        for (const sh of g2.shots) drawShot(sh);

        const selIdx = g2.dragging >= 0 ? g2.dragging : g2.selected;
        if (running && selIdx >= 0) {
          const card = CARDS[g2.hand[selIdx]];
          const m = mouseRef.current;
          if (m.inside) {
            const valid = canDeployP(g2, m.x, m.y) && g2.pElixir >= card.cost;
            ctx.strokeStyle = valid ? "rgba(134,239,172,0.95)" : "rgba(248,113,113,0.9)";
            ctx.lineWidth = 2.5;
            ctx.setLineDash([7, 5]);
            ctx.beginPath();
            ctx.arc(m.x, m.y, 22, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = valid ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.15)";
            ctx.beginPath();
            ctx.arc(m.x, m.y, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = "16px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#fff";
            ctx.fillText(card.icon, m.x, m.y);
            ctx.strokeStyle = "rgba(255,255,255,0.3)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(m.x, m.y, card.sight > 900 ? 60 : Math.min(card.sight, 90), 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        if (g2.bannerT > 0 && g2.banner) {
          ctx.globalAlpha = Math.min(1, g2.bannerT / 40);
          ctx.font = "bold 17px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const bw2 = ctx.measureText(g2.banner).width + 30;
          ctx.fillStyle = "rgba(0,0,0,0.55)";
          rr(W / 2 - bw2 / 2, RIVER_Y - 68, bw2, 30, 8);
          ctx.fill();
          ctx.fillStyle = "#fde68a";
          ctx.fillText(g2.banner, W / 2, RIVER_Y - 53);
          ctx.globalAlpha = 1;
        }
      }

      ctx.restore();
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    // ---------- input ----------
    const onMove = (e) => {
      const p = toCanvas(e);
      mouseRef.current = { ...p, inside: p.in };
    };
    const onLeave = () => { mouseRef.current.inside = false; };
    const onDown = (e) => {
      const g = gRef.current;
      const p = toCanvas(e);
      if (phaseRef.current === "running" && g) {
        if (g.dragging < 0 && g.selected >= 0 && p.in && canDeployP(g, p.x, p.y)) {
          const card = CARDS[g.hand[g.selected]];
          if (g.pElixir >= card.cost) {
            g.pElixir -= card.cost;
            deploy(g, g.hand[g.selected], p.x, p.y, "p");
            const played = g.hand[g.selected];
            g.hand[g.selected] = g.queue.shift();
            g.queue.push(played);
            g.selected = -1;
          }
        }
      }
    };
    const moveWin = (e) => {
      const g = gRef.current;
      if (g && g.dragging >= 0) {
        const p = toCanvas(e);
        mouseRef.current = { ...p, inside: p.in };
        if (Math.hypot(e.clientX - g.dragSX, e.clientY - g.dragSY) > 8) g.dragMoved = true;
      }
    };
    const onUpGlobal = (e) => {
      const g = gRef.current;
      if (phaseRef.current !== "running" || !g || g.dragging < 0) return;
      const p = toCanvas(e);
      const card = CARDS[g.hand[g.dragging]];
      if (p.in && canDeployP(g, p.x, p.y) && g.pElixir >= card.cost) {
        g.pElixir -= card.cost;
        deploy(g, g.hand[g.dragging], p.x, p.y, "p");
        const played = g.hand[g.dragging];
        g.hand[g.dragging] = g.queue.shift();
        g.queue.push(played);
        g.selected = -1;
      } else if (!p.in && g.dragTap && !g.dragMoved) {
        // tap sulla carta: resta selezionata (o si deseleziona se lo era già)
        if (g.dragPrevSel) g.selected = -1;
      } else {
        g.selected = -1;
      }
      g.dragging = -1;
      g.dragTap = false;
      g.dragMoved = false;
      g.dragPrevSel = false;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", moveWin);
    window.addEventListener("pointerup", onUpGlobal);

    const uiInterval = setInterval(() => {
      const g = gRef.current;
      if (!g) return;
      const secs = g.sudden ? Math.max(0, Math.ceil(g.suddenTimer / 60)) : Math.max(0, Math.ceil(g.timer / 60));
      const mm = Math.floor(secs / 60);
      const ss = secs % 60;
      setUi((prev) => {
        const next = {
          ...prev,
          elixir: Math.floor(g.pElixir),
          elixirFrac: Math.round((g.pElixir / 10) * 40) / 40,
          hand: prev.hand.length === g.hand.length && prev.hand.every((k, i) => k === g.hand[i]) ? prev.hand : [...g.hand],
          next: g.queue[0],
          crownsP: g.crownsP,
          crownsE: g.crownsE,
          time: `${mm}:${String(ss).padStart(2, "0")}`,
          timeFrac: g.sudden ? g.suddenTimer / (60 * 60) : g.timer / (180 * 60),
          double: g.double,
          sudden: g.sudden,
          selected: g.selected,
          dragging: g.dragging,
        };
        if (
          prev.elixir === next.elixir && prev.elixirFrac === next.elixirFrac &&
          prev.hand === next.hand && prev.next === next.next &&
          prev.crownsP === next.crownsP && prev.crownsE === next.crownsE &&
          prev.time === next.time && prev.double === next.double &&
          prev.sudden === next.sudden && prev.selected === next.selected &&
          prev.dragging === next.dragging
        ) return prev;
        return next;
      });
    }, 100);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(uiInterval);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", moveWin);
      window.removeEventListener("pointerup", onUpGlobal);
    };
  }, [startGame, setPhaseBoth]);

  const nextCard = ui.next ? CARDS[ui.next] : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 p-4">
      <div className="flex w-full max-w-4xl flex-col gap-3 lg:flex-row lg:items-start lg:justify-center">
        <div className="w-full lg:w-[460px]">
          <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 shadow-lg">
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className={`text-lg leading-none ${ui.crownsP > i ? "" : "opacity-20 grayscale"}`}>👑</span>
              ))}
            </div>
            <div className="flex-1 text-center">
              <div className={`font-mono text-sm font-bold ${ui.sudden ? "text-red-400" : ui.timeFrac < 0.2 ? "text-amber-300" : "text-slate-200"}`}>
                {ui.sudden ? "⚔️ " : ""}{ui.time}
                {ui.double && !ui.sudden && <span className="text-fuchsia-400"> · x2</span>}
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${ui.sudden ? "bg-red-500" : "bg-sky-400"}`}
                  style={{ width: `${Math.max(0, ui.timeFrac) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex flex-row-reverse items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className={`text-lg leading-none ${ui.crownsE > i ? "" : "opacity-20 grayscale"}`}>👑</span>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border-2 border-amber-900/60 shadow-2xl">
            <canvas ref={canvasRef} width={W} height={H} className="block w-full" />

            {phase !== "running" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/80 p-4 text-center backdrop-blur-sm">
                {phase === "win" ? (
                  <>
                    <div className="text-5xl">🏆</div>
                    <div className="font-mono text-2xl font-bold text-amber-400">VITTORIA!</div>
                    <div className="font-mono text-sm text-slate-300">Corone: {ui.crownsP} – {ui.crownsE}</div>
                  </>
                ) : phase === "dead" ? (
                  <>
                    <div className="text-5xl">💀</div>
                    <div className="font-mono text-2xl font-bold text-red-400">SCONFITTA</div>
                    <div className="font-mono text-sm text-slate-300">Corone: {ui.crownsP} – {ui.crownsE}</div>
                  </>
                ) : phase === "draw" ? (
                  <>
                    <div className="text-5xl">🤝</div>
                    <div className="font-mono text-2xl font-bold text-slate-200">PAREGGIO</div>
                  </>
                ) : (
                  <>
                    <div className="text-5xl">👑</div>
                    <div className="font-mono text-2xl font-bold text-slate-100">Arena Battle</div>
                    <div className="max-w-xs font-mono text-xs text-slate-400">
                      Trascina le carte sul campo o selezionale e clicca. Distruggi la corona nemica!
                    </div>
                  </>
                )}
                <button
                  className="mt-2 rounded-lg bg-gradient-to-b from-amber-400 to-amber-600 px-8 py-2.5 font-bold text-slate-900 shadow-lg transition hover:brightness-110 active:scale-95"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    startGame();
                  }}
                >
                  {phase === "idle" ? "▶ Gioca" : "↻ Rivincita"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg leading-none">🧪</span>
            <div className="relative h-6 flex-1 overflow-hidden rounded-md border border-purple-900/60 bg-slate-800 shadow-inner">
              <div
                className="h-full bg-gradient-to-b from-fuchsia-400 to-purple-600"
                style={{ width: `${ui.elixirFrac * 100}%` }}
              />
              <div className="absolute inset-0 flex">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="flex-1 border-r border-purple-950/40 last:border-r-0" />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-white drop-shadow">
                {ui.elixir}/10 {ui.double && <span className="ml-1 text-fuchsia-200">x2</span>}
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-end gap-2">
            <div className="w-11 shrink-0 text-center">
              <div className="font-mono text-[9px] text-slate-400">pross.</div>
              <div className="mt-0.5 rounded-md border border-slate-700 bg-slate-800 p-1 text-sm">
                {nextCard ? nextCard.icon : "…"}
              </div>
            </div>
            <div className="grid flex-1 grid-cols-4 gap-2">
              {ui.hand.map((k, i) => {
                const c = CARDS[k];
                const isSel = ui.selected === i || ui.dragging === i;
                const can = ui.elixir >= c.cost;
                return (
                  <button
                    key={`${k}-${i}`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      playCard(i, true, e);
                    }}
                    className={`relative cursor-grab touch-none select-none overflow-hidden rounded-lg border-2 pb-4 pt-1.5 text-center transition ${
                      isSel
                        ? "border-amber-300 bg-amber-500/20 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                        : can
                        ? "border-slate-500 hover:border-slate-300"
                        : "border-slate-800 opacity-60"
                    }`}
                    style={{
                      backgroundImage: `linear-gradient(180deg, ${c.color}55 0%, #0f172a 75%)`,
                    }}
                  >
                    <div className="text-xl leading-none drop-shadow">{c.icon}</div>
                    <div className="mt-0.5 truncate px-0.5 font-mono text-[9px] text-slate-100">{c.name}</div>
                    <div
                      className={`absolute bottom-0.5 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full font-mono text-[10px] font-bold text-white shadow ${
                        can ? "bg-purple-600" : "bg-slate-600"
                      }`}
                    >
                      {c.cost}
                    </div>
                    {isSel && (
                      <div className="absolute right-0.5 top-0.5 font-mono text-[9px] text-amber-300">{i + 1}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-2 text-center font-mono text-[11px] text-slate-400">
            Trascina una carta sul campo (o clic + clic) · tasti 1-4 · la zona blu si espande se distruggi una torre
          </p>
        </div>

        <div className="w-full max-w-xs rounded-xl border border-slate-700 bg-slate-900/80 p-4 lg:w-64">
          <h3 className="mb-2 font-mono text-sm font-bold text-slate-200">Mazzo</h3>
          <div className="flex flex-col gap-2">
            {Object.values(CARDS).map((c) => (
              <div key={c.key} className="flex items-center gap-2 rounded-md bg-slate-800 p-2">
                <span className="text-lg">{c.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-[11px] text-slate-200">{c.name}</div>
                  <div className="font-mono text-[9px] text-slate-400">{c.desc}</div>
                  <div className="font-mono text-[9px] text-slate-500">
                    ❤️ {c.hp}{c.count > 1 ? `×${c.count}` : ""} · ⚔️ {c.dmg}
                    {c.splash ? " · 💥 area" : ""}
                  </div>
                </div>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 font-mono text-[10px] font-bold text-white">
                  {c.cost}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-md bg-slate-800 p-2 font-mono text-[10px] leading-relaxed text-slate-400">
            3 minuti, elisir doppio nell'ultimo minuto.
            Parità → morte improvvisa: la prima corona vince, allo scadere vince
            chi ha la torre più integra. Distruggi una torre per schierare più avanti!
          </div>
        </div>
      </div>
    </div>
  );
}
