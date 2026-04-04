import { useEffect, useMemo, useState } from "react";
import familyHouseSceneData from "../../data/scenes/family-house.json";
import kitchenBasicSceneData from "../../data/scenes/kitchen-basic.json";
import grammarHints from "../../data/grammar/hints.json";
import { getActiveSceneId, getProgress, resetSceneProgress, setActiveScene, setSelectedItem } from "../progress/progressStore";

const FALLBACK_SCENE = {
  id: "family-house",
  title: "Family House Arrival",
  description: "Scene placeholder is active.",
  items: [
    {
      id: "casa",
      spanish: "casa",
      english: "house"
    }
  ]
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function resolveScene(sceneData, fallbackId, fallbackLabel) {
  if (sceneData && typeof sceneData === "object") {
    const items = safeArray(sceneData.items);
    return {
      id: sceneData.id || fallbackId || FALLBACK_SCENE.id,
      title: sceneData.title || FALLBACK_SCENE.title,
      description: sceneData.description || FALLBACK_SCENE.description,
      label: sceneData.title || fallbackLabel || FALLBACK_SCENE.title,
      items: items.length ? items : FALLBACK_SCENE.items
    };
  }

  return {
    ...FALLBACK_SCENE,
    id: fallbackId || FALLBACK_SCENE.id,
    label: fallbackLabel || FALLBACK_SCENE.title
  };
}

function resolveSceneRegistry() {
  return [
    {
      id: "family-house",
      label: "Family House",
      scene: resolveScene(familyHouseSceneData, "family-house", "Family House")
    },
    {
      id: "kitchen-basic",
      label: "Kitchen Basics",
      scene: resolveScene(kitchenBasicSceneData, "kitchen-basic", "Kitchen Basics")
    }
  ];
}

function findGrammarHintForItem(itemId) {
  const hints = safeArray(grammarHints);
  if (!itemId) {
    return null;
  }

  return hints.find((hint) => hint && hint.itemId === itemId) || null;
}

export function useScene() {
  const scenes = useMemo(() => resolveSceneRegistry(), []);
  const sceneIdSet = useMemo(() => new Set(scenes.map((entry) => entry.id)), [scenes]);
  const [activeSceneId, setActiveSceneId] = useState(() => {
    const storedSceneId = getActiveSceneId();
    return sceneIdSet.has(storedSceneId) ? storedSceneId : "family-house";
  });

  const activeSceneEntry = useMemo(() => {
    return scenes.find((entry) => entry.id === activeSceneId) || scenes[0];
  }, [scenes, activeSceneId]);

  const scene = activeSceneEntry?.scene || FALLBACK_SCENE;
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
