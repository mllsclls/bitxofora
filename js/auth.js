import { supabase } from "./supabaseClient.js";

const formLogin = document.getElementById("form-login");

// Si ja hi ha sessió activa, va directe a l'app
supabase.auth.getSession().then(({ data }) => {
  if (data.session) window.location.href = "app.html";
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
