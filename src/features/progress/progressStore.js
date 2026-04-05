import { STORAGE_KEYS } from "../../lib/constants";

const DEFAULT_SCENE_ID = "family-house";

function createDefaultProgress() {
  return {
    moduleId: "module1",
    selectedItemId: null,
    seenItemIds: [],
    completedResponseItemIds: [],
    selectedChoiceByItem: {},
    conversationStepByItem: {},
    selectedChoiceByItemStep: {},
    recommendationHistoryItemIds: [],
    lastRecommendedItemId: null,
    lastCompletedItemId: null
  };
}

function createDefaultStore(activeSceneId = DEFAULT_SCENE_ID, sceneIds = [DEFAULT_SCENE_ID]) {
  const normalizedSceneIds = toItemIdArray(sceneIds);
  const storeSceneIds = normalizedSceneIds.length ? normalizedSceneIds : [DEFAULT_SCENE_ID];
  const progressByScene = storeSceneIds.reduce((acc, sceneId) => {
    acc[sceneId] = createDefaultProgress();
    return acc;
  }, {});

  if (!progressByScene[DEFAULT_SCENE_ID]) {
    progressByScene[DEFAULT_SCENE_ID] = createDefaultProgress();
  }

  const normalizedActiveSceneId = progressByScene[activeSceneId] ? activeSceneId : DEFAULT_SCENE_ID;

  return {
    moduleId: "module1",
    activeSceneId: normalizedActiveSceneId,
    progressByScene
  };
}

const DEFAULT_STORE = createDefaultStore();

function read(key, fallback) {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return fallback;
    }
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage failures are non-blocking.
  }
}

function toUniqueArray(value) {
  return Array.from(new Set(Array.isArray(value) ? value.filter(Boolean) : []));
}

function toChoiceMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((acc, [itemId, choiceId]) => {
    if (itemId && typeof choiceId === "string" && choiceId) {
      acc[itemId] = choiceId;
    }
    return acc;
  }, {});
}

function toStepIndexMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((acc, [itemId, stepIndex]) => {
    const normalizedStepIndex = Number(stepIndex);
    if (itemId && Number.isInteger(normalizedStepIndex) && normalizedStepIndex >= 0) {
      acc[itemId] = normalizedStepIndex;
    }
    return acc;
  }, {});
}

function toChoiceMapByStep(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((acc, [itemId, choiceMap]) => {
    const normalizedChoiceMap = toChoiceMap(choiceMap);
    if (itemId && Object.keys(normalizedChoiceMap).length > 0) {
      acc[itemId] = normalizedChoiceMap;
    }
    return acc;
  }, {});
}

function toItemIdArray(value) {
  return toUniqueArray(value).filter((id) => typeof id === "string" && id);
}

function toItemId(value) {
  return typeof value === "string" && value ? value : null;
}

function normalizeProgress(value) {
  const selectedChoiceByItem = toChoiceMap(value?.selectedChoiceByItem);
  const selectedChoiceByItemStep = toChoiceMapByStep(value?.selectedChoiceByItemStep);
  const conversationStepByItem = toStepIndexMap(value?.conversationStepByItem);

  Object.entries(selectedChoiceByItem).forEach(([itemId, choiceId]) => {
    if (!selectedChoiceByItemStep[itemId]) {
      selectedChoiceByItemStep[itemId] = {};
    }
    if (!selectedChoiceByItemStep[itemId]["0"]) {
      selectedChoiceByItemStep[itemId]["0"] = choiceId;
    }
  });

  return {
    moduleId: value?.moduleId || createDefaultProgress().moduleId,
    selectedItemId: toItemId(value?.selectedItemId),
    seenItemIds: toUniqueArray(value?.seenItemIds),
    completedResponseItemIds: toUniqueArray(value?.completedResponseItemIds),
    selectedChoiceByItem,
    conversationStepByItem,
    selectedChoiceByItemStep,
    recommendationHistoryItemIds: toItemIdArray(value?.recommendationHistoryItemIds).slice(-6),
    lastRecommendedItemId: toItemId(value?.lastRecommendedItemId),
    lastCompletedItemId: toItemId(value?.lastCompletedItemId)
  };
}

function normalizeProgressByScene(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((acc, [sceneId, sceneProgress]) => {
    if (!sceneId) {
      return acc;
    }
    acc[sceneId] = normalizeProgress(sceneProgress);
    return acc;
  }, {});
}

function normalizeStore(value) {
  const isLegacyProgressShape =
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !value.progressByScene &&
    (
      "selectedItemId" in value ||
      "seenItemIds" in value ||
      "completedResponseItemIds" in value ||
      "selectedChoiceByItem" in value ||
      "conversationStepByItem" in value ||
      "selectedChoiceByItemStep" in value
    );

  if (isLegacyProgressShape) {
    return {
      moduleId: value?.moduleId || DEFAULT_STORE.moduleId,
      activeSceneId: DEFAULT_SCENE_ID,
      progressByScene: {
        [DEFAULT_SCENE_ID]: normalizeProgress(value)
      }
    };
  }

  const progressByScene = normalizeProgressByScene(value?.progressByScene);
  const mergedProgressByScene = {
    [DEFAULT_SCENE_ID]: normalizeProgress(progressByScene[DEFAULT_SCENE_ID] || createDefaultProgress()),
    ...progressByScene
  };

  const activeSceneId = toItemId(value?.activeSceneId) && mergedProgressByScene[value.activeSceneId]
    ? toItemId(value.activeSceneId)
    : DEFAULT_SCENE_ID;

  return {
    moduleId: value?.moduleId || DEFAULT_STORE.moduleId,
    activeSceneId,
    progressByScene: mergedProgressByScene
  };
}

function getStore() {
  const stored = read(STORAGE_KEYS.PROGRESS, DEFAULT_STORE);
  const normalized = normalizeStore(stored);
  write(STORAGE_KEYS.PROGRESS, normalized);
  return normalized;
}

function saveStore(partialStore) {
  const existing = getStore();
  const next = normalizeStore({ ...existing, ...partialStore });
  write(STORAGE_KEYS.PROGRESS, next);
  return next;
}

export function getActiveSceneId() {
  return getStore().activeSceneId;
}

export function setActiveScene(sceneId) {
  const normalizedSceneId = toItemId(sceneId);
  if (!normalizedSceneId) {
    return getStore();
  }
  return saveStore({ activeSceneId: normalizedSceneId });
}

export function getProgress(sceneId = DEFAULT_SCENE_ID) {
  const normalizedSceneId = toItemId(sceneId) || DEFAULT_SCENE_ID;
  const store = getStore();
  const sceneProgress = store.progressByScene[normalizedSceneId];
  return normalizeProgress(sceneProgress || createDefaultProgress());
}

export function saveProgress(partialProgress, sceneId = DEFAULT_SCENE_ID) {
  const normalizedSceneId = toItemId(sceneId) || DEFAULT_SCENE_ID;
  const store = getStore();
  const existing = getProgress(normalizedSceneId);
  const next = normalizeProgress({ ...existing, ...partialProgress });
  saveStore({
    progressByScene: {
      ...store.progressByScene,
      [normalizedSceneId]: next
    }
  });
  return next;
}

export function setSelectedItem(itemId, sceneId = DEFAULT_SCENE_ID) {
  const normalizedItemId = toItemId(itemId);
  if (!normalizedItemId) {
    return getProgress(sceneId);
  }

  const current = getProgress(sceneId);
  const seenItemIds = current.seenItemIds.includes(normalizedItemId)
    ? current.seenItemIds
    : [...current.seenItemIds, normalizedItemId];

  return saveProgress({
    selectedItemId: normalizedItemId,
    seenItemIds
  }, sceneId);
}

export function markResponseCompleted(itemId, sceneId = DEFAULT_SCENE_ID) {
  const normalizedItemId = toItemId(itemId);
  if (!normalizedItemId) {
    return getProgress(sceneId);
  }

  const current = getProgress(sceneId);
  if (current.completedResponseItemIds.includes(normalizedItemId)) {
    return current;
  }

  return saveProgress({
    completedResponseItemIds: [...current.completedResponseItemIds, normalizedItemId],
    lastCompletedItemId: normalizedItemId
  }, sceneId);
}

export function setSelectedChoice(itemId, choiceId, sceneId = DEFAULT_SCENE_ID) {
  const normalizedItemId = toItemId(itemId);
  const normalizedChoiceId = toItemId(choiceId);
  if (!normalizedItemId || !normalizedChoiceId) {
    return getProgress(sceneId);
  }

  const current = getProgress(sceneId);
  return saveProgress({
    selectedChoiceByItem: {
      ...current.selectedChoiceByItem,
      [normalizedItemId]: normalizedChoiceId
    }
  }, sceneId);
}

export function setSelectedChoiceForStep(itemId, stepIndex, choiceId, sceneId = DEFAULT_SCENE_ID) {
  const current = getProgress(sceneId);
  const normalizedItemId = toItemId(itemId);
  const normalizedStepIndex = Number(stepIndex);
  const normalizedChoiceId = toItemId(choiceId);
  if (!normalizedItemId || !Number.isInteger(normalizedStepIndex) || normalizedStepIndex < 0 || !normalizedChoiceId) {
    return current;
  }

  return saveProgress({
    selectedChoiceByItemStep: {
      ...current.selectedChoiceByItemStep,
      [normalizedItemId]: {
        ...(current.selectedChoiceByItemStep[normalizedItemId] || {}),
        [String(normalizedStepIndex)]: normalizedChoiceId
      }
    }
  }, sceneId);
}

export function setConversationStep(itemId, stepIndex, sceneId = DEFAULT_SCENE_ID) {
  const current = getProgress(sceneId);
  const normalizedItemId = toItemId(itemId);
  const normalizedStepIndex = Number(stepIndex);
  if (!normalizedItemId || !Number.isInteger(normalizedStepIndex) || normalizedStepIndex < 0) {
    return current;
  }

  return saveProgress({
    conversationStepByItem: {
      ...current.conversationStepByItem,
      [normalizedItemId]: normalizedStepIndex
    }
  }, sceneId);
}

function getItemProgressScore(itemId, progress, seenItemIdSet) {
  const itemChoiceMapByStep = progress.selectedChoiceByItemStep[itemId];
  const choiceCount = itemChoiceMapByStep ? Object.keys(itemChoiceMapByStep).length : 0;
  const stepIndex = Number(progress.conversationStepByItem[itemId]) || 0;
  const seenBonus = seenItemIdSet.has(itemId) ? 1 : 0;
  return choiceCount * 2 + stepIndex + seenBonus;
}

export function getRecommendedItemId(sceneItemIds, sceneId = DEFAULT_SCENE_ID, selectedItemId = null) {
  const orderedSceneItemIds = toItemIdArray(sceneItemIds);
  if (!orderedSceneItemIds.length) {
    return null;
  }

  const progress = getProgress(sceneId);
  const seenItemIdSet = new Set(progress.seenItemIds.filter((id) => orderedSceneItemIds.includes(id)));
  const completedItemIdSet = new Set(progress.completedResponseItemIds.filter((id) => orderedSceneItemIds.includes(id)));
  const recentRecommendations = toItemIdArray(progress.recommendationHistoryItemIds).slice(-2);

  const unseenItems = orderedSceneItemIds.filter((itemId) => !seenItemIdSet.has(itemId) && !completedItemIdSet.has(itemId));
  const partialItems = orderedSceneItemIds.filter((itemId) => {
    if (completedItemIdSet.has(itemId)) {
      return false;
    }
    const hasStepProgress = Number(progress.conversationStepByItem[itemId]) > 0;
    const hasChoiceProgress = Object.keys(toChoiceMap(progress.selectedChoiceByItemStep[itemId])).length > 0;
    return hasStepProgress || hasChoiceProgress;
  });
  const remainingItems = orderedSceneItemIds.filter((itemId) => !completedItemIdSet.has(itemId));

  const baseCandidates = unseenItems.length
    ? unseenItems
    : partialItems.length
      ? partialItems
      : remainingItems;

  if (!baseCandidates.length) {
    return null;
  }

  const candidates = baseCandidates.length > 1 && selectedItemId
    ? baseCandidates.filter((itemId) => itemId !== selectedItemId)
    : baseCandidates;

  const effectiveCandidates = candidates.length ? candidates : baseCandidates;

  const sortedCandidates = [...effectiveCandidates].sort((a, b) => {
    const scoreDelta = getItemProgressScore(a, progress, seenItemIdSet) - getItemProgressScore(b, progress, seenItemIdSet);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }
    return orderedSceneItemIds.indexOf(a) - orderedSceneItemIds.indexOf(b);
  });

  const nonRecentCandidates = sortedCandidates.filter((itemId) => !recentRecommendations.includes(itemId));
  return (nonRecentCandidates[0] || sortedCandidates[0] || null);
}

export function setRecommendedItem(itemId, sceneId = DEFAULT_SCENE_ID) {
  if (!itemId) {
    return getProgress(sceneId);
  }

  const current = getProgress(sceneId);
  if (current.lastRecommendedItemId === itemId) {
    return current;
  }

  const nextHistory = [...toItemIdArray(current.recommendationHistoryItemIds).filter((id) => id !== itemId), itemId].slice(-6);
  return saveProgress({
    recommendationHistoryItemIds: nextHistory,
    lastRecommendedItemId: itemId
  }, sceneId);
}

export function resetSceneProgress(sceneId = DEFAULT_SCENE_ID) {
  const store = getStore();
  const nextSceneId = toItemId(sceneId) || DEFAULT_SCENE_ID;

  const nextStore = saveStore({
    progressByScene: {
      ...store.progressByScene,
      [nextSceneId]: createDefaultProgress()
    }
  });

  return normalizeProgress(nextStore.progressByScene[nextSceneId]);
}

export function resetModuleProgress(preferredActiveSceneId = null) {
  const currentStore = getStore();
  const sceneIds = Object.keys(currentStore.progressByScene || {});
  const normalizedPreferredActiveSceneId = toItemId(preferredActiveSceneId);
  const nextActiveSceneId = normalizedPreferredActiveSceneId || currentStore.activeSceneId || DEFAULT_SCENE_ID;
  const nextStore = createDefaultStore(nextActiveSceneId, sceneIds.length ? sceneIds : [DEFAULT_SCENE_ID]);
  write(STORAGE_KEYS.PROGRESS, nextStore);
  return nextStore;
}
