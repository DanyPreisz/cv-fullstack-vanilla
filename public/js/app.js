import { api, setSession, clearSession, getToken } from "./api.js";
const authView = document.querySelector("#auth-view");
const appView = document.querySelector("#app-view");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSubmit = document.querySelector("#auth-submit");
const listEl = document.querySelector("#list");
const form = document.querySelector("#cv-form");
const preview = document.querySelector("#preview");
const formError = document.querySelector("#form-error");
let mode = "login";
let current = "";
const showError = (el, message) => { el.hidden = !message; el.textContent = message || ""; };
const value = (id) => document.querySelector(id).value.trim();
function payload() { return { name: value("#name"), role: value("#role"), summary: value("#summary"), skills: value("#skills"), experience: value("#experience") }; }
function fill(cv = {}) {
  current = cv.id || "";
  document.querySelector("#name").value = cv.name || "";
  document.querySelector("#role").value = cv.role || "";
  document.querySelector("#summary").value = cv.summary || "";
  document.querySelector("#skills").value = cv.skills || "";
  document.querySelector("#experience").value = cv.experience || "";
  paint();
}
function paint() {
  const cv = payload();
  preview.textContent = `${cv.name || "Nombre"}\n${cv.role}\n\n${cv.summary}\n\nHabilidades\n${cv.skills}\n\nExperiencia\n${cv.experience}`.trim();
}

function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  authSubmit.textContent = mode === "login" ? "Entrar" : "Crear cuenta";
}
async function refresh() {
  const data = await api("/api/cvs");
  listEl.innerHTML = "";
  data.cvs.forEach((cv) => {
    const li = document.createElement("li");
    li.className = "item";
    const text = document.createElement("span");
    text.textContent = `${cv.name}${cv.role ? ` \u00b7 ${cv.role}` : ""}`;
    const open = document.createElement("button");
    open.type = "button";
    open.className = "ghost";
    open.textContent = "Abrir";
    open.addEventListener("click", () => fill(cv));
    const del = document.createElement("button");
    del.type = "button";
    del.className = "ghost";
    del.textContent = "Borrar";
    del.addEventListener("click", async () => { await api(`/api/cvs/${cv.id}`, { method: "DELETE" }); if (current === cv.id) fill(); await refresh(); });
    li.append(text, open, del);
    listEl.append(li);
  });
}
async function boot() {
  if (!getToken()) return;
  try {
    const { user } = await api("/api/auth/me");
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    document.querySelector("#user-name").textContent = user.username;
    paint();
    await refresh();
  } catch { clearSession(); }
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
form.addEventListener("input", paint);
document.querySelector("#new-cv").addEventListener("click", () => fill());
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(authError, "");
  const fd = new FormData(authForm);
  try {
    const data = await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }) });
    setSession(data.token);
    authForm.reset();
    await boot();
  } catch (err) { showError(authError, err.message); }
});
document.querySelector("#logout").addEventListener("click", () => { clearSession(); appView.classList.add("hidden"); authView.classList.remove("hidden"); });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(formError, "");
  try {
    const data = await api(current ? `/api/cvs/${current}` : "/api/cvs", { method: current ? "PUT" : "POST", body: JSON.stringify(payload()) });
    current = data.cv.id;
    await refresh();
  } catch (err) { showError(formError, err.message); }
});
boot();
