export interface LicenseState {
  token: string;
  unlocked: boolean;
  checking: boolean;
  notice: string;
}

interface CachedVerdict {
  valid: boolean;
  checkedAt: number;
  token: string;
}

const SLUG = 'actuals-job-sequencer';
const TOKEN_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${TOKEN_KEY}:verdict`;
const BILLING_BASE = import.meta.env.VITE_BILLING_BASE_URL || 'https://api.sociobot.in';

function readVerdict(): CachedVerdict | undefined {
  try {
    const parsed = JSON.parse(localStorage.getItem(VERDICT_KEY) || 'null') as CachedVerdict | null;
    return parsed && typeof parsed.valid === 'boolean' && typeof parsed.checkedAt === 'number' && typeof parsed.token === 'string' ? parsed : undefined;
  } catch { return undefined; }
}

export function checkoutUrl(): string {
  return `${BILLING_BASE}/api/v1/products/${SLUG}/checkout`;
}

export function initialLicense(): LicenseState {
  const url = new URL(window.location.href);
  const incoming = url.searchParams.get('license')?.trim();
  if (incoming) {
    localStorage.setItem(TOKEN_KEY, incoming);
    localStorage.removeItem(VERDICT_KEY);
    url.searchParams.delete('license');
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }
  const token = incoming || localStorage.getItem(TOKEN_KEY) || '';
  const cached = readVerdict();
  return {
    token,
    unlocked: Boolean(token && cached?.token === token && cached.valid),
    checking: Boolean(token),
    notice: ''
  };
}

export async function verifyLicense(state: LicenseState, force = false): Promise<LicenseState> {
  if (!state.token || !navigator.onLine) return { ...state, checking: false };
  const cached = readVerdict();
  const oneDay = 24 * 60 * 60 * 1000;
  if (!force && cached?.token === state.token && Date.now() - cached.checkedAt < oneDay) {
    return { ...state, unlocked: cached.valid, checking: false };
  }
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`${BILLING_BASE}/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(state.token)}`, { signal: controller.signal });
    window.clearTimeout(timeout);
    if (!response.ok) throw new Error('Verification service unavailable.');
    const result = await response.json() as { valid?: boolean; reason?: string };
    const valid = result.valid === true;
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid, checkedAt: Date.now(), token: state.token }));
    return {
      ...state,
      unlocked: valid,
      checking: false,
      notice: valid ? 'Crew edition unlocked on this device.' : 'License no longer active. You can check the token or buy a new license.'
    };
  } catch {
    return { ...state, checking: false, notice: state.unlocked ? '' : 'Could not verify the license. Your free job remains available.' };
  }
}

export function storeLicense(token: string): LicenseState {
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
  return { token: token.trim(), unlocked: false, checking: true, notice: 'Checking this license…' };
}
