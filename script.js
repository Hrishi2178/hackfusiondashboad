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
    })
    .catch(err => {
      console.error("Error loading users:", err);
      alert("Failed to load teams. Please refresh the page.");
    });
}

/* ================= COUNTERS ================= */

function updateCounters(list) {
  document.getElementById("totalUsers").innerText = list.length;

  document.getElementById("paidUsers").innerText =
    list.filter(u => (u.payment_status || "").toLowerCase() === "verified").length;

  document.getElementById("regVerified").innerText =
    list.filter(u => (u.registration_status || "").toLowerCase() === "completed").length;
}

/* ================= SEARCH ================= */

function searchUsers(e) {
  const q = e.target.value.toLowerCase();
  const filtered = users.filter(u =>
    u.college.toLowerCase().includes(q) ||
    String(u.team_id).includes(q) ||
    u.team_name.toLowerCase().includes(q)
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

    // Get payment status class for styling
    const paymentStatusClass = getStatusClass(user.payment_status);
    const registrationStatusClass = getStatusClass(user.registration_status);

    tr.innerHTML = `
      <td>
        <b>${user.team_name || "Unnamed Team"}</b><br>
        <small>${user.college}</small><br>
        <small>ID: ${user.team_id}</small>
      </td>
      
      <td>
        <button class="btn view-pay">View screenshot</button><br>
        ${user.payment_status === "Verified" || user.payment_status === "Rejected" ? "" : `
          <button class="btn pay-verify">Verify</button>
          <button class="btn danger pay-reject">Reject</button>
        `}
        <div class="status-badge ${paymentStatusClass}">
          Status: ${user.payment_status || "Pending"}
        </div>
      </td>

      <td>
        <button class="btn reg-view">View the details</button><br>
        ${user.registration_status === "Completed" || user.registration_status === "Rejected" ? "" : `
          <button class="btn reg-verify">Complete</button>
          <button class="btn danger reg-reject">Reject</button>
        `}
        <div class="status-badge ${registrationStatusClass}">
          Status: ${user.registration_status || "Pending"}
        </div>
      </td>
    `;

    /* ✅ PAYMENT EVENTS */
    tr.querySelector(".view-pay")
      .addEventListener("click", () => openPaymentDialog(user));

    const payVerifyBtn = tr.querySelector(".pay-verify");
    const payRejectBtn = tr.querySelector(".pay-reject");
    
    if (payVerifyBtn) {
      payVerifyBtn.addEventListener("click", () => openPaymentDialog(user));
    }
    
    if (payRejectBtn) {
      payRejectBtn.addEventListener("click", () => openPaymentDialog(user));
    }

    /* ✅ REGISTRATION EVENTS */
    tr.querySelector(".reg-view")
      .addEventListener("click", () =>
        viewRegistration(tr, user.team_id)
      );

    const regVerifyBtn = tr.querySelector(".reg-verify");
    const regRejectBtn = tr.querySelector(".reg-reject");
    
    if (regVerifyBtn) {
      regVerifyBtn.addEventListener("click", () => openRegistrationDialog(user));
    }
    
    if (regRejectBtn) {
      regRejectBtn.addEventListener("click", () => openRegistrationDialog(user));
    }

    table.appendChild(tr);
  });
}

/* ================= STATUS CLASS HELPER ================= */

function getStatusClass(status) {
  const statusLower = (status || "").toLowerCase();
  if (statusLower === "verified" || statusLower === "completed") {
    return "status-verified";
  } else if (statusLower === "rejected") {
    return "status-rejected";
  } else {
    return "status-pending";
  }
}

/* ================= PAYMENT DIALOG ================= */

function openPaymentDialog(user) {
  // Create dialog overlay
  const dialog = document.createElement("div");
  dialog.className = "dialog-overlay";
  dialog.id = "paymentDialog";
  
  const paymentStatusClass = getStatusClass(user.payment_status);
  
  dialog.innerHTML = `
    <div class="dialog-content">
      <div class="dialog-header">
        <h2>Payment Verification</h2>
        <button class="dialog-close">&times;</button>
      </div>
      
      <div class="dialog-body">
        <div class="dialog-info">
          <h3>${user.team_name || "Unnamed Team"}</h3>
          <p><strong>Team ID:</strong> ${user.team_id}</p>
          <p><strong>College:</strong> ${user.college || "N/A"}</p>
          <p><strong>City:</strong> ${user.city || "N/A"}</p>
          <p><strong>Coupon:</strong> ${user.coupon || "None"}</p>
          <p><strong>Current Status:</strong> <span class="status-badge ${paymentStatusClass}">${user.payment_status || "Pending"}</span></p>
        </div>
        
        <div class="dialog-screenshot">
          <h4>Payment Screenshot</h4>
          ${user.payment_proof ? 
            `<img src="${user.payment_proof}" alt="Payment Proof" class="payment-image" />` :
            `<p class="no-data">No payment screenshot uploaded</p>`
          }
        </div>
      </div>
      
      <div class="dialog-footer">
        <button class="btn-dialog btn-verify" ${user.payment_status === "Verified" ? "disabled" : ""}>
          ✓ Verify Payment
        </button>
        <button class="btn-dialog btn-reject" ${user.payment_status === "Rejected" ? "disabled" : ""}>
          ✗ Reject Payment
        </button>
        <button class="btn-dialog btn-cancel">Cancel</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  // Event listeners
  dialog.querySelector(".dialog-close").addEventListener("click", () => closeDialog("paymentDialog"));
  dialog.querySelector(".btn-cancel").addEventListener("click", () => closeDialog("paymentDialog"));
  dialog.querySelector(".dialog-overlay").addEventListener("click", (e) => {
    if (e.target.classList.contains("dialog-overlay")) {
      closeDialog("paymentDialog");
    }
  });
  
  dialog.querySelector(".btn-verify").addEventListener("click", (e) => {
    if (!e.target.disabled) {
      closeDialog("paymentDialog");
      updateStatus(user.team_id, "payment", "Verified");
    }
  });
  
  dialog.querySelector(".btn-reject").addEventListener("click", (e) => {
    if (!e.target.disabled) {
      if (confirm(`Are you sure you want to reject payment for ${user.team_name}?`)) {
        closeDialog("paymentDialog");
        updateStatus(user.team_id, "payment", "Rejected");
      }
    }
  });
  
  // Allow image click to open in new tab
  const img = dialog.querySelector(".payment-image");
  if (img) {
    img.style.cursor = "pointer";
    img.addEventListener("click", () => window.open(user.payment_proof, "_blank"));
  }
}

/* ================= REGISTRATION DIALOG ================= */

function openRegistrationDialog(user) {
  const members = user.members || [];
  const leader = members.find(m => m.is_lead === 1) || members[0] || {};
  const teamMembers = members.filter(m => m.is_lead !== 1);
  const registrationStatusClass = getStatusClass(user.registration_status);
  
  // Build members list
  let membersList = `<li><strong>Leader:</strong> ${leader.name || "N/A"} (${leader.email || "N/A"})</li>`;
  teamMembers.forEach((member, index) => {
    membersList += `<li><strong>Member ${index + 1}:</strong> ${member.name || "N/A"} (${member.email || "N/A"})</li>`;
  });
  
  // Convert URLs in abstract to clickable links
  let abstractContent = user.abstract || "No abstract provided";
  if (abstractContent !== "No abstract provided") {
    // Regular expression to find URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    abstractContent = abstractContent.replace(urlRegex, '<a href="$1" target="_blank" class="abstract-link">$1</a>');
  }
  
  const dialog = document.createElement("div");
  dialog.className = "dialog-overlay";
  dialog.id = "registrationDialog";
  
  dialog.innerHTML = `
    <div class="dialog-content">
      <div class="dialog-header">
        <h2>Registration Verification</h2>
        <button class="dialog-close">&times;</button>
      </div>
      
      <div class="dialog-body">
        
    <div class="info-section">
      <h4>Team Information</h4>
      <table class="info-table">
        <tr>
          <td class="info-label">Team Name</td>
          <td class="info-value">${user.team_name || "Unnamed Team"}</td>
          <td class="info-label">Team ID</td>
          <td class="info-value">${user.team_id}</td>
        </tr>
        <tr>
          <td class="info-label">Theme</td>
          <td class="info-value">${user.theme || "N/A"}</td>
          <td class="info-label">Team Size</td>
          <td class="info-value">${user.team_size || members.length}</td>
        </tr>
        <tr>
          <td class="info-label">College</td>
          <td class="info-value">${user.college || "N/A"}</td>
          <td class="info-label">City</td>
          <td class="info-value">${user.city || "N/A"}</td>
        </tr>
        <tr>
          <td class="info-label">Coupon</td>
          <td class="info-value">${user.coupon || "None"}</td>
          <td class="info-label">Created</td>
          <td class="info-value">${user.created_at || "N/A"}</td>
        </tr>
      </table>
    </div>
  
        
        <div class="dialog-abstract">
          <h4>Project Abstract</h4>
          <div class="abstract-content">
            ${abstractContent}
          </div>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button class="btn-dialog btn-verify" ${user.registration_status === "Completed" ? "disabled" : ""}>
          ✓ Complete Registration
        </button>
        <button class="btn-dialog btn-reject" ${user.registration_status === "Rejected" ? "disabled" : ""}>
          ✗ Reject Registration
        </button>
        <button class="btn-dialog btn-cancel">Cancel</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  // Event listeners
  dialog.querySelector(".dialog-close").addEventListener("click", () => closeDialog("registrationDialog"));
  dialog.querySelector(".btn-cancel").addEventListener("click", () => closeDialog("registrationDialog"));
  dialog.querySelector(".dialog-overlay").addEventListener("click", (e) => {
    if (e.target.classList.contains("dialog-overlay")) {
      closeDialog("registrationDialog");
    }
  });
  
  dialog.querySelector(".btn-verify").addEventListener("click", (e) => {
    if (!e.target.disabled) {
      closeDialog("registrationDialog");
      updateStatus(user.team_id, "registration", "Completed");
    }
  });
  
  dialog.querySelector(".btn-reject").addEventListener("click", (e) => {
    if (!e.target.disabled) {
      if (confirm(`Are you sure you want to reject registration for ${user.team_name}?`)) {
        closeDialog("registrationDialog");
        updateStatus(user.team_id, "registration", "Rejected");
      }
    }
  });
}

/* ================= CLOSE DIALOG ================= */

function closeDialog(dialogId) {
  const dialog = document.getElementById(dialogId);
  if (dialog) {
    dialog.remove();
  }
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
  const members = user.members || [];
  
  // Find the team leader
  const leader = members.find(m => m.is_lead === 1) || members[0] || {};
  
  // Get non-leader members
  const teamMembers = members.filter(m => m.is_lead !== 1);

  // ---------- TEAM INFORMATION TABLE ----------
  let teamInfoHTML = `
    <div class="info-section">
      <h4>Team Information</h4>
      <table class="info-table">
        <tr>
          <td class="info-label">Team Name</td>
          <td class="info-value">${user.team_name || "Unnamed Team"}</td>
          <td class="info-label">Team ID</td>
          <td class="info-value">${user.team_id}</td>
        </tr>
        <tr>
          <td class="info-label">Theme</td>
          <td class="info-value">${user.theme || "N/A"}</td>
          <td class="info-label">Team Size</td>
          <td class="info-value">${user.team_size || members.length}</td>
        </tr>
        <tr>
          <td class="info-label">College</td>
          <td class="info-value">${user.college || "N/A"}</td>
          <td class="info-label">City</td>
          <td class="info-value">${user.city || "N/A"}</td>
        </tr>
        <tr>
          <td class="info-label">Coupon</td>
          <td class="info-value">${user.coupon || "None"}</td>
          <td class="info-label">Created</td>
          <td class="info-value">${user.created_at || "N/A"}</td>
        </tr>
      </table>
    </div>
  `;

  // ---------- LEADER DETAILS TABLE ----------
  let leaderHTML = `
    <div class="info-section">
      <h4>Team Leader Details</h4>
      <table class="info-table">
        <tr>
          <td class="info-label">Name</td>
          <td class="info-value">${leader.name || "N/A"}</td>
          <td class="info-label">Email</td>
          <td class="info-value">${leader.email || "N/A"}</td>
        </tr>
        <tr>
          <td class="info-label">Phone</td>
          <td class="info-value">${leader.mobile || "N/A"}</td>
          <td class="info-label">Gender</td>
          <td class="info-value">${leader.gender || "N/A"}</td>
        </tr>
        <tr>
          <td class="info-label">PWD Status</td>
          <td class="info-value">${leader.is_pwd ? "Yes" : "No"}</td>
          <td class="info-label">Profile Picture</td>
          <td class="info-value">${leader.profile_pic ? `<a href="${leader.profile_pic}" target="_blank" class="view-link">View Picture</a>` : "Not uploaded"}</td>
        </tr>
      </table>
    </div>
  `;

  // ---------- MEMBERS TABLE ----------
  let membersHTML = `
    <div class="info-section">
      <h4>Team Members (${teamMembers.length})</h4>
  `;
  
  if (teamMembers.length > 0) {
    membersHTML += `
      <table class="members-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Gender</th>
            <th>PWD</th>
            <th>Profile</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    teamMembers.forEach((member, index) => {
      membersHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${member.name || "N/A"}</td>
          <td>${member.email || "N/A"}</td>
          <td>${member.mobile || "N/A"}</td>
          <td>${member.gender || "N/A"}</td>
          <td>${member.is_pwd ? "Yes" : "No"}</td>
          <td>${member.profile_pic ? `<a href="${member.profile_pic}" target="_blank" class="view-link">View</a>` : "N/A"}</td>
        </tr>
      `;
    });
    
    membersHTML += `
        </tbody>
      </table>
    `;
  } else {
    membersHTML += `<p class="no-members">No additional members</p>`;
  }
  
  membersHTML += `</div>`;

  // ---------- ABSTRACT ----------
  let abstractContent = user.abstract || "No abstract provided";
  if (abstractContent !== "No abstract provided") {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    abstractContent = abstractContent.replace(urlRegex, '<a href="$1" target="_blank" class="abstract-link">$1</a>');
  }
  
  let abstractHTML = `
    <div class="info-section">
      <h4>Project Abstract</h4>
      <div class="abstract-box">
        ${abstractContent}
      </div>
    </div>
  `;

  // ---------- STATUS ----------
  const paymentClass = getStatusClass(user.payment_status);
  const registrationClass = getStatusClass(user.registration_status);
  
  let statusHTML = `
    <div class="info-section">
      <h4>Status</h4>
      <table class="info-table">
        <tr>
          <td class="info-label">Payment Status</td>
          <td class="info-value"><span class="status-badge ${paymentClass}">${user.payment_status || "Pending"}</span></td>
          <td class="info-label">Registration Status</td>
          <td class="info-value"><span class="status-badge ${registrationClass}">${user.registration_status || "Pending"}</span></td>
        </tr>
      </table>
    </div>
  `;

  // ---------- FINAL DETAIL ROW ----------
  const detailRow = document.createElement("tr");
  detailRow.className = "details";

  detailRow.innerHTML = `
    <td colspan="3">
      <div class="details-card">
        ${teamInfoHTML}
        ${leaderHTML}
        ${membersHTML}
        ${abstractHTML}
        ${statusHTML}
      </div>
    </td>
  `;

  row.after(detailRow);
}


/* ================= LOADING INDICATOR ================= */

function showLoading() {
  // Create loading overlay
  const overlay = document.createElement("div");
  overlay.id = "loadingOverlay";
  overlay.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Updating status...</p>
    </div>
  `;
  document.body.appendChild(overlay);
}

function hideLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    overlay.remove();
  }
}

/* ================= UPDATE ================= */

function updateStatus(teamId, type, status) {
  console.log("Updating status:", { team_id: teamId, type, status });
  
  // Show loading indicator
  showLoading();
  
  fetch(API_POST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      team_id: parseInt(teamId), 
      type: type, 
      status: status 
    })
  })
    .then(res => res.json())
    .then(data => {
      hideLoading();
      if (data.success) {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} status updated successfully!`);
        loadUsers(); // Reload the table
      } else {
        alert(`Failed to update status: ${data.message || "Unknown error"}`);
      }
    })
    .catch(err => {
      hideLoading();
      console.error("Error updating status:", err);
      alert("Failed to update status. Please try again.");
    });
}

/* ================= ADD LOADING CSS ================= */

// Add loading styles to document
const style = document.createElement("style");
style.textContent = `
  #loadingOverlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }

  .loading-spinner {
    text-align: center;
    color: white;
  }

  .spinner {
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-spinner p {
    font-size: 16px;
    font-weight: 500;
    margin: 0;
  }

  .status-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }

  .status-verified {
    background-color: #d4edda;
    color: #155724;
  }

  .status-rejected {
    background-color: #f8d7da;
    color: #721c24;
  }

  .status-pending {
    background-color: #fff3cd;
    color: #856404;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Dialog Styles */
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    padding: 20px;
    overflow-y: auto;
  }

  .dialog-content {
    background: white;
    border-radius: 12px;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }

  .dialog-header {
    padding: 20px 30px;
    border-bottom: 2px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dialog-header h2 {
    margin: 0;
    font-size: 24px;
    color: #333;
  }

  .dialog-close {
    background: none;
    border: none;
    font-size: 32px;
    cursor: pointer;
    color: #666;
    line-height: 1;
    padding: 0;
    width: 32px;
    height: 32px;
  }

  .dialog-close:hover {
    color: #333;
  }

  .dialog-body {
    padding: 30px;
    overflow-y: auto;
    flex: 1;
  }

  .dialog-info {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .dialog-info h3 {
    margin-top: 0;
    color: #2c3e50;
    font-size: 20px;
  }

  .dialog-info p {
    margin: 8px 0;
    font-size: 14px;
    color: #555;
  }

  .dialog-screenshot {
    margin-top: 20px;
  }

  .dialog-screenshot h4 {
    margin-bottom: 15px;
    color: #2c3e50;
  }

  .payment-image {
    width: 100%;
    max-height: 500px;
    object-fit: contain;
    border: 2px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .payment-image:hover {
    transform: scale(1.02);
    border-color: #007bff;
  }

  .no-data {
    padding: 40px;
    text-align: center;
    color: #999;
    font-style: italic;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .dialog-members {
    margin-top: 20px;
  }

  .dialog-members h4 {
    margin-bottom: 15px;
    color: #2c3e50;
  }

  .members-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .members-list li {
    padding: 12px 15px;
    background: #f8f9fa;
    margin-bottom: 8px;
    border-radius: 6px;
    font-size: 14px;
    color: #555;
  }

  .dialog-abstract {
    margin-top: 20px;
  }

  .dialog-abstract h4 {
    margin-bottom: 15px;
    color: #2c3e50;
  }

  .abstract-content {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    line-height: 1.6;
    font-size: 14px;
    color: #555;
    max-height: 300px;
    overflow-y: auto;
    word-wrap: break-word;
  }

  .abstract-link {
    color: #007bff;
    text-decoration: underline;
    word-break: break-all;
    transition: color 0.2s;
  }

  .abstract-link:hover {
    color: #0056b3;
    text-decoration: underline;
  }

  .dialog-footer {
    padding: 20px 30px;
    border-top: 2px solid #e0e0e0;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    background: #f8f9fa;
    border-radius: 0 0 12px 12px;
  }

  .btn-dialog {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-verify {
    background: #28a745;
    color: white;
  }

  .btn-verify:hover:not(:disabled) {
    background: #218838;
    transform: translateY(-1px);
  }

  .btn-reject {
    background: #dc3545;
    color: white;
  }

  .btn-reject:hover:not(:disabled) {
    background: #c82333;
    transform: translateY(-1px);
  }

  .btn-cancel {
    background: #6c757d;
    color: white;
  }

  .btn-cancel:hover {
    background: #5a6268;
    transform: translateY(-1px);
  }

  .btn-dialog:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  /* Professional Tables for Details View */
  .info-section {
    margin-bottom: 25px;
  }

  .info-section h4 {
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #007bff;
  }

  .info-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    overflow: hidden;
  }

  .info-table tr {
    border-bottom: 1px solid #dee2e6;
  }

  .info-table tr:last-child {
    border-bottom: none;
  }

  .info-label {
    background: #f8f9fa;
    padding: 12px 15px;
    font-weight: 600;
    color: #495057;
    width: 25%;
    border-right: 1px solid #dee2e6;
  }

  .info-value {
    padding: 12px 15px;
    color: #212529;
    width: 25%;
  }

  .members-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    overflow: hidden;
  }

  .members-table thead {
    background: #007bff;
    color: white;
  }

  .members-table th {
    padding: 12px 10px;
    text-align: left;
    font-weight: 600;
    font-size: 13px;
  }

  .members-table tbody tr {
    border-bottom: 1px solid #dee2e6;
  }

  .members-table tbody tr:last-child {
    border-bottom: none;
  }

  .members-table tbody tr:hover {
    background: #f8f9fa;
  }

  .members-table td {
    padding: 10px;
    font-size: 13px;
    color: #212529;
  }

  .view-link {
    color: #007bff;
    text-decoration: none;
    font-weight: 500;
  }

  .view-link:hover {
    text-decoration: underline;
  }

  .no-members {
    padding: 15px;
    text-align: center;
    color: #6c757d;
    font-style: italic;
    background: #f8f9fa;
    border-radius: 6px;
    margin: 0;
  }

  .abstract-box {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
    border: 1px solid #dee2e6;
    line-height: 1.6;
    font-size: 14px;
    color: #495057;
    max-height: 300px;
    overflow-y: auto;
    word-wrap: break-word;
  }

  .details-card {
    padding: 20px;
    background: #ffffff;
  }
`;
document.head.appendChild(style);