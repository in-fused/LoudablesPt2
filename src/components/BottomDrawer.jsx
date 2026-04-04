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

  return (
    <aside className="bottom-drawer" aria-label="Conversation drawer">
      <div className="drawer-header">
        <p className="drawer-label">Selected Item</p>
        <p className="drawer-value">{selectedItemLabel}</p>
      </div>

      <div className="drawer-actions">
        <AudioButton
          label={selectedItem ? `Play ${selectedItem.spanish} audio` : "Play sample audio"}
          audioKey={itemId || "placeholder"}
        />
      </div>

      <DialoguePanel lines={dialogueLines} />

      <ResponseChoices
        exercise={responseExercise}
        selectedChoice={selectedChoice}
        onSelectChoice={(choiceId) => dialogueState?.chooseResponse?.(itemId, choiceId)}
        isCompleted={responseCompleted}
      />

      <GrammarHint hint={grammarHint} />
    </aside>
  );
}

export default BottomDrawer;
