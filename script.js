/**************** CONFIG ****************/
const API_GET = "https://swagserver.co.in/hackfusion/get_all_teams.php";
const API_POST = "https://swagserver.co.in/hackfusion/update_team_status.php";

let teams = [];

document.addEventListener("DOMContentLoaded", fetchTeams);

/**************** FETCH ****************/
function fetchTeams() {
  fetch(API_GET)
    .then(res => res.json())
    .then(data => {
      teams = data.data || [];
      renderTable();
    })
    .catch(err => console.error("Fetch error:", err));
}

/**************** RENDER TABLE ****************/
function renderTable() {
  const table = document.getElementById("teamTable");
  table.innerHTML = "";

  teams.forEach(team => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${team.team_id}</td>
      <td>${team.college}</td>

      <!-- PAYMENT -->
      <td>
        ${
          team.payment_proof
            ? `<button class="btn payment-btn">Payment</button>`
            : `<span class="locked">No Payment</span>`
        }
      </td>

      <!-- REGISTRATION -->
      <td>
        ${
          team.payment_status === "Verified"
            ? `<button class="btn reg-btn">Registration</button>`
            : `<span class="locked">Locked</span>`
        }
      </td>
    `;

    /* PAYMENT CLICK */
    if (team.payment_proof) {
      tr.querySelector(".payment-btn")
        .addEventListener("click", () => openPayment(team));
    }

    /* REGISTRATION CLICK */
    if (team.payment_status === "Verified") {
      tr.querySelector(".reg-btn")
        .addEventListener("click", () => toggleRegistration(tr, team));
    }

    table.appendChild(tr);
  });
}

/**************** PAYMENT ****************/
function openPayment(team) {
  window.open(team.payment_proof, "_blank");

  if (team.payment_status !== "Verified") {
    const confirmVerify = confirm("Mark this payment as VERIFIED?");
    if (confirmVerify) {
      updateStatus(team.team_id, "payment", "Verified");
    }
  }
}

/**************** REGISTRATION DETAILS ****************/
function toggleRegistration(row, team) {
  // Close if already open
  if (row.nextSibling && row.nextSibling.classList?.contains("details-row")) {
    row.nextSibling.remove();
    return;
  }

  // Close other open rows
  document.querySelectorAll(".details-row").forEach(r => r.remove());

  const detailsRow = document.createElement("tr");
  detailsRow.className = "details-row";

  detailsRow.innerHTML = `
    <td colspan="4">
      <div class="details-card">
        <h3>Team ${team.team_id} — ${team.college}</h3>

        <div class="section">
          <h4>Team Leader</h4>
          <p><b>Name:</b> ${team.leader_name}</p>
          <p><b>Gender:</b> ${team.leader_gender}</p>
          <p><b>PWD:</b> ${team.leader_pwd}</p>
          <p><b>Email:</b> ${team.email || "N/A"}</p>
          <p><b>Phone:</b> ${team.phone || "N/A"}</p>
        </div>

        <div class="section">
          <h4>Team Members</h4>
          ${
            team.members && team.members.length
              ? team.members.map((m, i) => `
                  <div class="member">
                    <b>Member ${i + 1}</b> — 
                    ${m.name}, ${m.gender}, PWD: ${m.pwd}
                  </div>
                `).join("")
              : "<p>No members data</p>"
          }
        </div>
      </div>
    </td>
  `;

  row.after(detailsRow);
}

/**************** UPDATE STATUS ****************/
function updateStatus(teamId, type, status) {
  fetch(API_POST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ team_id: teamId, type, status })
  })
    .then(res => res.json())
    .then(() => fetchTeams())
    .catch(err => console.error("Update error:", err));
}
