"use strict";

/* ========================================
   COLLECTION QUERIES
======================================== */

export function findItemById(items, itemId) {
  if (!Array.isArray(items)) {
    return null;
  }

  return items.find((item) => item?.id === itemId) ?? null;
}

/* ========================================
   COLLECTION COMMANDS
======================================== */

export function appendItem(items, newItem) {
  const safeItems = Array.isArray(items) ? items : [];

  return [...safeItems, newItem];
}

export function updateItemById(items, itemId, createUpdatedItem) {
  if (!Array.isArray(items) || typeof createUpdatedItem !== "function") {
    return {
      items: Array.isArray(items) ? [...items] : [],
      updatedItem: null,
    };
  }

  let updatedItem = null;

  const updatedItems = items.map((item) => {
    if (item?.id !== itemId) {
      return item;
    }

    updatedItem = createUpdatedItem(item);

    return updatedItem;
  });

  return {
    items: updatedItems,
    updatedItem,
  };
}

export function removeItemById(items, itemId) {
  if (!Array.isArray(items)) {
    return {
      items: [],
      removedItem: null,
    };
  }

  const removedItem = findItemById(items, itemId);

  if (!removedItem) {
    return {
      items: [...items],
      removedItem: null,
    };
  }

  return {
    items: items.filter((item) => item?.id !== itemId),
    removedItem,
  };
}
