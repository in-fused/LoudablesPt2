function ResponseChoices({
  exercise,
  selectedChoice,
  onSelectChoice,
  isCompleted,
  isRecentlyCompleted,
  suggestedNextLabel,
  hasNextStep,
  canContinue,
  isAutoAdvancePending,
  onContinue
}) {
  const safeExercise = exercise && typeof exercise === "object"
    ? {
        prompt: typeof exercise.prompt === "string" ? exercise.prompt : "",
        choices: Array.isArray(exercise.choices)
          ? exercise.choices.filter((choice) => choice && choice.id && choice.text)
          : []
      }
    : null;

  const feedbackTone = selectedChoice?.rating || "";
  const feedbackToneLabel = feedbackTone === "appropriate"
    ? "Strong match."
    : feedbackTone === "acceptable"
      ? "Works, but there is a more natural option."
      : feedbackTone === "off_target"
        ? "Off target for this moment."
        : "";

  if (!safeExercise || !safeExercise.choices.length) {
    return (
      <section className="response-panel" aria-label="Response exercise">
        <p className="panel-label">Your Response</p>
        {hasNextStep ? (
          <p className="response-guidance">No response needed here. Continue when ready.</p>
        ) : (
          <p className="response-fallback">No response exercise for this word yet.</p>
        )}
        {canContinue && typeof onContinue === "function" ? (
          <button
            type="button"
            className="response-choice-button is-continue"
            onClick={onContinue}
          >
            Continue
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section
      className={`response-panel ${isCompleted ? "is-completed" : ""} ${isRecentlyCompleted ? "is-recently-completed" : ""}`}
      aria-label="Response exercise"
    >
      <p className="panel-label">Your Response</p>
      <p className="response-prompt">{safeExercise.prompt || "Choose the best response."}</p>

      {isCompleted ? (
        <>
          <p className="response-completed-note">
            {isRecentlyCompleted ? "Great response. This word is now complete." : "Completed for this word."}
          </p>
          <p className="response-review-note">You can still tap another response to review this word.</p>
          {suggestedNextLabel ? (
            <p className="response-guidance">Continue with: {suggestedNextLabel}</p>
          ) : null}
        </>
      ) : !selectedChoice ? (
        <p className="response-guidance">Choose a response to continue this conversation moment.</p>
      ) : null}

      <div className="response-choices" role="group" aria-label="Response options">
        {safeExercise.choices.map((choice) => {
          const isSelected = selectedChoice?.id === choice.id;

          return (
            <button
              key={choice.id}
              type="button"
              className={`response-choice-button ${isSelected ? "is-selected" : ""} ${isSelected && isCompleted ? "is-confirmed" : ""}`}
              onClick={() => onSelectChoice?.(choice.id)}
              aria-pressed={isSelected}
            >
              <span className="response-choice-text">{choice.text}</span>
            </button>
          );
        })}
      </div>

      {selectedChoice ? (
        <p className={`response-feedback ${feedbackTone ? `is-${feedbackTone}` : ""}`} role="status" aria-live="polite">
          {feedbackToneLabel ? `${feedbackToneLabel} ` : ""}{selectedChoice.feedback || "Response selected."}
          {isAutoAdvancePending ? " Next line coming up..." : ""}
        </p>
      ) : null}

      {canContinue && typeof onContinue === "function" ? (
        <button
          type="button"
          className="response-choice-button is-continue"
          onClick={onContinue}
        >
          Continue
        </button>
      ) : null}
    </section>
  );
}

export default ResponseChoices;
