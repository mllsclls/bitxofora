import { supabase } from "./supabaseClient.js";

const formLogin = document.getElementById("form-login");
const formRegistre = document.getElementById("form-registre");
const avisInfo = document.getElementById("avis-info");

// Si ja hi ha sessió activa, va directe a l'app
supabase.auth.getSession().then(({ data }) => {
  if (data.session) window.location.href = "app.html";
});

// ---- Canvi entre login i registre ----
document.getElementById("btn-anar-registre").addEventListener("click", () => {
  formLogin.classList.add("amagat");
  formRegistre.classList.remove("amagat");
  document.getElementById("text-canvi-a-registre").classList.add("amagat");
  document.getElementById("text-canvi-a-login").classList.remove("amagat");
});

document.getElementById("btn-anar-login").addEventListener("click", () => {
  formRegistre.classList.add("amagat");
  formLogin.classList.remove("amagat");
  document.getElementById("text-canvi-a-login").classList.add("amagat");
  document.getElementById("text-canvi-a-registre").classList.remove("amagat");
});

// ---- LOGIN ----
formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");
  errorEl.classList.add("amagat");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    errorEl.textContent = "No s'ha pogut entrar: comprova el correu i la contrasenya.";
    errorEl.classList.remove("amagat");
    return;
  }
  window.location.href = "app.html";
});

// ---- REGISTRE ----
formRegistre.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nom = document.getElementById("reg-nom").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const errorEl = document.getElementById("reg-error");
  errorEl.classList.add("amagat");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nom } }
  });

  if (error) {
    errorEl.textContent = "No s'ha pogut crear el compte: " + (error.message || "torna-ho a provar.");
    errorEl.classList.remove("amagat");
    return;
  }

  if (data.session) {
    window.location.href = "app.html";
  } else {
    avisInfo.textContent = "Compte creat. Revisa el correu per confirmar-lo abans d'entrar.";
    avisInfo.classList.remove("amagat");
    formRegistre.reset();
  }
});
