import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "data");
const payload = path.join(dataDir, "current_payload.json");
const backup = path.join(dataDir, "current_payload.json.readme-backup");
const sample = path.join(root, "samples", "企业融资情况表示例.xlsx");
const outDir = path.join(root, "docs", "images");
const userProfile = process.env.USERPROFILE || "";
const runtimeRoot = path.join(userProfile, ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies");
const nodeModuleCandidates = [
  process.env.FINANCE_DASHBOARD_NODE_MODULES,
  path.join(root, "node_modules"),
  path.join(runtimeRoot, "node", "node_modules"),
].filter(Boolean);
const pythonCandidates = [
  process.env.FINANCE_DASHBOARD_PYTHON,
  path.join(root, ".venv", "Scripts", "python.exe"),
  path.join(runtimeRoot, "python", "python.exe"),
  "python",
].filter(Boolean);
const port = "8791";

function loadPlaywright() {
  for (const moduleDir of nodeModuleCandidates) {
    try {
      const candidateRequire = existsSync(moduleDir) ? createRequire(path.join(moduleDir, "noop.js")) : require;
      return candidateRequire("playwright");
    } catch {}
  }
  throw new Error("Playwright was not found. Set FINANCE_DASHBOARD_NODE_MODULES to a node_modules directory.");
}

function resolvePython() {
  for (const candidate of pythonCandidates) {
    if (candidate === "python" || existsSync(candidate)) return candidate;
  }
  return "python";
}

const { chromium } = loadPlaywright();
const python = resolvePython();

mkdirSync(dataDir, { recursive: true });
mkdirSync(outDir, { recursive: true });
if (existsSync(payload)) copyFileSync(payload, backup);

const server = spawn(python, ["server.py"], {
  cwd: root,
  env: {
    ...process.env,
    FINANCE_DASHBOARD_HOST: "127.0.0.1",
    FINANCE_DASHBOARD_PORT: port,
    PYTHONUTF8: "1",
  },
  stdio: "ignore",
  windowsHide: true,
});

async function waitForHealth() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (res.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Server did not become healthy");
}

try {
  await waitForHealth();
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "networkidle" });
  await page.setInputFiles("#heroFileInput", sample);
  await page.waitForSelector("#workspace:not(.is-hidden)", { timeout: 30000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, "dashboard-sample.png"), fullPage: true });
  await browser.close();
} finally {
  server.kill();
  if (existsSync(backup)) {
    copyFileSync(backup, payload);
    rmSync(backup, { force: true });
  } else if (existsSync(payload)) {
    rmSync(payload, { force: true });
  }
}
