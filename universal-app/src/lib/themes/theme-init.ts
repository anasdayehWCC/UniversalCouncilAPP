import { STORAGE_KEYS, THEME_CLASSES, type ColorMode } from './index';

const THEME_PREFERENCE_PREFIX = 'theme-preference';

export function getThemeInitScript(defaultColorMode: ColorMode = 'system'): string {
  return `
(function() {
  try {
    var preferencePrefix = '${THEME_PREFERENCE_PREFIX}';
    var lastScopeKey = preferencePrefix + ':last-scope';
    var bootstrapKey = preferencePrefix + ':bootstrap';
    var legacyColorModeKey = '${STORAGE_KEYS.colorMode}';
    var scope = null;
    var rawPreference = null;

    try {
      scope = localStorage.getItem(lastScopeKey);
    } catch (scopeError) {}

    if (scope) {
      try {
        rawPreference = localStorage.getItem(preferencePrefix + ':' + scope);
      } catch (scopePreferenceError) {}
    }

    if (!rawPreference) {
      try {
        rawPreference = localStorage.getItem(bootstrapKey);
      } catch (bootstrapError) {}
    }

    if (!rawPreference) {
      try {
        rawPreference = localStorage.getItem(legacyColorModeKey);
      } catch (legacyError) {}
    }

    var mode = '${defaultColorMode}';

    if (rawPreference) {
      try {
        var parsed = JSON.parse(rawPreference);
        if (parsed && typeof parsed.colorMode === 'string') {
          mode = parsed.colorMode;
        } else if (rawPreference === 'light' || rawPreference === 'dark' || rawPreference === 'system') {
          mode = rawPreference;
        }
      } catch (parseError) {
        if (rawPreference === 'light' || rawPreference === 'dark' || rawPreference === 'system') {
          mode = rawPreference;
        }
      }
    }

    if (mode === 'system') {
      mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    var root = document.documentElement;
    var body = document.body;
    var isDark = mode === 'dark';
    var themeClass = isDark ? '${THEME_CLASSES.dark}' : '${THEME_CLASSES.light}';
    var modeClass = isDark ? 'dark' : 'light';
    var council = 'default';

    try {
      council = localStorage.getItem('${STORAGE_KEYS.councilId}') || 'default';
    } catch (councilError) {}

    root.classList.remove('${THEME_CLASSES.light}', '${THEME_CLASSES.dark}', 'light', 'dark');
    root.classList.add(themeClass);
    root.classList.add(modeClass);
    root.style.colorScheme = mode;
    root.setAttribute('data-theme', mode);
    root.setAttribute('data-council', council);

    if (body) {
      body.classList.remove('${THEME_CLASSES.light}', '${THEME_CLASSES.dark}', 'light', 'dark');
      body.classList.add(themeClass);
      body.classList.add(modeClass);
      body.setAttribute('data-theme', mode);
      body.setAttribute('data-council', council);
      body.style.colorScheme = mode;
    } else {
      window.addEventListener('DOMContentLoaded', function () {
        var bodyEl = document.body;
        if (!bodyEl) return;
        bodyEl.classList.remove('${THEME_CLASSES.light}', '${THEME_CLASSES.dark}', 'light', 'dark');
        bodyEl.classList.add(themeClass);
        bodyEl.classList.add(modeClass);
        bodyEl.setAttribute('data-theme', mode);
        bodyEl.setAttribute('data-council', council);
        bodyEl.style.colorScheme = mode;
      });
    }
    root.classList.add('council-' + council);
    if (body) {
      body.classList.add('council-' + council);
    }
  } catch (e) {}
})();
`.trim();
}
