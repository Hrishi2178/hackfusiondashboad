const API_GET = "https://swagserver.co.in/hackfusion/get_all_teams.php";
const API_POST = "https://swagserver.co.in/hackfusion/update_team_status.php";

let users = [];

document.addEventListener("DOMContentLoaded", () => {
  loadUsers();
  document.getElementById("searchBox").addEventListener("input", searchUsers);
});

/* ================= LOAD ================= */

function loadUsers() {
  fetch(API_GET)
    .then(res => res.json())
    .then(data => {
      users = data.data || [];
      updateCounters(users);
      renderTable(users);
    });
}

/* ================= COUNTERS ================= */

function updateCounters(list) {
  document.getElementById("totalUsers").innerText = list.length;

  document.getElementById("paidUsers").innerText =
    list.filter(u => (u.payment_status || "").toLowerCase() === "verified").length;

  document.getElementById("regVerified").innerText =
    list.filter(u => (u.registration_status || "").toLowerCase() === "verified").length;
}

/* ================= SEARCH ================= */

function searchUsers(e) {
  const q = e.target.value.toLowerCase();
  const filtered = users.filter(u =>
    u.college.toLowerCase().includes(q) ||
    String(u.team_id).includes(q)
  );
  updateCounters(filtered);
  renderTable(filtered);
}

/* ================= TABLE ================= */

function renderTable(list) {
  const table = document.getElementById("teamTable");
  table.innerHTML = "";

  list.forEach(user => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${user.team_id}</td>
      <td>${user.college}</td>

      <td>
        <button class="btn" onclick="viewPayment('${user.payment_proof}')">View</button><br>
        <button class="btn" onclick="updateStatus(${user.team_id}, 'payment', 'Verified')">Verify</button>
        <button class="btn danger" onclick="updateStatus(${user.team_id}, 'payment', 'Rejected')">Reject</button>
        <div>Status: ${user.payment_status || "Pending"}</div>
      </td>

      <td>
        <button class="btn" onclick="viewRegistration(this, ${user.team_id})">View</button><br>
        <button class="btn" onclick="updateStatus(${user.team_id}, 'registration', 'Verified')">Verify</button>
        <button class="btn danger" onclick="updateStatus(${user.team_id}, 'registration', 'Rejected')">Reject</button>
        <div>Status: ${user.registration_status || "Pending"}</div>
      </td>
    `;

    table.appendChild(tr);
  });
}

/* ================= PAYMENT ================= */

function viewPayment(url) {
  if (!url) return alert("No payment screenshot uploaded");
  window.open(url, "_blank");
}

/* ================= REGISTRATION DETAILS ================= */

function viewRegistration(btn, teamId) {
  const row = btn.closest("tr");

  if (row.nextSibling && row.nextSibling.classList.contains("details")) {
    row.nextSibling.remove();
    return;
  }

  document.querySelectorAll(".details").forEach(d => d.remove());

  const user = users.find(u => u.team_id === teamId);

  const members = [];
  for (let i = 1; i <= 6; i++) {
    if (user[`member${i}_name`]) {
      members.push(`
        <li>
          ${user[`member${i}_name`]} |
          ${user[`member${i}_gender`]} |
          PWD: ${user[`member${i}_pwd`]}
        </li>
      `);
    }
  }

  const detailRow = document.createElement("tr");
  detailRow.className = "details";

  detailRow.innerHTML = `
    <td colspan="4">
      <h3>Team ${user.team_id}</h3>
      <p><b>College:</b> ${user.college}</p>

      <h4>Leader</h4>
      <p>
        ${user.leader_name} |
        ${user.leader_gender} |
        PWD: ${user.leader_pwd}
      </p>

      <h4>Members</h4>
      <ul>${members.join("") || "<li>No members</li>"}</ul>
    </td>
  `;

  row.after(detailRow);
}

/* ================= UPDATE ================= */

function updateStatus(teamId, type, status) {
  fetch(API_POST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ team_id: teamId, type, status })
  })
    .then(res => res.json())
    .then(() => loadUsers());
}
