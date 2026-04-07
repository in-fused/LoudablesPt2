import AudioButton from "./AudioButton";

function DialoguePanel({ lines, getLineAudioTarget, selectedItemId, currentStepIndex, stepNumber, totalSteps, isAutoAdvancePending, isRecentlyCompleted }) {
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

  return (
    <section className={`dialogue-panel ${isRecentlyCompleted ? "is-recently-completed" : ""}`} aria-label="Dialogue panel">
      <p className="panel-label">Conversation</p>
      {totalSteps > 1 && stepNumber > 0 ? (
        <p className="response-guidance">
          {isAutoAdvancePending ? `Step ${stepNumber} of ${totalSteps} • moving forward...` : `Step ${stepNumber} of ${totalSteps}`}
        </p>
      ) : null}
      {isRecentlyCompleted ? <p className="response-guidance">Nice work. Conversation complete for this word.</p> : null}
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
              <p className="line-es">{line.es}</p>
              <p className="line-en">{line.en}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default DialoguePanel;
