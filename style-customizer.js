(function () {
  'use strict';

  var STORAGE_KEY = 'ttt-style-preferences';
  var themes = {
    default: {
      label: 'Default',
      background: '#111827',
      surface: '#1f2937',
      text: '#f3f4f6',
      accent: '#38bdf8'
    },
    light: {
      label: 'Light',
      background: '#f3f4f6',
      surface: '#ffffff',
      text: '#1f2937',
      accent: '#0369a1'
    },
    highContrast: {
      label: 'High contrast',
      background: '#000000',
      surface: '#000000',
      text: '#ffffff',
      accent: '#ffff00'
    }
  };

  var defaults = {
    theme: 'default',
    fontSize: 100,
    lineHeight: 1.5
  };

  function readPreferences() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (!saved) {
        return Object.assign({}, defaults);
      }

      return {
        theme: themes[saved.theme] ? saved.theme : defaults.theme,
        fontSize: Number(saved.fontSize) >= 85 && Number(saved.fontSize) <= 125
          ? Number(saved.fontSize)
          : defaults.fontSize,
        lineHeight: Number(saved.lineHeight) >= 1.2 && Number(saved.lineHeight) <= 2
          ? Number(saved.lineHeight)
          : defaults.lineHeight
      };
    } catch (error) {
      return Object.assign({}, defaults);
    }
  }

  function savePreferences(preferences) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      // Preferences still apply for the current page when storage is unavailable.
    }
  }

  function addStyles() {
    if (document.getElementById('style-customizer-styles')) {
      return;
    }

    var style = document.createElement('style');
    style.id = 'style-customizer-styles';
    style.textContent = [
      '@font-face { font-family: "Stratum No2 Bold"; src: url("fonts/stratumno2_bold.otf") format("opentype"); font-weight: 700; font-style: normal; font-display: swap; }',
      'html, body { font-family: "Stratum No2 Bold", sans-serif; font-weight: 700; }',
      '.welcome-heading { margin-top: 0; text-align: center; }',
      '.welcome-heading .snow-text { font-size: 2em; }',
      '.welcome-title-emphasis { font-size: 2em; }',
      '.snow-text { display: inline-block; position: relative; text-shadow: 0 0 .35em color-mix(in srgb, currentColor 25%, transparent); }',
      '.snow-dot { position: absolute; top: 0; left: var(--snow-x); width: var(--snow-size); height: var(--snow-size); border-radius: 50%; background: currentColor; opacity: 0; pointer-events: none; animation: snowfall var(--snow-duration) linear var(--snow-delay) infinite; }',
      '@keyframes snowfall { 0% { transform: translateY(-1.2em); opacity: 0; } 12% { opacity: .25; } 78% { opacity: .25; } 100% { transform: translateY(2.8em); opacity: 0; } }',
      '#style-customizer { position: fixed; right: 1rem; bottom: 1rem; z-index: 10000; font: 14px/1.4 system-ui, sans-serif; color: var(--customizer-text); }',
      '#style-customizer button, #style-customizer select { font: inherit; }',
      '#style-customizer-toggle { border: 1px solid var(--customizer-accent); border-radius: 999px; padding: .6rem .9rem; background: var(--customizer-surface); color: var(--customizer-text); cursor: pointer; box-shadow: 0 3px 12px rgba(0,0,0,.3); }',
      '#style-customizer-panel { display: none; width: min(18rem, calc(100vw - 2rem)); margin-bottom: .5rem; padding: 1rem; border: 1px solid var(--customizer-accent); border-radius: .6rem; background: var(--customizer-surface); color: var(--customizer-text); box-shadow: 0 3px 16px rgba(0,0,0,.35); }',
      '#style-customizer-panel.is-open { display: block; }',
      '#style-customizer-panel label { display: block; margin: .7rem 0 .25rem; }',
      '#style-customizer-panel select, #style-customizer-panel input { width: 100%; }',
      '#style-customizer-reset { margin-top: .8rem; padding: .4rem .7rem; border: 1px solid currentColor; border-radius: .3rem; background: transparent; color: inherit; cursor: pointer; }',
      'html[data-style-theme] body { background-color: var(--customizer-background); color: var(--customizer-text); }',
      'html[data-style-theme] .wrap, html[data-style-theme] .content, html[data-style-theme] .container { color: var(--customizer-text); }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function applyPreferences(preferences) {
    var theme = themes[preferences.theme];
    document.documentElement.setAttribute('data-style-theme', preferences.theme);
    document.documentElement.style.setProperty('--customizer-background', theme.background);
    document.documentElement.style.setProperty('--customizer-surface', theme.surface);
    document.documentElement.style.setProperty('--customizer-text', theme.text);
    document.documentElement.style.setProperty('--customizer-accent', theme.accent);
    document.documentElement.style.setProperty('font-size', preferences.fontSize + '%');
    document.documentElement.style.setProperty('line-height', preferences.lineHeight);
  }

  function addSnowfallDots() {
    var snowTexts = document.querySelectorAll('.snow-text');
    snowTexts.forEach(function (snowText) {
      if (snowText.querySelector('.snow-dot')) {
        return;
      }

      for (var index = 0; index < 20; index += 1) {
        var dot = document.createElement('span');
        dot.className = 'snow-dot';
        dot.setAttribute('aria-hidden', 'true');
        dot.style.setProperty('--snow-x', (8 + Math.random() * 84) + '%');
        dot.style.setProperty('--snow-size', (0.027 + Math.random() * 0.033) + 'em');
        dot.style.setProperty('--snow-duration', (4.5 + Math.random() * 3) + 's');
        dot.style.setProperty('--snow-delay', (-Math.random() * 7) + 's');
        snowText.appendChild(dot);
      }
    });
  }

  function createCustomizer(preferences) {
    if (document.getElementById('style-customizer')) {
      return;
    }

    var wrapper = document.createElement('aside');
    wrapper.id = 'style-customizer';
    wrapper.setAttribute('aria-label', 'Style settings');
    wrapper.innerHTML = [
      '<div id="style-customizer-panel" aria-hidden="true">',
      '<label for="style-theme">Theme</label>',
      '<select id="style-theme"></select>',
      '<label for="style-font-size">Text size</label>',
      '<input id="style-font-size" type="range" min="85" max="125" step="5">',
      '<label for="style-line-height">Line spacing</label>',
      '<input id="style-line-height" type="range" min="1.2" max="2" step="0.1">',
      '<button id="style-customizer-reset" type="button">Reset styles</button>',
      '</div>',
      '<button id="style-customizer-toggle" type="button" aria-expanded="false" aria-controls="style-customizer-panel">Style settings</button>'
    ].join('');
    document.body.appendChild(wrapper);

    var panel = wrapper.querySelector('#style-customizer-panel');
    var toggle = wrapper.querySelector('#style-customizer-toggle');
    var themeSelect = wrapper.querySelector('#style-theme');
    var fontSize = wrapper.querySelector('#style-font-size');
    var lineHeight = wrapper.querySelector('#style-line-height');

    Object.keys(themes).forEach(function (themeName) {
      var option = document.createElement('option');
      option.value = themeName;
      option.textContent = themes[themeName].label;
      themeSelect.appendChild(option);
    });

    function update() {
      preferences.theme = themeSelect.value;
      preferences.fontSize = Number(fontSize.value);
      preferences.lineHeight = Number(lineHeight.value);
      applyPreferences(preferences);
      savePreferences(preferences);
    }

    themeSelect.value = preferences.theme;
    fontSize.value = preferences.fontSize;
    lineHeight.value = preferences.lineHeight;
    themeSelect.addEventListener('change', update);
    fontSize.addEventListener('input', update);
    lineHeight.addEventListener('input', update);
    toggle.addEventListener('click', function () {
      var isOpen = panel.classList.toggle('is-open');
      panel.setAttribute('aria-hidden', String(!isOpen));
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    wrapper.querySelector('#style-customizer-reset').addEventListener('click', function () {
      preferences = Object.assign({}, defaults);
      themeSelect.value = preferences.theme;
      fontSize.value = preferences.fontSize;
      lineHeight.value = preferences.lineHeight;
      update();
    });
  }

  function initialize() {
    var preferences = readPreferences();
    addStyles();
    applyPreferences(preferences);
    addSnowfallDots();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
}());
