# Bitxo Fora

Registre d'esdeveniments familiar per detectar patrons al voltant d'episodis de dissociació. Aplicació web estàtica (HTML/CSS/JS) connectada a Supabase (autenticació + base de dades amb Row Level Security).

## Estructura

```
bitxofora/
├── index.html          # Accés (login / registre)
├── app.html             # Aplicació (protegida per sessió)
├── css/style.css
├── js/
│   ├── supabaseClient.js  # Connexió amb Supabase
│   ├── auth.js             # Login / registre
│   └── app.js               # Navegació, formularis, historial, estadístiques, usuaris
└── README.md
```

No hi ha pas de compilació (*build step*): és HTML/CSS/JS pla amb mòduls ES i el client `@supabase/supabase-js` carregat per CDN. Es pot servir des de qualsevol hosting estàtic (Vercel, Netlify, GitHub Pages, etc.) o simplement obrint-ho amb un servidor local (`npx serve .`).

## Com arrenca el sistema (primer ús)

1. Desplega el lloc (o obre'l en local).
2. La primera persona que faci "Registra't" es converteix **automàticament en superusuari** (arrencada del sistema — ho fa un trigger a la base de dades). Les següents persones que es registrin entren amb rol `usuari` per defecte.
3. Un cop dins, el superusuari va a la pestanya **Usuaris** i assigna el rol correcte (Usuari / Familiar / Superusuari) a cada membre de la família.

## Rols

| Rol | Pot fer |
|---|---|
| **Usuari** (persona afectada) | Crear, editar i veure tots els registres. Veure estadístiques. |
| **Familiar** | Només veure estadístiques agregades. |
| **Superusuari** | Tot l'anterior + esborrar registres + gestionar rols d'usuaris. |

## ⚠️ Limitació coneguda (important)

La taula `esdeveniments` a Supabase permet lectura (`SELECT`) a **tots** els rols autenticats (usuari, familiar i superusuari) perquè el càlcul d'estadístiques necessita llegir les dades. La interfície **no mostra** l'historial detallat (observacions, detonants) al rol *familiar* — només agregats —, però tècnicament, si algú amb aquest rol fes una crida directa a l'API de Supabase (no des de la interfície), podria arribar a llegir els camps de text lliure.

Per a la majoria de famílies això és un risc baix (calen coneixements tècnics per saltar-se la interfície), però si vols que sigui impossible del tot, cal moure els camps sensibles (`detonant`, `observacions`) a una taula separada amb polítiques RLS pròpies que excloguin el rol `familiar`. Digue-m'ho si vols que ho implementi — és un canvi acotat.

## Base de dades (ja aplicada a Supabase)

- `profiles`: `id`, `nom`, `rol` (`usuari`/`familiar`/`superusuari`)
- `esdeveniments`: `id`, `tipus`, `data_hora`, `detonant`, `medicaments[]`, `observacions`, `resum`, `descripcio`, `creat_per`, `created_at`, `updated_at`
- RLS activat a totes dues taules. Vegeu les migracions al projecte Supabase `bitxofora` per al detall exacte de les policies.

## Pendent / possibles millores

- Confirmació per correu en registrar-se (actualment depèn de la configuració per defecte de Supabase Auth).
- Exportar estadístiques a PDF/Excel.
- Restricció real a nivell de base de dades dels camps sensibles per al rol familiar (veure limitació més amunt).
