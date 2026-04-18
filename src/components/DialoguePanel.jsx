import { useEffect, useRef, useState } from "react";
import AudioButton from "./AudioButton";

function getConversationalCorrectionText(rating) {
  if (rating === "acceptable") {
    return "Nice. A slightly tighter phrasing would sound more natural here.";
  }

  if (rating === "off_target") {
    return "No worries. Let's steer it back to what this moment is asking.";
  }

  return "";
}

function getConversationCueText(chainText, rating) {
  const normalizedText = typeof chainText === "string" ? chainText.trim() : "";
  const correctionText = getConversationalCorrectionText(rating);

  if (!normalizedText) {
    return correctionText;
  }

  if (!correctionText) {
    return `You just said: ${normalizedText}`;
  }

  return `You just said: ${normalizedText} ${correctionText}`;
}

function DialoguePanel({
  lines,
  chainContext,
  selectedChoice,
  getLineAudioTarget,
  selectedItemId,
  sceneId,
  currentStepIndex,
  stepNumber,
  totalSteps,
  isAutoAdvancePending,
  isRecentlyCompleted
}) {
  const isListeningFocusedModule = sceneId === "puerto-rico-listening" || sceneId === "listening-module";
  const isShadowingPriorityScene = sceneId === "puerto-rico-listening";
  const [softEmphasisLineKey, setSoftEmphasisLineKey] = useState("");
  const [isEnglishSupportRevealed, setIsEnglishSupportRevealed] = useState(true);
  const previousActiveLineKeyRef = useRef("");

  const normalizedLines = Array.isArray(lines)
    ? lines
      .filter((line) => line && typeof line === "object")
      .map((line, index) => ({
        id: line.id || `${selectedItemId || "item"}-line-${index + 1}`,
        speaker: line.speaker || "Speaker",
        es: line.es || "No Spanish line available.",
        en: line.en || "No English line available.",
        sourceType: "dialogue",
        canReplay: true
      }))
    : [];

  const safeLines = normalizedLines.length
    ? normalizedLines
    : [
        {
          id: "no-dialogue",
          speaker: "Note",
          es: "No conversation example yet for this word.",
          en: "No conversation example yet for this word.",
          sourceType: "fallback",
          canReplay: false
        }
      ];
  const normalizedChainText = typeof chainContext?.text === "string" ? chainContext.text.trim() : "";
  const normalizedSelectedResponseText = typeof selectedChoice?.text === "string" ? selectedChoice.text.trim() : "";
  const responseAwareRating = chainContext?.rating || selectedChoice?.rating || "";
  const conversationCueText = getConversationCueText(normalizedChainText, responseAwareRating);
  const hasConversationCue = Boolean(conversationCueText);

  const conversationLines = [
    ...safeLines,
    ...(normalizedSelectedResponseText
      ? [
          {
            id: `spoken-turn-${selectedChoice?.id || "choice"}`,
            speaker: "You",
            es: normalizedSelectedResponseText,
            en: "",
            sourceType: "spoken-turn",
            canReplay: false
          }
        ]
      : [])
  ];
  const activeLineIndex = Number.isInteger(currentStepIndex) && currentStepIndex >= 0 && currentStepIndex < conversationLines.length
    ? currentStepIndex
    : -1;
  const activeConversationLineIndex = activeLineIndex;
  const activeLine = activeConversationLineIndex >= 0 ? conversationLines[activeConversationLineIndex] : null;
  const activeLineKey = activeLine?.id
    ? `${selectedItemId || "item"}:${activeLine.id}:${stepNumber || 0}`
    : "";
  const stepRevealKey = `${sceneId || "scene"}:${selectedItemId || "item"}:${stepNumber || 0}`;

  useEffect(() => {
    if (!isListeningFocusedModule || !activeLineKey) {
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
  }, [isListeningFocusedModule, activeLineKey]);

  useEffect(() => {
    if (!isListeningFocusedModule) {
      setIsEnglishSupportRevealed(true);
      return undefined;
    }

    setIsEnglishSupportRevealed(false);
    const timerId = window.setTimeout(() => {
      setIsEnglishSupportRevealed(true);
    }, 1200);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isListeningFocusedModule, stepRevealKey]);

  function emphasizeTextNow() {
    if (isListeningFocusedModule) {
      setIsEnglishSupportRevealed(true);
    }

    if (isListeningFocusedModule && softEmphasisLineKey) {
      setSoftEmphasisLineKey("");
    }
  }

  return (
    <section
      className={`dialogue-panel ${isRecentlyCompleted ? "is-recently-completed" : ""} ${isListeningFocusedModule ? "is-listening-emphasis-mode" : ""} ${isListeningFocusedModule && !isEnglishSupportRevealed ? "is-english-support-delayed" : ""}`}
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
      <p className="dialogue-listen-cue">Listen, then follow along.</p>
      {isListeningFocusedModule && !isEnglishSupportRevealed ? (
        <p className="dialogue-english-delay-cue">English support appears shortly. Tap to reveal now.</p>
      ) : null}

      <ul className="dialogue-list">
        {conversationLines.map((line, index) => {
          const isActiveLine = index === activeConversationLineIndex;
          const lineKey = line?.id
            ? `${selectedItemId || "item"}:${line.id}:${stepNumber || 0}`
            : "";
          const isSoftEmphasisActive = isListeningFocusedModule && isActiveLine && softEmphasisLineKey === lineKey;
          const lineAudioTarget = isActiveLine && line.canReplay ? getLineAudioTarget?.(line, selectedItemId) : null;
          const hasEnglishLine = typeof line.en === "string" && line.en.trim().length > 0;
          const isEnglishDelayed = hasEnglishLine && isListeningFocusedModule && !isEnglishSupportRevealed;
          const showsConversationCue = hasConversationCue && index === 0;
          const isSpokenTurnLine = line.sourceType === "spoken-turn";
          const spokenTurnCue = isSpokenTurnLine ? "Say it out loud once." : "";
          const isSystemLine = line.sourceType === "dialogue" && line.speaker !== "You";
          const shadowPromptText = isShadowingPriorityScene && isActiveLine && isSystemLine && line.canReplay
            ? "Repeat it out loud, then replay if needed."
            : "";

          return (
            <li
              key={line.id}
              className={`dialogue-line ${isActiveLine ? "is-active-line" : ""} ${showsConversationCue || isSpokenTurnLine ? "is-memory-anchored" : ""}`}
            >
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
              {showsConversationCue ? (
                <p className={`dialogue-line-memory ${responseAwareRating ? `is-${responseAwareRating}` : ""}`}>{conversationCueText}</p>
              ) : null}
              {isSpokenTurnLine ? (
                <p className="dialogue-line-memory">{spokenTurnCue}</p>
              ) : null}
              {shadowPromptText ? (
                <p className="dialogue-line-memory">{shadowPromptText}</p>
              ) : null}
              <p className={`line-es ${isSoftEmphasisActive ? "is-soft-emphasis" : ""}`}>{line.es}</p>
              {hasEnglishLine ? (
                <p className={`line-en ${isSoftEmphasisActive ? "is-soft-emphasis" : ""} ${isEnglishDelayed ? "is-delayed-support" : ""}`}>{line.en}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default DialoguePanel;
