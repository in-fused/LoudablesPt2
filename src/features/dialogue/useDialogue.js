import { useEffect, useMemo, useState } from "react";
import { getDefaultSceneId, getSceneEntry, getSceneVocabularyById } from "../../data/scenes/registry";
import {
  getProgress,
  markResponseCompleted,
  resetSceneProgress,
  resetModuleProgress as resetStoredModuleProgress,
  setSelectedChoice
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

function restoreSelectedChoices(itemDialogues, storedChoiceMap) {
  const safeChoiceMap = safeObject(storedChoiceMap);

  return Object.entries(safeChoiceMap).reduce((acc, [itemId, choiceId]) => {
    const exercise = buildExercise(itemDialogues[itemId]?.responseExercise);
    if (!exercise) {
      return acc;
    }

    const isValidChoice = exercise.choices.some((choice) => choice.id === choiceId);
    if (isValidChoice) {
      acc[itemId] = choiceId;
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

  const exercisableItemIds = useMemo(() => {
    return Object.keys(itemDialogues).filter((itemId) => buildExercise(itemDialogues[itemId]?.responseExercise));
  }, [itemDialogues]);

  const initialProgress = getProgress(sceneId);
  const [selectedChoiceByItem, setSelectedChoiceByItem] = useState(() => {
    return restoreSelectedChoices(itemDialogues, initialProgress.selectedChoiceByItem);
  });
  const [completedResponseItemIds, setCompletedResponseItemIds] = useState(() => {
    return safeArray(initialProgress.completedResponseItemIds).filter((itemId) => exercisableItemIds.includes(itemId));
  });

  useEffect(() => {
    const sceneProgress = getProgress(sceneId);
    setSelectedChoiceByItem(restoreSelectedChoices(itemDialogues, sceneProgress.selectedChoiceByItem));
    setCompletedResponseItemIds(
      safeArray(sceneProgress.completedResponseItemIds).filter((itemId) => exercisableItemIds.includes(itemId))
    );
  }, [sceneId, itemDialogues, exercisableItemIds]);

  function getItemEntry(itemId) {
    return safeObject(itemDialogues[itemId]);
  }

  function getLinesForItem(itemId) {
    const lines = getItemEntry(itemId).lines;
    return safeArray(lines);
  }

  function getResponseExerciseForItem(itemId) {
    return buildExercise(getItemEntry(itemId).responseExercise);
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

  function chooseResponse(itemId, choiceId) {
    if (!itemId || !choiceId) {
      return;
    }

    const exercise = getResponseExerciseForItem(itemId);
    if (!exercise) {
      return;
    }

    setSelectedChoiceByItem((prev) => ({
      ...prev,
      [itemId]: choiceId
    }));

    setCompletedResponseItemIds((prev) => {
      if (prev.includes(itemId)) {
        return prev;
      }
      return [...prev, itemId];
    });

    setSelectedChoice(itemId, choiceId, sceneId);
    markResponseCompleted(itemId, sceneId);
  }

  function getSelectedChoiceForItem(itemId) {
    const exercise = getResponseExerciseForItem(itemId);
    if (!exercise) {
      return null;
    }

    const selectedChoiceId = selectedChoiceByItem[itemId];
    if (!selectedChoiceId) {
      return null;
    }

    return exercise.choices.find((choice) => choice.id === selectedChoiceId) || null;
  }

  function isResponseCompleted(itemId) {
    return completedResponseItemIds.includes(itemId);
  }

  function resetCurrentSceneProgress() {
    resetSceneProgress(sceneId);
    setSelectedChoiceByItem({});
    setCompletedResponseItemIds([]);
  }

  function resetProgress() {
    resetStoredModuleProgress();
    setSelectedChoiceByItem({});
    setCompletedResponseItemIds([]);
  }

  return {
    getLinesForItem,
    getResponseExerciseForItem,
    getItemAudioTarget,
    getLineAudioTarget,
    chooseResponse,
    getSelectedChoiceForItem,
    isResponseCompleted,
    completedResponseItemIds,
    exercisableItemIds,
    resetCurrentSceneProgress,
    resetProgress
  };
}
