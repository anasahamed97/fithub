// FitHub Client-Side JavaScript Application

// Auth guard - redirect to login if not admin
const loggedInUser = JSON.parse(localStorage.getItem('fithub_user') || 'null');
if (!loggedInUser || loggedInUser.role !== 'admin') {
  window.location.href = 'login.html';
}

// Monkey-patch fetch to automatically add admin headers
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  const user = JSON.parse(localStorage.getItem('fithub_user') || 'null');
  if (user) {
    options.headers = options.headers || {};
    options.headers['x-user-role'] = user.role;
    options.headers['x-user-email'] = user.email;
  }
  return originalFetch(url, options);
};

// Base API URL
const API_URL = '/api';

// Application State Cache
let state = {
  members: [],
  plans: [],
  trainers: [],
  attendance: [],
  payments: [],
  equipment: [],
  activeView: 'dashboard'
};

// Chart instances
let revenueChart = null;
let distributionChart = null;

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  setupEventListeners();
  loadAllData().then(() => {
    switchView('dashboard');
  });
});

// 1. DIGITAL CLOCK
function initClock() {
  const clockEl = document.getElementById('digital-clock');
  setInterval(() => {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    
    clockEl.textContent = `${hours}:${minutes}:${seconds} ${ampm}`;
  }, 1000);
}

// 2. DATA ORCHESTRATOR
async function loadAllData() {
  try {
    const [membersRes, plansRes, trainersRes, attendanceRes, paymentsRes, equipmentRes] = await Promise.all([
      fetch(`${API_URL}/members`),
      fetch(`${API_URL}/plans`),
      fetch(`${API_URL}/trainers`),
      fetch(`${API_URL}/attendance`),
      fetch(`${API_URL}/payments`),
      fetch(`${API_URL}/equipment`)
    ]);

    state.members = await membersRes.json();
    state.plans = await plansRes.json();
    state.trainers = await trainersRes.json();
    state.attendance = await attendanceRes.json();
    state.payments = await paymentsRes.json();
    state.equipment = await equipmentRes.json();

    // Populate selects dropdowns throughout the app
    populateDropdowns();
    return true;
  } catch (error) {
    console.error("Error fetching project data from backend:", error);
    showToast("Error communicating with backend. Make sure the server is running.", "error");
    return false;
  }
}

// 3. TOAST SYSTEM
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  // Automatically remove toast after 4 seconds
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// 4. NAVIGATION VIEW CONTROLLER
function switchView(viewName) {
  state.activeView = viewName;
  
  // Update sidebar links active class
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Switch visible screen views
  document.querySelectorAll('.content-view').forEach(view => {
    if (view.id === `view-${viewName}`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // Update Topbar Titles
  const viewTitle = document.getElementById('view-title');
  const viewSubtitle = document.getElementById('view-subtitle');
  
  if (viewName === 'dashboard') {
    viewTitle.textContent = "Dashboard Overview";
    viewSubtitle.textContent = "Welcome back! Here's what's happening at FitHub today.";
    loadDashboardView();
  } else if (viewName === 'members') {
    viewTitle.textContent = "Members Registry";
    viewSubtitle.textContent = "Manage members, active subscriptions, and view profiles.";
    loadMembersView();
  } else if (viewName === 'attendance') {
    viewTitle.textContent = "Class Schedules & Check-ins";
    viewSubtitle.textContent = "Log member attendance and track group fitness classes.";
    loadAttendanceView();
  } else if (viewName === 'trainers') {
    viewTitle.textContent = "Trainers & Instructors";
    viewSubtitle.textContent = "Manage physical fitness trainers and specialized coaches.";
    loadTrainersView();
  } else if (viewName === 'plans') {
    viewTitle.textContent = "Membership Plans & Billing";
    viewSubtitle.textContent = "Define subscriptions package levels and audit payment logs.";
    loadPlansView();
  } else if (viewName === 'equipment') {
    viewTitle.textContent = "Gym Equipment & Maintenance";
    viewSubtitle.textContent = "Monitor mechanical status, schedule servicing, and log notes for assets.";
    loadEquipmentView();
  }
}

// 5. VIEW DATA LOADERS

// A. DASHBOARD VIEW
async function loadDashboardView() {
  try {
    const res = await fetch(`${API_URL}/dashboard`);
    const data = await res.json();
    if (!data || !data.metrics) {
      console.error("Dashboard data missing metrics:", data);
      showToast("Failed to load dashboard metrics. Please check server status.", "error");
      return;
    }
    // Set stats metrics
    document.getElementById('stat-total-members').textContent = data.metrics.totalMembers;
    document.getElementById('stat-active-members').textContent = data.metrics.activeMembers;
    document.getElementById('stat-today-attendance').textContent = data.metrics.todayAttendance;
    document.getElementById('stat-monthly-revenue').textContent = `$${data.metrics.revenueThisMonth.toFixed(2)}`;

    // Set check-in subtext
    document.getElementById('stat-attendance-subtext').textContent = 
      `${data.metrics.todayAttendance} members checked in today`;

    // Render Recent Activities
    const activityList = document.getElementById('dashboard-recent-activity');
    activityList.innerHTML = '';
    
    if (data.recentActivity.length === 0) {
      activityList.innerHTML = '<div class="text-center py-4 text-muted">No recent activities found.</div>';
    } else {
      data.recentActivity.forEach(act => {
        let iconClass = 'fa-user-check';
        if (act.icon === 'credit-card') iconClass = 'fa-credit-card';

        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
          <div class="activity-icon-container ${act.color}">
            <i class="fa-solid ${iconClass}"></i>
          </div>
          <div class="activity-details">
            <h4>${act.title}</h4>
            <p>${act.detail}</p>
          </div>
          <div class="activity-time">${act.time}</div>
        `;
        activityList.appendChild(item);
      });
    }

    // Render Today's Check-ins Table
    const todayTable = document.getElementById('dashboard-today-attendance');
    todayTable.innerHTML = '';
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAttendance = state.attendance.filter(a => a.date === todayStr);

    if (todayAttendance.length === 0) {
      todayTable.innerHTML = `
        <tr>
          <td colspan="3" class="text-center text-muted">No check-ins today.</td>
        </tr>
      `;
    } else {
      todayAttendance.forEach(a => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${a.memberName}</strong></td>
          <td><span class="text-cyan font-600">${a.checkInType}</span></td>
          <td>${a.time}</td>
        `;
        todayTable.appendChild(row);
      });
    }

    // Initialize/Update Charts
    renderRevenueChart(data.charts.revenueTrend);
    renderDistributionChart(data.charts.classDistribution);

  } catch (error) {
    console.error("Error loading dashboard metrics:", error);
  }
}

// B. MEMBERS VIEW
function loadMembersView(membersData = state.members) {
  const tbody = document.getElementById('members-list-tbody');
  tbody.innerHTML = '';

  if (membersData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">No members found matching filters.</td>
      </tr>
    `;
    return;
  }

  membersData.forEach(member => {
    const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const statusClass = `badge badge-${member.status.toLowerCase()}`;
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>
        <div class="member-cell">
          <div class="member-cell-initials">${initials}</div>
          <div>
            <strong class="clickable" onclick="viewMemberProfile('${member.id}')" style="cursor: pointer; hover: underline;">${member.name}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted)">ID: ${member.id}</div>
          </div>
        </div>
      </td>
      <td>
        <div class="contact-cell">
          <span class="phone">${member.phone}</span>
          <span class="email">${member.email}</span>
        </div>
      </td>
      <td>${member.joinDate}</td>
      <td><span class="badge badge-pending" style="background: rgba(168, 85, 247, 0.1); color: var(--color-purple); border: 1px solid rgba(168, 85, 247, 0.2)">${member.planName}</span></td>
      <td>${member.trainerName}</td>
      <td><span class="${statusClass}">${member.status}</span></td>
      <td class="text-right">
        <div class="action-row">
          <button class="btn-icon edit" onclick="editMember('${member.id}')" title="Edit Member Profile">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-icon delete" onclick="deleteMember('${member.id}')" title="Remove Member">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// C. ATTENDANCE VIEW
function loadAttendanceView() {
  const tbody = document.getElementById('attendance-feed-tbody');
  tbody.innerHTML = '';

  if (state.attendance.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">No check-in logs recorded.</td>
      </tr>
    `;
    return;
  }

  state.attendance.forEach(a => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${a.memberName}</strong></td>
      <td><span class="text-muted">${a.memberEmail || '-'}</span></td>
      <td>${a.date}</td>
      <td>${a.time}</td>
      <td><span class="badge badge-active" style="background: rgba(6, 182, 212, 0.1); color: var(--color-cyan); border: 1px solid rgba(6, 182, 212, 0.2);">${a.checkInType}</span></td>
    `;
    tbody.appendChild(row);
  });
}

// D. TRAINERS VIEW
function loadTrainersView() {
  const grid = document.getElementById('trainers-grid-container');
  grid.innerHTML = '';

  if (state.trainers.length === 0) {
    grid.innerHTML = '<div class="text-center py-5 text-muted col-12">No trainers registered in the system.</div>';
    return;
  }

  state.trainers.forEach(t => {
    const card = document.createElement('div');
    card.className = 'trainer-card';
    card.innerHTML = `
      <div class="trainer-avatar">
        <i class="fa-solid fa-user-tie"></i>
      </div>
      <h3>${t.name}</h3>
      <div class="trainer-specialty">${t.specialty}</div>
      <div class="trainer-contacts">
        <div>
          <span>Phone</span>
          <span>${t.phone || '-'}</span>
        </div>
        <div>
          <span>Email</span>
          <span>${t.email || '-'}</span>
        </div>
        <div>
          <span>Status</span>
          <span style="color: ${t.status === 'Active' ? 'var(--color-emerald)' : 'var(--text-muted)'}">${t.status}</span>
        </div>
      </div>
      <div style="margin-top: 20px; width: 100%; display: flex; gap: 8px;">
        <button class="btn btn-sm btn-primary-outline btn-full" onclick="editTrainer('${t.id}')">
          <i class="fa-solid fa-pen"></i> Edit
        </button>
        <button class="btn btn-sm btn-secondary btn-full" onclick="deleteTrainer('${t.id}')">
          <i class="fa-solid fa-trash"></i> Remove
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// E. PLANS VIEW
function loadPlansView() {
  // Populate plans list cards
  const grid = document.getElementById('plans-grid-container');
  grid.innerHTML = '';

  if (state.plans.length === 0) {
    grid.innerHTML = '<div class="text-center py-5 text-muted col-12">No custom membership plans configured.</div>';
  } else {
    state.plans.forEach(plan => {
      const featureListItems = plan.features.map(f => `<li><i class="fa-solid fa-circle-check"></i> ${f}</li>`).join('');
      const memberCount = state.members.filter(m => m.planId === plan.id).length;
      
      const card = document.createElement('div');
      card.className = 'plan-card';
      card.innerHTML = `
        <div class="plan-card-header">
          <h3>${plan.name}</h3>
          <div class="plan-price-block">
            <span class="plan-price">$${plan.price}</span>
            <span class="plan-price-period">/ ${plan.duration === 1 ? 'month' : plan.duration + ' months'}</span>
          </div>
        </div>
        <ul class="plan-features">
          ${featureListItems || '<li><i class="fa-solid fa-circle-notch"></i> Standard Access features</li>'}
        </ul>
        <div class="plan-card-footer">
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted);">
            <span>Active Enrollees</span>
            <strong style="color: var(--text-main);">${memberCount} members</strong>
          </div>
          <button class="btn btn-sm btn-secondary btn-full" style="margin-top: 14px;" onclick="deletePlan('${plan.id}')">
            <i class="fa-solid fa-trash"></i> Delete Plan
          </button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // Populate payments transaction table
  const tbody = document.getElementById('billing-history-tbody');
  tbody.innerHTML = '';

  if (state.payments.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">No transactions found.</td>
      </tr>
    `;
    return;
  }

  state.payments.forEach(p => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${p.memberName}</strong></td>
      <td>${p.planName}</td>
      <td><span class="text-emerald font-600">$${p.amount.toFixed(2)}</span></td>
      <td>${p.date}</td>
      <td>${p.paymentMethod}</td>
    `;
    tbody.appendChild(row);
  });
}

// 6. FORM DROPDOWN POPULATORS
function populateDropdowns() {
  // A. Add Member form selections
  const planSelect = document.getElementById('member-form-plan');
  const trainerSelect = document.getElementById('member-form-trainer');
  
  planSelect.innerHTML = '<option value="">No Subscription Plan</option>';
  state.plans.forEach(p => {
    planSelect.innerHTML += `<option value="${p.id}">${p.name} ($${p.price})</option>`;
  });

  trainerSelect.innerHTML = '<option value="">No Personal Trainer</option>';
  state.trainers.forEach(t => {
    if (t.status === 'Active') {
      trainerSelect.innerHTML += `<option value="${t.id}">${t.name} (${t.specialty})</option>`;
    }
  });

  // B. Attendance Check-in form selections
  const checkinSelect = document.getElementById('checkin-member-select');
  const quickcheckinSelect = document.getElementById('quick-checkin-member');

  const memberOptions = state.members
    .filter(m => m.status === 'Active')
    .map(m => `<option value="${m.id}">${m.name} (${m.phone})</option>`)
    .join('');

  checkinSelect.innerHTML = '<option value="" disabled selected>Choose a member...</option>' + memberOptions;
  quickcheckinSelect.innerHTML = '<option value="" disabled selected>Choose member...</option>' + memberOptions;

  // C. Payment form selections
  const payMemberSelect = document.getElementById('payment-form-member');
  const payPlanSelect = document.getElementById('payment-form-plan');

  payMemberSelect.innerHTML = '<option value="" disabled selected>Choose a member...</option>' + 
    state.members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

  payPlanSelect.innerHTML = '<option value="" disabled selected>Choose plan...</option>' +
    state.plans.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name} ($${p.price})</option>`).join('');

  // D. Members search panel filter
  const filterPlanSelect = document.getElementById('member-filter-plan');
  filterPlanSelect.innerHTML = '<option value="">All Plans</option>' +
    state.plans.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

// 7. CHART RENDERERS (Chart.js)
function renderRevenueChart(trendData) {
  const ctx = document.getElementById('chart-revenue').getContext('2d');
  
  if (revenueChart) {
    revenueChart.destroy();
  }

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
  gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');

  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trendData.labels,
      datasets: [{
        label: 'Monthly Revenue ($)',
        data: trendData.data,
        borderColor: '#a855f7',
        borderWidth: 3,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#fff',
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#a1a1aa', font: { family: 'Inter' } }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#a1a1aa', font: { family: 'Inter' } }
        }
      }
    }
  });
}

function renderDistributionChart(distData) {
  const ctx = document.getElementById('chart-distribution').getContext('2d');

  if (distributionChart) {
    distributionChart.destroy();
  }

  distributionChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: distData.labels,
      datasets: [{
        data: distData.data,
        backgroundColor: [
          '#a855f7', // purple
          '#06b6d4', // cyan
          '#f43f5e', // pink
          '#10b981', // emerald
          '#f59e0b', // amber
          '#3b82f6'  // blue
        ],
        borderWidth: 1,
        borderColor: 'rgba(20, 20, 24, 0.95)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#a1a1aa',
            font: { family: 'Inter', size: 11 },
            boxWidth: 12,
            padding: 12
          }
        }
      },
      cutout: '65%'
    }
  });
}

// 8. CRUD ACTIONS IMPLEMENTATIONS

// MEMBERS CRUD
function editMember(id) {
  const member = state.members.find(m => m.id == id);
  if (!member) return;

  document.getElementById('member-modal-title').textContent = "Edit Member Profile";
  document.getElementById('member-form-id').value = member.id;
  document.getElementById('member-form-name').value = member.name;
  document.getElementById('member-form-gender').value = member.gender || 'Male';
  document.getElementById('member-form-email').value = member.email;
  document.getElementById('member-form-phone').value = member.phone;
  document.getElementById('member-form-password').value = '';
  document.getElementById('member-form-plan').value = member.planId || '';
  document.getElementById('member-form-trainer').value = member.trainerId || '';
  document.getElementById('member-form-notes').value = member.notes || '';

  openModal('modal-member');
}

async function deleteMember(id) {
  if (!confirm("Are you sure you want to delete this member? All associated transactions and check-in history will be deleted.")) return;

  try {
    const res = await fetch(`${API_URL}/members/${id}`, { method: 'DELETE' });
    const data = await res.json();
    
    if (res.ok) {
      showToast("Member successfully deleted.", "success");
      await loadAllData();
      if (state.activeView === 'dashboard') loadDashboardView();
      if (state.activeView === 'members') loadMembersView();
    } else {
      showToast(data.error || "Failed to delete member", "error");
    }
  } catch (error) {
    showToast("Server error during member deletion", "error");
  }
}

async function viewMemberProfile(id) {
  try {
    const res = await fetch(`${API_URL}/members/${id}`);
    const data = await res.json();

    if (!res.ok) {
      showToast("Could not load member profile details.", "error");
      return;
    }

    const { profile, attendance, payments } = data;
    const initials = profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    let attLogs = attendance.map(a => `
      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 4px;">
        <span>${a.date} at ${a.time}</span>
        <span style="color: var(--color-cyan); font-weight: 500;">${a.checkInType}</span>
      </div>
    `).join('');

    let payLogs = payments.map(p => `
      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 4px;">
        <span>${p.date} - ${p.planName}</span>
        <span style="color: var(--color-emerald); font-weight: 600;">+$${p.amount.toFixed(2)}</span>
      </div>
    `).join('');

    const profileBody = document.getElementById('profile-modal-body');
    profileBody.innerHTML = `
      <div class="profile-summary-grid">
        <div class="profile-sidebar">
          <div class="profile-pic">${initials}</div>
          <h3>${profile.name}</h3>
          <span class="badge badge-${profile.status.toLowerCase()} status-indicator">${profile.status}</span>
          
          <div class="profile-detail-list">
            <div>
              <span>Joined</span>
              <span>${profile.joinDate}</span>
            </div>
            <div>
              <span>Gender</span>
              <span>${profile.gender}</span>
            </div>
            <div>
              <span>Phone</span>
              <span>${profile.phone}</span>
            </div>
            <div>
              <span>Email</span>
              <span>${profile.email}</span>
            </div>
          </div>
        </div>

        <div class="profile-tabs">
          <div class="profile-tab-header">
            <button class="tab-btn active" onclick="switchProfileTab(this, 'profile-notes-tab')">Overview</button>
            <button class="tab-btn" onclick="switchProfileTab(this, 'profile-attendance-tab')">Attendance History</button>
            <button class="tab-btn" onclick="switchProfileTab(this, 'profile-billing-tab')">Payments</button>
          </div>
          
          <div class="profile-tab-content-container">
            <div id="profile-notes-tab" class="profile-tab-content" style="display: block;">
              <h4 style="font-size: 0.85rem; margin-bottom: 8px; text-transform: uppercase; color: var(--text-muted);">Assigned Plan</h4>
              <p style="font-size: 0.9rem; font-weight: 600; color: var(--color-purple); margin-bottom: 16px;">
                ${profile.planName} ${profile.planPrice ? `($${profile.planPrice}/mo)` : ''}
              </p>
              
              <h4 style="font-size: 0.85rem; margin-bottom: 8px; text-transform: uppercase; color: var(--text-muted);">Assigned Coach</h4>
              <p style="font-size: 0.9rem; font-weight: 600; color: var(--color-cyan); margin-bottom: 16px;">
                ${profile.trainerName}
              </p>
              
              <h4 style="font-size: 0.85rem; margin-bottom: 8px; text-transform: uppercase; color: var(--text-muted);">Health & Training Notes</h4>
              <p class="profile-notes">${profile.notes || 'No training records or health restrictions logged.'}</p>
            </div>
            
            <div id="profile-attendance-tab" class="profile-tab-content" style="display: none;">
              ${attLogs || '<p class="text-center text-muted font-size-8 py-3">No attendance checks logged for this member.</p>'}
            </div>
            
            <div id="profile-billing-tab" class="profile-tab-content" style="display: none;">
              ${payLogs || '<p class="text-center text-muted font-size-8 py-3">No payments recorded.</p>'}
            </div>
          </div>
        </div>
      </div>
    `;

    openModal('modal-profile');
  } catch (error) {
    showToast("Profile fetch command failed", "error");
  }
}

function switchProfileTab(btn, tabId) {
  // Deactivate all buttons
  btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  // Active clicked
  btn.classList.add('active');

  // Hide all contents
  const container = btn.closest('.profile-tabs');
  container.querySelectorAll('.profile-tab-content').forEach(c => c.style.display = 'none');
  // Show selected content
  document.getElementById(tabId).style.display = 'block';
}

// TRAINERS CRUD
async function deleteTrainer(id) {
  if (!confirm("Are you sure you want to delete this trainer? Any members assigned to them will have their coach set to unassigned.")) return;

  try {
    const res = await fetch(`${API_URL}/trainers/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast("Trainer deleted successfully.", "success");
      await loadAllData();
      loadTrainersView();
    } else {
      showToast("Failed to delete trainer.", "error");
    }
  } catch (error) {
    showToast("Server error deleting trainer.", "error");
  }
}

function editTrainer(id) {
  const trainer = state.trainers.find(t => t.id == id);
  if (!trainer) return;

  document.getElementById('trainer-modal-title').textContent = "Edit Personal Trainer";
  document.getElementById('trainer-form-id').value = trainer.id;
  document.getElementById('trainer-form-name').value = trainer.name;
  document.getElementById('trainer-form-specialty').value = trainer.specialty;
  document.getElementById('trainer-form-email').value = trainer.email;
  document.getElementById('trainer-form-phone').value = trainer.phone || '';
  document.getElementById('trainer-form-password').value = '';

  openModal('modal-trainer');
}

// PLANS CRUD
async function deletePlan(id) {
  if (!confirm("Are you sure you want to delete this plan? Members currently assigned to this plan will remain registered, but their assigned plan will be reset.")) return;

  try {
    const res = await fetch(`${API_URL}/plans/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast("Plan deleted successfully.", "success");
      await loadAllData();
      loadPlansView();
    } else {
      showToast("Failed to delete membership plan.", "error");
    }
  } catch (error) {
    showToast("Server error during plan deletion.", "error");
  }
}

// 9. MODALS STATE MANAGEMENT
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('active');
  }, 10);
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove('active');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 250);
}

// 10. EVENT LISTENERS SETUP
function setupEventListeners() {
  // Sidebar view triggers
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.getAttribute('data-view');
      switchView(view);
    });
  });

  // Admin Logout Button
  document.getElementById('btn-admin-logout').addEventListener('click', () => {
    localStorage.removeItem('fithub_user');
    window.location.href = 'login.html';
  });

  // Modal open buttons
  document.getElementById('btn-quick-checkin').addEventListener('click', () => {
    openModal('modal-quick-checkin');
  });

  document.getElementById('btn-quick-member').addEventListener('click', () => {
    document.getElementById('member-form').reset();
    document.getElementById('member-form-id').value = '';
    document.getElementById('member-modal-title').textContent = "Add Gym Member";
    openModal('modal-member');
  });

  document.getElementById('btn-dashboard-checkin').addEventListener('click', () => {
    openModal('modal-quick-checkin');
  });

  document.getElementById('btn-add-member-trigger').addEventListener('click', () => {
    document.getElementById('member-form').reset();
    document.getElementById('member-form-id').value = '';
    document.getElementById('member-modal-title').textContent = "Add Gym Member";
    openModal('modal-member');
  });

  document.getElementById('btn-add-trainer-trigger').addEventListener('click', () => {
    document.getElementById('trainer-form').reset();
    document.getElementById('trainer-form-id').value = '';
    document.getElementById('trainer-modal-title').textContent = "Add Personal Trainer";
    openModal('modal-trainer');
  });

  document.getElementById('btn-add-plan-trigger').addEventListener('click', () => {
    document.getElementById('plan-form').reset();
    openModal('modal-plan');
  });

  document.getElementById('btn-record-payment-trigger').addEventListener('click', () => {
    document.getElementById('payment-form').reset();
    openModal('modal-payment');
  });

  document.getElementById('btn-add-equipment-trigger').addEventListener('click', () => {
    document.getElementById('equipment-form').reset();
    document.getElementById('equipment-form-id').value = '';
    document.getElementById('equipment-modal-title').textContent = "Add Gym Equipment";
    openModal('modal-equipment');
  });

  // Modal close listeners
  const closeMappings = [
    { btn: 'btn-close-member-modal', modal: 'modal-member' },
    { btn: 'btn-cancel-member-modal', modal: 'modal-member' },
    { btn: 'btn-close-trainer-modal', modal: 'modal-trainer' },
    { btn: 'btn-cancel-trainer-modal', modal: 'modal-trainer' },
    { btn: 'btn-close-plan-modal', modal: 'modal-plan' },
    { btn: 'btn-cancel-plan-modal', modal: 'modal-plan' },
    { btn: 'btn-close-payment-modal', modal: 'modal-payment' },
    { btn: 'btn-cancel-payment-modal', modal: 'modal-payment' },
    { btn: 'btn-close-profile-modal', modal: 'modal-profile' },
    { btn: 'btn-close-quick-checkin-modal', modal: 'modal-quick-checkin' },
    { btn: 'btn-cancel-quick-checkin-modal', modal: 'modal-quick-checkin' },
    { btn: 'btn-close-equipment-modal', modal: 'modal-equipment' },
    { btn: 'btn-cancel-equipment-modal', modal: 'modal-equipment' }
  ];

  closeMappings.forEach(mapping => {
    const el = document.getElementById(mapping.btn);
    if (el) {
      el.addEventListener('click', () => closeModal(mapping.modal));
    }
  });

  // Close modals clicking outside card content
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeModal(e.target.id);
    }
  });

  // --- FORM SUBMISSIONS ---

  // A. MEMBER SUBMISSION (ADD or EDIT)
  document.getElementById('member-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('member-form-id').value;
    const payload = {
      name: document.getElementById('member-form-name').value,
      gender: document.getElementById('member-form-gender').value,
      email: document.getElementById('member-form-email').value,
      phone: document.getElementById('member-form-phone').value,
      planId: document.getElementById('member-form-plan').value,
      trainerId: document.getElementById('member-form-trainer').value,
      notes: document.getElementById('member-form-notes').value
    };

    const password = document.getElementById('member-form-password').value;
    if (password) {
      payload.password = password;
    }

    const isEdit = !!id;
    const url = isEdit ? `${API_URL}/members/${id}` : `${API_URL}/members`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? "Member profile updated." : "New member registered successfully.", "success");
        closeModal('modal-member');
        await loadAllData();
        
        if (state.activeView === 'dashboard') loadDashboardView();
        if (state.activeView === 'members') loadMembersView();
      } else {
        showToast(data.error || "Failed to process member form", "error");
      }
    } catch (err) {
      showToast("Network error submitting member details", "error");
    }
  });

  // B. TRAINER SUBMISSION (ADD or EDIT)
  document.getElementById('trainer-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('trainer-form-id').value;
    const payload = {
      name: document.getElementById('trainer-form-name').value,
      specialty: document.getElementById('trainer-form-specialty').value,
      email: document.getElementById('trainer-form-email').value,
      phone: document.getElementById('trainer-form-phone').value
    };

    const password = document.getElementById('trainer-form-password').value;
    if (password) {
      payload.password = password;
    }

    const isEdit = !!id;
    const url = isEdit ? `${API_URL}/trainers/${id}` : `${API_URL}/trainers`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? "Trainer profile updated." : "New trainer registered successfully.", "success");
        closeModal('modal-trainer');
        await loadAllData();
        if (state.activeView === 'trainers') loadTrainersView();
      } else {
        showToast(data.error || "Error processing trainer profile.", "error");
      }
    } catch (err) {
      showToast("Server communication error", "error");
    }
  });

  // C. PLAN SUBMISSION
  document.getElementById('plan-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const featuresInput = document.getElementById('plan-form-features').value;
    const featuresList = featuresInput ? featuresInput.split(',').map(f => f.trim()).filter(f => f.length > 0) : [];

    const payload = {
      name: document.getElementById('plan-form-name').value,
      price: document.getElementById('plan-form-price').value,
      duration: document.getElementById('plan-form-duration').value,
      features: featuresList
    };

    try {
      const res = await fetch(`${API_URL}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast("New membership subscription plan added.", "success");
        closeModal('modal-plan');
        await loadAllData();
        if (state.activeView === 'plans') loadPlansView();
      } else {
        showToast("Failed to create plan.", "error");
      }
    } catch (err) {
      showToast("Network error creating plan", "error");
    }
  });

  // D. RECORD PAYMENT SUBMISSION
  document.getElementById('payment-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      memberId: document.getElementById('payment-form-member').value,
      planId: document.getElementById('payment-form-plan').value,
      amount: document.getElementById('payment-form-amount').value,
      paymentMethod: document.getElementById('payment-form-method').value
    };

    try {
      const res = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast("Transaction successfully recorded.", "success");
        closeModal('modal-payment');
        await loadAllData();
        if (state.activeView === 'plans') loadPlansView();
        if (state.activeView === 'dashboard') loadDashboardView();
      } else {
        showToast("Error logging payment.", "error");
      }
    } catch (err) {
      showToast("Network error writing payment", "error");
    }
  });

  // E. ATTENDANCE CHECK-IN SUBMISSIONS
  document.getElementById('attendance-checkin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    processCheckin(
      document.getElementById('checkin-member-select').value,
      document.getElementById('checkin-type-select').value,
      'modal-quick-checkin' // not actual modal but close dummy
    );
  });

  document.getElementById('quick-checkin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    processCheckin(
      document.getElementById('quick-checkin-member').value,
      document.getElementById('quick-checkin-type').value,
      'modal-quick-checkin'
    );
  });

  // Auto-populate price in payment recording when a plan is selected
  document.getElementById('payment-form-plan').addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const price = selectedOption.getAttribute('data-price');
    if (price) {
      document.getElementById('payment-form-amount').value = price;
    }
  });

  // --- CLIENT FILTER SEARCHING ---

  // Members search input live
  document.getElementById('member-search').addEventListener('input', runMemberFilters);
  document.getElementById('member-filter-status').addEventListener('change', runMemberFilters);
  document.getElementById('member-filter-plan').addEventListener('change', runMemberFilters);

  // Equipment search input live
  document.getElementById('equipment-search').addEventListener('input', runEquipmentFilters);
  document.getElementById('equipment-filter-status').addEventListener('change', runEquipmentFilters);

  // F. EQUIPMENT SUBMISSION (ADD or EDIT)
  document.getElementById('equipment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('equipment-form-id').value;
    const payload = {
      name: document.getElementById('equipment-form-name').value,
      status: document.getElementById('equipment-form-status').value,
      notes: document.getElementById('equipment-form-notes').value
    };

    const isEdit = !!id;
    const url = isEdit ? `${API_URL}/equipment/${id}` : `${API_URL}/equipment`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? "Equipment status updated." : "New equipment registered successfully.", "success");
        closeModal('modal-equipment');
        await loadAllData();
        if (state.activeView === 'equipment') loadEquipmentView();
      } else {
        showToast(data.error || "Failed to process equipment form", "error");
      }
    } catch (err) {
      showToast("Network error submitting equipment details", "error");
    }
  });
}

function loadEquipmentView(eqData = state.equipment) {
  const tbody = document.getElementById('equipment-list-tbody');
  tbody.innerHTML = '';

  if (eqData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted">No equipment found matching filters.</td>
      </tr>
    `;
    return;
  }

  eqData.forEach(eq => {
    let statusBadgeClass = 'badge-active';
    if (eq.status === 'Under Maintenance') {
      statusBadgeClass = 'badge-pending';
    } else if (eq.status === 'Out of Service') {
      statusBadgeClass = 'badge-inactive';
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <strong>${eq.name}</strong>
        <div style="font-size: 0.75rem; color: var(--text-muted)">ID: ${eq.id}</div>
      </td>
      <td><span class="badge ${statusBadgeClass}">${eq.status}</span></td>
      <td>${eq.notes || '<span class="text-muted">No issues or notes.</span>'}</td>
      <td class="text-right">
        <div class="action-row">
          <button class="btn-icon edit" onclick="editEquipment('${eq.id}')" title="Edit Equipment">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-icon delete" onclick="deleteEquipment('${eq.id}')" title="Remove Equipment">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function editEquipment(id) {
  const eq = state.equipment.find(e => e.id == id);
  if (!eq) return;

  document.getElementById('equipment-modal-title').textContent = "Edit Gym Equipment";
  document.getElementById('equipment-form-id').value = eq.id;
  document.getElementById('equipment-form-name').value = eq.name;
  document.getElementById('equipment-form-status').value = eq.status || 'Operational';
  document.getElementById('equipment-form-notes').value = eq.notes || '';

  openModal('modal-equipment');
}

async function deleteEquipment(id) {
  if (!confirm("Are you sure you want to remove this equipment from the registry?")) return;

  try {
    const res = await fetch(`${API_URL}/equipment/${id}`, { method: 'DELETE' });
    const data = await res.json();
    
    if (res.ok) {
      showToast("Equipment removed successfully.", "success");
      await loadAllData();
      loadEquipmentView();
    } else {
      showToast(data.error || "Failed to delete equipment.", "error");
    }
  } catch (error) {
    showToast("Server error during deletion", "error");
  }
}

function runEquipmentFilters() {
  const query = document.getElementById('equipment-search').value.toLowerCase();
  const status = document.getElementById('equipment-filter-status').value;

  let filtered = state.equipment;

  if (query) {
    filtered = filtered.filter(eq => 
      eq.name.toLowerCase().includes(query) ||
      (eq.notes && eq.notes.toLowerCase().includes(query))
    );
  }

  if (status) {
    filtered = filtered.filter(eq => eq.status === status);
  }

  loadEquipmentView(filtered);
}

// Attendance processing helper
async function processCheckin(memberId, checkInType, modalToClose) {
  try {
    const res = await fetch(`${API_URL}/attendance/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, checkInType })
    });

    if (res.ok) {
      showToast("Member successfully checked in.", "success");
      closeModal(modalToClose);
      
      // Reset forms
      document.getElementById('attendance-checkin-form').reset();
      document.getElementById('quick-checkin-form').reset();
      
      await loadAllData();
      if (state.activeView === 'dashboard') loadDashboardView();
      if (state.activeView === 'attendance') loadAttendanceView();
    } else {
      const err = await res.json();
      showToast(err.error || "Failed to log attendance.", "error");
    }
  } catch (err) {
    showToast("Network error checking in member", "error");
  }
}

// Run client-side filter searching for members grid
function runMemberFilters() {
  const query = document.getElementById('member-search').value.toLowerCase();
  const status = document.getElementById('member-filter-status').value;
  const plan = document.getElementById('member-filter-plan').value;

  let filtered = state.members;

  if (query) {
    filtered = filtered.filter(m => 
      m.name.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query) ||
      m.phone.includes(query)
    );
  }

  if (status) {
    filtered = filtered.filter(m => m.status === status);
  }

  if (plan) {
    filtered = filtered.filter(m => m.planId === plan);
  }

  loadMembersView(filtered);
}
