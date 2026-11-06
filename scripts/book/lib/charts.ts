// Deterministic SVG charts generated from the Markdown tables they sit next to.
type Point = { label: string; x: number; y: number };
type Series = { name: string; color: string; points: Point[] };

const W = 640, H = 260, M = { t: 18, r: 18, b: 46, l: 66 };

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.00$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 1 : 2).replace(/\.0$/, "").replace(/\.00$/, "") + "k";
  return String(n);
}

export function chartSVG(opts: {
  title: string;
  xLabel: string;
  yLabel: string;
  series: Series[];
  logX?: boolean;
  logY?: boolean;
}): string {
  const { series, logX, logY } = opts;
  const all = series.flatMap((s) => s.points);
  const xs = all.map((p) => p.x), ys = all.map((p) => p.y);
  const tx = (v: number) => (logX ? Math.log10(v) : v);
  const ty = (v: number) => (logY ? Math.log10(v) : v);
  const x0 = Math.min(...xs.map(tx)), x1 = Math.max(...xs.map(tx));
  const y0 = Math.min(...ys.map(ty)), y1 = Math.max(...ys.map(ty));
  const pxT = (t: number) => M.l + ((t - x0) / (x1 - x0 || 1)) * (W - M.l - M.r);
  const pyT = (t: number) => H - M.b - ((t - y0) / (y1 - y0 || 1)) * (H - M.t - M.b);
  const px = (v: number) => pxT(tx(v));
  const py = (v: number) => pyT(ty(v));

  const grid: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const t = y0 + ((y1 - y0) * i) / 4;
    const y = pyT(t);
    const label = logY ? fmt(Math.pow(10, t)) : fmt(t);
    grid.push(`<line x1="${M.l}" x2="${W - M.r}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" class="grid"/>`);
    grid.push(`<text x="${M.l - 8}" y="${(y + 4).toFixed(1)}" class="axis" text-anchor="end">${label}</text>`);
  }

  const paths = series.map((s, si) => {
    const d = s.points.map((p, i) => `${i ? "L" : "M"}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(" ");
    const dots = s.points
      .map((p) => `<circle cx="${px(p.x).toFixed(1)}" cy="${py(p.y).toFixed(1)}" r="4" fill="${s.color}"><title>${s.name} · ${p.label} → ${p.y}</title></circle>`)
      .join("");
    return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2"/>${dots}`;
  }).join("");

  const legend = series.map((s, i) =>
    `<g transform="translate(${M.l + i * 150},${H - 14})"><rect width="10" height="10" y="-8" fill="${s.color}"/><text x="16" class="axis">${s.name}</text></g>`
  ).join("");

  const ticks = (logX ? [1, 4, 16, 64, 256] : []).filter((v) => v >= Math.pow(10, x0) && v <= Math.pow(10, x1))
    .map((v) => `<text x="${px(v)}" y="${H - M.b + 18}" class="axis" text-anchor="middle">${v}</text>`).join("");

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.title}" class="chart-svg">
  <text x="${M.l}" y="12" class="chart-title">${opts.title}</text>
  ${grid.join("")}
  <line x1="${M.l}" x2="${W - M.r}" y1="${H - M.b}" y2="${H - M.b}" class="axis-line"/>
  <line x1="${M.l}" x2="${M.l}" y1="${M.t}" y2="${H - M.b}" class="axis-line"/>
  ${paths}
  ${ticks}
  <text x="${(W + M.l) / 2}" y="${H - 2}" class="axis" text-anchor="middle">${opts.xLabel}</text>
  <text transform="translate(14,${(H - M.b) / 2}) rotate(-90)" class="axis" text-anchor="middle">${opts.yLabel}</text>
  ${legend}
</svg>`;
}

function num(cell: string): number | null {
  const t = cell.replace(/[`*,]/g, "").replace(/×.*$/, "").trim();
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

/** Builds a chart from a GFM table. Returns null when the table has no numeric columns. */
export function chartFromTable(lines: string[]): string | null {
  const rows = lines.map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
  if (rows.length < 3) return null;
  const header = rows[0];
  const body = rows.slice(2).filter((r) => r.some((c) => c !== ""));
  const skipCol = /ratio|applications|speedup|×/i;
  const numeric = header.map((h, i) => !skipCol.test(h) && body.every((r) => num(r[i] ?? "") !== null));
  const numericIdx = numeric.map((ok, i) => (ok ? i : -1)).filter((i) => i >= 0);
  if (numericIdx.length < 2) return null;

  const xIdx = numericIdx[0];
  const yIdxs = numericIdx.slice(1);
  const name = (i: number) => header[i].replace(/[`*]/g, "");
  const colors = ["#b45309", "#1d4ed8", "#047857"];
  const series: Series[] = yIdxs.map((yi, k) => ({
    name: name(yi),
    color: colors[k % colors.length],
    points: body.map((r) => ({ label: `${name(xIdx)} ${r[xIdx]}`, x: num(r[xIdx])!, y: num(r[yi])! })),
  }));
  const values = series.flatMap((s) => s.points.map((p) => p.y));
  const xs = series[0].points.map((p) => p.x);
  return chartSVG({
    title: `${name(yIdxs[0])} vs ${name(xIdx)}`,
    xLabel: name(xIdx),
    yLabel: name(yIdxs[0]),
    series,
    logX: Math.max(...xs) / Math.min(...xs) > 40,
    logY: Math.max(...values) / Math.min(...values) > 40,
  });
}
