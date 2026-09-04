(function attachXiaojiuRig(global) {
  "use strict";

  const ACTIONS = ["idle", "blink", "talk", "teach", "think", "surprise", "nod", "wave"];
  const ASSEMBLY_PRESET_VERSION = 1;
  const ASSEMBLY_ITEM_IDS = Object.freeze([
    "eyes", "eyes-half", "eyes-closed", "glasses",
    "mouth", "mouth-half", "mouth-open", "tie", "feet",
    "left-folded", "left-raised", "right-folded", "right-raised", "right-point", "right-fist"
  ]);
  const ASSEMBLY_ADJUSTMENT_RANGES = Object.freeze({ eyeGap: [72, 120], footGap: [84, 140] });
  const FACE_PRESET_VERSION = 1;
  const FACE_PRESET_RANGES = Object.freeze({
    eyeGap: [72, 120],
    glassesScale: [0.9, 1.25],
    mouthY: [168, 218],
    tieY: [232, 280]
  });
  const DEFAULT_FACE_PRESET = Object.freeze({
    version: FACE_PRESET_VERSION,
    assetVersion: "1.0.0",
    revision: "face-calibration-1",
    eyeGap: 108,
    glassesScale: 1.14,
    mouthY: 178,
    tieY: 252
  });

  function image(id, classes, source, alt = "") {
    return `<img data-hf-id="${id}" class="xj-part ${classes}" src="${source}" alt="${alt}">`;
  }

  function mount(container, options = {}) {
    if (!container) throw new Error("XiaojiuRig.mount requires a container element.");
    const base = options.assetBase || "assets/parts/";
    const prefix = options.idPrefix || "xj01";
    const src = (name) => `${base}${name}`;

    container.classList.add("xj-rig");
    container.dataset.facing = options.facing || "right";
    container.dataset.hfId = `${prefix}-rig`;
    container.innerHTML = `
      <div data-hf-id="${prefix}-shadow" class="xj-shadow"></div>
      <div data-hf-id="${prefix}-breath" class="xj-breath-bone">
        <div data-hf-id="${prefix}-bodybone" class="xj-body-bone">
          ${image(`${prefix}-body`, "xj-body", src("body-clean.png"), "小啾老师")}
          <div data-hf-id="${prefix}-leftwingbone" class="xj-wing-bone xj-left">
            ${image(`${prefix}-leftfolded`, "xj-wing xj-folded xj-left", src("wing-folded-b.png"))}
            ${image(`${prefix}-leftraised`, "xj-wing xj-raised xj-left", src("wing-raised-b.png"))}
          </div>
          <div data-hf-id="${prefix}-rightwingbone" class="xj-wing-bone xj-right">
            ${image(`${prefix}-rightfolded`, "xj-wing xj-folded xj-right", src("wing-folded-a.png"))}
            ${image(`${prefix}-rightraised`, "xj-wing xj-raised xj-right", src("wing-raised-a.png"))}
            ${image(`${prefix}-rightpoint`, "xj-wing xj-point xj-right", src("wing-point.png"))}
            ${image(`${prefix}-rightfist`, "xj-wing xj-fist xj-right", src("wing-fist.png"))}
          </div>
          <div data-hf-id="${prefix}-facebone" class="xj-face-bone">
            <div data-hf-id="${prefix}-eyesopen" class="xj-eye-state xj-open">
              ${image(`${prefix}-eyesopenleft`, "xj-eye xj-left", src("eyes-open-left.png"))}
              ${image(`${prefix}-eyesopenright`, "xj-eye xj-right", src("eyes-open-right.png"))}
            </div>
            <div data-hf-id="${prefix}-eyeshalf" class="xj-eye-state xj-half">
              ${image(`${prefix}-eyeshalfleft`, "xj-eye xj-left", src("eyes-half-left.png"))}
              ${image(`${prefix}-eyeshalfright`, "xj-eye xj-right", src("eyes-half-right.png"))}
            </div>
            <div data-hf-id="${prefix}-eyesclosed" class="xj-eye-state xj-closed">
              ${image(`${prefix}-eyesclosedleft`, "xj-eye xj-left", src("eyes-closed-left.png"))}
              ${image(`${prefix}-eyesclosedright`, "xj-eye xj-right", src("eyes-closed-right.png"))}
            </div>
            ${image(`${prefix}-glasses`, "xj-glasses", src("glasses.png"))}
            <div data-hf-id="${prefix}-mouthgroup" class="xj-mouth-group">
              ${image(`${prefix}-mouthclosed`, "xj-mouth xj-closed", src("mouth-closed.png"))}
              ${image(`${prefix}-mouthhalf`, "xj-mouth xj-half", src("mouth-half.png"))}
              ${image(`${prefix}-mouthopen`, "xj-mouth xj-open", src("mouth-open.png"))}
            </div>
          </div>
          <div data-hf-id="${prefix}-tiebone" class="xj-tie-bone">
            ${image(`${prefix}-tie`, "xj-tie", src("tie.png"))}
          </div>
          <div data-hf-id="${prefix}-feet" class="xj-foot-bone">
            ${image(`${prefix}-leftfoot`, "xj-foot xj-left", src("foot-left.png"))}
            ${image(`${prefix}-rightfoot`, "xj-foot xj-right", src("foot-right.png"))}
          </div>
          <div data-hf-id="${prefix}-pointer" class="xj-pointer"></div>
          <div data-hf-id="${prefix}-spark" class="xj-spark"></div>
        </div>
      </div>`;

    const rig = {
      root: container,
      shadow: container.querySelector(".xj-shadow"),
      breath: container.querySelector(".xj-breath-bone"),
      body: container.querySelector(".xj-body-bone"),
      face: container.querySelector(".xj-face-bone"),
      tie: container.querySelector(".xj-tie-bone"),
      tieImage: container.querySelector(".xj-tie"),
      feet: container.querySelector(".xj-foot-bone"),
      leftWing: container.querySelector(".xj-wing-bone.xj-left"),
      rightWing: container.querySelector(".xj-wing-bone.xj-right"),
      leftFolded: container.querySelector(".xj-wing.xj-folded.xj-left"),
      rightFolded: container.querySelector(".xj-wing.xj-folded.xj-right"),
      leftRaised: container.querySelector(".xj-wing.xj-raised.xj-left"),
      rightRaised: container.querySelector(".xj-wing.xj-raised.xj-right"),
      rightPoint: container.querySelector(".xj-wing.xj-point"),
      rightFist: container.querySelector(".xj-wing.xj-fist"),
      eyesOpen: container.querySelector(".xj-eye-state.xj-open"),
      eyesHalf: container.querySelector(".xj-eye-state.xj-half"),
      eyesClosed: container.querySelector(".xj-eye-state.xj-closed"),
      glasses: container.querySelector(".xj-glasses"),
      mouthGroup: container.querySelector(".xj-mouth-group"),
      mouthClosed: container.querySelector(".xj-mouth.xj-closed"),
      mouthHalf: container.querySelector(".xj-mouth.xj-half"),
      mouthOpen: container.querySelector(".xj-mouth.xj-open"),
      pointer: container.querySelector(".xj-pointer"),
      spark: container.querySelector(".xj-spark")
    };
    if (options.assemblyPreset) applyAssemblyPreset(rig, options.assemblyPreset);
    else applyFacePreset(rig, options.facePreset || DEFAULT_FACE_PRESET);
    reset(rig);
    return rig;
  }

  function validateFacePreset(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new Error("Face preset must be a JSON object.");
    }
    if (Number(input.version) !== FACE_PRESET_VERSION) {
      throw new Error(`Unsupported face preset version: ${input.version}`);
    }
    const preset = {
      version: FACE_PRESET_VERSION,
      assetVersion: String(input.assetVersion || DEFAULT_FACE_PRESET.assetVersion),
      revision: String(input.revision || DEFAULT_FACE_PRESET.revision),
      eyeGap: Number(input.eyeGap),
      glassesScale: Number(input.glassesScale),
      mouthY: Number(input.mouthY),
      tieY: Number(input.tieY)
    };
    Object.entries(FACE_PRESET_RANGES).forEach(([key, [min, max]]) => {
      if (!Number.isFinite(preset[key]) || preset[key] < min || preset[key] > max) {
        throw new Error(`${key} must be between ${min} and ${max}.`);
      }
    });
    return preset;
  }

  async function loadFacePreset(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Unable to load face preset: ${response.status} ${response.statusText}`);
    }
    return validateFacePreset(await response.json());
  }

  function applyFacePreset(rig, input) {
    if (!rig || !rig.root) throw new Error("applyFacePreset requires a mounted Xiaojiu rig.");
    const preset = validateFacePreset({ ...DEFAULT_FACE_PRESET, ...input });
    const eyeSize = 95;
    const leftEyeX = 300 - preset.eyeGap / 2 - eyeSize / 2;
    const rightEyeX = 300 + preset.eyeGap / 2 - eyeSize / 2;
    rig.root.style.setProperty("--xj-eye-left-x", `${leftEyeX}px`);
    rig.root.style.setProperty("--xj-eye-right-x", `${rightEyeX}px`);
    rig.root.style.setProperty("--xj-glasses-scale", String(preset.glassesScale));
    rig.root.style.setProperty("--xj-mouth-y", `${preset.mouthY}px`);
    rig.root.style.setProperty("--xj-tie-y", `${preset.tieY}px`);
    rig.root.dataset.facePresetRevision = preset.revision;
    rig.facePreset = { ...preset };
    return { ...preset };
  }

  function getFacePreset(rig) {
    if (!rig || !rig.facePreset) throw new Error("getFacePreset requires a mounted Xiaojiu rig.");
    return { ...rig.facePreset };
  }

  function validateAssemblyPreset(input) {
    if (!input || typeof input !== "object" || Array.isArray(input) || Number(input.version) !== ASSEMBLY_PRESET_VERSION) {
      throw new Error("Unsupported Xiaojiu assembly preset.");
    }
    const layout = input.layout;
    if (!layout || Number(layout.version) !== 1 || !layout.stage || !Array.isArray(layout.items) ||
        layout.stage.id !== "xiaojiu-rig-assembly" || layout.stage.anchor !== "center" ||
        layout.stage.units !== "percent" || layout.stage.revision !== String(input.revision)) {
      throw new Error("Assembly layout belongs to a different stage or revision.");
    }
    const ids = new Set();
    layout.items.forEach((item) => {
      if (!item || !ASSEMBLY_ITEM_IDS.includes(item.id) || ids.has(item.id)) throw new Error("Invalid or duplicate assembly item.");
      ids.add(item.id);
      ["x", "y", "width", "aspectRatio", "scale", "rotation"].forEach((key) => {
        if (!Number.isFinite(Number(item[key]))) throw new Error(`Invalid ${item.id}.${key}.`);
      });
      if (Number(item.width) <= 0 || Number(item.aspectRatio) <= 0 || Number(item.scale) < 0.2 || Number(item.scale) > 4) {
        throw new Error(`Invalid geometry for ${item.id}.`);
      }
    });
    if (ids.size !== ASSEMBLY_ITEM_IDS.length || ASSEMBLY_ITEM_IDS.some((id) => !ids.has(id))) {
      throw new Error("Assembly preset is missing editable parts.");
    }
    const adjustments = {};
    Object.entries(ASSEMBLY_ADJUSTMENT_RANGES).forEach(([key, [min, max]]) => {
      const value = Number(input.adjustments?.[key]);
      if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${key} must be between ${min} and ${max}.`);
      adjustments[key] = value;
    });
    return {
      version: ASSEMBLY_PRESET_VERSION,
      assetVersion: String(input.assetVersion || "1.2.0"),
      revision: String(input.revision),
      layout: JSON.parse(JSON.stringify(layout)),
      adjustments
    };
  }

  async function loadAssemblyPreset(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to load assembly preset: ${response.status} ${response.statusText}`);
    return validateAssemblyPreset(await response.json());
  }

  function setAssemblyBox(node, item, mirror = false) {
    const width = Number(item.width) / 100 * 600;
    const height = width / Number(item.aspectRatio);
    Object.assign(node.style, {
      left: `${Number(item.x) / 100 * 600 - width / 2}px`,
      top: `${Number(item.y) / 100 * 560 - height / 2}px`,
      right: "auto",
      bottom: "auto",
      width: `${width}px`,
      height: `${height}px`,
      transformOrigin: "50% 50%",
      transform: `rotate(${Number(item.rotation)}deg) scale(${Number(item.scale)})${mirror ? " scaleX(-1)" : ""}`
    });
  }

  function applyAssemblyPreset(rig, input) {
    if (!rig || !rig.root) throw new Error("applyAssemblyPreset requires a mounted Xiaojiu rig.");
    const preset = validateAssemblyPreset(input);
    const items = Object.fromEntries(preset.layout.items.map((item) => [item.id, item]));
    const eyeStates = [
      [rig.eyesOpen, items.eyes],
      [rig.eyesHalf, items["eyes-half"]],
      [rig.eyesClosed, items["eyes-closed"]]
    ];
    const eyeWidth = 95;
    eyeStates.forEach(([node, item]) => {
      setAssemblyBox(node, item);
      const eyeBoxWidth = Number(item.width) / 100 * 600;
      const leftEye = (eyeBoxWidth / 2 - preset.adjustments.eyeGap / 2 - eyeWidth / 2) / eyeBoxWidth * 100;
      const rightEye = (eyeBoxWidth / 2 + preset.adjustments.eyeGap / 2 - eyeWidth / 2) / eyeBoxWidth * 100;
      node.style.setProperty("--xj-eye-left-percent", `${leftEye}%`);
      node.style.setProperty("--xj-eye-right-percent", `${rightEye}%`);
      node.style.setProperty("--xj-eye-width-percent", `${eyeWidth / eyeBoxWidth * 100}%`);
    });

    setAssemblyBox(rig.glasses, items.glasses);
    setAssemblyBox(rig.mouthClosed, items.mouth);
    setAssemblyBox(rig.mouthHalf, items["mouth-half"]);
    setAssemblyBox(rig.mouthOpen, items["mouth-open"]);
    setAssemblyBox(rig.tieImage, items.tie);
    setAssemblyBox(rig.feet, items.feet);
    const feetBoxWidth = Number(items.feet.width) / 100 * 600;
    const footWidth = 68;
    const leftFoot = (feetBoxWidth / 2 - preset.adjustments.footGap / 2 - footWidth / 2) / feetBoxWidth * 100;
    const rightFoot = (feetBoxWidth / 2 + preset.adjustments.footGap / 2 - footWidth / 2) / feetBoxWidth * 100;
    rig.root.style.setProperty("--xj-foot-left-percent", `${leftFoot}%`);
    rig.root.style.setProperty("--xj-foot-right-percent", `${rightFoot}%`);
    rig.root.style.setProperty("--xj-foot-width-percent", `${footWidth / feetBoxWidth * 100}%`);

    setAssemblyBox(rig.leftFolded, items["left-folded"]);
    setAssemblyBox(rig.leftRaised, items["left-raised"], true);
    setAssemblyBox(rig.rightFolded, items["right-folded"]);
    setAssemblyBox(rig.rightRaised, items["right-raised"]);
    setAssemblyBox(rig.rightPoint, items["right-point"]);
    setAssemblyBox(rig.rightFist, items["right-fist"]);
    rig.leftWing.style.transformOrigin = `${items["left-folded"].x}% ${items["left-folded"].y}%`;
    rig.rightWing.style.transformOrigin = `${items["right-folded"].x}% ${items["right-folded"].y}%`;
    rig.assemblyPreset = preset;
    rig.assemblyItems = items;
    rig.root.dataset.assemblyRevision = preset.revision;
    return JSON.parse(JSON.stringify(preset));
  }

  function getAssemblyPreset(rig) {
    if (!rig?.assemblyPreset) throw new Error("getAssemblyPreset requires an assembled Xiaojiu rig.");
    return JSON.parse(JSON.stringify(rig.assemblyPreset));
  }

  function reset(rig) {
    if (!global.gsap) throw new Error("XiaojiuRig requires GSAP.");
    gsap.set([rig.root, rig.breath, rig.body, rig.face, rig.tie, rig.leftWing, rig.rightWing], {
      x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1
    });
    gsap.set(rig.shadow, { scaleX: 1, opacity: 1 });
    gsap.set([rig.leftFolded, rig.rightFolded, rig.eyesOpen, rig.mouthClosed], { autoAlpha: 1 });
    gsap.set([
      rig.leftRaised, rig.rightRaised, rig.rightPoint, rig.rightFist,
      rig.eyesHalf, rig.eyesClosed, rig.mouthHalf, rig.mouthOpen,
      rig.pointer, rig.spark
    ], { autoAlpha: 0 });
    return rig;
  }

  function setEyes(timeline, rig, state, at) {
    timeline.set([rig.eyesOpen, rig.eyesHalf, rig.eyesClosed], { autoAlpha: 0 }, at);
    timeline.set(rig[state === "half" ? "eyesHalf" : state === "closed" ? "eyesClosed" : "eyesOpen"], { autoAlpha: 1 }, at);
  }

  function setMouth(timeline, rig, state, at) {
    timeline.set([rig.mouthClosed, rig.mouthHalf, rig.mouthOpen], { autoAlpha: 0 }, at);
    timeline.set(rig[state === "half" ? "mouthHalf" : state === "open" ? "mouthOpen" : "mouthClosed"], { autoAlpha: 1 }, at);
  }

  function setWings(timeline, rig, left, right, at) {
    timeline.set([rig.leftFolded, rig.leftRaised], { autoAlpha: 0 }, at);
    timeline.set([rig.rightFolded, rig.rightRaised, rig.rightPoint, rig.rightFist], { autoAlpha: 0 }, at);
    timeline.set(left === "raised" ? rig.leftRaised : rig.leftFolded, { autoAlpha: 1 }, at);
    const rightTarget = right === "raised" ? rig.rightRaised : right === "point" ? rig.rightPoint : right === "fist" ? rig.rightFist : rig.rightFolded;
    timeline.set(rightTarget, { autoAlpha: 1 }, at);
    if (rig.assemblyItems) {
      const leftItem = rig.assemblyItems[left === "raised" ? "left-raised" : "left-folded"];
      const rightId = right === "raised" ? "right-raised" : right === "point" ? "right-point" : right === "fist" ? "right-fist" : "right-folded";
      const rightItem = rig.assemblyItems[rightId];
      timeline.set(rig.leftWing, { transformOrigin: `${leftItem.x}% ${leftItem.y}%` }, at);
      timeline.set(rig.rightWing, { transformOrigin: `${rightItem.x}% ${rightItem.y}%` }, at);
    }
  }

  function idle(timeline, rig, at, duration = 4) {
    const half = Math.max(0.55, duration / 4);
    timeline.fromTo(rig.breath,
      { y: 0, scaleY: 1, scaleX: 1 },
      { y: -8, scaleY: 1.012, scaleX: 0.994, duration: half, repeat: 3, yoyo: true, ease: "sine.inOut", immediateRender: false }, at);
    timeline.fromTo(rig.tie,
      { y: 0, rotation: -1 },
      { y: 5, rotation: 1.4, duration: half, repeat: 3, yoyo: true, ease: "sine.inOut", immediateRender: false }, at + 0.08);
    timeline.fromTo(rig.shadow,
      { scaleX: 1, opacity: 0.86 },
      { scaleX: 0.93, opacity: 0.64, duration: half, repeat: 3, yoyo: true, ease: "sine.inOut", immediateRender: false }, at);
  }

  function blink(timeline, rig, at) {
    setEyes(timeline, rig, "half", at + 0.1);
    setEyes(timeline, rig, "closed", at + 0.18);
    setEyes(timeline, rig, "half", at + 0.29);
    setEyes(timeline, rig, "open", at + 0.38);
    setEyes(timeline, rig, "closed", at + 1.05);
    setEyes(timeline, rig, "open", at + 1.2);
  }

  function talk(timeline, rig, at, duration = 3.2) {
    const states = ["half", "open", "half", "closed", "open", "half", "open", "closed", "half", "open", "half", "closed"];
    const step = duration / states.length;
    states.forEach((state, index) => setMouth(timeline, rig, state, at + index * step));
    timeline.to(rig.face, { y: -3, duration: step, repeat: states.length - 2, yoyo: true, ease: "sine.inOut" }, at);
    setMouth(timeline, rig, "closed", at + duration);
  }

  function teach(timeline, rig, at, duration = 3.5) {
    setWings(timeline, rig, "folded", "point", at);
    timeline.fromTo(rig.rightWing, { rotation: 18, x: -15, y: 12 }, { rotation: 0, x: 0, y: 0, duration: 0.48, ease: "back.out(1.7)", immediateRender: false }, at);
    timeline.fromTo(rig.pointer, { autoAlpha: 0, rotation: 24, scaleY: 0.72 }, { autoAlpha: 1, rotation: 36, scaleY: 1, duration: 0.42, ease: "power3.out", immediateRender: false }, at + 0.18);
    timeline.to(rig.rightWing, { rotation: -5, duration: 0.42, yoyo: true, repeat: 3, ease: "sine.inOut" }, at + 0.7);
    timeline.fromTo(rig.spark, { autoAlpha: 0, scale: 0.3, rotation: -15 }, { autoAlpha: 1, scale: 1, rotation: 18, duration: 0.35, ease: "back.out(2)", immediateRender: false }, at + 1.1);
    timeline.to(rig.spark, { autoAlpha: 0, scale: 1.5, duration: 0.5, ease: "power2.out" }, at + 2.1);
    timeline.to(rig.pointer, { autoAlpha: 0, duration: 0.25 }, at + duration - 0.3);
    setWings(timeline, rig, "folded", "folded", at + duration);
    timeline.set(rig.rightWing, { clearProps: "transform" }, at + duration);
  }

  function think(timeline, rig, at, duration = 3.4) {
    setWings(timeline, rig, "folded", "fist", at);
    setEyes(timeline, rig, "half", at + 0.2);
    timeline.to(rig.body, { rotation: -4, x: -9, duration: 0.52, ease: "power3.out" }, at);
    timeline.fromTo(rig.rightWing, { rotation: 22, x: 16, y: 18 }, { rotation: -8, x: -5, y: -6, duration: 0.65, ease: "back.out(1.5)", immediateRender: false }, at + 0.08);
    timeline.to(rig.face, { x: -8, y: -3, rotation: -2, duration: 0.48, ease: "power2.out" }, at + 0.18);
    timeline.to(rig.rightWing, { y: -12, duration: 0.72, repeat: 2, yoyo: true, ease: "sine.inOut" }, at + 0.82);
    timeline.to([rig.body, rig.face, rig.rightWing], { x: 0, y: 0, rotation: 0, duration: 0.5, ease: "power2.inOut" }, at + duration - 0.5);
    setEyes(timeline, rig, "open", at + duration - 0.38);
    setWings(timeline, rig, "folded", "folded", at + duration);
  }

  function surprise(timeline, rig, at, duration = 3.2) {
    setWings(timeline, rig, "raised", "raised", at);
    setMouth(timeline, rig, "open", at);
    timeline.fromTo(rig.body,
      { y: 12, scaleX: 1.06, scaleY: 0.9 },
      { y: -28, scaleX: 0.94, scaleY: 1.1, duration: 0.34, ease: "back.out(2.2)", immediateRender: false }, at);
    timeline.fromTo(rig.leftWing, { rotation: 22, x: 15 }, { rotation: -15, x: -8, duration: 0.38, ease: "back.out(1.8)", immediateRender: false }, at);
    timeline.fromTo(rig.rightWing, { rotation: -22, x: -15 }, { rotation: 15, x: 8, duration: 0.38, ease: "back.out(1.8)", immediateRender: false }, at);
    timeline.to(rig.body, { y: 0, scaleX: 1, scaleY: 1, duration: 0.75, ease: "bounce.out" }, at + 0.35);
    timeline.to([rig.leftWing, rig.rightWing], { rotation: 0, x: 0, duration: 0.55, ease: "power2.out" }, at + 0.75);
    timeline.to(rig.face, { rotation: 2.4, duration: 0.28, repeat: 3, yoyo: true, ease: "sine.inOut" }, at + 1.05);
    setMouth(timeline, rig, "closed", at + duration - 0.35);
    setWings(timeline, rig, "folded", "folded", at + duration);
  }

  function nod(timeline, rig, at, duration = 3) {
    timeline.to(rig.face, { y: 13, rotation: 1.8, duration: 0.28, repeat: 3, yoyo: true, ease: "power2.inOut" }, at + 0.15);
    timeline.to(rig.tie, { rotation: -4, y: 7, duration: 0.28, repeat: 3, yoyo: true, ease: "power2.inOut" }, at + 0.24);
    setEyes(timeline, rig, "closed", at + 0.45);
    setEyes(timeline, rig, "open", at + 0.72);
    timeline.set([rig.face, rig.tie], { clearProps: "transform" }, at + duration);
  }

  function wave(timeline, rig, at, duration = 3.6) {
    setWings(timeline, rig, "folded", "raised", at);
    timeline.fromTo(rig.rightWing, { rotation: -26, x: -5, y: 18 }, { rotation: 4, x: 0, y: -5, duration: 0.48, ease: "back.out(1.8)", immediateRender: false }, at);
    timeline.to(rig.rightWing, { rotation: -18, duration: 0.28, repeat: 5, yoyo: true, ease: "sine.inOut" }, at + 0.52);
    timeline.to(rig.body, { rotation: 2.2, x: 5, duration: 0.42, repeat: 3, yoyo: true, ease: "sine.inOut" }, at + 0.6);
    setEyes(timeline, rig, "closed", at + 0.9);
    setEyes(timeline, rig, "open", at + 1.15);
    timeline.to([rig.rightWing, rig.body], { rotation: 0, x: 0, y: 0, duration: 0.42, ease: "power2.inOut" }, at + duration - 0.45);
    setWings(timeline, rig, "folded", "folded", at + duration);
  }

  function addAction(timeline, rig, name, options = {}) {
    if (!timeline || !rig) throw new Error("XiaojiuRig.addAction requires a GSAP timeline and mounted rig.");
    if (!ACTIONS.includes(name)) throw new Error(`Unknown Xiaojiu action: ${name}`);
    const at = Number(options.at || 0);
    const duration = Number(options.duration || ({ idle: 4, blink: 1.4, talk: 3.2, teach: 3.5, think: 3.4, surprise: 3.2, nod: 3, wave: 3.6 }[name]));
    ({ idle, blink, talk, teach, think, surprise, nod, wave }[name])(timeline, rig, at, duration);
    return timeline;
  }

  global.XiaojiuRig = Object.freeze({
    ACTIONS,
    ASSEMBLY_ITEM_IDS,
    ASSEMBLY_ADJUSTMENT_RANGES,
    FACE_PRESET_RANGES,
    DEFAULT_FACE_PRESET,
    mount,
    reset,
    addAction,
    validateFacePreset,
    loadFacePreset,
    applyFacePreset,
    getFacePreset,
    validateAssemblyPreset,
    loadAssemblyPreset,
    applyAssemblyPreset,
    getAssemblyPreset
  });
})(window);
