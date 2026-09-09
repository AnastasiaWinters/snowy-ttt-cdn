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
        return {
          theme: defaults.theme,
          fontSize: defaults.fontSize,
          lineHeight: defaults.lineHeight
        };
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
      return {
        theme: defaults.theme,
        fontSize: defaults.fontSize,
        lineHeight: defaults.lineHeight
      };
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
      '@font-face { font-family: "Stratum No2 Bold"; src: url("fonts/stratumno2_bold.otf") format("opentype"); font-weight: 700; font-style: normal; }',
      'html, body { font-family: "Stratum No2 Bold", sans-serif; font-weight: 700; }',
      '.welcome-heading { margin-top: 0; text-align: center; }',
      '.welcome-heading .snow-text { font-size: 2em; }',
      '.welcome-title-emphasis { font-size: 2em; }',
      '.snow-text { display: inline-block; position: relative; text-shadow: 0 0 6px currentColor; }',
      '.snow-dot { position: absolute; top: 0; left: 50%; width: 4px; height: 4px; border-radius: 50%; background: currentColor; opacity: 0; pointer-events: none; -webkit-animation: snowfall 6s linear infinite; animation: snowfall 6s linear infinite; }',
      '@-webkit-keyframes snowfall { 0% { -webkit-transform: translateY(-1.2em); opacity: 0; } 12% { opacity: .25; } 78% { opacity: .25; } 100% { -webkit-transform: translateY(2.8em); opacity: 0; } }',
      '@keyframes snowfall { 0% { transform: translateY(-1.2em); opacity: 0; } 12% { opacity: .25; } 78% { opacity: .25; } 100% { transform: translateY(2.8em); opacity: 0; } }',
      '#style-customizer { position: fixed; right: 1rem; bottom: 1rem; z-index: 10000; font: 14px/1.4 Arial, sans-serif; }',
      '#style-customizer button, #style-customizer select { font: inherit; }',
      '#style-customizer-toggle { border: 1px solid #38bdf8; border-radius: 999px; padding: .6rem .9rem; background: #1f2937; color: #f3f4f6; cursor: pointer; box-shadow: 0 3px 12px rgba(0,0,0,.3); }',
      '#style-customizer-panel { display: none; width: 280px; margin-bottom: .5rem; padding: 1rem; border: 1px solid #38bdf8; border-radius: .6rem; background: #1f2937; color: #f3f4f6; box-shadow: 0 3px 16px rgba(0,0,0,.35); }',
      '#style-customizer-panel.is-open { display: block; }',
      '#style-customizer-panel label { display: block; margin: .7rem 0 .25rem; }',
      '#style-customizer-panel select, #style-customizer-panel input { width: 100%; }',
      '#style-customizer-reset { margin-top: .8rem; padding: .4rem .7rem; border: 1px solid currentColor; border-radius: .3rem; background: transparent; color: inherit; cursor: pointer; }',
      'html[data-style-theme] body { background-color: #111827; color: #f3f4f6; }',
      'html[data-style-theme] .wrap, html[data-style-theme] .content, html[data-style-theme] .container { color: #f3f4f6; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function applyPreferences(preferences) {
    var theme = themes[preferences.theme];
    document.documentElement.setAttribute('data-style-theme', preferences.theme);
    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.text;
    document.body.style.fontSize = preferences.fontSize + '%';
    document.body.style.lineHeight = preferences.lineHeight;
  }

  function addSnowfallDots() {
    var snowTexts = document.querySelectorAll('.snow-text');
    for (var textIndex = 0; textIndex < snowTexts.length; textIndex += 1) {
      var snowText = snowTexts[textIndex];
      if (snowText.querySelector('.snow-dot')) {
        continue;
      }

      for (var index = 0; index < 20; index += 1) {
        var dot = document.createElement('span');
        dot.className = 'snow-dot';
        dot.setAttribute('aria-hidden', 'true');
        dot.style.left = (8 + Math.random() * 84) + '%';
        dot.style.width = '4px';
        dot.style.height = '4px';
        dot.style.webkitAnimationDelay = (-Math.random() * 7) + 's';
        dot.style.animationDelay = (-Math.random() * 7) + 's';
        snowText.appendChild(dot);
      }
    }
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

    var themeNames = Object.keys(themes);
    for (var themeIndex = 0; themeIndex < themeNames.length; themeIndex += 1) {
      var themeName = themeNames[themeIndex];
      var option = document.createElement('option');
      option.value = themeName;
      option.textContent = themes[themeName].label;
      themeSelect.appendChild(option);
    }

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
      preferences = {
        theme: defaults.theme,
        fontSize: defaults.fontSize,
        lineHeight: defaults.lineHeight
      };
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
