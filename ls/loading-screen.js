(function () {
  'use strict';

  var TEST_MODE = false;
  var TEST_MAP = 'ttt_minecraft_b5';
  var MAP_IMAGE_DIRECTORY = 'img/maps/';
  var FALLBACK_MAP_IMAGE = 'img/maps/gm_construct.jpg';
  var FALLBACK_PROFILE_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23323a46"/%3E%3Ccircle cx="50" cy="38" r="18" fill="%23b8c3d1"/%3E%3Cpath d="M18 92c3-22 16-33 32-33s29 11 32 33" fill="%23b8c3d1"/%3E%3C/svg%3E';
  var genericState = document.getElementById('generic-state');
  var mapState = document.getElementById('map-state');
  var loadingScreen = document.getElementById('loading-screen');
  var mapBackground = document.getElementById('map-background');
  var mapNameElement = document.getElementById('map-name');
  var playerNameElement = document.getElementById('player-name');
  var profileImage = document.getElementById('profile-image');
  var transitionStarted = false;
  var profileImageSources = [];
  var profileImageSourceIndex = 0;
  var welcomeUntil = Date.now() + 1000;
  var transitionTimer = null;
  var pendingMapName = null;

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
    return String(mapName || '').replace(/[^a-zA-Z0-9_-]/g, '');
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

  function addSnowfallDots() {
    var snowTexts = document.querySelectorAll('.snow-text');
    var textIndex;
    var index;

    for (textIndex = 0; textIndex < snowTexts.length; textIndex += 1) {
      var snowText = snowTexts[textIndex];
      for (index = 0; index < 20; index += 1) {
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
  }

  profileImage.addEventListener('error', function () {
    profileImageSourceIndex += 1;
    if (profileImageSourceIndex < profileImageSources.length) {
      profileImage.src = profileImageSources[profileImageSourceIndex];
    }
  });

  function useMapImage(mapName) {
    var safeMapName = cleanMapName(mapName);
    var imagePath = safeMapName ? MAP_IMAGE_DIRECTORY + safeMapName + '.jpg' : FALLBACK_MAP_IMAGE;
    var image = new Image();

    image.onload = function () {
      mapBackground.style.backgroundImage = 'url("' + imagePath + '")';
      mapNameElement.textContent = readableMapName(safeMapName || 'gm_construct');
      mapBackground.classList.add('has-map-image');
      genericState.classList.add('is-hidden');
      mapState.classList.add('is-visible');
      transitionStarted = true;
    };

    image.onerror = function () {
      if (imagePath !== FALLBACK_MAP_IMAGE) {
        useMapImage('gm_construct');
      }
    };

    image.src = imagePath;
  }

  function transitionToMap(mapName) {
    if (transitionStarted || transitionTimer !== null) {
      return;
    }

    pendingMapName = mapName;
    var waitTime = Math.max(0, welcomeUntil - Date.now());
    transitionTimer = window.setTimeout(function () {
      transitionTimer = null;
      useMapImage(pendingMapName);
    }, waitTime);
  }

  window.GameDetails = function (serverName, serverUrl, mapName, maxPlayers, steamId, gamemode) {
    configurePlayer(steamId);
    if (mapName) {
      params.set('Map', mapName);
    }
    if (!TEST_MODE) {
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
  configurePlayer(getParameter('SteamId') || getParameter('SteamID64'), getParameter('Username') || getParameter('Name'));

  if (TEST_MODE) {
    window.setTimeout(function () {
      transitionToMap(TEST_MAP);
    }, 2500);
  } else if (getParameter('Map')) {
    transitionToMap(getParameter('Map'));
  }
}());
