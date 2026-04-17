function toSafeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getRuntimeBaseUrl() {
  const baseFromEnv = typeof import.meta !== "undefined" && import.meta?.env?.BASE_URL
    ? toSafeString(import.meta.env.BASE_URL)
    : "/";

  if (!baseFromEnv) {
    return "/";
  }

  const leadingSlashBase = baseFromEnv.startsWith("/") ? baseFromEnv : `/${baseFromEnv}`;
  return leadingSlashBase.endsWith("/") ? leadingSlashBase : `${leadingSlashBase}/`;
}

function toPublicAudioUrl(path) {
  const safePath = toSafeString(path);
  if (!safePath) {
    return "";
  }

  if (/^https?:\/\//i.test(safePath)) {
    return safePath;
  }

  const normalizedBaseUrl = getRuntimeBaseUrl();
  if (safePath.startsWith("/")) {
    if (normalizedBaseUrl === "/") {
      return safePath;
    }
    return `${normalizedBaseUrl.replace(/\/$/, "")}${safePath}`;
  }

  return `${normalizedBaseUrl}${safePath}`;
}

// Static authoring structure for manual/local audio assets.
// Curated OpenSLR 74 subset files are copied into /public/audio/<sceneId>/...
// Keep this map small and explicit; missing keys should gracefully fall back.
//
// Item key shape:
//   scene.<sceneId>.item.<itemId> -> /audio/<sceneId>/item-<itemId>.<ext>
//
// Dialogue line key shape:
//   scene.<sceneId>.line.<lineId> -> /audio/<sceneId>/line-<lineId>.<ext>
//
// Example:
//   items: { casa: "item-casa.wav" }
//   lines: { "casa-1": "line-casa-1.wav" }
//
// Phase 31 curated OpenSLR 74 subset:
// - Family House (3 clips): item.casa, item.mama, line.casa-1
// - Kitchen Basics (3 clips): item.cocina, item.pan, line.cocina-1
// - Listening module starter (4 clips): line.* keys under scene.listening-module
const AUDIO_ASSETS_BY_SCENE = {
  "family-house": {
    items: {
      casa: "item-casa.wav",
      mama: "item-mama.wav"
    },
    lines: {
      "casa-1": "line-casa-1.wav"
    }
  },
  "kitchen-basic": {
    items: {
      cocina: "item-cocina.wav",
      pan: "item-pan.wav"
    },
    lines: {
      "cocina-1": "line-cocina-1.wav"
    }
  },
  "listening-module": {
    items: {},
    lines: {
      "hola-cristina": "hola-cristina.wav",
      "nos-vemos-mas-tarde-gracias": "nos-vemos-mas-tarde-gracias.wav",
      "perfecto-espero-la-informacion-gracias": "perfecto-espero-la-informacion-gracias.wav",
      "por-favor-dame-la-informacion-completa": "por-favor-dame-la-informacion-completa.wav"
    }
  }
};

function buildAudioSourceMap(assetsByScene) {
  return Object.entries(assetsByScene).reduce((mapAcc, [sceneId, sceneAssets]) => {
    const items = sceneAssets?.items && typeof sceneAssets.items === "object" ? sceneAssets.items : {};
    const lines = sceneAssets?.lines && typeof sceneAssets.lines === "object" ? sceneAssets.lines : {};

    Object.entries(items).forEach(([itemId, filename]) => {
      const safeFilename = toSafeString(filename);
      if (!itemId || !safeFilename) {
        return;
      }
      mapAcc[`scene.${sceneId}.item.${itemId}`] = `/audio/${sceneId}/${safeFilename}`;
    });

    Object.entries(lines).forEach(([lineId, filename]) => {
      const safeFilename = toSafeString(filename);
      if (!lineId || !safeFilename) {
        return;
      }
      mapAcc[`scene.${sceneId}.line.${lineId}`] = `/audio/${sceneId}/${safeFilename}`;
    });

    return mapAcc;
  }, {});
}

const AUDIO_SOURCE_MAP = buildAudioSourceMap(AUDIO_ASSETS_BY_SCENE);

let activeAudio = null;
let activeRequestId = 0;
let activeSpeechUtterance = null;
let playbackState = {
  isPlaying: false,
  activeKey: null
};
const playbackListeners = new Set();

function notifyPlaybackListeners() {
  playbackListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener errors.
    }
  });
}

function setPlaybackState(nextState) {
  const nextIsPlaying = Boolean(nextState?.isPlaying);
  const nextActiveKey = toSafeString(nextState?.activeKey) || null;
  if (playbackState.isPlaying === nextIsPlaying && playbackState.activeKey === nextActiveKey) {
    return;
  }

  playbackState = {
    isPlaying: nextIsPlaying,
    activeKey: nextActiveKey
  };
  notifyPlaybackListeners();
}

export function normalizeAudioTarget(target) {
  if (typeof target === "string") {
    const key = toSafeString(target);
    return {
      key: key || "placeholder",
      label: "Play audio",
      ttsText: ""
    };
  }

  if (target && typeof target === "object") {
    const key = toSafeString(target.key);
    const label = toSafeString(target.label);
    const ttsText = toSafeString(target.ttsText || target.es);
    return {
      ...target,
      key: key || "placeholder",
      label: label || "Play audio",
      ttsText
    };
  }

  return {
    key: "placeholder",
    label: "Play audio",
    ttsText: ""
  };
}

function resolveAudioSource(key) {
  const safeKey = toSafeString(key);
  if (!safeKey) {
    return "";
  }

  if (/^(https?:\/\/|\/)/i.test(safeKey)) {
    return toPublicAudioUrl(safeKey);
  }

  return toPublicAudioUrl(AUDIO_SOURCE_MAP[safeKey] || "");
}

function stopActiveAudio() {
  const speechSynthesisApi = typeof window !== "undefined" ? window.speechSynthesis : null;

  if (!activeAudio) {
    if (!activeSpeechUtterance) {
      setPlaybackState({ isPlaying: false, activeKey: null });
      return;
    }
  }

  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // Silently ignore browser/audio-state errors.
    }

    activeAudio = null;
  }

  try {
    if (speechSynthesisApi && typeof speechSynthesisApi.cancel === "function") {
      speechSynthesisApi.cancel();
    }
  } catch {
    // Silently ignore speech synthesis errors.
  }

  activeSpeechUtterance = null;
  setPlaybackState({ isPlaying: false, activeKey: null });
}

function resolveSpanishVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis || typeof window.speechSynthesis.getVoices !== "function") {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!Array.isArray(voices) || !voices.length) {
    return null;
  }

  return (
    voices.find((voice) => toSafeString(voice?.lang).toLowerCase() === "es-es")
    || voices.find((voice) => toSafeString(voice?.lang).toLowerCase().startsWith("es"))
    || null
  );
}

function playTtsFallback(target, requestId) {
  const normalizedTarget = normalizeAudioTarget(target);
  const ttsText = toSafeString(normalizedTarget.ttsText);

  if (!ttsText) {
    return false;
  }

  if (
    typeof window === "undefined"
    || !window.speechSynthesis
    || typeof SpeechSynthesisUtterance !== "function"
  ) {
    return false;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(ttsText);
    utterance.lang = "es-ES";
    const spanishVoice = resolveSpanishVoice();
    if (spanishVoice) {
      utterance.voice = spanishVoice;
      utterance.lang = spanishVoice.lang || "es-ES";
    }

    setPlaybackState({ isPlaying: true, activeKey: normalizedTarget.key });
    activeSpeechUtterance = utterance;

    utterance.onend = () => {
      if (activeRequestId !== requestId || activeSpeechUtterance !== utterance) {
        return;
      }

      activeSpeechUtterance = null;
      setPlaybackState({ isPlaying: false, activeKey: null });
    };

    utterance.onerror = () => {
      if (activeRequestId !== requestId || activeSpeechUtterance !== utterance) {
        return;
      }

      activeSpeechUtterance = null;
      setPlaybackState({ isPlaying: false, activeKey: null });
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    if (activeRequestId === requestId) {
      activeSpeechUtterance = null;
      setPlaybackState({ isPlaying: false, activeKey: null });
    }
    return false;
  }
}

export function playAudioTarget(target) {
  const normalizedTarget = normalizeAudioTarget(target);
  if (typeof window === "undefined") {
    return normalizedTarget;
  }

  activeRequestId += 1;
  const requestId = activeRequestId;

  stopActiveAudio();

  const source = resolveAudioSource(normalizedTarget.key);
  if (!source || typeof Audio !== "function") {
    playTtsFallback(normalizedTarget, requestId);
    return normalizedTarget;
  }

  const audio = new Audio(source);
  activeAudio = audio;
  setPlaybackState({ isPlaying: true, activeKey: normalizedTarget.key });

  audio.addEventListener("ended", () => {
    if (activeAudio === audio) {
      activeAudio = null;
      setPlaybackState({ isPlaying: false, activeKey: null });
    }
  });

  audio.addEventListener("error", () => {
    if (activeRequestId !== requestId || activeAudio !== audio) {
      return;
    }

    activeAudio = null;
    if (!playTtsFallback(normalizedTarget, requestId)) {
      setPlaybackState({ isPlaying: false, activeKey: null });
    }
  });

  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      if (activeRequestId !== requestId || activeAudio !== audio) {
        return;
      }

      activeAudio = null;
      if (!playTtsFallback(normalizedTarget, requestId)) {
        setPlaybackState({ isPlaying: false, activeKey: null });
      }
    });
  }

  return normalizedTarget;
}

export function playAudioPlaceholder(audioKey) {
  return playAudioTarget({ key: audioKey, label: "Play audio" });
}

export function getAudioPlaybackState() {
  return playbackState;
}

export function subscribeToAudioPlayback(listener) {
  if (typeof listener !== "function") {
    return () => {};
  }

  playbackListeners.add(listener);
  return () => {
    playbackListeners.delete(listener);
  };
}
