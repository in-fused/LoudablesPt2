import familyHouseSceneData from "./family-house.json";
import kitchenBasicSceneData from "./kitchen-basic.json";
import puertoRicoListeningSceneData from "./puerto-rico-listening.json";
import cityTransitSceneData from "./city-transit.json";
import restaurantOrderingSceneData from "./restaurant-ordering.json";
import socialSmallTalkSceneData from "./social-small-talk.json";
import workCommunicationSceneData from "./work-communication.json";
import dailyCoordinationSceneData from "./daily-coordination.json";

import familyHouseDialogueData from "../dialogues/family-house.json";
import kitchenBasicDialogueData from "../dialogues/kitchen-basic.json";
import puertoRicoListeningDialogueData from "../dialogues/puerto-rico-listening.json";
import cityTransitDialogueData from "../dialogues/city-transit.json";
import restaurantOrderingDialogueData from "../dialogues/restaurant-ordering.json";
import socialSmallTalkDialogueData from "../dialogues/social-small-talk.json";
import workCommunicationDialogueData from "../dialogues/work-communication.json";
import dailyCoordinationDialogueData from "../dialogues/daily-coordination.json";

import familyHouseVocabularyData from "../vocabulary/family-house.json";
import kitchenBasicVocabularyData from "../vocabulary/kitchen-basic.json";
import cityTransitVocabularyData from "../vocabulary/city-transit.json";
import restaurantOrderingVocabularyData from "../vocabulary/restaurant-ordering.json";
import socialSmallTalkVocabularyData from "../vocabulary/social-small-talk.json";
import workCommunicationVocabularyData from "../vocabulary/work-communication.json";
import dailyCoordinationVocabularyData from "../vocabulary/daily-coordination.json";

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

function safeObject(value) {
  return value && typeof value === "object" ? value : {};
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
      id: fallbackId || FALLBACK_SCENE.id,
      label: fallbackLabel || FALLBACK_SCENE.title
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

function normalizeDialogue(dialogueData, fallbackSceneId, fallbackTitle) {
  const safeDialogue = safeObject(dialogueData);
  const itemDialogues = safeObject(safeDialogue.itemDialogues);

  return {
    moduleId: safeDialogue.moduleId || null,
    sceneId: safeDialogue.sceneId || fallbackSceneId,
    title: safeDialogue.title || fallbackTitle || "Scene Dialogue",
    itemDialogues
  };
}

function normalizeMetadata({ difficulty, category }) {
  const safeDifficulty = typeof difficulty === "string" && difficulty.trim() ? difficulty.trim() : null;
  const safeCategory = typeof category === "string" && category.trim() ? category.trim() : null;

  if (!safeDifficulty && !safeCategory) {
    return {};
  }

  return {
    ...(safeDifficulty ? { difficulty: safeDifficulty } : {}),
    ...(safeCategory ? { category: safeCategory } : {})
  };
}

const MODULE_DEFINITIONS = [
  {
    id: "family-house",
    label: "Family House",
    sceneData: familyHouseSceneData,
    dialogueData: familyHouseDialogueData,
    vocabularyData: familyHouseVocabularyData,
    difficulty: "beginner",
    category: "home"
  },
  {
    id: "kitchen-basic",
    label: "Kitchen Basics",
    sceneData: kitchenBasicSceneData,
    dialogueData: kitchenBasicDialogueData,
    vocabularyData: kitchenBasicVocabularyData,
    difficulty: "beginner",
    category: "home"
  },
  {
    id: "puerto-rico-listening",
    label: "Module 3 — Puerto Rican Audio Conversations",
    sceneData: puertoRicoListeningSceneData,
    dialogueData: puertoRicoListeningDialogueData,
    vocabularyData: null,
    difficulty: "listening",
    category: "social"
  },
  {
    id: "city-transit",
    label: "Getting Around Town",
    sceneData: cityTransitSceneData,
    dialogueData: cityTransitDialogueData,
    vocabularyData: cityTransitVocabularyData,
    difficulty: "beginner",
    category: "transit"
  },
  {
    id: "restaurant-ordering",
    label: "Restaurant Ordering",
    sceneData: restaurantOrderingSceneData,
    dialogueData: restaurantOrderingDialogueData,
    vocabularyData: restaurantOrderingVocabularyData,
    difficulty: "beginner",
    category: "food"
  },
  {
    id: "social-small-talk",
    label: "Social Small Talk",
    sceneData: socialSmallTalkSceneData,
    dialogueData: socialSmallTalkDialogueData,
    vocabularyData: socialSmallTalkVocabularyData,
    difficulty: "beginner",
    category: "social"
  },
  {
    id: "work-communication",
    label: "Work Communication",
    sceneData: workCommunicationSceneData,
    dialogueData: workCommunicationDialogueData,
    vocabularyData: workCommunicationVocabularyData,
    difficulty: "beginner",
    category: "work"
  },
  {
    id: "daily-coordination",
    label: "Daily Coordination",
    sceneData: dailyCoordinationSceneData,
    dialogueData: dailyCoordinationDialogueData,
    vocabularyData: dailyCoordinationVocabularyData,
    difficulty: "beginner",
    category: "daily-life"
  }
];

function buildSceneRegistryEntry(definition) {
  if (!definition || !definition.id) {
    return null;
  }

  const scene = normalizeScene(definition.sceneData, definition.vocabularyData, definition.id, definition.label);
  const dialogue = normalizeDialogue(definition.dialogueData, scene.id, scene.title);
  const vocabulary = normalizeVocabulary(definition.vocabularyData);
  const metadata = normalizeMetadata({
    difficulty: definition.difficulty ?? definition.sceneData?.difficulty,
    category: definition.category ?? definition.sceneData?.category
  });

  return {
    id: definition.id,
    label: definition.label || scene.title,
    scene,
    dialogue,
    vocabulary,
    ...metadata
  };
}

const SCENE_REGISTRY = MODULE_DEFINITIONS
  .map((definition) => buildSceneRegistryEntry(definition))
  .filter(Boolean);

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
