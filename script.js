const API_URL = window.API_URL;

if (!API_URL) {
  document.getElementById("msg").textContent = "Немає API_URL (перевір config.js)";
  throw new Error("API_URL is missing");
}

function clearToken(){
  localStorage.removeItem("dimobl_token");
}

function clearAuth(){
  const keys = ["dimobl_token","dimobl_role","dimobl_name","dimobl_login","dimobl_lastLogin"];
  keys.forEach(k => localStorage.removeItem(k));
}

function setMsg(t){
  const el = document.getElementById("msg");
  if (el) el.textContent = t || "";
}

/* 👁️ Показати / сховати пароль */
function togglePassword(){
  const p = document.getElementById("password");
  const b = document.getElementById("btnEye");
  if (!p || !b) return;

  const show = p.type === "password";
  p.type = show ? "text" : "password";

  b.textContent = show ? "🙈" : "👁️";
  b.setAttribute("aria-label", show ? "Сховати пароль" : "Показати пароль");
}

// прогрес + блокування форми
let isAuthBusy = false;

function setLoading(isOn, text){
  isAuthBusy = !!isOn;

  const p  = document.getElementById("progress");
  const pt = document.getElementById("progressText");
  const btn = document.getElementById("btnLogin");
  const loginEl = document.getElementById("login");
  const passEl  = document.getElementById("password");
  const eyeBtn  = document.getElementById("btnEye");

  if (pt && text) pt.textContent = text;
  if (p) p.hidden = !isOn;

  if (btn) btn.disabled = isOn;
  if (loginEl) loginEl.disabled = isOn;
  if (passEl) passEl.disabled = isOn;
  if (eyeBtn) eyeBtn.disabled = isOn;
}

// на старті сторінки — точно ховаємо прогрес
setLoading(false);

// document.addEventListener("keydown", (e)=>{
//   if (e.key === "Enter") {
    // щоб Enter не запускав повторно під час запиту
//     if (!isAuthBusy) auth();
//   }
// });

async function auth() {
  if (isAuthBusy) return;

  setMsg("");
  const login = document.getElementById("login").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!login || !password) return setMsg("Введіть логін і пароль");

  setLoading(true, "Виконую вхід…");

  try {
    const url = `${API_URL}?action=login&login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`;
    const r = await fetch(url);
    const d = await r.json();

    if (d.status !== "OK") return setMsg(d.message || "Помилка входу");

    localStorage.setItem("dimobl_token", d.token);
    localStorage.setItem("dimobl_role", d.role);
    localStorage.setItem("dimobl_name", d.name);
    localStorage.setItem("dimobl_login", login);
    localStorage.setItem("dimobl_lastLogin", d.lastLogin || "");

    redirectByRole(d.role);
  } catch (e) {
    setMsg("Помилка запиту");
  } finally {
    setLoading(false);
  }
}

function redirectByRole(role){
  if (role === "admin") location.href = "admin.html";
  else if (role === "moderator") location.href = "moderator.html";
  else location.href = "guest.html";
}

/* ТЕМА */
function applyTheme(t){
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem("dimobl_theme", t);
}
function toggleTheme(){
  const cur = localStorage.getItem("dimobl_theme") || "dark";
  applyTheme(cur === "dark" ? "light" : "dark");
}
applyTheme(localStorage.getItem("dimobl_theme") || "dark");
