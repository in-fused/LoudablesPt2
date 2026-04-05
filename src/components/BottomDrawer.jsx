import DialoguePanel from "./DialoguePanel";
import AudioButton from "./AudioButton";
import GrammarHint from "./GrammarHint";
import ResponseChoices from "./ResponseChoices";

function BottomDrawer({ selectedItem, dialogueState, grammarHint }) {
  const selectedItemLabel = selectedItem
    ? `${selectedItem.spanish} (${selectedItem.english})`
    : "No item selected";

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
        canContinue: false
      };

  const selectedItemAudioTarget = dialogueState?.getItemAudioTarget
    ? dialogueState.getItemAudioTarget(itemId, selectedItem)
    : { key: itemId || "placeholder", label: "Play selected item audio" };

  const guidanceText = !selectedItem
    ? "Start with the highlighted recommended word."
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

  return (
    <aside className="bottom-drawer" aria-label="Conversation drawer">
      <div className="drawer-header">
        <p className="drawer-label">Selected Item</p>
        <p className="drawer-value">{selectedItemLabel}</p>
      </div>

      <div className="drawer-actions">
        <AudioButton
          label={selectedItem ? `Play ${selectedItem.spanish} pronunciation` : "Play selected item audio"}
          audioTarget={selectedItemAudioTarget}
        />
      </div>

      <p className="drawer-guidance">{guidanceText}</p>

      <DialoguePanel
        lines={dialogueLines}
        selectedItemId={itemId}
        getLineAudioTarget={dialogueState?.getLineAudioTarget}
        stepNumber={conversationState.stepNumber}
        totalSteps={conversationState.totalSteps}
        isAutoAdvancePending={conversationState.isAutoAdvancePending}
      />

      <ResponseChoices
        exercise={responseExercise}
        selectedChoice={selectedChoice}
        onSelectChoice={(choiceId) => dialogueState?.chooseResponse?.(itemId, choiceId)}
        isCompleted={responseCompleted}
        hasNextStep={conversationState.hasNextStep}
        canContinue={conversationState.canContinue}
        isAutoAdvancePending={conversationState.isAutoAdvancePending}
        onContinue={() => dialogueState?.continueConversation?.(itemId)}
      />

      <GrammarHint hint={grammarHint} />
    </aside>
  );
}

export default BottomDrawer;
