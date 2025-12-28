/* ====== AUTH ====== */
const API_URL = window.API_URL;

const REQUIRED_ROLE = "admin";

function logout(){
  localStorage.clear();
  location.href = "index.html";
}

/* ====== STATE ====== */
let editMode = false;

// дані з БД (оригінал) і робоча копія
let catsOriginal = [];
let catsDraft = [];

/* ====== HELPERS ====== */
function setEditStatus(text){
  document.getElementById("editStatus").textContent = text || "";
}

function normalizeRole(r){
  return String(r || "").toLowerCase().trim();
}

// робимо “код” для переходу (можеш потім підв’язати до сторінок)
function makeCodeFromName(name){
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_\u0400-\u04FF]/g, "");
}

function cloneCats(arr){
  return arr.map(x => ({...x}));
}

/* ====== LOAD FROM DB ====== */
async function loadCatsFromDB(){
  const token = localStorage.getItem("dimobl_token");
  if (!token) return logout();

  const r = await fetch(`${API_URL}?action=categories&token=${encodeURIComponent(token)}`);
  const d = await r.json();

  if (d.status !== "OK") throw new Error(d.message || "Помилка categories");

  // d.categories: [{id, name, icon, active}]
  // зберігаємо порядок як прийшов (це і є порядок з аркуша)
  const arr = (d.categories || [])
    .filter(c => Number(c.active) === 1) // показуємо тільки активні
    .map(c => ({
      dbId: c.id,                 // ID_Категорії (число)
      name: String(c.name || ""),
      icon: String(c.icon || ""),
      code: makeCodeFromName(c.name) // для go()
    }));

  catsOriginal = cloneCats(arr);
  catsDraft = cloneCats(arr);
}

/* ====== RENDER ====== */
function renderCats(){
  const grid = document.getElementById("catGrid");
  grid.innerHTML = "";

  const list = editMode ? catsDraft : catsOriginal;

  list.forEach((c, idx) => {
    const row = document.createElement("div");
    row.className = "catRow";

    const btn = document.createElement("button");
    btn.style.flex = "1";
    btn.textContent = `${c.icon ? (c.icon + " ") : ""}${c.name}`;
    btn.onclick = () => {
      if (editMode) return;
      go(c.code);
    };
    row.appendChild(btn);

    if (editMode){
      const up = document.createElement("button");
      up.className = "ctrl";
      up.textContent = "⬆";
      up.onclick = () => moveCat(idx, -1);

      const down = document.createElement("button");
      down.className = "ctrl";
      down.textContent = "⬇";
      down.onclick = () => moveCat(idx, +1);

      const del = document.createElement("button");
      del.className = "ctrl";
      del.textContent = "🗑";
      del.onclick = () => deleteCat(idx);

      row.appendChild(up);
      row.appendChild(down);
      row.appendChild(del);
    }

    grid.appendChild(row);
  });
}

/* ====== EDIT MODE UI ====== */
function syncEditUI(){
  document.getElementById("editBox").style.display = editMode ? "block" : "none";
  document.getElementById("btnEdit").style.display = editMode ? "none" : "inline-block";
  document.getElementById("btnCancel").style.display = editMode ? "inline-block" : "none";
  document.getElementById("btnSave").style.display = editMode ? "inline-block" : "none";
  setEditStatus(editMode ? "Редагується..." : "");
}

function toggleEdit(){
  editMode = !editMode;

  // коли входимо в редагування — працюємо з копією
  if (editMode){
    catsDraft = cloneCats(catsOriginal);
  }

  syncEditUI();
  renderCats();
}

function cancelEdit(){
  // відкат
  catsDraft = cloneCats(catsOriginal);
  editMode = false;
  syncEditUI();
  renderCats();
}

/* ====== EDIT ACTIONS ====== */
function addCategory(){
  const nameInp = document.getElementById("newCatName");
  const iconInp = document.getElementById("newCatIcon");

  const name = (nameInp.value || "").trim();
  const icon = (iconInp.value || "").trim();

  if (!name) return alert("Введіть назву категорії");

  // унікальність за назвою
  if (catsDraft.some(x => x.name.toLowerCase() === name.toLowerCase())){
    return alert("Така категорія вже є");
  }

  catsDraft.push({
    dbId: Date.now(), // тимчасово, при збереженні перезапишемо ID послідовно
    name,
    icon,
    code: makeCodeFromName(name)
  });

  nameInp.value = "";
  iconInp.value = "";
  renderCats();
}

function deleteCat(idx){
  catsDraft.splice(idx, 1);
  renderCats();
}

function moveCat(idx, dir){
  const n = idx + dir;
  if (n < 0 || n >= catsDraft.length) return;

  const tmp = catsDraft[idx];
  catsDraft[idx] = catsDraft[n];
  catsDraft[n] = tmp;

  renderCats();
}

/* ====== SAVE TO DB ====== */
async function saveEdit(){
  const token = localStorage.getItem("dimobl_token");
  if (!token) return logout();

  // формуємо payload у форматі Apps Script:
  // categories: [{id, name, icon, active}]
  // ВАЖЛИВО: порядок в масиві = порядок у таблиці
  const payload = {
    categories: catsDraft.map((c, i) => ({
      id: i + 1,            // зробимо 1..N (простий стабільний порядок)
      name: c.name,
      icon: c.icon,
      active: 1
    }))
  };

  try{
const params = new URLSearchParams({
  action: "categories_save",
  token: token,
  data: JSON.stringify(payload)   // payload = { categories: [...] }
});

const url = `${API_URL}?${params.toString()}`;
const d = await (await fetch(url)).json();


    if (d.status !== "OK") return alert(d.message || "Не збережено");

    // після успіху — приймаємо як новий оригінал
    catsOriginal = cloneCats(catsDraft);
    editMode = false;
    syncEditUI();
    renderCats();

    alert("Збережено ✅");
  }catch(e){
    alert("Помилка збереження");
  }
}

/* ====== NAV ====== */
function go(section){
  alert("Перехід у розділ: " + section);
  // пізніше: location.href = section + ".html";
}

/* ====== THEME ====== */
function applyTheme(t){
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem("dimobl_theme", t);
}
function toggleTheme(){
  const cur = localStorage.getItem("dimobl_theme") || "dark";
  applyTheme(cur === "dark" ? "light" : "dark");
}
applyTheme(localStorage.getItem("dimobl_theme") || "dark");

/* ====== INIT ====== */
(async function init(){
  // 1) checkAccess
  const token = localStorage.getItem("dimobl_token");
  if (!token) return logout();

  try{
    const r = await fetch(`${API_URL}?action=check&token=${encodeURIComponent(token)}`);
    const d = await r.json();
    if (d.status !== "OK") return logout();

    const role = normalizeRole(d.role);
    if (role !== REQUIRED_ROLE) return logout();

    document.getElementById("user").textContent = `${d.name} (${role})`;

    // 2) load cats from DB
    await loadCatsFromDB();

    // 3) render
    syncEditUI();
    renderCats();
  }catch{
    logout();
  }
})();
