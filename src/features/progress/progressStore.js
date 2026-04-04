import { STORAGE_KEYS } from "../../lib/constants";

const DEFAULT_SCENE_ID = "family-house";

const DEFAULT_PROGRESS = {
  moduleId: "module1",
  selectedItemId: null,
  seenItemIds: [],
  completedResponseItemIds: [],
  selectedChoiceByItem: {}
};

const DEFAULT_STORE = {
  moduleId: "module1",
  activeSceneId: DEFAULT_SCENE_ID,
  progressByScene: {
    [DEFAULT_SCENE_ID]: DEFAULT_PROGRESS
  }
};

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
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

function normalizeProgress(value) {
  return {
    moduleId: value?.moduleId || DEFAULT_PROGRESS.moduleId,
    selectedItemId: value?.selectedItemId || DEFAULT_PROGRESS.selectedItemId,
    seenItemIds: toUniqueArray(value?.seenItemIds),
    completedResponseItemIds: toUniqueArray(value?.completedResponseItemIds),
    selectedChoiceByItem: toChoiceMap(value?.selectedChoiceByItem)
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
    ("selectedItemId" in value || "seenItemIds" in value || "completedResponseItemIds" in value || "selectedChoiceByItem" in value);

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
    [DEFAULT_SCENE_ID]: normalizeProgress(progressByScene[DEFAULT_SCENE_ID]),
    ...progressByScene
  };

  const activeSceneId = value?.activeSceneId && mergedProgressByScene[value.activeSceneId]
    ? value.activeSceneId
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
  if (!sceneId) {
    return getStore();
  }
  return saveStore({ activeSceneId: sceneId });
}

export function getProgress(sceneId = DEFAULT_SCENE_ID) {
  const store = getStore();
  const sceneProgress = store.progressByScene[sceneId];
  return normalizeProgress(sceneProgress || DEFAULT_PROGRESS);
}

export function saveProgress(partialProgress, sceneId = DEFAULT_SCENE_ID) {
  const store = getStore();
  const existing = getProgress(sceneId);
  const next = normalizeProgress({ ...existing, ...partialProgress });
  saveStore({
    progressByScene: {
      ...store.progressByScene,
      [sceneId]: next
    }
  });
  return next;
}

export function setSelectedItem(itemId, sceneId = DEFAULT_SCENE_ID) {
  const current = getProgress(sceneId);
  const seenItemIds = current.seenItemIds.includes(itemId)
    ? current.seenItemIds
    : [...current.seenItemIds, itemId];

  return saveProgress({
    selectedItemId: itemId,
    seenItemIds
  }, sceneId);
}

export function markResponseCompleted(itemId, sceneId = DEFAULT_SCENE_ID) {
  const current = getProgress(sceneId);
  if (current.completedResponseItemIds.includes(itemId)) {
    return current;
  }

  return saveProgress({
    completedResponseItemIds: [...current.completedResponseItemIds, itemId]
  }, sceneId);
}

export function setSelectedChoice(itemId, choiceId, sceneId = DEFAULT_SCENE_ID) {
  const current = getProgress(sceneId);
  return saveProgress({
    selectedChoiceByItem: {
      ...current.selectedChoiceByItem,
      [itemId]: choiceId
    }
  }, sceneId);
}

export function resetSceneProgress(sceneId = DEFAULT_SCENE_ID) {
  const store = getStore();
  const nextSceneId = sceneId || DEFAULT_SCENE_ID;

  const nextStore = saveStore({
    progressByScene: {
      ...store.progressByScene,
      [nextSceneId]: DEFAULT_PROGRESS
    }
  });

  return normalizeProgress(nextStore.progressByScene[nextSceneId]);
}

export function resetModuleProgress() {
  write(STORAGE_KEYS.PROGRESS, DEFAULT_STORE);
  return DEFAULT_STORE;
}
