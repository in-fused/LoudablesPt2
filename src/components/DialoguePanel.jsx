import { useEffect, useState } from "react";
import AudioButton from "./AudioButton";

function DialoguePanel({
  lines,
  chainContext,
  getLineAudioTarget,
  selectedItemId,
  sceneId,
  currentStepIndex,
  stepNumber,
  totalSteps,
  isAutoAdvancePending,
  isRecentlyCompleted
}) {
  const isPuertoRicoListening = sceneId === "puerto-rico-listening";
  const [isActiveLineTextEmphasized, setIsActiveLineTextEmphasized] = useState(!isPuertoRicoListening);

  const normalizedLines = Array.isArray(lines)
    ? lines
      .filter((line) => line && typeof line === "object")
      .map((line, index) => ({
        id: line.id || `${selectedItemId || "item"}-line-${index + 1}`,
        speaker: line.speaker || "Speaker",
        es: line.es || "No Spanish line available.",
        en: line.en || "No English line available."
      }))
    : [];

  const safeLines = normalizedLines.length
    ? normalizedLines
    : [
        {
          id: "no-dialogue",
          speaker: "Note",
          es: "No conversation example yet for this word.",
          en: "No conversation example yet for this word."
        }
      ];
  const activeLineIndex = Number.isInteger(currentStepIndex) && currentStepIndex >= 0 && currentStepIndex < safeLines.length
    ? currentStepIndex
    : -1;

  useEffect(() => {
    if (!isPuertoRicoListening || activeLineIndex < 0) {
      setIsActiveLineTextEmphasized(true);
      return undefined;
    }

    setIsActiveLineTextEmphasized(false);
    const timerId = window.setTimeout(() => {
      setIsActiveLineTextEmphasized(true);
    }, 850);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isPuertoRicoListening, selectedItemId, stepNumber, activeLineIndex]);

  function emphasizeTextNow() {
    if (!isPuertoRicoListening || isActiveLineTextEmphasized) {
      return;
    }
    setIsActiveLineTextEmphasized(true);
  }

  return (
    <section
      className={`dialogue-panel ${isRecentlyCompleted ? "is-recently-completed" : ""} ${isPuertoRicoListening ? "is-listening-emphasis-mode" : ""}`}
      aria-label="Dialogue panel"
      onPointerDownCapture={emphasizeTextNow}
      onTouchStartCapture={emphasizeTextNow}
    >
      <p className="panel-label">Conversation</p>
      {totalSteps > 1 && stepNumber > 0 ? (
        <p className="response-guidance">
          {isAutoAdvancePending ? `Step ${stepNumber} of ${totalSteps} • moving forward...` : `Step ${stepNumber} of ${totalSteps}`}
        </p>
      ) : null}
      {isRecentlyCompleted ? <p className="response-guidance">Nice work. Conversation complete for this word.</p> : null}
      {chainContext?.text ? (
        <p className="dialogue-chain-context">
          <span className="dialogue-chain-label">You said:</span> {chainContext.text}
        </p>
      ) : null}
      <p className="dialogue-listen-cue">Listen, then follow along.</p>

      <ul className="dialogue-list">
        {safeLines.map((line, index) => {
          const isActiveLine = index === activeLineIndex;
          const lineAudioTarget = isActiveLine ? getLineAudioTarget?.(line, selectedItemId) : null;

          return (
            <li key={line.id} className={`dialogue-line ${isActiveLine ? "is-active-line" : ""}`}>
              <div className="dialogue-line-meta">
                <p className="line-speaker">{line.speaker}</p>
                {lineAudioTarget ? (
                  <div className="dialogue-replay-control">
                    <AudioButton
                      variant="inline"
                      label="Replay line"
                      audioTarget={lineAudioTarget}
                    />
                  </div>
                ) : null}
              </div>
              <p className={`line-es ${isPuertoRicoListening && isActiveLine && !isActiveLineTextEmphasized ? "is-soft-emphasis" : ""}`}>{line.es}</p>
              <p className={`line-en ${isPuertoRicoListening && isActiveLine && !isActiveLineTextEmphasized ? "is-soft-emphasis" : ""}`}>{line.en}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default DialoguePanel;
