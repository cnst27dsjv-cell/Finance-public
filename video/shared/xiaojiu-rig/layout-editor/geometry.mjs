export const clone = value => JSON.parse(JSON.stringify(value));
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const normalizeAngle = degrees => ((degrees + 180) % 360 + 360) % 360 - 180;
export const SCALE_LIMITS = [0.2, 4];

function keys(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some(key => !allowed.includes(key)) ||
      allowed.some(key => !Object.hasOwn(value, key))) throw new Error('Unexpected layout fields');
}

export function validateLayout(value, expected) {
  keys(value, ['version', 'stage', 'items']);
  keys(value.stage, ['id', 'aspectRatio', 'anchor', 'units', 'revision']);
  const stage = value.stage;
  if (value.version !== 1 || stage.anchor !== 'center' || stage.units !== 'percent' ||
      typeof stage.id !== 'string' || !stage.id || typeof stage.revision !== 'string' || !stage.revision ||
      !Number.isFinite(stage.aspectRatio) || stage.aspectRatio <= 0 || !Array.isArray(value.items)) {
    throw new Error('Invalid stage or schema version');
  }
  const ids = new Set();
  for (const item of value.items) {
    keys(item, ['id', 'x', 'y', 'width', 'aspectRatio', 'scale', 'rotation']);
    if (typeof item.id !== 'string' || !item.id || ids.has(item.id)) throw new Error('Invalid or duplicate item ID');
    ids.add(item.id);
    if (['x', 'y', 'width', 'aspectRatio', 'scale', 'rotation'].some(key => !Number.isFinite(item[key])) ||
        item.width <= 0 || item.aspectRatio <= 0 || item.scale < SCALE_LIMITS[0] || item.scale > SCALE_LIMITS[1]) {
      throw new Error('Invalid item geometry');
    }
  }
  if (expected) {
    if (Object.keys(stage).some(key => stage[key] !== expected.stage[key]) || value.items.length !== expected.items.length) {
      throw new Error('Layout belongs to a different stage, revision, or element set');
    }
    for (const item of value.items) {
      const original = expected.items.find(entry => entry.id === item.id);
      if (!original || original.width !== item.width || original.aspectRatio !== item.aspectRatio) {
        throw new Error('Editable IDs and base dimensions must match the host');
      }
    }
  }
  const result = clone(value);
  result.items.forEach(item => { item.rotation = normalizeAngle(item.rotation); });
  return result;
}

export function localPoint(point, rect, size) {
  if (rect.width <= 0 || rect.height <= 0 || size.width <= 0 || size.height <= 0) throw new Error('Stage has no size');
  return {x: (point.x - rect.left) * size.width / rect.width, y: (point.y - rect.top) * size.height / rect.height};
}

export function gestureItem(start, mode, pointerStart, pointerNow, rect, size) {
  const first = localPoint(pointerStart, rect, size);
  const now = localPoint(pointerNow, rect, size);
  const next = {...start};
  if (mode === 'move') {
    next.x += (now.x - first.x) / size.width * 100;
    next.y += (now.y - first.y) / size.height * 100;
  } else {
    const center = {x: start.x / 100 * size.width, y: start.y / 100 * size.height};
    const distance = point => Math.hypot(point.x - center.x, point.y - center.y);
    if (distance(first) < 0.001 || distance(now) < 0.001) return next;
    if (mode === 'scale') next.scale = clamp(start.scale * distance(now) / distance(first), ...SCALE_LIMITS);
    else if (mode === 'rotate') {
      const angle = point => Math.atan2(point.y - center.y, point.x - center.x) * 180 / Math.PI;
      next.rotation = normalizeAngle(start.rotation + normalizeAngle(angle(now) - angle(first)));
    } else throw new Error('Unknown gesture');
  }
  return next;
}
