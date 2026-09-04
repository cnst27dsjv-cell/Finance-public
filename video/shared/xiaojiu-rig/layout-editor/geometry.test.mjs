import test from 'node:test';
import assert from 'node:assert/strict';
import {validateLayout, clone, normalizeAngle, gestureItem, localPoint} from './geometry.mjs';

const layout = {version: 1, stage: {id: 'xiaojiu', aspectRatio: 600 / 560, anchor: 'center', units: 'percent', revision: 'assembly-1'},
  items: [{id: 'mouth', x: 50, y: 40, width: 14, aspectRatio: 0.94, scale: 1, rotation: 0}]};
const rect = {left: 100, top: 50, width: 600, height: 560};
const size = {width: 600, height: 560};

test('schema round-trip preserves geometry and normalizes angles', () => {
  const edited = clone(layout); edited.items[0].rotation = 370;
  const result = validateLayout(JSON.parse(JSON.stringify(edited)), layout);
  assert.equal(result.items[0].rotation, 10); assert.equal(edited.items[0].rotation, 370);
  assert.equal(normalizeAngle(-181), 179);
});

test('rejects executable fields, foreign stages, IDs and dimensions', () => {
  const edits = [value => {value.items[0].src = 'https://invalid';}, value => {value.stage.revision = 'v2';},
    value => {value.items[0].width = 22;}, value => {value.items[0].id = 'foreign';},
    value => {value.items[0].scale = 0;}, value => {value.items[0].x = Infinity;}, value => {value.items.push(value.items[0]);}];
  for (const edit of edits) { const value = clone(layout); edit(value); assert.throws(() => validateLayout(value, layout)); }
});

test('move uses stage dimensions at two preview scales', () => {
  const a = gestureItem(layout.items[0], 'move', {x: 200, y: 200}, {x: 260, y: 256}, rect, size);
  const b = gestureItem(layout.items[0], 'move', {x: 200, y: 200}, {x: 320, y: 312}, {...rect, width: 1200, height: 1120}, size);
  assert.equal(a.x, 60); assert.equal(a.y, 50); assert.deepEqual(a, b);
});

test('uniform resize retains center and rotation crosses the boundary', () => {
  const resized = gestureItem(layout.items[0], 'scale', {x: 500, y: 274}, {x: 650, y: 274}, rect, size);
  assert.equal(resized.scale, 2.5); assert.equal(resized.x, 50); assert.equal(resized.y, 40);
  const rotated = gestureItem({...layout.items[0], y: 50, rotation: 15}, 'rotate', {x: 400, y: 331}, {x: 400, y: 329}, rect, size);
  assert.ok(Number.isFinite(rotated.rotation));
});

test('inverse scale handles axis-aligned preview', () => {
  assert.deepEqual(localPoint({x: 400, y: 330}, rect, size), {x: 300, y: 280});
  assert.throws(() => localPoint({x: 0, y: 0}, {...rect, width: 0}, size));
});
