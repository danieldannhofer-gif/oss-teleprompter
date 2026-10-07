(() => {
'use strict';

const PT = 12700;                       // EMU per CSS pixel (1 px == 1 pt on the stage)
const EASE = 'cubic-bezier(.4,0,.2,1)';
const FONT = '"Aptos","Segoe UI Variable Text","Segoe UI",system-ui,sans-serif';
const FONT_DISPLAY = '"Aptos Display","Segoe UI Variable Display","Segoe UI Semibold","Segoe UI",system-ui,sans-serif';
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' };
const DASH = { dash: 'dashed', sysDash: 'dashed', lgDash: 'dashed', dashDot: 'dashed', dot: 'dotted', sysDot: 'dotted' };
const warned = new Set();
const warn = (msg) => { if (!warned.has(msg)) { warned.add(msg); console.warn('[player] ' + msg); } };

// ------------------------------------------------------------------ XML helpers
const kid = (el, n) => { if (!el) return null; for (const c of el.children) if (c.nodeName === n) return c; return null; };
const kids = (el, n) => el ? Array.from(el.children).filter((c) => c.nodeName === n) : [];
const at = (el, n, d = null) => (el && el.hasAttribute(n)) ? el.getAttribute(n) : d;
const num = (el, n, d = 0) => { const v = at(el, n); return v === null ? d : parseFloat(v); };

function parseXml(str) {
  const d = new DOMParser().parseFromString(str, 'application/xml');
  if (d.getElementsByTagName('parsererror').length) throw new Error('XML parse error');
  return d;
}

function resolvePath(baseFile, target) {
  if (target.startsWith('/')) return target.slice(1);
  const parts = baseFile.split('/'); parts.pop();
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop(); else if (seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}

function parseRels(xmlStr, baseFile) {
  const map = {};
  for (const r of parseXml(xmlStr).getElementsByTagName('Relationship')) {
    map[r.getAttribute('Id')] = { path: resolvePath(baseFile, r.getAttribute('Target')), type: r.getAttribute('Type') };
  }
  return map;
}

// ------------------------------------------------------------------ colours, fills, effects
function parseColor(holder) {
  const c = kid(holder, 'a:srgbClr');
  if (!c) { warn('only srgbClr colours are supported'); return { r: 128, g: 128, b: 128, a: 1 }; }
  const hex = c.getAttribute('val');
  const al = kid(c, 'a:alpha');
  return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16), a: al ? num(al, 'val') / 100000 : 1 };
}
const rgba = (c) => `rgba(${c.r},${c.g},${c.b},${+c.a.toFixed(4)})`;
const TRANSPARENT = 'rgba(0,0,0,0)';

function parseGradient(g) {
  const stops = kids(kid(g, 'a:gsLst'), 'a:gs').map((s) => `${rgba(parseColor(s))} ${num(s, 'pos') / 1000}%`);
  if (kid(g, 'a:path')) return { kind: 'grad', css: `radial-gradient(ellipse closest-side at 50% 50%, ${stops.join(',')})` };
  const lin = kid(g, 'a:lin');
  const ang = lin ? num(lin, 'ang') / 60000 : 0;
  return { kind: 'grad', css: `linear-gradient(${ang + 90}deg, ${stops.join(',')})` };
}

function parseFill(holder) {
  if (!holder) return { kind: 'none' };
  for (const c of holder.children) {
    if (c.nodeName === 'a:noFill') return { kind: 'none' };
    if (c.nodeName === 'a:solidFill') return { kind: 'solid', color: parseColor(c) };
    if (c.nodeName === 'a:gradFill') return parseGradient(c);
  }
  return { kind: 'none' };
}

function parseLine(spPr) {
  const ln = kid(spPr, 'a:ln');
  if (!ln) return null;
  const f = kid(ln, 'a:solidFill');
  if (!f) return null;
  const w = num(ln, 'w', 12700) / PT;
  if (w <= 0) return null;
  const dash = at(kid(ln, 'a:prstDash'), 'val');
  return { w, color: parseColor(f), style: DASH[dash] || 'solid' };
}

function parseShadow(spPr) {
  const s = kid(kid(spPr, 'a:effectLst'), 'a:outerShdw');
  if (!s) return null;
  const dist = num(s, 'dist') / PT, dir = num(s, 'dir') / 60000 * Math.PI / 180;
  return { dx: dist * Math.cos(dir), dy: dist * Math.sin(dir), blur: num(s, 'blurRad') / PT, color: parseColor(s) };
}

// ------------------------------------------------------------------ slide model
function parseText(sp) {
  const tx = kid(sp, 'p:txBody');
  if (!tx) return null;
  const bp = kid(tx, 'a:bodyPr');
  const paras = kids(tx, 'a:p').map((p) => {
    const pPr = kid(p, 'a:pPr');
    const ln = kid(kid(pPr, 'a:lnSpc'), 'a:spcPct');
    const para = { algn: at(pPr, 'algn', 'l'), lh: ln ? num(ln, 'val') / 100000 : 1, runs: [], endSz: num(kid(p, 'a:endParaRPr'), 'sz', 1800) / 100 };
    for (const r of p.children) {
      if (r.nodeName === 'a:br') { para.runs.push({ br: true }); continue; }
      if (r.nodeName !== 'a:r') continue;
      const rPr = kid(r, 'a:rPr');
      const fill = kid(rPr, 'a:solidFill');
      const tEl = kid(r, 'a:t');
      para.runs.push({
        t: tEl ? tEl.textContent : '',
        sz: num(rPr, 'sz', 1800) / 100,
        b: at(rPr, 'b') === '1', i: at(rPr, 'i') === '1',
        spc: num(rPr, 'spc') / 100,
        color: fill ? parseColor(fill) : { r: 0, g: 0, b: 0, a: 1 },
        font: at(kid(rPr, 'a:latin'), 'typeface', 'Aptos'),
      });
    }
    return para;
  });
  const hasText = paras.some((p) => p.runs.some((r) => r.br || r.t));
  return {
    hasText, paras,
    ins: { l: num(bp, 'lIns', 91440) / PT, t: num(bp, 'tIns', 45720) / PT, r: num(bp, 'rIns', 91440) / PT, b: num(bp, 'bIns', 45720) / PT },
    anchor: at(bp, 'anchor', 't'), wrap: at(bp, 'wrap', 'square'),
  };
}

async function parseShape(el, ctx) {
  const isPic = el.nodeName === 'p:pic';
  const nv = kid(el, isPic ? 'p:nvPicPr' : 'p:nvSpPr');
  const name = at(kid(nv, 'p:cNvPr'), 'name', '');
  const spPr = kid(el, 'p:spPr');
  const xfrm = kid(spPr, 'a:xfrm');
  if (!xfrm) { warn(`shape "${name}" has no transform, skipped`); return null; }
  const off = kid(xfrm, 'a:off'), ext = kid(xfrm, 'a:ext');
  const geomEl = kid(spPr, 'a:prstGeom');
  if (!geomEl) warn('custom geometry is not supported yet, drawn as rectangle');
  const adjEl = kids(kid(geomEl, 'a:avLst'), 'a:gd').find((g) => g.getAttribute('name') === 'adj');
  const m = {
    kind: isPic ? 'pic' : 'sp', name,
    x: num(off, 'x') / PT, y: num(off, 'y') / PT, w: num(ext, 'cx') / PT, h: num(ext, 'cy') / PT,
    rot: num(xfrm, 'rot') / 60000, flipH: at(xfrm, 'flipH') === '1', flipV: at(xfrm, 'flipV') === '1',
    prst: at(geomEl, 'prst', 'rect'),
    adj: adjEl ? parseFloat(at(adjEl, 'fmla', 'val 16667').replace('val', '')) : 16667,
    fill: isPic ? { kind: 'none' } : parseFill(spPr),
    ln: parseLine(spPr), shadow: parseShadow(spPr),
    text: isPic ? null : parseText(el),
    pic: null,
  };
  const se = kid(kid(spPr, 'a:effectLst'), 'a:softEdge');
  m.soft = se ? num(se, 'rad') / PT : 0;
  if (isPic) {
    const bf = kid(el, 'p:blipFill');
    const blip = kid(bf, 'a:blip');
    const rel = ctx.rels[at(blip, 'r:embed')];
    const src = rel ? await ctx.media(rel.path) : null;
    const sr = kid(bf, 'a:srcRect');
    const am = kid(blip, 'a:alphaModFix');
    m.pic = {
      url: src ? src.url : '', png: src ? src.png : false,
      crop: { l: num(sr, 'l') / 100000, t: num(sr, 't') / 100000, r: num(sr, 'r') / 100000, b: num(sr, 'b') / 100000 },
      alpha: am ? num(am, 'amt') / 100000 : 1,
    };
  }
  return m;
}

function parseTransition(doc) {
  const morph = doc.getElementsByTagName('p159:morph')[0];
  const t = morph ? morph.parentNode : doc.getElementsByTagName('p:transition')[0];
  if (!t) return { type: 'cut' };
  const adv = at(t, 'advTm');
  const base = { advTm: adv === null ? null : parseFloat(adv), advClick: at(t, 'advClick') !== '0' };
  const dur = at(t, 'p14:dur');
  if (morph) return { ...base, type: 'morph', dur: dur ? parseFloat(dur) : 1000 };
  if (kid(t, 'p:cut')) return { ...base, type: 'cut' };
  if (!kid(t, 'p:fade')) warn('unsupported transition, using fade');
  return { ...base, type: 'fade', dur: dur ? parseFloat(dur) : 700 };
}

async function parseBackground(doc, ctx) {
  const bgPr = kid(kid(kid(doc.documentElement, 'p:cSld'), 'p:bg'), 'p:bgPr');
  if (!bgPr) return { kind: 'solid', color: { r: 0, g: 0, b: 0, a: 1 } };
  const blip = kid(kid(bgPr, 'a:blipFill'), 'a:blip');
  if (blip) {
    const rel = ctx.rels[at(blip, 'r:embed')];
    const src = rel ? await ctx.media(rel.path) : null;
    return { kind: 'image', url: src ? src.url : '' };
  }
  const f = parseFill(bgPr);
  return f.kind === 'none' ? { kind: 'solid', color: { r: 0, g: 0, b: 0, a: 1 } } : f;
}

async function parseSlide(zip, path, media) {
  const relPath = path.replace('slides/', 'slides/_rels/') + '.rels';
  const rels = zip.file(relPath) ? parseRels(await zip.file(relPath).async('string'), path) : {};
  const doc = parseXml(await zip.file(path).async('string'));
  const ctx = { rels, media };
  const tree = kid(kid(doc.documentElement, 'p:cSld'), 'p:spTree');
  const shapes = [];
  for (const el of tree.children) {
    if (el.nodeName === 'p:sp' || el.nodeName === 'p:pic') {
      const m = await parseShape(el, ctx);
      if (m) shapes.push(m);
    } else if (/^p:(grpSp|cxnSp|graphicFrame)$/.test(el.nodeName)) {
      warn(`${el.nodeName} is not supported yet`);
    }
  }
  return { path, shapes, bg: await parseBackground(doc, ctx), trans: parseTransition(doc), motion: parseMotion(doc, shapes) };
}

// ambient motion paths (p:animMotion) -- see slide timing; returns [{name, dx, dy, dur, delay}]
function parseMotion(doc, shapes) {
  const out = [];
  const idToName = {};
  for (const c of doc.getElementsByTagName('p:cNvPr')) idToName[c.getAttribute('id')] = c.getAttribute('name');
  for (const am of doc.getElementsByTagName('p:animMotion')) {
    const tgt = am.getElementsByTagName('p:spTgt')[0];
    const cTn = am.parentNode.parentNode;
    const m = /L\s*(-?[\d.]+)\s+(-?[\d.]+)/.exec(at(am, 'path', ''));
    if (!tgt || !m) { warn('motion path not understood'); continue; }
    const delay = num(cTn.getElementsByTagName('p:cond')[0], 'delay', 0);
    out.push({ name: idToName[tgt.getAttribute('spid')], dx: parseFloat(m[1]), dy: parseFloat(m[2]), dur: num(cTn.getElementsByTagName('p:cTn')[0], 'dur', 10000), delay: isFinite(delay) ? delay : 0 });
  }
  return out;
}

async function loadDeck(file) {
  const zip = await JSZip.loadAsync(file);
  const text = (p) => zip.file(p).async('string');
  const pres = parseXml(await text('ppt/presentation.xml'));
  const sz = pres.getElementsByTagName('p:sldSz')[0];
  const presRels = parseRels(await text('ppt/_rels/presentation.xml.rels'), 'ppt/presentation.xml');
  const mediaCache = new Map();
  const media = (path) => {
    if (!mediaCache.has(path)) {
      const ext = path.split('.').pop().toLowerCase();
      mediaCache.set(path, zip.file(path).async('arraybuffer').then((buf) => ({ url: URL.createObjectURL(new Blob([buf], { type: MIME[ext] || 'application/octet-stream' })), png: ext === 'png' })));
    }
    return mediaCache.get(path);
  };
  const slides = [];
  for (const id of pres.getElementsByTagName('p:sldId')) {
    slides.push(await parseSlide(zip, presRels[id.getAttribute('r:id')].path, media));
  }
  return { W: num(sz, 'cx') / PT, H: num(sz, 'cy') / PT, slides };
}

// ------------------------------------------------------------------ styles (px == pt)
const px = (v) => `${+v.toFixed(3)}px`;

function actorStyle(m, rot = m.rot) {
  return { left: px(m.x), top: px(m.y), width: px(m.w), height: px(m.h), transform: `rotate(${+rot.toFixed(3)}deg) scale(${m.flipH ? -1 : 1},${m.flipV ? -1 : 1})` };
}
function radius(m, extra = 0) {
  if (m.prst === 'ellipse') return '50%';
  if (m.prst === 'roundRect') return px(Math.min(m.w, m.h) * m.adj / 100000 + extra);
  return px(extra);
}
function shapeStyle(m) {
  const sh = m.shadow;
  const png = m.pic && m.pic.png;
  return {
    backgroundColor: m.fill.kind === 'solid' ? rgba(m.fill.color) : (m.pic && !m.pic.url ? '#777' : TRANSPARENT),
    borderRadius: radius(m),
    boxShadow: sh && !png ? `${px(sh.dx)} ${px(sh.dy)} ${px(sh.blur)} ${rgba(sh.color)}` : 'none',
    filter: sh && png ? `drop-shadow(${px(sh.dx)} ${px(sh.dy)} ${px(sh.blur / 2)} ${rgba(sh.color)})` : 'none',
    opacity: m.pic ? m.pic.alpha : 1,
    maskImage: m.soft && m.prst === 'ellipse' ? `radial-gradient(closest-side,#000 calc(100% - ${px(m.soft)}),transparent)` : 'none',
  };
}
function frameStyle(m) {
  const w = m.ln ? m.ln.w : 0;
  return {
    left: px(-w / 2), top: px(-w / 2), right: px(-w / 2), bottom: px(-w / 2),
    borderWidth: px(w), borderColor: m.ln ? rgba(m.ln.color) : TRANSPARENT,
    borderRadius: radius(m, w / 2),
  };
}
function imgStyle(m) {
  const c = m.pic.crop, ww = Math.max(1 - c.l - c.r, 0.001), hh = Math.max(1 - c.t - c.b, 0.001);
  return { width: `${100 / ww}%`, height: `${100 / hh}%`, left: `${-c.l / ww * 100}%`, top: `${-c.t / hh * 100}%` };
}
function textBoxStyle(m) {
  const t = m.text;
  return { padding: `${px(t.ins.t)} ${px(t.ins.r)} ${px(t.ins.b)} ${px(t.ins.l)}` };
}
function runStyle(r) {
  return { fontSize: px(r.sz), color: rgba(r.color), letterSpacing: px(r.spc), fontWeight: r.b ? '700' : '400' };
}
const textKey = (m) => m.text && m.text.hasText ? m.text.paras.map((p) => p.runs.map((r) => r.br ? '\n' : r.t).join('')).join('\n') : '';
const sameStructure = (a, b) => a.paras.length === b.paras.length && a.paras.every((p, i) => p.runs.length === b.paras[i].runs.length);

// ------------------------------------------------------------------ DOM
const div = (cls) => { const d = document.createElement('div'); d.className = cls; return d; };
const css = (el, obj) => { Object.assign(el.style, obj); return el; };

function buildTextLayer(m) {
  const t = m.text;
  const box = css(div('text'), textBoxStyle(m));
  box.style.justifyContent = t.anchor === 'ctr' ? 'center' : t.anchor === 'b' ? 'flex-end' : 'flex-start';
  if (t.wrap === 'none') box.style.whiteSpace = 'nowrap';
  const paras = t.paras.map((p) => {
    const el = document.createElement('p');
    el.style.textAlign = p.algn === 'ctr' ? 'center' : p.algn === 'r' ? 'right' : 'left';
    el.style.lineHeight = +(p.lh * 1.2).toFixed(3);
    const runs = [];
    for (const r of p.runs) {
      if (r.br) { el.append(document.createElement('br')); continue; }
      const s = document.createElement('span');
      s.textContent = r.t;
      css(s, runStyle(r));
      s.style.fontFamily = /display/i.test(r.font) ? FONT_DISPLAY : FONT;
      if (r.i) s.style.fontStyle = 'italic';
      el.append(s); runs.push(s);
    }
    if (!runs.length) { el.style.height = px(p.endSz * p.lh * 1.2); }
    box.append(el);
    return { el, runs };
  });
  return { box, paras };
}

function buildActor(m) {
  const el = css(div('actor'), actorStyle(m));
  el.dataset.name = m.name;
  const shape = css(div('shape' + (m.pic ? ' clip' : '')), shapeStyle(m));
  let img = null;
  if (m.pic && !m.pic.url) warn(`missing media for "${m.name}", drawn as grey box`);
  if (m.pic && m.pic.url) {
    img = document.createElement('img');
    img.className = 'pic'; img.draggable = false; img.src = m.pic.url;
    css(img, imgStyle(m));
    shape.append(img);
  }
  const frame = css(div('frame'), frameStyle(m));
  if (m.ln) frame.style.borderStyle = m.ln.style;
  el.append(shape, frame);
  let text = null, paras = [];
  if (m.text && m.text.hasText) {
    const t = buildTextLayer(m);
    text = t.box; paras = t.paras; el.append(text);
  }
  if (m.fill.kind === 'grad') shape.style.backgroundImage = m.fill.css;
  return { m, el, shape, frame, img, text, paras };
}

function applyBg(el, bg) {
  el.style.backgroundImage = 'none';
  el.style.backgroundColor = bg.kind === 'solid' ? rgba(bg.color) : '#000';
  if (bg.kind === 'grad') el.style.backgroundImage = bg.css;
  if (bg.kind === 'image') { el.style.backgroundImage = `url(${bg.url})`; el.style.backgroundSize = 'cover'; el.style.backgroundPosition = 'center'; }
}

function renderLayer(slide) {
  const el = div('layer'), bg = div('slidebg'), exit = div('exit');
  applyBg(bg, slide.bg);
  el.append(bg, exit);
  const actors = [], byName = new Map();
  for (const m of slide.shapes) {
    const a = buildActor(m);
    el.append(a.el); actors.push(a);
    if (m.name.startsWith('!!') && !byName.has(m.name)) byName.set(m.name, a);
  }
  return { slide, el, bg, exit, actors, byName };
}

// ------------------------------------------------------------------ animation helpers
function tween(list, el, from, to, opts) {
  const f = {}, t = {};
  let changed = false;
  for (const k of Object.keys(to)) {
    if (from[k] === undefined) continue;
    f[k] = from[k]; t[k] = to[k];
    if (from[k] !== to[k]) changed = true;
  }
  if (changed) list.push(el.animate([f, t], opts));
}

function liveOffset(el) {
  const t = getComputedStyle(el).translate;
  if (!t || t === 'none') return { x: 0, y: 0 };
  const [x, y] = t.split(/\s+/).map(parseFloat);
  return { x: x || 0, y: y || 0 };
}

function morphPair(list, a, b, opts) {
  const A = a.m, B = b.m;
  // shortest rotation path; start where the old actor is *now* (ambient motion may have moved it)
  const d = ((A.rot - B.rot + 540) % 360) - 180;
  const from = actorStyle(A, B.rot + d);
  const off = liveOffset(a.el);
  from.left = px(A.x + off.x); from.top = px(A.y + off.y);
  tween(list, b.el, from, actorStyle(B), opts);
  tween(list, b.shape, shapeStyle(A), shapeStyle(B), opts);
  tween(list, b.frame, frameStyle(A), frameStyle(B), opts);
  if (b.img && a.img) {
    if (A.pic.url === B.pic.url) {
      tween(list, b.img, imgStyle(A), imgStyle(B), opts);
    } else {
      const ghost = a.img.cloneNode();
      ghost.classList.add('ghost');
      css(ghost, imgStyle(A));
      b.shape.insertBefore(ghost, b.img);
      list.push(ghost.animate([{ opacity: 1 }, { opacity: 0 }], { ...opts, fill: 'forwards' }));
      tween(list, b.img, { ...imgStyle(A), opacity: 0 }, { ...imgStyle(B), opacity: 1 }, opts);
    }
  }
  // text: tween run styles when the words are identical, else cross-fade
  if (b.text || a.text) {
    if (a.text && b.text && textKey(A) === textKey(B) && sameStructure(A.text, B.text)) {
      tween(list, b.text, textBoxStyle(A), textBoxStyle(B), opts);
      b.paras.forEach((p, i) => {
        tween(list, p.el, { lineHeight: +(A.text.paras[i].lh * 1.2).toFixed(3) }, { lineHeight: +(B.text.paras[i].lh * 1.2).toFixed(3) }, opts);
        p.runs.forEach((s, j) => tween(list, s, runStyle(A.text.paras[i].runs.filter((r) => !r.br)[j]), runStyle(B.text.paras[i].runs.filter((r) => !r.br)[j]), opts));
      });
    } else {
      if (b.text) list.push(b.text.animate([{ opacity: 0 }, { opacity: 1 }], opts));
      if (a.text) {
        const ghost = buildTextLayer(A).box;
        ghost.classList.add('ghost');
        b.el.append(ghost);
        list.push(ghost.animate([{ opacity: 1 }, { opacity: 0 }], { ...opts, fill: 'forwards' }));
      }
    }
  }
}

// ------------------------------------------------------------------ player
const stage = document.getElementById('stage');
const hud = document.getElementById('hud');
const drop = document.getElementById('drop');
let deck = null, cur = null, idx = -1, active = null, advTimer = null, hudTimer = null, cursorTimer = null;

function fit() {
  if (!deck) return;
  const s = Math.min(innerWidth / deck.W, innerHeight / deck.H);
  stage.style.transform = `translate(${(innerWidth - deck.W * s) / 2}px,${(innerHeight - deck.H * s) / 2}px) scale(${s})`;
}

function startMotion(layer) {
  for (const mo of layer.slide.motion) {
    const a = layer.byName.get(mo.name) || layer.actors.find((x) => x.m.name === mo.name);
    if (!a) continue;
    const dx = mo.dx * deck.W, dy = mo.dy * deck.H;
    a.el.animate([{ translate: '0 0' }, { translate: `${dx}px ${dy}px` }], { duration: mo.dur, delay: mo.delay, easing: 'linear', fill: 'forwards' });
  }
}

function showHud() {
  hud.textContent = `${idx + 1} / ${deck.slides.length}`;
  hud.classList.add('on');
  clearTimeout(hudTimer);
  hudTimer = setTimeout(() => hud.classList.remove('on'), 1400);
}

function land(layer) {
  cur = layer;
  startMotion(layer);
  clearTimeout(advTimer);
  const t = layer.slide.trans;
  if (t.advTm != null && idx < deck.slides.length - 1) advTimer = setTimeout(() => go(idx + 1), t.advTm);
}

async function go(to) {
  if (!deck || to < 0 || to >= deck.slides.length || to === idx) return;
  if (active) { active.finish(); await active.done; }
  clearTimeout(advTimer);
  const from = idx;
  idx = to;
  const next = renderLayer(deck.slides[to]);
  const adjacent = from >= 0 && Math.abs(to - from) === 1;
  const trans = !adjacent ? { type: 'cut' } : (to > from ? deck.slides[to].trans : deck.slides[from].trans);
  showHud();

  if (trans.type === 'cut' || !cur) {
    stage.replaceChildren(next.el);
    land(next);
    return;
  }

  const old = cur;
  const anims = [];
  const opts = { duration: trans.dur, easing: EASE, fill: 'none' };
  let cleanup;

  if (trans.type === 'morph') {
    stage.append(next.el);
    const paired = new Set();
    for (const b of next.actors) {
      const a = next.byName.get(b.m.name) === b ? old.byName.get(b.m.name) : null;
      if (a && a.m.kind === b.m.kind) { paired.add(a); morphPair(anims, a, b, opts); }
      else anims.push(b.el.animate([{ opacity: 0 }, { opacity: 1 }], opts));
    }
    for (const a of old.actors) if (!paired.has(a)) next.exit.append(a.el);
    anims.push(next.exit.animate([{ opacity: 1 }, { opacity: 0 }], { ...opts, fill: 'forwards' }));
    if (old.slide.bg.kind === 'solid' && next.slide.bg.kind === 'solid') {
      anims.push(next.bg.animate([{ backgroundColor: rgba(old.slide.bg.color) }, { backgroundColor: rgba(next.slide.bg.color) }], opts));
    }
    old.el.remove();
    cleanup = () => next.exit.replaceChildren();
  } else {
    stage.append(next.el);
    anims.push(next.el.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, easing: 'ease-in-out' }));
    cleanup = () => old.el.remove();
  }

  const done = Promise.all(anims.map((a) => a.finished.catch(() => {}))).then(() => {
    cleanup();
    for (const g of stage.querySelectorAll('.ghost')) g.remove();
    active = null;
    land(next);
  });
  active = { done, finish: () => anims.forEach((a) => { try { a.finish(); } catch (e) { /* already done */ } }) };
  await done;
}

const next = () => go(idx + 1);
const prev = () => go(idx - 1);

async function open(file) {
  drop.classList.add('busy');
  try {
    deck = await loadDeck(file);
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  } catch (e) {
    console.error(e);
    drop.classList.remove('busy');
    drop.querySelector('.msg').textContent = 'Datei konnte nicht gelesen werden: ' + e.message;
    return;
  }
  Object.assign(stage.style, { width: deck.W + 'px', height: deck.H + 'px' });
  stage.replaceChildren();
  cur = null; idx = -1; active = null;
  drop.classList.add('gone');
  fit();
  await go(0);
}

// ------------------------------------------------------------------ input
addEventListener('resize', fit);
addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  switch (e.key) {
    case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Enter': e.preventDefault(); next(); break;
    case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace': e.preventDefault(); prev(); break;
    case 'Home': go(0); break;
    case 'End': if (deck) go(deck.slides.length - 1); break;
    case 'f': case 'F': case 'F11':
      e.preventDefault();
      if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {});
      break;
    default:
  }
});
addEventListener('mousedown', (e) => {
  if (!deck || e.target.closest('#drop')) return;
  if (e.button === 2) return prev();
  if (e.button === 0) { if (e.clientX < innerWidth * 0.2) prev(); else next(); }
});
addEventListener('contextmenu', (e) => { if (deck) e.preventDefault(); });
addEventListener('mousemove', () => {
  document.body.classList.remove('idle');
  clearTimeout(cursorTimer);
  cursorTimer = setTimeout(() => document.body.classList.add('idle'), 2500);
});
const fileInput = document.getElementById('file');
fileInput.addEventListener('change', () => { if (fileInput.files[0]) open(fileInput.files[0]); });
addEventListener('dragover', (e) => e.preventDefault());
addEventListener('drop', (e) => { e.preventDefault(); if (e.dataTransfer.files[0]) open(e.dataTransfer.files[0]); });

window.__player = { go, next, prev, open, get idx() { return idx; }, get deck() { return deck; }, get active() { return active; } };
})();
