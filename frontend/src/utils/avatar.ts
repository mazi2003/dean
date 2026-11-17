const AVATAR_PALETTES: ReadonlyArray<readonly [string, string, string]> = [
  ['#142D4E', '#245A91', '#93C5FD'],
  ['#0E1F36', '#1C3B65', '#60A5FA'],
  ['#1E3A5F', '#2B5B84', '#BFDBFE'],
  ['#4A1C24', '#8E2E28', '#FCA5A5'],
  ['#163A34', '#245A52', '#99F6E4'],
];

function extractInitials(fullName?: string): string {
  if (!fullName || !fullName.trim()) return 'DT';
  const cleaned = fullName.replace(/\([^)]*\)/g, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DT';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const avatarCache = new Map<string, string>();

/**
 * Generates an offline-safe institutional SVG monogram portrait URI for a student or staff member.
 */
export function getAvatarDataUri(fullName?: string): string {
  const key = (fullName || 'DemoTech').trim();
  const cached = avatarCache.get(key);
  if (cached) return cached;

  const [bgDark, bgAccent, ringAccent] = AVATAR_PALETTES[hashName(key) % AVATAR_PALETTES.length];
  const initials = extractInitials(key);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" role="img" aria-label="${key.replace(/"/g, '')}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${bgDark}"/><stop offset="100%" stop-color="${bgAccent}"/>` +
    `</linearGradient></defs>` +
    `<rect width="128" height="128" fill="url(#g)"/>` +
    `<circle cx="108" cy="20" r="34" fill="${ringAccent}" fill-opacity="0.14"/>` +
    `<circle cx="20" cy="112" r="28" fill="${ringAccent}" fill-opacity="0.1"/>` +
    `<rect x="6" y="6" width="116" height="116" rx="18" fill="none" stroke="${ringAccent}" stroke-opacity="0.35" stroke-width="1.5"/>` +
    `<text x="64" y="68" text-anchor="middle" dominant-baseline="central" fill="#FFFFFF" ` +
    `font-family="Inter, system-ui, -apple-system, sans-serif" font-size="44" font-weight="700" letter-spacing="1">${initials}</text>` +
    `</svg>`;

  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  avatarCache.set(key, uri);
  return uri;
}

/**
 * Resolves avatar image URL, replacing external Unsplash URLs or empty strings with local SVG portraits
 * so the portal works seamlessly offline and without third-party CDN SSL failures.
 */
export function resolveAvatarSrc(avatarUrl?: string, fullName?: string): string {
  if (!avatarUrl || avatarUrl.includes('images.unsplash.com')) {
    return getAvatarDataUri(fullName);
  }
  return avatarUrl;
}
