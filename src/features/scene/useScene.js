import { useEffect, useMemo, useState } from "react";
import grammarHints from "../../data/grammar/hints.json";
import { getDefaultSceneId, getSceneEntry, getSceneRegistry } from "../../data/scenes/registry";
import {
  getActiveSceneId,
  getProgress,
  getRecommendedItemId,
  resetModuleProgress,
  resetSceneProgress,
  setActiveScene,
  setRecommendedItem,
  setSelectedItem
} from "../progress/progressStore";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function findGrammarHintForItem(itemId) {
  const hints = safeArray(grammarHints);
  if (!itemId) {
    return null;
  }

  return hints.find((hint) => hint && hint.itemId === itemId) || null;
}

export function useScene() {
  const scenes = useMemo(() => getSceneRegistry(), []);
  const sceneIdSet = useMemo(() => new Set(scenes.map((entry) => entry.id)), [scenes]);
  const [activeSceneId, setActiveSceneId] = useState(() => {
    const storedSceneId = getActiveSceneId();
    return sceneIdSet.has(storedSceneId) ? storedSceneId : getDefaultSceneId();
  });

  const activeSceneEntry = useMemo(() => {
    return getSceneEntry(activeSceneId);
  }, [activeSceneId]);

  const scene = activeSceneEntry?.scene || getSceneEntry(getDefaultSceneId())?.scene;
  const sceneItems = useMemo(() => safeArray(scene?.items).filter((item) => item?.id), [scene]);
  const sceneItemIds = useMemo(() => sceneItems.map((item) => item.id), [sceneItems]);

  function resolveSceneProgress(nextSceneId, nextSceneItemIds) {
    const progress = getProgress(nextSceneId);
    const recommendedItemId = getRecommendedItemId(nextSceneItemIds, nextSceneId, progress.selectedItemId);
    const progressSelectedItemId = nextSceneItemIds.includes(progress.selectedItemId)
      ? progress.selectedItemId
      : (recommendedItemId || nextSceneItemIds[0] || null);

    const seenFromProgress = safeArray(progress.seenItemIds).filter((id) => nextSceneItemIds.includes(id));
    const nextSeenItemIds = progressSelectedItemId && !seenFromProgress.includes(progressSelectedItemId)
      ? [...seenFromProgress, progressSelectedItemId]
      : seenFromProgress;

    return {
      selectedItemId: progressSelectedItemId,
      seenItemIds: nextSeenItemIds
    };
  }

  const initialSceneProgress = resolveSceneProgress(activeSceneId, sceneItemIds);
  const [selectedItemId, setSelectedItemId] = useState(initialSceneProgress.selectedItemId);
  const [seenItemIds, setSeenItemIds] = useState(initialSceneProgress.seenItemIds);

  const selectedItem = useMemo(() => {
    return sceneItems.find((item) => item.id === selectedItemId) || sceneItems[0] || null;
  }, [sceneItems, selectedItemId]);

  useEffect(() => {
    const nextSceneProgress = resolveSceneProgress(activeSceneId, sceneItemIds);
    setSelectedItemId(nextSceneProgress.selectedItemId);
    setSeenItemIds(nextSceneProgress.seenItemIds);
  }, [activeSceneId, sceneItemIds]);

  useEffect(() => {
    if (!selectedItem?.id) {
      return;
    }

    setSelectedItem(selectedItem.id, activeSceneId);
    setSeenItemIds((prev) => {
      if (prev.includes(selectedItem.id)) {
        return prev;
      }
      return [...prev, selectedItem.id];
    });
  }, [selectedItem?.id, activeSceneId]);

  const grammarHint = useMemo(() => {
    return findGrammarHintForItem(selectedItem?.id);
  }, [selectedItem?.id]);

  const recommendedItemId = getRecommendedItemId(sceneItemIds, activeSceneId, selectedItemId);
  const sceneProgress = getProgress(activeSceneId);
  const completedItemCount = safeArray(sceneProgress.completedResponseItemIds).filter((id) => sceneItemIds.includes(id)).length;
  const completionPercent = sceneItemIds.length ? Math.round((completedItemCount / sceneItemIds.length) * 100) : 0;

  useEffect(() => {
    if (!recommendedItemId) {
      return;
    }
    setRecommendedItem(recommendedItemId, activeSceneId);
  }, [recommendedItemId, activeSceneId]);

  function selectItem(itemId) {
    if (!itemId || !sceneItemIds.includes(itemId)) {
      return;
    }

    setSelectedItemId(itemId);
    setSeenItemIds((prev) => {
      if (prev.includes(itemId)) {
        return prev;
      }
      return [...prev, itemId];
    });
    setSelectedItem(itemId, activeSceneId);
  }

  function switchScene(nextSceneId) {
    if (!sceneIdSet.has(nextSceneId) || nextSceneId === activeSceneId) {
      return;
    }

    setActiveScene(nextSceneId);
    setActiveSceneId(nextSceneId);
  }

  function resetCurrentSceneProgress() {
    resetSceneProgress(activeSceneId);
    const nextSceneProgress = resolveSceneProgress(activeSceneId, sceneItemIds);
    setSelectedItemId(nextSceneProgress.selectedItemId);
    setSeenItemIds(nextSceneProgress.seenItemIds);
  }

  function resetAllProgress() {
    resetModuleProgress(activeSceneId);
    const nextSceneProgress = resolveSceneProgress(activeSceneId, sceneItemIds);
    setSelectedItemId(nextSceneProgress.selectedItemId);
    setSeenItemIds(nextSceneProgress.seenItemIds);
  }

  return {
    sceneId: scene?.id || getDefaultSceneId(),
    activeSceneId,
    scenes,
    scene,
    selectedItem,
    selectItem,
    switchScene,
    resetCurrentSceneProgress,
    resetAllProgress,
    grammarHint,
    seenItemIds,
    recommendedItemId,
    completedItemCount,
    completionPercent
  };
}
