// Vercel Serverless: echte Kurse von Yahoo Finance (kein API-Key nötig)
export default async function handler(req, res) {
  const syms = String(req.query.symbols || '').split(',').filter(Boolean).slice(0, 60);
  const out = {};
  await Promise.all(syms.map(async sym => {
    try {
      const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1y&interval=1d`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const j = await r.json(); const c = j.chart.result[0]; const m = c.meta;
      out[sym] = { price: m.regularMarketPrice, prevClose: m.chartPreviousClose || m.previousClose, daily: (c.indicators.quote[0].close || []).filter(v => v != null), hi52: m.fiftyTwoWeekHigh, lo52: m.fiftyTwoWeekLow, t: m.regularMarketTime };
    } catch (e) { }
  }));
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
  res.status(200).json(out);
}
