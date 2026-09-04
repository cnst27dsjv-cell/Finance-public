(function attachCourseLayout(global) {
  "use strict";

  const SCENE_IDS = Object.freeze(["s01", "s02", "s03", "s04", "s05", "s06", "s07", "s08"]);
  const STAGE = Object.freeze({
    id: "savings-lesson-01-layout",
    width: 1920,
    height: 1080,
    aspectRatio: 16 / 9,
    anchor: "center",
    units: "percent",
    revision: "layout-2"
  });
  const ITEM_SELECTOR = [
    ":scope > .scene-world > .wash",
    ":scope > .scene-world > .ledger",
    ":scope > .scene-world > .ghost-number",
    ":scope > .scene-world > .chrome",
    ":scope > .scene-world > .chapter",
    ":scope > .scene-world > .footer-note",
    "[data-reveal]",
    "[data-step]",
    "[data-pop]",
    "[data-stamp]",
    "[data-character]",
    "svg:not([width=\"0\"]):not([aria-hidden=\"true\"])"
  ].join(",");

  const clone = value => JSON.parse(JSON.stringify(value));
  const finite = value => Number.isFinite(Number(value));
  const normalizeAngle = degrees => ((Number(degrees) + 180) % 360 + 360) % 360 - 180;

  function elementId(node) {
    return node?.dataset?.hfId || "";
  }

  function labelFor(node) {
    const ownText = (node.textContent || "").replace(/\s+/g, " ").trim();
    const className = typeof node.className === "string" ? node.className : node.className?.baseVal || "";
    const shortText = ownText.length > 18 ? `${ownText.slice(0, 18)}…` : ownText;
    return shortText || className.split(/\s+/).filter(Boolean).slice(0, 2).join(" · ") || node.tagName.toLowerCase();
  }

  function isNestedUnderEditableItem(node, scene, candidates) {
    let parent = node.parentElement;
    while (parent && parent !== scene) {
      if (candidates.has(parent)) return true;
      parent = parent.parentElement;
    }
    return false;
  }

  function editableItems(scene) {
    const all = Array.from(scene.querySelectorAll(ITEM_SELECTOR)).filter(node => {
      if (!elementId(node) || node.closest("[data-character]") && !node.hasAttribute("data-character")) return false;
      if (node instanceof SVGElement && node.tagName.toLowerCase() !== "svg") return false;
      return true;
    });
    const candidates = new Set(all);
    return all.filter(node => {
      if (node.tagName.toLowerCase() !== "svg") return !isNestedUnderEditableItem(node, scene, candidates);
      const markedAncestor = node.parentElement?.closest("[data-reveal],[data-step],[data-pop],[data-stamp],[data-character]");
      return !markedAncestor || markedAncestor === node;
    });
  }

  function relativeRect(node, rootRect) {
    const rect = node.getBoundingClientRect();
    return {
      x: (rect.left - rootRect.left + rect.width / 2) / rootRect.width * 100,
      y: (rect.top - rootRect.top + rect.height / 2) / rootRect.height * 100,
      width: rect.width / rootRect.width * 100,
      aspectRatio: rect.height > 0 ? rect.width / rect.height : 1,
      scale: 1,
      rotation: 0
    };
  }

  function supportsTextWidth(node) {
    if (!node || node instanceof SVGElement || !(node.textContent || "").trim()) return false;
    if (node.matches("[data-character],.coin,.ghost-number,.wash,.ledger")) return false;
    return !node.querySelector("img,svg,[data-character]");
  }

  function capture(documentRef) {
    const root = documentRef.querySelector("#root");
    if (!root) throw new Error("Course layout requires #root.");
    const rootRect = root.getBoundingClientRect();
    if (!rootRect.width || !rootRect.height) throw new Error("Course layout stage has no size.");
    const scenes = {};
    SCENE_IDS.forEach(sceneId => {
      const scene = documentRef.getElementById(sceneId);
      if (!scene) throw new Error(`Missing scene ${sceneId}.`);
      const items = editableItems(scene).map(node => {
        const record = {
          id: elementId(node),
          label: labelFor(node),
          ...relativeRect(node, rootRect)
        };
        if (supportsTextWidth(node)) record.widthScale = 1;
        return record;
      });
      const paths = Array.from(scene.querySelectorAll("path[data-hf-id]")).map(node => ({
        id: elementId(node), label: labelFor(node), d: node.getAttribute("d") || ""
      }));
      const circles = Array.from(scene.querySelectorAll("circle[data-hf-id]")).map(node => ({
        id: elementId(node), label: labelFor(node),
        cx: Number(node.getAttribute("cx") || 0), cy: Number(node.getAttribute("cy") || 0), r: Number(node.getAttribute("r") || 0)
      }));
      const texts = Array.from(scene.querySelectorAll("svg text[data-hf-id]")).map(node => ({
        id: elementId(node), label: labelFor(node),
        x: Number(node.getAttribute("x") || 0), y: Number(node.getAttribute("y") || 0)
      }));
      scenes[sceneId] = {items, paths, circles, texts};
    });
    return {version: 1, assetVersion: "1.0.0", revision: STAGE.revision, stage: clone(STAGE), scenes};
  }

  function validateStage(stage) {
    if (!stage || stage.id !== STAGE.id || stage.revision !== STAGE.revision || stage.anchor !== "center" ||
        stage.units !== "percent" || Number(stage.width) !== STAGE.width || Number(stage.height) !== STAGE.height ||
        Number(stage.aspectRatio) !== STAGE.aspectRatio) {
      throw new Error("布局配置属于不同的课程舞台或版本。");
    }
  }

  function validateRecordList(records, allowedIds, fields, kind) {
    if (!Array.isArray(records)) throw new Error(`${kind} 必须是数组。`);
    const seen = new Set();
    records.forEach(record => {
      if (!record || typeof record.id !== "string" || !allowedIds.has(record.id) || seen.has(record.id)) {
        throw new Error(`${kind} 含有未知或重复元素。`);
      }
      seen.add(record.id);
      fields.forEach(field => {
        if (field !== "d" && field !== "label" && !finite(record[field])) throw new Error(`${record.id}.${field} 不是有效数字。`);
        if (field === "d" && typeof record.d !== "string") throw new Error(`${record.id}.d 不是路径字符串。`);
      });
      if (kind === "items" && (Number(record.width) <= 0 || Number(record.aspectRatio) <= 0 || Number(record.scale) < 0.2 || Number(record.scale) > 4)) {
        throw new Error(`${record.id} 的尺寸或缩放无效。`);
      }
      if (kind === "items" && record.widthScale !== undefined &&
          (!finite(record.widthScale) || Number(record.widthScale) < 0.35 || Number(record.widthScale) > 4)) {
        throw new Error(`${record.id} 的文字框宽度无效。`);
      }
      if (kind === "circles" && Number(record.r) <= 0) throw new Error(`${record.id}.r 必须大于 0。`);
    });
  }

  function validate(input, baseline) {
    if (!input || Number(input.version) !== 1 || input.revision !== STAGE.revision || !input.scenes) {
      throw new Error("不支持的课程布局配置。");
    }
    validateStage(input.stage);
    const result = {version: 1, assetVersion: String(input.assetVersion || "1.0.0"), revision: STAGE.revision, stage: clone(STAGE), scenes: {}};
    SCENE_IDS.forEach(sceneId => {
      const source = input.scenes[sceneId] || {items: [], paths: [], circles: [], texts: []};
      const base = baseline?.scenes?.[sceneId];
      if (!base) throw new Error(`缺少 ${sceneId} 的基准布局。`);
      validateRecordList(source.items || [], new Set(base.items.map(item => item.id)), ["x", "y", "width", "aspectRatio", "scale", "rotation"], "items");
      validateRecordList(source.paths || [], new Set(base.paths.map(item => item.id)), ["d"], "paths");
      validateRecordList(source.circles || [], new Set(base.circles.map(item => item.id)), ["cx", "cy", "r"], "circles");
      validateRecordList(source.texts || [], new Set(base.texts.map(item => item.id)), ["x", "y"], "texts");
      result.scenes[sceneId] = clone({items: source.items || [], paths: source.paths || [], circles: source.circles || [], texts: source.texts || []});
      result.scenes[sceneId].items.forEach(item => { item.rotation = normalizeAngle(item.rotation); });
    });
    return result;
  }

  function mergeWithBaseline(input, baseline) {
    const valid = validate(input, baseline);
    const merged = clone(baseline);
    merged.assetVersion = valid.assetVersion;
    SCENE_IDS.forEach(sceneId => {
      ["items", "paths", "circles", "texts"].forEach(kind => {
        const overrides = new Map(valid.scenes[sceneId][kind].map(item => [item.id, item]));
        merged.scenes[sceneId][kind] = merged.scenes[sceneId][kind].map(item => ({...item, ...overrides.get(item.id)}));
      });
    });
    return merged;
  }

  function findByHfId(documentRef, id) {
    return documentRef.querySelector(`[data-hf-id="${CSS.escape(id)}"]`);
  }

  function apply(documentRef, input, baselineInput) {
    const baseline = baselineInput || capture(documentRef);
    const layout = mergeWithBaseline(input, baseline);
    SCENE_IDS.forEach(sceneId => {
      const baseItems = new Map(baseline.scenes[sceneId].items.map(item => [item.id, item]));
      layout.scenes[sceneId].items.forEach(item => {
        const node = findByHfId(documentRef, item.id);
        const base = baseItems.get(item.id);
        if (!node || !base) return;
        let widthOffset = 0;
        if (finite(base.widthScale) && finite(item.widthScale)) {
          const baseWidth = Number(base.width) / 100 * STAGE.width;
          const targetWidth = baseWidth * Number(item.widthScale);
          node.style.width = `${targetWidth}px`;
          node.style.maxWidth = "none";
          node.style.boxSizing = "border-box";
          widthOffset = (baseWidth - targetWidth) / 2;
        }
        const dx = (Number(item.x) - Number(base.x)) / 100 * STAGE.width + widthOffset;
        const dy = (Number(item.y) - Number(base.y)) / 100 * STAGE.height;
        node.style.translate = `${dx}px ${dy}px`;
        node.style.rotate = `${Number(item.rotation)}deg`;
        node.style.scale = String(Number(item.scale));
      });
      layout.scenes[sceneId].paths.forEach(item => findByHfId(documentRef, item.id)?.setAttribute("d", item.d));
      layout.scenes[sceneId].circles.forEach(item => {
        const node = findByHfId(documentRef, item.id);
        if (!node) return;
        node.setAttribute("cx", String(item.cx)); node.setAttribute("cy", String(item.cy)); node.setAttribute("r", String(item.r));
      });
      layout.scenes[sceneId].texts.forEach(item => {
        const node = findByHfId(documentRef, item.id);
        if (!node) return;
        node.setAttribute("x", String(item.x)); node.setAttribute("y", String(item.y));
      });
    });
    return layout;
  }

  global.CourseLayout = Object.freeze({SCENE_IDS, STAGE, capture, validate, mergeWithBaseline, apply, labelFor, clone});
})(window);
