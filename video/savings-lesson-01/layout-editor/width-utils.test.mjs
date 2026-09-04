import test from "node:test";
import assert from "node:assert/strict";
import {resizeTextWidth} from "./width-utils.mjs";

const start = {x: 50, scale: 1, widthScale: 1};

test("right edge widens while keeping the left edge fixed", () => {
  const next = resizeTextWidth({start, baseWidth: 400, pointerDelta: 200, edge: "right"});
  assert.equal(next.widthScale, 1.5);
  assert.equal(next.x, 50 + 100 / 1920 * 100);
});

test("left edge widens while keeping the right edge fixed", () => {
  const next = resizeTextWidth({start, baseWidth: 400, pointerDelta: -200, edge: "left"});
  assert.equal(next.widthScale, 1.5);
  assert.equal(next.x, 50 - 100 / 1920 * 100);
});

test("text width is clamped without shifting beyond the applied width", () => {
  const next = resizeTextWidth({start, baseWidth: 400, pointerDelta: -1000, edge: "right"});
  assert.equal(next.widthScale, 0.35);
  assert.equal(next.x, 50 - 130 / 1920 * 100);
});
