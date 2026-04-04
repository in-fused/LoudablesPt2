import { playAudioPlaceholder } from "../lib/audio";

function AudioButton({ label, audioKey }) {
  return (
    <button
      type="button"
      className="audio-button"
      onClick={() => playAudioPlaceholder(audioKey)}
    >
      {label}
    </button>
  );
}

export default AudioButton;
