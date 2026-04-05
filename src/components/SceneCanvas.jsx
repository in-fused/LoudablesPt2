import { getProgress, getRecommendedItemId } from "../features/progress/progressStore";

function SceneCanvas({ scene, selectedItem, onSelectItem, itemStatusById = {} }) {
  const safeScene = scene || {
    id: "scene-fallback",
    title: "Scene",
    description: "Scene content is currently unavailable.",
    items: []
  };
  const safeItems = Array.isArray(safeScene.items)
    ? safeScene.items.filter((item) => item && item.id)
    : [];

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
  const lastCompletedItemId = sceneProgress.lastCompletedItemId;

  const recommendationText = !recommendedItem
    ? sceneItemIds.length
      ? "Scene complete. Tap any item to review."
      : "No vocabulary items available in this scene yet."
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
        {safeItems.length ? safeItems.map((item) => {
          const isActive = selectedItem?.id === item.id;
          const status = itemStatusById[item.id] || "default";
          const isRecommended = item.id === recommendedItemId;
          const isJustCompleted = status === "completed" && item.id === lastCompletedItemId;

          return (
            <button
              key={item.id}
              type="button"
              className={`scene-item-button ${isActive ? "is-active" : ""} ${status === "seen" ? "is-seen" : ""} ${status === "completed" ? "is-completed" : ""} ${isRecommended ? "is-recommended" : ""} ${isJustCompleted ? "is-just-completed" : ""}`}
              onClick={() => onSelectItem?.(item.id)}
              aria-pressed={isActive}
            >
              <span className="item-spanish">{item.spanish || item.id}</span>
              <span className="item-english">{item.english || "Vocabulary item"}</span>
              <span className="item-status">{getStatusLabel(status)}</span>
              {isRecommended ? <span className="item-recommended-badge">Recommended</span> : null}
            </button>
          );
        }) : <p className="response-fallback">No vocabulary items are available for this scene yet.</p>}
      </div>
    </div>
  );
}

export default SceneCanvas;
