export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function toTitleCase(value = "") {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
