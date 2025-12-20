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
    <td>
  <b>${user.team_name || "Unnamed Team"}</b><br>
  <small>${user.college}</small>
</td>
     
<h3>${user.team_name || "Unnamed Team"} (Team ID: ${user.team_id})</h3>
      <td>
        <button class="btn view-pay">View screenshot</button><br>
        <button class="btn pay-verify">Verify</button>
        <button class="btn danger pay-reject">Reject</button>
        <div>Status: ${user.payment_status || "Pending"}</div>
      </td>

      <td>
        <button class="btn reg-view">View the details</button><br>
        <button class="btn reg-verify">Verify</button>
        <button class="btn danger reg-reject">Reject</button>
        <div>Status: ${user.registration_status || "Pending"}</div>
      </td>
    `;

    /* ✅ PAYMENT EVENTS */
    tr.querySelector(".view-pay")
      .addEventListener("click", () => viewPayment(user.payment_proof));

    tr.querySelector(".pay-verify")
      .addEventListener("click", () =>
        updateStatus(user.team_id, "payment", "Verified")
      );

    tr.querySelector(".pay-reject")
      .addEventListener("click", () =>
        updateStatus(user.team_id, "payment", "Rejected")
      );

    /* ✅ REGISTRATION EVENTS */
    tr.querySelector(".reg-view")
      .addEventListener("click", () =>
        viewRegistration(tr, user.team_id)
      );

    tr.querySelector(".reg-verify")
      .addEventListener("click", () =>
        updateStatus(user.team_id, "registration", "Verified")
      );

    tr.querySelector(".reg-reject")
      .addEventListener("click", () =>
        updateStatus(user.team_id, "registration", "Rejected")
      );

    table.appendChild(tr);
  });
}


/* ================= PAYMENT ================= */

function viewPayment(url) {
  if (!url) return alert("No payment screenshot uploaded");
  window.open(url, "_blank");
}

/* ================= REGISTRATION DETAILS ================= */

function viewRegistration(rowBtn, teamId) {
  const row = rowBtn.closest("tr");

  // Toggle close
  if (row.nextSibling && row.nextSibling.classList.contains("details")) {
    row.nextSibling.remove();
    return;
  }

  // Close other open details
  document.querySelectorAll(".details").forEach(d => d.remove());

  const user = users.find(u => u.team_id === teamId);

  // ---------- LEADER DETAILS ----------
  let leaderHTML = `
    <h4>Team Leader</h4>
    <p><b>Name:</b> ${user.leader_name || "N/A"}</p>
    <p><b>Gender:</b> ${user.leader_gender || "N/A"}</p>
    <p><b>PWD:</b> ${user.leader_pwd || "N/A"}</p>
    <p><b>Email:</b> ${user.email || "N/A"}</p>
    <p><b>Phone:</b> ${user.phone || "N/A"}</p>
  `;

  // ---------- MEMBERS (DYNAMIC) ----------
  let membersHTML = "<h4>Team Members</h4>";
  let memberFound = false;

  for (let i = 1; i <= 10; i++) {
    if (user[`member${i}_name`]) {
      memberFound = true;
      membersHTML += `
        <p>
          <b>Member ${i}:</b>
          ${user[`member${i}_name`]} |
          ${user[`member${i}_gender`] || "N/A"} |
          PWD: ${user[`member${i}_pwd`] || "N/A"}
        </p>
      `;
    }
  }

  if (!memberFound) {
    membersHTML += "<p>No members data</p>";
  }

  // ---------- OPTIONAL DOCUMENTS ----------
  let docsHTML = `
    <h4>Documents</h4>
    <p>
      Abstract:
      ${
        user.abstract_url
          ? `<a href="${user.abstract_url}" target="_blank">View</a>`
          : "N/A"
      }
    </p>
    <p>
      PPT:
      ${
        user.ppt_url
          ? `<a href="${user.ppt_url}" target="_blank">View</a>`
          : "N/A"
      }
    </p>
  `;

  // ---------- STATUS ----------
  let statusHTML = `
    <h4>Status</h4>
    <p><b>Payment:</b> ${user.payment_status || "Pending"}</p>
    <p><b>Registration:</b> ${user.registration_status || "Pending"}</p>
  `;

  // ---------- FINAL DETAIL ROW ----------
  const detailRow = document.createElement("tr");
  detailRow.className = "details";

  detailRow.innerHTML = `
    <td colspan="4">
      <div class="details-card">
        <h3>${user.team_name || "Unnamed Team"} (ID: ${user.team_id})</h3>
        <p><b>College:</b> ${user.college || "N/A"}</p>

        ${leaderHTML}
        ${membersHTML}
        ${docsHTML}
        ${statusHTML}
      </div>
    </td>
  `;

  row.after(detailRow);
}


/* ================= UPDATE ================= */

function updateStatus(teamId, type, status) {
  console.log("CLICK:", teamId, type, status);
  fetch(API_POST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ team_id: teamId, type, status })
  })
    .then(res => res.json())
    .then(() => loadUsers());
}
