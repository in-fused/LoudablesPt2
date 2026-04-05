import { useSyncExternalStore } from "react";
import {
  getAudioPlaybackState,
  normalizeAudioTarget,
  playAudioTarget,
  subscribeToAudioPlayback
} from "../lib/audio";

function AudioButton({ label, audioKey, audioTarget, variant = "primary" }) {
  const resolvedTarget = normalizeAudioTarget(audioTarget || audioKey);
  const playbackState = useSyncExternalStore(subscribeToAudioPlayback, getAudioPlaybackState, getAudioPlaybackState);
  const resolvedAudioKey = resolvedTarget.key;
  const isPlayingThisKey = Boolean(
    playbackState?.isPlaying &&
    playbackState?.activeKey &&
    playbackState.activeKey === resolvedAudioKey
  );
  const buttonLabel = isPlayingThisKey
    ? "Playing..."
    : (label || resolvedTarget.label || "Play audio");
  const buttonClassName = variant === "inline"
    ? `audio-button audio-button-inline ${isPlayingThisKey ? "is-playing" : ""}`
    : `audio-button ${isPlayingThisKey ? "is-playing" : ""}`;

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={() => {
        if (isPlayingThisKey) {
          return;
        }
        playAudioTarget(resolvedAudioKey);
      }}
      aria-label={buttonLabel}
      aria-pressed={isPlayingThisKey}
      disabled={isPlayingThisKey}
    >
      {buttonLabel}
    </button>
  );
}

export default AudioButton;
