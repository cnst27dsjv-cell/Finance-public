const PARAMS = {M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, Z: 0};

const round = value => Number(Number(value).toFixed(3));

export function parsePath(d) {
  if (typeof d !== "string" || !d.trim()) throw new Error("路径为空。");
  const tokens = d.match(/[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/gi) || [];
  const raw = [];
  let index = 0;
  let command = null;
  while (index < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[index])) command = tokens[index++];
    if (!command || command !== command.toUpperCase() || !(command in PARAMS)) throw new Error("仅支持当前课程使用的绝对 SVG 路径命令。");
    const count = PARAMS[command];
    if (count === 0) { raw.push({type: command, values: []}); command = null; continue; }
    let first = true;
    while (index < tokens.length && !/^[A-Za-z]$/.test(tokens[index])) {
      if (index + count > tokens.length) throw new Error("SVG 路径参数不完整。");
      const values = tokens.slice(index, index + count).map(Number);
      if (values.some(value => !Number.isFinite(value))) throw new Error("SVG 路径包含无效数字。");
      raw.push({type: command === "M" && !first ? "L" : command, values});
      index += count;
      first = false;
      if (command === "M") command = "L";
    }
  }

  const normalized = [];
  let current = {x: 0, y: 0};
  let subpath = {x: 0, y: 0};
  let previousControl = null;
  let previousType = null;
  raw.forEach(entry => {
    const v = entry.values;
    if (entry.type === "M") {
      current = {x: v[0], y: v[1]}; subpath = {...current};
      normalized.push({type: "M", values: [current.x, current.y]}); previousControl = null;
    } else if (entry.type === "L") {
      current = {x: v[0], y: v[1]}; normalized.push({type: "L", values: [current.x, current.y]}); previousControl = null;
    } else if (entry.type === "H") {
      current = {x: v[0], y: current.y}; normalized.push({type: "L", values: [current.x, current.y]}); previousControl = null;
    } else if (entry.type === "V") {
      current = {x: current.x, y: v[0]}; normalized.push({type: "L", values: [current.x, current.y]}); previousControl = null;
    } else if (entry.type === "C") {
      normalized.push({type: "C", values: [...v]});
      previousControl = {x: v[2], y: v[3]}; current = {x: v[4], y: v[5]};
    } else if (entry.type === "S") {
      const firstControl = previousType === "C" && previousControl
        ? {x: current.x * 2 - previousControl.x, y: current.y * 2 - previousControl.y}
        : {...current};
      normalized.push({type: "C", values: [firstControl.x, firstControl.y, v[0], v[1], v[2], v[3]]});
      previousControl = {x: v[0], y: v[1]}; current = {x: v[2], y: v[3]};
    } else if (entry.type === "Q") {
      normalized.push({type: "Q", values: [...v]});
      previousControl = {x: v[0], y: v[1]}; current = {x: v[2], y: v[3]};
    } else if (entry.type === "T") {
      const control = previousType === "Q" && previousControl
        ? {x: current.x * 2 - previousControl.x, y: current.y * 2 - previousControl.y}
        : {...current};
      normalized.push({type: "Q", values: [control.x, control.y, v[0], v[1]]});
      previousControl = control; current = {x: v[0], y: v[1]};
    } else if (entry.type === "Z") {
      normalized.push({type: "Z", values: []}); current = {...subpath}; previousControl = null;
    }
    previousType = normalized.at(-1)?.type || null;
  });
  return normalized;
}

export function serializePath(model) {
  return model.map(command => `${command.type}${command.values.map(round).join(" ")}`).join(" ");
}

export function pathHandles(model) {
  const handles = [];
  let current = {x: 0, y: 0};
  let subpath = {x: 0, y: 0};
  model.forEach((command, commandIndex) => {
    const v = command.values;
    if (command.type === "M" || command.type === "L") {
      handles.push({commandIndex, pointIndex: 0, kind: "anchor", x: v[0], y: v[1], from: {...current}});
      current = {x: v[0], y: v[1]}; if (command.type === "M") subpath = {...current};
    } else if (command.type === "C") {
      handles.push({commandIndex, pointIndex: 0, kind: "control", x: v[0], y: v[1], from: {...current}});
      handles.push({commandIndex, pointIndex: 1, kind: "control", x: v[2], y: v[3], from: {x: v[4], y: v[5]}});
      handles.push({commandIndex, pointIndex: 2, kind: "anchor", x: v[4], y: v[5], from: {...current}});
      current = {x: v[4], y: v[5]};
    } else if (command.type === "Q") {
      handles.push({commandIndex, pointIndex: 0, kind: "control", x: v[0], y: v[1], from: {...current}});
      handles.push({commandIndex, pointIndex: 1, kind: "anchor", x: v[2], y: v[3], from: {...current}});
      current = {x: v[2], y: v[3]};
    } else if (command.type === "Z") current = {...subpath};
  });
  return handles;
}

export function movePathHandle(model, handle, x, y) {
  const next = model.map(command => ({type: command.type, values: [...command.values]}));
  const command = next[handle.commandIndex];
  const offset = command.type === "C" ? handle.pointIndex * 2 : command.type === "Q" ? handle.pointIndex * 2 : 0;
  command.values[offset] = Number(x); command.values[offset + 1] = Number(y);
  return next;
}

export function translatePath(model, dx, dy) {
  return model.map(command => {
    const values = [...command.values];
    for (let index = 0; index < values.length; index += 2) {
      values[index] += dx; values[index + 1] += dy;
    }
    return {type: command.type, values};
  });
}
