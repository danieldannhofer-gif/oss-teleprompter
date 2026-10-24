// Accessibility helpers: high-contrast mode and ARIA utilities

export const HIGH_CONTRAST_CLASS = 'teleprompter-high-contrast';

export const HIGH_CONTRAST_STYLES = `
.${HIGH_CONTRAST_CLASS} {
  --bg-color: #000000;
  --text-color: #ffffff;
  --accent-color: #ffff00;
  --border-color: #ffffff;
  --button-bg: #ffffff;
  --button-text: #000000;
}
.${HIGH_CONTRAST_CLASS} button {
  background: var(--button-bg) !important;
  color: var(--button-text) !important;
  border: 2px solid var(--border-color) !important;
}
.${HIGH_CONTRAST_CLASS} button:focus-visible {
  outline: 3px solid var(--accent-color) !important;
  outline-offset: 2px;
}
.${HIGH_CONTRAST_CLASS} [style*="background: black"],
.${HIGH_CONTRAST_CLASS} [style*="background: #000"] {
  background: #000000 !important;
}
.${HIGH_CONTRAST_CLASS} [style*="color: white"],
.${HIGH_CONTRAST_CLASS} [style*="color: #fff"] {
  color: #ffffff !important;
}
`;

let stylesInjected = false;

export function injectHighContrastStyles(): void {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.id = 'teleprompter-high-contrast-styles';
  style.textContent = HIGH_CONTRAST_STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
}

export function applyHighContrast(enabled: boolean): void {
  injectHighContrastStyles();
  const root = document.documentElement;
  if (enabled) {
    root.classList.add(HIGH_CONTRAST_CLASS);
  } else {
    root.classList.remove(HIGH_CONTRAST_CLASS);
  }
}
