function GrammarHint({ hint }) {
  const text = hint?.text || "No grammar note for this word yet.";

  return (
    <section className="grammar-hint" aria-label="Grammar hint">
      <p className="panel-label">Grammar Hint</p>
      <p className="grammar-text">{text}</p>
    </section>
  );
}

export default GrammarHint;
