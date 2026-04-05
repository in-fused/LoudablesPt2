import familyHouseSceneData from "./family-house.json";
import kitchenBasicSceneData from "./kitchen-basic.json";
import familyHouseDialogueData from "../dialogues/family-house.json";
import kitchenBasicDialogueData from "../dialogues/kitchen-basic.json";
import familyHouseVocabularyData from "../vocabulary/family-house.json";
import kitchenBasicVocabularyData from "../vocabulary/kitchen-basic.json";

const DEFAULT_SCENE_ID = "family-house";

const FALLBACK_SCENE = {
  id: DEFAULT_SCENE_ID,
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

function normalizeVocabularyItem(item) {
  if (!item || typeof item !== "object" || !item.id) {
    return null;
  }

  const spanish = item.spanish || item.es;
  const english = item.english || item.en;
  if (!spanish || !english) {
    return null;
  }

  return {
    id: item.id,
    spanish,
    english,
    audioKey: item.audioKey || null
  };
}

function normalizeVocabulary(vocabularyData) {
  const normalizedList = safeArray(vocabularyData?.list)
    .map((entry) => normalizeVocabularyItem(entry))
    .filter(Boolean);

  const byId = normalizedList.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  return {
    list: normalizedList,
    byId
  };
}

function normalizeScene(sceneData, vocabularyData, fallbackId, fallbackLabel) {
  if (!sceneData || typeof sceneData !== "object") {
    return {
      ...FALLBACK_SCENE,
      id: fallbackId || FALLBACK_SCENE.id
    };
  }

  const normalizedVocabulary = normalizeVocabulary(vocabularyData);
  const sceneItemIds = safeArray(sceneData.itemIds);
  const legacySceneItems = safeArray(sceneData.items)
    .map((entry) => normalizeVocabularyItem(entry))
    .filter(Boolean);

  const sceneItemsFromIds = sceneItemIds
    .map((itemId) => normalizedVocabulary.byId[itemId])
    .filter(Boolean);

  const items = sceneItemsFromIds.length
    ? sceneItemsFromIds
    : legacySceneItems.length
      ? legacySceneItems
      : normalizedVocabulary.list;

  return {
    id: sceneData.id || fallbackId || FALLBACK_SCENE.id,
    title: sceneData.title || FALLBACK_SCENE.title,
    description: sceneData.description || FALLBACK_SCENE.description,
    label: fallbackLabel || sceneData.title || FALLBACK_SCENE.title,
    items: items.length ? items : FALLBACK_SCENE.items
  };
}

const SCENE_REGISTRY = [
  {
    id: "family-house",
    label: "Family House",
    scene: normalizeScene(familyHouseSceneData, familyHouseVocabularyData, "family-house", "Family House"),
    dialogue: familyHouseDialogueData,
    vocabulary: normalizeVocabulary(familyHouseVocabularyData)
  },
  {
    id: "kitchen-basic",
    label: "Kitchen Basics",
    scene: normalizeScene(kitchenBasicSceneData, kitchenBasicVocabularyData, "kitchen-basic", "Kitchen Basics"),
    dialogue: kitchenBasicDialogueData,
    vocabulary: normalizeVocabulary(kitchenBasicVocabularyData)
  }
];

const SCENE_REGISTRY_BY_ID = SCENE_REGISTRY.reduce((acc, entry) => {
  if (entry?.id) {
    acc[entry.id] = entry;
  }
  return acc;
}, {});

export function getDefaultSceneId() {
  return DEFAULT_SCENE_ID;
}

export function getSceneRegistry() {
  return SCENE_REGISTRY;
}

export function getSceneEntry(sceneId) {
  return SCENE_REGISTRY_BY_ID[sceneId] || SCENE_REGISTRY_BY_ID[DEFAULT_SCENE_ID] || SCENE_REGISTRY[0];
}

export function getSceneVocabularyById(sceneId) {
  return getSceneEntry(sceneId)?.vocabulary?.byId || {};
}
