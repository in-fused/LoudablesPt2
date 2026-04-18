import { useEffect, useRef, useState } from "react";
import { playAudioTarget } from "../lib/audio";

const MICRO_FEEDBACK_BY_RATING = {
  appropriate: [
    "Nice, that lands.",
    "Great, that fits.",
    "Perfect, that flows."
  ],
  acceptable: [
    "Nice, that works.",
    "Good, close enough.",
    "Yep, that works here."
  ],
  off_target: [
    "Almost, try a nearby option.",
    "Close, try another angle.",
    "Not quite, try another one."
  ]
};

function getSeedFromChoiceId(choiceId) {
  return String(choiceId || "")
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);
}

function getMicroFeedbackLine(rating, choiceId, lastLine) {
  const variants = Array.isArray(MICRO_FEEDBACK_BY_RATING[rating]) ? MICRO_FEEDBACK_BY_RATING[rating] : [];
  if (!variants.length) {
    return "";
  }

  const seed = getSeedFromChoiceId(choiceId);
  let index = seed % variants.length;
  let nextLine = variants[index];

  if (variants.length > 1 && nextLine === lastLine) {
    index = (index + 1) % variants.length;
    nextLine = variants[index];
  }

  return nextLine;
}

function getCompletionReinforcementText(rating) {
  if (rating === "appropriate") {
    return "Clean response. Locking this moment in.";
  }

  if (rating === "acceptable") {
    return "Solid response. This moment is now complete.";
  }

  if (rating === "off_target") {
    return "Nice recovery. Keep this correction in mind for the next moment.";
  }

  return "";
}

function ResponseChoices({
  exercise,
  selectedChoice,
  recommendedAction = "none",
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
  const completionReinforcementText = getCompletionReinforcementText(feedbackTone);
  const [recentlySelectedChoiceId, setRecentlySelectedChoiceId] = useState(null);
  const [isContinueDelayActive, setIsContinueDelayActive] = useState(false);
  const [microFeedbackLine, setMicroFeedbackLine] = useState("");
  const lastHandledChoiceIdRef = useRef(selectedChoice?.id || null);
  const lastMicroFeedbackByRatingRef = useRef({
    appropriate: "",
    acceptable: "",
    off_target: ""
  });

  useEffect(() => {
    if (!selectedChoice?.id) {
      return undefined;
    }

    setRecentlySelectedChoiceId(selectedChoice.id);
    const timerId = window.setTimeout(() => {
      setRecentlySelectedChoiceId((currentId) => (currentId === selectedChoice.id ? null : currentId));
    }, 520);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [selectedChoice?.id]);

  useEffect(() => {
    const currentChoiceId = selectedChoice?.id || null;
    if (!currentChoiceId) {
      setIsContinueDelayActive(false);
      lastHandledChoiceIdRef.current = null;
      return undefined;
    }

    if (currentChoiceId === lastHandledChoiceIdRef.current) {
      return undefined;
    }

    lastHandledChoiceIdRef.current = currentChoiceId;

    const responseAudioTarget = selectedChoice?.audioTarget || selectedChoice?.audioKey || null;
    if (responseAudioTarget) {
      playAudioTarget(responseAudioTarget);
    }

    setIsContinueDelayActive(true);
    const timerId = window.setTimeout(() => {
      setIsContinueDelayActive(false);
    }, 500);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [selectedChoice?.id]);

  useEffect(() => {
    const currentChoiceId = selectedChoice?.id || null;
    const currentRating = selectedChoice?.rating || "";

    if (!currentChoiceId || !currentRating) {
      setMicroFeedbackLine("");
      return;
    }

    const lastLineForRating = lastMicroFeedbackByRatingRef.current[currentRating] || "";
    const nextLine = getMicroFeedbackLine(currentRating, currentChoiceId, lastLineForRating);
    setMicroFeedbackLine(nextLine);
    if (nextLine) {
      lastMicroFeedbackByRatingRef.current[currentRating] = nextLine;
    }
  }, [selectedChoice?.id, selectedChoice?.rating]);

  const actionGuidanceText = recommendedAction === "respond"
    ? "Next best action: choose a response."
    : recommendedAction === "continue"
      ? "Next best action: continue to the next line."
      : recommendedAction === "next-item" && suggestedNextLabel
        ? `Next best action: try ${suggestedNextLabel}.`
        : "";
  const spokenTurnPracticeCue = selectedChoice && canContinue && !isAutoAdvancePending
    ? "Try saying your line before continuing. Tap your choice again to replay it."
    : "";

  if (!safeExercise || !safeExercise.choices.length) {
    return (
      <section className="response-panel" aria-label="Response exercise">
        <p className="panel-label">Your Response</p>
        {actionGuidanceText ? <p className="response-next-action">{actionGuidanceText}</p> : null}
        {hasNextStep ? (
          <p className="response-guidance">No response needed here. Continue when ready.</p>
        ) : (
          <p className="response-fallback">No response exercise for this word yet.</p>
        )}
        {canContinue && typeof onContinue === "function" ? (
          <button
            type="button"
            className={`response-choice-button is-continue ${recommendedAction === "continue" ? "is-primary-next" : ""}`}
            onClick={onContinue}
            disabled={isContinueDelayActive || isAutoAdvancePending}
            aria-disabled={isContinueDelayActive || isAutoAdvancePending}
          >
            Continue
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section
      className={`response-panel ${isCompleted ? "is-completed" : ""} ${isRecentlyCompleted ? "is-recently-completed" : ""} ${recommendedAction === "respond" ? "is-guidance-respond" : ""} ${selectedChoice?.id ? "is-response-moment" : ""} ${feedbackTone ? `is-response-${feedbackTone}` : ""}`}
      aria-label="Response exercise"
    >
      <p className="panel-label">Your Response</p>
      {actionGuidanceText ? <p className="response-next-action">{actionGuidanceText}</p> : null}
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
          const isJustSelected = recentlySelectedChoiceId === choice.id;

          return (
            <button
              key={choice.id}
              type="button"
              className={`response-choice-button ${isSelected ? "is-selected" : ""} ${isSelected && isCompleted ? "is-confirmed" : ""} ${isJustSelected ? "is-just-selected" : ""}`}
              onClick={() => onSelectChoice?.(choice.id)}
              aria-pressed={isSelected}
              disabled={isContinueDelayActive || isAutoAdvancePending}
            >
              <span className="response-choice-text">{choice.text}</span>
            </button>
          );
        })}
      </div>

      {selectedChoice ? (
        <p className={`response-feedback ${feedbackTone ? `is-${feedbackTone}` : ""}`} role="status" aria-live="polite">
          {microFeedbackLine || "Okay, keep going."}
        </p>
      ) : null}

      {isRecentlyCompleted && completionReinforcementText ? (
        <p className={`response-reinforcement ${feedbackTone ? `is-${feedbackTone}` : ""}`} role="status" aria-live="polite">
          {completionReinforcementText}
        </p>
      ) : null}

      {spokenTurnPracticeCue ? (
        <p className="response-guidance" aria-live="polite">{spokenTurnPracticeCue}</p>
      ) : null}

      {canContinue && typeof onContinue === "function" ? (
        <button
          type="button"
          className={`response-choice-button is-continue ${selectedChoice ? "is-prominent" : ""} ${recommendedAction === "continue" ? "is-primary-next" : ""}`}
          onClick={onContinue}
          disabled={isContinueDelayActive || isAutoAdvancePending}
          aria-disabled={isContinueDelayActive || isAutoAdvancePending}
        >
          Continue
        </button>
      ) : null}
    </section>
  );
}

export default ResponseChoices;
