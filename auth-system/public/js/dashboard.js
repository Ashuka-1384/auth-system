// ============ Auth Check ============
const token = localStorage.getItem("token");
const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

if (!token) {
  window.location.href = "/";
}

// ============ Toast System ============
class ToastManager {
  constructor() {
    this.container = document.getElementById("toastContainer");
  }
  show(message, type = "info", duration = 4000) {
    const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.classList.add('removing');setTimeout(()=>this.parentElement.remove(),400)">✕</button>
      <div class="toast-progress"></div>
    `;
    this.container.appendChild(t);
    setTimeout(() => {
      if (t.parentElement) {
        t.classList.add("removing");
        setTimeout(() => t.remove(), 400);
      }
    }, duration);
  }
}
const toast = new ToastManager();

// ============ API Helper ============
async function api(endpoint, method = "GET", data = null) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  if (data) opts.body = JSON.stringify(data);

  const res = await fetch(`/api${endpoint}`, opts);
  const result = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "/";
      return;
    }
    throw new Error(result.message || "خطا");
  }
  return result;
}

// ============ Initialize ============
document.addEventListener("DOMContentLoaded", () => {
  loadUserInfo();
  loadStats();
  loadUsers();
  setupNavigation();
  setupMobileMenu();
  setupPasswordToggles();
  setupSearch();
  setupForms();
});

// ============ Load User Info ============
async function loadUserInfo() {
  try {
    const { user } = await api("/auth/me");

    document.getElementById("userNameSidebar").textContent = user.fullName;
    document.getElementById("userRoleSidebar").textContent =
      user.role === "admin"
        ? "مدیر کل"
        : user.role === "moderator"
          ? "مدیر"
          : "کاربر";

    const initials = user.fullName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2);
    document.getElementById("userAvatar").textContent = initials;

    document.getElementById("welcomeMsg").textContent =
      `${user.fullName} عزیز، به داشبورد خود خوش آمدید`;

    // Fill profile form
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    if (profileName) profileName.value = user.fullName;
    if (profileEmail) profileEmail.value = user.email;

    // Store updated user
    localStorage.setItem("user", JSON.stringify(user));
  } catch (err) {
    console.error("Error loading user info:", err);
  }
}

// ============ Load Stats ============
async function loadStats() {
  try {
    const { stats } = await api("/users/stats/overview");

    animateNumber("totalUsers", stats?.totalUsers || 0);
    animateNumber("activeUsers", stats?.activeUsers || 0);
    animateNumber("newUsers", stats?.newUsersThisWeek || 0);
    animateNumber("todayLogins", stats?.todayLogins || 0);
  } catch (err) {
    // User might not be admin
    document.getElementById("totalUsers").textContent = "-";
    document.getElementById("activeUsers").textContent = "-";
    document.getElementById("newUsers").textContent = "-";
    document.getElementById("todayLogins").textContent = "-";
  }
}

// ============ Animate Number ============
function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let current = 0;
  const increment = Math.ceil(target / 30);
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = current.toLocaleString("fa-IR");
  }, 30);
}

// ============ Load Users ============
let currentPage = 1;
let searchTimeout;

async function loadUsers(page = 1) {
  const search = document.getElementById("searchInput")?.value || "";
  const role = document.getElementById("roleFilter")?.value || "";
  const status = document.getElementById("statusFilter")?.value || "";

  try {
    const { data, pagination } = await api(
      `/users?page=${page}&limit=10&search=${search}&role=${role}&status=${status}`,
    );

    currentPage = page;
    renderUsersTable(data);
    renderPagination(pagination);

    document.getElementById("tableInfo").textContent =
      `نمایش ${data.length} از ${pagination.total} کاربر`;
  } catch (err) {
    const tbody = document.getElementById("usersTableBody");
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-icon">🔒</div>
            <h3>دسترسی محدود</h3>
            <p>فقط ادمین‌ها دسترسی به لیست کاربران دارند</p>
          </div>
        </td>
      </tr>
    `;
  }
}

// ============ Render Users Table ============
function renderUsersTable(users) {
  const tbody = document.getElementById("usersTableBody");

  if (!users || users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>کاربری یافت نشد</h3>
            <p>کاربری با این مشخصات وجود ندارد</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const avatarColors = [
    "linear-gradient(135deg, #6366f1, #818cf8)",
    "linear-gradient(135deg, #06b6d4, #22d3ee)",
    "linear-gradient(135deg, #f43f5e, #fb7185)",
    "linear-gradient(135deg, #10b981, #34d399)",
    "linear-gradient(135deg, #f59e0b, #fbbf24)",
    "linear-gradient(135deg, #8b5cf6, #a78bfa)",
  ];

  tbody.innerHTML = users
    .map((user, index) => {
      const initials = user.fullName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2);
      const color = avatarColors[index % avatarColors.length];
      const roleLabel = { admin: "ادمین", moderator: "مدیر", user: "کاربر" };

      const createdDate = new Date(user.createdAt).toLocaleDateString("fa-IR");
      const lastLogin = user.lastLogin
        ? new Date(user.lastLogin).toLocaleDateString("fa-IR")
        : "هرگز";

      return `
      <tr style="animation: fadeInUp 0.4s ease ${index * 0.05}s forwards; opacity: 0;">
        <td>
          <div class="user-cell">
            <div class="avatar" style="background: ${color}; color: #fff;">${initials}</div>
            <div>
              <div class="name">${user.fullName}</div>
              <div class="email">${user.email}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge ${user.role}">
            ${roleLabel[user.role] || user.role}
          </span>
        </td>
        <td>
          <span class="badge ${user.isActive ? "active" : "inactive"}">
            <span class="badge-dot"></span>
            ${user.isActive ? "فعال" : "غیرفعال"}
          </span>
        </td>
        <td>${createdDate}</td>
        <td>${lastLogin}</td>
        <td>
          <div class="action-btns">
            <button class="action-btn edit" onclick="editUser('${user._id}')" title="ویرایش">
              ✏️
            </button>
            <button class="action-btn delete" onclick="deleteUser('${user._id}')" title="حذف">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

// ============ Render Pagination ============
function renderPagination(pagination) {
  const container = document.getElementById("pagination");
  if (!pagination || pagination.pages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";

  // Previous
  html += `<button class="page-btn" ${pagination.page <= 1 ? "disabled" : ""} 
    onclick="loadUsers(${pagination.page - 1})">◄</button>`;

  // Page numbers
  for (let i = 1; i <= pagination.pages; i++) {
    if (
      i === 1 ||
      i === pagination.pages ||
      (i >= pagination.page - 1 && i <= pagination.page + 1)
    ) {
      html += `<button class="page-btn ${i === pagination.page ? "active" : ""}" 
        onclick="loadUsers(${i})">${i}</button>`;
    } else if (i === pagination.page - 2 || i === pagination.page + 2) {
      html += `<span style="color: var(--text-muted); padding: 0 4px;">...</span>`;
    }
  }

  // Next
  html += `<button class="page-btn" ${pagination.page >= pagination.pages ? "disabled" : ""} 
    onclick="loadUsers(${pagination.page + 1})">►</button>`;

  container.innerHTML = html;
}

// ============ Search & Filters ============
function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  const roleFilter = document.getElementById("roleFilter");
  const statusFilter = document.getElementById("statusFilter");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => loadUsers(1), 400);
    });
  }

  if (roleFilter) roleFilter.addEventListener("change", () => loadUsers(1));
  if (statusFilter) statusFilter.addEventListener("change", () => loadUsers(1));
}

// ============ Edit User ============
async function editUser(userId) {
  try {
    const { user } = await api(`/users/${userId}`);

    document.getElementById("editUserId").value = user._id;
    document.getElementById("editFullName").value = user.fullName;
    document.getElementById("editEmail").value = user.email;
    document.getElementById("editRole").value = user.role;
    document.getElementById("editActive").checked = user.isActive;

    openModal("editModal");
  } catch (err) {
    toast.show(err.message, "error");
  }
}

async function saveUserEdit() {
  const userId = document.getElementById("editUserId").value;
  const data = {
    fullName: document.getElementById("editFullName").value,
    email: document.getElementById("editEmail").value,
    role: document.getElementById("editRole").value,
    isActive: document.getElementById("editActive").checked,
  };

  try {
    await api(`/users/${userId}`, "PUT", data);
    toast.show("کاربر بروزرسانی شد", "success");
    closeModal("editModal");
    loadUsers(currentPage);
    loadStats();
  } catch (err) {
    toast.show(err.message, "error");
  }
}

// ============ Delete User ============
function deleteUser(userId) {
  document.getElementById("deleteUserId").value = userId;
  openModal("deleteModal");
}

async function confirmDelete() {
  const userId = document.getElementById("deleteUserId").value;

  try {
    await api(`/users/${userId}`, "DELETE");
    toast.show("کاربر حذف شد", "success");
    closeModal("deleteModal");
    loadUsers(currentPage);
    loadStats();
  } catch (err) {
    toast.show(err.message, "error");
  }
}

// ============ Modal ============
function openModal(id) {
  document.getElementById(id).classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
  document.body.style.overflow = "";
}

// Close modal on overlay click
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
});

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.active").forEach((m) => {
      m.classList.remove("active");
    });
    document.body.style.overflow = "";
  }
});

// ============ Navigation ============
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item[data-section]");

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const section = item.dataset.section;

      // Update active nav
      navItems.forEach((n) => n.classList.remove("active"));
      item.classList.add("active");

      // Show section
      document.querySelectorAll("main > section").forEach((s) => {
        s.style.display = "none";
      });

      const targetSection = document.getElementById(`${section}Section`);
      if (targetSection) {
        targetSection.style.display = "block";
        targetSection.style.animation = "fadeInUp 0.5s ease";
      } else if (section === "dashboard") {
        document.getElementById("dashboardSection").style.display = "block";
      }

      // Close mobile sidebar
      document.getElementById("sidebar")?.classList.remove("open");
      document.getElementById("sidebarOverlay")?.classList.remove("active");
    });
  });
}

// ============ Mobile Menu ============
function setupMobileMenu() {
  const toggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (toggle) {
    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("active");
    });
  }

  if (overlay) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
    });
  }
}

// ============ Password Toggles ============
function setupPasswordToggles() {
  document.querySelectorAll(".password-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".input-wrapper").querySelector("input");
      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "🔒";
      } else {
        input.type = "password";
        btn.textContent = "👁️";
      }
    });
  });
}

// ============ Forms ============
function setupForms() {
  // Profile Form
  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fullName = document.getElementById("profileName").value;
      const email = document.getElementById("profileEmail").value;

      try {
        const result = await api("/auth/update-profile", "PUT", {
          fullName,
          email,
        });
        toast.show("پروفایل بروزرسانی شد", "success");
        localStorage.setItem("user", JSON.stringify(result.user));
        loadUserInfo();
      } catch (err) {
        toast.show(err.message, "error");
      }
    });
  }

  // Password Form
  const passwordForm = document.getElementById("passwordForm");
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(passwordForm);

      try {
        const result = await api("/auth/change-password", "PUT", {
          currentPassword: formData.get("currentPassword"),
          newPassword: formData.get("newPassword"),
        });

        localStorage.setItem("token", result.token);
        toast.show("رمز عبور تغییر کرد", "success");
        passwordForm.reset();
      } catch (err) {
        toast.show(err.message, "error");
      }
    });
  }
}

// ============ Logout ============
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  toast.show("با موفقیت خارج شدید", "info");
  setTimeout(() => {
    window.location.href = "/";
  }, 800);
});
