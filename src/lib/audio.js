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
// Future real imports should be added here by scene.
//
// Item key shape:
//   scene.<sceneId>.item.<itemId> -> /audio/<sceneId>/item-<itemId>.mp3
//
// Dialogue line key shape:
//   scene.<sceneId>.line.<lineId> -> /audio/<sceneId>/line-<lineId>.mp3
//
// Example:
//   items: { casa: "item-casa.mp3" }
//   lines: { "casa-1": "line-casa-1.mp3" }
//
// Phase 27 tiny real-audio subset (drop files in /public/audio/...):
// - scene.family-house.item.casa   -> /audio/family-house/item-casa.mp3
// - scene.family-house.item.mama   -> /audio/family-house/item-mama.mp3
// - scene.family-house.item.agua   -> /audio/family-house/item-agua.mp3
// - scene.family-house.line.casa-1 -> /audio/family-house/line-casa-1.mp3
// - scene.kitchen-basic.line.cocina-1 -> /audio/kitchen-basic/line-cocina-1.mp3
const AUDIO_ASSETS_BY_SCENE = {
  "family-house": {
    items: {
      casa: "item-casa.mp3",
      mama: "item-mama.mp3",
      agua: "item-agua.mp3"
    },
    lines: {
      "casa-1": "line-casa-1.mp3"
    }
  },
  "kitchen-basic": {
    items: {},
    lines: {
      "cocina-1": "line-cocina-1.mp3"
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
      label: "Play audio"
    };
  }

  if (target && typeof target === "object") {
    const key = toSafeString(target.key);
    const label = toSafeString(target.label);
    return {
      ...target,
      key: key || "placeholder",
      label: label || "Play audio"
    };
  }

  return {
    key: "placeholder",
    label: "Play audio"
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
  if (!activeAudio) {
    setPlaybackState({ isPlaying: false, activeKey: null });
    return;
  }

  try {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  } catch {
    // Silently ignore browser/audio-state errors.
  }

  activeAudio = null;
  setPlaybackState({ isPlaying: false, activeKey: null });
}

export function playAudioTarget(target) {
  const normalizedTarget = normalizeAudioTarget(target);
  if (typeof window === "undefined" || typeof Audio !== "function") {
    return normalizedTarget;
  }

  const source = resolveAudioSource(normalizedTarget.key);
  if (!source) {
    return normalizedTarget;
  }

  activeRequestId += 1;
  const requestId = activeRequestId;

  stopActiveAudio();

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
    if (activeAudio === audio) {
      activeAudio = null;
      setPlaybackState({ isPlaying: false, activeKey: null });
    }
  });

  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      if (activeRequestId === requestId && activeAudio === audio) {
        activeAudio = null;
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
