// ─────────────────────────────────────────────────────────────
// PAGES — HOME & MARKETS
// ─────────────────────────────────────────────────────────────

'use strict';

// ══════════════════════════════════════════════
// HOME
// ══════════════════════════════════════════════
async function initHome() {
  const movers = await fetchMovers();
  buildTicker();
  renderHomeTiles();
  renderHomeMovers(movers);

  const ls = $('liveStatus');
  if (ls) {
    ls.textContent = 'LIVE · ' + new Date().toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'});
  }
  toast('Market data loaded ✓', true);
}

function renderHomeTiles() {
  const TILES = [
    { id: 'tile-aapl', sym: 'AAPL', name: 'Apple Inc.' },
    { id: 'tile-msft', sym: 'MSFT', name: 'Microsoft' },
    { id: 'tile-nvda', sym: 'NVDA', name: 'NVIDIA' },
    { id: 'tile-tsla', sym: 'TSLA', name: 'Tesla' },
  ];
  TILES.forEach(({ id, sym, name }) => {
    const el = $(id);
    if (!el) return;
    const q = LQ[sym];
    if (!q || !q.price) return;
    const cls = clsChg(q.changePct);
    const arrow = q.changePct >= 0 ? '▲' : '▼';
    el.querySelector('.st-price').textContent = fmtPrice(q.price);
    el.querySelector('.st-chg').className = 'st-chg ' + cls;
    el.querySelector('.st-chg').textContent = arrow + ' ' + fmtPct(q.changePct);
  });
}

function renderHomeMovers(movers) {
  const tbody = $('homeMovers');
  if (!tbody) return;
  if (!movers.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="state-empty">No data available</td></tr>';
    return;
  }
  tbody.innerHTML = movers.slice(0, 10).map(q => {
    const cls = clsChg(q.changePct);
    const arrow = q.changePct >= 0 ? '▲' : '▼';
    return `<tr onclick="goQuote('${q.symbol}')">
      <td><span class="tbl-sym">${q.symbol}</span></td>
      <td>${fmtPrice(q.price)}</td>
      <td class="${cls}">${arrow} ${fmtPct(q.changePct)}</td>
      <td class="${cls}">${fmtChg(q.change)}</td>
      <td>${fmtPrice(q.high)} / ${fmtPrice(q.low)}</td>
    </tr>`;
  }).join('');
}

// ══════════════════════════════════════════════
// MARKETS
// ══════════════════════════════════════════════
let _marketsChart = null;
let _marketsCurrentSym = 'AAPL';

async function initMarkets() {
  const movers = Object.values(LQ).length > 3
    ? Object.values(LQ)
    : await fetchMovers();

  renderMarketsList(movers);
  await loadMarketsChart(_marketsCurrentSym);
}

function renderMarketsList(movers) {
  const tbody = $('marketsList');
  if (!tbody) return;
  tbody.innerHTML = movers.map(q => {
    const cls = clsChg(q.changePct);
    const arrow = q.changePct >= 0 ? '▲' : '▼';
    const selected = q.symbol === _marketsCurrentSym ? 'style="background:rgba(201,168,76,.05)"' : '';
    return `<tr onclick="selectMarketsChart('${q.symbol}')" ${selected} id="mrow-${q.symbol}">
      <td><span class="tbl-sym">${q.symbol}</span></td>
      <td>${fmtPrice(q.price)}</td>
      <td class="${cls}">${arrow} ${fmtPct(q.changePct)}</td>
      <td class="${cls} t-mono" style="font-size:11px">${fmtChg(q.change)}</td>
    </tr>`;
  }).join('');
}

async function selectMarketsChart(sym) {
  _marketsCurrentSym = sym;
  // Highlight row
  $all('#marketsList tr').forEach(r => r.style.background = '');
  const row = $('mrow-' + sym);
  if (row) row.style.background = 'rgba(201,168,76,.05)';
  await loadMarketsChart(sym);
}

async function loadMarketsChart(sym) {
  const lbl = $('marketsChartLabel');
  if (lbl) lbl.textContent = sym + ' — Loading…';

  const candles = await fetchCandles(sym, 90, 'D');
  if (!candles.length) {
    if (lbl) lbl.textContent = sym + ' — No data';
    return;
  }

  const color = priceColor(candles);
  const labels = candles.map(c => {
    const d = new Date(c.time * 1000);
    return d.toLocaleDateString('en-US', {month:'short', day:'numeric'});
  });
  const prices = candles.map(c => c.close);

  if (lbl) {
    const last = prices[prices.length - 1];
    const first = prices[0];
    const pct = ((last - first) / first * 100).toFixed(2);
    const arrow = last >= first ? '▲' : '▼';
    lbl.innerHTML = `<span style="color:var(--text2)">${sym}</span> &nbsp;<span class="${clsChg(last-first)}">${arrow} ${pct}% (90d)</span>`;
  }

  const cv = $('marketsChart');
  if (!cv) return;

  if (_marketsChart) _marketsChart.destroy();
  _marketsChart = new Chart(cv.getContext('2d'), {
    type: 'line',
    data: { labels, datasets: [lineDataset(prices, color)] },
    options: {
      ...chartDefaults(),
      plugins: {
        ...chartDefaults().plugins,
        tooltip: {
          ...chartDefaults().plugins.tooltip,
          callbacks: { label: ctx => ' ' + fmtPrice(ctx.parsed.y) }
        }
      }
    }
  });
}
