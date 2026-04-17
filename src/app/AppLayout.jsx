import { useMemo } from "react";
import SceneCanvas from "../components/SceneCanvas";
import BottomDrawer from "../components/BottomDrawer";

function AppLayout({ sceneState, dialogueState }) {
  const activeSceneTitle = sceneState.scene?.title || "Scene";

  const moduleProgress = useMemo(() => {
    const sceneItems = Array.isArray(sceneState.scene?.items)
      ? sceneState.scene.items.filter((item) => item && item.id)
      : [];
    const sceneItemIds = new Set(sceneItems.map((item) => item.id));
    const sceneLabelById = sceneItems.reduce((acc, item) => {
      acc[item.id] = item.spanish || item.id;
      return acc;
    }, {});

    const seenInScene = (sceneState.seenItemIds || []).filter((id) => sceneItemIds.has(id));

    const exercisableItemIds = dialogueState.exercisableItemIds || [];
    const exercisableSet = new Set(exercisableItemIds);
    const completedExerciseIds = (dialogueState.completedResponseItemIds || []).filter((id) => exercisableSet.has(id));

    const remainingExerciseIds = exercisableItemIds.filter((id) => !completedExerciseIds.includes(id));
    const remainingLabels = remainingExerciseIds.map((id) => sceneLabelById[id] || id);
    const moduleComplete = exercisableItemIds.length > 0 && remainingExerciseIds.length === 0;

    return {
      seenCount: seenInScene.length,
      totalItems: sceneItemIds.size,
      completedCount: completedExerciseIds.length,
      totalExercises: exercisableItemIds.length,
      remainingCount: remainingExerciseIds.length,
      remainingLabels,
      moduleComplete
    };
  }, [sceneState.scene, sceneState.seenItemIds, dialogueState.exercisableItemIds, dialogueState.completedResponseItemIds]);

  const itemStatusById = useMemo(() => {
    const seenSet = new Set(sceneState.seenItemIds || []);
    const completedSet = new Set(dialogueState.completedResponseItemIds || []);

    return (sceneState.scene?.items || []).reduce((acc, item) => {
      if (completedSet.has(item.id)) {
        acc[item.id] = "completed";
      } else if (seenSet.has(item.id)) {
        acc[item.id] = "seen";
      } else {
        acc[item.id] = "default";
      }
      return acc;
    }, {});
  }, [sceneState.scene, sceneState.seenItemIds, dialogueState.completedResponseItemIds]);

  function handleResetCurrentSceneProgress() {
    dialogueState.resetCurrentSceneProgress?.();
    sceneState.resetCurrentSceneProgress?.();
  }

  function handleResetAllProgress() {
    dialogueState.resetProgress?.();
    sceneState.resetAllProgress?.();
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-kicker">Module 1</p>
        <h1 className="app-title">{activeSceneTitle}</h1>
        <p className="app-scene-meta">Active scene</p>
        <div className="scene-switcher" role="group" aria-label="Scene switcher">
          {(sceneState.scenes || []).map((sceneEntry) => {
            const isActiveScene = sceneEntry.id === sceneState.activeSceneId;
            return (
              <button
                key={sceneEntry.id}
                type="button"
                className={`scene-switch-button ${isActiveScene ? "is-active" : ""}`}
                onClick={() => sceneState.switchScene?.(sceneEntry.id)}
                aria-pressed={isActiveScene}
                aria-label={`${sceneEntry.label}${isActiveScene ? ", active scene" : ""}`}
              >
                {sceneEntry.label}
              </button>
            );
          })}
        </div>
        {(sceneState.scenes || []).length === 0 ? <p className="response-fallback">No scenes are currently available.</p> : null}
        <p className="app-progress-summary">
          {activeSceneTitle}: Seen {moduleProgress.seenCount}/{moduleProgress.totalItems} • Responses {moduleProgress.completedCount}/{moduleProgress.totalExercises}
        </p>

        {moduleProgress.moduleComplete ? (
          <div className="app-module-banner is-complete" role="status" aria-live="polite">
            <p className="app-module-message">{activeSceneTitle} complete. You finished this scene's response practice.</p>
            <p className="app-module-subtext">You can tap any completed word to review responses.</p>
          </div>
        ) : (
          <div className="app-module-banner" role="status" aria-live="polite">
            <p className="app-module-message">Keep exploring {activeSceneTitle} to finish the remaining response words.</p>
            <p className="app-module-subtext">
              {moduleProgress.totalExercises === 0
                ? "No response exercises are available in this scene yet."
                : `${moduleProgress.remainingCount} response words left: ${moduleProgress.remainingLabels.join(", ")}`}
            </p>
          </div>
        )}

        <button type="button" className="reset-progress-button" onClick={handleResetCurrentSceneProgress}>
          Reset this scene
        </button>
        <button type="button" className="reset-all-button" onClick={handleResetAllProgress}>
          Reset all scenes
        </button>
      </header>

      <main className="app-main" aria-label="Learning scene">
        <section className="scene-section">
          <SceneCanvas
            scene={sceneState.scene}
            selectedItem={sceneState.selectedItem}
            onSelectItem={sceneState.selectItem}
            itemStatusById={itemStatusById}
          />
        </section>

        <section className="drawer-section">
          <BottomDrawer
            selectedItem={sceneState.selectedItem}
            dialogueState={dialogueState}
            grammarHint={sceneState.grammarHint}
            sceneId={sceneState.sceneId}
          />
        </section>
      </main>
    </div>
  );
}

export default AppLayout;
