// script.js — Frontend logic for the Player Details Module
// Runs entirely in the browser. Communicates with our Node/Express API using
// the Fetch API (which returns Promises) combined with async/await for clean,
// readable asynchronous code.

// ============================================================================
// SECTION 1 — DOM REFERENCES
// We select all elements once at the top so we don't repeatedly query the DOM
// every time a function runs. Think of these as "cached handles".
// ============================================================================

const playerForm      = document.getElementById("playerForm");
const inputName       = document.getElementById("inputName");
const inputSport      = document.getElementById("inputSport");
const inputTeam       = document.getElementById("inputTeam");
const inputGender     = document.getElementById("inputGender");
const inputAge        = document.getElementById("inputAge");
const inputWeight     = document.getElementById("inputWeight");
const editingId       = document.getElementById("editingId");   // hidden field

const formTitle       = document.getElementById("formTitle");
const btnSubmit       = document.getElementById("btnSubmit");
const btnCancelEdit   = document.getElementById("btnCancelEdit");
const btnRefresh      = document.getElementById("btnRefresh");

const tableBody       = document.getElementById("playerTableBody");
const searchInput     = document.getElementById("searchInput");

const emptyState      = document.getElementById("emptyState");

const dbStatus        = document.getElementById("dbStatus");
const toast           = document.getElementById("toast");

// Stats bar elements
const statTotal       = document.getElementById("statTotal");
const statSports      = document.getElementById("statSports");
const statAvgAge      = document.getElementById("statAvgAge");
const statAvgWeight   = document.getElementById("statAvgWeight");

// ============================================================================
// SECTION 2 — STATE
// A single source of truth for the players currently loaded.
// We keep this array in memory so the search filter can work without
// making extra network requests.
// ============================================================================

// allPlayers is a module-level variable — a plain JS Array of player Objects.
let allPlayers = [];

// ============================================================================
// SECTION 3 — API HELPER FUNCTIONS
// These functions wrap fetch() calls. Keeping them separate means the form
// handler doesn't need to know anything about HTTP — it just calls these.
// ============================================================================

const API_BASE = "/api/players";

/**
 * fetchAllPlayers — GET /api/players
 * Returns a Promise that resolves to the players array from the server.
 * async/await lets us write this as if it were synchronous, which is much
 * easier to read than chaining .then().then().catch().
 */
async function fetchAllPlayers() {
  // fetch() returns a Promise that resolves to a Response object.
  const response = await fetch(API_BASE);

  // .ok is true for 2xx status codes. If it's false we throw so the
  // caller's try/catch handles it uniformly.
  if (!response.ok) throw new Error(`GET failed: ${response.status}`);

  // .json() returns another Promise — await unwraps it to a plain JS value.
  return response.json();
}

/**
 * createPlayer — POST /api/players
 * Sends a new player object to the API and returns the created document
 * (with its MongoDB-generated _id).
 */
async function createPlayer(playerData) {
  const response = await fetch(API_BASE, {
    method: "POST",
    // We MUST set Content-Type so Express knows to parse the body as JSON.
    headers: { "Content-Type": "application/json" },
    // JSON.stringify converts our JS object into a JSON string for the body.
    body: JSON.stringify(playerData),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Create failed");
  return data;
}

/**
 * updatePlayer — PUT /api/players/:id
 * Sends updated fields for an existing player. The id goes in the URL.
 */
async function updatePlayer(id, playerData) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(playerData),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Update failed");
  return data;
}

/**
 * deletePlayer — DELETE /api/players/:id
 */
async function deletePlayer(id) {
  const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Delete failed");
  return data;
}

// ============================================================================
// SECTION 4 — RENDER FUNCTIONS
// Pure functions that take data and update the DOM. Keeping rendering
// separate from data fetching makes each part easier to test and debug.
// ============================================================================

/**
 * renderTable — converts the allPlayers array into HTML table rows.
 * @param {Array} players — the array to render (may be filtered)
 */
function renderTable(players) {
  if (players.length === 0) {
    emptyState.hidden = false;
    tableBody.innerHTML = "";
    return;
  }

  emptyState.hidden = true;

  // We build the HTML string for all rows at once using Array.map() +
  // template literals, then inject it in a single innerHTML assignment.
  // This is much faster than appending one DOM node per player in a loop.
  tableBody.innerHTML = players
    .map((player, index) => {
      // Sanitize text inserted into HTML to avoid XSS (cross-site scripting).
      // For a school project, escapeHTML below is good enough.
      const name   = escapeHTML(player.name);
      const team   = escapeHTML(player.team || "—");
      const sport  = escapeHTML(player.sport);
      const gender = escapeHTML(player.gender || "—");

      return `
        <tr data-id="${player._id}">
          <td>${index + 1}</td>
          <td><strong>${name}</strong></td>
          <td><span class="sport-badge ${sport.replace(/\s+/g, '-')}">${sport}</span></td>
          <td>${team}</td>
          <td>${gender}</td>
          <td>${player.age || "—"}</td>
          <td>${player.weight ? player.weight + " kg" : "—"}</td>
          <td class="actions-cell">
            <!--
              We use data-action and data-id attributes instead of onclick=""
              because this lets us use Event Delegation (one listener on the
              parent <tbody> catches clicks from all child buttons).
            -->
            <button class="btn-edit"   data-action="edit"   data-id="${player._id}">✏ Edit</button>
            <button class="btn-delete" data-action="delete" data-id="${player._id}">✕ Remove</button>
          </td>
        </tr>
      `;
    })
    .join(""); // .join("") collapses the array of strings into one string
}

/**
 * updateStats — recalculates the four summary cards from allPlayers.
 * Called after every create/update/delete.
 */
function updateStats() {
  const total = allPlayers.length;
  const avgAge =
    total > 0
      ? (allPlayers.reduce((s, p) => s + (p.age || 0), 0) / total).toFixed(1)
      : "—";

  // A Set removes duplicates — perfect for counting unique sports.
  const sports = new Set(allPlayers.map((p) => p.sport)).size;

  // Calculate average weight from players who have weight data
  const playersWithWeight = allPlayers.filter((p) => p.weight > 0);
  const avgWeight =
    playersWithWeight.length > 0
      ? (playersWithWeight.reduce((s, p) => s + p.weight, 0) / playersWithWeight.length).toFixed(1) + " kg"
      : "—";

  statTotal.textContent     = total;
  statSports.textContent    = sports || "—";
  statAvgAge.textContent    = avgAge;
  statAvgWeight.textContent = avgWeight;
}

// ============================================================================
// SECTION 5 — LOAD DATA
// Orchestrates fetching + rendering + stats. Called on page load and refresh.
// ============================================================================

async function loadPlayers() {
  emptyState.hidden = true;
  tableBody.innerHTML = "";

  try {
    allPlayers = await fetchAllPlayers();
    renderTable(allPlayers);
    updateStats();

    // Mark the DB badge as connected
    dbStatus.className = "db-status connected";
    dbStatus.querySelector(".status-text").textContent = "DB Connected";
  } catch (err) {
    dbStatus.className = "db-status error";
    dbStatus.querySelector(".status-text").textContent = "DB Error";
    showToast("Could not load players: " + err.message, "error");
  }
}

// ============================================================================
// SECTION 6 — FORM SUBMIT HANDLER (Create & Update)
// ============================================================================

// We attach the listener to the <form> element and listen for the "submit"
// event. This fires whether the user clicks the button OR presses Enter,
// which is more accessible than listening to a button click alone.
playerForm.addEventListener("submit", async (event) => {
  // Prevent the default form submission which would reload the page.
  event.preventDefault();

  const playerData = {
    name:     inputName.value.trim(),
    sport:    inputSport.value,
    team:     inputTeam.value.trim(),
    gender:   inputGender.value,
    age:      inputAge.value,
    weight:   inputWeight.value,
  };

  // Quick client-side validation (the API also validates, but this is faster)
  if (!playerData.name || !playerData.sport) {
    showToast("Name and Sport Type are required.", "error");
    return;
  }

  const isEditing = editingId.value !== ""; // hidden field has an _id if editing

  try {
    btnSubmit.disabled = true; // Prevent double-click while request is in flight

    if (isEditing) {
      await updatePlayer(editingId.value, playerData);
      showToast(`${playerData.name} updated! ✅`, "success");
    } else {
      await createPlayer(playerData);
      showToast(`${playerData.name} added to the squad! 🎉`, "success");
    }

    resetForm();
    // Reload the full list so our in-memory array stays in sync with the DB
    await loadPlayers();
  } catch (err) {
    showToast("Error: " + err.message, "error");
  } finally {
    // Re-enable the button no matter what (success or error)
    btnSubmit.disabled = false;
  }
});

// ============================================================================
// SECTION 7 — EVENT DELEGATION FOR TABLE BUTTONS
// Instead of attaching click listeners to every Edit/Remove button
// (which would need to be re-attached every time we re-render the table),
// we attach ONE listener to the parent <tbody>.
// When a button is clicked, the event "bubbles up" to tbody, and we use
// the button's data-action attribute to decide what to do.
// ============================================================================

tableBody.addEventListener("click", async (event) => {
  // event.target is the exact element that was clicked.
  // .closest() walks up the DOM tree to find the nearest matching ancestor.
  // This handles the case where the user clicks an icon INSIDE the button.
  const button = event.target.closest("[data-action]");
  if (!button) return; // Click was on a table cell, not a button — ignore it

  const action   = button.dataset.action; // "edit" or "delete"
  const playerId = button.dataset.id;

  if (action === "edit") {
    handleEditClick(playerId);
  } else if (action === "delete") {
    handleDeleteClick(playerId, button);
  }
});

/**
 * handleEditClick — finds the player in our in-memory array and pre-fills
 * the form so the user can update it.
 */
function handleEditClick(playerId) {
  // Array.find() returns the first object that matches the predicate.
  const player = allPlayers.find((p) => p._id === playerId);
  if (!player) return;

  // Populate form fields with existing data
  inputName.value     = player.name;
  inputSport.value    = player.sport;
  inputTeam.value     = player.team || "";
  inputGender.value   = player.gender || "";
  inputAge.value      = player.age || "";
  inputWeight.value   = player.weight || "";
  editingId.value     = player._id; // Store the _id so submit knows to PUT

  // Switch UI to "edit mode"
  formTitle.textContent       = "Edit Player";
  btnSubmit.textContent       = "💾  Save Changes";
  btnCancelEdit.hidden        = false;

  // Highlight the row being edited
  document
    .querySelectorAll(".editing-row")
    .forEach((r) => r.classList.remove("editing-row"));
  document.querySelector(`tr[data-id="${playerId}"]`)?.classList.add("editing-row");

  // Scroll to the form (useful on mobile where it may be off-screen)
  playerForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * handleDeleteClick — asks for confirmation, then calls the delete API.
 */
async function handleDeleteClick(playerId, button) {
  // Find the player name for a friendly confirmation message
  const player = allPlayers.find((p) => p._id === playerId);
  const name   = player ? player.name : "this player";

  // window.confirm() is a blocking browser dialog — simple and fine for a
  // class project. In production you'd build a custom modal.
  if (!confirm(`Remove ${name} from the squad?`)) return;

  try {
    button.disabled = true; // Prevent double-click
    await deletePlayer(playerId);
    showToast(`${name} removed.`, "info");

    // If we just deleted the player whose data is in the edit form, reset it
    if (editingId.value === playerId) resetForm();

    await loadPlayers();
  } catch (err) {
    showToast("Error: " + err.message, "error");
    button.disabled = false;
  }
}

// ============================================================================
// SECTION 8 — CANCEL EDIT
// ============================================================================

btnCancelEdit.addEventListener("click", resetForm);

/**
 * resetForm — clears all form fields and returns the UI to "add" mode.
 */
function resetForm() {
  playerForm.reset();       // Clears all native input values
  editingId.value     = ""; // Clear the hidden _id field
  formTitle.textContent     = "Add Player";
  btnSubmit.textContent     = "+ Add Player";
  btnCancelEdit.hidden      = true;

  // Remove edit highlight from all rows
  document
    .querySelectorAll(".editing-row")
    .forEach((r) => r.classList.remove("editing-row"));
}

// ============================================================================
// SECTION 9 — SEARCH / FILTER
// Filters the in-memory allPlayers array — NO extra network request needed.
// We listen to "input" so it reacts on every keystroke.
// ============================================================================

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase().trim();

  if (!query) {
    renderTable(allPlayers);
    return;
  }

  // Array.filter() returns a new array — it doesn't mutate allPlayers.
  const filtered = allPlayers.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.sport.toLowerCase().includes(query) ||
      (p.team && p.team.toLowerCase().includes(query))
  );

  renderTable(filtered);
});

// ============================================================================
// SECTION 10 — REFRESH BUTTON
// ============================================================================

btnRefresh.addEventListener("click", () => {
  searchInput.value = ""; // Clear search so full list shows after refresh
  loadPlayers();
});

// ============================================================================
// SECTION 11 — UTILITY FUNCTIONS
// ============================================================================

/**
 * showToast — displays a temporary notification message.
 * @param {string} message — text to display
 * @param {string} type — "success" | "error" | "info"
 */
function showToast(message, type = "info") {
  toast.textContent  = message;
  toast.className    = `toast ${type} show`;

  // After 3 seconds, hide the toast by removing the "show" class.
  // setTimeout returns a timer ID; storing it lets us cancel it if a new
  // toast fires before the old one disappears.
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/**
 * escapeHTML — prevents XSS when inserting user-supplied text into innerHTML.
 * Converts dangerous characters like < > & into their HTML entity equivalents.
 */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

// ============================================================================
// SECTION 12 — INIT
// Entry point. Called automatically when the script loads (which happens
// after the DOM is ready because the <script> tag is at the bottom of <body>).
// ============================================================================

loadPlayers();