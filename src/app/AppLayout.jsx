import { useEffect, useMemo, useRef, useState } from "react";
import SceneCanvas from "../components/SceneCanvas";
import BottomDrawer from "../components/BottomDrawer";

function AppLayout({ sceneState, dialogueState }) {
  const activeSceneTitle = sceneState.scene?.title || "Scene";

  const groupedScenes = useMemo(() => {
    const scenes = Array.isArray(sceneState.scenes) ? sceneState.scenes : [];
    const groupsById = scenes.reduce((acc, sceneEntry, index) => {
      if (!sceneEntry?.id) {
        return acc;
      }

      const rawCategory = typeof sceneEntry.category === "string" ? sceneEntry.category.trim() : "";
      const categoryId = rawCategory || "general";
      const categoryLabel = rawCategory
        ? `${rawCategory.charAt(0).toUpperCase()}${rawCategory.slice(1)}`
        : "General";

      if (!acc[categoryId]) {
        acc[categoryId] = {
          id: categoryId,
          label: categoryLabel,
          order: index,
          scenes: []
        };
      }

      acc[categoryId].scenes.push(sceneEntry);
      return acc;
    }, {});

    return Object.values(groupsById).sort((a, b) => a.order - b.order);
  }, [sceneState.scenes]);

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

  const [isModuleMilestoneActive, setIsModuleMilestoneActive] = useState(false);
  const [isSceneSheetOpen, setIsSceneSheetOpen] = useState(false);
  const [isProgressSheetOpen, setIsProgressSheetOpen] = useState(false);
  const previousModuleCompleteRef = useRef(moduleProgress.moduleComplete);

  useEffect(() => {
    const wasComplete = previousModuleCompleteRef.current;
    if (!wasComplete && moduleProgress.moduleComplete) {
      setIsModuleMilestoneActive(true);
      setIsProgressSheetOpen(true);
      const timerId = window.setTimeout(() => {
        setIsModuleMilestoneActive(false);
      }, 1800);
      previousModuleCompleteRef.current = moduleProgress.moduleComplete;
      return () => {
        window.clearTimeout(timerId);
      };
    }

    previousModuleCompleteRef.current = moduleProgress.moduleComplete;
    return undefined;
  }, [moduleProgress.moduleComplete]);

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

  const recommendedItemLabel = useMemo(() => {
    const recommendedItemId = sceneState.recommendedItemId;
    if (!recommendedItemId) {
      return "";
    }

    const matchingItem = (sceneState.scene?.items || []).find((item) => item?.id === recommendedItemId);
    return matchingItem?.spanish || "";
  }, [sceneState.recommendedItemId, sceneState.scene]);

  const nextSceneEntry = useMemo(() => {
    const scenes = Array.isArray(sceneState.scenes) ? sceneState.scenes.filter((entry) => entry?.id) : [];
    if (scenes.length <= 1) {
      return null;
    }

    const activeIndex = scenes.findIndex((entry) => entry.id === sceneState.activeSceneId);
    if (activeIndex < 0) {
      return scenes[0] || null;
    }

    return scenes[activeIndex + 1] || scenes[0] || null;
  }, [sceneState.scenes, sceneState.activeSceneId]);

  function handleResetCurrentSceneProgress() {
    dialogueState.resetCurrentSceneProgress?.();
    sceneState.resetCurrentSceneProgress?.();
  }

  function handleResetAllProgress() {
    dialogueState.resetProgress?.();
    sceneState.resetAllProgress?.();
  }

  function handleSelectRecommendedItem() {
    if (!sceneState.recommendedItemId) {
      return;
    }
    sceneState.selectItem?.(sceneState.recommendedItemId);
    setIsProgressSheetOpen(false);
  }

  function handleMoveToNextScene() {
    if (!nextSceneEntry?.id) {
      return;
    }
    sceneState.switchScene?.(nextSceneEntry.id);
    setIsProgressSheetOpen(false);
    setIsSceneSheetOpen(false);
  }

  function handleSwitchScene(sceneId) {
    if (!sceneId) {
      return;
    }
    sceneState.switchScene?.(sceneId);
    setIsSceneSheetOpen(false);
  }

  const hasSceneOptions = (sceneState.scenes || []).length > 0;
  const selectedItemId = sceneState.selectedItem?.id || null;
  const responseExercise = selectedItemId && dialogueState?.getResponseExerciseForItem
    ? dialogueState.getResponseExerciseForItem(selectedItemId)
    : null;
  const conversationState = selectedItemId && dialogueState?.getConversationStateForItem
    ? dialogueState.getConversationStateForItem(selectedItemId)
    : {
      hasNextStep: false,
      canContinue: false,
      isCurrentStepResponseCompleted: false,
      isAutoAdvancePending: false
    };

  const isOverlayOpen = isSceneSheetOpen || isProgressSheetOpen;
  const isHomeState = isOverlayOpen;
  const isResponseState = !isHomeState
    && Boolean(selectedItemId)
    && (
      conversationState.isAutoAdvancePending
      || conversationState.canContinue
      || (Boolean(responseExercise) && !conversationState.isCurrentStepResponseCompleted)
    );
  const appViewState = isHomeState ? "home" : (isResponseState ? "response" : "lesson");

  return (
    <div className={`app-shell app-state-${appViewState}`}>
      <header className={`app-header app-header-compact ${appViewState !== "home" ? "is-receded" : ""}`}>
        <div className="app-topbar">
          <div className="app-title-wrap">
            <p className="app-kicker">Module 1</p>
            <h1 className="app-title">{activeSceneTitle}</h1>
          </div>
          <div className="app-utility-actions">
            <button
              type="button"
              className={`top-icon-button ${isSceneSheetOpen ? "is-active" : ""}`}
              onClick={() => {
                setIsProgressSheetOpen(false);
                setIsSceneSheetOpen((isOpen) => !isOpen);
              }}
              aria-expanded={isSceneSheetOpen}
              aria-label="Open scene picker"
            >
              Scenes
            </button>
            <button
              type="button"
              className={`top-icon-button ${isProgressSheetOpen ? "is-active" : ""}`}
              onClick={() => {
                setIsSceneSheetOpen(false);
                setIsProgressSheetOpen((isOpen) => !isOpen);
              }}
              aria-expanded={isProgressSheetOpen}
              aria-label="Open progress panel"
            >
              Progress
            </button>
          </div>
        </div>

        <div className="app-status-strip" aria-live="polite">
          <p className="app-progress-summary">
            Seen {moduleProgress.seenCount}/{moduleProgress.totalItems}
          </p>
          <p className="app-progress-summary">
            Responses {moduleProgress.completedCount}/{moduleProgress.totalExercises}
          </p>
        </div>
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

        <BottomDrawer
          selectedItem={sceneState.selectedItem}
          dialogueState={dialogueState}
          grammarHint={sceneState.grammarHint}
          sceneId={sceneState.sceneId}
          appViewState={appViewState}
          isOverlayOpen={isOverlayOpen}
        />
      </main>

      {(isSceneSheetOpen || isProgressSheetOpen) ? (
        <button
          type="button"
          className="app-overlay-backdrop"
          aria-label="Close overlay"
          onClick={() => {
            setIsSceneSheetOpen(false);
            setIsProgressSheetOpen(false);
          }}
        />
      ) : null}

      <aside
        className={`app-overlay-sheet scene-sheet ${isSceneSheetOpen ? "is-open" : ""}`}
        aria-hidden={!isSceneSheetOpen}
      >
        <div className="sheet-heading-row">
          <p className="sheet-kicker">Select Scene</p>
          <button
            type="button"
            className="sheet-close-button"
            onClick={() => setIsSceneSheetOpen(false)}
            aria-label="Close scene picker"
          >
            Close
          </button>
        </div>
        {groupedScenes.map((group) => (
          <section key={group.id} className="scene-switch-group" aria-label={`${group.label} modules`}>
            <p className="scene-switch-group-label">{group.label}</p>
            <div className="scene-switch-group-rail" role="group" aria-label={`${group.label} scene options`}>
              {group.scenes.map((sceneEntry) => {
                const isActiveScene = sceneEntry.id === sceneState.activeSceneId;
                const difficultyLabel = typeof sceneEntry.difficulty === "string" ? sceneEntry.difficulty.trim() : "";
                return (
                  <button
                    key={sceneEntry.id}
                    type="button"
                    className={`scene-switch-button ${isActiveScene ? "is-active" : ""}`}
                    onClick={() => handleSwitchScene(sceneEntry.id)}
                    aria-pressed={isActiveScene}
                    aria-label={`${sceneEntry.label}${difficultyLabel ? `, ${difficultyLabel}` : ""}${isActiveScene ? ", active scene" : ""}`}
                  >
                    <span className="scene-switch-button-label">{sceneEntry.label}</span>
                    {difficultyLabel ? <span className="scene-switch-difficulty">{difficultyLabel}</span> : null}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        {!hasSceneOptions ? <p className="response-fallback">No scenes are currently available.</p> : null}
      </aside>

      <aside
        className={`app-overlay-sheet progress-sheet ${isProgressSheetOpen ? "is-open" : ""}`}
        aria-hidden={!isProgressSheetOpen}
      >
        <div className="sheet-heading-row">
          <p className="sheet-kicker">Scene Progress</p>
          <button
            type="button"
            className="sheet-close-button"
            onClick={() => setIsProgressSheetOpen(false)}
            aria-label="Close progress panel"
          >
            Close
          </button>
        </div>

        {moduleProgress.moduleComplete ? (
          <div className={`app-module-banner is-complete ${isModuleMilestoneActive ? "is-milestone-pop" : ""}`} role="status" aria-live="polite">
            <p className="app-module-overline">Milestone reached</p>
            <p className="app-module-message">{activeSceneTitle} complete. You finished this scene&apos;s response practice.</p>
            <p className="app-module-subtext">You can tap any completed word to review responses.</p>
            {nextSceneEntry ? (
              <button type="button" className="module-next-button" onClick={handleMoveToNextScene}>
                {`Continue to ${nextSceneEntry.label}`}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="app-module-banner" role="status" aria-live="polite">
            <p className="app-module-overline">Progress runway</p>
            <p className="app-module-message">Keep exploring {activeSceneTitle} to finish the remaining response words.</p>
            <p className="app-module-subtext">
              {moduleProgress.totalExercises === 0
                ? "No response exercises are available in this scene yet."
                : `${moduleProgress.remainingCount} response words left: ${moduleProgress.remainingLabels.join(", ")}`}
            </p>
            {recommendedItemLabel ? (
              <div className="app-module-next-step">
                <p className="app-module-next-label">Up next</p>
                <button type="button" className="module-next-button" onClick={handleSelectRecommendedItem}>
                  {`Continue with ${recommendedItemLabel}`}
                </button>
              </div>
            ) : null}
          </div>
        )}

        <button type="button" className="reset-progress-button" onClick={handleResetCurrentSceneProgress}>
          Reset this scene
        </button>
        <button type="button" className="reset-all-button" onClick={handleResetAllProgress}>
          Reset all scenes
        </button>
      </aside>
    </div>
  );
}

export default AppLayout;
