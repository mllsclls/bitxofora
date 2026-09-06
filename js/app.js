import { supabase } from "./supabaseClient.js";

let perfilActual = null;
let sessioActual = null;
let esdevenimentsCache = [];

const ETIQUETES_TIPUS = {
  inici_dissociacio: "Inici dissociació",
  final_dissociacio: "Final dissociació",
  presa_medicacio: "Presa medicació",
  altres: "Altres"
};

// ---------- Arrencada ----------
init();

async function init() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
    return;
  }
  sessioActual = data.session;

  const { data: perfil, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", sessioActual.user.id)
    .single();

  if (error || !perfil) {
    console.error(error);
    alert("No s'ha pogut carregar el teu perfil.");
    return;
  }
  perfilActual = perfil;

  configurarNavegacioPerRol();
  configurarEsdeveniments();

  // Vista inicial segons rol
  if (perfilActual.rol === "familiar") {
    canviarVista("estadistiques");
  } else {
    canviarVista("nou");
  }
}

// ---------- Navegació ----------
function configurarNavegacioPerRol() {
  document.getElementById("etiqueta-rol").textContent = etiquetaRol(perfilActual.rol);
  document.getElementById("etiqueta-rol").classList.remove("amagat");

  const nomsBotons = { nou: "nav-nou", historial: "nav-historial", estadistiques: "nav-estadistiques", usuaris: "nav-usuaris" };

  const visiblesPerRol = {
    usuari: ["nou", "historial", "estadistiques"],
    familiar: ["estadistiques"],
    superusuari: ["nou", "historial", "estadistiques", "usuaris"]
  };
  const visibles = visiblesPerRol[perfilActual.rol] || [];

  Object.entries(nomsBotons).forEach(([vista, idBoto]) => {
    document.getElementById(idBoto).classList.toggle("amagat", !visibles.includes(vista));
  });

  document.querySelectorAll("nav.menu button[data-vista]").forEach((btn) => {
    btn.addEventListener("click", () => {
      canviarVista(btn.dataset.vista);
      document.getElementById("menu-principal").classList.remove("oberta");
    });
  });

  document.getElementById("btn-hamburguesa").addEventListener("click", () => {
    document.getElementById("menu-principal").classList.toggle("oberta");
  });

  document.getElementById("btn-sortir").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html";
  });
}

function etiquetaRol(rol) {
  return { usuari: "Usuari", familiar: "Familiar", superusuari: "Superusuari" }[rol] || rol;
}

function canviarVista(nom) {
  document.querySelectorAll(".vista").forEach((v) => v.classList.add("amagat"));
  document.getElementById("vista-" + nom).classList.remove("amagat");
  document.querySelectorAll("nav.menu button[data-vista]").forEach((b) => b.classList.toggle("actiu", b.dataset.vista === nom));

  if (nom === "historial") carregarHistorial();
  if (nom === "estadistiques") carregarEstadistiques();
  if (nom === "usuaris") carregarUsuaris();
}

// ---------- Formulari de nou esdeveniment / edició ----------
function configurarEsdeveniments() {
  const selectTipus = document.getElementById("ev-tipus");
  const inputData = document.getElementById("ev-data");
  const form = document.getElementById("form-esdeveniment");

  inputData.value = araComDatetimeLocal();
  actualitzarCampsSegonsTipus();

  selectTipus.addEventListener("change", actualitzarCampsSegonsTipus);

  document.getElementById("btn-cancelar-edicio").addEventListener("click", () => {
    resetFormulari();
  });

  form.addEventListener("submit", desarEsdeveniment);
}

function araComDatetimeLocal() {
  const ara = new Date();
  ara.setMinutes(ara.getMinutes() - ara.getTimezoneOffset());
  return ara.toISOString().slice(0, 16);
}

function actualitzarCampsSegonsTipus() {
  const tipus = document.getElementById("ev-tipus").value;

  document.querySelectorAll(".grup-camps").forEach((g) => g.classList.add("amagat"));
  document.getElementById("ev-observacions").closest(".camp").classList.remove("amagat");

  const etiquetaDetonant = document.getElementById("etiqueta-detonant");
  const etiquetaObs = document.getElementById("etiqueta-observacions");

  if (tipus === "inici_dissociacio") {
    document.querySelector('[data-grup="dissociacio"]').classList.remove("amagat");
    etiquetaDetonant.textContent = "Possible detonant";
    etiquetaObs.textContent = "Observacions";
  } else if (tipus === "final_dissociacio") {
    document.querySelector('[data-grup="dissociacio"]').classList.remove("amagat");
    etiquetaDetonant.textContent = "Possible detonant d'acabament";
    etiquetaObs.textContent = "Observacions";
  } else if (tipus === "presa_medicacio") {
    document.querySelector('[data-grup="medicacio"]').classList.remove("amagat");
    etiquetaObs.textContent = "Observacions";
  } else if (tipus === "altres") {
    document.querySelector('[data-grup="altres"]').classList.remove("amagat");
    etiquetaObs.textContent = "Descripció";
  }
}

async function desarEsdeveniment(e) {
  e.preventDefault();
  const errorEl = document.getElementById("form-error");
  errorEl.classList.add("amagat");

  const id = document.getElementById("ev-id").value;
  const tipus = document.getElementById("ev-tipus").value;
  const dataLocal = document.getElementById("ev-data").value;
  const detonant = document.getElementById("ev-detonant").value.trim() || null;
  const observacionsRaw = document.getElementById("ev-observacions").value.trim() || null;
  const resum = document.getElementById("ev-resum").value.trim() || null;

  const medicaments = Array.from(document.querySelectorAll('input[name="medicament"]:checked')).map((c) => c.value);

  const registre = {
    tipus,
    data_hora: new Date(dataLocal).toISOString(),
    detonant: (tipus === "inici_dissociacio" || tipus === "final_dissociacio") ? detonant : null,
    medicaments: tipus === "presa_medicacio" ? medicaments : null,
    resum: tipus === "altres" ? resum : null,
    descripcio: tipus === "altres" ? observacionsRaw : null,
    observacions: tipus !== "altres" ? observacionsRaw : null
  };

  let resultat;
  if (id) {
    resultat = await supabase.from("esdeveniments").update(registre).eq("id", id);
  } else {
    resultat = await supabase.from("esdeveniments").insert(registre);
  }

  if (resultat.error) {
    errorEl.textContent = "No s'ha pogut desar: " + resultat.error.message;
    errorEl.classList.remove("amagat");
    return;
  }

  resetFormulari();
  canviarVista("historial");
}

function resetFormulari() {
  document.getElementById("form-esdeveniment").reset();
  document.getElementById("ev-id").value = "";
  document.getElementById("ev-data").value = araComDatetimeLocal();
  document.getElementById("titol-form-nou").textContent = "Nou registre";
  document.getElementById("btn-cancelar-edicio").classList.add("amagat");
  actualitzarCampsSegonsTipus();
}

// ---------- Historial ----------
async function carregarHistorial() {
  const cont = document.getElementById("llista-historial");
  cont.textContent = "Carregant…";

  const { data, error } = await supabase
    .from("esdeveniments")
    .select("*")
    .order("data_hora", { ascending: false });

  if (error) {
    cont.textContent = "Error carregant l'historial: " + error.message;
    return;
  }

  esdevenimentsCache = data;

  if (data.length === 0) {
    cont.innerHTML = "<p>Encara no hi ha cap registre.</p>";
    return;
  }

  const potEditar = perfilActual.rol === "usuari" || perfilActual.rol === "superusuari";
  const potEsborrar = perfilActual.rol === "superusuari";

  cont.innerHTML = data.map((ev) => filaHistorial(ev, potEditar, potEsborrar)).join("");

  cont.querySelectorAll("[data-editar]").forEach((btn) => {
    btn.addEventListener("click", () => carregarEdicio(btn.dataset.editar));
  });
  cont.querySelectorAll("[data-esborrar]").forEach((btn) => {
    btn.addEventListener("click", () => esborrarEsdeveniment(btn.dataset.esborrar));
  });
}

function filaHistorial(ev, potEditar, potEsborrar) {
  const data = new Date(ev.data_hora).toLocaleString("ca-ES", { dateStyle: "medium", timeStyle: "short" });
  let detall = "";
  if (ev.tipus === "presa_medicacio") {
    detall = (ev.medicaments || []).join(", ");
  } else if (ev.tipus === "altres") {
    detall = ev.resum || "";
  } else {
    detall = ev.detonant ? "Detonant: " + ev.detonant : "";
  }
  const obs = ev.observacions || ev.descripcio || "";

  return `
    <div class="esdeveniment">
      <div class="capcalera-ev">
        <div>
          <span class="etiqueta ${ev.tipus}">${ETIQUETES_TIPUS[ev.tipus]}</span>
          <span class="data">${data}</span>
        </div>
        <div class="accions">
          ${potEditar ? `<button data-editar="${ev.id}">Editar</button>` : ""}
          ${potEsborrar ? `<button data-esborrar="${ev.id}">Esborrar</button>` : ""}
        </div>
      </div>
      ${detall ? `<div>${escapar(detall)}</div>` : ""}
      ${obs ? `<div style="color:var(--text-suau); font-size:0.9rem;">${escapar(obs)}</div>` : ""}
    </div>`;
}

function carregarEdicio(id) {
  const ev = esdevenimentsCache.find((e) => e.id === id);
  if (!ev) return;

  canviarVista("nou");

  document.getElementById("ev-id").value = ev.id;
  document.getElementById("ev-tipus").value = ev.tipus;
  const dataLocal = new Date(ev.data_hora);
  dataLocal.setMinutes(dataLocal.getMinutes() - dataLocal.getTimezoneOffset());
  document.getElementById("ev-data").value = dataLocal.toISOString().slice(0, 16);
  document.getElementById("ev-detonant").value = ev.detonant || "";
  document.getElementById("ev-resum").value = ev.resum || "";
  document.getElementById("ev-observacions").value = ev.observacions || ev.descripcio || "";

  document.querySelectorAll('input[name="medicament"]').forEach((c) => {
    c.checked = (ev.medicaments || []).includes(c.value);
  });

  actualitzarCampsSegonsTipus();
  document.getElementById("titol-form-nou").textContent = "Editar registre";
  document.getElementById("btn-cancelar-edicio").classList.remove("amagat");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function esborrarEsdeveniment(id) {
  if (!confirm("Segur que vols esborrar aquest registre? Aquesta acció no es pot desfer.")) return;
  const { error } = await supabase.from("esdeveniments").delete().eq("id", id);
  if (error) {
    alert("No s'ha pogut esborrar: " + error.message);
    return;
  }
  carregarHistorial();
}

function escapar(text) {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

// ---------- Estadístiques ----------
async function carregarEstadistiques() {
  const cont = document.getElementById("contingut-estadistiques");
  cont.textContent = "Carregant…";

  const { data, error } = await supabase
    .from("esdeveniments")
    .select("*")
    .order("data_hora", { ascending: true });

  if (error) {
    cont.textContent = "Error carregant les estadístiques: " + error.message;
    return;
  }

  if (data.length === 0) {
    cont.innerHTML = "<p>Encara no hi ha dades per calcular estadístiques.</p>";
    return;
  }

  const inicis = data.filter((e) => e.tipus === "inici_dissociacio");
  const finals = data.filter((e) => e.tipus === "final_dissociacio");
  const preses = data.filter((e) => e.tipus === "presa_medicacio");

  const ara = new Date();
  const fa7dies = new Date(ara.getTime() - 7 * 86400000);
  const fa30dies = new Date(ara.getTime() - 30 * 86400000);

  const episodisUltims7 = inicis.filter((e) => new Date(e.data_hora) >= fa7dies).length;
  const episodisUltims30 = inicis.filter((e) => new Date(e.data_hora) >= fa30dies).length;

  // Aparellar cada inici amb el següent final posterior per calcular durades
  const durades = [];
  const finalsOrdenats = [...finals].sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
  inicis.forEach((ini) => {
    const finalCorresponent = finalsOrdenats.find(
      (f) => new Date(f.data_hora) > new Date(ini.data_hora)
    );
    if (finalCorresponent) {
      const minuts = (new Date(finalCorresponent.data_hora) - new Date(ini.data_hora)) / 60000;
      if (minuts > 0) durades.push(minuts);
    }
  });
  const duradaMitjana = durades.length ? Math.round(durades.reduce((a, b) => a + b, 0) / durades.length) : null;

  // Detonants més freqüents
  const comptaDetonants = {};
  [...inicis, ...finals].forEach((e) => {
    if (e.detonant) comptaDetonants[e.detonant] = (comptaDetonants[e.detonant] || 0) + 1;
  });
  const topDetonants = Object.entries(comptaDetonants).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Medicació
  const comptaMedicaments = {};
  preses.forEach((e) => (e.medicaments || []).forEach((m) => (comptaMedicaments[m] = (comptaMedicaments[m] || 0) + 1)));

  cont.innerHTML = `
    <div class="graella-estad">
      <div class="stat"><div class="valor">${inicis.length}</div><div class="etq">Episodis totals</div></div>
      <div class="stat"><div class="valor">${episodisUltims7}</div><div class="etq">Últims 7 dies</div></div>
      <div class="stat"><div class="valor">${episodisUltims30}</div><div class="etq">Últims 30 dies</div></div>
      <div class="stat"><div class="valor">${duradaMitjana !== null ? formatDuracio(duradaMitjana) : "—"}</div><div class="etq">Durada mitjana</div></div>
      <div class="stat"><div class="valor">${preses.length}</div><div class="etq">Preses de medicació</div></div>
    </div>

    <h3>Detonants més freqüents</h3>
    ${topDetonants.length ? `<ul>${topDetonants.map(([d, n]) => `<li>${escapar(d)} — ${n} ${n === 1 ? "vegada" : "vegades"}</li>`).join("")}</ul>` : "<p>Encara no hi ha prou dades.</p>"}

    <h3>Medicació presa (recompte)</h3>
    ${Object.keys(comptaMedicaments).length ? `<ul>${Object.entries(comptaMedicaments).map(([m, n]) => `<li>${escapar(m)} — ${n}</li>`).join("")}</ul>` : "<p>Encara no hi ha registres de medicació.</p>"}
  `;
}

function formatDuracio(minuts) {
  if (minuts < 60) return minuts + " min";
  const h = Math.floor(minuts / 60);
  const m = Math.round(minuts % 60);
  return `${h} h ${m} min`;
}

// ---------- Usuaris (superusuari) ----------
async function carregarUsuaris() {
  const cont = document.getElementById("taula-usuaris");
  cont.textContent = "Carregant…";

  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });

  if (error) {
    cont.textContent = "Error carregant els usuaris: " + error.message;
    return;
  }

  cont.innerHTML = `
    <table class="usuaris">
      <thead><tr><th>Nom</th><th>Rol</th><th>Des de</th></tr></thead>
      <tbody>
        ${data.map((u) => `
          <tr>
            <td>${escapar(u.nom)}${u.id === perfilActual.id ? " (tu)" : ""}</td>
            <td>
              <select data-canvi-rol="${u.id}" ${u.id === perfilActual.id ? "disabled" : ""}>
                <option value="usuari" ${u.rol === "usuari" ? "selected" : ""}>Usuari</option>
                <option value="familiar" ${u.rol === "familiar" ? "selected" : ""}>Familiar</option>
                <option value="superusuari" ${u.rol === "superusuari" ? "selected" : ""}>Superusuari</option>
              </select>
            </td>
            <td>${new Date(u.created_at).toLocaleDateString("ca-ES")}</td>
          </tr>`).join("")}
      </tbody>
    </table>`;

  cont.querySelectorAll("[data-canvi-rol]").forEach((sel) => {
    sel.addEventListener("change", async () => {
      const { error } = await supabase.from("profiles").update({ rol: sel.value }).eq("id", sel.dataset.canviRol);
      if (error) alert("No s'ha pogut canviar el rol: " + error.message);
    });
  });
}
