// ============ Particles Generator ============
function generateParticles() {
  const container = document.getElementById("particles");
  if (!container) return;

  const count = window.innerWidth < 768 ? 20 : 40;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDuration = Math.random() * 20 + 10 + "s";
    particle.style.animationDelay = Math.random() * 20 + "s";
    particle.style.width = Math.random() * 4 + 1 + "px";
    particle.style.height = particle.style.width;
    container.appendChild(particle);
  }
}

generateParticles();

// ============ Toast Notification System ============
class ToastManager {
  constructor() {
    this.container = document.getElementById("toastContainer");
  }

  show(message, type = "info", duration = 4000) {
    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.classList.add('removing'); setTimeout(() => this.parentElement.remove(), 400);">✕</button>
      <div class="toast-progress"></div>
    `;

    this.container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add("removing");
        setTimeout(() => toast.remove(), 400);
      }
    }, duration);
  }
}

const toast = new ToastManager();

// ============ Tab Switching ============
const tabBtns = document.querySelectorAll(".tab-btn");
const tabSlider = document.querySelector(".tab-slider");
const loginPanel = document.getElementById("loginPanel");
const registerPanel = document.getElementById("registerPanel");

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;

    // Update active states
    tabBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    if (tab === "login") {
      tabSlider.className = "tab-slider left";
      loginPanel.classList.remove("hidden");
      loginPanel.classList.add("slide-in-left");
      registerPanel.classList.add("hidden");
      registerPanel.classList.remove("slide-in-right");
    } else {
      tabSlider.className = "tab-slider right";
      registerPanel.classList.remove("hidden");
      registerPanel.classList.add("slide-in-right");
      loginPanel.classList.add("hidden");
      loginPanel.classList.remove("slide-in-left");
    }
  });
});

// ============ Password Toggle ============
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

// ============ Password Strength Checker ============
const passwordInput = document.querySelector(
  '#registerPanel input[name="password"]',
);
if (passwordInput) {
  passwordInput.addEventListener("input", (e) => {
    const val = e.target.value;
    const bars = [
      document.getElementById("str1"),
      document.getElementById("str2"),
      document.getElementById("str3"),
      document.getElementById("str4"),
    ];
    const text = document.getElementById("strengthText");

    let score = 0;
    if (val.length >= 6) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const levels = ["", "ضعیف", "متوسط", "خوب", "قوی"];
    const colors = ["", "weak", "medium", "strong", "strong"];
    const textColors = [
      "",
      "var(--danger)",
      "var(--warning)",
      "var(--success)",
      "var(--success)",
    ];

    bars.forEach((bar, i) => {
      bar.className = "strength-bar";
      if (i < score) {
        bar.classList.add("active", colors[score]);
      }
    });

    text.textContent = val.length > 0 ? levels[score] : "";
    text.style.color = textColors[score];
  });
}

// ============ Input Validation Visual ============
document.querySelectorAll(".input-wrapper input").forEach((input) => {
  input.addEventListener("blur", () => {
    if (input.value.trim() === "") {
      input.classList.remove("valid", "invalid");
      return;
    }

    if (input.checkValidity()) {
      input.classList.remove("invalid");
      input.classList.add("valid");
    } else {
      input.classList.remove("valid");
      input.classList.add("invalid");
    }
  });

  input.addEventListener("input", () => {
    input.classList.remove("valid", "invalid");
  });
});

// ============ Button Ripple Effect ============
document.querySelectorAll(".btn-submit").forEach((btn) => {
  btn.addEventListener("click", function (e) {
    const ripple = document.createElement("span");
    ripple.classList.add("ripple");
    const rect = this.getBoundingClientRect();
    ripple.style.left = e.clientX - rect.left + "px";
    ripple.style.top = e.clientY - rect.top + "px";
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

// ============ API Helper ============
const API_URL = "/api";

async function apiRequest(endpoint, method = "GET", data = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  const token = localStorage.getItem("token");
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "خطای ناشناخته");
  }

  return result;
}

// ============ Set Button Loading State ============
function setLoading(form, loading) {
  const btn = form.querySelector(".btn-submit");
  const text = btn.querySelector(".btn-text");

  if (loading) {
    btn.classList.add("loading");
    text.innerHTML = '<div class="spinner"></div> لطفاً صبر کنید...';
    btn.disabled = true;
  } else {
    btn.classList.remove("loading");
    btn.disabled = false;
  }
}

// ============ Login Form ============
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(loginForm);
    const email = formData.get("email");
    const password = formData.get("password");

    if (!email || !password) {
      toast.show("لطفاً تمام فیلدها را پر کنید", "warning");
      return;
    }

    setLoading(loginForm, true);
    const btnText = loginForm.querySelector(".btn-text");

    try {
      const result = await apiRequest("/auth/login", "POST", {
        email,
        password,
      });

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));

      btnText.textContent = "✅ ورود موفق!";
      toast.show("با موفقیت وارد شدید", "success");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (error) {
      toast.show(error.message, "error");
      setLoading(loginForm, false);
      btnText.textContent = "ورود به حساب";
    }
  });
}

// ============ Register Form ============
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(registerForm);
    const fullName = formData.get("fullName");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (!fullName || !email || !password || !confirmPassword) {
      toast.show("لطفاً تمام فیلدها را پر کنید", "warning");
      return;
    }

    if (password !== confirmPassword) {
      toast.show("رمز عبور و تکرار آن مطابقت ندارند", "error");
      return;
    }

    if (password.length < 6) {
      toast.show("رمز عبور باید حداقل ۶ کاراکتر باشد", "warning");
      return;
    }

    setLoading(registerForm, true);
    const btnText = registerForm.querySelector(".btn-text");

    try {
      const result = await apiRequest("/auth/register", "POST", {
        fullName,
        email,
        password,
      });

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));

      btnText.textContent = "✅ ثبت نام موفق!";
      toast.show("ثبت نام با موفقیت انجام شد", "success");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (error) {
      toast.show(error.message, "error");
      setLoading(registerForm, false);
      btnText.textContent = "ثبت نام";
    }
  });
}

// ============ Check if already logged in ============
(function () {
  const token = localStorage.getItem("token");
  if (token && window.location.pathname === "/") {
    // Verify token
    apiRequest("/auth/me")
      .then(() => {
        window.location.href = "/dashboard";
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      });
  }
})();
