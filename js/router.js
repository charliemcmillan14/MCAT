// ─────────────────────────────────────────────────────────────
// ROUTER.JS — page navigation, keyboard shortcuts
// ─────────────────────────────────────────────────────────────

'use strict';

const PAGES = ['home', 'markets', 'quote', 'news', 'crypto', 'sentiment', 'earnings', 'portfolio', 'simulator'];
const _inited = {};

function go(name) {
  if (!PAGES.includes(name)) return;

  PAGES.forEach(p => {
    const el = $('page-' + p);
    if (el) el.classList.toggle('active', p === name);
  });

  // Update nav active state
  $all('.nb').forEach(b => {
    b.classList.toggle('active', b.dataset.page === name);
  });

  window.scrollTo(0, 0);

  // Init page once on first visit
  if (!_inited[name]) {
    _inited[name] = true;
    _initPage(name);
  } else {
    // Re-render pages that need fresh data on revisit
    if (name === 'home') renderHomeTiles();
  }
}

async function _initPage(name) {
  switch (name) {
    case 'home':       await initHome();       break;
    case 'markets':    await initMarkets();    break;
    case 'quote':      initQuotePage();        break;
    case 'news':       await initNews();       break;
    case 'crypto':     await initCrypto();     break;
    case 'sentiment':  await initSentiment();  break;
    case 'earnings':   await initEarnings();   break;
    case 'portfolio':  initPortfolio();        break;
    case 'simulator':  initSimulator();        break;
  }
}

// Navigate to quote page with a symbol pre-loaded
async function goQuote(symbol) {
  go('quote');
  const inp = $('quoteInput');
  if (inp) inp.value = symbol;
  await renderQuote(symbol);
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  const map = { '1':'home', '2':'markets', '3':'quote', '4':'news', '5':'crypto', '6':'sentiment', '7':'earnings', '8':'portfolio', '9':'simulator' };
  if (map[e.key]) go(map[e.key]);
});
