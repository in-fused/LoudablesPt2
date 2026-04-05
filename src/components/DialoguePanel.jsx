import AudioButton from "./AudioButton";

function DialoguePanel({ lines, getLineAudioTarget, selectedItemId, stepNumber, totalSteps, isAutoAdvancePending, isRecentlyCompleted }) {
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

  return (
    <section className={`dialogue-panel ${isRecentlyCompleted ? "is-recently-completed" : ""}`} aria-label="Dialogue panel">
      <p className="panel-label">Conversation</p>
      {totalSteps > 1 && stepNumber > 0 ? (
        <p className="response-guidance">
          {isAutoAdvancePending ? `Step ${stepNumber} of ${totalSteps} • moving forward...` : `Step ${stepNumber} of ${totalSteps}`}
        </p>
      ) : null}
      {isRecentlyCompleted ? <p className="response-guidance">Nice work. Conversation complete for this word.</p> : null}

      <ul className="dialogue-list">
        {safeLines.map((line) => {
          const lineAudioTarget = getLineAudioTarget?.(line, selectedItemId);

          return (
            <li key={line.id} className="dialogue-line">
              <div className="dialogue-line-meta">
                <p className="line-speaker">{line.speaker}</p>
                {lineAudioTarget ? (
                  <AudioButton
                    variant="inline"
                    label="Play line"
                    audioTarget={lineAudioTarget}
                  />
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
