/* HSA 영수증 관리 — 순수 브라우저 앱 (IndexedDB 로컬 저장) */
"use strict";

const DB_NAME = "hsa-receipts";
const DB_VERSION = 1;

const CATEGORIES = [
  "진료 (Medical)",
  "약국 (Pharmacy)",
  "치과 (Dental)",
  "안과/시력 (Vision)",
  "검사 (Lab/Test)",
  "정신건강 (Mental Health)",
  "의료기기 (Equipment)",
  "기타 (Other)",
];

const STATUS_LABELS = {
  unclaimed: "미청구",
  claimed: "청구됨",
  reimbursed: "상환완료",
};

let db = null;
let receipts = []; // 메모리 캐시 (attachment 제외)
let sortKey = "date";
let sortDir = -1; // 최신순 기본
let pendingAttachment = undefined; // undefined: 변경 없음, null: 삭제, {type,blob}: 교체

// ---------- IndexedDB ----------

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains("receipts")) {
        d.createObjectStore("receipts", { keyPath: "id" });
      }
      if (!d.objectStoreNames.contains("attachments")) {
        d.createObjectStore("attachments", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(store, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const result = fn(t.objectStore(store));
    t.oncomplete = () => resolve(result && "result" in result ? result.result : undefined);
    t.onerror = () => reject(t.error);
  });
}

const putReceipt = (r) => tx("receipts", "readwrite", (s) => s.put(r));
const deleteReceiptRow = (id) => tx("receipts", "readwrite", (s) => s.delete(id));
const putAttachment = (a) => tx("attachments", "readwrite", (s) => s.put(a));
const deleteAttachment = (id) => tx("attachments", "readwrite", (s) => s.delete(id));

function getAll(store) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getOne(store, id) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ---------- 유틸 ----------

const $ = (sel) => document.querySelector(sel);
const uuid = () =>
  crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const fmtUsd = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl) {
  return (await fetch(dataUrl)).blob();
}

// ---------- 필터/정렬 ----------

function visibleReceipts() {
  const q = $("#filterSearch").value.trim().toLowerCase();
  const year = $("#filterYear").value;
  const cat = $("#filterCategory").value;
  const status = $("#filterStatus").value;

  let list = receipts.filter((r) => {
    if (year && !r.date.startsWith(year)) return false;
    if (cat && r.category !== cat) return false;
    if (status && r.status !== status) return false;
    if (q) {
      const hay = `${r.provider} ${r.person} ${r.notes}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  list.sort((a, b) => {
    const va = a[sortKey] ?? "";
    const vb = b[sortKey] ?? "";
    const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
    return cmp * sortDir;
  });
  return list;
}

// ---------- 렌더링 ----------

function renderSummary() {
  const eligible = receipts.filter((r) => r.eligible);
  const sum = (arr) => arr.reduce((acc, r) => acc + (r.amount || 0), 0);
  const thisYear = String(new Date().getFullYear());

  $("#sumEligible").textContent = fmtUsd(sum(eligible));
  $("#sumUnreimbursed").textContent = fmtUsd(sum(eligible.filter((r) => r.status !== "reimbursed")));
  $("#sumThisYear").textContent = fmtUsd(sum(receipts.filter((r) => r.date.startsWith(thisYear))));
  $("#sumCount").textContent = String(receipts.length);
}

function renderFilterOptions() {
  const years = [...new Set(receipts.map((r) => r.date.slice(0, 4)))].sort().reverse();
  const yearSel = $("#filterYear");
  const cur = yearSel.value;
  yearSel.innerHTML =
    '<option value="">전체 연도</option>' +
    years.map((y) => `<option value="${y}">${y}년</option>`).join("");
  if (years.includes(cur)) yearSel.value = cur;

  const catSel = $("#filterCategory");
  const curCat = catSel.value;
  catSel.innerHTML =
    '<option value="">전체 카테고리</option>' +
    CATEGORIES.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  catSel.value = curCat;

  $("#personList").innerHTML = [...new Set(receipts.map((r) => r.person).filter(Boolean))]
    .map((p) => `<option value="${escapeHtml(p)}"></option>`)
    .join("");
}

function renderTable() {
  const list = visibleReceipts();
  const body = $("#receiptBody");
  $("#emptyState").hidden = receipts.length > 0;
  $("#receiptTable").style.display = receipts.length ? "" : "none";

  body.innerHTML = list
    .map(
      (r) => `
    <tr data-id="${r.id}">
      <td>${r.date}</td>
      <td>${escapeHtml(r.provider)}</td>
      <td>${escapeHtml(r.category || "")}</td>
      <td>${escapeHtml(r.person || "")}</td>
      <td class="amount-col">${fmtUsd(r.amount)}</td>
      <td>${r.eligible ? '<span class="badge badge-eligible">적격</span>' : '<span class="badge badge-ineligible">비적격</span>'}</td>
      <td><button class="badge badge-${r.status}" data-action="cycle-status" title="클릭하여 상태 변경">${STATUS_LABELS[r.status] || r.status}</button></td>
      <td>${r.hasAttachment ? '<button class="link-btn" data-action="view">보기</button>' : '<span style="color:var(--text-muted)">—</span>'}</td>
      <td class="row-actions">
        <button class="btn btn-small" data-action="edit">수정</button>
        <button class="btn btn-small btn-danger" data-action="delete">삭제</button>
      </td>
    </tr>`
    )
    .join("");

  const footer = $("#listFooter");
  if (receipts.length === 0) {
    footer.textContent = "";
  } else if (list.length === 0) {
    footer.textContent = "조건에 맞는 영수증이 없습니다. 필터를 확인해 주세요.";
  } else {
    const total = list.reduce((acc, r) => acc + (r.amount || 0), 0);
    footer.textContent = `${list.length}건 표시 · 합계 ${fmtUsd(total)}`;
  }
}

function renderAll() {
  renderSummary();
  renderFilterOptions();
  renderTable();
}

// ---------- 폼 (추가/수정) ----------

function openForm(receipt) {
  pendingAttachment = undefined;
  $("#dialogTitle").textContent = receipt ? "영수증 수정" : "영수증 추가";
  $("#fId").value = receipt?.id || "";
  $("#fDate").value = receipt?.date || new Date().toISOString().slice(0, 10);
  $("#fAmount").value = receipt?.amount ?? "";
  $("#fProvider").value = receipt?.provider || "";
  $("#fCategory").innerHTML = CATEGORIES.map(
    (c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`
  ).join("");
  $("#fCategory").value = receipt?.category || CATEGORIES[0];
  $("#fPerson").value = receipt?.person || "";
  $("#fStatus").value = receipt?.status || "unclaimed";
  $("#fEligible").checked = receipt ? !!receipt.eligible : true;
  $("#fNotes").value = receipt?.notes || "";
  $("#fImage").value = "";
  showAttachmentPreview(null);

  if (receipt?.hasAttachment) {
    getOne("attachments", receipt.id).then((a) => {
      if (a) showAttachmentPreview(a);
    });
  }
  $("#receiptDialog").showModal();
}

function showAttachmentPreview(att) {
  const wrap = $("#imagePreviewWrap");
  const img = $("#imagePreview");
  const pdfBadge = $("#pdfBadge");
  if (!att) {
    wrap.hidden = true;
    img.src = "";
    return;
  }
  wrap.hidden = false;
  const isPdf = att.type === "application/pdf";
  pdfBadge.hidden = !isPdf;
  img.hidden = isPdf;
  img.src = isPdf ? "" : URL.createObjectURL(att.blob);
}

async function saveForm(e) {
  e.preventDefault();
  const id = $("#fId").value || uuid();
  const existing = receipts.find((r) => r.id === id);

  const receipt = {
    id,
    date: $("#fDate").value,
    amount: parseFloat($("#fAmount").value) || 0,
    provider: $("#fProvider").value.trim(),
    category: $("#fCategory").value,
    person: $("#fPerson").value.trim(),
    status: $("#fStatus").value,
    eligible: $("#fEligible").checked,
    notes: $("#fNotes").value.trim(),
    hasAttachment: existing?.hasAttachment || false,
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  if (pendingAttachment === null) {
    await deleteAttachment(id);
    receipt.hasAttachment = false;
  } else if (pendingAttachment) {
    await putAttachment({ id, type: pendingAttachment.type, blob: pendingAttachment.blob });
    receipt.hasAttachment = true;
  }

  await putReceipt(receipt);
  receipts = receipts.filter((r) => r.id !== id).concat(receipt);
  $("#receiptDialog").close();
  renderAll();
}

// ---------- 행 액션 ----------

async function onTableClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const id = btn.closest("tr").dataset.id;
  const receipt = receipts.find((r) => r.id === id);
  if (!receipt) return;

  const action = btn.dataset.action;
  if (action === "cycle-status") {
    const order = ["unclaimed", "claimed", "reimbursed"];
    receipt.status = order[(order.indexOf(receipt.status) + 1) % order.length];
    receipt.updatedAt = Date.now();
    await putReceipt(receipt);
    renderSummary();
    renderTable();
  } else if (action === "edit") {
    openForm(receipt);
  } else if (action === "delete") {
    if (!confirm(`${receipt.date} ${receipt.provider} (${fmtUsd(receipt.amount)}) 영수증을 삭제할까요?`)) return;
    await deleteReceiptRow(id);
    await deleteAttachment(id);
    receipts = receipts.filter((r) => r.id !== id);
    renderAll();
  } else if (action === "view") {
    const att = await getOne("attachments", id);
    if (!att) return alert("첨부를 찾을 수 없습니다.");
    const url = URL.createObjectURL(att.blob);
    $("#viewerContent").innerHTML =
      att.type === "application/pdf"
        ? `<embed src="${url}" type="application/pdf" />`
        : `<img src="${url}" alt="영수증" />`;
    $("#viewerDialog").showModal();
  }
}

// ---------- CSV / 백업 ----------

function exportCsv() {
  const list = visibleReceipts();
  const header = ["date", "provider", "category", "person", "amount_usd", "eligible", "status", "notes"];
  const rows = list.map((r) =>
    [r.date, r.provider, r.category, r.person, r.amount.toFixed(2), r.eligible ? "Y" : "N", STATUS_LABELS[r.status], r.notes]
      .map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`)
      .join(",")
  );
  const csv = "\uFEFF" + [header.join(","), ...rows].join("\n"); // BOM: Excel 한글 호환
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `hsa-receipts-${today()}.csv`);
}

async function exportBackup() {
  const attachments = await getAll("attachments");
  const attData = await Promise.all(
    attachments.map(async (a) => ({ id: a.id, type: a.type, dataUrl: await blobToDataUrl(a.blob) }))
  );
  const payload = { app: "hsa-receipts", version: 1, exportedAt: new Date().toISOString(), receipts, attachments: attData };
  downloadBlob(
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
    `hsa-receipts-backup-${today()}.json`
  );
}

async function restoreBackup(file) {
  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    return alert("JSON 파일을 읽을 수 없습니다.");
  }
  if (payload?.app !== "hsa-receipts" || !Array.isArray(payload.receipts)) {
    return alert("이 앱의 백업 파일이 아닙니다.");
  }
  if (!confirm(`백업의 영수증 ${payload.receipts.length}건을 불러옵니다. 같은 ID의 기존 항목은 덮어씁니다. 계속할까요?`)) return;

  for (const r of payload.receipts) await putReceipt(r);
  for (const a of payload.attachments || []) {
    await putAttachment({ id: a.id, type: a.type, blob: await dataUrlToBlob(a.dataUrl) });
  }
  receipts = await getAll("receipts");
  renderAll();
  alert("복원 완료!");
}

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

const today = () => new Date().toISOString().slice(0, 10);

// ---------- 초기화 ----------

async function init() {
  db = await openDb();
  receipts = await getAll("receipts");
  renderAll();

  $("#btnAdd").addEventListener("click", () => openForm(null));
  $("#receiptForm").addEventListener("submit", saveForm);
  $("#btnCancel").addEventListener("click", () => $("#receiptDialog").close());
  $("#receiptBody").addEventListener("click", onTableClick);
  $("#btnViewerClose").addEventListener("click", () => $("#viewerDialog").close());

  $("#fImage").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pendingAttachment = { type: file.type, blob: file };
    showAttachmentPreview(pendingAttachment);
  });
  $("#btnRemoveImage").addEventListener("click", () => {
    pendingAttachment = null;
    $("#fImage").value = "";
    showAttachmentPreview(null);
  });

  for (const id of ["filterSearch", "filterYear", "filterCategory", "filterStatus"]) {
    $("#" + id).addEventListener("input", renderTable);
  }

  document.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (sortKey === key) sortDir *= -1;
      else { sortKey = key; sortDir = key === "date" ? -1 : 1; }
      renderTable();
    });
  });

  $("#btnExportCsv").addEventListener("click", exportCsv);
  $("#btnBackup").addEventListener("click", exportBackup);
  $("#btnRestore").addEventListener("click", () => $("#restoreFile").click());
  $("#restoreFile").addEventListener("change", (e) => {
    if (e.target.files[0]) restoreBackup(e.target.files[0]);
    e.target.value = "";
  });
}

init().catch((err) => {
  console.error(err);
  alert("앱 초기화에 실패했습니다: " + err.message);
});
