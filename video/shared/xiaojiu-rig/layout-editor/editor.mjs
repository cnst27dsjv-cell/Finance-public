import {clone, validateLayout, gestureItem, normalizeAngle, clamp, SCALE_LIMITS} from './geometry.mjs';

export function mountLayoutEditor({stage, toolbar, defaults, projectId, enabled = false, onChange = () => {}, onRender = () => {}, onSelect = () => {}}) {
  const baseline = validateLayout(defaults);
  if (!stage || !projectId || (enabled && !toolbar)) throw new Error('Missing stage, projectId or editor toolbar');
  const doc = stage.ownerDocument;
  const win = doc.defaultView;
  const targets = Array.from(stage.children).filter(node => node.hasAttribute('data-layout-id'));
  const nodes = new Map(targets.map(node => [node.dataset.layoutId, node]));
  if (targets.length !== nodes.size || nodes.size !== baseline.items.length || baseline.items.some(item => !nodes.has(item.id))) throw new Error('Host elements must match layout IDs');
  const key = ['web-layout-editor', 1, projectId, baseline.stage.id, baseline.stage.revision].join(':');
  const controller = new win.AbortController();
  const listen = (target, event, handler) => target.addEventListener(event, handler, {signal: controller.signal});
  const history = [];
  let layout = clone(baseline), selected = null, preview = false, gesture = null;
  let status, picker, panel;

  function announce(message) { if (status) status.textContent = message; }
  function persist() {
    try { win.localStorage.setItem(key, JSON.stringify(layout)); }
    catch { announce('本地保存不可用，请导出配置。'); }
    onChange(clone(layout));
  }
  function render() {
    stage.classList.toggle('wle-editing', enabled && !preview);
    stage.style.aspectRatio = String(baseline.stage.aspectRatio);
    for (const item of layout.items) {
      const node = nodes.get(item.id);
      Object.assign(node.style, {left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`,
        aspectRatio: String(item.aspectRatio), transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`});
      node.classList.toggle('wle-selected', item.id === selected && !preview);
      if (enabled) node.tabIndex = preview ? -1 : 0;
      node.querySelectorAll('[data-wle-handle]').forEach(handle => { handle.hidden = preview || item.id !== selected; });
    }
    if (picker) picker.value = selected || '';
    onRender(clone(layout));
  }
  function choose(id) {
    selected = id && nodes.has(id) ? id : null;
    onSelect(selected);
    render();
  }
  function checkpoint(before) {
    if (JSON.stringify(before) !== JSON.stringify(layout)) {
      history.push(before);
      if (history.length > 40) history.shift();
      persist();
    }
  }
  function finish(cancelled) {
    if (!gesture) return;
    const active = gesture;
    gesture = null;
    if (cancelled) layout = active.before;
    else checkpoint(active.before);
    if (active.node.hasPointerCapture?.(active.pointerId)) active.node.releasePointerCapture(active.pointerId);
    render();
  }
  function importLayout(value) {
    const next = validateLayout(value, baseline);
    finish(true);
    const before = clone(layout);
    layout = next;
    checkpoint(before);
    render();
    announce('配置已载入草稿；导出并接入项目后才会成为正式布局。');
  }
  function button(label, action) {
    const node = doc.createElement('button'); node.type = 'button'; node.textContent = label;
    listen(node, 'click', action); panel.append(node); return node;
  }

  stage.classList.add('wle-stage');
  nodes.forEach(node => node.classList.add('wle-item'));
  if (enabled) {
    panel = doc.createElement('div'); panel.className = 'wle-toolbar'; toolbar.append(panel);
    status = doc.createElement('span'); status.setAttribute('role', 'status');
    status.textContent = '选中部件后拖动；右下圆点缩放，顶部手柄旋转。方向键微移，[ ] 旋转，− / + 缩放。';
    picker = doc.createElement('select'); picker.setAttribute('aria-label', '选择角色部件');
    const empty = doc.createElement('option'); empty.value = ''; empty.textContent = '选择部件'; picker.append(empty);
    baseline.items.forEach(item => { const option = doc.createElement('option'); option.value = item.id; option.textContent = nodes.get(item.id).dataset.layoutLabel || item.id; picker.append(option); });
    listen(picker, 'change', () => { finish(false); choose(picker.value); });
    panel.append(picker);
    button('撤销', () => { finish(true); if (history.length) { layout = history.pop(); persist(); render(); } });
    button('重置位置', () => importLayout(clone(baseline)));
    const previewButton = button('隐藏控制框', () => { finish(false); preview = !preview; previewButton.textContent = preview ? '继续编辑' : '隐藏控制框'; render(); });
    panel.append(status);
    try { const draft = win.localStorage.getItem(key); if (draft) layout = validateLayout(JSON.parse(draft), baseline); }
    catch { announce('旧草稿不匹配或不可读取，已使用项目默认布局。'); }
    for (const [id, node] of nodes) {
      for (const mode of ['scale', 'rotate']) {
        const handle = doc.createElement('button'); handle.type = 'button'; handle.dataset.wleHandle = mode;
        handle.setAttribute('aria-label', `${mode === 'scale' ? '缩放' : '旋转'} ${node.dataset.layoutLabel || id}`);
        handle.textContent = mode === 'scale' ? '↘' : '↻'; node.append(handle);
      }
      listen(node, 'focusin', () => { if (!preview) choose(id); });
      listen(node, 'dragstart', event => event.preventDefault());
      listen(node, 'pointerdown', event => {
        if (preview || event.button !== 0 || gesture) return;
        event.preventDefault(); event.stopPropagation();
        choose(id); node.focus({preventScroll: true});
        const rect = stage.getBoundingClientRect();
        if (!rect.width || !rect.height || !stage.clientWidth || !stage.clientHeight) return;
        gesture = {id, mode: event.target.closest('[data-wle-handle]')?.dataset.wleHandle || 'move',
          start: clone(layout.items.find(item => item.id === id)), before: clone(layout),
          point: {x: event.clientX, y: event.clientY}, rect,
          size: {width: stage.clientWidth, height: stage.clientHeight}, node, pointerId: event.pointerId};
        node.setPointerCapture?.(event.pointerId);
      });
      listen(node, 'lostpointercapture', () => finish(true));
    }
    listen(win, 'pointermove', event => {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      const item = gestureItem(gesture.start, gesture.mode, gesture.point, {x: event.clientX, y: event.clientY}, gesture.rect, gesture.size);
      layout.items = layout.items.map(entry => entry.id === item.id ? item : entry); render();
    });
    listen(win, 'pointerup', event => { if (event.pointerId === gesture?.pointerId) finish(false); });
    listen(win, 'pointercancel', event => { if (event.pointerId === gesture?.pointerId) finish(true); });
    listen(win, 'blur', () => finish(true));
    listen(win, 'resize', () => finish(true));
    listen(stage, 'keydown', event => {
      if (event.key === 'Escape') { finish(true); choose(null); return; }
      if (preview || !selected || gesture) return;
      const before = clone(layout), item = layout.items.find(entry => entry.id === selected), step = event.shiftKey ? 1 : 0.1;
      switch (event.key) {
        case 'ArrowLeft': item.x -= step; break; case 'ArrowRight': item.x += step; break;
        case 'ArrowUp': item.y -= step; break; case 'ArrowDown': item.y += step; break;
        case '[': item.rotation = normalizeAngle(item.rotation - 1); break; case ']': item.rotation = normalizeAngle(item.rotation + 1); break;
        case '-': item.scale = clamp(item.scale - 0.05, ...SCALE_LIMITS); break;
        case '+': case '=': item.scale = clamp(item.scale + 0.05, ...SCALE_LIMITS); break;
        default: return;
      }
      event.preventDefault(); checkpoint(before); render();
    });
  }
  render();
  return {
    getLayout: () => clone(layout),
    importLayout: value => { if (!enabled) throw new Error('Editing is disabled'); importLayout(value); },
    select: id => { if (!enabled) throw new Error('Editing is disabled'); choose(id); },
    destroy() { finish(true); controller.abort(); panel?.remove(); stage.classList.remove('wle-stage', 'wle-editing'); }
  };
}
