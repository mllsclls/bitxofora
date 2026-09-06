// Configuració de connexió amb Supabase.
// La clau "publishable" NOMÉS permet allò que les polítiques RLS de la base de dades autoritzen:
// no dona accés total a la base de dades, així que és segura d'incloure al codi client.
const SUPABASE_URL = "https://dwcaeupgnwqugmjzkjls.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_59S7jFD_65lajFCuVpuYnA_23hAAVOZ";

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
