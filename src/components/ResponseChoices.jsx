function ResponseChoices({ exercise, selectedChoice, onSelectChoice, isCompleted }) {
  if (!exercise) {
    return (
      <section className="response-panel" aria-label="Response exercise">
        <p className="panel-label">Your Response</p>
        <p className="response-fallback">No response exercise for this word yet.</p>
      </section>
    );
  }

  return (
    <section className="response-panel" aria-label="Response exercise">
      <p className="panel-label">Your Response</p>
      <p className="response-prompt">{exercise.prompt}</p>

      {isCompleted ? (
        <>
          <p className="response-completed-note">Completed for this word.</p>
          <p className="response-review-note">You can still tap another response to review this word.</p>
        </>
      ) : !selectedChoice ? (
        <p className="response-guidance">Choose a response to continue this conversation moment.</p>
      ) : null}

      <div className="response-choices" role="group" aria-label="Response options">
        {exercise.choices.map((choice) => {
          const isSelected = selectedChoice?.id === choice.id;

          return (
            <button
              key={choice.id}
              type="button"
              className={`response-choice-button ${isSelected ? "is-selected" : ""}`}
              onClick={() => onSelectChoice(choice.id)}
              aria-pressed={isSelected}
            >
              {choice.text}
            </button>
          );
        })}
      </div>

      {selectedChoice ? (
        <p className="response-feedback">{selectedChoice.feedback}</p>
      ) : null}
    </section>
  );
}

export default ResponseChoices;
