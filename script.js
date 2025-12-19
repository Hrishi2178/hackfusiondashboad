/***********************
  CONFIG
************************/
const API_GET = "https://swagserver.co.in/hackfusion/get_all_teams.php";
const API_POST = "https://swagserver.co.in/hackfusion/update_team_status.php";

/***********************
  STATE
************************/
let teams = [];

/***********************
  INIT
************************/
document.addEventListener("DOMContentLoaded", () => {
  fetchTeams();
});

/***********************
  FETCH TEAMS
************************/
function fetchTeams() {
  fetch(API_GET)
    .then(res => res.json())
    .then(data => {
      teams = data.data || [];
      updateStats();
      renderTable(teams);
    })
    .catch(err => {
      console.error("API ERROR:", err);
      alert("Failed to load teams");
    });
}

/***********************
  RENDER TABLE
************************/
function renderTable(data) {
  const table = document.getElementById("teamTable");
  table.innerHTML = "";

  data.forEach(team => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${team.team_id}</td>
      <td>${team.college}</td>

      <td>
        <span class="badge ${statusClass(team.registration_status)}">
          ${team.registration_status || "Pending"}
        </span>
      </td>

      <td>
        <span class="badge ${statusClass(team.payment_status)}">
          ${team.payment_status || "Pending"}
        </span>
      </td>

      <td>
        <button class="approve">✔</button>
        <button class="reject">✖</button>
        <a href="${team.payment_proof}" target="_blank">View</a>
      </td>
    `;

    /* ✅ BUTTON EVENTS (FIXED WAY) */
    row.querySelector(".approve").addEventListener("click", () => {
      updateStatus(team.team_id, "payment", "Verified");
    });

    row.querySelector(".reject").addEventListener("click", () => {
      updateStatus(team.team_id, "payment", "Rejected");
    });

    table.appendChild(row);
  });
}

/***********************
  UPDATE STATUS
************************/
function updateStatus(teamId, type, status) {
  console.log("CLICKED:", teamId, type, status);

  fetch(API_POST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      team_id: teamId,
      type: type,       // registration OR payment
      status: status
    })
  })
    .then(res => res.json())
    .then(response => {
      // Update local data (NO reload)
      const team = teams.find(t => t.team_id == teamId);
      if (team) {
        if (type === "payment") team.payment_status = status;
        if (type === "registration") team.registration_status = status;
      }

      updateStats();
      renderTable(teams);

      alert("⚡ Pikachuuu: " + response.message);
    })
    .catch(err => {
      console.error("UPDATE ERROR:", err);
      alert("Failed to update status");
    });
}

/***********************
  STATUS COLOR CLASS
************************/
function statusClass(status) {
  if (!status) return "pending";

  status = status.toLowerCase();
  if (status.includes("verified") || status.includes("completed")) return "verified";
  if (status.includes("rejected")) return "rejected";
  return "pending";
}

/***********************
  STATS
************************/
function updateStats() {
  const total = teams.length;
  const verified = teams.filter(t => t.payment_status === "Verified").length;
  const pending = teams.filter(t => !t.payment_status || t.payment_status === "Pending").length;

  document.getElementById("totalTeams").innerText = total;
  document.getElementById("verifiedTeams").innerText = verified;
  document.getElementById("pendingTeams").innerText = pending;
}

/***********************
  FILTER (OPTIONAL)
************************/
function filterByStatus(status) {
  if (status === "all") {
    renderTable(teams);
  } else {
    renderTable(
      teams.filter(t =>
        t.registration_status === status ||
        t.payment_status === status
      )
    );
  }
}
