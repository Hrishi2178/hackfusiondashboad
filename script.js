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
    console.log("RAW API DATA:", data.data);
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
          ["verified", "paid", "success"].includes(
  (team.payment_status || "").toLowerCase()
)
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
  if (row.nextSibling && row.nextSibling.classList?.contains("details-row")) {
    row.nextSibling.remove();
    return;
  }

  document.querySelectorAll(".details-row").forEach(r => r.remove());

  const members = [];

  for (let i = 1; i <= 6; i++) {
    if (team[`member${i}_name`]) {
      members.push({
        name: team[`member${i}_name`],
        gender: team[`member${i}_gender`],
        pwd: team[`member${i}_pwd`]
      });
    }
  }

  const detailsRow = document.createElement("tr");
  detailsRow.className = "details-row";

  detailsRow.innerHTML = `
    <td colspan="4">
      <div class="details-card">
        <h3>Team ${team.team_id}</h3>

        <h4>Leader</h4>
        <p>Name: ${team.leader_name}</p>
        <p>Gender: ${team.leader_gender}</p>
        <p>PWD: ${team.leader_pwd}</p>

        <h4>Members</h4>
        ${
          members.length
            ? members.map((m, i) => `
                <p>
                  Member ${i + 1}: ${m.name} |
                  ${m.gender} |
                  PWD: ${m.pwd}
                </p>
              `).join("")
            : "<p>No members submitted</p>"
        }
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
