import { isFnoSymbol } from '../charting/symbolUtils';

/**
 * Known corporate domains for Indian equity instruments & indices
 * used to retrieve official company favicons via Google Favicon service.
 */
export const SYMBOL_DOMAINS: Record<string, string> = {
  // Indices
  NIFTY: 'nseindia.com',
  'NIFTY 50': 'nseindia.com',
  'NIFTY BANK': 'nseindia.com',
  BANKNIFTY: 'nseindia.com',
  FINNIFTY: 'nseindia.com',
  MIDCPNIFTY: 'nseindia.com',
  SENSEX: 'bseindia.com',

  // Top Equities / NIFTY 50
  RELIANCE: 'ril.com',
  TCS: 'tcs.com',
  HDFCBANK: 'hdfcbank.com',
  INFY: 'infosys.com',
  ICICIBANK: 'icicibank.com',
  HINDUNILVR: 'hul.co.in',
  SBIN: 'sbi.co.in',
  BHARTIARTL: 'airtel.in',
  KOTAKBANK: 'kotak.com',
  LT: 'larsentoubro.com',
  ITC: 'itcportal.com',
  AXISBANK: 'axisbank.com',
  BAJFINANCE: 'bajajfinserv.in',
  MARUTI: 'marutisuzuki.com',
  TITAN: 'titancompany.in',
  SUNPHARMA: 'sunpharma.com',
  TATAMOTORS: 'tatamotors.com',
  ULTRACEMCO: 'ultratechcement.com',
  ASIANPAINT: 'asianpaints.com',
  WIPRO: 'wipro.com',
  HCLTECH: 'hcltech.com',
  NTPC: 'ntpc.co.in',
  POWERGRID: 'powergrid.in',
  ONGC: 'ongcindia.com',
  COALINDIA: 'coalindia.in',
  JSWSTEEL: 'jsw.in',
  TATASTEEL: 'tatasteel.com',
  ADANIENT: 'adanienterprises.com',
  ADANIPORTS: 'adaniports.com',
  BAJAJFINSV: 'bajajfinserv.in',
  BPCL: 'bharatpetroleum.in',
  BRITANNIA: 'britannia.co.in',
  CIPLA: 'cipla.com',
  DIVISLAB: 'divislabs.com',
  DRREDDY: 'drreddys.com',
  EICHERMOT: 'eicher.in',
  GRASIM: 'grasim.com',
  HEROMOTOCO: 'heromotocorp.com',
  HINDALCO: 'hindalco.com',
  INDUSINDBK: 'indusind.com',
  NESTLEIND: 'nestle.in',
  TECHM: 'techmahindra.com',
  APOLLOHOSP: 'apollohospitals.com',
  TATACONSUM: 'tataconsumer.com',
  SBILIFE: 'sbilife.co.in',
  HDFCLIFE: 'hdfclife.com',
  'BAJAJ-AUTO': 'bajajauto.com',
  BAJAJ_AUTO: 'bajajauto.com',
  LTIM: 'ltimindtree.com',
  SHRIRAMFIN: 'shriramfinance.in',
  TRENT: 'trentlimited.com',
  BEL: 'bel-india.in',
  HAL: 'hal-india.co.in',
  ZOMATO: 'zomato.com',
  JIOFIN: 'jfs.in',
  DLF: 'dlf.in',
  VBL: 'varunpepsi.com',
  CHOLAFIN: 'cholamandalam.com',
  VEDL: 'vedantalimited.com',
  PFC: 'pfcindia.com',
  RECLTD: 'recindia.nic.in',
  IOC: 'iocl.com',
  GAIL: 'gailonline.com',
  PIDILITIND: 'pidilite.com',
  SIEMENS: 'siemens.com',
  ABB: 'abb.com',
  INDIGO: 'goindigo.in',
  TVSMOTOR: 'tvsmotor.com',
  BOSCHLTD: 'bosch.in',
  HAVELLS: 'havells.com',
  POLYCAB: 'polycab.com',
  MOTHERSON: 'motherson.com',
  AMBUJACEM: 'ambujacement.com',
  PNB: 'pnbindia.in',
  BANKBARODA: 'bankofbaroda.in',
  CANBK: 'canarabank.com',
  UNIONBANK: 'unionbankofindia.co.in',
  IDFCFIRSTB: 'idfcfirstbank.com',
  FEDERALBNK: 'federalbank.co.in',
  AUROPHARMA: 'aurobindo.com',
  LUPIN: 'lupin.com',
  ZYDUSLIFE: 'zyduslife.com',
  MUTHOOTFIN: 'muthootfinance.com',
  PERSISTENT: 'persistent.com',
  COFORGE: 'coforge.com',
  MPHASIS: 'mphasis.com',
  LTTS: 'ltts.com',
  DIXON: 'dixoninfo.com',
  PAYTM: 'paytm.com',
  POLICYBZR: 'policybazaar.com',
  NYKAA: 'nykaa.com',
  IRCTC: 'irctc.co.in',
  IRFC: 'irfc.co.in',
  RVNL: 'rvnl.org',
  BHEL: 'bhel.com',
  NMDC: 'nmdc.co.in',
  SAIL: 'sail.co.in',
  NATIONALUM: 'nalcoindia.com',
  EXIDEIND: 'exideindustries.com',
  COLPAL: 'colgatepalmolive.co.in',
  DABUR: 'dabur.com',
  GODREJCP: 'godrejcp.com',
  MARICO: 'marico.com',
  BERGEPAINT: 'bergerpaints.com',
};

/** Normalize symbol by stripping exchanges, colons, or suffixes like -EQ / .NS */
/** Normalize symbol by stripping exchanges, colons, or suffixes like -EQ / -SM / .NS */
export function cleanSymbol(symbol: string): string {
  if (!symbol) return '';
  return symbol
    .split(':')
    .pop()!
    .replace(/(\.NS|\.BO|-EQ)$/i, '')
    .replace(/(\.NS|\.BO|-EQ|-SM|-BE|-BZ|-ST|-BL)$/i, '')
    .trim()
    .toUpperCase();
}

/** Get company domain for a symbol, if known */
export function getSymbolDomain(symbol: string): string | null {
  const clean = cleanSymbol(symbol);
  return SYMBOL_DOMAINS[clean] || null;
}

/** Layer 1: Local Static SVG path */
export function getLocalLogoUrl(symbol: string): string {
  const clean = cleanSymbol(symbol);
  return `/logos/${clean}.svg`;
}

/** Layer 2: Google Favicon service URL */
export function getGoogleFaviconUrl(domain: string, size = 128): string {
  return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${encodeURIComponent(
    domain
  )}&size=${size}`;
}

/** Layer 3: Initials fallback text */
export function getSymbolInitials(symbol: string): string {
  const upper = symbol?.trim()?.toUpperCase() || '';
  if (!upper) return '•';
  if (upper.endsWith('CE')) return 'CE';
  if (upper.endsWith('PE')) return 'PE';
  if (upper.endsWith('FUT')) return 'FU';
  const clean = cleanSymbol(upper);
  return clean.slice(0, 2);
}

/** Layer 3: Deterministic HSL theme colors for initials badge */
export function getSymbolColor(symbol: string): { bg: string; text: string; border: string } {
  const upper = symbol?.trim()?.toUpperCase() || '';
  if (upper.endsWith('CE')) {
    return {
      bg: 'rgba(16, 185, 129, 0.15)',
      text: '#34d399',
      border: 'rgba(16, 185, 129, 0.3)',
    };
  }
  if (upper.endsWith('PE')) {
    return {
      bg: 'rgba(244, 63, 94, 0.15)',
      text: '#fb7185',
      border: 'rgba(244, 63, 94, 0.3)',
    };
  }
  if (upper.endsWith('FUT')) {
    return {
      bg: 'rgba(99, 102, 241, 0.15)',
      text: '#818cf8',
      border: 'rgba(99, 102, 241, 0.3)',
    };
  }

  let hash = 0;
  for (let i = 0; i < upper.length; i++) {
    hash = upper.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return {
    bg: `hsla(${hue}, 65%, 45%, 0.14)`,
    text: `hsl(${hue}, 80%, 65%)`,
    border: `hsla(${hue}, 65%, 45%, 0.28)`,
  };
}

/**
 * Resolves a logo URL for TradingView Charting Library search results & symbol info.
 * Supports equities, indices, F&O contracts, and bond tickers (extracting underlying company ticker).
 */
export function getTradingViewLogoUrls(symbol: string): string[] | undefined {
  if (!symbol) return undefined;
  const upper = symbol.trim().toUpperCase();

  // 1. Direct clean symbol
  const clean = cleanSymbol(upper);
  let ticker = clean;

  // 2. If F&O contract (e.g. RELIANCE24APRFUT -> RELIANCE, NIFTY24DEC24000CE -> NIFTY)
  if (isFnoSymbol(clean)) {
    const fnoMatch = clean.match(/^[A-Z]+/);
    if (fnoMatch && fnoMatch[0]) {
      ticker = fnoMatch[0];
    }
  } else if (!SYMBOL_DOMAINS[ticker]) {
    // 3. If it's a bond/debenture symbol like "0IRFC35-N0" or "647IRFC28-N0",
    // extract the core alphabetic ticker
    const match = upper.match(/[A-Z]{3,}/);
    if (match && match[0]) {
      ticker = match[0];
    }
  }

  if (!ticker) return undefined;
  return [`/logos/${encodeURIComponent(ticker)}.svg`];
}

/**
 * Resolves an exchange logo URL for TradingView Charting Library.
 */
export function getTradingViewExchangeLogoUrl(exchange?: string): string | undefined {
  const ex = (exchange || 'NSE').trim().toUpperCase();
  const name = ex === 'BSE' ? 'BSE' : 'NSE';
  return `/logos/${name}.svg`;
}

