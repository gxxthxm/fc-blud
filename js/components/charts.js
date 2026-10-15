// Dependency-free SVG charts: interactive price line, sparkline and radar.

import { esc } from '../utils.js';

const niceTicks = (min, max, count = 4) => {
  const span = max - min || 1;
  const step = Math.pow(10, Math.floor(Math.log10(span / count)));
  const err = span / count / step;
  const mult = err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1;
  const s = step * mult;
  const ticks = [];
  for (let v = Math.ceil(min / s) * s; v <= max; v += s) ticks.push(v);
  return ticks;
};

/**
 * Renders an interactive line chart into `el`.
 * points: [{t, p}], fmtY: value formatter, fmtX: timestamp formatter.
 */
export function lineChart(el, points, { fmtY = String, fmtX, color = 'var(--accent)', height = 240 } = {}) {
  const W = 720, H = height, L = 56, R = 12, T = 12, B = 26;
  const vals = points.map((d) => d.p);
  let min = Math.min(...vals), max = Math.max(...vals);
  const pad = (max - min) * 0.08 || max * 0.05 || 1;
  min -= pad; max += pad;
  const x = (i) => L + (i / Math.max(1, points.length - 1)) * (W - L - R);
  const y = (v) => T + (1 - (v - min) / (max - min)) * (H - T - B);
  const line = points.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.p).toFixed(1)}`).join('');
  const area = `${line}L${x(points.length - 1)},${H - B}L${x(0)},${H - B}Z`;
  const ticks = niceTicks(min, max);
  const xfmt = fmtX || ((t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
  const xIdx = [0, Math.floor(points.length / 3), Math.floor((2 * points.length) / 3), points.length - 1];
  const gid = 'g' + Math.random().toString(36).slice(2, 8);

  el.innerHTML = `
  <div class="chart-wrap">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="chart" role="img" aria-label="Price chart">
      <defs><linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>
      </linearGradient></defs>
      ${ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/>
        <text x="${L - 8}" y="${y(v) + 4}" class="axis" text-anchor="end">${esc(fmtY(v))}</text>`).join('')}
      ${xIdx.map((i) => `<text x="${x(i)}" y="${H - 6}" class="axis" text-anchor="${i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}">${esc(xfmt(points[i].t))}</text>`).join('')}
      <path d="${area}" fill="url(#${gid})"/>
      <path d="${line}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/>
      <line class="cursor" y1="${T}" y2="${H - B}" style="display:none"/>
      <circle class="dot" r="4" fill="${color}" style="display:none"/>
    </svg>
    <div class="chart-tip" style="display:none"></div>
  </div>`;

  const svg = el.querySelector('svg');
  const cursor = svg.querySelector('.cursor');
  const dot = svg.querySelector('.dot');
  const tip = el.querySelector('.chart-tip');
  const move = (ev) => {
    const rect = svg.getBoundingClientRect();
    const cx = ((ev.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((cx - L) / (W - L - R)) * (points.length - 1));
    if (i < 0 || i >= points.length) return leave();
    const d = points[i];
    cursor.setAttribute('x1', x(i)); cursor.setAttribute('x2', x(i));
    dot.setAttribute('cx', x(i)); dot.setAttribute('cy', y(d.p));
    cursor.style.display = dot.style.display = '';
    tip.style.display = '';
    tip.innerHTML = `<b>${esc(fmtY(d.p))}</b><span>${new Date(d.t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>`;
    const px = (x(i) / W) * rect.width;
    tip.style.left = Math.min(rect.width - 130, Math.max(0, px - 65)) + 'px';
  };
  const leave = () => { cursor.style.display = dot.style.display = tip.style.display = 'none'; };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerleave', leave);
}

export function sparkline(values, { w = 110, h = 32, color } = {}) {
  const min = Math.min(...values), max = Math.max(...values);
  const c = color || (values[values.length - 1] >= values[0] ? 'var(--up)' : 'var(--down)');
  const d = values
    .map((v, i) => `${i ? 'L' : 'M'}${((i / (values.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / (max - min || 1)) * (h - 4)).toFixed(1)}`)
    .join('');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><path d="${d}" fill="none" stroke="${c}" stroke-width="1.6"/></svg>`;
}

/** series: [{label, values:[0..99 x n], color}] */
export function radar(series, labels, size = 300) {
  const c = size / 2, r = size / 2 - 34, n = labels.length;
  const pt = (i, v) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [c + Math.cos(a) * r * (v / 100), c + Math.sin(a) * r * (v / 100)];
  };
  const rings = [25, 50, 75, 100]
    .map((v) => `<polygon class="grid" points="${labels.map((_, i) => pt(i, v).join(',')).join(' ')}"/>`).join('');
  const spokes = labels.map((l, i) => {
    const [x2, y2] = pt(i, 100);
    const [lx, ly] = pt(i, 118);
    return `<line class="grid" x1="${c}" y1="${c}" x2="${x2}" y2="${y2}"/><text class="axis" x="${lx}" y="${ly + 4}" text-anchor="middle">${esc(l)}</text>`;
  }).join('');
  const shapes = series.map((s) =>
    `<polygon points="${s.values.map((v, i) => pt(i, v).join(',')).join(' ')}" fill="${s.color}" fill-opacity=".18" stroke="${s.color}" stroke-width="2"/>`).join('');
  return `<svg class="radar" viewBox="0 0 ${size} ${size}" role="img" aria-label="Stat radar">${rings}${spokes}${shapes}</svg>`;
}
