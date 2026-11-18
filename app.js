const API = "http://127.0.0.1:5000";
const $ = (id) => document.getElementById(id);
let up = false;
async function ping() {
  try {
    await (await fetch(API + "/ping")).json();
    if (!up) { up = true; plan(); }
    $("helper").textContent = "Helper connected";
    $("helper").className = "ok";
  } catch (e) {
    up = false;
    $("helper").textContent = "Helper not found. Start it, then keep this page open.";
    $("helper").className = "bad";
  }
}
async function plan() {
  try {
    const j = await (await fetch(API + "/license")).json();
    $("plan").textContent = j.pro ? "Pro is active" + (j.email ? " for " + j.email : "") : "You are on the free plan.";
  } catch (e) {}
}
async function go(mode) {
  const url = $("u").value.trim();
  if (!url) { $("st").textContent = "Paste a link first."; return; }
  try {
    const r = await fetch(API + "/download", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url, mode: mode, quality: $("q").value }) });
    const j = await r.json();
    poll(j.id, j.note ? j.note + " " : "");
  } catch (e) { $("st").textContent = "Helper not reachable."; }
}
async function poll(id, note) {
  try {
    const s = await (await fetch(API + "/status/" + id)).json();
    if (s.status === "running") { $("st").textContent = note + "Downloading " + (s.progress || ""); setTimeout(() => poll(id, note), 1500); }
    else if (s.status === "done") $("st").textContent = note + "Done! Saved to your Downloads/MediaDL folder.";
    else $("st").textContent = "Error: " + (s.error || s.status);
  } catch (e) { $("st").textContent = "Lost contact with the helper."; }
}
async function activate() {
  try {
    const r = await fetch(API + "/license", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: $("k").value.trim() }) });
    const j = await r.json();
    $("lst").textContent = j.pro ? "Pro activated." : "That key was not accepted.";
    plan();
  } catch (e) { $("lst").textContent = "Helper not reachable."; }
}
$("v").onclick = () => go("video");
$("a").onclick = () => go("audio");
$("act").onclick = activate;
ping(); setInterval(ping, 5000);
const LINK = /^https?:\/\/\S+$/i;
let lastClip = "";
function offer(text) {
  text = (text || "").trim();
  if (!LINK.test(text) || text === lastClip || text === $("u").value.trim()) return;
  lastClip = text;
  $("clipText").textContent = text.length > 60 ? text.slice(0, 57) + "..." : text;
  $("clip").dataset.url = text;
  $("clip").hidden = false;
}
async function checkClipboard() {
  try { offer(await navigator.clipboard.readText()); } catch (e) {}
}
window.addEventListener("focus", checkClipboard);
document.addEventListener("visibilitychange", () => { if (!document.hidden) checkClipboard(); });
document.addEventListener("paste", (e) => {
  if (document.activeElement && document.activeElement.tagName === "INPUT") return;
  const t = e.clipboardData ? e.clipboardData.getData("text").trim() : "";
  if (LINK.test(t)) { $("u").value = t; $("clip").hidden = true; }
});
$("useClip").onclick = () => { $("u").value = $("clip").dataset.url; $("clip").hidden = true; };
$("pasteBtn").onclick = async () => {
  try {
    const t = (await navigator.clipboard.readText()).trim();
    if (LINK.test(t)) { $("u").value = t; $("clip").hidden = true; }
    else $("st").textContent = "No link found on the clipboard.";
  } catch (e) { $("st").textContent = "Your browser blocked clipboard access. Long-press the box and paste."; }
};
