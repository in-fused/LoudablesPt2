import { useEffect, useRef, useState } from "react";
import DialoguePanel from "./DialoguePanel";
import AudioButton from "./AudioButton";
import GrammarHint from "./GrammarHint";
import ResponseChoices from "./ResponseChoices";
import { getAudioPlaybackState, playAudioTarget, subscribeToAudioPlayback } from "../lib/audio";

function BottomDrawer({ selectedItem, dialogueState, grammarHint, sceneId, appViewState = "lesson", isOverlayOpen = false }) {
  const selectedItemLabel = selectedItem ? selectedItem.spanish : "No item selected yet";
  const selectedItemSubLabel = selectedItem ? selectedItem.english : "Tap a highlighted word to begin";

  const itemId = selectedItem?.id;

  const dialogueLines = dialogueState?.getLinesForItem
    ? dialogueState.getLinesForItem(itemId)
    : [];

  const responseExercise = dialogueState?.getResponseExerciseForItem
    ? dialogueState.getResponseExerciseForItem(itemId)
    : null;

  const selectedChoice = dialogueState?.getSelectedChoiceForItem
    ? dialogueState.getSelectedChoiceForItem(itemId)
    : null;

  const chainContext = dialogueState?.getChainContextForItem
    ? dialogueState.getChainContextForItem(itemId)
    : null;

  const responseCompleted = dialogueState?.isResponseCompleted
    ? dialogueState.isResponseCompleted(itemId)
    : false;

  const conversationState = dialogueState?.getConversationStateForItem
    ? dialogueState.getConversationStateForItem(itemId)
    : {
      currentStepIndex: 0,
      stepNumber: 1,
      totalSteps: 1,
      hasNextStep: false,
      canContinue: false,
      isCurrentStepResponseCompleted: false,
      isAutoAdvancePending: false
    };

  const engagementState = dialogueState?.getEngagementStateForItem
    ? dialogueState.getEngagementStateForItem(itemId)
    : {
        isRecentlyCompleted: false,
        encouragement: "",
        suggestedNextItemId: null
      };

  const selectedItemAudioTarget = dialogueState?.getItemAudioTarget
    ? dialogueState.getItemAudioTarget(itemId, selectedItem)
    : { key: itemId || "placeholder", label: "Play selected item audio" };

  const totalResponseItems = Array.isArray(dialogueState?.exercisableItemIds)
    ? dialogueState.exercisableItemIds.length
    : 0;
  const completedResponseItems = Array.isArray(dialogueState?.completedResponseItemIds)
    ? Math.min(dialogueState.completedResponseItemIds.length, totalResponseItems)
    : 0;
  const remainingResponseItems = Math.max(totalResponseItems - completedResponseItems, 0);
  const completionRatio = totalResponseItems > 0 ? completedResponseItems / totalResponseItems : 0;

  const milestoneText = totalResponseItems === 0
    ? ""
    : completedResponseItems === 1
      ? "Nice start, first item completed."
      : completionRatio >= 0.5 && completionRatio < 0.8
        ? "Great pace, you are over halfway through this scene."
        : remainingResponseItems <= 1 && completedResponseItems < totalResponseItems
          ? "Almost there, finish the remaining item."
          : "";

  const progressStateGuidance = totalResponseItems === 0
    ? ""
    : completedResponseItems === 0
      ? "Start with the highlighted word."
      : completedResponseItems >= totalResponseItems
        ? "Scene complete, you can review any completed word."
        : remainingResponseItems <= 2
          ? "Finish the remaining items to complete this scene."
          : "Continue where you left off.";

  const suggestedNextLabel = dialogueState?.getItemDisplayLabel
    ? dialogueState.getItemDisplayLabel(engagementState.suggestedNextItemId)
    : engagementState.suggestedNextItemId;

  const continuityText = responseCompleted && suggestedNextLabel
    ? `Try next: ${suggestedNextLabel}.`
    : "";

  const recommendedAction = !selectedItem
    ? suggestedNextLabel
      ? "select-item"
      : "none"
    : conversationState.isAutoAdvancePending
      ? "none"
      : conversationState.canContinue
        ? "continue"
        : responseExercise && !conversationState.isCurrentStepResponseCompleted
          ? "respond"
          : responseCompleted && suggestedNextLabel
            ? "next-item"
            : "none";

  const guidanceText = !selectedItem
    ? suggestedNextLabel
      ? `Start with: ${suggestedNextLabel}.`
      : totalResponseItems
        ? "Start with the highlighted recommended word."
        : "Tap any visible word to explore this scene."
    : conversationState.isAutoAdvancePending
      ? "Nice response. Continuing to the next line..."
    : recommendedAction === "continue"
      ? "Continue to the next line."
    : recommendedAction === "respond"
      ? "Choose a response to continue."
    : recommendedAction === "next-item"
      ? `Try next: ${suggestedNextLabel}.`
    : conversationState.totalSteps > 1 && conversationState.hasNextStep
      ? "Respond to continue this short conversation."
      : !responseExercise
        ? "You can explore this word, then try a highlighted word next."
        : !responseCompleted
          ? "Try this next: choose a response to keep progressing through this scene."
          : "You're progressing through this scene. You can revisit this word or explore another.";

  const shouldUseActionOnlyGuidance = recommendedAction !== "none";
  const combinedGuidance = shouldUseActionOnlyGuidance
    ? guidanceText
    : [guidanceText, progressStateGuidance, milestoneText, engagementState.encouragement, continuityText]
      .filter((text, index, all) => text && all.indexOf(text) === index)
      .join(" ");
  const lastAutoPlayedStepRef = useRef("");
  const autoplayRunRef = useRef(0);
  const [activeLayer, setActiveLayer] = useState("response");
  const [drawerMode, setDrawerMode] = useState("half");
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isHandleDragging, setIsHandleDragging] = useState(false);
  const dragPointerIdRef = useRef(null);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragAxisRef = useRef("none");
  const draggedHandleRef = useRef(false);
  const suppressHandleClickRef = useRef(false);

  function getSupportedModes() {
    return selectedItem ? ["peek", "half", "full"] : ["peek", "half"];
  }

  function moveDrawerMode(direction) {
    const modes = getSupportedModes();
    const currentIndex = modes.indexOf(drawerMode);
    const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = direction === "up"
      ? Math.min(safeCurrentIndex + 1, modes.length - 1)
      : Math.max(safeCurrentIndex - 1, 0);
    setDrawerMode(modes[nextIndex]);
  }

  function toggleDrawerMode() {
    if (drawerMode === "peek") {
      setDrawerMode("half");
      return;
    }

    if (drawerMode === "half") {
      setDrawerMode(selectedItem ? "full" : "peek");
      return;
    }

    setDrawerMode("half");
  }

  useEffect(() => {
    if (!selectedItem) {
      setActiveLayer("response");
      return;
    }

    if (recommendedAction === "respond" || recommendedAction === "continue") {
      setActiveLayer("response");
      return;
    }

    if (!responseExercise && dialogueLines.length) {
      setActiveLayer("conversation");
    }
  }, [selectedItem, recommendedAction, responseExercise, dialogueLines.length]);

  useEffect(() => {
    if (isOverlayOpen || appViewState === "home") {
      setDrawerMode("peek");
      return;
    }

    if (appViewState === "response" || recommendedAction === "respond" || recommendedAction === "continue") {
      setDrawerMode("full");
      return;
    }

    if (!selectedItem) {
      setDrawerMode("peek");
      return;
    }

    setDrawerMode("half");
  }, [appViewState, isOverlayOpen, selectedItem, recommendedAction]);

  useEffect(() => {
    if (sceneId !== "puerto-rico-listening") {
      return undefined;
    }

    if (!itemId || !selectedItem || !conversationState?.stepNumber) {
      return;
    }

    if (!Array.isArray(dialogueLines) || !dialogueLines.length) {
      return;
    }

    if (typeof dialogueState?.getLineAudioTarget !== "function") {
      return;
    }

    const stepPlaybackKey = `${sceneId}:${itemId}:${conversationState.stepNumber}`;
    if (lastAutoPlayedStepRef.current === stepPlaybackKey) {
      return;
    }

    const lineAudioTargets = dialogueLines
      .map((line) => dialogueState.getLineAudioTarget(line, itemId))
      .filter(Boolean);

    if (!lineAudioTargets.length) {
      return;
    }

    lastAutoPlayedStepRef.current = stepPlaybackKey;
    autoplayRunRef.current += 1;
    const runId = autoplayRunRef.current;
    let lineIndex = 0;
    let unsubscribe = () => {};
    let delayTimerId = null;

    const clearDelayTimer = () => {
      if (delayTimerId !== null) {
        window.clearTimeout(delayTimerId);
        delayTimerId = null;
      }
    };

    const cleanupRun = () => {
      clearDelayTimer();
      unsubscribe();
      unsubscribe = () => {};
    };

    const playNextLine = () => {
      if (autoplayRunRef.current !== runId) {
        return;
      }

      if (lineIndex >= lineAudioTargets.length) {
        cleanupRun();
        return;
      }

      const target = lineAudioTargets[lineIndex];
      lineIndex += 1;

      try {
        playAudioTarget(target);
      } catch {
        // Keep autoplay fail-safe: ignore and continue.
      }

      if (lineIndex >= lineAudioTargets.length) {
        return;
      }

      let sawPlaybackStart = getAudioPlaybackState().isPlaying;

      const handlePlaybackChange = () => {
        if (autoplayRunRef.current !== runId) {
          return;
        }

        const playbackState = getAudioPlaybackState();
        if (playbackState.isPlaying) {
          sawPlaybackStart = true;
          return;
        }

        if (!sawPlaybackStart) {
          sawPlaybackStart = true;
        }

        unsubscribe();
        unsubscribe = () => {};
        clearDelayTimer();
        delayTimerId = window.setTimeout(() => {
          delayTimerId = null;
          playNextLine();
        }, 420);
      };

      unsubscribe();
      unsubscribe = subscribeToAudioPlayback(handlePlaybackChange);
      handlePlaybackChange();
    };

    playNextLine();

    return () => {
      autoplayRunRef.current += 1;
      cleanupRun();
    };
  }, [sceneId, itemId, selectedItem, conversationState?.stepNumber, dialogueLines, dialogueState]);

  function handleDragStart(event) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    dragPointerIdRef.current = event.pointerId;
    dragStartXRef.current = event.clientX;
    dragStartYRef.current = event.clientY;
    dragAxisRef.current = "none";
    draggedHandleRef.current = false;
    setIsHandleDragging(true);
    setDragOffsetY(0);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleDragMove(event) {
    if (dragPointerIdRef.current !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragStartXRef.current;
    const deltaY = event.clientY - dragStartYRef.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (dragAxisRef.current === "none" && (absX >= 8 || absY >= 8)) {
      dragAxisRef.current = absY > absX ? "y" : "x";
    }

    if (dragAxisRef.current !== "y") {
      return;
    }

    draggedHandleRef.current = absY >= 10;
    const clampedOffset = Math.max(-136, Math.min(152, deltaY));
    const dampedOffset = clampedOffset * 0.92;
    setDragOffsetY(dampedOffset);
    event.preventDefault?.();
  }

  function handleDragEnd(event) {
    if (dragPointerIdRef.current !== event.pointerId) {
      return;
    }

    const deltaY = event.clientY - dragStartYRef.current;
    const usedDragGesture = draggedHandleRef.current;
    const dragAxis = dragAxisRef.current;
    dragPointerIdRef.current = null;
    dragStartXRef.current = 0;
    dragStartYRef.current = 0;
    dragAxisRef.current = "none";
    draggedHandleRef.current = false;
    setIsHandleDragging(false);
    setDragOffsetY(0);

    if (!usedDragGesture || dragAxis !== "y") {
      return;
    }

    suppressHandleClickRef.current = true;

    if (deltaY <= -30) {
      moveDrawerMode("up");
    } else if (deltaY >= 30) {
      moveDrawerMode("down");
    }
  }

  function handleDragCancel(event) {
    if (dragPointerIdRef.current !== event.pointerId) {
      return;
    }

    dragPointerIdRef.current = null;
    dragStartXRef.current = 0;
    dragStartYRef.current = 0;
    dragAxisRef.current = "none";
    draggedHandleRef.current = false;
    setIsHandleDragging(false);
    setDragOffsetY(0);
  }

  function handleHandleButtonClick() {
    if (suppressHandleClickRef.current) {
      suppressHandleClickRef.current = false;
      return;
    }

    toggleDrawerMode();
  }

  const drawerActionLabel = drawerMode === "peek"
    ? "Expand drawer"
    : drawerMode === "half"
      ? (selectedItem ? "Expand drawer to full" : "Collapse drawer")
      : "Collapse drawer";

  return (
    <aside
      className={`bottom-drawer drawer-mode-${drawerMode} ${isHandleDragging ? "is-dragging" : ""} ${conversationState.isAutoAdvancePending ? "is-auto-advancing" : ""} ${engagementState.isRecentlyCompleted ? "is-recently-completed" : ""} ${conversationState.isCurrentStepResponseCompleted ? "is-step-complete" : ""}`}
      data-drawer-mode={drawerMode}
      aria-label="Conversation drawer"
      style={{ "--drawer-drag-offset": `${dragOffsetY}px` }}
    >
      <button
        type="button"
        className="drawer-handle-button"
        onClick={handleHandleButtonClick}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragCancel}
        aria-label={drawerActionLabel}
        aria-expanded={drawerMode !== "peek"}
      >
        <span className="drawer-handle" aria-hidden="true" />
        <span className={`drawer-handle-chevron drawer-handle-chevron-${drawerMode}`} aria-hidden="true" />
      </button>

      <div className="drawer-header">
        <div>
          <p className="drawer-label">Active Word</p>
          <p className="drawer-value">{selectedItemLabel}</p>
          <p className="drawer-subvalue">{selectedItemSubLabel}</p>
        </div>

        <div className="drawer-meta">
          {selectedItem && conversationState.totalSteps > 0 ? (
            <span className={`drawer-chip ${conversationState.isCurrentStepResponseCompleted ? "is-active-progress" : ""}`}>
              {`Step ${conversationState.stepNumber}/${conversationState.totalSteps}`}
            </span>
          ) : null}
          {totalResponseItems > 0 ? (
            <span className={`drawer-chip ${responseCompleted ? "is-active-progress" : ""}`}>
              {`Scene ${completedResponseItems}/${totalResponseItems}`}
            </span>
          ) : null}
        </div>
      </div>

      <div className="drawer-top-actions">
        <AudioButton
          label={selectedItem ? `Play ${selectedItem.spanish} pronunciation` : "Play selected item audio"}
          audioTarget={selectedItemAudioTarget}
        />
      </div>

      <p className="drawer-guidance" aria-live="polite">{combinedGuidance}</p>

      <div className="drawer-layer-switch" role="tablist" aria-label="Interaction layers">
        <button
          type="button"
          role="tab"
          aria-selected={activeLayer === "conversation"}
          className={`drawer-layer-button ${activeLayer === "conversation" ? "is-active" : ""}`}
          onClick={() => setActiveLayer("conversation")}
        >
          Dialogue
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeLayer === "response"}
          className={`drawer-layer-button ${activeLayer === "response" ? "is-active" : ""}`}
          onClick={() => setActiveLayer("response")}
        >
          Response
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeLayer === "grammar"}
          className={`drawer-layer-button ${activeLayer === "grammar" ? "is-active" : ""}`}
          onClick={() => setActiveLayer("grammar")}
        >
          Grammar
        </button>
      </div>

      <div className="drawer-layer-panels">
        <div className={`drawer-layer-panel ${activeLayer === "conversation" ? "is-active" : ""}`} role="tabpanel" aria-hidden={activeLayer !== "conversation"}>
          <DialoguePanel
            lines={dialogueLines}
            chainContext={chainContext}
            selectedChoice={selectedChoice}
            selectedItemId={itemId}
            sceneId={sceneId}
            getLineAudioTarget={dialogueState?.getLineAudioTarget}
            currentStepIndex={conversationState.currentStepIndex}
            stepNumber={conversationState.stepNumber}
            totalSteps={conversationState.totalSteps}
            isAutoAdvancePending={conversationState.isAutoAdvancePending}
            isRecentlyCompleted={engagementState.isRecentlyCompleted}
          />
        </div>

        <div className={`drawer-layer-panel ${activeLayer === "response" ? "is-active" : ""}`} role="tabpanel" aria-hidden={activeLayer !== "response"}>
          <ResponseChoices
            exercise={responseExercise}
            selectedChoice={selectedChoice}
            recommendedAction={recommendedAction}
            onSelectChoice={(choiceId) => {
              if (!itemId) {
                return;
              }
              dialogueState?.chooseResponse?.(itemId, choiceId);
            }}
            isCompleted={responseCompleted}
            isRecentlyCompleted={engagementState.isRecentlyCompleted}
            suggestedNextLabel={suggestedNextLabel}
            hasNextStep={conversationState.hasNextStep}
            canContinue={conversationState.canContinue}
            isAutoAdvancePending={conversationState.isAutoAdvancePending}
            onContinue={() => {
              if (!itemId) {
                return;
              }
              dialogueState?.continueConversation?.(itemId);
            }}
          />
        </div>

        <div className={`drawer-layer-panel ${activeLayer === "grammar" ? "is-active" : ""}`} role="tabpanel" aria-hidden={activeLayer !== "grammar"}>
          <div className="drawer-section-block">
            <p className="drawer-section-title">Grammar Hint</p>
            <GrammarHint hint={grammarHint} />
          </div>
        </div>
      </div>
    </aside>
  );
}

export default BottomDrawer;
