import AudioButton from "./AudioButton";

function DialoguePanel({ lines, getLineAudioTarget, selectedItemId, stepNumber, totalSteps, isAutoAdvancePending, isRecentlyCompleted }) {
  const safeLines = Array.isArray(lines) && lines.length
    ? lines
    : [
      {
        id: "no-dialogue",
        speaker: "Note",
        es: "No conversation example yet for this word.",
        en: "No conversation example yet for this word."
      }
    ];

  return (
    <section className="dialogue-panel" aria-label="Dialogue panel">
      <p className="panel-label">Conversation</p>
      {totalSteps > 1 ? (
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
