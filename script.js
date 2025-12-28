
const API_URL = window.API_URL;

// якщо вже є сесія — пробуємо відразу зайти
(async function autoIn(){
  const token = localStorage.getItem("dimobl_token");
  if (!token) return;
  try{
    const r = await fetch(`${API_URL}?action=check&token=${encodeURIComponent(token)}`);
    const d = await r.json();
    if (d.status === "OK") redirectByRole(d.role);
    else localStorage.clear();
  }catch{ localStorage.clear(); }
})();

document.addEventListener("keydown", (e)=>{
  if (e.key === "Enter") auth();
});

function setMsg(t){ document.getElementById("msg").textContent = t || ""; }

async function auth() {
  setMsg("");
  const login = document.getElementById("login").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!login || !password) return setMsg("Введіть логін і пароль");

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
