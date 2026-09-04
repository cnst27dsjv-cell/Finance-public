const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function resizeTextWidth({start, baseWidth, pointerDelta, edge, stageWidth = 1920}) {
  if (!start || !Number.isFinite(baseWidth) || baseWidth <= 0 || !Number.isFinite(pointerDelta)) {
    throw new Error("Invalid text width gesture.");
  }
  if (edge !== "left" && edge !== "right") throw new Error("Unknown text width edge.");
  const scale = Math.max(0.001, Number(start.scale) || 1);
  const direction = edge === "right" ? 1 : -1;
  const requested = Number(start.widthScale || 1) + direction * pointerDelta / (baseWidth * scale);
  const widthScale = clamp(requested, 0.35, 4);
  const appliedDelta = (widthScale - Number(start.widthScale || 1)) * baseWidth * scale;
  const centerDelta = direction * appliedDelta / 2;
  return {
    widthScale,
    x: Number(start.x) + centerDelta / stageWidth * 100
  };
}
