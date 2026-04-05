import { useEffect, useMemo, useState } from "react";
import { getDefaultSceneId, getSceneEntry, getSceneVocabularyById } from "../../data/scenes/registry";
import {
  getProgress,
  getRecommendedItemId,
  markResponseCompleted,
  resetSceneProgress,
  resetModuleProgress as resetStoredModuleProgress,
  setSelectedChoice,
  setSelectedChoiceForStep,
  setConversationStep
} from "../progress/progressStore";

function safeObject(value) {
  return value && typeof value === "object" ? value : {};
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildAudioKey(sceneId, scope, targetId) {
  if (!sceneId || !scope || !targetId) {
    return "placeholder";
  }
  return `scene.${sceneId}.${scope}.${targetId}`;
}

function buildExercise(exercise) {
  if (!exercise || typeof exercise !== "object") {
    return null;
  }

  const choices = safeArray(exercise.choices);
  if (!exercise.prompt || !choices.length) {
    return null;
  }

  return {
    prompt: exercise.prompt,
    choices
  };
}

function buildConversationSteps(itemEntry, itemId) {
  const safeEntry = safeObject(itemEntry);
  const explicitSteps = safeArray(safeEntry.steps);

  const normalizedExplicitSteps = explicitSteps
    .map((step, index) => {
      const safeStep = safeObject(step);
      const lines = safeArray(safeStep.lines);
      const responseExercise = buildExercise(safeStep.responseExercise);
      if (!lines.length && !responseExercise) {
        return null;
      }

      return {
        id: safeStep.id || `${itemId || "item"}-step-${index + 1}`,
        lines,
        responseExercise
      };
    })
    .filter(Boolean);

  if (normalizedExplicitSteps.length) {
    return normalizedExplicitSteps;
  }

  const lines = safeArray(safeEntry.lines);
  const responseExercise = buildExercise(safeEntry.responseExercise);
  if (!lines.length && !responseExercise) {
    return [];
  }

  return [
    {
      id: `${itemId || "item"}-step-1`,
      lines,
      responseExercise
    }
  ];
}

function restoreSelectedChoicesByStep(conversationStepsByItem, storedChoiceMapByStep, storedChoiceMap) {
  const safeChoiceMapByStep = safeObject(storedChoiceMapByStep);
  const safeChoiceMap = safeObject(storedChoiceMap);

  const restoredByStep = Object.entries(conversationStepsByItem).reduce((acc, [itemId, steps]) => {
    const safeSteps = safeArray(steps);
    if (!safeSteps.length) {
      return acc;
    }

    const itemChoiceMap = safeObject(safeChoiceMapByStep[itemId]);
    const normalizedChoiceMap = {};

    safeSteps.forEach((step, stepIndex) => {
      const exercise = step?.responseExercise;
      if (!exercise) {
        return;
      }

      const stepChoiceId = itemChoiceMap[String(stepIndex)];
      if (typeof stepChoiceId !== "string" || !stepChoiceId) {
        return;
      }

      const isValidChoice = exercise.choices.some((choice) => choice.id === stepChoiceId);
      if (isValidChoice) {
        normalizedChoiceMap[String(stepIndex)] = stepChoiceId;
      }
    });

    if (Object.keys(normalizedChoiceMap).length > 0) {
      acc[itemId] = normalizedChoiceMap;
    }

    return acc;
  }, {});

  Object.entries(safeChoiceMap).forEach(([itemId, choiceId]) => {
    const firstStepExercise = conversationStepsByItem[itemId]?.[0]?.responseExercise;
    if (!firstStepExercise) {
      return;
    }

    const isValidChoice = firstStepExercise.choices.some((choice) => choice.id === choiceId);
    if (!isValidChoice) {
      return;
    }

    if (!restoredByStep[itemId]) {
      restoredByStep[itemId] = {};
    }

    if (!restoredByStep[itemId]["0"]) {
      restoredByStep[itemId]["0"] = choiceId;
    }
  });

  return restoredByStep;
}

function restoreConversationSteps(conversationStepsByItem, storedStepMap) {
  const safeStepMap = safeObject(storedStepMap);

  return Object.entries(conversationStepsByItem).reduce((acc, [itemId, steps]) => {
    const stepCount = safeArray(steps).length;
    if (stepCount <= 1) {
      return acc;
    }

    const rawStep = Number(safeStepMap[itemId]);
    const normalizedStep = Number.isInteger(rawStep) ? rawStep : 0;
    const clampedStep = Math.max(0, Math.min(normalizedStep, stepCount - 1));
    if (clampedStep > 0) {
      acc[itemId] = clampedStep;
    }

    return acc;
  }, {});
}

export function useDialogue(sceneId) {
  const vocabularyById = useMemo(() => getSceneVocabularyById(sceneId || getDefaultSceneId()), [sceneId]);

  const itemDialogues = useMemo(() => {
    const sceneDialogueData = getSceneEntry(sceneId || getDefaultSceneId())?.dialogue;
    return safeObject(sceneDialogueData?.itemDialogues);
  }, [sceneId]);

  const conversationStepsByItem = useMemo(() => {
    return Object.entries(itemDialogues).reduce((acc, [itemId, itemEntry]) => {
      acc[itemId] = buildConversationSteps(itemEntry, itemId);
      return acc;
    }, {});
  }, [itemDialogues]);

  const exercisableItemIds = useMemo(() => {
    return Object.keys(conversationStepsByItem).filter((itemId) => {
      return safeArray(conversationStepsByItem[itemId]).some((step) => step?.responseExercise);
    });
  }, [conversationStepsByItem]);

  const initialProgress = getProgress(sceneId);
  const [selectedChoiceByItemStep, setSelectedChoiceByItemStep] = useState(() => {
    return restoreSelectedChoicesByStep(
      conversationStepsByItem,
      initialProgress.selectedChoiceByItemStep,
      initialProgress.selectedChoiceByItem
    );
  });
  const [conversationStepByItem, setConversationStepByItem] = useState(() => {
    return restoreConversationSteps(conversationStepsByItem, initialProgress.conversationStepByItem);
  });
  const [completedResponseItemIds, setCompletedResponseItemIds] = useState(() => {
    return safeArray(initialProgress.completedResponseItemIds).filter((itemId) => exercisableItemIds.includes(itemId));
  });
  const [lastCompletedItemId, setLastCompletedItemId] = useState(() => {
    const storedLastCompletedItemId = initialProgress.lastCompletedItemId;
    return storedLastCompletedItemId && itemDialogues[storedLastCompletedItemId] ? storedLastCompletedItemId : null;
  });
  const [pendingAutoAdvanceByItem, setPendingAutoAdvanceByItem] = useState({});

  useEffect(() => {
    const sceneProgress = getProgress(sceneId);
    setSelectedChoiceByItemStep(
      restoreSelectedChoicesByStep(
        conversationStepsByItem,
        sceneProgress.selectedChoiceByItemStep,
        sceneProgress.selectedChoiceByItem
      )
    );
    setConversationStepByItem(restoreConversationSteps(conversationStepsByItem, sceneProgress.conversationStepByItem));
    setCompletedResponseItemIds(
      safeArray(sceneProgress.completedResponseItemIds).filter((itemId) => exercisableItemIds.includes(itemId))
    );
    setLastCompletedItemId(sceneProgress.lastCompletedItemId && itemDialogues[sceneProgress.lastCompletedItemId]
      ? sceneProgress.lastCompletedItemId
      : null);
  }, [sceneId, conversationStepsByItem, exercisableItemIds]);

  useEffect(() => {
    return () => {
      setPendingAutoAdvanceByItem({});
    };
  }, [sceneId]);

  useEffect(() => {
    const pendingItemIds = Object.keys(pendingAutoAdvanceByItem).filter((itemId) => pendingAutoAdvanceByItem[itemId]);
    if (!pendingItemIds.length) {
      return undefined;
    }

    const timerIds = pendingItemIds
      .map((itemId) => {
        if (!canContinueConversation(itemId)) {
          return null;
        }

        return window.setTimeout(() => {
          continueConversation(itemId);
        }, 900);
      })
      .filter(Boolean);

    if (!timerIds.length) {
      return undefined;
    }

    return () => {
      timerIds.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [pendingAutoAdvanceByItem, selectedChoiceByItemStep, conversationStepByItem]);

  function getItemEntry(itemId) {
    return safeObject(itemDialogues[itemId]);
  }

  function getConversationSteps(itemId) {
    return safeArray(conversationStepsByItem[itemId]);
  }

  function getCurrentStepIndex(itemId) {
    const steps = getConversationSteps(itemId);
    if (!steps.length) {
      return 0;
    }

    const rawStep = Number(conversationStepByItem[itemId]);
    const normalizedStep = Number.isInteger(rawStep) ? rawStep : 0;
    return Math.max(0, Math.min(normalizedStep, steps.length - 1));
  }

  function getCurrentStep(itemId) {
    const steps = getConversationSteps(itemId);
    if (!steps.length) {
      return null;
    }
    return steps[getCurrentStepIndex(itemId)] || null;
  }

  function getLinesForItem(itemId) {
    const currentStep = getCurrentStep(itemId);
    return safeArray(currentStep?.lines);
  }

  function getResponseExerciseForItem(itemId) {
    return getCurrentStep(itemId)?.responseExercise || null;
  }

  function getSelectedChoiceIdForStep(itemId, stepIndex) {
    const itemChoiceMap = safeObject(selectedChoiceByItemStep[itemId]);
    const selectedChoiceId = itemChoiceMap[String(stepIndex)];
    return typeof selectedChoiceId === "string" && selectedChoiceId ? selectedChoiceId : null;
  }

  function hasNextStep(itemId) {
    const steps = getConversationSteps(itemId);
    if (!steps.length) {
      return false;
    }
    return getCurrentStepIndex(itemId) < steps.length - 1;
  }

  function isCurrentStepResponseCompleted(itemId) {
    const exercise = getResponseExerciseForItem(itemId);
    if (!exercise) {
      return true;
    }

    const stepIndex = getCurrentStepIndex(itemId);
    return Boolean(getSelectedChoiceIdForStep(itemId, stepIndex));
  }

  function canContinueConversation(itemId) {
    if (!hasNextStep(itemId)) {
      return false;
    }
    return isCurrentStepResponseCompleted(itemId);
  }

  function isAutoAdvancePending(itemId) {
    return Boolean(pendingAutoAdvanceByItem[itemId]);
  }

  function isConversationCompleted(itemId) {
    return completedResponseItemIds.includes(itemId);
  }

  function getConversationStateForItem(itemId) {
    const steps = getConversationSteps(itemId);
    const totalSteps = steps.length;
    const currentStepIndex = getCurrentStepIndex(itemId);
    const currentStep = steps[currentStepIndex] || null;
    const nextStepAvailable = totalSteps > 0 && currentStepIndex < totalSteps - 1;
    const currentStepResponseCompleted = !currentStep?.responseExercise
      ? true
      : Boolean(getSelectedChoiceIdForStep(itemId, currentStepIndex));
    const autoAdvancePending = isAutoAdvancePending(itemId);

    return {
      currentStepIndex,
      stepNumber: currentStepIndex + 1,
      totalSteps,
      hasNextStep: nextStepAvailable,
      canContinue: nextStepAvailable && currentStepResponseCompleted && !autoAdvancePending,
      isCurrentStepResponseCompleted: currentStepResponseCompleted,
      isCompleted: isConversationCompleted(itemId),
      isAutoAdvancePending: autoAdvancePending
    };
  }

  function getSuggestedNextItemId(currentItemId) {
    const sceneItemIds = Object.keys(itemDialogues);
    if (!sceneItemIds.length) {
      return null;
    }

    const recommendedItemId = getRecommendedItemId(sceneItemIds, sceneId, currentItemId);
    if (recommendedItemId && recommendedItemId !== currentItemId) {
      return recommendedItemId;
    }

    const fallbackItemId = sceneItemIds.find((itemId) => itemId !== currentItemId && !isConversationCompleted(itemId));
    return fallbackItemId || null;
  }

  function getEngagementStateForItem(itemId) {
    const totalItems = exercisableItemIds.length;
    const completedItems = completedResponseItemIds.length;
    const completionRatio = totalItems > 0 ? completedItems / totalItems : 0;
    const isRecentlyCompleted = Boolean(itemId && lastCompletedItemId && itemId === lastCompletedItemId);
    const suggestedNextItemId = getSuggestedNextItemId(itemId);

    let encouragement = "";
    if (isRecentlyCompleted && completedItems === 1) {
      encouragement = "Nice work, first item complete.";
    } else if (isRecentlyCompleted && completionRatio >= 0.8 && completedItems < totalItems) {
      encouragement = "Great work. You're close to finishing this scene.";
    } else if (isRecentlyCompleted) {
      encouragement = "Nice work, this item is complete.";
    } else if (completedItems > 0 && completionRatio < 0.5) {
      encouragement = "Keep going, you're building momentum.";
    } else if (completedItems > 0 && completionRatio < 1) {
      encouragement = "You're making great progress.";
    } else if (totalItems > 0 && completedItems >= totalItems) {
      encouragement = "Scene complete. Review or revisit any item.";
    }

    return {
      isRecentlyCompleted,
      encouragement,
      suggestedNextItemId
    };
  }

  function shouldAutoAdvanceAfterResponse(itemId, stepIndex) {
    const steps = getConversationSteps(itemId);
    const nextStep = steps[stepIndex + 1];
    if (!nextStep) {
      return false;
    }

    return !nextStep.responseExercise;
  }

  function continueConversation(itemId) {
    if (!itemId || !canContinueConversation(itemId)) {
      return;
    }

    setPendingAutoAdvanceByItem((prev) => ({
      ...prev,
      [itemId]: false
    }));

    const currentStepIndex = getCurrentStepIndex(itemId);
    const nextStepIndex = currentStepIndex + 1;
    const steps = getConversationSteps(itemId);
    const nextStep = steps[nextStepIndex];
    const isFinalStep = nextStepIndex === steps.length - 1;
    const finalStepHasNoResponse = isFinalStep && !nextStep?.responseExercise;

    setConversationStepByItem((prev) => ({
      ...prev,
      [itemId]: nextStepIndex
    }));

    setConversationStep(itemId, nextStepIndex, sceneId);

    if (finalStepHasNoResponse) {
      setCompletedResponseItemIds((prev) => {
        if (prev.includes(itemId)) {
          return prev;
        }
        return [...prev, itemId];
      });
      setLastCompletedItemId(itemId);
      markResponseCompleted(itemId, sceneId);
    }
  }

  function getItemAudioTarget(itemId, selectedItem) {
    if (!itemId) {
      return {
        key: "placeholder",
        label: "Play selected item audio"
      };
    }

    const entry = getItemEntry(itemId);
    const fallbackVocabularyAudioKey = vocabularyById[itemId]?.audioKey;
    const key = entry.audioKey || fallbackVocabularyAudioKey || buildAudioKey(sceneId, "item", itemId);
    const spokenLabel = selectedItem?.spanish || itemId;

    return {
      key,
      label: `Play ${spokenLabel} audio`
    };
  }

  function getLineAudioTarget(line, itemId) {
    if (!line || typeof line !== "object") {
      return null;
    }

    const lineId = line.id || itemId;
    if (!lineId) {
      return null;
    }

    return {
      key: line.audioKey || buildAudioKey(sceneId, "line", lineId),
      label: `Play ${line.speaker || "dialogue"} line`
    };
  }

  function getItemDisplayLabel(itemId) {
    if (!itemId) {
      return "";
    }
    return vocabularyById[itemId]?.spanish || itemId;
  }

  function chooseResponse(itemId, choiceId) {
    if (!itemId || !choiceId) {
      return;
    }

    const exercise = getResponseExerciseForItem(itemId);
    if (!exercise) {
      return;
    }

    const currentStepIndex = getCurrentStepIndex(itemId);
    const hasNext = hasNextStep(itemId);

    setSelectedChoiceByItemStep((prev) => ({
      ...prev,
      [itemId]: {
        ...safeObject(prev[itemId]),
        [String(currentStepIndex)]: choiceId
      }
    }));

    if (!hasNext) {
      setCompletedResponseItemIds((prev) => {
        if (prev.includes(itemId)) {
          return prev;
        }
        return [...prev, itemId];
      });
      setLastCompletedItemId(itemId);
      markResponseCompleted(itemId, sceneId);
      setPendingAutoAdvanceByItem((prev) => ({
        ...prev,
        [itemId]: false
      }));
    } else if (shouldAutoAdvanceAfterResponse(itemId, currentStepIndex)) {
      setPendingAutoAdvanceByItem((prev) => ({
        ...prev,
        [itemId]: true
      }));
    } else {
      setPendingAutoAdvanceByItem((prev) => ({
        ...prev,
        [itemId]: false
      }));
    }

    setSelectedChoiceForStep(itemId, currentStepIndex, choiceId, sceneId);
    setSelectedChoice(itemId, choiceId, sceneId);
  }

  function getSelectedChoiceForItem(itemId) {
    const exercise = getResponseExerciseForItem(itemId);
    if (!exercise) {
      return null;
    }

    const selectedChoiceId = getSelectedChoiceIdForStep(itemId, getCurrentStepIndex(itemId));
    if (!selectedChoiceId) {
      return null;
    }

    return exercise.choices.find((choice) => choice.id === selectedChoiceId) || null;
  }

  function isResponseCompleted(itemId) {
    return isConversationCompleted(itemId);
  }

  function resetCurrentSceneProgress() {
    resetSceneProgress(sceneId);
    setSelectedChoiceByItemStep({});
    setConversationStepByItem({});
    setCompletedResponseItemIds([]);
    setLastCompletedItemId(null);
    setPendingAutoAdvanceByItem({});
  }

  function resetProgress() {
    resetStoredModuleProgress();
    setSelectedChoiceByItemStep({});
    setConversationStepByItem({});
    setCompletedResponseItemIds([]);
    setLastCompletedItemId(null);
    setPendingAutoAdvanceByItem({});
  }

  return {
    getLinesForItem,
    getResponseExerciseForItem,
    getItemAudioTarget,
    getItemDisplayLabel,
    getLineAudioTarget,
    chooseResponse,
    continueConversation,
    getConversationStateForItem,
    getEngagementStateForItem,
    getSelectedChoiceForItem,
    isResponseCompleted,
    completedResponseItemIds,
    exercisableItemIds,
    resetCurrentSceneProgress,
    resetProgress
  };
}
