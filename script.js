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

      <!-- 📄 ABSTRACT -->
      <td>
        ${
          team.abstract_url
            ? `<a class="doc-btn" href="${team.abstract_url}" target="_blank">Abstract</a>`
            : `<span class="doc-missing">No Abstract</span>`
        }
      </td>

      <!-- 📊 PPT -->
      <td>
        ${
          team.ppt_url
            ? `<a class="doc-btn" href="${team.ppt_url}" target="_blank">PPT</a>`
            : `<span class="doc-missing">No PPT</span>`
        }
      </td>

      <!-- 💳 PAYMENT -->
      <td>
        ${
          team.payment_proof
            ? `<a class="doc-btn" href="${team.payment_proof}" target="_blank">Payment</a>`
            : `<span class="doc-missing">No Proof</span>`
        }
      </td>

      <!-- ACTIONS -->
      <td>
        <button class="approve">✔</button>
        <button class="reject">✖</button>
      </td>
    `;

    /* ✅ BUTTON EVENTS */
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
  fetch(API_POST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      team_id: teamId,
      type: type,
      status: status
    })
  })
    .then(res => res.json())
    .then(response => {
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
  STATUS CLASS
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
  document.getElementById("totalTeams").innerText = teams.length;
  document.getElementById("verifiedTeams").innerText =
    teams.filter(t => t.payment_status === "Verified").length;
  document.getElementById("pendingTeams").innerText =
    teams.filter(t => !t.payment_status || t.payment_status === "Pending").length;
}

/***********************
  FILTER (OPTIONAL)
************************/
function filterByStatus(status) {
  if (status === "all") renderTable(teams);
  else
    renderTable(
      teams.filter(
        t => t.registration_status === status || t.payment_status === status
      )
    );
}
