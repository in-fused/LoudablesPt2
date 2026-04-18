import { useEffect, useRef, useState } from "react";
import AudioButton from "./AudioButton";

function getSceneBackdrop(sceneId) {
  const sceneBackdrops = {
    "city-transit":
      "radial-gradient(130% 90% at 12% 12%, rgba(244, 173, 102, 0.56) 0%, rgba(244, 173, 102, 0) 48%), linear-gradient(140deg, #2f4a62 0%, #3f5d6a 34%, #81695a 100%)",
    "daily-coordination":
      "radial-gradient(120% 85% at 78% 8%, rgba(255, 215, 145, 0.45) 0%, rgba(255, 215, 145, 0) 56%), linear-gradient(132deg, #304769 0%, #56718c 42%, #99725e 100%)",
    "family-house":
      "radial-gradient(120% 84% at 85% 16%, rgba(248, 213, 151, 0.52) 0%, rgba(248, 213, 151, 0) 58%), linear-gradient(132deg, #5a4433 0%, #7f5e44 44%, #b68858 100%)",
    "kitchen-basic":
      "radial-gradient(125% 88% at 14% 14%, rgba(247, 218, 151, 0.5) 0%, rgba(247, 218, 151, 0) 52%), linear-gradient(134deg, #5a4f44 0%, #746451 42%, #9f8763 100%)",
    "restaurant-ordering":
      "radial-gradient(122% 87% at 80% 10%, rgba(250, 206, 135, 0.44) 0%, rgba(250, 206, 135, 0) 55%), linear-gradient(134deg, #452f2b 0%, #6d3e3a 46%, #a86a4a 100%)",
    "social-small-talk":
      "radial-gradient(130% 90% at 18% 10%, rgba(247, 213, 165, 0.42) 0%, rgba(247, 213, 165, 0) 52%), linear-gradient(138deg, #325b66 0%, #4f6f77 42%, #876b58 100%)",
    "work-communication":
      "radial-gradient(118% 80% at 86% 14%, rgba(233, 204, 145, 0.34) 0%, rgba(233, 204, 145, 0) 56%), linear-gradient(136deg, #2f4056 0%, #445972 44%, #727785 100%)",
    "puerto-rico-listening":
      "radial-gradient(120% 88% at 12% 12%, rgba(106, 178, 208, 0.38) 0%, rgba(106, 178, 208, 0) 48%), linear-gradient(136deg, #28445b 0%, #2f5f7d 42%, #7b8ca0 100%)",
    "listening-module":
      "radial-gradient(124% 86% at 80% 10%, rgba(118, 176, 212, 0.34) 0%, rgba(118, 176, 212, 0) 54%), linear-gradient(136deg, #2b3f55 0%, #3f5f7c 42%, #717c8b 100%)"
  };

  return (
    sceneBackdrops[sceneId] ||
    "radial-gradient(120% 90% at 10% 12%, rgba(244, 173, 102, 0.38) 0%, rgba(244, 173, 102, 0) 52%), linear-gradient(136deg, #3f3e52 0%, #576278 44%, #8f7a6b 100%)"
  );
}

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
  const displayedLineIndex = activeConversationLineIndex >= 0 ? activeConversationLineIndex : 0;
  const displayedLine = conversationLines[displayedLineIndex] || conversationLines[0];
  const displayedLineKey = displayedLine?.id
    ? `${selectedItemId || "item"}:${displayedLine.id}:${stepNumber || 0}`
    : `${selectedItemId || "item"}:line:${stepNumber || 0}`;
  const isDisplayLineSoftEmphasisActive = isListeningFocusedModule && softEmphasisLineKey === displayedLineKey;
  const hasEnglishLine = typeof displayedLine?.en === "string" && displayedLine.en.trim().length > 0;
  const isEnglishDelayed = hasEnglishLine && isListeningFocusedModule && !isEnglishSupportRevealed;
  const showsConversationCue = hasConversationCue && displayedLineIndex === 0;
  const isSpokenTurnLine = displayedLine?.sourceType === "spoken-turn";
  const spokenTurnCue = isSpokenTurnLine ? "Say it out loud once." : "";
  const isSystemLine = displayedLine?.sourceType === "dialogue" && displayedLine?.speaker !== "You";
  const shadowPromptText = isShadowingPriorityScene && isSystemLine && displayedLine?.canReplay
    ? "Repeat it out loud, then replay if needed."
    : "";
  const lineAudioTarget = displayedLine?.canReplay ? getLineAudioTarget?.(displayedLine, selectedItemId) : null;

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
      style={{ "--dialogue-scene-backdrop": getSceneBackdrop(sceneId) }}
      onPointerDownCapture={emphasizeTextNow}
      onTouchStartCapture={emphasizeTextNow}
    >
      <div className="dialogue-panel-backdrop" aria-hidden="true">
        <div className="dialogue-panel-backdrop-image" />
        <div className="dialogue-panel-backdrop-glow" />
        <div className="dialogue-panel-backdrop-overlay" />
      </div>

      <div className="dialogue-panel-content">
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

        <ul className="dialogue-list is-slide-mode">
          <li
            key={`${displayedLineKey}:${stepRevealKey}`}
            className={`dialogue-line dialogue-slide is-active-line ${showsConversationCue || isSpokenTurnLine ? "is-memory-anchored" : ""}`}
          >
            <div className="dialogue-line-meta">
              <p className="line-speaker">{displayedLine?.speaker || "Speaker"}</p>
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
            <p className={`line-es ${isDisplayLineSoftEmphasisActive ? "is-soft-emphasis" : ""}`}>{displayedLine?.es || "No Spanish line available."}</p>
            {hasEnglishLine ? (
              <p className={`line-en ${isDisplayLineSoftEmphasisActive ? "is-soft-emphasis" : ""} ${isEnglishDelayed ? "is-delayed-support" : ""}`}>{displayedLine.en}</p>
            ) : null}
          </li>
        </ul>
      </div>
    </section>
  );
}

export default DialoguePanel;
