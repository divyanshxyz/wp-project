const playerForm = document.getElementById("playerForm");
const inputSport = document.getElementById("inputSport");
const inputTeam = document.getElementById("inputTeam");
const inputGender = document.getElementById("inputGender");
const editingId = document.getElementById("editingId");

const formTitle = document.getElementById("formTitle");
const btnSubmit = document.getElementById("btnSubmit");
const btnCancelEdit = document.getElementById("btnCancelEdit");
const btnRefresh = document.getElementById("btnRefresh");
const btnAddRow = document.getElementById("btnAddRow");

const playerRowsContainer = document.getElementById("playerRows");
const tableBody = document.getElementById("playerTableBody");
const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");
const dbStatus = document.getElementById("dbStatus");
const toast = document.getElementById("toast");

const statTotal = document.getElementById("statTotal");
const statSports = document.getElementById("statSports");
const statTeams = document.getElementById("statTeams");
const statAvgAge = document.getElementById("statAvgAge");
const statAvgWeight = document.getElementById("statAvgWeight");

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const navRoster = document.getElementById("navRoster");
const navAdd = document.getElementById("navAdd");
const btnExportCsv = document.getElementById("btnExportCsv");
const pageRoster = document.getElementById("pageRoster");
const pageAdd = document.getElementById("pageAdd");

let allPlayers = [];
let rowCount = 1;
const API_BASE = "/api/players";

function switchPage(page) {
  document.querySelectorAll(".nav-item[data-page]").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".page-content").forEach((p) => p.classList.remove("active"));

  if (page === "roster") {
    navRoster.classList.add("active");
    pageRoster.classList.add("active");
  } else if (page === "add") {
    navAdd.classList.add("active");
    pageAdd.classList.add("active");
  }

  if (window.innerWidth <= 900) {
    sidebar.classList.remove("open");
  }
}

navRoster.addEventListener("click", () => switchPage("roster"));
navAdd.addEventListener("click", () => switchPage("add"));

sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

function createPlayerRowHTML(index) {
  const div = document.createElement("div");
  div.className = "player-row";
  div.dataset.index = index;
  div.innerHTML = `
    <div class="player-row-header">
      <span class="player-row-number">Player ${index + 1}</span>
      <button type="button" class="btn-remove-row" data-remove="${index}">Remove</button>
    </div>
    <div class="form-row form-row-3">
      <div class="form-group">
        <label>Full Name *</label>
        <input type="text" class="row-name" placeholder="e.g. Virat Kohli" required />
      </div>
      <div class="form-group">
        <label>Age *</label>
        <input type="number" class="row-age" placeholder="25" min="15" max="100" required />
      </div>
      <div class="form-group">
        <label>Weight (kg) *</label>
        <input type="number" class="row-weight" placeholder="70" min="30" max="200" step="0.1" required />
      </div>
    </div>
  `;
  return div;
}

function renumberRows() {
  const rows = playerRowsContainer.querySelectorAll(".player-row");
  rows.forEach((row, i) => {
    row.querySelector(".player-row-number").textContent = `Player ${i + 1}`;
  });
  rowCount = rows.length;
}

btnAddRow.addEventListener("click", () => {
  const newRow = createPlayerRowHTML(rowCount);
  playerRowsContainer.appendChild(newRow);
  renumberRows();
  newRow.querySelector(".row-name").focus();
});

playerRowsContainer.addEventListener("click", (e) => {
  const removeBtn = e.target.closest(".btn-remove-row");
  if (!removeBtn) return;

  const rows = playerRowsContainer.querySelectorAll(".player-row");
  if (rows.length <= 1) {
    showToast("At least one player row is required.", "error");
    return;
  }

  removeBtn.closest(".player-row").remove();
  renumberRows();
});

function getPlayerRowsData() {
  const rows = playerRowsContainer.querySelectorAll(".player-row");
  const players = [];

  rows.forEach((row) => {
    players.push({
      name: row.querySelector(".row-name").value.trim(),
      age: row.querySelector(".row-age").value,
      weight: row.querySelector(".row-weight").value,
    });
  });

  return players;
}

function sortPlayers(players) {
  return [...players].sort((a, b) => {
    const sportCompare = (a.sport || "").localeCompare(b.sport || "");
    if (sportCompare !== 0) return sportCompare;
    return (a.team || "").localeCompare(b.team || "");
  });
}

function exportToCsv() {
  if (allPlayers.length === 0) {
    showToast("No data to export.", "error");
    return;
  }

  const headers = ["Name", "Sport", "Team", "Gender", "Age", "Weight (kg)"];
  const sorted = sortPlayers(allPlayers);

  const rows = sorted.map((p) => [
    `"${(p.name || "").replace(/"/g, '""')}"`,
    `"${(p.sport || "").replace(/"/g, '""')}"`,
    `"${(p.team || "Free Agent").replace(/"/g, '""')}"`,
    `"${(p.gender || "").replace(/"/g, '""')}"`,
    p.age || 0,
    p.weight || 0,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "players_roster.csv";
  link.click();

  URL.revokeObjectURL(url);
  showToast("CSV exported successfully.", "success");
}

btnExportCsv.addEventListener("click", exportToCsv);

async function fetchAllPlayers() {
  const response = await fetch(API_BASE);
  if (!response.ok) throw new Error("GET failed: " + response.status);
  return response.json();
}

async function createPlayer(data) {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Create failed");
  return result;
}

async function createBulkPlayers(players) {
  const response = await fetch(`${API_BASE}/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ players }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Bulk create failed");
  return result;
}

async function updatePlayer(id, data) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Update failed");
  return result;
}

async function deletePlayer(id) {
  const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Delete failed");
  return result;
}

function renderTable(players) {
  const sorted = sortPlayers(players);

  if (sorted.length === 0) {
    emptyState.hidden = false;
    tableBody.innerHTML = "";
    return;
  }

  emptyState.hidden = true;

  tableBody.innerHTML = sorted
    .map((player, i) => {
      return `
        <tr data-id="${player._id}">
          <td>${i + 1}</td>
          <td><strong>${player.name}</strong></td>
          <td><span class="sport-badge ${player.sport.replace(/\s+/g, '-')}">${player.sport}</span></td>
          <td>${player.team || "---"}</td>
          <td>${player.gender || "---"}</td>
          <td>${player.age || "---"}</td>
          <td>${player.weight ? player.weight + " kg" : "---"}</td>
          <td class="actions-cell">
            <button class="btn-edit" data-action="edit" data-id="${player._id}">Edit</button>
            <button class="btn-delete" data-action="delete" data-id="${player._id}">Remove</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function updateStats() {
  const total = allPlayers.length;

  const avgAge = total > 0
    ? (allPlayers.reduce((sum, p) => sum + (p.age || 0), 0) / total).toFixed(1)
    : "---";

  const sports = new Set(allPlayers.map((p) => p.sport)).size;

  const teams = new Set(
    allPlayers
      .map((p) => p.team)
      .filter((t) => t && t !== "Free Agent")
  ).size;

  const withWeight = allPlayers.filter((p) => p.weight > 0);
  const avgWeight = withWeight.length > 0
    ? (withWeight.reduce((sum, p) => sum + p.weight, 0) / withWeight.length).toFixed(1) + " kg"
    : "---";

  statTotal.textContent = total;
  statSports.textContent = sports || "---";
  statTeams.textContent = teams || "---";
  statAvgAge.textContent = avgAge;
  statAvgWeight.textContent = avgWeight;
}

async function loadPlayers() {
  emptyState.hidden = true;
  tableBody.innerHTML = "";

  try {
    allPlayers = await fetchAllPlayers();
    renderTable(allPlayers);
    updateStats();
    dbStatus.className = "db-status connected";
    dbStatus.querySelector(".status-text").textContent = "DB Connected";
  } catch (err) {
    dbStatus.className = "db-status error";
    dbStatus.querySelector(".status-text").textContent = "DB Error";
    showToast("Could not load players: " + err.message, "error");
  }
}

playerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const sport = inputSport.value;
  const team = inputTeam.value.trim();
  const gender = inputGender.value;

  if (!sport) {
    showToast("Sport Type is required.", "error");
    return;
  }

  if (!team) {
    showToast("Team Name is required.", "error");
    return;
  }

  if (!gender) {
    showToast("Gender is required.", "error");
    return;
  }

  const isEditing = editingId.value !== "";

  try {
    btnSubmit.disabled = true;

    if (isEditing) {
      const rowData = getPlayerRowsData()[0];

      if (!rowData.name) {
        showToast("Full Name is required.", "error");
        return;
      }

      await updatePlayer(editingId.value, {
        name: rowData.name,
        sport,
        team,
        gender,
        age: rowData.age,
        weight: rowData.weight,
      });
      showToast(rowData.name + " updated.", "success");
    } else {
      const playerRows = getPlayerRowsData();

      for (let i = 0; i < playerRows.length; i++) {
        if (!playerRows[i].name) {
          showToast(`Player ${i + 1}: Full Name is required.`, "error");
          return;
        }
      }

      const fullPlayers = playerRows.map((row) => ({
        name: row.name,
        sport,
        team,
        gender,
        age: row.age,
        weight: row.weight,
      }));

      if (fullPlayers.length === 1) {
        await createPlayer(fullPlayers[0]);
        showToast(fullPlayers[0].name + " added to the roster.", "success");
      } else {
        await createBulkPlayers(fullPlayers);
        showToast(fullPlayers.length + " players added to the roster.", "success");
      }
    }

    resetForm();
    await loadPlayers();
    switchPage("roster");
  } catch (err) {
    showToast("Error: " + err.message, "error");
  } finally {
    btnSubmit.disabled = false;
  }
});

tableBody.addEventListener("click", async (e) => {
  const button = e.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const playerId = button.dataset.id;

  if (action === "edit") {
    handleEdit(playerId);
  } else if (action === "delete") {
    handleDelete(playerId, button);
  }
});

function handleEdit(playerId) {
  const player = allPlayers.find((p) => p._id === playerId);
  if (!player) return;

  switchPage("add");

  inputSport.value = player.sport;
  inputTeam.value = player.team || "";
  inputGender.value = player.gender || "";
  editingId.value = player._id;

  playerRowsContainer.innerHTML = "";
  const row = createPlayerRowHTML(0);
  playerRowsContainer.appendChild(row);
  row.querySelector(".row-name").value = player.name;
  row.querySelector(".row-age").value = player.age || "";
  row.querySelector(".row-weight").value = player.weight || "";
  rowCount = 1;

  formTitle.textContent = "Edit Player";
  btnSubmit.textContent = "Save Changes";
  btnAddRow.hidden = true;
  btnCancelEdit.hidden = false;

  playerForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleDelete(playerId, button) {
  const player = allPlayers.find((p) => p._id === playerId);
  const name = player ? player.name : "this player";

  if (!confirm("Remove " + name + " from the roster?")) return;

  try {
    button.disabled = true;
    await deletePlayer(playerId);
    showToast(name + " removed.", "info");

    if (editingId.value === playerId) resetForm();
    await loadPlayers();
  } catch (err) {
    showToast("Error: " + err.message, "error");
    button.disabled = false;
  }
}

btnCancelEdit.addEventListener("click", () => {
  resetForm();
  switchPage("roster");
});

function resetForm() {
  playerForm.reset();
  editingId.value = "";
  formTitle.textContent = "Add Players";
  btnSubmit.textContent = "Submit";
  btnAddRow.hidden = false;
  btnCancelEdit.hidden = true;

  playerRowsContainer.innerHTML = "";
  const row = createPlayerRowHTML(0);
  playerRowsContainer.appendChild(row);
  rowCount = 1;

  document.querySelectorAll(".editing-row").forEach((r) => r.classList.remove("editing-row"));
}

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase().trim();

  if (!query) {
    renderTable(allPlayers);
    return;
  }

  const filtered = allPlayers.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.sport.toLowerCase().includes(query) ||
      (p.team && p.team.toLowerCase().includes(query))
  );

  renderTable(filtered);
});

btnRefresh.addEventListener("click", () => {
  searchInput.value = "";
  loadPlayers();
});

function showToast(message, type) {
  toast.textContent = message;
  toast.className = "toast " + type + " show";

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

loadPlayers();