const state = {
  rows: [],
  filtered: [],
  sortKey: "balance",
  sortDir: "desc",
  rateBucket: "all",
  maturityFilter: "all",
  loaded: false,
};

const els = {
  emptyState: document.querySelector("#emptyState"),
  workspace: document.querySelector("#workspace"),
  sourceName: document.querySelector("#sourceName"),
  sheetName: document.querySelector("#sheetName"),
  loadedAt: document.querySelector("#loadedAt"),
  totalBalance: document.querySelector("#totalBalance"),
  loanCount: document.querySelector("#loanCount"),
  dueOneYear: document.querySelector("#dueOneYear"),
  weightedRate: document.querySelector("#weightedRate"),
  weightedRateNote: document.querySelector("#weightedRateNote"),
  rateScope: document.querySelector("#rateScope"),
  productBars: document.querySelector("#productBars"),
  maturityBars: document.querySelector("#maturityBars"),
  rateBars: document.querySelector("#rateBars"),
  nearTermProductBars: document.querySelector("#nearTermProductBars"),
  borrowerBars: document.querySelector("#borrowerBars"),
  detailBody: document.querySelector("#detailBody"),
  tableCount: document.querySelector("#tableCount"),
  summaryBalance: document.querySelector("#summaryBalance"),
  summaryRate: document.querySelector("#summaryRate"),
  summaryDue: document.querySelector("#summaryDue"),
  summaryCount: document.querySelector("#summaryCount"),
  searchInput: document.querySelector("#searchInput"),
  borrowerFilter: document.querySelector("#borrowerFilter"),
  institutionFilter: document.querySelector("#institutionFilter"),
  productFilter: document.querySelector("#productFilter"),
  maturityFilter: document.querySelector("#maturityFilter"),
  resetFilters: document.querySelector("#resetFilters"),
  exportButton: document.querySelector("#exportButton"),
  exportFilteredButton: document.querySelector("#exportFilteredButton"),
  fileInput: document.querySelector("#fileInput"),
  heroFileInput: document.querySelector("#heroFileInput"),
  dropZone: document.querySelector("#dropZone"),
  topDropZone: document.querySelector("#topDropZone"),
};

const today = new Date();
today.setHours(0, 0, 0, 0);

const rateScopes = {
  all: { label: "全部", matcher: () => true },
  bond: {
    label: "债券",
    matcher: (row) => /公司债|企业债|债券|中期票据|债权融资计划/.test(row.product || ""),
  },
  working: { label: "流贷", matcher: (row) => (row.product || "").includes("流贷") },
  fixed: { label: "固贷", matcher: (row) => (row.product || "").includes("固定资产贷款") },
  loan: { label: "贷款", matcher: (row) => /贷/.test(row.product || "") },
  termShort: { label: "三年及以下", matcher: (row) => {
    const years = termYears(row);
    return years !== null && years <= 3;
  } },
  termLong: { label: "三年以上", matcher: (row) => {
    const years = termYears(row);
    return years !== null && years > 3;
  } },
};

const maturityOptions = [
  ["all", "全部到期"],
  ["overdue", "已到期"],
  ["7", "7天内"],
  ["30", "30天内"],
  ["bucket-30", "8-30天"],
  ["60", "60天内"],
  ["bucket-60", "31-60天"],
  ["90", "90天内"],
  ["bucket-90", "61-90天"],
  ["bucket-180", "91-180天"],
  ["bucket-365", "181-365天"],
  ["365", "一年内"],
  ["long", "一年后"],
  ["no-date", "未填到期日"],
];

function ensureMaturityOptions() {
  const current = state.maturityFilter || els.maturityFilter.value || "all";
  const existing = new Set([...els.maturityFilter.options].map((option) => option.value));
  for (const [value, label] of maturityOptions) {
    if (existing.has(value)) continue;
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    els.maturityFilter.appendChild(option);
  }
  els.maturityFilter.value = existing.has(current) || maturityOptions.some(([value]) => value === current) ? current : "all";
}

function money(value) {
  return Number(value || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

function rate(value) {
  if (!value) return "--";
  return `${(value * 100).toFixed(2)}%`;
}

function dateText(value) {
  if (!value) return "--";
  return value.replaceAll("-", ".");
}

function daysUntil(value) {
  if (!value) return null;
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

function termYears(row) {
  if (row.startDate && row.maturityDate) {
    const start = new Date(row.startDate);
    const end = new Date(row.maturityDate);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start) {
      return (end - start) / 86400000 / 365.25;
    }
  }
  const text = String(row.term || "");
  if (!text) return null;
  const plusParts = text.match(/\d+(?:\.\d+)?/g);
  if (!plusParts) return null;
  const total = plusParts.map(Number).reduce((acc, value) => acc + value, 0);
  if (text.includes("月")) return total / 12;
  return total;
}

function sum(rows, key = "balance") {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

function weightedRate(rows) {
  const denominator = sum(rows);
  if (!denominator) return 0;
  return rows.reduce((acc, row) => acc + row.balance * (row.rate || 0), 0) / denominator;
}

function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const label = row[key] || "未填写";
    map.set(label, (map.get(label) || 0) + row.balance);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function maturityBucket(row) {
  const days = daysUntil(row.maturityDate);
  if (days === null) return "未填到期日";
  if (days < 0) return "已到期";
  if (days <= 7) return "7天内";
  if (days <= 30) return "8-30天";
  if (days <= 60) return "31-60天";
  if (days <= 90) return "61-90天";
  if (days <= 180) return "91-180天";
  if (days <= 365) return "181-365天";
  return "一年后";
}

function rateBucket(row) {
  const value = Number(row.rate || 0);
  if (!value) return "未填利率";
  if (value < 0.02) return "2%以下";
  if (value < 0.025) return "2.0%-2.5%";
  if (value < 0.03) return "2.5%-3.0%";
  if (value < 0.035) return "3.0%-3.5%";
  return "3.5%以上";
}

function filterValueForRateBucket(label) {
  return {
    "2%以下": "lt2",
    "2.0%-2.5%": "2-25",
    "2.5%-3.0%": "25-3",
    "3.0%-3.5%": "3-35",
    "3.5%以上": "gt35",
    未填利率: "no-rate",
  }[label];
}

function filterValueForBucket(label) {
  return {
    已到期: "overdue",
    "7天内": "7",
    "8-30天": "bucket-30",
    "31-60天": "bucket-60",
    "61-90天": "bucket-90",
    "91-180天": "bucket-180",
    "181-365天": "bucket-365",
    一年后: "long",
    未填到期日: "no-date",
  }[label];
}

function renderBars(container, data, total, options = {}) {
  container.innerHTML = "";
  if (!data.length) {
    container.innerHTML = '<div class="empty">暂无数据</div>';
    return;
  }
  for (const item of data) {
    const percent = total ? (item.value / total) * 100 : 0;
    const row = document.createElement("div");
    row.className = "bar-row";
    if (item.active) row.classList.add("active");
    row.innerHTML = `
      <div class="bar-label" title="${item.label}">${item.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(percent, 1)}%"></div></div>
      <div class="bar-value">${money(item.value)} 万元</div>
    `;
    if (options.onClick) row.addEventListener("click", () => options.onClick(item));
    container.appendChild(row);
  }
}

function renderSummary(rows) {
  const total = sum(rows);
  const oneYear = rows.filter((row) => {
    const days = daysUntil(row.maturityDate);
    return days !== null && days >= 0 && days <= 365;
  });

  els.totalBalance.textContent = money(total);
  els.loanCount.textContent = rows.length.toLocaleString("zh-CN");
  els.dueOneYear.textContent = money(sum(oneYear));

  const scope = rateScopes[els.rateScope.value] || rateScopes.all;
  const rateRows = rows.filter(scope.matcher);
  els.weightedRate.textContent = rate(weightedRate(rateRows));
  els.weightedRateNote.textContent = `${scope.label}口径，${rateRows.length} 条，按余额加权`;

  const byProduct = groupBy(rows, "product");
  renderBars(els.productBars, byProduct, total, {
    onClick: (item) => {
      els.productFilter.value = els.productFilter.value === item.label ? "all" : item.label;
      applyFilters();
      document.querySelector(".table-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  });

  const maturityOrder = ["已到期", "7天内", "8-30天", "31-60天", "61-90天", "91-180天", "181-365天", "一年后", "未填到期日"];
  const byMaturity = maturityOrder
    .map((label) => ({
      label,
      value: sum(rows.filter((row) => maturityBucket(row) === label)),
      filterValue: filterValueForBucket(label),
      active: state.maturityFilter === filterValueForBucket(label),
    }))
    .filter((item) => item.value > 0);
  renderBars(els.maturityBars, byMaturity, total, {
    onClick: (item) => {
      if (!item.filterValue) return;
      state.maturityFilter = state.maturityFilter === item.filterValue ? "all" : item.filterValue;
      ensureMaturityOptions();
      els.maturityFilter.value = state.maturityFilter;
      applyFilters();
      document.querySelector(".table-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  });

  const rateOrder = ["2%以下", "2.0%-2.5%", "2.5%-3.0%", "3.0%-3.5%", "3.5%以上", "未填利率"];
  const byRate = rateOrder
    .map((label) => ({
      label,
      value: sum(rows.filter((row) => rateBucket(row) === label)),
      filterValue: filterValueForRateBucket(label),
      active: state.rateBucket === filterValueForRateBucket(label),
    }))
    .filter((item) => item.value > 0);
  renderBars(els.rateBars, byRate, total, {
    onClick: (item) => {
      state.rateBucket = state.rateBucket === item.filterValue ? "all" : item.filterValue;
      applyFilters();
      document.querySelector(".table-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  });

  const nearTermRows = rows.filter((row) => {
    const days = daysUntil(row.maturityDate);
    return days !== null && days >= 0 && days <= 365;
  });
  const byNearTermProduct = groupBy(nearTermRows, "product").map((item) => ({
    ...item,
    active: els.productFilter.value === item.label && state.maturityFilter === "365",
  }));
  renderBars(els.nearTermProductBars, byNearTermProduct, sum(nearTermRows), {
    onClick: (item) => {
      els.productFilter.value = els.productFilter.value === item.label ? "all" : item.label;
      state.maturityFilter = "365";
      ensureMaturityOptions();
      els.maturityFilter.value = state.maturityFilter;
      applyFilters();
      document.querySelector(".table-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  });

  const byBorrower = groupBy(rows, "borrower").slice(0, 10).map((item) => ({
    ...item,
    active: els.borrowerFilter.value === item.label,
  }));
  renderBars(els.borrowerBars, byBorrower, total, {
    onClick: (item) => {
      els.borrowerFilter.value = els.borrowerFilter.value === item.label ? "all" : item.label;
      applyFilters();
      document.querySelector(".table-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  });
}

function matchesMaturity(row, filter) {
  if (filter === "all") return true;
  const days = daysUntil(row.maturityDate);
  if (filter === "overdue") return days !== null && days < 0;
  if (filter === "7") return days !== null && days >= 0 && days <= 7;
  if (filter === "30") return days !== null && days >= 0 && days <= 30;
  if (filter === "60") return days !== null && days >= 0 && days <= 60;
  if (filter === "90") return days !== null && days >= 0 && days <= 90;
  if (filter === "bucket-30") return days !== null && days > 7 && days <= 30;
  if (filter === "bucket-60") return days !== null && days > 30 && days <= 60;
  if (filter === "bucket-90") return days !== null && days > 60 && days <= 90;
  if (filter === "bucket-180") return days !== null && days > 90 && days <= 180;
  if (filter === "bucket-365") return days !== null && days > 180 && days <= 365;
  if (filter === "365") return days !== null && days >= 0 && days <= 365;
  if (filter === "long") return days !== null && days > 365;
  if (filter === "no-date") return days === null;
  return true;
}

function applyFilters() {
  const term = els.searchInput.value.trim().toLowerCase();
  const borrower = els.borrowerFilter.value;
  const institution = els.institutionFilter.value;
  const product = els.productFilter.value;
  const maturity = state.maturityFilter;

  state.filtered = state.rows.filter((row) => {
    const haystack = [row.borrower, row.institution, row.product, row.purpose, row.notes]
      .join(" ")
      .toLowerCase();
    return (
      (!term || haystack.includes(term)) &&
      (borrower === "all" || row.borrower === borrower) &&
      (institution === "all" || row.institution === institution) &&
      (product === "all" || row.product === product) &&
      matchesMaturity(row, maturity) &&
      (state.rateBucket === "all" || filterValueForRateBucket(rateBucket(row)) === state.rateBucket)
    );
  });

  sortRows();
  renderSummary(state.filtered);
  renderTable();
}

function sortRows() {
  const key = state.sortKey;
  const dir = state.sortDir === "asc" ? 1 : -1;
  state.filtered.sort((a, b) => {
    const av = a[key] ?? "";
    const bv = b[key] ?? "";
    if (typeof av === "number" || typeof bv === "number") {
      return ((Number(av) || 0) - (Number(bv) || 0)) * dir;
    }
    return String(av).localeCompare(String(bv), "zh-CN") * dir;
  });
}

function dueClass(row) {
  const days = daysUntil(row.maturityDate);
  if (days === null) return "";
  if (days < 0) return "due-overdue";
  if (days <= 180) return "due-soon";
  return "";
}

function renderTable() {
  els.tableCount.textContent = `${state.filtered.length} 条`;
  renderTableSummary();
  els.detailBody.innerHTML = "";
  if (!state.filtered.length) {
    els.detailBody.innerHTML = '<tr><td colspan="7" class="empty">没有符合条件的数据</td></tr>';
    return;
  }

  const frag = document.createDocumentFragment();
  for (const row of state.filtered) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.borrower}</td>
      <td>${row.institution}</td>
      <td><span class="tag">${row.product}</span></td>
      <td class="number">${money(row.balance)}</td>
      <td class="number">${rate(row.rate)}</td>
      <td class="${dueClass(row)}">${dateText(row.maturityDate)}</td>
      <td>${row.purpose || ""}</td>
    `;
    frag.appendChild(tr);
  }
  els.detailBody.appendChild(frag);
}

function renderTableSummary() {
  const total = sum(state.filtered);
  const dueOneYear = state.filtered.filter((row) => {
    const days = daysUntil(row.maturityDate);
    return days !== null && days >= 0 && days <= 365;
  });
  els.summaryBalance.textContent = `${money(total)} 万元`;
  els.summaryRate.textContent = rate(weightedRate(state.filtered));
  els.summaryDue.textContent = `一年内到期 ${money(sum(dueOneYear))} 万元`;
  els.summaryCount.textContent = `${state.filtered.length} 条`;
}

function fillFilter(select, rows, key, label) {
  const current = select.value || "all";
  const values = [...new Set(rows.map((row) => row[key] || "未填写"))].sort((a, b) =>
    a.localeCompare(b, "zh-CN")
  );
  select.innerHTML = `<option value="all">全部${label}</option>`;
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
  select.value = values.includes(current) ? current : "all";
}

function refreshFilters(rows) {
  fillFilter(els.borrowerFilter, rows, "borrower", "主体");
  fillFilter(els.institutionFilter, rows, "institution", "机构");
  fillFilter(els.productFilter, rows, "product", "品种");
}

function showWorkspace() {
  state.loaded = true;
  els.emptyState.classList.add("is-hidden");
  els.workspace.classList.remove("is-hidden");
  els.exportButton.disabled = false;
  els.exportFilteredButton.disabled = false;
}

function loadPayload(payload) {
  if (payload.error) throw new Error(payload.error);
  state.rows = payload.rows || [];
  state.rateBucket = "all";
  refreshFilters(state.rows);
  showWorkspace();
  els.sourceName.textContent = payload.sourceFile || "已读取 Excel";
  els.sheetName.textContent = `工作表：${payload.sheetName || "第二个工作表"}；有效明细：${payload.rowCount || 0} 条`;
  els.loadedAt.textContent = payload.loadedAt ? `读取时间：${payload.loadedAt.replace("T", " ")}` : "";
  resetFilters(false);
}

async function loadDefaultForTest() {
  const res = await fetch("/api/load-default");
  loadPayload(await res.json());
}

async function loadCurrentFromServer() {
  try {
    const res = await fetch("/api/current");
    if (!res.ok) return;
    loadPayload(await res.json());
  } catch (error) {
    // Keep the import screen available when the server has no current workbook.
  }
}

async function uploadFile(file) {
  if (!file) return;
  try {
    els.sourceName.textContent = "正在读取新表...";
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    loadPayload(await res.json());
  } catch (error) {
    alert(error.message);
  }
}

function resetFilters(shouldApply = true) {
  els.searchInput.value = "";
  els.borrowerFilter.value = "all";
  els.institutionFilter.value = "all";
  els.productFilter.value = "all";
  state.maturityFilter = "all";
  ensureMaturityOptions();
  els.maturityFilter.value = "all";
  state.rateBucket = "all";
  if (shouldApply) applyFilters();
  else {
    state.filtered = [...state.rows];
    sortRows();
    renderSummary(state.filtered);
    renderTable();
  }
}

async function exportDetails() {
  els.exportButton.disabled = true;
  els.exportButton.textContent = "正在生成...";
  try {
    const res = await fetch("/api/export-details");
    if (!res.ok) {
      const payload = await res.json();
      throw new Error(payload.error || "导出失败");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `融资明细（${new Date().toISOString().slice(0, 10).replaceAll("-", "")}）.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    alert(error.message);
  } finally {
    els.exportButton.disabled = !state.loaded;
    els.exportButton.textContent = "获取融资明细";
  }
}

async function exportFilteredDetails() {
  if (!state.loaded) return;
  els.exportFilteredButton.disabled = true;
  els.exportFilteredButton.textContent = "正在导出...";
  try {
    const res = await fetch("/api/export-filtered", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: state.filtered }),
    });
    if (!res.ok) {
      const payload = await res.json();
      throw new Error(payload.error || "导出失败");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `筛选融资明细（${new Date().toISOString().slice(0, 10).replaceAll("-", "")}）.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    alert(error.message);
  } finally {
    els.exportFilteredButton.disabled = !state.loaded;
    els.exportFilteredButton.textContent = "导出当前筛选";
  }
}

function bindDropZone(label, input) {
  input.addEventListener("change", (event) => uploadFile(event.target.files[0]));
  label.addEventListener("dragover", (event) => {
    event.preventDefault();
    label.classList.add("dragging");
  });
  label.addEventListener("dragleave", () => label.classList.remove("dragging"));
  label.addEventListener("drop", (event) => {
    event.preventDefault();
    label.classList.remove("dragging");
    uploadFile(event.dataTransfer.files[0]);
  });
}

els.searchInput.addEventListener("input", applyFilters);
els.borrowerFilter.addEventListener("change", applyFilters);
els.institutionFilter.addEventListener("change", applyFilters);
els.productFilter.addEventListener("change", applyFilters);
els.maturityFilter.addEventListener("change", () => {
  state.maturityFilter = els.maturityFilter.value || "all";
  applyFilters();
});
els.rateScope.addEventListener("change", () => renderSummary(state.filtered));
els.resetFilters.addEventListener("click", () => resetFilters());
els.exportButton.addEventListener("click", exportDetails);
els.exportFilteredButton.addEventListener("click", exportFilteredDetails);
bindDropZone(els.dropZone, els.heroFileInput);
bindDropZone(els.topDropZone, els.fileInput);

document.querySelectorAll("th[data-sort]").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (state.sortKey === key) {
      state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
    } else {
      state.sortKey = key;
      state.sortDir = key === "balance" ? "desc" : "asc";
    }
    applyFilters();
  });
});

ensureMaturityOptions();

if (new URLSearchParams(location.search).get("sample") === "1") {
  loadDefaultForTest();
} else {
  loadCurrentFromServer();
}
