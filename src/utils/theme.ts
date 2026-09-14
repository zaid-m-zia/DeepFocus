export interface Theme {
  id: string;
  name: string;
  type: 'light' | 'dark';
  bg: string;
  surface: string;
  sub: string;
  text: string;
  main: string;
}

export const THEMES: Theme[] = [
  {
    id: 'paper',
    name: 'Paper',
    type: 'light',
    bg: '#f4f0ea',
    surface: '#e8e2d7',
    sub: '#8a8277',
    text: '#282420',
    main: '#c25530',
  },
  {
    id: 'dusk',
    name: 'Dusk',
    type: 'dark',
    bg: '#1a1817',
    surface: '#252220',
    sub: '#746c65',
    text: '#e5dfd8',
    main: '#d87b54',
  },
  {
    id: 'forest',
    name: 'Forest',
    type: 'dark',
    bg: '#141816',
    surface: '#1d2320',
    sub: '#5c6b63',
    text: '#dbe5e0',
    main: '#7ba78d',
  },
  {
    id: 'slate',
    name: 'Slate',
    type: 'dark',
    bg: '#15171b',
    surface: '#1e2127',
    sub: '#636c7c',
    text: '#e3e7ee',
    main: '#8fa5bf',
  },
  {
    id: 'sand',
    name: 'Sand',
    type: 'light',
    bg: '#f6f3ed',
    surface: '#ece5db',
    sub: '#8f8677',
    text: '#332e26',
    main: '#967852',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    type: 'light',
    bg: '#fbf4f4',
    surface: '#f2e5e5',
    sub: '#9f8586',
    text: '#322224',
    main: '#c76677',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    type: 'dark',
    bg: '#0f1115',
    surface: '#171a21',
    sub: '#586173',
    text: '#dde3ef',
    main: '#e6af56',
  },
  {
    id: 'carbon',
    name: 'Carbon',
    type: 'dark',
    bg: '#131315',
    surface: '#1d1d21',
    sub: '#61616c',
    text: '#ededf4',
    main: '#e0e0e8',
  },
  {
    id: 'botanical',
    name: 'Botanical',
    type: 'light',
    bg: '#f3f6f2',
    surface: '#e5ede3',
    sub: '#798b7a',
    text: '#233025',
    main: '#497c59',
  },
  {
    id: 'nord',
    name: 'Nord',
    type: 'dark',
    bg: '#242933',
    surface: '#2f3542',
    sub: '#79879f',
    text: '#eceff4',
    main: '#88c0d0',
  },
  {
    id: 'coffee',
    name: 'Coffee',
    type: 'dark',
    bg: '#1c1613',
    surface: '#27201b',
    sub: '#7d6b5f',
    text: '#eee3dc',
    main: '#c29173',
  },
  {
    id: 'monokai',
    name: 'Monokai',
    type: 'dark',
    bg: '#1e1f1c',
    surface: '#292a25',
    sub: '#76725e',
    text: '#f8f8f2',
    main: '#a6e22e',
  },
  {
    id: 'matcha',
    name: 'Matcha',
    type: 'light',
    bg: '#f3f5ee',
    surface: '#e6ebd9',
    sub: '#7f8a70',
    text: '#22291d',
    main: '#607c3c',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    type: 'light',
    bg: '#f6f4fa',
    surface: '#eae5f5',
    sub: '#8a7e9e',
    text: '#292138',
    main: '#785bb0',
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    type: 'dark',
    bg: '#16161e',
    surface: '#1f2335',
    sub: '#565f89',
    text: '#c0caf5',
    main: '#7aa2f7',
  },
  {
    id: 'rose-pine',
    name: 'Rosé Pine',
    type: 'dark',
    bg: '#191724',
    surface: '#21202e',
    sub: '#6e6a86',
    text: '#e0def4',
    main: '#ebbcba',
  },
  {
    id: 'sol-light',
    name: 'Solarized',
    type: 'light',
    bg: '#fdf6e3',
    surface: '#eee8d5',
    sub: '#839496',
    text: '#073642',
    main: '#b58900',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    type: 'dark',
    bg: '#0d0e15',
    surface: '#181a26',
    sub: '#5d6387',
    text: '#e7eaf6',
    main: '#ff2a6d',
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    type: 'light',
    bg: '#f8f3ef',
    surface: '#ece2d8',
    sub: '#927b6f',
    text: '#36221b',
    main: '#c46845',
  },
  {
    id: 'abyss',
    name: 'Abyss',
    type: 'dark',
    bg: '#0b1017',
    surface: '#131c27',
    sub: '#4a6078',
    text: '#d8e5f2',
    main: '#38bdf8',
  },
];

const THEME_STORAGE_KEY = 'deepfocus_theme_id';

export function getStoredThemeId(): string {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'paper';
  } catch {
    return 'paper';
  }
}

export function setStoredThemeId(themeId: string): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch (e) {
    console.error('Failed to save theme', e);
  }
}

export function getThemeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function updateBrowserFavicon(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
  if (!link) return;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <rect width="512" height="512" rx="128" fill="${theme.bg}" />
    <circle cx="256" cy="256" r="170" fill="none" stroke="${theme.sub}" stroke-width="28" stroke-dasharray="24 16" stroke-opacity="0.45" />
    <circle cx="256" cy="256" r="170" fill="none" stroke="${theme.main}" stroke-width="34" stroke-linecap="round" stroke-dasharray="460 540" />
    <circle cx="256" cy="256" r="110" fill="none" stroke="${theme.sub}" stroke-width="20" stroke-opacity="0.4" />
    <circle cx="256" cy="256" r="54" fill="${theme.main}" />
    <circle cx="256" cy="256" r="20" fill="${theme.bg}" />
  </svg>`;

  const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  link.href = encoded;
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--bg', theme.bg);
  root.style.setProperty('--surface', theme.surface);
  root.style.setProperty('--sub', theme.sub);
  root.style.setProperty('--text', theme.text);
  root.style.setProperty('--main', theme.main);

  if (document.body) {
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;
  }

  if (theme.type === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme.bg);
  }

  updateBrowserFavicon(theme);
}

export function initTheme(): Theme {
  const id = getStoredThemeId();
  const theme = getThemeById(id);
  applyTheme(theme);
  return theme;
}

