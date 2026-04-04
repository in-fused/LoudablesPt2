function DialoguePanel({ lines }) {
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

      <ul className="dialogue-list">
        {safeLines.map((line) => (
          <li key={line.id} className="dialogue-line">
            <p className="line-speaker">{line.speaker}</p>
            <p className="line-es">{line.es}</p>
            <p className="line-en">{line.en}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default DialoguePanel;
