function toSafeString(value) {
  return typeof value === "string" ? value.trim() : "";
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

export function playAudioTarget(target) {
  const normalizedTarget = normalizeAudioTarget(target);
  console.info("[audio placeholder]", normalizedTarget.key);
  return normalizedTarget;
}

export function playAudioPlaceholder(audioKey) {
  return playAudioTarget({ key: audioKey, label: "Play audio" });
}
