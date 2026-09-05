import "dotenv/config";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { getEnvOrThrow } from "@src/config/env.js";
import { resolvePathFromUrl } from "@src/tests/helpers/path.js";

interface ReportPoint {
    connections: number;
    requests: { average: number };
    latency: { p50: number; p99: number };
    errors: number;
    timeouts: number;
    non2xx: number;
}

interface Series {
    name: string;
    color: string;
    values: number[];
}

const RESULTS_RELATIVE_FOLDER = getEnvOrThrow("PERFORMANCE_RESULTS_RELATIVE_FOLDER");
const resultsFolder = resolvePathFromUrl(RESULTS_RELATIVE_FOLDER, import.meta.url);

const pickResultFile = (): string => {
    const requestedFile = process.argv[2];
    if (requestedFile) return requestedFile;

    const jsonFiles = readdirSync(resultsFolder)
        .filter((name) => name.endsWith(".json"))
        .sort();

    const latest = jsonFiles.at(-1);
    if (!latest) {
        throw new Error(`No result JSON files found in ${resultsFolder}`);
    }
    return latest;
};

const resultFile = pickResultFile();
const points: ReportPoint[] = JSON.parse(
    readFileSync(`${resultsFolder}/${resultFile}`, "utf-8"),
);

const xLabels = points.map((point) => String(point.connections));

const niceMax = (max: number): number => {
    if (max <= 0) return 1;
    const magnitude = 10 ** Math.floor(Math.log10(max));
    return Math.ceil(max / magnitude) * magnitude;
};

const renderChart = (
    id: string,
    yLabel: string,
    series: Series[],
): string => {
    const width = 760;
    const height = 380;
    const marginLeft = 56;
    const marginRight = 20;
    const marginTop = 24;
    const marginBottom = 40;
    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;

    const allValues = series.flatMap((s) => s.values);
    const yMax = niceMax(Math.max(...allValues, 1));
    const gridSteps = 5;

    const xAt = (index: number) =>
        marginLeft + (xLabels.length === 1
            ? plotWidth / 2
            : (index / (xLabels.length - 1)) * plotWidth);
    const yAt = (value: number) =>
        marginTop + plotHeight - (value / yMax) * plotHeight;

    const gridlines = Array.from({ length: gridSteps + 1 }, (_, step) => {
        const value = (yMax / gridSteps) * step;
        const y = yAt(value);
        return `
            <line class="gridline" x1="${marginLeft}" y1="${y}" x2="${width - marginRight}" y2="${y}" />
            <text class="tick" x="${marginLeft - 8}" y="${y}" text-anchor="end" dominant-baseline="middle">${Math.round(value).toLocaleString()}</text>
        `;
    }).join("");

    const xTicks = xLabels.map((label, index) => `
        <text class="tick" x="${xAt(index)}" y="${height - marginBottom + 20}" text-anchor="middle">${label}</text>
    `).join("");

    const seriesMarkup = series.map((s) => {
        const linePoints = s.values.map((value, index) => `${xAt(index)},${yAt(value)}`).join(" ");
        const dots = s.values.map((value, index) => `
            <circle class="dot" cx="${xAt(index)}" cy="${yAt(value)}" r="4" fill="${s.color}" stroke="var(--surface-1)" stroke-width="2" />
        `).join("");
        const lastIndex = s.values.length - 1;
        const endLabel = series.length > 1 ? `
            <text class="end-label" x="${xAt(lastIndex) + 8}" y="${yAt(s.values[lastIndex]!)}" dominant-baseline="middle" fill="${s.color}">${s.name}</text>
        ` : "";
        return `
            <polyline points="${linePoints}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
            ${dots}
            ${endLabel}
        `;
    }).join("");

    const legend = series.length > 1 ? `
        <div class="legend">
            ${series.map((s) => `
                <span class="legend-item">
                    <span class="legend-swatch" style="background:${s.color}"></span>
                    <span>${s.name}</span>
                </span>
            `).join("")}
        </div>
    ` : "";

    return `
        <section class="chart-card">
            <h2>${yLabel} vs Connections</h2>
            ${legend}
            <svg id="${id}" viewBox="0 0 ${width} ${height}" class="chart-svg" data-plot-left="${marginLeft}" data-plot-width="${plotWidth}">
                ${gridlines}
                ${xTicks}
                <line class="axis" x1="${marginLeft}" y1="${marginTop + plotHeight}" x2="${width - marginRight}" y2="${marginTop + plotHeight}" />
                ${seriesMarkup}
                <line class="crosshair" x1="0" y1="${marginTop}" x2="0" y2="${marginTop + plotHeight}" visibility="hidden" />
            </svg>
            <div class="tooltip" hidden></div>
        </section>
    `;
};

const throughputChart = renderChart("throughput-chart", "Requests/sec", [
    { name: "req/sec", color: "var(--series-1)", values: points.map((p) => p.requests.average) },
]);

const latencyChart = renderChart("latency-chart", "Latency (ms)", [
    { name: "p50", color: "var(--series-1)", values: points.map((p) => p.latency.p50) },
    { name: "p99", color: "var(--series-2)", values: points.map((p) => p.latency.p99) },
]);

const tableRows = points.map((p) => `
    <tr>
        <td>${p.connections}</td>
        <td>${p.requests.average.toFixed(1)}</td>
        <td>${p.latency.p50.toFixed(1)}</td>
        <td>${p.latency.p99.toFixed(1)}</td>
        <td>${p.errors}</td>
        <td>${p.timeouts}</td>
        <td>${p.non2xx}</td>
    </tr>
`).join("");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Performance report - ${resultFile}</title>
<style>
    :root {
        color-scheme: light;
        --surface-1: #fcfcfb;
        --page: #f9f9f7;
        --text-primary: #0b0b0b;
        --text-secondary: #52514e;
        --text-muted: #898781;
        --gridline: #e1e0d9;
        --axis: #c3c2b7;
        --series-1: #2a78d6;
        --series-2: #eb6834;
    }
    @media (prefers-color-scheme: dark) {
        :root {
            color-scheme: dark;
            --surface-1: #1a1a19;
            --page: #0d0d0d;
            --text-primary: #ffffff;
            --text-secondary: #c3c2b7;
            --text-muted: #898781;
            --gridline: #2c2c2a;
            --axis: #383835;
            --series-1: #3987e5;
            --series-2: #d95926;
        }
    }
    body {
        margin: 0;
        background: var(--page);
        color: var(--text-primary);
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    }
    .viz-root {
        max-width: 800px;
        margin: 0 auto;
        padding: 24px 16px 48px;
    }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .subtitle { color: var(--text-secondary); font-size: 13px; margin-top: 0; margin-bottom: 32px; }
    .chart-card {
        background: var(--surface-1);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 24px;
    }
    .chart-card h2 { font-size: 14px; margin: 0 0 8px; color: var(--text-primary); }
    .chart-svg { width: 100%; height: auto; overflow: visible; }
    .gridline { stroke: var(--gridline); stroke-width: 1; }
    .axis { stroke: var(--axis); stroke-width: 1; }
    .tick { fill: var(--text-muted); font-size: 11px; }
    .end-label { font-size: 12px; font-weight: 600; }
    .crosshair { stroke: var(--axis); stroke-width: 1; }
    .legend { display: flex; gap: 16px; margin-bottom: 12px; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); }
    .legend-swatch { width: 10px; height: 10px; border-radius: 2px; }
    .tooltip {
        position: absolute;
        background: var(--surface-1);
        border: 1px solid var(--gridline);
        border-radius: 6px;
        padding: 8px 10px;
        font-size: 12px;
        pointer-events: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .tooltip strong { color: var(--text-primary); }
    .tooltip .row { color: var(--text-secondary); }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    th, td { text-align: right; padding: 6px 8px; border-bottom: 1px solid var(--gridline); font-variant-numeric: tabular-nums; }
    th:first-child, td:first-child { text-align: left; }
    th { color: var(--text-muted); font-weight: 600; }
</style>
</head>
<body>
<div class="viz-root">
    <h1>Performance report</h1>
    <p class="subtitle">${resultFile}</p>

    ${throughputChart}
    ${latencyChart}

    <section class="chart-card">
        <h2>Raw data</h2>
        <table>
            <thead>
                <tr>
                    <th>Connections</th>
                    <th>Req/sec</th>
                    <th>p50 (ms)</th>
                    <th>p99 (ms)</th>
                    <th>Errors</th>
                    <th>Timeouts</th>
                    <th>Non-2xx</th>
                </tr>
            </thead>
            <tbody>${tableRows}</tbody>
        </table>
    </section>
</div>

<script>
    const xLabels = ${JSON.stringify(xLabels)};
    const chartsData = ${JSON.stringify([
        { id: "throughput-chart", series: [{ name: "req/sec", values: points.map((p) => p.requests.average) }] },
        { id: "latency-chart", series: [
            { name: "p50", values: points.map((p) => p.latency.p50) },
            { name: "p99", values: points.map((p) => p.latency.p99) },
        ] },
    ])};

    for (const chartData of chartsData) {
        const svg = document.getElementById(chartData.id);
        const tooltip = svg.closest(".chart-card").querySelector(".tooltip");
        const crosshair = svg.querySelector(".crosshair");
        const plotLeft = Number(svg.dataset.plotLeft);
        const plotWidth = Number(svg.dataset.plotWidth);

        const nearestIndex = (clientX) => {
            const rect = svg.getBoundingClientRect();
            const scale = rect.width / svg.viewBox.baseVal.width;
            const localX = (clientX - rect.left) / scale;
            const ratio = (localX - plotLeft) / plotWidth;
            const index = Math.round(ratio * (xLabels.length - 1));
            return Math.min(Math.max(index, 0), xLabels.length - 1);
        };

        const xAt = (index) => plotLeft + (xLabels.length === 1
            ? plotWidth / 2
            : (index / (xLabels.length - 1)) * plotWidth);

        svg.addEventListener("pointermove", (event) => {
            const index = nearestIndex(event.clientX);
            const x = xAt(index);
            crosshair.setAttribute("x1", String(x));
            crosshair.setAttribute("x2", String(x));
            crosshair.setAttribute("visibility", "visible");

            tooltip.replaceChildren();
            const header = document.createElement("strong");
            header.textContent = "connections: " + xLabels[index];
            tooltip.appendChild(header);
            for (const s of chartData.series) {
                const row = document.createElement("div");
                row.className = "row";
                row.textContent = s.name + ": " + s.values[index].toFixed(1);
                tooltip.appendChild(row);
            }
            tooltip.hidden = false;

            const rect = svg.getBoundingClientRect();
            tooltip.style.left = (event.clientX - rect.left + 12) + "px";
            tooltip.style.top = (event.clientY - rect.top - 8) + "px";
        });

        svg.addEventListener("pointerleave", () => {
            crosshair.setAttribute("visibility", "hidden");
            tooltip.hidden = true;
        });
    }
</script>
</body>
</html>
`;

const outputPath = `${resultsFolder}/${resultFile.replace(/\.json$/, ".html")}`;
writeFileSync(outputPath, html, "utf-8");

console.log(`Report generated: ${pathToFileURL(outputPath).href}`);
