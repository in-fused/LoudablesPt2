import AppLayout from "./app/AppLayout";
import { useScene } from "./features/scene/useScene";
import { useDialogue } from "./features/dialogue/useDialogue";

function App() {
  const sceneState = useScene();
  const dialogueState = useDialogue(sceneState.sceneId);

  return (
    <AppLayout
      sceneState={sceneState}
      dialogueState={dialogueState}
    />
  );
}

export default App;
