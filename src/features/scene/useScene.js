import { useEffect, useMemo, useState } from "react";
import grammarHints from "../../data/grammar/hints.json";
import { getDefaultSceneId, getSceneEntry, getSceneRegistry } from "../../data/scenes/registry";
import { getActiveSceneId, getProgress, resetSceneProgress, setActiveScene, setSelectedItem } from "../progress/progressStore";

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
  }, [scenes, activeSceneId]);

  const scene = activeSceneEntry?.scene || getSceneEntry(getDefaultSceneId())?.scene;
  const sceneItemIds = useMemo(() => scene.items.map((item) => item.id), [scene]);

  function resolveSceneProgress(nextSceneId, nextSceneItemIds) {
    const progress = getProgress(nextSceneId);
    const progressSelectedItemId = nextSceneItemIds.includes(progress.selectedItemId)
      ? progress.selectedItemId
      : nextSceneItemIds[0] || null;

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
    return scene.items.find((item) => item.id === selectedItemId) || scene.items[0] || null;
  }, [scene, selectedItemId]);

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

  function selectItem(itemId) {
    if (!sceneItemIds.includes(itemId)) {
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

  return {
    sceneId: scene.id,
    activeSceneId,
    scenes,
    scene,
    selectedItem,
    selectItem,
    switchScene,
    resetCurrentSceneProgress,
    grammarHint,
    seenItemIds
  };
}
