import {parsePath, serializePath, pathHandles, movePathHandle, translatePath} from "./path-utils.mjs";
import {resizeTextWidth} from "./width-utils.mjs";

const SCENES = ["s01", "s02", "s03", "s04", "s05", "s06", "s07", "s08"];
const KIND_LABELS = {items: "图层", paths: "线条", circles: "圆形", texts: "SVG文字"};
const DRAFT_KEY = "course-layout-editor:1:savings-lesson-01:layout-2";
const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const normalizeAngle = degrees => ((degrees + 180) % 360 + 360) % 360 - 180;

const iframe = document.querySelector("#preview-frame");
const overlay = document.querySelector("#overlay");
const stageScale = document.querySelector("#stage-scale");
const stageShell = document.querySelector("#stage-shell");
const canvasArea = document.querySelector("#canvas-area");
const sceneTabs = document.querySelector("#scene-tabs");
const layerList = document.querySelector("#layer-list");
const layerSearch = document.querySelector("#layer-search");
const statusNode = document.querySelector("#status");
const sceneReadout = document.querySelector("#scene-readout");

let frameWindow;
let frameDocument;
let baseline;
let layout;
let sceneId = "s01";
let selected = null;
let gesture = null;
let history = [];
let future = [];
let preview = false;
let initialized = false;

function setStatus(message, error = false) {
  statusNode.textContent = message;
  statusNode.classList.toggle("error", error);
}

function findRecord(kind, id, source = layout) {
  return source.scenes[sceneId][kind].find(record => record.id === id);
}

function replaceRecord(kind, id, next) {
  layout.scenes[sceneId][kind] = layout.scenes[sceneId][kind].map(record => record.id === id ? next : record);
}

function findNode(id) {
  return frameDocument.querySelector(`[data-hf-id="${frameWindow.CSS.escape(id)}"]`);
}

function stagePoint(event) {
  const rect = overlay.getBoundingClientRect();
  return {x: (event.clientX - rect.left) / rect.width * 1920, y: (event.clientY - rect.top) / rect.height * 1080};
}

function svgPoint(node, stage) {
  const svg = node.ownerSVGElement;
  if (!svg?.getScreenCTM()) throw new Error("SVG 元素没有可用坐标系。");
  return new frameWindow.DOMPoint(stage.x, stage.y).matrixTransform(svg.getScreenCTM().inverse());
}

function svgToStage(node, point) {
  const svg = node.ownerSVGElement;
  const mapped = new frameWindow.DOMPoint(point.x, point.y).matrixTransform(svg.getScreenCTM());
  return {x: mapped.x, y: mapped.y};
}

function nodeBox(node) {
  const rootRect = frameDocument.querySelector("#root").getBoundingClientRect();
  const rect = node.getBoundingClientRect();
  const width = Math.max(16, rect.width);
  const height = Math.max(16, rect.height);
  return {
    left: rect.left - rootRect.left - (width - rect.width) / 2,
    top: rect.top - rootRect.top - (height - rect.height) / 2,
    width,
    height
  };
}

function applyLayout() {
  layout = frameWindow.CourseLayout.apply(frameDocument, layout, baseline);
}

function persist() {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(layout)); }
  catch { setStatus("浏览器草稿保存失败，请及时下载 JSON。", true); }
}

function checkpoint(before, message = "调整已保存为浏览器草稿。") {
  if (JSON.stringify(before) === JSON.stringify(layout)) return;
  history.push(before);
  if (history.length > 60) history.shift();
  future = [];
  persist();
  updateHistoryButtons();
  setStatus(message);
}

function updateHistoryButtons() {
  document.querySelector("#undo").disabled = history.length === 0;
  document.querySelector("#redo").disabled = future.length === 0;
}

function select(kind, id) {
  selected = kind && id ? {kind, id} : null;
  renderLayers();
  rebuildOverlay();
}

function displayLabel(record) {
  return `${record.label || record.id} · ${record.id}`;
}

function renderLayers() {
  if (!layout) return;
  const query = layerSearch.value.trim().toLowerCase();
  const scene = layout.scenes[sceneId];
  layerList.replaceChildren();
  let total = 0;
  Object.entries(KIND_LABELS).forEach(([kind, title]) => {
    const records = scene[kind].filter(record => displayLabel(record).toLowerCase().includes(query));
    if (!records.length) return;
    const heading = document.createElement("div"); heading.className = "layer-group-title"; heading.textContent = `${title} · ${records.length}`; layerList.append(heading);
    records.forEach(record => {
      total += 1;
      const button = document.createElement("button"); button.type = "button"; button.className = "layer-item";
      if (selected?.kind === kind && selected.id === record.id) button.classList.add("active");
      const badge = document.createElement("span"); badge.className = `kind ${kind.slice(0, -1)}`; badge.textContent = title;
      const label = document.createElement("span"); label.textContent = displayLabel(record);
      button.append(badge, label); button.addEventListener("click", () => select(kind, record.id)); layerList.append(button);
    });
  });
  document.querySelector("#layer-count").textContent = `${total} 个`;
}

function createHitbox(kind, record) {
  const node = findNode(record.id);
  if (!node) return null;
  const box = nodeBox(node);
  const hitbox = document.createElement("div");
  hitbox.className = `hitbox ${kind.slice(0, -1)}`;
  hitbox.dataset.editorKind = kind; hitbox.dataset.editorId = record.id;
  Object.assign(hitbox.style, {left:`${box.left}px`, top:`${box.top}px`, width:`${box.width}px`, height:`${box.height}px`});
  if (selected?.kind === kind && selected.id === record.id) {
    hitbox.classList.add("selected");
    const label = document.createElement("span"); label.className = "hitbox-label"; label.textContent = displayLabel(record); hitbox.append(label);
    if (kind === "items") {
      for (const mode of ["scale", "rotate"]) {
        const handle = document.createElement("button"); handle.type = "button"; handle.className = `transform-handle ${mode}`;
        handle.dataset.gestureMode = mode; handle.setAttribute("aria-label", mode === "scale" ? "缩放" : "旋转"); hitbox.append(handle);
      }
      if (Number.isFinite(Number(record.widthScale))) {
        for (const edge of ["left", "right"]) {
          const handle = document.createElement("button"); handle.type = "button";
          handle.className = `transform-handle width-${edge}`;
          handle.dataset.gestureMode = `width-${edge}`;
          handle.setAttribute("aria-label", edge === "left" ? "向左调整文字框宽度" : "向右调整文字框宽度");
          hitbox.append(handle);
        }
      }
    }
  }
  hitbox.addEventListener("pointerdown", event => startGesture(event, kind, record.id, event.target.closest("[data-gesture-mode]")?.dataset.gestureMode || "move"));
  hitbox.addEventListener("lostpointercapture", () => finishGesture(true));
  return hitbox;
}

function addPathControls() {
  if (!selected || selected.kind !== "paths") return;
  const record = findRecord("paths", selected.id);
  const node = findNode(selected.id);
  if (!record || !node) return;
  let model;
  try { model = parsePath(record.d); }
  catch (error) { setStatus(`无法编辑该路径：${error.message}`, true); return; }
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("path-control-lines"); svg.setAttribute("viewBox", "0 0 1920 1080"); overlay.append(svg);
  pathHandles(model).forEach(handle => {
    const position = svgToStage(node, handle);
    if (handle.kind === "control") {
      const from = svgToStage(node, handle.from);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.dataset.commandIndex = String(handle.commandIndex); line.dataset.pointIndex = String(handle.pointIndex);
      line.setAttribute("x1", from.x); line.setAttribute("y1", from.y); line.setAttribute("x2", position.x); line.setAttribute("y2", position.y); svg.append(line);
    }
    const button = document.createElement("button"); button.type = "button";
    button.className = `path-handle ${handle.kind}`;
    button.dataset.commandIndex = String(handle.commandIndex); button.dataset.pointIndex = String(handle.pointIndex);
    button.style.left = `${position.x}px`; button.style.top = `${position.y}px`;
    button.setAttribute("aria-label", handle.kind === "control" ? "曲线控制点" : "路径端点");
    button.addEventListener("pointerdown", event => startGesture(event, "paths", record.id, "path-point", handle));
    button.addEventListener("lostpointercapture", () => finishGesture(true));
    overlay.append(button);
  });
}

function addCircleRadiusHandle() {
  if (!selected || selected.kind !== "circles") return;
  const record = findRecord("circles", selected.id);
  const node = findNode(selected.id);
  if (!record || !node) return;
  const position = svgToStage(node, {x: Number(record.cx) + Number(record.r), y: Number(record.cy)});
  const button = document.createElement("button"); button.type = "button"; button.className = "path-handle radius";
  button.style.left = `${position.x}px`; button.style.top = `${position.y}px`; button.setAttribute("aria-label", "调整圆形半径");
  button.addEventListener("pointerdown", event => startGesture(event, "circles", record.id, "radius")); overlay.append(button);
  button.addEventListener("lostpointercapture", () => finishGesture(true));
}

function rebuildOverlay() {
  if (!layout || !frameDocument) return;
  overlay.replaceChildren(); overlay.classList.toggle("preview", preview);
  const scene = layout.scenes[sceneId];
  ["items", "paths", "circles", "texts"].forEach(kind => scene[kind].forEach(record => {
    const hitbox = createHitbox(kind, record); if (hitbox) overlay.append(hitbox);
  }));
  addPathControls(); addCircleRadiusHandle();
}

function syncOverlay() {
  overlay.querySelectorAll(".hitbox[data-editor-id]").forEach(hitbox => {
    const node = findNode(hitbox.dataset.editorId); if (!node) return;
    const box = nodeBox(node);
    Object.assign(hitbox.style, {left:`${box.left}px`, top:`${box.top}px`, width:`${box.width}px`, height:`${box.height}px`});
  });
  if (selected?.kind === "paths") {
    const record = findRecord("paths", selected.id); const node = findNode(selected.id); if (!record || !node) return;
    const handles = pathHandles(parsePath(record.d));
    overlay.querySelectorAll(".path-handle:not(.radius)").forEach(button => {
      const handle = handles.find(entry => entry.commandIndex === Number(button.dataset.commandIndex) && entry.pointIndex === Number(button.dataset.pointIndex));
      if (!handle) return; const position = svgToStage(node, handle); button.style.left = `${position.x}px`; button.style.top = `${position.y}px`;
    });
    overlay.querySelectorAll(".path-control-lines line").forEach(line => {
      const handle = handles.find(entry => entry.commandIndex === Number(line.dataset.commandIndex) && entry.pointIndex === Number(line.dataset.pointIndex));
      if (!handle) return; const position = svgToStage(node, handle); const from = svgToStage(node, handle.from);
      line.setAttribute("x1", from.x); line.setAttribute("y1", from.y); line.setAttribute("x2", position.x); line.setAttribute("y2", position.y);
    });
  }
  if (selected?.kind === "circles") {
    const record = findRecord("circles", selected.id); const node = findNode(selected.id); const handle = overlay.querySelector(".path-handle.radius");
    if (record && node && handle) { const position = svgToStage(node, {x:Number(record.cx)+Number(record.r), y:Number(record.cy)}); handle.style.left=`${position.x}px`; handle.style.top=`${position.y}px`; }
  }
}

function startGesture(event, kind, id, mode, pathHandle = null) {
  if (preview || event.button !== 0 || gesture) return;
  event.preventDefault(); event.stopPropagation();
  if (selected?.kind !== kind || selected.id !== id) { selected = {kind, id}; renderLayers(); }
  const node = findNode(id); const record = clone(findRecord(kind, id));
  const point = stagePoint(event);
  gesture = {kind, id, mode, before:clone(layout), start:record, point, node, pointerId:event.pointerId, target:event.currentTarget, pathHandle};
  if (kind === "paths") { gesture.model = parsePath(record.d); gesture.localPoint = svgPoint(node, point); }
  if (kind === "circles" || kind === "texts") gesture.localPoint = svgPoint(node, point);
  event.currentTarget.setPointerCapture?.(event.pointerId);
}

function updateGesture(event) {
  if (!gesture || event.pointerId !== gesture.pointerId) return;
  const point = stagePoint(event);
  const {kind, mode, start, node} = gesture;
  if (kind === "items") {
    const next = {...start};
    if (mode === "move") {
      next.x += (point.x - gesture.point.x) / 1920 * 100; next.y += (point.y - gesture.point.y) / 1080 * 100;
    } else {
      const center = {x:start.x / 100 * 1920, y:start.y / 100 * 1080};
      const firstDistance = Math.hypot(gesture.point.x-center.x, gesture.point.y-center.y);
      const nextDistance = Math.hypot(point.x-center.x, point.y-center.y);
      if (mode === "scale" && firstDistance > .001) next.scale = clamp(start.scale * nextDistance / firstDistance, .2, 4);
      if (mode === "width-left" || mode === "width-right") {
        const base = findRecord("items", gesture.id, baseline);
        const resized = resizeTextWidth({
          start,
          baseWidth: Number(base.width) / 100 * 1920,
          pointerDelta: point.x - gesture.point.x,
          edge: mode === "width-left" ? "left" : "right"
        });
        next.widthScale = resized.widthScale;
        next.x = resized.x;
      }
      if (mode === "rotate") {
        const angle = value => Math.atan2(value.y-center.y, value.x-center.x) * 180 / Math.PI;
        next.rotation = normalizeAngle(start.rotation + angle(point) - angle(gesture.point));
      }
    }
    replaceRecord(kind, gesture.id, next);
  } else if (kind === "paths") {
    const local = svgPoint(node, point);
    const nextModel = mode === "path-point"
      ? movePathHandle(gesture.model, gesture.pathHandle, local.x, local.y)
      : translatePath(gesture.model, local.x - gesture.localPoint.x, local.y - gesture.localPoint.y);
    replaceRecord(kind, gesture.id, {...start, d:serializePath(nextModel)});
  } else if (kind === "circles") {
    const local = svgPoint(node, point); const next = {...start};
    if (mode === "radius") next.r = Math.max(2, Math.hypot(local.x-start.cx, local.y-start.cy));
    else { next.cx = start.cx + local.x-gesture.localPoint.x; next.cy = start.cy + local.y-gesture.localPoint.y; }
    replaceRecord(kind, gesture.id, next);
  } else if (kind === "texts") {
    const local = svgPoint(node, point);
    replaceRecord(kind, gesture.id, {...start, x:start.x+local.x-gesture.localPoint.x, y:start.y+local.y-gesture.localPoint.y});
  }
  applyLayout(); syncOverlay();
}

function finishGesture(cancelled = false) {
  if (!gesture) return;
  const active = gesture; gesture = null;
  if (cancelled) layout = active.before;
  else checkpoint(active.before);
  applyLayout(); renderLayers(); rebuildOverlay();
}

function nudgeSelection(event) {
  if (!selected || gesture || preview) return;
  const {kind, id} = selected; const before = clone(layout); const record = {...findRecord(kind, id)};
  const large = event.shiftKey; let handled = true;
  if (kind === "items") {
    const step = large ? 1 : .1;
    if (event.key === "ArrowLeft") record.x -= step; else if (event.key === "ArrowRight") record.x += step;
    else if (event.key === "ArrowUp") record.y -= step; else if (event.key === "ArrowDown") record.y += step;
    else if (event.key === "[") record.rotation = normalizeAngle(record.rotation - 1);
    else if (event.key === "]") record.rotation = normalizeAngle(record.rotation + 1);
    else if (event.key === "-" || event.key === "_") record.scale = clamp(record.scale - .05, .2, 4);
    else if (event.key === "+" || event.key === "=") record.scale = clamp(record.scale + .05, .2, 4);
    else handled = false;
    if (handled) replaceRecord(kind, id, record);
  } else {
    const dx = event.key === "ArrowLeft" ? -(large?10:2) : event.key === "ArrowRight" ? (large?10:2) : 0;
    const dy = event.key === "ArrowUp" ? -(large?10:2) : event.key === "ArrowDown" ? (large?10:2) : 0;
    if (!dx && !dy) handled = false;
    if (handled && kind === "paths") replaceRecord(kind, id, {...record, d:serializePath(translatePath(parsePath(record.d), dx, dy))});
    if (handled && kind === "circles") replaceRecord(kind, id, {...record, cx:record.cx+dx, cy:record.cy+dy});
    if (handled && kind === "texts") replaceRecord(kind, id, {...record, x:record.x+dx, y:record.y+dy});
  }
  if (!handled) return;
  event.preventDefault(); applyLayout(); checkpoint(before); syncOverlay(); renderLayers();
}

function updateScale() {
  const availableWidth = Math.max(640, canvasArea.clientWidth - 48);
  const availableHeight = Math.max(360, canvasArea.clientHeight - 88);
  const scale = Math.min(availableWidth / 1920, availableHeight / 1080);
  stageShell.style.width = `${1920 * scale}px`; stageShell.style.height = `${1080 * scale}px`;
  stageScale.style.transform = `scale(${scale})`;
}

function sceneUrl(id) { return `index.html?layoutEdit=1&scene=${id}&v=layout-2`; }

function waitForFrameReady() {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const check = () => {
      try {
        if (iframe.contentWindow?.__courseLayoutEditorReady) return resolve();
      } catch {}
      if (performance.now() - started > 10000) return reject(new Error("课程画面载入超时。"));
      requestAnimationFrame(check);
    };
    check();
  });
}

async function loadScene(id) {
  sceneId = id; selected = null; gesture = null;
  sceneTabs.querySelectorAll("button").forEach(button => button.classList.toggle("active", button.dataset.scene === id));
  sceneReadout.textContent = `${id.toUpperCase()} · 场景布局`;
  const targetUrl = new URL(sceneUrl(id), window.location.href).href;
  if (iframe.src !== targetUrl) {
    const loaded = new Promise(resolve => iframe.addEventListener("load", resolve, {once:true}));
    iframe.src = targetUrl;
    await loaded;
  }
  await waitForFrameReady();
  frameWindow = iframe.contentWindow; frameDocument = iframe.contentDocument;
  const nextBaseline = clone(frameWindow.__courseLayoutBaseline);
  if (!initialized) {
    baseline = nextBaseline;
    const authored = frameWindow.CourseLayout.mergeWithBaseline(frameWindow.COURSE_LAYOUT_PRESET, baseline);
    layout = authored;
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) layout = frameWindow.CourseLayout.mergeWithBaseline(JSON.parse(draft), baseline);
    } catch { localStorage.removeItem(DRAFT_KEY); setStatus("旧草稿不匹配，已使用正式布局。", true); }
    initialized = true;
  } else baseline = nextBaseline;
  applyLayout(); renderLayers(); rebuildOverlay(); updateScale(); updateHistoryButtons();
  setStatus(`${id.toUpperCase()} 已载入。文字可用左右手柄拉宽；线条可调整端点与控制点。`);
}

function buildSceneTabs() {
  SCENES.forEach(id => {
    const button = document.createElement("button"); button.type = "button"; button.dataset.scene = id; button.textContent = id.toUpperCase();
    button.addEventListener("click", () => loadScene(id).catch(error => setStatus(error.message, true))); sceneTabs.append(button);
  });
}

document.querySelector("#undo").addEventListener("click", () => {
  if (!history.length) return; future.push(clone(layout)); layout = history.pop(); applyLayout(); persist(); renderLayers(); rebuildOverlay(); updateHistoryButtons(); setStatus("已撤销上一步。");
});
document.querySelector("#redo").addEventListener("click", () => {
  if (!future.length) return; history.push(clone(layout)); layout = future.pop(); applyLayout(); persist(); renderLayers(); rebuildOverlay(); updateHistoryButtons(); setStatus("已重做。");
});
document.querySelector("#preview").addEventListener("click", event => {
  preview = !preview; event.currentTarget.textContent = preview ? "继续编辑" : "隐藏控制框"; overlay.classList.toggle("preview", preview); setStatus(preview ? "控制框已隐藏，当前仍是草稿预览。" : "已返回编辑模式。");
});
document.querySelector("#reset-scene").addEventListener("click", () => {
  const before = clone(layout); layout.scenes[sceneId] = clone(baseline.scenes[sceneId]); applyLayout(); checkpoint(before, `${sceneId.toUpperCase()} 已恢复正式位置。`); select(null, null);
});
document.querySelector("#reset-all").addEventListener("click", () => {
  const before = clone(layout); layout = clone(baseline); applyLayout(); checkpoint(before, "八个场景已恢复正式位置。"); select(null, null);
});
document.querySelector("#clear-draft").addEventListener("click", () => {
  localStorage.removeItem(DRAFT_KEY); history=[]; future=[]; layout=clone(baseline); applyLayout(); renderLayers(); rebuildOverlay(); updateHistoryButtons(); setStatus("浏览器草稿已清除，并恢复正式布局。");
});
document.querySelector("#deselect").addEventListener("click", () => select(null, null));
layerSearch.addEventListener("input", renderLayers);

const fileInput = document.querySelector("#json-file");
document.querySelector("#import-json").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", async () => {
  if (!fileInput.files[0]) return;
  try {
    const imported = JSON.parse(await fileInput.files[0].text()); const next = frameWindow.CourseLayout.mergeWithBaseline(imported, baseline);
    const before = clone(layout); layout = next; applyLayout(); checkpoint(before, `已导入 ${fileInput.files[0].name}。`); renderLayers(); rebuildOverlay();
  } catch (error) { setStatus(`导入失败：${error.message}`, true); }
  finally { fileInput.value = ""; }
});
document.querySelector("#export-json").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(layout, null, 2)], {type:"application/json"}); const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href=url; link.download="savings-lesson-01-layout.json"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); setStatus("八个场景的布局 JSON 已下载。");
});

window.addEventListener("pointermove", updateGesture);
window.addEventListener("pointerup", event => { if (gesture && event.pointerId === gesture.pointerId) finishGesture(false); });
window.addEventListener("pointercancel", event => { if (gesture && event.pointerId === gesture.pointerId) finishGesture(true); });
window.addEventListener("blur", () => finishGesture(true));
window.addEventListener("keydown", nudgeSelection);
new ResizeObserver(() => { if (gesture) finishGesture(true); updateScale(); }).observe(canvasArea);

buildSceneTabs();
loadScene("s01").catch(error => setStatus(`编辑器启动失败：${error.message}`, true));
