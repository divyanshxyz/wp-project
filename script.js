// frontend logic - handles form interactions, api calls, table rendering, and search
const playerForm = document.getElementById("playerForm");
const inputName = document.getElementById("inputName");
const inputSport = document.getElementById("inputSport");
const inputTeam = document.getElementById("inputTeam");
const inputGender = document.getElementById("inputGender");
const inputAge = document.getElementById("inputAge");
const inputWeight = document.getElementById("inputWeight");
const editingId = document.getElementById("editingId");

const formTitle = document.getElementById("formTitle");
const btnSubmit = document.getElementById("btnSubmit");
const btnCancelEdit = document.getElementById("btnCancelEdit");
const btnRefresh = document.getElementById("btnRefresh");

const tableBody = document.getElementById("playerTableBody");
const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");
const dbStatus = document.getElementById("dbStatus");
const toast = document.getElementById("toast");

const statTotal = document.getElementById("statTotal");
const statSports = document.getElementById("statSports");
const statAvgAge = document.getElementById("statAvgAge");
const statAvgWeight = document.getElementById("statAvgWeight");

let allPlayers = [];
const API_BASE = "/api/players";

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
  if (players.length === 0) {
    emptyState.hidden = false;
    tableBody.innerHTML = "";
    return;
  }

  emptyState.hidden = true;

  tableBody.innerHTML = players
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

  const withWeight = allPlayers.filter((p) => p.weight > 0);
  const avgWeight = withWeight.length > 0
    ? (withWeight.reduce((sum, p) => sum + p.weight, 0) / withWeight.length).toFixed(1) + " kg"
    : "---";

  statTotal.textContent = total;
  statSports.textContent = sports || "---";
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

  const data = {
    name: inputName.value.trim(),
    sport: inputSport.value,
    team: inputTeam.value.trim(),
    gender: inputGender.value,
    age: inputAge.value,
    weight: inputWeight.value,
  };

  if (!data.name || !data.sport) {
    showToast("Name and Sport Type are required.", "error");
    return;
  }

  const isEditing = editingId.value !== "";

  try {
    btnSubmit.disabled = true;

    if (isEditing) {
      await updatePlayer(editingId.value, data);
      showToast(data.name + " updated.", "success");
    } else {
      await createPlayer(data);
      showToast(data.name + " added to the roster.", "success");
    }

    resetForm();
    await loadPlayers();
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

  inputName.value = player.name;
  inputSport.value = player.sport;
  inputTeam.value = player.team || "";
  inputGender.value = player.gender || "";
  inputAge.value = player.age || "";
  inputWeight.value = player.weight || "";
  editingId.value = player._id;

  formTitle.textContent = "Edit Player";
  btnSubmit.textContent = "Save Changes";
  btnCancelEdit.hidden = false;

  document.querySelectorAll(".editing-row").forEach((r) => r.classList.remove("editing-row"));
  document.querySelector(`tr[data-id="${playerId}"]`)?.classList.add("editing-row");

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

btnCancelEdit.addEventListener("click", resetForm);

function resetForm() {
  playerForm.reset();
  editingId.value = "";
  formTitle.textContent = "Add Player";
  btnSubmit.textContent = "+ Add Player";
  btnCancelEdit.hidden = true;
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