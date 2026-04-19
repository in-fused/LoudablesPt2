import { useEffect, useRef, useState } from "react";
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
  const spotlightItem = selectedItem || recommendedItem || safeItems[0] || null;
  const sceneProgress = getProgress(safeSceneId);
  const completedItemCount = (sceneProgress.completedResponseItemIds || []).filter((itemId) => sceneItemIds.includes(itemId)).length;
  const completionRatio = sceneItemIds.length ? completedItemCount / sceneItemIds.length : 0;
  const lastCompletedItemId = sceneProgress.lastCompletedItemId;
  const [justCompletedItemId, setJustCompletedItemId] = useState("");
  const previousCompletedCountRef = useRef(completedItemCount);
  const railRef = useRef(null);
  const suppressSpotlightClickRef = useRef(false);
  const spotlightPointerIdRef = useRef(null);
  const spotlightDragRef = useRef({
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    moved: false
  });

  useEffect(() => {
    const previousCompletedCount = previousCompletedCountRef.current;
    if (completedItemCount > previousCompletedCount && lastCompletedItemId) {
      setJustCompletedItemId(lastCompletedItemId);
      const timerId = window.setTimeout(() => {
        setJustCompletedItemId((currentId) => (currentId === lastCompletedItemId ? "" : currentId));
      }, 1400);
      previousCompletedCountRef.current = completedItemCount;
      return () => {
        window.clearTimeout(timerId);
      };
    }

    previousCompletedCountRef.current = completedItemCount;
    return undefined;
  }, [completedItemCount, lastCompletedItemId]);

  useEffect(() => {
    const railElement = railRef.current;
    if (!railElement || !spotlightItem?.id) {
      return;
    }

    const activeCard = railElement.querySelector(`[data-item-id="${spotlightItem.id}"]`);
    if (!activeCard) {
      return;
    }

    activeCard.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center"
    });
  }, [spotlightItem?.id]);

  function getSpotlightIndex() {
    if (!safeItems.length) {
      return -1;
    }

    if (selectedItem?.id) {
      return safeItems.findIndex((item) => item.id === selectedItem.id);
    }

    if (spotlightItem?.id) {
      return safeItems.findIndex((item) => item.id === spotlightItem.id);
    }

    return 0;
  }

  function moveSpotlightByOffset(offset) {
    if (!offset || !safeItems.length) {
      return;
    }

    const currentIndex = getSpotlightIndex();
    const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
    const targetIndex = Math.min(Math.max(safeCurrentIndex + offset, 0), safeItems.length - 1);
    const targetItem = safeItems[targetIndex];
    if (!targetItem?.id) {
      return;
    }

    onSelectItem?.(targetItem.id);
  }

  function handleSpotlightPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    spotlightPointerIdRef.current = event.pointerId;
    spotlightDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      deltaX: 0,
      deltaY: 0,
      moved: false
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleSpotlightPointerMove(event) {
    if (spotlightPointerIdRef.current !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - spotlightDragRef.current.startX;
    const deltaY = event.clientY - spotlightDragRef.current.startY;
    spotlightDragRef.current.deltaX = deltaX;
    spotlightDragRef.current.deltaY = deltaY;

    if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
      spotlightDragRef.current.moved = true;
    }
  }

  function handleSpotlightPointerEnd(event) {
    if (spotlightPointerIdRef.current !== event.pointerId) {
      return;
    }

    const { deltaX, deltaY, moved } = spotlightDragRef.current;
    spotlightPointerIdRef.current = null;
    spotlightDragRef.current = {
      startX: 0,
      startY: 0,
      deltaX: 0,
      deltaY: 0,
      moved: false
    };

    if (!moved) {
      return;
    }

    const isHorizontalSwipe = Math.abs(deltaX) >= 36 && Math.abs(deltaX) > Math.abs(deltaY) + 14;
    if (!isHorizontalSwipe) {
      return;
    }

    suppressSpotlightClickRef.current = true;
    moveSpotlightByOffset(deltaX < 0 ? 1 : -1);
  }

  function handleSpotlightPointerCancel(event) {
    if (spotlightPointerIdRef.current !== event.pointerId) {
      return;
    }

    spotlightPointerIdRef.current = null;
    spotlightDragRef.current = {
      startX: 0,
      startY: 0,
      deltaX: 0,
      deltaY: 0,
      moved: false
    };
  }

  function handleSpotlightClick() {
    if (suppressSpotlightClickRef.current) {
      suppressSpotlightClickRef.current = false;
      return;
    }

    if (!spotlightItem?.id) {
      return;
    }

    onSelectItem?.(spotlightItem.id);
  }

  const recommendationText = !recommendedItem
    ? sceneItemIds.length
      ? "Scene complete. Tap any item to review."
      : "No vocabulary items available in this scene yet."
    : completedItemCount === 0
      ? `Start with ${recommendedItem.spanish} to open this scene.`
      : completionRatio >= 0.8
        ? `Final stretch: ${recommendedItem.spanish} is your next best step.`
        : `Keep momentum with ${recommendedItem.spanish}.`;

  return (
    <div className="scene-canvas" role="region" aria-label={safeScene.title}>
      <div className="scene-stage-card">
        <p className="scene-kicker">Scene</p>
        <h2 className="scene-title">{safeScene.title}</h2>
        <p className="scene-description">{safeScene.description}</p>
        <p className="scene-recommendation">{recommendationText}</p>

        {spotlightItem ? (
          <button
            type="button"
            className={`scene-spotlight-button ${selectedItem?.id === spotlightItem.id ? "is-active" : ""}`}
            onClick={handleSpotlightClick}
            onPointerDown={handleSpotlightPointerDown}
            onPointerMove={handleSpotlightPointerMove}
            onPointerUp={handleSpotlightPointerEnd}
            onPointerCancel={handleSpotlightPointerCancel}
            aria-pressed={selectedItem?.id === spotlightItem.id}
          >
            <p className="scene-spotlight-kicker">Focused word</p>
            <p className="scene-spotlight-es">{spotlightItem.spanish || spotlightItem.id}</p>
            <p className="scene-spotlight-en">{spotlightItem.english || "Vocabulary item"}</p>
          </button>
        ) : null}
      </div>

      <div className="scene-items-rail" aria-label="Scene vocabulary items" ref={railRef}>
        {safeItems.length ? safeItems.map((item) => {
          const isActive = selectedItem?.id === item.id;
          const status = itemStatusById[item.id] || "default";
          const isRecommended = item.id === recommendedItemId;
          const isJustCompleted = status === "completed" && item.id === justCompletedItemId;

          return (
            <button
              key={item.id}
              type="button"
              className={`scene-item-button ${isActive ? "is-active" : ""} ${status === "seen" ? "is-seen" : ""} ${status === "completed" ? "is-completed" : ""} ${isRecommended ? "is-recommended" : ""} ${isJustCompleted ? "is-just-completed" : ""}`}
              onClick={() => onSelectItem?.(item.id)}
              aria-pressed={isActive}
              data-item-id={item.id}
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
