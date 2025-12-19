const GET_TEAMS =
  "https://swagserver.co.in/hackfusion/get_all_teams.php";
const UPDATE_STATUS =
  "https://swagserver.co.in/hackfusion/update_team_status.php";

const teamsDiv = document.getElementById("teams");
const loading = document.getElementById("loading");

// Fetch all teams
fetch(GET_TEAMS)
  .then(res => res.json())
  .then(data => {
    loading.style.display = "none";
    if (data.success) renderTeams(data.data);
  })
  .catch(() => {
    loading.innerText = "❌ Failed to load teams";
  });

function renderTeams(teams) {
  teamsDiv.innerHTML = "";

  teams.forEach(team => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${team.team_name}</h3>

      <p>
        <span class="badge">${team.theme}</span>
        <span class="badge">${team.team_size} Members</span>
      </p>

      <p><b>College:</b> ${team.college}</p>
      <p><b>City:</b> ${team.city}</p>

      <p><b>Members:</b>
        ${team.members.map(m => m.name).join(", ")}
      </p>

      <p>
        <a href="${team.payment_proof}" target="_blank">
          ⚡ View Payment Proof
        </a>
      </p>

      <select id="status-${team.team_id}">
        <option value="">Update Status</option>
        <option>Pending</option>
        <option>Verified</option>
        <option>Rejected</option>
        <option>Completed</option>
      </select>

      <button onclick="updateStatus(${team.team_id})">
        Apply
      </button>
    `;

    teamsDiv.appendChild(card);
  });
}

function updateStatus(teamId) {
  const status = document.getElementById(
    `status-${teamId}`
  ).value;

  if (!status) {
    alert("Select a status first");
    return;
  }

  fetch(UPDATE_STATUS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      team_id: teamId,
      type: "registration",
      status: status
    })
  })
    .then(res => res.json())
    .then(data => alert(data.message))
    .catch(() => alert("❌ Update failed"));
}
