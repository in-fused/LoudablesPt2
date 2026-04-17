import { useEffect, useRef, useState } from "react";
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
  const [softEmphasisLineKey, setSoftEmphasisLineKey] = useState("");
  const previousActiveLineKeyRef = useRef("");

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
  const activeLine = activeLineIndex >= 0 ? safeLines[activeLineIndex] : null;
  const activeLineKey = activeLine?.id
    ? `${selectedItemId || "item"}:${activeLine.id}:${stepNumber || 0}`
    : "";

  useEffect(() => {
    if (!isPuertoRicoListening || !activeLineKey) {
      setSoftEmphasisLineKey("");
      previousActiveLineKeyRef.current = "";
      return undefined;
    }

    if (previousActiveLineKeyRef.current === activeLineKey) {
      return undefined;
    }

    previousActiveLineKeyRef.current = activeLineKey;
    setSoftEmphasisLineKey(activeLineKey);
    const timerId = window.setTimeout(() => {
      setSoftEmphasisLineKey((currentKey) => (currentKey === activeLineKey ? "" : currentKey));
    }, 780);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isPuertoRicoListening, activeLineKey]);

  function emphasizeTextNow() {
    if (!isPuertoRicoListening || !softEmphasisLineKey) {
      return;
    }
    setSoftEmphasisLineKey("");
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
          const lineKey = line?.id
            ? `${selectedItemId || "item"}:${line.id}:${stepNumber || 0}`
            : "";
          const isSoftEmphasisActive = isPuertoRicoListening && isActiveLine && softEmphasisLineKey === lineKey;
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
              <p className={`line-es ${isSoftEmphasisActive ? "is-soft-emphasis" : ""}`}>{line.es}</p>
              <p className={`line-en ${isSoftEmphasisActive ? "is-soft-emphasis" : ""}`}>{line.en}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default DialoguePanel;
