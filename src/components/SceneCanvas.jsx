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

  return (
    <div className="scene-canvas" role="region" aria-label={safeScene.title}>
      <div className="scene-card">
        <p className="scene-kicker">Scene</p>
        <h2 className="scene-title">{safeScene.title}</h2>
        <p className="scene-description">{safeScene.description}</p>
      </div>

      <div className="scene-items" aria-label="Scene vocabulary items">
        {safeItems.map((item) => {
          const isActive = selectedItem?.id === item.id;
          const status = itemStatusById[item.id] || "default";

          return (
            <button
              key={item.id}
              type="button"
              className={`scene-item-button ${isActive ? "is-active" : ""} ${status === "seen" ? "is-seen" : ""} ${status === "completed" ? "is-completed" : ""}`}
              onClick={() => onSelectItem?.(item.id)}
              aria-pressed={isActive}
            >
              <span className="item-spanish">{item.spanish}</span>
              <span className="item-english">{item.english}</span>
              <span className="item-status">{getStatusLabel(status)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SceneCanvas;
