# 小啾老师轻量骨骼资产

这套资产把小啾老师拆成身体、左右翅膀、眼睛、嘴、领带、脚和教鞭。动作由 GSAP 时间线驱动，可在 HyperFrames 预览、检查和渲染，也可直接用于普通网页动画。

## 已沉淀动作

- `idle`：呼吸与轻微重心变化
- `blink`：双段眨眼
- `talk`：闭嘴、半开、张嘴循环
- `teach`：伸翅、教鞭、强调闪光
- `think`：歪头、半眯眼、托腮式翅膀
- `surprise`：预备压缩、跳起、双翅展开
- `nod`：点头与领带跟随
- `wave`：抬翅挥手并眨眼

所有动作均为有限时长、可定位播放的时间线，不使用随机数、定时器或无限循环。

## 使用

```html
<link rel="stylesheet" href="/path/to/xiaojiu-rig.css">
<div id="xiaojiu"></div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script src="/path/to/xiaojiu-rig.js"></script>
<script>
  const assemblyPreset = await XiaojiuRig.loadAssemblyPreset("/path/to/assets/xiaojiu-assembly-preset.json");
  const rig = XiaojiuRig.mount(document.querySelector("#xiaojiu"), {
    assetBase: "/path/to/assets/parts/",
    idPrefix: "lesson01-xiaojiu",
    assemblyPreset
  });
  const timeline = gsap.timeline({ paused: true });
  XiaojiuRig.addAction(timeline, rig, "teach", { at: 0, duration: 3.5 });
</script>
```

同一画面放多个小啾时，为每个实例提供不同的 `idPrefix`。需要朝左时传入 `facing: "left"`。

## 角色装配台

打开 `tune.html`，可以直接选择并拖动睁眼、半闭眼、闭眼、眼镜、闭嘴、半张嘴、全张嘴、领带、爪子组，以及左右翅膀的每种姿势。每个状态支持独立移动、等比缩放、旋转、键盘微调和撤销；三种眼睛状态共享眼睛间距，爪子另有间距控制。草稿只保存在当前浏览器，不会自动进入课程渲染。

左右翅膀使用独立素材：画面左侧收拢使用 `wing-folded-b.png`，画面右侧收拢使用 `wing-folded-a.png`。抬起、指示和握拳姿势拥有独立装配参数和动作根部。

代码中可随时重新应用完整装配预设：

```js
XiaojiuRig.applyAssemblyPreset(rig, assemblyPreset);
```

## 文件说明

- `assets/source/`：原始图、裁切源图和非破坏性中间稿
- `assets/parts/`：可直接使用的透明 PNG 部件
- `xiaojiu-rig.css`：骨骼层级与部件定位
- `xiaojiu-rig.js`：挂载 API 和动作库
- `assets/xiaojiu-assembly-preset.json`：正式装配位置、缩放、旋转和成对间距
- `layout-editor/`：直接拖拽编辑器及几何测试
- `demo/`：32 秒动作验收片

图像编辑底稿使用的最终提示词：

> Edit only the supplied Xiaojiu teacher body sprite. Remove both folded wings, the beak, and both feet. Fill only those removed regions with continuous matching fluffy white watercolor plumage. Preserve the exact body silhouette, tail, proportions, watercolor texture, shading and placement. Keep a genuinely transparent background. Add no face, glasses, tie, wings, feet, text, props, scenery or watermark.
