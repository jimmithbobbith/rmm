const STORAGE_KEY = "cm-admin-config";
const statusEl = document.getElementById("admin-status");
const table = document.getElementById("admin-table");
const rowsEl = document.getElementById("admin-rows");
const form = document.getElementById("admin-config");
const logoutBtn = document.getElementById("admin-logout");
const functionsInput = document.getElementById("functions-url");
const tokenInput = document.getElementById("admin-token");

init();

function init() {
  const saved = loadConfig();
  if (saved) {
    functionsInput.value = saved.functionsUrl;
    tokenInput.value = saved.token;
    fetchJobs();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    saveConfig();
    fetchJobs();
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    tokenInput.value = "";
    statusEl.textContent = "Session cleared";
    table.hidden = true;
  });
}

function loadConfig() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse admin config", e);
    return null;
  }
}

function saveConfig() {
  const config = {
    functionsUrl: functionsInput.value.trim().replace(/\/$/, ""),
    token: tokenInput.value.trim(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function getConfig() {
  const config = loadConfig();
  if (!config?.functionsUrl || !config?.token) return null;
  return config;
}

async function fetchJobs() {
  const config = getConfig();
  if (!config) {
    statusEl.textContent = "Enter a functions URL and admin token to load jobs.";
    table.hidden = true;
    return;
  }

  statusEl.textContent = "Loading jobs…";
  table.hidden = true;

  try {
    const res = await fetch(`${config.functionsUrl}/admin-jobs`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    renderJobs(json.jobs || []);
    statusEl.textContent = `${json.jobs?.length ?? 0} jobs loaded`;
    table.hidden = false;
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Unable to load jobs. Check URL/token.";
  }
}

function renderJobs(jobs) {
  rowsEl.innerHTML = "";
  if (!jobs.length) {
    rowsEl.innerHTML = '<div class="admin-empty">No jobs found.</div>';
    return;
  }

  jobs.forEach((job) => {
    const row = document.createElement("div");
    row.className = "admin-row";

    const services = Array.isArray(job.services) ? job.services : [];
    const serviceList = services
      .map((s) => `${s.name}${s.price ? ` (£${Number(s.price).toFixed(2)})` : ""}`)
      .join(", ");

    row.innerHTML = `
      <div class="mono">${job.reg}</div>
      <div>
        <div>${job.contact?.name ?? ""}</div>
        <div class="muted">${job.contact?.phone ?? ""}</div>
      </div>
      <div>${serviceList || "-"}</div>
      <div><span class="status-pill status-${job.status}">${job.status}</span></div>
      <div class="muted">${new Date(job.created_at).toLocaleString()}</div>
      <div class="admin-actions">
        <button class="button tertiary" data-id="${job.id}" data-action="done">Mark done</button>
        <button class="button secondary" data-id="${job.id}" data-action="refresh">Refresh</button>
      </div>
    `;

    row.addEventListener("click", (e) => handleRowAction(e, job));
    rowsEl.appendChild(row);
  });
}

async function handleRowAction(event, job) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "refresh") return fetchJobs();
  if (action !== "done") return;

  const confirmed = confirm(`Mark ${job.reg} as done?`);
  if (!confirmed) return;
  await updateStatus(job.id, "done");
}

async function updateStatus(id, status) {
  const config = getConfig();
  if (!config) return;

  statusEl.textContent = "Updating status…";
  try {
    const res = await fetch(`${config.functionsUrl}/admin-jobs`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) throw new Error(await res.text());
    await fetchJobs();
    statusEl.textContent = "Status updated";
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Unable to update status";
  }
}
