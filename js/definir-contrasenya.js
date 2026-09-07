import { supabase } from "./supabaseClient.js";

const carregant = document.getElementById("carregant");
const form = document.getElementById("form-contrasenya");
const errorEnllac = document.getElementById("error-enllac");

// El client de Supabase, en carregar la pàgina, llegeix el token que porta
// l'enllaç d'invitació (a la part #... de la URL) i crea la sessió automàticament.
supabase.auth.getSession().then(({ data }) => {
  carregant.classList.add("amagat");
  if (data.session) {
    form.classList.remove("amagat");
  } else {
    errorEnllac.classList.remove("amagat");
  }
});

const REQUISITS = {
  longitud: (p) => p.length >= 8,
  minuscula: (p) => /[a-z]/.test(p),
  majuscula: (p) => /[A-Z]/.test(p),
  numero: (p) => /[0-9]/.test(p),
  simbol: (p) => /[^A-Za-z0-9]/.test(p)
};

document.getElementById("password1").addEventListener("input", (e) => {
  const p = e.target.value;
  Object.entries(REQUISITS).forEach(([clau, comprova]) => {
    document.getElementById("req-" + clau).style.color = comprova(p) ? "var(--verd-suau)" : "var(--text-suau)";
  });
});

function contrasenyaValida(p) {
  return Object.values(REQUISITS).every((comprova) => comprova(p));
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("error-contrasenya");
  errorEl.classList.add("amagat");

  const p1 = document.getElementById("password1").value;
  const p2 = document.getElementById("password2").value;

  if (!contrasenyaValida(p1)) {
    errorEl.textContent = "La contrasenya no compleix tots els requisits de la llista.";
    errorEl.classList.remove("amagat");
    return;
  }
  if (p1 !== p2) {
    errorEl.textContent = "Les dues contrasenyes no coincideixen.";
    errorEl.classList.remove("amagat");
    return;
  }

  const { error } = await supabase.auth.updateUser({ password: p1 });
  if (error) {
    errorEl.textContent = "No s'ha pogut desar la contrasenya: " + error.message;
    errorEl.classList.remove("amagat");
    return;
  }

  window.location.href = "app.html";
});
