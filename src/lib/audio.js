function toSafeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Temporary static mapping. This will be replaced by dataset-driven ingestion.
const AUDIO_SOURCE_MAP = {
  // Manual Phase 24 test set.
  // Add future files under /public/audio/... and map key -> absolute public path.
  // Example: "scene.family-house.item.casa": "/audio/family-house/item-casa.mp3"
  "scene.family-house.item.casa": "/audio/family-house/item-casa.mp3",
  "scene.family-house.item.mama": "/audio/family-house/item-mama.mp3",
  "scene.family-house.item.agua": "/audio/family-house/item-agua.mp3",
  "scene.family-house.line.casa-1": "/audio/family-house/line-casa-1.mp3",
  "scene.kitchen-basic.line.cocina-1": "/audio/kitchen-basic/line-cocina-1.mp3"
};

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
    return safeKey;
  }

  return AUDIO_SOURCE_MAP[safeKey] || "";
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
