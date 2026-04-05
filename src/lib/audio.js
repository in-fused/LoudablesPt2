function toSafeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Temporary static mapping. This will be replaced by dataset-driven ingestion.
const AUDIO_SOURCE_MAP = {
  "item:mesa": "/audio/mesa.mp3",
  "line:family_house_1": "/audio/line1.mp3",

  // Current scene key examples
  "scene.family-house.item.casa": "/audio/family-house/item-casa.mp3",
  "scene.family-house.item.mama": "/audio/family-house/item-mama.mp3",
  "scene.family-house.item.agua": "/audio/family-house/item-agua.mp3",
  "scene.family-house.item.comida": "/audio/family-house/item-comida.mp3",
  "scene.kitchen-basic.item.cocina": "/audio/kitchen-basic/item-cocina.mp3",
  "scene.kitchen-basic.item.pan": "/audio/kitchen-basic/item-pan.mp3",
  "scene.kitchen-basic.item.plato": "/audio/kitchen-basic/item-plato.mp3",
  "scene.kitchen-basic.item.vaso": "/audio/kitchen-basic/item-vaso.mp3",
  "scene.kitchen-basic.item.sal": "/audio/kitchen-basic/item-sal.mp3"
};

let activeAudio = null;
let activeRequestId = 0;

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
    return;
  }

  try {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  } catch {
    // Silently ignore browser/audio-state errors.
  }

  activeAudio = null;
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

  audio.addEventListener("ended", () => {
    if (activeAudio === audio) {
      activeAudio = null;
    }
  });

  audio.addEventListener("error", () => {
    if (activeAudio === audio) {
      activeAudio = null;
    }
  });

  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      if (activeRequestId === requestId && activeAudio === audio) {
        activeAudio = null;
      }
    });
  }

  return normalizedTarget;
}

export function playAudioPlaceholder(audioKey) {
  return playAudioTarget({ key: audioKey, label: "Play audio" });
}
