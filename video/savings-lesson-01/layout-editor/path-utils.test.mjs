import test from "node:test";
import assert from "node:assert/strict";
import {parsePath, serializePath, pathHandles, movePathHandle, translatePath} from "./path-utils.mjs";

test("normalizes H, V and smooth cubic commands", () => {
  const model = parsePath("M10 20 H30 V40 C40 50 50 60 60 70 S80 90 100 110");
  assert.equal(model.map(command => command.type).join(""), "MLLCC");
  assert.equal(serializePath(model), "M10 20 L30 20 L30 40 C40 50 50 60 60 70 C70 80 80 90 100 110");
});

test("moves one control point without changing other points", () => {
  const model = parsePath("M0 0 C10 20 30 40 50 60");
  const control = pathHandles(model).find(handle => handle.kind === "control");
  assert.equal(serializePath(movePathHandle(model, control, 12, 24)), "M0 0 C12 24 30 40 50 60");
});

test("translates every coordinate", () => {
  assert.equal(serializePath(translatePath(parsePath("M1 2 Q3 4 5 6"), 10, -2)), "M11 0 Q13 2 15 4");
});
