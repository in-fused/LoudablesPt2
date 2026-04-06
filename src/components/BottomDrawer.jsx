import DialoguePanel from "./DialoguePanel";
import AudioButton from "./AudioButton";
import GrammarHint from "./GrammarHint";
import ResponseChoices from "./ResponseChoices";

function BottomDrawer({ selectedItem, dialogueState, grammarHint }) {
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

  const guidanceText = !selectedItem
    ? totalResponseItems
      ? "Start with the highlighted recommended word."
      : "Tap any visible word to explore this scene."
    : conversationState.isAutoAdvancePending
      ? "Nice response. Continuing to the next line..."
    : conversationState.totalSteps > 1 && conversationState.hasNextStep && conversationState.canContinue
      ? "Continue to the next line when you are ready."
      : conversationState.totalSteps > 1 && conversationState.hasNextStep
        ? "Respond to continue this short conversation."
        : !responseExercise
          ? "You can explore this word, then try a highlighted word next."
      : !responseCompleted
        ? "Try this next: choose a response to keep progressing through this scene."
        : "You're progressing through this scene. You can revisit this word or explore another.";

  const combinedGuidance = [guidanceText, progressStateGuidance, milestoneText, engagementState.encouragement, continuityText]
    .filter((text, index, all) => text && all.indexOf(text) === index)
    .join(" ");

  return (
    <aside
      className={`bottom-drawer ${conversationState.isAutoAdvancePending ? "is-auto-advancing" : ""} ${engagementState.isRecentlyCompleted ? "is-recently-completed" : ""}`}
      aria-label="Conversation drawer"
    >
      <div className="drawer-header">
        <p className="drawer-label">Selected Item</p>
        <p className="drawer-value">{selectedItemLabel}</p>
        <p className="drawer-subvalue">{selectedItemSubLabel}</p>
        <div className="drawer-meta">
          {selectedItem && conversationState.totalSteps > 0 ? (
            <span className="drawer-chip">{`Step ${conversationState.stepNumber}/${conversationState.totalSteps}`}</span>
          ) : null}
          {totalResponseItems > 0 ? (
            <span className="drawer-chip">{`Scene Progress ${completedResponseItems}/${totalResponseItems}`}</span>
          ) : null}
        </div>
      </div>

      <div className="drawer-section-block drawer-actions">
        <AudioButton
          label={selectedItem ? `Play ${selectedItem.spanish} pronunciation` : "Play selected item audio"}
          audioTarget={selectedItemAudioTarget}
        />
      </div>

      <p className="drawer-guidance" aria-live="polite">{combinedGuidance}</p>

      <div className="drawer-section-block">
        <p className="drawer-section-title">Conversation</p>
        <DialoguePanel
          lines={dialogueLines}
          selectedItemId={itemId}
          getLineAudioTarget={dialogueState?.getLineAudioTarget}
          stepNumber={conversationState.stepNumber}
          totalSteps={conversationState.totalSteps}
          isAutoAdvancePending={conversationState.isAutoAdvancePending}
          isRecentlyCompleted={engagementState.isRecentlyCompleted}
        />
      </div>

      <div className="drawer-section-block">
        <p className="drawer-section-title">Your Response</p>
        <ResponseChoices
          exercise={responseExercise}
          selectedChoice={selectedChoice}
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

      <div className="drawer-section-block">
        <p className="drawer-section-title">Grammar</p>
        <GrammarHint hint={grammarHint} />
      </div>
    </aside>
  );
}

export default BottomDrawer;
