import { STORAGE_KEYS } from "../../lib/constants";
import { getSceneEntry } from "../../data/scenes/registry";

const DEFAULT_SCENE_ID = "family-house";
const MAX_ITEM_RATING_HISTORY = 5;
const ALLOWED_RATINGS = ["appropriate", "acceptable", "off_target"];

function createDefaultProgress() {
  return {
    moduleId: "module1",
    selectedItemId: null,
    seenItemIds: [],
    completedResponseItemIds: [],
    selectedChoiceByItem: {},
    conversationStepByItem: {},
    selectedChoiceByItemStep: {},
    responseRatingsByItem: {},
    completionQualityByItem: {},
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

function toRating(value) {
  return typeof value === "string" && ALLOWED_RATINGS.includes(value) ? value : null;
}

function toRatingArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((rating) => toRating(rating))
    .filter(Boolean)
    .slice(-MAX_ITEM_RATING_HISTORY);
}

function toRatingHistoryMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((acc, [itemId, ratings]) => {
    const normalizedRatings = toRatingArray(ratings);
    if (itemId && normalizedRatings.length > 0) {
      acc[itemId] = normalizedRatings;
    }
    return acc;
  }, {});
}

function toCompletionQuality(value) {
  return value === "strong" || value === "weak" ? value : null;
}

function toCompletionQualityMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((acc, [itemId, quality]) => {
    const normalizedQuality = toCompletionQuality(quality);
    if (itemId && normalizedQuality) {
      acc[itemId] = normalizedQuality;
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

function getRatingScore(rating) {
  if (rating === "appropriate") {
    return 2;
  }
  if (rating === "acceptable") {
    return 1;
  }
  if (rating === "off_target") {
    return -1;
  }
  return 0;
}

function deriveCompletionQuality(ratings) {
  const recentRatings = toRatingArray(ratings).slice(-3);
  if (!recentRatings.length) {
    return "weak";
  }

  const offTargetCount = recentRatings.filter((rating) => rating === "off_target").length;
  const appropriateCount = recentRatings.filter((rating) => rating === "appropriate").length;
  const averageScore = recentRatings.reduce((sum, rating) => sum + getRatingScore(rating), 0) / recentRatings.length;
  const isStrong = offTargetCount === 0 && averageScore >= 1.4 && appropriateCount >= Math.max(1, Math.ceil(recentRatings.length / 2));
  return isStrong ? "strong" : "weak";
}

function normalizeProgress(value) {
  const selectedChoiceByItem = toChoiceMap(value?.selectedChoiceByItem);
  const selectedChoiceByItemStep = toChoiceMapByStep(value?.selectedChoiceByItemStep);
  const conversationStepByItem = toStepIndexMap(value?.conversationStepByItem);
  const responseRatingsByItem = toRatingHistoryMap(value?.responseRatingsByItem);
  const completionQualityByItem = toCompletionQualityMap(value?.completionQualityByItem);

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
    responseRatingsByItem,
    completionQualityByItem,
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

export function recordResponseRating(itemId, rating, sceneId = DEFAULT_SCENE_ID) {
  const normalizedItemId = toItemId(itemId);
  const normalizedRating = toRating(rating);
  if (!normalizedItemId || !normalizedRating) {
    return getProgress(sceneId);
  }

  const current = getProgress(sceneId);
  const ratingHistory = toRatingArray([
    ...toRatingArray(current.responseRatingsByItem[normalizedItemId]),
    normalizedRating
  ]);

  return saveProgress({
    responseRatingsByItem: {
      ...current.responseRatingsByItem,
      [normalizedItemId]: ratingHistory
    },
    completionQualityByItem: {
      ...current.completionQualityByItem,
      [normalizedItemId]: deriveCompletionQuality(ratingHistory)
    }
  }, sceneId);
}

export function markResponseCompleted(itemId, sceneId = DEFAULT_SCENE_ID) {
  const normalizedItemId = toItemId(itemId);
  if (!normalizedItemId) {
    return getProgress(sceneId);
  }

  const current = getProgress(sceneId);
  const currentRatings = toRatingArray(current.responseRatingsByItem[normalizedItemId]);
  const completionQuality = deriveCompletionQuality(currentRatings);
  const hasExistingCompletion = current.completedResponseItemIds.includes(normalizedItemId);
  const existingQuality = toCompletionQuality(current.completionQualityByItem[normalizedItemId]);

  if (hasExistingCompletion && existingQuality === completionQuality) {
    return current;
  }

  return saveProgress({
    completedResponseItemIds: hasExistingCompletion
      ? current.completedResponseItemIds
      : [...current.completedResponseItemIds, normalizedItemId],
    completionQualityByItem: {
      ...current.completionQualityByItem,
      [normalizedItemId]: completionQuality
    },
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

function getSceneDifficultyProfile(sceneId) {
  const sceneEntry = getSceneEntry(sceneId);
  const rawDifficulty = typeof sceneEntry?.difficulty === "string" ? sceneEntry.difficulty.trim().toLowerCase() : "";
  const isListeningFocused = rawDifficulty.includes("listening") || String(sceneId || "").toLowerCase().includes("listening");
  return {
    isListeningFocused
  };
}

function getScenePerformanceTrend(progress) {
  const ratingSamples = Object.values(progress.responseRatingsByItem || {})
    .flatMap((ratings) => toRatingArray(ratings).slice(-2))
    .slice(-10);

  if (ratingSamples.length < 3) {
    return "steady";
  }

  const averageScore = ratingSamples.reduce((sum, rating) => sum + getRatingScore(rating), 0) / ratingSamples.length;
  const recentWindow = ratingSamples.slice(-3);
  const recentOffTargetCount = recentWindow.filter((rating) => rating === "off_target").length;
  if (recentOffTargetCount >= 2 || averageScore < 0.9) {
    return "struggling";
  }

  if (recentOffTargetCount === 0 && averageScore >= 1.45) {
    return "strong";
  }

  return "steady";
}

function getItemPerformanceSignals(itemId, progress, completedItemIdSet) {
  const ratings = toRatingArray(progress.responseRatingsByItem[itemId]);
  const recentRatings = ratings.slice(-3);
  const completionQuality = toCompletionQuality(progress.completionQualityByItem[itemId]) || deriveCompletionQuality(ratings);
  const isCompleted = completedItemIdSet.has(itemId);
  const recentOffTargetCount = recentRatings.filter((rating) => rating === "off_target").length;
  const recentAverage = recentRatings.length
    ? recentRatings.reduce((sum, rating) => sum + getRatingScore(rating), 0) / recentRatings.length
    : 0;
  const isWeak = completionQuality === "weak" || recentOffTargetCount > 0 || (recentRatings.length > 0 && recentAverage < 1);
  const isMastered = isCompleted && completionQuality === "strong" && ratings.length >= 2 && ratings.slice(-2).every((rating) => rating !== "off_target");

  return {
    isWeak,
    isMastered
  };
}

function getProgressionRank(itemId, orderedSceneItemIds, lastCompletedItemId) {
  const itemIndex = orderedSceneItemIds.indexOf(itemId);
  if (itemIndex < 0) {
    return orderedSceneItemIds.length;
  }

  const lastCompletedIndex = orderedSceneItemIds.indexOf(lastCompletedItemId);
  if (lastCompletedIndex < 0) {
    return itemIndex;
  }

  if (itemIndex > lastCompletedIndex) {
    return itemIndex - lastCompletedIndex;
  }

  return orderedSceneItemIds.length + itemIndex - lastCompletedIndex;
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
  const sceneTrend = getScenePerformanceTrend(progress);
  const { isListeningFocused } = getSceneDifficultyProfile(sceneId);

  const itemCandidateScores = orderedSceneItemIds.map((itemId) => {
    const isCompleted = completedItemIdSet.has(itemId);
    const hasStepProgress = Number(progress.conversationStepByItem[itemId]) > 0;
    const hasChoiceProgress = Object.keys(toChoiceMap(progress.selectedChoiceByItemStep[itemId])).length > 0;
    const hasProgress = hasStepProgress || hasChoiceProgress;
    const isUnseen = !seenItemIdSet.has(itemId) && !hasProgress && !isCompleted;
    const signals = getItemPerformanceSignals(itemId, progress, completedItemIdSet);
    const progressionRank = getProgressionRank(itemId, orderedSceneItemIds, progress.lastCompletedItemId);
    const isRecentRecommendation = recentRecommendations.includes(itemId);
    const isSelectedItem = selectedItemId && itemId === selectedItemId;

    let score = 0;

    if (!isCompleted) {
      score -= 60;
    } else {
      score += 26;
    }

    if (signals.isWeak) {
      score -= 26;
    }

    if (hasProgress && !isCompleted) {
      score -= 12;
    }

    if (isUnseen && !isCompleted) {
      score -= 8;
    }

    if (signals.isMastered) {
      score += 24;
    }

    if (sceneTrend === "strong") {
      if (!isCompleted) {
        score -= 6;
      }
      if (isListeningFocused && isUnseen) {
        score -= 8;
      }
      if (signals.isWeak && isCompleted) {
        score += 10;
      }
    } else if (sceneTrend === "struggling") {
      if (signals.isWeak) {
        score -= 14;
      }
      if (hasProgress && !isCompleted) {
        score -= 10;
      }
      if (isUnseen) {
        score += isListeningFocused ? 12 : 6;
      }
    } else {
      if (signals.isWeak) {
        score -= 4;
      }
    }

    score += progressionRank;

    if (isSelectedItem) {
      score += 6;
    }

    if (isRecentRecommendation) {
      score += 8;
    }

    return {
      itemId,
      isCompleted,
      isWeak: signals.isWeak,
      isMastered: signals.isMastered,
      score
    };
  });

  const incompleteWeakCandidates = itemCandidateScores.filter((entry) => !entry.isCompleted && entry.isWeak);
  const incompleteCandidates = itemCandidateScores.filter((entry) => !entry.isCompleted);
  const weakReviewCandidates = itemCandidateScores.filter((entry) => entry.isCompleted && entry.isWeak && !entry.isMastered);
  const fallbackCandidates = itemCandidateScores.filter((entry) => !entry.isMastered);

  const baseCandidates = incompleteWeakCandidates.length
    ? incompleteWeakCandidates
    : incompleteCandidates.length
      ? incompleteCandidates
      : weakReviewCandidates.length
        ? weakReviewCandidates
        : fallbackCandidates;

  if (!baseCandidates.length || !itemCandidateScores.length) {
    return null;
  }

  const candidates = baseCandidates.length > 1 && selectedItemId
    ? baseCandidates.filter((entry) => entry.itemId !== selectedItemId)
    : baseCandidates;

  const effectiveCandidates = candidates.length ? candidates : baseCandidates;

  const sortedCandidates = [...effectiveCandidates].sort((a, b) => {
    const scoreDelta = a.score - b.score;
    if (scoreDelta !== 0) {
      return scoreDelta;
    }
    return orderedSceneItemIds.indexOf(a.itemId) - orderedSceneItemIds.indexOf(b.itemId);
  });

  const nonRecentCandidates = sortedCandidates.filter((entry) => !recentRecommendations.includes(entry.itemId));
  return (nonRecentCandidates[0]?.itemId || sortedCandidates[0]?.itemId || null);
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
