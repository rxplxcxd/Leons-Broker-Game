/* ═══════════════════════════════════════════════════════════
   CYBERBROKER – App Engine
   Hybrid-Marktdaten (Simulation + optional Finnhub Live),
   Broker, Orders, Bots, Ligen, Stakes, Academy
═══════════════════════════════════════════════════════════ */
'use strict';

/* ─────────── Helpers ─────────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = (n, d = 2) => Number(n).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const usd = (n, d = 2) => fmt(n, d) + ' $';
const usdShort = n => Math.abs(n) >= 1e6 ? fmt(n / 1e6, 2) + ' Mio $' : Math.abs(n) >= 1e4 ? fmt(n / 1e3, 1) + 'k $' : usd(n, 0);
const pct = (n, d = 2) => (n >= 0 ? '+' : '') + fmt(n, d) + '%';
const cls = n => (n >= 0 ? 'positive' : 'negative');
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const img3d = (name, size = 28, extra = '') => `<img src="assets/3d/${name}.png" width="${size}" height="${size}" alt="" class="i3d" ${extra}/>`;
const code6 = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);

/* ─────────── Stammdaten: 50 Aktien ─────────── */
// [Symbol, Name, Sektor, Kurs, MarketCap (Mrd $), KGV, Div.%, Beta]
const STOCK_DATA = [
  ['AAPL','Apple Inc.','tech',228,3450,34,0.44,1.2],['MSFT','Microsoft Corp.','tech',415,3080,35,0.72,0.9],
  ['NVDA','NVIDIA Corp.','tech',138,3390,55,0.03,1.7],['GOOGL','Alphabet Inc.','tech',172,2110,23,0.47,1.05],
  ['AMZN','Amazon.com Inc.','consumer',195,2050,42,0,1.15],['META','Meta Platforms','tech',575,1450,27,0.35,1.25],
  ['TSLA','Tesla Inc.','consumer',250,800,68,0,2.0],['AVGO','Broadcom Inc.','tech',168,785,38,1.3,1.2],
  ['AMD','Advanced Micro Devices','tech',150,243,110,0,1.75],['ORCL','Oracle Corp.','tech',172,475,40,0.93,1.0],
  ['CRM','Salesforce Inc.','tech',290,280,48,0.55,1.2],['ADBE','Adobe Inc.','tech',505,225,42,0,1.25],
  ['INTC','Intel Corp.','tech',23,100,0,2.1,1.05],['NFLX','Netflix Inc.','consumer',760,325,43,0,1.3],
  ['PLTR','Palantir Technologies','tech',42,95,200,0,2.4],['SAP','SAP SE','tech',230,270,48,1.0,1.05],
  ['ASML','ASML Holding','tech',690,275,36,0.9,1.3],['JPM','JPMorgan Chase','finance',222,630,12,2.1,1.1],
  ['BAC','Bank of America','finance',42,325,14,2.4,1.3],['V','Visa Inc.','finance',290,565,30,0.75,0.95],
  ['MA','Mastercard Inc.','finance',505,465,37,0.55,1.05],['GS','Goldman Sachs','finance',520,165,15,2.2,1.35],
  ['BRK.B','Berkshire Hathaway','finance',455,985,13,0,0.85],['PYPL','PayPal Holdings','finance',80,80,19,0,1.4],
  ['ALV','Allianz SE','finance',290,115,12,4.8,0.95],['JNJ','Johnson & Johnson','health',155,375,23,3.2,0.55],
  ['LLY','Eli Lilly','health',820,780,90,0.65,0.45],['UNH','UnitedHealth Group','health',575,530,36,1.45,0.6],
  ['PFE','Pfizer Inc.','health',28,160,38,6.0,0.65],['MRK','Merck & Co.','health',100,255,21,3.1,0.4],
  ['ABBV','AbbVie Inc.','health',190,335,65,3.4,0.6],['NVO','Novo Nordisk','health',110,490,35,1.3,0.5],
  ['TMO','Thermo Fisher','health',540,205,33,0.3,0.8],['XOM','Exxon Mobil','energy',118,520,14,3.3,0.9],
  ['CVX','Chevron Corp.','energy',150,270,16,4.3,1.0],['SHEL','Shell plc','energy',65,205,13,4.1,0.85],
  ['COP','ConocoPhillips','energy',108,140,13,2.9,1.15],['NEE','NextEra Energy','energy',78,160,22,2.7,0.55],
  ['ENPH','Enphase Energy','energy',75,10,60,0,2.1],['FSLR','First Solar','energy',195,21,17,0,1.6],
  ['BP','BP plc','energy',30,82,9,6.1,0.9],['KO','Coca-Cola Co.','consumer',64,275,26,3.0,0.55],
  ['PEP','PepsiCo Inc.','consumer',160,220,23,3.3,0.5],['MCD',"McDonald's Corp.",'consumer',295,212,25,2.3,0.65],
  ['NKE','Nike Inc.','consumer',78,117,22,2.0,1.05],['SBUX','Starbucks Corp.','consumer',98,111,29,2.4,0.95],
  ['WMT','Walmart Inc.','consumer',82,660,35,1.0,0.5],['COST','Costco Wholesale','consumer',900,400,53,0.5,0.75],
  ['DIS','Walt Disney Co.','consumer',96,175,35,0.9,1.25],['PG','Procter & Gamble','consumer',168,395,27,2.4,0.4]
];
const SECTORS = { tech: { n: 'Tech', c: '#00ff88' }, health: { n: 'Health', c: '#4cc9f0' }, energy: { n: 'Energie', c: '#ffc857' }, finance: { n: 'Finanz', c: '#9d7cff' }, consumer: { n: 'Konsum', c: '#e8935a' } };
const LOGO_COLORS = ['#1f6f5c','#5b3ea8','#8a4b2a','#1d4e89','#7a2948','#2d6a3e','#6b5b1f','#334155'];

/* ─────────── Bot-Profile ─────────── */
const BOTS = {
  dividend: { name: 'Dividenden-Dieter', style: 'Konservativer Dividenden-Bot', icon: 'shield', diff: 1, label: 'Leicht' },
  snail:    { name: 'Index-Ingo', style: 'Passiver Buy & Hold-Bot', icon: 'snail', diff: 1, label: 'Leicht' },
  panic:    { name: 'Panik-Paula', style: 'Panik-Verkäufer-Bot', icon: 'tornado', diff: 2, label: 'Chaotisch' },
  hedge:    { name: 'Hedge-Hanna', style: 'Aggressiver Tech-Hedgefonds-Bot', icon: 'bolt', diff: 3, label: 'Mittel' },
  value:    { name: 'Value-Viktor', style: 'Contrarian Value-Investor', icon: 'owl', diff: 3, label: 'Mittel' },
  quant:    { name: 'Q-9000', style: 'Quant-Algorithmus (News-Scanner)', icon: 'crystal', diff: 5, label: 'Extrem' }
};
const AVATARS = { '🦊': 'fox', '🐺': 'wolf', '🦅': 'eagle', '🐉': 'dragon', '🤖': 'robot', '👾': 'alien' };
const FRIEND_NAMES = ['MoonLisa','BullBert','DipBuyer99','ToniTicker','HodlHeidi','KursKevin','ChartChris','SharpeSara','GammaGabi','YoloYannik'];

/* ─────────── State ─────────── */
const STORE_KEY = 'cyberbroker_state_v1';
const START_CASH = 100000;
const defaultState = () => ({
  onboarded: false, name: 'Trader', avatar: 'fox', cash: START_CASH, holdings: {}, orders: [], trades: [],
  valueHist: [], dailyHist: {}, xp: 0, lessons: {}, leagues: [], activeLeague: null, haptics: true,
  finnhubKey: '', achievements: {}, created: Date.now()
});
let S = defaultState();
function load() { try { const d = JSON.parse(localStorage.getItem(STORE_KEY)); if (d) S = Object.assign(defaultState(), d); } catch (e) { } }
let saveT; function save() { clearTimeout(saveT); saveT = setTimeout(() => localStorage.setItem(STORE_KEY, JSON.stringify(S)), 300); }

/* ─────────── Markt-Engine ─────────── */
const M = { stocks: {}, list: [], marketFactor: 0, sentiment: 62, tick: 0, news: [], live: false, ws: null, sectorDrift: {} };

function initMarket() {
  STOCK_DATA.forEach(([sym, name, sector, price, mcap, pe, div, beta], i) => {
    const vol = 0.012 + beta * 0.011; // tägliche Vola
    // 365 Tage Historie rückwärts erzeugen
    const daily = [price]; let p = price;
    for (let d = 0; d < 364; d++) { p = p / Math.exp(0.0003 + vol * gauss()); daily.unshift(Math.max(1, p)); }
    const prevClose = daily[daily.length - 2];
    const ratings = { buy: Math.round(rnd(30, 80)) }; ratings.sell = Math.round(rnd(0, 100 - ratings.buy) * 0.4); ratings.hold = 100 - ratings.buy - ratings.sell;
    M.stocks[sym] = {
      sym, name, sector, price, open: prevClose * (1 + gauss() * 0.004), prevClose, mcap, pe, div, beta, vol, daily,
      intraday: [prevClose, price], hi52: Math.max(...daily), lo52: Math.min(...daily), ratings,
      volume: Math.round(rnd(5, 90) * 1e6), color: LOGO_COLORS[i % LOGO_COLORS.length], drift: 0, live: false,
      target: price * rnd(1.02, 1.3), eps: pe ? price / pe : -rnd(0.1, 1)
    };
  });
  M.list = Object.values(M.stocks);
  Object.keys(SECTORS).forEach(k => M.sectorDrift[k] = 0);
  const d = intradaySeed(); M.list.forEach(s => { s.intraday = d(s); });
}
function intradaySeed() {
  return s => { const arr = [s.prevClose]; let p = s.prevClose; const steps = 60; const tgt = s.price;
    for (let i = 1; i < steps; i++) { p += (tgt - p) / (steps - i) + p * s.vol * 0.12 * gauss(); arr.push(Math.max(0.5, p)); }
    arr.push(tgt); return arr; };
}

function marketTick() {
  M.tick++;
  M.marketFactor = M.marketFactor * 0.9 + gauss() * 0.0009;
  Object.keys(M.sectorDrift).forEach(k => M.sectorDrift[k] = M.sectorDrift[k] * 0.95 + gauss() * 0.0004);
  M.list.forEach(s => { if (s.live) return;
    if (s.live && M.live) return; // echte Kurse kommen via WebSocket
    const shock = s.vol * 0.09 * gauss();
    const r = s.beta * M.marketFactor + M.sectorDrift[s.sector] + s.drift + shock + (s.target / s.price - 1) * 0.0006;
    s.drift *= 0.93;
    updatePrice(s, s.price * Math.exp(r));
  });
  M.sentiment = clamp(M.sentiment + M.marketFactor * 900 + gauss() * 0.6, 5, 95);
  if (Math.random() < 0.07) generateNews();
  checkOrders();
  if (M.tick % 4 === 0) botsAct();
  recordValue();
}
function updatePrice(s, np) {
  const old = s.price; s.price = Math.max(0.5, np); s.dir = s.price >= old ? 1 : -1;
  s.intraday.push(s.price); if (s.intraday.length > 240) s.intraday.shift();
  s.daily[s.daily.length - 1] = s.price;
  s.hi52 = Math.max(s.hi52, s.price); s.lo52 = Math.min(s.lo52, s.price);
  s.volume += Math.round(rnd(1000, 40000));
}
const chg = s => (s.price / s.prevClose - 1) * 100;

/* News-Generator – beeinflusst Kurse */
const NEWS_T = {
  bull: ['{n} übertrifft Gewinnerwartungen deutlich','{n} kündigt Aktienrückkaufprogramm an','Analysten heben Kursziel für {s} an','{n} meldet Rekordumsatz im Quartal','Großauftrag für {n} – Aktie springt','{sec}-Sektor profitiert von Zinshoffnung'],
  bear: ['{n} senkt Prognose für Gesamtjahr','Kartellbehörde ermittelt gegen {n}','Analyst stuft {s} auf "Verkaufen" ab','{n}: CFO tritt überraschend zurück','Lieferkettenprobleme belasten {n}','{sec}-Werte unter Druck nach Inflationsdaten'],
  neutral: ['{n} hält Hauptversammlung ab','Fed-Protokoll ohne Überraschungen','{n} stellt neues Produkt vor','Seitwärtsphase: Anleger warten auf Arbeitsmarktdaten']
};
function generateNews(forceType) {
  const s = pick(M.list); const type = forceType || pick(['bull', 'bull', 'bear', 'bear', 'neutral']);
  const title = pick(NEWS_T[type]).replace('{n}', s.name).replace('{s}', s.sym).replace('{sec}', SECTORS[s.sector].n);
  const impact = type === 'bull' ? rnd(0.004, 0.012) : type === 'bear' ? -rnd(0.004, 0.012) : 0;
  if (title.includes('-Sektor') || title.includes('-Werte')) M.sectorDrift[s.sector] += impact * 0.3; else s.drift += impact;
  M.news.unshift({ title, type, sym: s.sym, t: Date.now() }); M.news = M.news.slice(0, 25);
  if (Math.abs(impact) > 0.009 && S.holdings[s.sym]) toast(`${type === 'bull' ? '📈' : '📉'} News zu deiner Position ${s.sym}`, type === 'bull' ? 'success' : 'warn');
  if (currentView === 'dashboard') renderNews(true);
}


/* ─────────── Echte Kurse (Yahoo via /api/quotes, ohne Key) ─────────── */
const YMAP = { SAP: 'SAP.DE', ALV: 'ALV.DE', SHEL: 'SHEL.L', BP: 'BP.L', NVO: 'NVO', ASML: 'ASML' };
async function loadRealQuotes(first) {
  try {
    const list = M.list.map(s => YMAP[s.sym] || s.sym);
    const r = await fetch('/api/quotes?symbols=' + encodeURIComponent(list.join(','))); if (!r.ok) throw 0;
    const d = await r.json(); let ok = 0;
    M.list.forEach(s => { const q = d[YMAP[s.sym] || s.sym]; if (!q || !q.price) return;
      if (first && q.daily && q.daily.length > 20) { s.daily = q.daily.slice(-365); s.hi52 = q.hi52 || s.hi52; s.lo52 = q.lo52 || s.lo52; s.target *= q.price / s.price; }
      s.prevClose = q.prevClose || s.prevClose; s.live = true; updatePrice(s, q.price); ok++; });
    if (ok) { M.live = true; if (first) { toast(`🔴 LIVE: ${ok} Aktien mit echten Kursen`, 'success'); renderAll(); } }
  } catch (e) { if (first) toast('Offline – zeige zuletzt bekannte/simulierte Kurse', 'warn'); }
}

/* ─────────── Finnhub (optional Live-Daten) ─────────── */
async function connectFinnhub() {
  const key = S.finnhubKey; if (!key) return;
  const syms = M.list.filter(s => !s.sym.includes('.') && !['SAP', 'ALV', 'SHEL', 'BP', 'NVO', 'ASML'].includes(s.sym)).slice(0, 45);
  let ok = 0;
  for (const s of syms.slice(0, 30)) { // REST-Quotes (Limit 60/min)
    try {
      const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(s.sym)}&token=${key}`);
      if (r.status === 401 || r.status === 403) { toast('Finnhub-Key ungültig', 'error'); return; }
      const q = await r.json();
      if (q && q.c) { const f = q.c / s.price; s.daily = s.daily.map(v => v * f); s.intraday = s.intraday.map(v => v * f); s.price = q.c; s.prevClose = q.pc || s.prevClose * f; s.open = q.o || s.open; s.hi52 *= f; s.lo52 *= f; s.target *= f; s.live = true; ok++; }
    } catch (e) { }
  }
  if (!ok) { toast('Keine Live-Daten – Simulation aktiv', 'warn'); return; }
  M.live = true; toast(`🔴 LIVE: ${ok} Aktien mit Echtzeit-Kursen`, 'success');
  try {
    M.ws && M.ws.close();
    M.ws = new WebSocket(`wss://ws.finnhub.io?token=${key}`);
    M.ws.onopen = () => syms.forEach(s => M.ws.send(JSON.stringify({ type: 'subscribe', symbol: s.sym })));
    M.ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.type === 'trade') m.data.forEach(t => { const s = M.stocks[t.s]; if (s) { s.live = true; updatePrice(s, t.p); } }); };
    M.ws.onclose = () => { M.live = M.list.some(s => s.live) && false; };
  } catch (e) { }
  renderAll();
}

/* ─────────── Portfolio ─────────── */
function holdingsValue(h = S.holdings) { return Object.entries(h).reduce((a, [sym, p]) => a + (M.stocks[sym] ? M.stocks[sym].price * p.shares : 0), 0); }
const totalValue = () => S.cash + holdingsValue();
function recordValue() {
  const v = totalValue(); S.valueHist.push([Date.now(), v]); if (S.valueHist.length > 600) S.valueHist.shift();
  S.dailyHist[today()] = v;
}
function haptic(p = 10) { if (S.haptics && navigator.vibrate) navigator.vibrate(p); }

function executeTrade(sym, side, shares, price, source = 'Market') {
  const s = M.stocks[sym]; shares = Math.floor(shares); if (!s || shares <= 0) return false;
  const cost = shares * price; const fee = Math.max(1, cost * 0.0005);
  if (side === 'buy') {
    if (cost + fee > S.cash) { toast('Nicht genügend Cash', 'error'); return false; }
    S.cash -= cost + fee;
    const h = S.holdings[sym] || { shares: 0, avg: 0, bought: Date.now() };
    h.avg = (h.avg * h.shares + cost) / (h.shares + shares); h.shares += shares; S.holdings[sym] = h;
  } else {
    const h = S.holdings[sym]; if (!h || h.shares < shares) { toast('Nicht genügend Anteile', 'error'); return false; }
    const pnl = (price - h.avg) * shares; S.cash += cost - fee; h.shares -= shares;
    if (h.shares === 0) { delete S.holdings[sym]; S.orders = S.orders.filter(o => !(o.sym === sym && o.type === 'stop')); }
    S.trades.push({ sym, side, shares, price, pnl, t: Date.now() });
    addXP(pnl > 0 ? 15 : 5);
  }
  if (side === 'buy') { S.trades.push({ sym, side, shares, price, pnl: 0, t: Date.now() }); addXP(5); }
  haptic([12, 30, 12]);
  toast(`${side === 'buy' ? '✅ Gekauft' : '💰 Verkauft'}: ${shares}× ${sym} @ ${usd(price)} (${source})`, 'success');
  checkAchievements(); save(); renderAll();
  return true;
}
function placeOrder(o) { o.id = Date.now() + Math.random(); S.orders.push(o); save(); toast(`📋 ${o.type === 'limit' ? 'Limit' : 'Stop-Loss'}-Order platziert: ${o.sym} @ ${usd(o.price)}`, 'info'); renderAll(); }
function checkOrders() {
  if (!S.orders.length) return;
  const done = [];
  S.orders.forEach(o => {
    const s = M.stocks[o.sym]; if (!s) return;
    if (o.type === 'limit' && ((o.side === 'buy' && s.price <= o.price) || (o.side === 'sell' && s.price >= o.price))) { if (executeTrade(o.sym, o.side, o.shares, s.price, 'Limit')) done.push(o.id); else done.push(o.id); }
    if (o.type === 'stop' && s.price <= o.price) {
      const h = S.holdings[o.sym]; if (h) executeTrade(o.sym, 'sell', Math.min(o.shares, h.shares), s.price, 'Stop-Loss ausgelöst');
      done.push(o.id); toast(`🛑 Stop-Loss für ${o.sym} ausgelöst`, 'warn');
    }
  });
  if (done.length) { S.orders = S.orders.filter(o => !done.includes(o.id)); save(); }
}

/* ─────────── XP & Achievements ─────────── */
function addXP(n) { S.xp += n; const b = $('#xp-badge'); if (b) b.textContent = 'XP: ' + S.xp; }
const level = () => Math.floor(Math.sqrt(S.xp / 50)) + 1;
const ACH = [
  { id: 'first', icon: 'rocket', n: 'Erster Trade', test: () => S.trades.length >= 1 },
  { id: 'div5', icon: 'scale', n: '5 Sektoren', test: () => new Set(Object.keys(S.holdings).map(k => M.stocks[k]?.sector)).size >= 5 },
  { id: 'profit', icon: 'moneybag', n: 'Gewinn-Trade', test: () => S.trades.some(t => t.pnl > 0) },
  { id: 'ten', icon: 'fire', n: '10 Trades', test: () => S.trades.length >= 10 },
  { id: 'league', icon: 'trophy', n: 'Liga-Gründer', test: () => S.leagues.length >= 1 },
  { id: 'scholar', icon: 'grad', n: 'Akademiker', test: () => Object.keys(S.lessons).length >= 3 },
  { id: 'up5', icon: 'up', n: '+5% Rendite', test: () => totalValue() >= START_CASH * 1.05 },
  { id: 'gem', icon: 'gem', n: 'Diamond Hands', test: () => Object.values(S.holdings).some(h => Date.now() - h.bought > 864e5 * 3) }
];
function checkAchievements() {
  ACH.forEach(a => { if (!S.achievements[a.id] && a.test()) { S.achievements[a.id] = Date.now(); addXP(50); toast(`🏅 Achievement: ${a.n} (+50 XP)`, 'success'); confetti(); } });
}

/* ─────────── Bots ─────────── */
function newBotPortfolio(type, capital) { return { type, cash: capital, holdings: {}, log: [], capital }; }
function botBuy(b, s, amount, reason) {
  const sh = Math.floor(Math.min(amount, b.cash) / s.price); if (sh < 1) return;
  b.cash -= sh * s.price; const h = b.holdings[s.sym] || { shares: 0, avg: 0 };
  h.avg = (h.avg * h.shares + sh * s.price) / (h.shares + sh); h.shares += sh; b.holdings[s.sym] = h;
  b.log.unshift({ side: 'buy', txt: `KAUF ${sh}× ${s.sym} @ ${fmt(s.price)} – ${reason}`, t: Date.now() }); b.log = b.log.slice(0, 30);
}
function botSell(b, sym, frac, reason) {
  const h = b.holdings[sym]; const s = M.stocks[sym]; if (!h || !s) return;
  const sh = Math.max(1, Math.floor(h.shares * frac)); b.cash += sh * s.price; h.shares -= sh; if (h.shares <= 0) delete b.holdings[sym];
  b.log.unshift({ side: 'sell', txt: `VERKAUF ${sh}× ${sym} @ ${fmt(s.price)} – ${reason}`, t: Date.now() }); b.log = b.log.slice(0, 30);
}
const botValue = b => b.cash + holdingsValue(b.holdings);
function botStep(b) {
  const L = M.list, total = botValue(b);
  const ret = sym => { const s = M.stocks[sym], h = b.holdings[sym]; return s.price / h.avg - 1; };
  switch (b.type) {
    case 'dividend': {
      const best = [...L].filter(s => s.div > 2.3 && s.beta < 1).sort((a, c) => c.div - a.div).slice(0, 8);
      if (b.cash > total * 0.05) { const s = pick(best); botBuy(b, s, total * 0.12, `Div.rendite ${fmt(s.div, 1)}%`); }
      Object.keys(b.holdings).forEach(k => { if (ret(k) > 0.25) botSell(b, k, 0.3, 'Gewinnmitnahme'); });
      break; }
    case 'snail': {
      if (b.cash > total * 0.02) { [...L].sort((a, c) => c.mcap - a.mcap).slice(0, 10).forEach(s => botBuy(b, s, b.capital * 0.098, 'Index-Gewichtung')); }
      break; }
    case 'panic': {
      Object.keys(b.holdings).forEach(k => { const s = M.stocks[k]; if (ret(k) < -0.015 || chg(s) < -1.2) botSell(b, k, 1, '😱 PANIK! Alles raus!'); });
      if (M.sentiment > 55 && b.cash > total * 0.2) { const s = [...L].sort((a, c) => chg(c) - chg(a))[Math.floor(Math.random() * 4)]; botBuy(b, s, total * 0.3, `FOMO! ${pct(chg(s))} heute`); }
      break; }
    case 'hedge': {
      const tech = L.filter(s => s.beta > 1.2).sort((a, c) => chg(c) - chg(a)).slice(0, 5);
      if (b.cash > total * 0.1) { const s = tech[0]; botBuy(b, s, total * 0.25, `Momentum ${pct(chg(s))}`); }
      Object.keys(b.holdings).forEach(k => { if (ret(k) > 0.08) botSell(b, k, 0.5, 'Take-Profit'); else if (ret(k) < -0.06) botSell(b, k, 1, 'Hard-Stop -6%'); });
      break; }
    case 'value': {
      const cheap = L.filter(s => s.pe > 0 && s.pe < 20 && chg(s) < -0.5).sort((a, c) => chg(a) - chg(c));
      if (cheap.length && b.cash > total * 0.1) botBuy(b, cheap[0], total * 0.15, `Contrarian: KGV ${s2(cheap[0].pe)} & Dip`);
      Object.keys(b.holdings).forEach(k => { if (ret(k) > 0.12) botSell(b, k, 0.5, 'Fair Value erreicht'); });
      break; }
    case 'quant': {
      const sig = [...L].sort((a, c) => c.drift - a.drift);
      if (sig[0].drift > 0.002 && b.cash > total * 0.05) botBuy(b, sig[0], total * 0.2, `Signal +${fmt(sig[0].drift * 1e4, 0)}bp`);
      Object.keys(b.holdings).forEach(k => { const s = M.stocks[k]; if (s.drift < -0.0005 || ret(k) > 0.05) botSell(b, k, 1, 'Signal invertiert'); });
      break; }
  }
}
const s2 = v => fmt(v, 1);
function botsAct() {
  let changed = false;
  S.leagues.forEach(l => l.members.forEach(m => { if (m.bot && Math.random() < (0.35 + BOTS[m.bot.type].diff * 0.08)) { botStep(m.bot); changed = true; } }));
  if (changed) save();
}

/* ─────────── Ligen ─────────── */
function myLeagueReturn(l) { return (totalValue() / l.myStartValue - 1) * 100; }
function memberReturn(l, m) {
  if (m.me) return myLeagueReturn(l);
  if (m.bot) return (botValue(m.bot) / m.bot.capital - 1) * 100;
  // simulierter Freund: korrelierter Random-Walk
  const days = (Date.now() - l.created) / 864e5;
  m.ret = (m.ret || 0) * 0.995 + M.marketFactor * 100 * m.beta + gauss() * 0.05 * m.skill;
  return m.ret + days * 0.02 * m.skill;
}
function standings(l) {
  return l.members.map(m => ({ m, r: memberReturn(l, m), v: l.capital * (1 + memberReturn(l, m) / 100) })).sort((a, b) => b.r - a.r);
}
function createLeague(opts) {
  const l = { id: Date.now(), name: opts.name, type: opts.type, code: code6(), capital: opts.capital, duration: opts.duration, created: Date.now(), myStartValue: totalValue(), weekStart: Date.now(), weekWinners: [], members: [{ me: true }] };
  if (opts.type === 'bot') opts.bots.forEach(t => l.members.push({ bot: newBotPortfolio(t, opts.capital) }));
  else { const n = opts.type === 'public' ? 7 : 3; for (let i = 0; i < n; i++) l.members.push(friend()); }
  if (opts.stakes) l.stakes = { amount: opts.stakeAmount, mode: 'weekly', paid: { me: false } };
  S.leagues.push(l); S.activeLeague = l.id; addXP(20); checkAchievements(); save();
  return l;
}
function friend(name) { return { name: name || pick(FRIEND_NAMES) + Math.floor(rnd(1, 99)), avatar: pick(Object.values(AVATARS)), skill: rnd(0.5, 1.6), beta: rnd(0.6, 1.6), ret: gauss() * 0.5 }; }
const PUBLIC_LEAGUES = [
  { name: 'Wall Street Wölfe', players: 1240, code: 'WOLF24' }, { name: 'Dividenden-Dynastie', players: 532, code: 'DIVI88' },
  { name: 'Tech Titans Cup', players: 3021, code: 'TECH01' }, { name: 'DAX-Daddies', players: 210, code: 'DAXX42' }
];

/* ─────────── UI: Toast / FX ─────────── */
function toast(msg, type = 'info') {
  const c = $('#toast-container'); if (!c) return; const t = document.createElement('div');
  t.className = 'toast ' + type; t.innerHTML = esc(msg); c.appendChild(t);
  if (c.children.length > 3) c.firstChild.remove();
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 350); }, 3200);
}
function confetti() {
  const cols = ['#00ff88', '#e8935a', '#ffc857', '#4cc9f0', '#9d7cff'];
  for (let i = 0; i < 40; i++) { const c = document.createElement('div'); c.className = 'confetti'; c.style.left = rnd(0, 100) + 'vw'; c.style.top = '-20px'; c.style.background = pick(cols); c.style.animationDuration = rnd(1.5, 3) + 's'; document.body.appendChild(c); setTimeout(() => c.remove(), 3200); }
}
function attachRipple(root = document) {
  root.addEventListener('pointerdown', e => {
    const b = e.target.closest('.btn-neon, .btn-copper, .nav-btn, .btn-sm-neon'); if (!b) return;
    const r = b.getBoundingClientRect(), sp = document.createElement('span'), d = Math.max(r.width, r.height);
    sp.className = 'ripple'; sp.style.width = sp.style.height = d + 'px'; sp.style.left = e.clientX - r.left - d / 2 + 'px'; sp.style.top = e.clientY - r.top - d / 2 + 'px';
    b.style.position = b.style.position || 'relative'; b.style.overflow = 'hidden'; b.appendChild(sp); setTimeout(() => sp.remove(), 600); haptic(6);
  });
}
function attachTilt() {
  document.addEventListener('pointermove', e => {
    const c = e.target.closest('.mini-chart-card, .portfolio-hero, .academy-card'); if (!c) return;
    const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    c.style.transform = `perspective(700px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg) scale(1.01)`;
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => document.addEventListener(ev, () => $$('.mini-chart-card, .portfolio-hero, .academy-card').forEach(c => c.style.transform = ''), true));
}

/* ─────────── Canvas Sparkline ─────────── */
function spark(canvas, data, color) {
  if (!canvas || !data || data.length < 2) return;
  const dpr = window.devicePixelRatio || 1, w = canvas.clientWidth || 74, h = canvas.clientHeight || 30;
  canvas.width = w * dpr; canvas.height = h * dpr; const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, w, h);
  const mn = Math.min(...data), mx = Math.max(...data), rg = mx - mn || 1;
  const pts = data.map((v, i) => [i / (data.length - 1) * w, h - 3 - (v - mn) / rg * (h - 6)]);
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, color + '55'); g.addColorStop(1, color + '00');
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.shadowColor = color; ctx.shadowBlur = 6; ctx.stroke();
}
const sColor = s => chg(s) >= 0 ? '#00ff88' : '#ff4d6d';
const logo = s => `<div class="stock-logo" style="background:linear-gradient(135deg,${s.color},${s.color}99)">${s.sym.replace('.B', '').slice(0, 4)}</div>`;

/* ─────────── Chart.js Defaults ─────────── */
const charts = {};
function lineChart(id, labels, data, color) {
  const el = document.getElementById(id); if (!el || !window.Chart) return;
  const ctx = el.getContext('2d'); const g = ctx.createLinearGradient(0, 0, 0, el.height || 150); g.addColorStop(0, color + '40'); g.addColorStop(1, color + '00');
  if (charts[id]) { const c = charts[id]; c.data.labels = labels; c.data.datasets[0].data = data; c.data.datasets[0].borderColor = color; c.data.datasets[0].backgroundColor = g; c.update('none'); return; }
  charts[id] = new Chart(ctx, {
    type: 'line', data: { labels, datasets: [{ data, borderColor: color, backgroundColor: g, fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, animation: { duration: 500 }, interaction: { intersect: false, mode: 'index' },
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#141b24', borderColor: '#2a3442', borderWidth: 1, titleFont: { family: 'JetBrains Mono' }, bodyFont: { family: 'JetBrains Mono' }, callbacks: { label: c => usd(c.parsed.y) } } },
      scales: { x: { display: false }, y: { position: 'right', grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5a6676', font: { family: 'JetBrains Mono', size: 10 }, maxTicksLimit: 5 } } } }
  });
  el.parentElement.style.height = el.parentElement.style.height || '';
}
function donut(id, labels, data, colors, cutout = '72%') {
  const el = document.getElementById(id); if (!el || !window.Chart) return;
  if (charts[id]) { const c = charts[id]; c.data.labels = labels; c.data.datasets[0].data = data; c.data.datasets[0].backgroundColor = colors; c.update('none'); return; }
  charts[id] = new Chart(el, { type: 'doughnut', data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: '#0d1117', borderWidth: 2, hoverOffset: 6 }] },
    options: { cutout, responsive: true, maintainAspectRatio: true, animation: { animateRotate: true, duration: 800 }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.label}: ${fmt(c.parsed, 1)}%` } } } } });
}

/* ─────────── Rendering ─────────── */
let currentView = 'dashboard', marketFilter = 'all', marketSort = 'name', communityTab = 'top-picks', leagueTab = 'my-leagues', portRange = '1d';

function renderHeader() {
  const tv = totalValue();
  $('#header-cash').textContent = usdShort(S.cash);
  $('#header-avatar').innerHTML = img3d(S.avatar, 24);
  const idx = [['S&P 500', 'AAPL MSFT NVDA AMZN GOOGL META JPM'], ['NASDAQ', 'NVDA AMD TSLA PLTR NFLX ADBE'], ['ENERGY', 'XOM CVX SHEL COP'], ['HEALTH', 'LLY JNJ UNH NVO']];
  $('#market-ticker').innerHTML = idx.map(([n, syms]) => { const c = syms.split(' ').reduce((a, s) => a + chg(M.stocks[s]), 0) / syms.split(' ').length; return `<span class="ticker-item">${n} ${c >= 0 ? '▲' : '▼'} <em class="${cls(c)}">${pct(c)}</em></span>`; }).join('')
    + M.list.slice(0, 14).map(s => `<span class="ticker-item">${s.sym} ${fmt(s.price)} <em class="${cls(chg(s))}">${pct(chg(s))}</em></span>`).join('');
  $('#sent-fill').style.width = M.sentiment + '%';
  const mood = M.sentiment > 60 ? 'Bullish' : M.sentiment < 40 ? 'Bearish' : 'Neutral';
  $('#sent-value').textContent = `${mood} ${Math.round(M.sentiment)}%`;
  const fg = Math.round(clamp(M.sentiment * 0.9 + 5, 0, 100));
  $('#sent-fear').innerHTML = `Fear &amp; Greed: <strong class="${fg > 50 ? 'positive' : 'negative'}">${fg}</strong>`;
  $('#market-time').innerHTML = M.live ? '<span class="live-pill">● LIVE</span> Finnhub' : '🟢 Markt offen · Simulation';
}

function renderDashboard() {
  const tv = totalValue(), inv = holdingsValue(), ret = (tv / START_CASH - 1) * 100, d = tv - START_CASH;
  $('#total-value').textContent = usd(tv);
  $('#total-change').innerHTML = `<span class="change-badge ${cls(d)}">${d >= 0 ? '+' : ''}${usd(d)} (${pct(ret)})</span>`;
  $('#dash-cash').textContent = usdShort(S.cash); $('#dash-invested').textContent = usdShort(inv);
  $('#dash-positions').textContent = Object.keys(S.holdings).length;
  const r = $('#dash-return'); r.textContent = pct(ret); r.className = 'phs-val ' + cls(ret);
  const sec = sectorAlloc();
  donut('alloc-donut', ['Cash', ...sec.map(x => SECTORS[x[0]].n)], [S.cash / tv * 100, ...sec.map(x => x[1] / tv * 100)], ['#2a3442', ...sec.map(x => SECTORS[x[0]].c)]);
  $$('.mini-chart-card').forEach(c => { const s = M.stocks[c.dataset.symbol]; const e = $('#mc-' + s.sym); e.textContent = pct(chg(s), 1); e.className = 'mc-chg ' + cls(chg(s)); spark($('#chart-' + s.sym), s.intraday.slice(-60), sColor(s)); });
  renderCommunity(); renderNews();
}
function renderCommunity() {
  const box = $('#community-content'); let rows;
  if (communityTab === 'top-picks') rows = [...M.list].sort((a, b) => b.ratings.buy - a.ratings.buy).slice(0, 5).map(s => [s.sym, s.name, `${s.ratings.buy}% Kaufen`, s.ratings.buy]);
  else if (communityTab === 'top-earner') rows = [...M.list].sort((a, b) => chg(b) - chg(a)).slice(0, 5).map(s => [s.sym, s.name, pct(chg(s)), clamp(chg(s) * 20 + 50, 5, 100), cls(chg(s))]);
  else { const seed = M.list.map(s => [s, (s.mcap / 3500) * 40 + (s.beta * 15) + (s.sym.charCodeAt(0) % 7)]).sort((a, b) => b[1] - a[1]).slice(0, 5); rows = seed.map(([s, v]) => [s.sym, `${SECTORS[s.sector].n} · Beta ${fmt(s.beta, 1)}`, `${fmt(v, 0)}% halten`, v]); }
  box.innerHTML = rows.map((r, i) => `<div class="community-row" data-sym="${r[0]}" style="animation-delay:${i * 50}ms"><span class="rank">#${i + 1}</span>${logo(M.stocks[r[0]])}<div class="cr-main"><div class="cr-title">${r[0]}</div><div class="cr-sub">${esc(r[1])}</div><div class="cr-bar"><span style="width:${clamp(r[3], 3, 100)}%"></span></div></div><div class="cr-val ${r[4] || ''}">${r[2]}</div></div>`).join('');
}
function renderNews(flash) {
  const box = $('#news-list'); if (!box) return;
  box.innerHTML = M.news.slice(0, 8).map((n, i) => `<div class="news-item ${flash && i === 0 ? 'flash' : ''}" data-sym="${n.sym}"><span class="news-dot ${n.type}"></span><div><div class="news-title">${esc(n.title)}</div><div class="news-meta">${n.sym} · ${new Date(n.t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div></div></div>`).join('') || '<div class="empty-state"><p>Warte auf Marktnachrichten…</p></div>';
}
function sectorAlloc() {
  const m = {}; Object.entries(S.holdings).forEach(([k, h]) => { const s = M.stocks[k]; if (s) m[s.sector] = (m[s.sector] || 0) + s.price * h.shares; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

function renderMarket(full = true) {
  const q = ($('#market-search').value || '').toLowerCase();
  let list = M.list.filter(s => (marketFilter === 'all' || s.sector === marketFilter) && (!q || s.sym.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)));
  const sorters = { name: (a, b) => a.sym.localeCompare(b.sym), price: (a, b) => b.price - a.price, change: (a, b) => chg(b) - chg(a), market_cap: (a, b) => b.mcap - a.mcap };
  list.sort(sorters[marketSort]);
  const box = $('#stock-list');
  if (full || box.children.length !== list.length) {
    box.innerHTML = list.map((s, i) => `<div class="stock-row" data-sym="${s.sym}" style="animation-delay:${Math.min(i, 15) * 25}ms">${logo(s)}<div class="stock-info"><div class="stock-sym">${s.sym}${S.holdings[s.sym] ? '<span class="owned-dot"></span>' : ''}${s.live && M.live ? '<span class="live-pill">LIVE</span>' : ''}</div><div class="stock-name">${esc(s.name)}</div></div><canvas class="stock-spark"></canvas><div class="stock-price-col"><div class="stock-price">${fmt(s.price)}</div><span class="stock-chg ${cls(chg(s))}">${pct(chg(s))}</span></div></div>`).join('');
  } else {
    list.forEach((s, i) => { const row = box.children[i]; if (row.dataset.sym !== s.sym) return renderMarket(true); const p = $('.stock-price', row); const nt = fmt(s.price); if (p.textContent !== nt) { p.textContent = nt; p.classList.remove('tick-up', 'tick-down'); void p.offsetWidth; p.classList.add(s.dir > 0 ? 'tick-up' : 'tick-down'); } const c = $('.stock-chg', row); c.textContent = pct(chg(s)); c.className = 'stock-chg ' + cls(chg(s)); });
  }
  $$('.stock-row', box).forEach(r => { const s = M.stocks[r.dataset.sym]; spark($('.stock-spark', r), s.intraday.slice(-40), sColor(s)); });
}

function renderPortfolio() {
  const tv = totalValue(); const box = $('#holdings-list'); const H = Object.entries(S.holdings);
  let html = '';
  if (!H.length) html = `<div class="empty-state">${img3d('chart', 56)}<p>Noch keine Positionen.<br/>Kaufe deine erste Aktie im Markt!</p></div>`;
  else html = H.map(([k, h], i) => {
    const s = M.stocks[k], v = s.price * h.shares, pl = (s.price / h.avg - 1) * 100, w = v / tv * 100;
    const stop = S.orders.find(o => o.sym === k && o.type === 'stop');
    const badges = [w > 20 ? '<span class="mini-badge warn">⚠ Klumpenrisiko</span>' : '', pl < -8 && !stop ? '<span class="mini-badge danger">Stop-Loss empfohlen</span>' : '', stop ? `<span class="mini-badge ok">🛡 Stop @ ${fmt(stop.price)}</span>` : '', s.div > 2 ? `<span class="mini-badge">Div ${fmt(s.div, 1)}%</span>` : '', `<span class="mini-badge">${SECTORS[s.sector].n}</span>`].join('');
    return `<div class="holding-card" data-sym="${k}" style="animation-delay:${i * 40}ms"><div class="hc-top"><div class="hc-left">${logo(s)}<div><div class="stock-sym">${k}</div><div class="hc-meta">${h.shares} Stk · Ø ${fmt(h.avg)}</div></div></div><div class="hc-value">${usd(v)}<div class="${cls(pl)}" style="font-size:12px">${pct(pl)} · ${usd((s.price - h.avg) * h.shares)}</div></div></div><div class="hc-weight"><span style="width:${Math.min(100, w)}%"></span></div><div class="hc-badges"><span class="mini-badge">${fmt(w, 1)}% Gewicht</span>${badges}</div></div>`;
  }).join('');
  if (S.orders.length) html += `<h3 class="section-title"><i data-lucide="clock" size="16"></i> Offene Orders</h3>` + S.orders.map(o => `<div class="holding-card"><div class="hc-top"><div><div class="stock-sym">${o.sym} · ${o.type === 'limit' ? 'Limit ' + (o.side === 'buy' ? 'Kauf' : 'Verkauf') : 'Stop-Loss'}</div><div class="hc-meta">${o.shares} Stk @ ${usd(o.price)} · aktuell ${usd(M.stocks[o.sym].price)}</div></div><button class="btn-outline" data-cancel="${o.id}">Stornieren</button></div></div>`).join('');
  box.innerHTML = html;
  renderPortfolioChart();
  const sec = sectorAlloc(), inv = holdingsValue() || 1;
  donut('sector-chart', sec.map(x => SECTORS[x[0]].n), sec.length ? sec.map(x => x[1] / inv * 100) : [100], sec.length ? sec.map(x => SECTORS[x[0]].c) : ['#2a3442'], '62%');
  $('#sector-legend').innerHTML = sec.map(x => `<div><i style="background:${SECTORS[x[0]].c}"></i>${SECTORS[x[0]].n}<b>${fmt(x[1] / inv * 100, 1)}%</b></div>`).join('') || '<div style="grid-column:1/-1">Keine Investitionen – 100% Cash</div>';
  refreshIcons();
}
function renderPortfolioChart() {
  let data, labels;
  if (portRange === '1d') { data = S.valueHist.slice(-200).map(x => x[1]); labels = S.valueHist.slice(-200).map(x => new Date(x[0]).toLocaleTimeString('de-DE')); }
  else { const n = { '1w': 7, '1m': 30, '3m': 90 }[portRange]; const e = Object.entries(S.dailyHist).sort().slice(-n); labels = e.map(x => x[0]); data = e.map(x => x[1]); }
  if (data.length < 2) { data = [START_CASH, totalValue()]; labels = ['Start', 'Jetzt']; }
  lineChart('portfolio-chart', labels, data, data[data.length - 1] >= data[0] ? '#00ff88' : '#ff4d6d');
}

function renderLeagues() {
  const box = $('#leagues-content'); const act = S.leagues.find(l => l.id === S.activeLeague);
  const ban = $('#active-league-banner');
  if (act) { const st = standings(act); const rk = st.findIndex(x => x.m.me) + 1; ban.classList.remove('hidden');
    ban.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><div class="alb-title">${img3d('trophy', 26)} ${esc(act.name)}</div><div class="alb-sub">${st.length} Teilnehmer · deine Rendite ${pct(myLeagueReturn(act))}</div></div><div class="alb-rank">#${rk}</div></div>`;
    ban.onclick = () => openLeague(act.id);
  } else ban.classList.add('hidden');
  let html = '';
  if (leagueTab === 'my-leagues') {
    html += `<div class="join-box"><input class="text-input" id="join-code" placeholder="EINLADUNGSCODE" maxlength="6"/><button class="btn-copper" id="join-btn">Beitreten</button></div>`;
    const mine = S.leagues.filter(l => l.type !== 'bot');
    html += mine.length ? mine.map(leagueCard).join('') : `<div class="empty-state">${img3d('trophy', 56)}<p>Noch keine Liga.<br/>Erstelle eine oder tritt mit Code bei.</p></div>`;
  } else if (leagueTab === 'bot-leagues') {
    const bl = S.leagues.filter(l => l.type === 'bot');
    html += `<div class="glass" style="padding:14px;margin-bottom:12px"><div style="display:flex;gap:8px;flex-wrap:wrap">${Object.entries(BOTS).map(([k, b]) => `<div class="bot-card-mini" style="flex:1 1 30%">${img3d(b.icon, 34)}<span class="bot-name">${b.name}</span><span class="diff-stars">${'★'.repeat(b.diff)}${'☆'.repeat(5 - b.diff)}</span></div>`).join('')}</div><button class="btn-neon full-width" style="margin-top:12px" id="quick-bot">⚡ Schnell-Duell gegen alle Bots</button></div>`;
    html += bl.map(leagueCard).join('');
  } else {
    html += PUBLIC_LEAGUES.map(p => `<div class="league-card"><div class="lc-top"><div><div class="lc-name">${p.name}</div><div class="lc-meta"><span>👥 ${fmt(p.players, 0)} Spieler</span><span class="lc-tag public">ÖFFENTLICH</span></div></div><button class="btn-sm-neon" data-joinpub="${p.code}">Beitreten</button></div></div>`).join('');
    html += S.leagues.filter(l => l.type === 'public').map(leagueCard).join('');
  }
  box.innerHTML = html;
}
function leagueCard(l) {
  const st = standings(l), rk = st.findIndex(x => x.m.me) + 1, prog = clamp((Date.now() - l.created) / (l.duration * 864e5) * 100, 1, 100);
  return `<div class="league-card" data-league="${l.id}"><div class="lc-top"><div><div class="lc-name">${esc(l.name)}</div><div class="lc-meta"><span class="lc-tag ${l.type}">${{ private: 'PRIVAT', public: 'ÖFFENTLICH', bot: 'BOT-LIGA' }[l.type]}</span>${l.stakes ? `<span class="lc-tag stakes">💰 POTT ${l.stakes.amount * l.members.length} €</span>` : ''}<span>👥 ${l.members.length}</span><span>Platz ${rk}/${st.length}</span></div></div><div class="lb-val ${cls(myLeagueReturn(l))}">${pct(myLeagueReturn(l))}</div></div><div class="lc-progress"><span style="width:${prog}%"></span></div></div>`;
}
function openLeague(id) {
  const l = S.leagues.find(x => x.id === id); if (!l) return; S.activeLeague = id; save();
  $('#ldm-title').textContent = l.name;
  const st = standings(l); const left = Math.max(0, Math.ceil(l.duration - (Date.now() - l.created) / 864e5));
  let h = `<div class="lc-meta" style="margin-bottom:6px"><span class="lc-tag ${l.type}">${l.type.toUpperCase()}</span><span>⏳ noch ${left} Tage</span><span>Startkapital ${usdShort(l.capital)}</span></div>`;
  if (l.type !== 'bot') h += `<div class="invite-code"><span>${l.code}</span><button class="btn-sm-neon" id="share-code"><i data-lucide="share-2" size="14"></i> Teilen</button></div>`;
  h += `<div class="leaderboard">${st.map((x, i) => { const m = x.m; const av = m.me ? S.avatar : m.bot ? BOTS[m.bot.type].icon : m.avatar; const nm = m.me ? S.name + ' (Du)' : m.bot ? BOTS[m.bot.type].name : m.name; const sty = m.me ? 'Level ' + level() : m.bot ? BOTS[m.bot.type].style : 'Mitspieler'; return `<div class="lb-row ${m.me ? 'me' : ''}" style="animation-delay:${i * 40}ms"><span class="lb-rank">${i + 1}</span><span class="lb-av">${img3d(av, 30)}</span><div><div class="lb-name">${esc(nm)}</div><div class="lb-style">${sty}</div></div><div class="lb-val ${cls(x.r)}">${pct(x.r)}<div style="font-size:10px;color:var(--text-mute)">${usdShort(x.v)}</div></div></div>`; }).join('')}</div>`;
  const bots = l.members.filter(m => m.bot);
  if (bots.length) h += `<h3 class="section-title">${img3d('robot', 18)} Bot-Aktivität (live)</h3><div class="bot-log">${bots.flatMap(m => m.bot.log.slice(0, 6).map(e => ({ ...e, n: BOTS[m.bot.type].name }))).sort((a, b) => b.t - a.t).slice(0, 20).map(e => `<div class="bl-${e.side}">[${new Date(e.t).toLocaleTimeString('de-DE')}] ${e.n}: ${esc(e.txt)}</div>`).join('') || 'Bots analysieren den Markt…'}</div>`;
  if (l.type !== 'bot') h += `<button class="btn-outline full-width" style="margin-top:10px" id="add-friend">➕ Mitspieler manuell hinzufügen</button>`;
  if (l.stakes) h += stakesPanel(l);
  h += `<button class="btn-ghost full-width" style="margin-top:12px;color:var(--red)" id="leave-league">Liga verlassen</button>`;
  $('#ldm-content').innerHTML = h; openModal('league-detail-modal'); refreshIcons();
  const sc = $('#share-code'); if (sc) sc.onclick = () => { const t = `Tritt meiner CyberBroker-Liga "${l.name}" bei! Code: ${l.code}`; if (navigator.share) navigator.share({ title: 'CyberBroker Liga', text: t }).catch(() => { }); else { navigator.clipboard?.writeText(t); toast('Code kopiert', 'success'); } };
  const af = $('#add-friend'); if (af) af.onclick = () => { const n = prompt('Name des Mitspielers:'); if (n) { l.members.push(friend(n.slice(0, 18))); if (l.stakes) l.stakes.paid[l.members.length - 1] = false; save(); openLeague(id); } };
  $('#leave-league').onclick = () => { if (confirm('Liga wirklich verlassen?')) { S.leagues = S.leagues.filter(x => x.id !== id); if (S.activeLeague === id) S.activeLeague = null; save(); closeModal('league-detail-modal'); renderLeagues(); } };
  bindStakes(l);
}

/* ─────────── Stakes ─────────── */
function stakesPanel(l) {
  const st = l.stakes, n = l.members.filter(m => !m.bot).length, pot = st.amount * n;
  const weekDays = (Date.now() - l.weekStart) / 864e5;
  const split = st.mode === 'weekly' ? [[1, 100]] : [[1, 50], [2, 30], [3, 20]];
  const humans = l.members.map((m, i) => ({ m, i })).filter(x => !x.m.bot);
  return `<div class="stakes-panel"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:12px;color:var(--text-mute);text-transform:uppercase;letter-spacing:1px">Virtueller Pott</div><div class="stakes-pot">${fmt(pot, 0)} €</div></div>${img3d('moneybag', 54)}</div>
  <div style="display:flex;gap:6px;margin:10px 0"><button class="filter-btn ${st.mode === 'weekly' ? 'active' : ''}" data-smode="weekly">Wochen-Rallye</button><button class="filter-btn ${st.mode === 'final' ? 'active' : ''}" data-smode="final">Liga-Finale 50/30/20</button></div>
  <div class="payout-split">${split.map(([r, p]) => `<div>Platz ${r}<b>${fmt(pot * p / 100, 2)} €</b></div>`).join('')}</div>
  <div style="font-size:12px;color:var(--text-dim);margin:10px 0">${st.mode === 'weekly' ? `Woche läuft seit ${fmt(weekDays, 1)} Tagen` : 'Auszahlung am Liga-Ende'} · Einsatz ${st.amount} € p.P.</div>
  ${humans.map(({ m, i }) => `<div class="stakes-row"><span>${m.me ? esc(S.name) + ' (Du)' : esc(m.name)}</span><button class="pay-chip ${st.paid[m.me ? 'me' : i] ? 'paid' : 'open'}" data-pay="${m.me ? 'me' : i}">${st.paid[m.me ? 'me' : i] ? '✓ BEZAHLT' : 'OFFEN'}</button></div>`).join('')}
  ${st.mode === 'weekly' ? '<button class="btn-copper full-width" style="margin-top:12px" id="settle-week">🏁 Woche abschließen & Sieger küren</button>' : ''}
  ${l.weekWinners.length ? `<h4 style="margin:14px 0 6px;font-size:13px">Hall of Fame</h4>${l.weekWinners.slice(-5).reverse().map(w => `<div class="stakes-row"><span>${img3d('medal', 18)} ${esc(w.name)}</span><span class="mono">${pct(w.r)} · ${fmt(w.pot, 0)} €</span></div>`).join('')}` : ''}
  <p style="font-size:10.5px;color:var(--text-mute);margin-top:10px">Hinweis: Rein symbolisches Gruppen-Management. Die App wickelt keine echten Zahlungen ab.</p></div>`;
}
function bindStakes(l) {
  if (!l.stakes) return;
  $$('[data-pay]').forEach(b => b.onclick = () => { const k = b.dataset.pay; l.stakes.paid[k] = !l.stakes.paid[k]; haptic(); save(); openLeague(l.id); });
  $$('[data-smode]').forEach(b => b.onclick = () => { l.stakes.mode = b.dataset.smode; save(); openLeague(l.id); });
  const sw = $('#settle-week'); if (sw) sw.onclick = () => {
    const st = standings(l).filter(x => !x.m.bot); const w = st[0]; const pot = l.stakes.amount * st.length;
    l.weekWinners.push({ name: w.m.me ? S.name : w.m.name, r: w.r, pot, t: Date.now() }); l.weekStart = Date.now(); Object.keys(l.stakes.paid).forEach(k => l.stakes.paid[k] = false);
    confetti(); toast(`🏆 Wochensieger: ${w.m.me ? 'DU' : w.m.name} gewinnt ${pot} €!`, 'success'); if (w.m.me) addXP(100); save(); openLeague(l.id);
  };
}

/* ─────────── Stock Modal & Orders ─────────── */
let cur = null, side = 'buy', smPeriod = '1d';
function openStock(sym) {
  cur = M.stocks[sym]; if (!cur) return; side = 'buy'; smPeriod = '1d';
  $$('.op-tab').forEach(t => t.classList.toggle('active', t.dataset.ot === 'buy')); $$('.sct').forEach(t => t.classList.toggle('active', t.dataset.p === '1d'));
  $('#op-type').value = 'market'; $('#op-limit-row').classList.add('hidden'); $('#op-shares').value = 1; $('#sl-enable').checked = false; $('#sl-controls').classList.add('hidden');
  $('#sm-sym').textContent = cur.sym; $('#sm-name').textContent = `${cur.name} · ${SECTORS[cur.sector].n}`;
  openModal('stock-modal'); renderStockModal(true); haptic();
}
function renderStockModal(full) {
  const s = cur; if (!s) return;
  $('#sm-price').textContent = usd(s.price);
  const c = $('#sm-change'); c.textContent = `${s.price - s.prevClose >= 0 ? '+' : ''}${fmt(s.price - s.prevClose)} (${pct(chg(s))})`; c.className = 'sm-change ' + cls(chg(s));
  let data = smPeriod === '1d' ? s.intraday : s.daily.slice(-{ '1w': 7, '1m': 30, '3m': 90, '1y': 365 }[smPeriod]);
  lineChart('sm-chart', data.map((_, i) => i), data, data[data.length - 1] >= data[0] ? '#00ff88' : '#ff4d6d');
  if (full) {
    $('#ab-buy').style.width = s.ratings.buy + '%'; $('#ab-hold').style.width = s.ratings.hold + '%'; $('#ab-sell').style.width = s.ratings.sell + '%';
    const volBars = Math.round(clamp(s.beta * 2.5, 1, 5));
    const met = [['Market Cap', s.mcap >= 1000 ? fmt(s.mcap / 1000, 2) + ' Bio $' : fmt(s.mcap, 0) + ' Mrd $'], ['KGV', s.pe ? fmt(s.pe, 1) : 'n/a'], ['Div.-Rendite', fmt(s.div, 2) + '%'], ['Beta', fmt(s.beta, 2)], ['52W Hoch', fmt(s.hi52)], ['52W Tief', fmt(s.lo52)], ['Eröffnung', fmt(s.open)], ['Vortag', fmt(s.prevClose)], ['EPS', fmt(s.eps)], ['Volumen', fmt(s.volume / 1e6, 1) + ' Mio'], ['Kursziel Ø', fmt(s.target)], ['Volatilität', `${fmt(s.vol * Math.sqrt(252) * 100, 0)}% p.a.<div class="vol-meter">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= volBars ? 'on' : ''}"></i>`).join('')}</div>`]];
    $('#sm-metrics').innerHTML = met.map(([l, v]) => `<div class="metric"><div class="metric-label">${l}</div><div class="metric-val">${v}</div></div>`).join('') + `<div class="ai-insight" style="grid-column:1/-1">${img3d('bulb', 18)} <b>Broker-Insight:</b> ${insight(s)}</div>`;
  }
  updateOrderSummary();
}
function insight(s) {
  const pos52 = (s.price - s.lo52) / (s.hi52 - s.lo52 || 1); const tips = [];
  if (s.pe && s.pe < 15) tips.push('Niedriges KGV – möglicherweise unterbewertet.'); if (s.pe > 60) tips.push('Hohes KGV – Markt preist starkes Wachstum ein, Rückschlagrisiko.');
  if (s.div > 3) tips.push(`Attraktive Dividende (${fmt(s.div, 1)}%) für Einkommens-Strategien.`); if (s.beta > 1.5) tips.push('Hohe Volatilität – Stop-Loss empfohlen.');
  if (pos52 > 0.9) tips.push('Nahe 52W-Hoch: Momentum stark, aber Einstieg teuer.'); if (pos52 < 0.15) tips.push('Nahe 52W-Tief: Contrarian-Chance oder fallendes Messer.');
  const h = S.holdings[s.sym]; if (h && h.shares * s.price / totalValue() > 0.2) tips.push('⚠ Diese Position macht >20% deines Depots aus.');
  return tips.join(' ') || 'Ausgewogenes Profil ohne Auffälligkeiten. Achte auf deine Sektor-Gewichtung.';
}
function updateOrderSummary() {
  const s = cur; if (!s) return; const n = Math.max(0, parseInt($('#op-shares').value) || 0); const t = $('#op-type').value;
  const p = t === 'market' ? s.price : parseFloat($('#op-limit-price').value) || s.price;
  $('#op-unit-price').textContent = usd(p); $('#op-total').textContent = usd(n * p);
  const h = S.holdings[s.sym];
  $('#op-available').textContent = side === 'buy' ? usd(S.cash) : `${h ? h.shares : 0} Stk`;
  const ex = $('#op-execute'); ex.textContent = t === 'stop' ? 'Stop-Loss setzen' : t === 'limit' ? `Limit-${side === 'buy' ? 'Kauf' : 'Verkauf'} platzieren` : side === 'buy' ? 'Kaufen' : 'Verkaufen';
  ex.classList.toggle('sell', side === 'sell' || t === 'stop');
  $('#stop-loss-section').classList.toggle('hidden', side !== 'buy' || t === 'stop');
  const warn = side === 'buy' && (n * p + (h ? h.shares * s.price : 0)) / totalValue() > 0.25;
  let w = $('#risk-warn'); if (warn && !w) { w = document.createElement('div'); w.id = 'risk-warn'; w.className = 'risk-warning'; w.textContent = '⚠ Diese Order würde >25% deines Portfolios in einer Aktie bündeln.'; ex.before(w); } else if (!warn && w) w.remove();
}
function submitOrder() {
  const s = cur, n = parseInt($('#op-shares').value) || 0, t = $('#op-type').value; if (n <= 0) return toast('Anzahl ungültig', 'error');
  if (t === 'market') {
    if (executeTrade(s.sym, side, n, s.price) && side === 'buy' && $('#sl-enable').checked) { const p = +$('#sl-range').value; placeOrder({ sym: s.sym, type: 'stop', side: 'sell', shares: n, price: +(s.price * (1 - p / 100)).toFixed(2) }); }
  } else if (t === 'limit') {
    const lp = parseFloat($('#op-limit-price').value); if (!lp) return toast('Limit-Preis eingeben', 'error');
    if (side === 'buy' && n * lp > S.cash) return toast('Nicht genügend Cash', 'error');
    if (side === 'sell' && (!S.holdings[s.sym] || S.holdings[s.sym].shares < n)) return toast('Nicht genügend Anteile', 'error');
    placeOrder({ sym: s.sym, type: 'limit', side, shares: n, price: lp });
  } else {
    const h = S.holdings[s.sym]; if (!h) return toast('Keine Position für Stop-Loss', 'error');
    const sp = parseFloat($('#op-limit-price').value); if (!sp || sp >= s.price) return toast('Stop-Preis muss unter aktuellem Kurs liegen', 'error');
    S.orders = S.orders.filter(o => !(o.sym === s.sym && o.type === 'stop')); placeOrder({ sym: s.sym, type: 'stop', side: 'sell', shares: Math.min(n, h.shares), price: sp });
  }
  renderStockModal(true);
}

/* ─────────── Rebalancing ─────────── */
function openRebalance() {
  const H = Object.keys(S.holdings); const box = $('#rebalance-content');
  if (!H.length) { box.innerHTML = `<div class="empty-state">${img3d('scale', 56)}<p>Du brauchst Positionen zum Rebalancen.</p></div>`; openModal('rebalance-modal'); return; }
  const tv = totalValue();
  box.innerHTML = `<p style="font-size:13px;color:var(--text-dim);margin-bottom:12px">Lege die Zielgewichtung pro Position fest. Der Rest bleibt Cash.</p>
  <div style="display:flex;gap:6px;margin-bottom:12px"><button class="btn-outline" id="rb-equal">Gleichgewichten</button><button class="btn-outline" id="rb-cash">20% Cash-Reserve</button></div>
  ${H.map(k => { const w = M.stocks[k].price * S.holdings[k].shares / tv * 100; return `<div class="rb-row"><div class="rb-head"><span>${k}</span><b><span data-rbv="${k}">${fmt(w, 1)}</span>%</b></div><input type="range" min="0" max="60" step="0.5" value="${w.toFixed(1)}" data-rb="${k}"/><div class="rb-diff" data-rbd="${k}">±0 Stk</div></div>`; }).join('')}
  <div class="op-summary"><div class="ops-row"><span>Investiert (Ziel)</span><span id="rb-sum">–</span></div><div class="ops-row"><span>Cash (Ziel)</span><span id="rb-cashv">–</span></div></div>
  <button class="btn-neon full-width" id="rb-apply">Rebalancing ausführen</button>`;
  const upd = () => { let sum = 0; $$('[data-rb]').forEach(r => { const k = r.dataset.rb, w = +r.value; sum += w; $(`[data-rbv="${k}"]`).textContent = fmt(w, 1); const tgt = Math.floor(tv * w / 100 / M.stocks[k].price); const d = tgt - S.holdings[k].shares; $(`[data-rbd="${k}"]`).innerHTML = `<span class="${cls(d)}">${d >= 0 ? '+' : ''}${d} Stk</span> → ${tgt} Stk`; }); $('#rb-sum').textContent = fmt(sum, 1) + '%'; $('#rb-cashv').textContent = fmt(100 - sum, 1) + '%'; $('#rb-apply').disabled = sum > 100; };
  $$('[data-rb]').forEach(r => r.oninput = upd);
  $('#rb-equal').onclick = () => { $$('[data-rb]').forEach(r => r.value = (95 / H.length).toFixed(1)); upd(); };
  $('#rb-cash').onclick = () => { $$('[data-rb]').forEach(r => r.value = (80 / H.length).toFixed(1)); upd(); };
  $('#rb-apply').onclick = () => {
    const plan = $$('[data-rb]').map(r => { const k = r.dataset.rb; return [k, Math.floor(tv * r.value / 100 / M.stocks[k].price) - S.holdings[k].shares]; });
    plan.filter(p => p[1] < 0).forEach(([k, d]) => executeTrade(k, 'sell', -d, M.stocks[k].price, 'Rebalancing'));
    plan.filter(p => p[1] > 0).forEach(([k, d]) => executeTrade(k, 'buy', d, M.stocks[k].price, 'Rebalancing'));
    closeModal('rebalance-modal'); addXP(20);
  };
  upd(); openModal('rebalance-modal');
}

/* ─────────── Academy ─────────── */
const LESSONS = [
  { id: 'intro', icon: 'rocket', t: 'Intro erneut ansehen', d: 'Das interaktive Onboarding noch einmal durchlaufen.', xp: 0, intro: true },
  { id: 'kgv', icon: 'chart', t: 'Kennzahlen meistern', d: 'KGV, EPS, Beta und Market Cap richtig lesen.', xp: 40, glow: 'rgba(0,255,136,.18)',
    body: '<h4>KGV (Kurs-Gewinn-Verhältnis)</h4>Kurs geteilt durch Gewinn je Aktie (EPS). Ein KGV von 15 bedeutet: Du zahlst das 15-fache des Jahresgewinns. <strong>Niedrig</strong> = günstig oder problematisch, <strong>hoch</strong> = hohe Wachstumserwartung.<h4>Beta</h4>Misst die Schwankung relativ zum Markt. Beta 2 = doppelt so stark wie der Index.<h4>Market Cap</h4>Kurs × Anzahl Aktien. Large Caps sind meist stabiler als Small Caps.',
    q: ['Eine Aktie hat ein Beta von 0,5. Was bedeutet das?', ['Sie schwankt halb so stark wie der Markt', 'Sie zahlt 0,5% Dividende', 'Sie ist 50% unterbewertet'], 0] },
  { id: 'div', icon: 'scale', t: 'Diversifikation', d: 'Warum du nie alles auf eine Karte setzen solltest.', xp: 40, glow: 'rgba(76,201,240,.18)',
    body: 'Diversifikation senkt das <strong>unsystematische Risiko</strong> einzelner Firmen. Mit 15–20 Aktien aus 5+ Sektoren eliminierst du den Großteil davon.<h4>Faustregeln</h4>Max. 20% pro Einzelwert, mehrere Sektoren und Regionen, regelmäßiges <strong>Rebalancing</strong>.',
    q: ['Welches Risiko kann man durch Diversifikation reduzieren?', ['Marktrisiko', 'Unternehmensspezifisches Risiko', 'Inflationsrisiko'], 1] },
  { id: 'timing', icon: 'target', t: 'Kauf- & Verkaufszeitpunkte', d: 'Limit-Orders, Stop-Loss und Gewinnmitnahmen.', xp: 50, glow: 'rgba(232,147,90,.2)',
    body: '<h4>Limit-Order</h4>Kauf/Verkauf nur zu deinem Wunschpreis oder besser.<h4>Stop-Loss</h4>Automatischer Verkauf, wenn der Kurs unter eine Schwelle fällt – begrenzt Verluste.<h4>Gewinne laufen lassen</h4>Ein häufiger Fehler: Gewinner zu früh verkaufen und Verlierer zu lange halten (<strong>Disposition-Effekt</strong>).',
    q: ['Wofür nutzt man eine Stop-Loss-Order?', ['Um Gewinne zu verdoppeln', 'Um Verluste zu begrenzen', 'Um Dividenden zu erhalten'], 1] },
  { id: 'strat', icon: 'crystal', t: 'Strategien', d: 'Value, Growth, Momentum, Dividende – wie die Bots denken.', xp: 50, glow: 'rgba(157,124,255,.2)',
    body: '<h4>Value</h4>Unterbewertete Aktien mit niedrigem KGV kaufen (wie <strong>Value-Viktor</strong>).<h4>Momentum</h4>Gewinner kaufen, Verlierer verkaufen (wie <strong>Hedge-Hanna</strong>).<h4>Dividende</h4>Stabile Ausschütter für Cashflow (wie <strong>Dividenden-Dieter</strong>).<h4>Passiv</h4>Index kaufen und halten – schlägt langfristig die meisten Profis.',
    q: ['Welche Strategie kauft Aktien, die zuletzt stark gestiegen sind?', ['Value', 'Momentum', 'Contrarian'], 1] },
  { id: 'psy', icon: 'fire', t: 'Trading-Psychologie', d: 'FOMO, Panik und wie du rational bleibst.', xp: 60, glow: 'rgba(255,77,109,.18)',
    body: 'Beobachte <strong>Panik-Paula</strong>: Sie verkauft bei jedem Dip und kauft aus FOMO auf Hochs – das kostet langfristig Rendite.<h4>Gegenmittel</h4>Feste Regeln vor dem Trade, Positionsgrößen begrenzen, Nachrichten nicht überbewerten.',
    q: ['Was beschreibt FOMO?', ['Angst, eine Kursrallye zu verpassen', 'Eine Ordertyp-Variante', 'Ein Dividendenmodell'], 0] }
];
function renderAcademy() {
  $('#xp-badge').textContent = `XP: ${S.xp} · Lvl ${level()}`;
  $('#academy-grid').innerHTML = LESSONS.map((l, i) => `<div class="academy-card ${S.lessons[l.id] ? 'done' : ''}" data-lesson="${l.id}" style="--ac-glow:${l.glow || 'rgba(0,255,136,.15)'};animation-delay:${i * 50}ms">${img3d(l.icon, 44)}<div class="ac-title">${l.t}</div><div class="ac-desc">${l.d}</div><div class="ac-foot"><span>${l.intro ? 'Onboarding' : '+' + l.xp + ' XP · Quiz'}</span><span>${S.lessons[l.id] ? '✅ Abgeschlossen' : '→ Starten'}</span></div></div>`).join('');
}
function openLesson(id) {
  const l = LESSONS.find(x => x.id === id); if (l.intro) return showOnboarding();
  $('#ldm-title').textContent = l.t;
  $('#ldm-content').innerHTML = `<div style="text-align:center;margin-bottom:10px">${img3d(l.icon, 72)}</div><div class="lesson-body">${l.body}</div><div class="quiz-box"><div class="quiz-q">🧠 ${l.q[0]}</div>${l.q[1].map((o, i) => `<button class="quiz-opt" data-qi="${i}">${o}</button>`).join('')}</div>`;
  $$('.quiz-opt').forEach(b => b.onclick = () => {
    const ok = +b.dataset.qi === l.q[2]; $$('.quiz-opt').forEach((x, i) => { x.disabled = true; if (i === l.q[2]) x.classList.add('correct'); }); if (!ok) b.classList.add('wrong');
    if (ok && !S.lessons[id]) { S.lessons[id] = Date.now(); addXP(l.xp); toast(`🎓 Lektion abgeschlossen! +${l.xp} XP`, 'success'); confetti(); checkAchievements(); save(); renderAcademy(); } else if (!ok) toast('Leider falsch – lies nochmal nach!', 'warn');
  });
  openModal('league-detail-modal');
}

/* ─────────── Profil ─────────── */
function openProfile() {
  const sells = S.trades.filter(t => t.side === 'sell'), wins = sells.filter(t => t.pnl > 0).length, best = sells.reduce((a, t) => Math.max(a, t.pnl), 0);
  const lv = level(), lo = (lv - 1) ** 2 * 50, hi = lv ** 2 * 50;
  $('#profile-content').innerHTML = `<div class="profile-hero"><div class="profile-av">${img3d(S.avatar, 84)}</div><div class="profile-name">${esc(S.name)}</div><div class="profile-level">LEVEL ${lv} · ${S.xp} XP</div><div class="xp-bar"><span style="width:${(S.xp - lo) / (hi - lo) * 100}%"></span></div></div>
  <div class="stat-grid"><div class="metric"><div class="metric-label">Depotwert</div><div class="metric-val">${usdShort(totalValue())}</div></div><div class="metric"><div class="metric-label">Trades</div><div class="metric-val">${S.trades.length}</div></div><div class="metric"><div class="metric-label">Trefferquote</div><div class="metric-val">${sells.length ? fmt(wins / sells.length * 100, 0) : 0}%</div></div><div class="metric"><div class="metric-label">Bester Trade</div><div class="metric-val positive">${usd(best, 0)}</div></div></div>
  <h3 class="section-title">${img3d('medal', 18)} Achievements</h3><div class="achievements">${ACH.map(a => `<div class="ach ${S.achievements[a.id] ? 'unlocked' : ''}">${img3d(a.icon, 30)}<small>${a.n}</small></div>`).join('')}</div>
  <h3 class="section-title">Einstellungen</h3><div class="settings-list">
   <div class="setting-row"><div>Name<small>Dein Trader-Name</small></div><input class="text-input" id="set-name" value="${esc(S.name)}" style="max-width:150px" maxlength="20"/></div>
   <div class="setting-row"><div>Avatar</div><div class="avatar-options">${Object.values(AVATARS).map(a => `<button class="av-btn ${a === S.avatar ? 'active' : ''}" data-setav="${a}" style="width:38px;height:38px">${img3d(a, 26)}</button>`).join('')}</div></div>
   <div class="setting-row"><div>Haptisches Feedback<small>Vibration bei Aktionen (sofern vom Gerät unterstützt)</small></div><input type="checkbox" id="set-haptic" ${S.haptics ? 'checked' : ''}/></div>
   <div class="setting-row api-row"><div>Echtzeit-Kurse (optional)<small>Kostenloser API-Key von finnhub.io – ohne Key läuft die Simulation.</small></div><div class="row2"><input class="text-input" id="set-key" type="password" placeholder="Finnhub API-Key" value="${esc(S.finnhubKey)}"/><button class="btn-sm-neon" id="save-key">Verbinden</button></div></div>
   <div class="setting-row"><div>Depot zurücksetzen<small>Startet mit 100.000 $ neu</small></div><button class="btn-outline" id="reset-all" style="color:var(--red)">Reset</button></div>
  </div>`;
  openModal('profile-modal');
  $('#set-name').onchange = e => { S.name = e.target.value.trim() || 'Trader'; save(); };
  $$('[data-setav]').forEach(b => b.onclick = () => { S.avatar = b.dataset.setav; save(); renderHeader(); openProfile(); });
  $('#set-haptic').onchange = e => { S.haptics = e.target.checked; save(); };
  $('#save-key').onclick = () => { S.finnhubKey = $('#set-key').value.trim(); save(); if (S.finnhubKey) { toast('Verbinde mit Finnhub…', 'info'); connectFinnhub(); } else { M.live = false; M.list.forEach(s => s.live = false); M.ws && M.ws.close(); toast('Simulation aktiv', 'info'); } };
  $('#reset-all').onclick = () => { if (confirm('Wirklich alles zurücksetzen?')) { const keep = { onboarded: true, name: S.name, avatar: S.avatar, finnhubKey: S.finnhubKey }; S = Object.assign(defaultState(), keep); save(); closeModal('profile-modal'); renderAll(); toast('Depot zurückgesetzt', 'info'); } };
}

/* ─────────── Modals ─────────── */
function openModal(id) { const m = document.getElementById(id); m.classList.remove('hidden', 'closing'); refreshIcons(); }
function closeModal(id) { const m = document.getElementById(id); if (m.classList.contains('hidden')) return; m.classList.add('closing'); setTimeout(() => { m.classList.add('hidden'); m.classList.remove('closing'); if (id === 'stock-modal') cur = null; }, 280); }
function enableSwipeClose(id) {
  const m = document.getElementById(id), sh = $('.modal-sheet', m); let y0 = null, dy = 0;
  sh.addEventListener('touchstart', e => { if (sh.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
  sh.addEventListener('touchmove', e => { if (y0 === null) return; dy = e.touches[0].clientY - y0; if (dy > 0) sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
  sh.addEventListener('touchend', () => { if (dy > 120) closeModal(id); sh.style.transform = ''; y0 = null; dy = 0; });
}

/* ─────────── Onboarding ─────────── */
let obStep = 0;
function showOnboarding() {
  obStep = 0; $('#onboarding').classList.remove('hidden'); setObStep(0);
  closeModal('league-detail-modal');
}
function setObStep(i) {
  obStep = i; $$('.ob-slide').forEach(s => s.classList.toggle('active', +s.dataset.slide === i));
  $$('.ob-step').forEach(s => { const n = +s.dataset.step; s.classList.toggle('active', n === i); s.classList.toggle('done', n < i); });
  $('#ob-next').textContent = i === 4 ? '🚀 Trading starten' : 'Weiter →';
  if (i === 2) $('#ob-pie').innerHTML = Object.values(SECTORS).map((s, k) => `<span style="flex:${[30, 20, 15, 20, 15][k]};background:${s.c}"></span>`).join('');
  haptic(8);
}
function finishOnboarding() {
  const n = $('#ob-username').value.trim(); if (n) S.name = n;
  const a = $('.av-btn.active'); if (a) S.avatar = AVATARS[a.dataset.av] || 'fox';
  const first = !S.onboarded; S.onboarded = true; save();
  $('#onboarding').classList.add('hidden'); renderAll();
  if (first) { toast(`Willkommen, ${S.name}! 100.000 $ stehen bereit.`, 'success'); confetti(); }
}
function decorateOnboarding() {
  ['rocket', 'chart', 'scale', 'trophy', 'gem'].forEach((n, i) => { const e = $(`.ob-slide[data-slide="${i}"] .ob-emoji`); if (e) e.innerHTML = img3d(n, 76); });
  $$('.bot-card-mini .bot-icon').forEach((e, i) => e.innerHTML = img3d(['shield', 'bolt', 'tornado'][i], 40));
  $$('.av-btn[data-av]').forEach(b => b.innerHTML = img3d(AVATARS[b.dataset.av], 32));
}

/* ─────────── Navigation & Events ─────────── */
function switchView(v) {
  currentView = v; $$('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v)); $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  $('.app-main').scrollTop = 0; haptic(8); renderView();
}
function renderView() {
  if (currentView === 'dashboard') renderDashboard(); else if (currentView === 'market') renderMarket(true); else if (currentView === 'portfolio') renderPortfolio(); else if (currentView === 'leagues') renderLeagues(); else renderAcademy();
  refreshIcons();
}
function renderAll() { renderHeader(); renderView(); }
let iconT; function refreshIcons() { clearTimeout(iconT); iconT = setTimeout(() => window.lucide && lucide.createIcons(), 30); }

function bindEvents() {
  $$('.nav-btn').forEach(b => b.onclick = () => switchView(b.dataset.view));
  $('#ob-next').onclick = () => obStep < 4 ? setObStep(obStep + 1) : finishOnboarding();
  $('#ob-skip').onclick = finishOnboarding;
  $$('.av-btn[data-av]').forEach(b => b.onclick = () => { $$('.av-btn[data-av]').forEach(x => x.classList.remove('active')); b.classList.add('active'); haptic(); });
  $('#profile-btn').onclick = openProfile;
  // Delegation für dynamische Listen
  document.addEventListener('click', e => {
    const sym = e.target.closest('[data-sym]'); if (sym && !e.target.closest('.modal')) return openStock(sym.dataset.sym);
    const mc = e.target.closest('.mini-chart-card'); if (mc) return openStock(mc.dataset.symbol);
    const lg = e.target.closest('[data-league]'); if (lg) return openLeague(+lg.dataset.league);
    const ls = e.target.closest('[data-lesson]'); if (ls) return openLesson(ls.dataset.lesson);
    const cn = e.target.closest('[data-cancel]'); if (cn) { S.orders = S.orders.filter(o => String(o.id) !== cn.dataset.cancel); save(); toast('Order storniert', 'info'); return renderPortfolio(); }
    const jp = e.target.closest('[data-joinpub]'); if (jp) return joinByCode(jp.dataset.joinpub);
    if (e.target.id === 'join-btn') return joinByCode(($('#join-code').value || '').toUpperCase());
    if (e.target.id === 'quick-bot') { const l = createLeague({ name: 'Bot-Duell #' + (S.leagues.length + 1), type: 'bot', capital: 100000, duration: 30, bots: Object.keys(BOTS) }); toast('🤖 Bot-Liga gestartet!', 'success'); renderLeagues(); return openLeague(l.id); }
  });
  $$('.ctab').forEach(b => b.onclick = () => { $$('.ctab').forEach(x => x.classList.remove('active')); b.classList.add('active'); communityTab = b.dataset.tab; renderCommunity(); });
  $$('.filter-btn[data-filter]').forEach(b => b.onclick = () => { $$('.filter-btn[data-filter]').forEach(x => x.classList.remove('active')); b.classList.add('active'); marketFilter = b.dataset.filter; renderMarket(true); });
  $$('.sort-btn').forEach(b => b.onclick = () => { $$('.sort-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); marketSort = b.dataset.sort; renderMarket(true); });
  $('#market-search').oninput = () => renderMarket(true);
  $$('.trb').forEach(b => b.onclick = () => { $$('.trb').forEach(x => x.classList.remove('active')); b.classList.add('active'); portRange = b.dataset.range; renderPortfolioChart(); });
  $$('.ltab').forEach(b => b.onclick = () => { $$('.ltab').forEach(x => x.classList.remove('active')); b.classList.add('active'); leagueTab = b.dataset.ltab; renderLeagues(); });
  // Stock modal
  $('#sm-close').onclick = $('#sm-backdrop').onclick = () => closeModal('stock-modal');
  $$('.sct').forEach(b => b.onclick = () => { $$('.sct').forEach(x => x.classList.remove('active')); b.classList.add('active'); smPeriod = b.dataset.p; renderStockModal(false); });
  $$('.op-tab').forEach(b => b.onclick = () => { $$('.op-tab').forEach(x => x.classList.remove('active')); b.classList.add('active'); side = b.dataset.ot; if (side === 'buy' && $('#op-type').value === 'stop') $('#op-type').value = 'market'; $('#op-type').dispatchEvent(new Event('change')); });
  $('#op-type').onchange = e => { const t = e.target.value; if (t === 'stop') { side = 'sell'; $$('.op-tab').forEach(x => x.classList.toggle('active', x.dataset.ot === 'sell')); } $('#op-limit-row').classList.toggle('hidden', t === 'market'); $('#op-limit-row label').textContent = t === 'stop' ? 'Stop-Preis ($)' : 'Limit-Preis ($)'; if (cur) $('#op-limit-price').value = (t === 'stop' ? cur.price * 0.92 : cur.price).toFixed(2); updateOrderSummary(); };
  $('#op-limit-price').oninput = updateOrderSummary; $('#op-shares').oninput = updateOrderSummary;
  $('#shares-minus').onclick = () => { $('#op-shares').value = Math.max(1, (+$('#op-shares').value || 1) - 1); haptic(5); updateOrderSummary(); };
  $('#shares-plus').onclick = () => { $('#op-shares').value = (+$('#op-shares').value || 0) + 1; haptic(5); updateOrderSummary(); };
  $$('.qp-btn').forEach(b => b.onclick = () => { if (!cur) return; const p = +b.dataset.pct / 100; const n = side === 'buy' ? Math.floor(S.cash * p / (cur.price * 1.0005)) : Math.floor((S.holdings[cur.sym]?.shares || 0) * p); $('#op-shares').value = Math.max(0, n); haptic(); updateOrderSummary(); });
  $('#op-execute').onclick = submitOrder;
  $('#sl-enable').onchange = e => $('#sl-controls').classList.toggle('hidden', !e.target.checked);
  $('#sl-range').oninput = e => $('#sl-pct-label').textContent = e.target.value;
  // League create
  $('#create-league-btn').onclick = () => { renderBotSelect(); openModal('league-modal'); };
  $('#lm-close').onclick = $('#lm-backdrop').onclick = () => closeModal('league-modal');
  $$('input[name="ltype"]').forEach(r => r.onchange = () => $('#bot-config').classList.toggle('hidden', r.value !== 'bot' || !r.checked));
  $('#stakes-enable').onchange = e => $('#stakes-config').classList.toggle('hidden', !e.target.checked);
  $('#stakes-amount').oninput = e => { const a = +e.target.value || 0; $('#stakes-info').textContent = `Pott bei 6 Spielern: ${a * 6} € · bei 8 Spielern: ${a * 8} €`; };
  $('#lf-create').onclick = () => {
    const name = $('#lf-name').value.trim(); if (!name) return toast('Bitte Liga-Namen eingeben', 'error');
    const type = $('input[name="ltype"]:checked').value; const bots = $$('.bot-select.selected').map(b => b.dataset.bot);
    if (type === 'bot' && !bots.length) return toast('Mindestens einen Bot wählen', 'error');
    const l = createLeague({ name, type, bots, capital: +$('#lf-capital').value, duration: +$('#lf-duration').value, stakes: $('#stakes-enable').checked && type !== 'bot', stakeAmount: +$('#stakes-amount').value || 5 });
    closeModal('league-modal'); toast(`🏆 Liga "${name}" erstellt!`, 'success'); confetti(); leagueTab = type === 'bot' ? 'bot-leagues' : 'my-leagues';
    $$('.ltab').forEach(x => x.classList.toggle('active', x.dataset.ltab === leagueTab)); renderLeagues(); setTimeout(() => openLeague(l.id), 350);
  };
  $('#ldm-close').onclick = $('#ldm-backdrop').onclick = () => closeModal('league-detail-modal');
  $('#rebalance-btn').onclick = openRebalance; $('#rb-close').onclick = () => closeModal('rebalance-modal'); $('#rebalance-modal .modal-backdrop').onclick = () => closeModal('rebalance-modal');
  $('#pm-close').onclick = $('#pm-backdrop').onclick = () => { closeModal('profile-modal'); renderAll(); };
  ['stock-modal', 'league-modal', 'league-detail-modal', 'rebalance-modal', 'profile-modal'].forEach(enableSwipeClose);
}
function renderBotSelect() {
  $('#bot-select-grid').innerHTML = Object.entries(BOTS).map(([k, b]) => `<button class="bot-select" data-bot="${k}">${img3d(b.icon, 30)}<div class="bs-name">${b.name}</div><div class="bs-diff">${b.label} <span class="diff-stars">${'★'.repeat(b.diff)}</span></div></button>`).join('');
  $$('.bot-select').forEach(b => b.onclick = () => { b.classList.toggle('selected'); haptic(); });
}
function joinByCode(code) {
  if (!/^[A-Z0-9]{6}$/.test(code)) return toast('Code muss 6 Zeichen haben', 'error');
  if (S.leagues.some(l => l.code === code)) return toast('Du bist bereits in dieser Liga', 'warn');
  const pub = PUBLIC_LEAGUES.find(p => p.code === code);
  const l = createLeague({ name: pub ? pub.name : 'Liga ' + code, type: pub ? 'public' : 'private', capital: 100000, duration: 30 }); l.code = code; save();
  toast(`✅ Liga ${l.name} beigetreten`, 'success'); renderLeagues(); setTimeout(() => openLeague(l.id), 300);
}

/* ─────────── Live-Loop ─────────── */
function loop() {
  marketTick();
  renderHeader();
  if (currentView === 'dashboard') renderDashboard();
  else if (currentView === 'market') renderMarket(false);
  else if (currentView === 'portfolio' && M.tick % 3 === 0) renderPortfolio();
  else if (currentView === 'leagues' && M.tick % 5 === 0) renderLeagues();
  if (cur) renderStockModal(false);
  if (M.tick % 10 === 0) { save(); checkAchievements(); }
}

/* ─────────── Boot ─────────── */
async function boot() {
  const fill = $('#boot-fill'), st = $('#boot-status');
  const steps = ['Lade Marktdaten…', 'Kalibriere Volatilität…', 'Wecke Trading-Bots…', 'Verbinde Ligen…', 'Bereit.'];
  load(); initMarket();
  for (let i = 0; i < 12; i++) generateNews();
  for (let i = 0; i < steps.length; i++) { st.textContent = steps[i]; fill.style.width = ((i + 1) / steps.length * 100) + '%'; await new Promise(r => setTimeout(r, 260)); }
  decorateOnboarding(); bindEvents(); attachRipple(); attachTilt();
  $('#boot-splash').classList.add('fade'); setTimeout(() => $('#boot-splash').remove(), 650);
  $('#app').classList.remove('hidden');
  const v = new URLSearchParams(location.search).get('view'); if (v && $('#view-' + v)) switchView(v); else renderAll();
  if (!S.onboarded) showOnboarding();
  recordValue(); setInterval(loop, 2000); loadRealQuotes(true); setInterval(() => loadRealQuotes(false), 15000);
  if (S.finnhubKey) connectFinnhub();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) save(); });
}
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
document.addEventListener('DOMContentLoaded', boot);
