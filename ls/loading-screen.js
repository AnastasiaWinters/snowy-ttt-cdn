(function () {
  'use strict';

  var TEST_MAP = 'ttt_minecraft_b5';
  var MAP_IMAGE_DIRECTORY = 'img/maps/';
  var PROFILE_WORKER_URL = 'https://steam-profile-loader.snowysdiscordalt.workers.dev/';
  var FALLBACK_PROFILE_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23323a46"/%3E%3Ccircle cx="50" cy="38" r="18" fill="%23b8c3d1"/%3E%3Cpath d="M18 92c3-22 16-33 32-33s29 11 32 33" fill="%23b8c3d1"/%3E%3C/svg%3E';
  var genericState = document.getElementById('generic-state');
  var mapState = document.getElementById('map-state');
  var loadingScreen = document.getElementById('loading-screen');
  var mapBackground = document.getElementById('map-background');
  var mapPanel = document.querySelector('.map-panel');
  var mapPanelContent = document.getElementById('map-panel-content');
  var profileBlock = document.querySelector('.profile-block');
  var profileImage = document.getElementById('profile-image');
  var topPanelRule = document.getElementById('top-panel-rule');
  var gameMode = document.querySelector('.game-mode');
  var mapNameElement = document.getElementById('map-name');
  var playerNameElement = document.getElementById('player-name');
  var loadingTipElement = document.getElementById('loading-tip');
  var tutorialList = document.querySelector('.tutorial-list');
  var leftAnchoredElements = document.querySelectorAll(
    '.role-guide h3, .role-guide ul, .controls-guide ul, .tips-guide p'
  );
  var transitionStarted = false;
  var profileImageSources = [];
  var profileImageSourceIndex = 0;
  var welcomeUntil = Date.now() + 500;
  var transitionTimer = null;
  var pendingMapName = null;
  var activeMapName = null;
  var gameDetailsReceived = false;
  var testMode = false;
  var testMap = TEST_MAP;

  function scaleMapPanelContent() {
    var scale = Math.min(4, Math.max(.6, window.innerHeight / 1080));
    var focusedScale = Math.min(1, Math.max(.45, (window.innerHeight / 1080) * 1.25 - .25));
    var panelPaddingVertical = 48 * scale;
    var panelPaddingHorizontal = window.innerHeight <= 760 ? 0 : 40 * scale;
    var panelPaddingTop = panelPaddingVertical / 2;
    var panelWidth;
    var panelContentWidth;

    genericState.style.webkitTransform = 'translate(-50%, -50%) scale(' + scale + ')';
    genericState.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
    mapPanel.style.padding = panelPaddingTop + 'px ' + panelPaddingHorizontal + 'px ' + panelPaddingVertical + 'px';
    profileImage.style.width = (128 * focusedScale) + 'px';
    profileImage.style.height = (128 * focusedScale) + 'px';
    profileBlock.style.display = window.innerHeight <= 760 ? 'none' : 'block';
    topPanelRule.style.display = window.innerHeight <= 760 ? 'none' : 'block';
    gameMode.style.display = window.innerHeight <= 760 ? 'none' : 'block';
    tutorialList.style.paddingLeft = window.innerHeight <= 760 ? '2px' : '8px';
    tutorialList.style.paddingRight = window.innerHeight <= 760 ? '2px' : '8px';
    for (var elementIndex = 0; elementIndex < leftAnchoredElements.length; elementIndex += 1) {
      leftAnchoredElements[elementIndex].style.paddingLeft =
        window.innerWidth <= 800 ? Math.min(256, 256 * 480 / window.innerHeight) + 'px' : '';
    }

    if (window.innerWidth > 800) {
      panelWidth = 440 * scale;
      mapPanel.style.width = panelWidth + 'px';
    } else {
      panelWidth = window.innerWidth;
      mapPanel.style.width = panelWidth + 'px';
    }

    panelContentWidth = (panelWidth - (panelPaddingHorizontal * 2)) / scale;
    mapPanelContent.style.position = 'absolute';
    mapPanelContent.style.top = panelPaddingTop + 'px';
    mapPanelContent.style.left = '50%';
    mapPanelContent.style.width = panelContentWidth + 'px';
    mapPanelContent.style.webkitTransform = 'translateX(-50%) scale(' + scale + ')';
    mapPanelContent.style.transform = 'translateX(-50%) scale(' + scale + ')';
    mapPanelContent.style.marginRight = '0';
    mapPanelContent.style.marginLeft = '0';
  }

  function getParameter(name) {
    var requestedName = name.toLowerCase();
    var query = window.location.search.substring(1).split('&');
    var index;

    for (index = 0; index < query.length; index += 1) {
      var pair = query[index].split('=');
      var parameterName = decodeURIComponent(pair[0] || '').toLowerCase();
      if (parameterName === requestedName) {
        return decodeURIComponent((pair[1] || '').replace(/\+/g, ' '));
      }
    }

    return null;
  }

  function normalizeSteamId(steamId) {
    var value = String(steamId || '').trim();
    var legacyId = value.match(/^STEAM_[0-5]:([01]):(\d+)$/i);

    if (legacyId) {
      return String(76561197960265728 + (Number(legacyId[2]) * 2) + Number(legacyId[1]));
    }

    return value.replace(/[^0-9]/g, '');
  }

  function cleanMapName(mapName) {
    var value = String(mapName || '').trim().replace(/\\/g, '/');
    value = value.substring(value.lastIndexOf('/') + 1);
    value = value.replace(/\.bsp$/i, '');
    return value.replace(/[^a-zA-Z0-9_-]/g, '');
  }

  function readableMapName(mapName) {
    return String(mapName || 'Unknown Map')
      .replace(/^ttt_/, '')
      .replace(/^gm_/, '')
      .replace(/^de_/, '')
      .replace(/^cs_/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, function (letter) {
        return letter.toUpperCase();
      });
  }

  function setMapFontClass(mapName) {
    var lowerMapName = mapName.toLowerCase();
    var isTerrariaMap = lowerMapName.indexOf('terraria') !== -1;
    var isMinecraftMap = !isTerrariaMap &&
      lowerMapName.indexOf('mcdonalds') === -1 &&
      (lowerMapName.indexOf('minecraft') !== -1 || lowerMapName.indexOf('mc') !== -1);

    loadingScreen.classList.toggle('terraria-map', isTerrariaMap);
    loadingScreen.classList.toggle('minecraft-map', isMinecraftMap);
  }

  function addSnowfallDots() {
    var snowTexts = document.querySelectorAll('.generic-state .snow-text');
    var snowfallLetters = "!\"#$%&'()*+,-./0123456789:<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_'abcdefghijklmnopqrstuvwxyz{}~";
    var textIndex;
    var index;

    function animateRotation(rotationElement) {
      window.setTimeout(function () {
        var rotationTarget = -120 + Math.random() * 240;
        rotationElement.style.webkitTransition = '-webkit-transform 6s linear';
        rotationElement.style.transition = 'transform 6s linear';
        rotationElement.style.webkitTransform = 'rotate(' + rotationTarget + 'deg)';
        rotationElement.style.transform = rotationElement.style.webkitTransform;
      }, 0);
    }

    function spawnSnowfallDot(snowText) {
      var dot = document.createElement('span');
      var rotation = document.createElement('span');
      var rotationMotion = document.createElement('span');
      var glyph = document.createElement('span');
      dot.className = 'snow-dot';
      dot.setAttribute('aria-hidden', 'true');
      rotation.className = 'snow-rotation';
      rotation.style.webkitTransform = 'rotate(' + (Math.random() * 360) + 'deg)';
      rotation.style.transform = rotation.style.webkitTransform;
      rotationMotion.className = 'snow-rotation-motion';
      rotationMotion.style.webkitTransition = 'none';
      rotationMotion.style.transition = 'none';
      rotationMotion.style.webkitTransform = 'rotate(0deg)';
      rotationMotion.style.transform = 'rotate(0deg)';
      glyph.textContent = snowfallLetters.charAt(Math.floor(Math.random() * snowfallLetters.length));
      glyph.className = 'snow-glyph';
      dot.style.left = (8 + Math.random() * 84) + '%';
      dot.style.width = '4px';
      dot.style.height = '4px';
      dot.style.webkitAnimationDelay = '0s';
      dot.style.animationDelay = '0s';
      rotation.style.webkitAnimationDelay = '0s';
      rotation.style.animationDelay = '0s';
      glyph.style.webkitAnimationDelay = '0s';
      glyph.style.animationDelay = '0s';
      glyph.style.webkitAnimationDuration = (2.5 + Math.random() * 2) + 's';
      glyph.style.animationDuration = glyph.style.webkitAnimationDuration;
      animateRotation(rotationMotion);
      rotationMotion.appendChild(glyph);
      rotation.appendChild(rotationMotion);
      dot.appendChild(rotation);
      snowText.appendChild(dot);
      window.setTimeout(function (snowDot) {
        if (snowDot.parentNode) {
          snowDot.parentNode.removeChild(snowDot);
        }
      }, 3000, dot);
    }

    for (textIndex = 0; textIndex < snowTexts.length; textIndex += 1) {
      var snowText = snowTexts[textIndex];
      for (index = 0; index < 20; index += 1) {
        spawnSnowfallDot(snowText);
      }
    }

    window.setInterval(function () {
      for (var spawnIndex = 0; spawnIndex < snowTexts.length; spawnIndex += 1) {
        spawnSnowfallDot(snowTexts[spawnIndex]);
      }
    }, 150);
  }

  function loadRandomTip() {
    var request = new XMLHttpRequest();
    request.open('GET', 'tips.json', true);
    request.onreadystatechange = function () {
      var tips;
      var selectedTip;

      if (request.readyState !== 4 || request.status < 200 || request.status >= 300) {
        return;
      }

      try {
        tips = JSON.parse(request.responseText);
      } catch (error) {
        return;
      }

      if (!tips || !tips.length) {
        return;
      }

      selectedTip = tips[Math.floor(Math.random() * tips.length)];
      if (selectedTip && typeof selectedTip.text === 'string' && selectedTip.text) {
        var roles;
        var roleIndex;
        loadingTipElement.textContent = '';
        if (selectedTip.role && selectedTip.role !== 'NONE') {
          roles = selectedTip.role.split('/');
          loadingTipElement.appendChild(document.createTextNode(
            selectedTip.role.indexOf('Innocent') === 0 ? 'As an ' : 'As a '
          ));
          for (roleIndex = 0; roleIndex < roles.length; roleIndex += 1) {
            var roleLabel = document.createElement('span');
            roleLabel.className = 'tip-role tip-role-' + roles[roleIndex].toLowerCase();
            roleLabel.textContent = roles[roleIndex];
            loadingTipElement.appendChild(roleLabel);
            if (roleIndex < roles.length - 1) {
              loadingTipElement.appendChild(document.createTextNode('/'));
            }
          }
          loadingTipElement.appendChild(document.createTextNode(', '));
        }
        appendHighlightedTipText(selectedTip.text);
      }
    };
    request.send();
  }

  function appendHighlightedTipText(text) {
    var rolePattern = /(Jesters?|Traitors?|Detectives?|Innocents?)/g;
    var lastIndex = 0;
    var match;
    var roleName;
    var roleLabel;

    while ((match = rolePattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        loadingTipElement.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
      }

      roleName = match[0].replace(/s$/i, '');
      roleLabel = document.createElement('span');
      roleLabel.className = 'tip-role tip-role-' + roleName.toLowerCase();
      roleLabel.textContent = match[0];
      loadingTipElement.appendChild(roleLabel);
      lastIndex = rolePattern.lastIndex;
    }

    if (lastIndex < text.length) {
      loadingTipElement.appendChild(document.createTextNode(text.substring(lastIndex)));
    }
  }

  function configurePlayer(steamId, username) {
    var playerId = normalizeSteamId(steamId || getParameter('SteamId') || getParameter('SteamID64'));
    var name = username || getParameter('Username') || getParameter('Name') || 'Steam Player';
    var requestedAvatar = getParameter('Avatar') || getParameter('AvatarUrl');
    playerNameElement.textContent = name;

    if (playerId) {
      profileImageSources = [
        requestedAvatar,
        'https://steamcommunity.com/profiles/' + playerId + '/avatarfull.jpg',
        'https://steamcommunity.com/profiles/' + playerId + '/avatar.jpg',
        FALLBACK_PROFILE_IMAGE
      ].filter(Boolean);
      profileImageSourceIndex = 0;
      profileImage.src = profileImageSources[profileImageSourceIndex];
      profileImage.alt = name + ' Steam profile picture';
    } else {
      profileImageSources = [requestedAvatar || FALLBACK_PROFILE_IMAGE];
      profileImageSourceIndex = 0;
      profileImage.src = profileImageSources[profileImageSourceIndex];
      profileImage.alt = 'Default Steam profile picture';
    }

    if (playerId && !username) {
      loadProfileFromWorker(playerId);
    }
  }

  function loadProfileFromWorker(playerId) {
    var request = new XMLHttpRequest();
    request.open('GET', PROFILE_WORKER_URL + '?steamid=' + encodeURIComponent(playerId), true);
    request.onreadystatechange = function () {
      var profile;

      if (request.readyState !== 4 || request.status < 200 || request.status >= 300) {
        return;
      }

      try {
        profile = JSON.parse(request.responseText);
      } catch (error) {
        return;
      }

      if (profile && typeof profile.name === 'string' && profile.name) {
        playerNameElement.textContent = profile.name;
        profileImage.alt = profile.name + ' Steam profile picture';
      }

      if (profile && typeof profile.avatar === 'string' && profile.avatar) {
        profileImageSources = [profile.avatar, FALLBACK_PROFILE_IMAGE];
        profileImageSourceIndex = 0;
        profileImage.src = profileImageSources[profileImageSourceIndex];
      }
    };
    request.send();
  }

  profileImage.addEventListener('error', function () {
    profileImageSourceIndex += 1;
    if (profileImageSourceIndex < profileImageSources.length) {
      profileImage.src = profileImageSources[profileImageSourceIndex];
    }
  });

  function useMapImage(mapName) {
    var safeMapName = cleanMapName(mapName);
    var imagePath = MAP_IMAGE_DIRECTORY + safeMapName + '.jpg';
    var image = new Image();
    setMapFontClass(safeMapName);
    scaleMapPanelContent();

    image.onload = function () {
      mapBackground.style.backgroundImage = 'url("' + imagePath + '")';
      mapNameElement.textContent = readableMapName(safeMapName);
      mapBackground.classList.add('has-map-image');
      genericState.classList.add('is-hidden');
      mapState.classList.add('is-visible');
      transitionStarted = true;
      activeMapName = safeMapName;
    };

    image.onerror = function () {
      mapBackground.style.backgroundImage = 'none';
      mapNameElement.textContent = readableMapName(safeMapName);
      genericState.classList.add('is-hidden');
      mapState.classList.add('is-visible');
      transitionStarted = true;
      activeMapName = safeMapName;
    };

    image.src = imagePath;
  }

  function transitionToMap(mapName) {
    var safeMapName = cleanMapName(mapName);
    if (!safeMapName) {
      return;
    }

    pendingMapName = safeMapName;
    if (transitionStarted) {
      if (activeMapName !== safeMapName) {
        useMapImage(safeMapName);
      }
      return;
    }

    if (transitionTimer !== null) {
      return;
    }

    var waitTime = Math.max(0, welcomeUntil - Date.now());
    transitionTimer = window.setTimeout(function () {
      transitionTimer = null;
      useMapImage(pendingMapName);
    }, waitTime);
  }

  window.GameDetails = function (serverName, serverUrl, mapName, maxPlayers, steamId, gamemode, volume, language) {
    configurePlayer(steamId);
    if (testMode) {
      gameDetailsReceived = true;
      transitionToMap(testMap);
      return;
    }

    if (cleanMapName(mapName)) {
      gameDetailsReceived = true;
      transitionToMap(mapName);
    }
  };

  window.SetStatusChanged = function (status) {
  };

  window.SetFilesTotal = function () {};
  window.SetFilesNeeded = function () {};
  window.DownloadingFile = function (fileName) {
  };

  addSnowfallDots();
  loadRandomTip();
  configurePlayer(getParameter('SteamId') || getParameter('SteamID64'), getParameter('Username') || getParameter('Name'));
  testMode = getParameter('test') === '1';
  testMap = cleanMapName(getParameter('map')) || TEST_MAP;
  if (testMode) {
    setMapFontClass(testMap);
  }
  scaleMapPanelContent();
  window.addEventListener('resize', scaleMapPanelContent);

  if (testMode) {
    window.setTimeout(function () {
      if (!gameDetailsReceived) {
        transitionToMap(testMap);
      }
    }, 2500);
  }
}());
