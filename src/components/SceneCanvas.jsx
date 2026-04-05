import { getProgress, getRecommendedItemId } from "../features/progress/progressStore";

function SceneCanvas({ scene, selectedItem, onSelectItem, itemStatusById = {} }) {
  const safeScene = scene || {
    title: "Scene Placeholder",
    description: "Scene content is loading.",
    items: [{ id: "placeholder", spanish: "casa", english: "house" }]
  };
  const safeItems = Array.isArray(safeScene.items) && safeScene.items.length
    ? safeScene.items
    : [{ id: "placeholder", spanish: "casa", english: "house" }];

  function getStatusLabel(status) {
    if (status === "completed") {
      return "Completed";
    }
    if (status === "seen") {
      return "Seen";
    }
    return "New";
  }

  const safeSceneId = safeScene.id;
  const sceneItemIds = safeItems.map((item) => item.id);
  const recommendedItemId = getRecommendedItemId(sceneItemIds, safeSceneId, selectedItem?.id);

  const recommendedItem = safeItems.find((item) => item.id === recommendedItemId) || null;
  const sceneProgress = getProgress(safeSceneId);
  const completedItemCount = (sceneProgress.completedResponseItemIds || []).filter((itemId) => sceneItemIds.includes(itemId)).length;
  const completionRatio = sceneItemIds.length ? completedItemCount / sceneItemIds.length : 0;

  const recommendationText = !recommendedItem
    ? "Scene complete. Tap any item to review."
    : completedItemCount === 0
      ? `Start with: ${recommendedItem.spanish}`
      : completionRatio >= 0.8
        ? `Finish with: ${recommendedItem.spanish}`
        : `Continue with: ${recommendedItem.spanish}`;

  return (
    <div className="scene-canvas" role="region" aria-label={safeScene.title}>
      <div className="scene-card">
        <p className="scene-kicker">Scene</p>
        <h2 className="scene-title">{safeScene.title}</h2>
        <p className="scene-description">{safeScene.description}</p>
        <p className="scene-recommendation">{recommendationText}</p>
      </div>

      <div className="scene-items" aria-label="Scene vocabulary items">
        {safeItems.map((item) => {
          const isActive = selectedItem?.id === item.id;
          const status = itemStatusById[item.id] || "default";
          const isRecommended = item.id === recommendedItemId;

          return (
            <button
              key={item.id}
              type="button"
              className={`scene-item-button ${isActive ? "is-active" : ""} ${status === "seen" ? "is-seen" : ""} ${status === "completed" ? "is-completed" : ""} ${isRecommended ? "is-recommended" : ""}`}
              onClick={() => onSelectItem?.(item.id)}
              aria-pressed={isActive}
            >
              <span className="item-spanish">{item.spanish}</span>
              <span className="item-english">{item.english}</span>
              <span className="item-status">{getStatusLabel(status)}</span>
              {isRecommended ? <span className="item-recommended-badge">Recommended</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SceneCanvas;
