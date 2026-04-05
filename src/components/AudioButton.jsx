import { normalizeAudioTarget, playAudioTarget } from "../lib/audio";

function AudioButton({ label, audioKey, audioTarget, variant = "primary" }) {
  const resolvedTarget = normalizeAudioTarget(audioTarget || audioKey);
  const resolvedAudioKey = resolvedTarget.key;
  const buttonLabel = label || resolvedTarget.label || "Play audio";
  const buttonClassName = variant === "inline"
    ? "audio-button audio-button-inline"
    : "audio-button";

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={() => playAudioTarget(resolvedTarget)}
      aria-label={buttonLabel}
    >
      {buttonLabel}
    </button>
  );
}

export default AudioButton;
