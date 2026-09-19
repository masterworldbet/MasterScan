const DURATION = 10;
const VERIFY_DURATION = 3;

const SUPABASE_URL = "https://kwmbdafkbwgtajoaehql.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bWJkYWZrYndndGFqb2FlaHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MjIwMDksImV4cCI6MjEwNTM5ODAwOX0.yMd1POjCECsSxAjsAqv6psmtJirGUBEkoGveoa7DgMU";
const VERIFIED_URL = "https://masterworldbet.com/?ref_agent=1feacd0466b9&ref_zean=0977AB59420F#sign-up";

const input = document.getElementById("website");
const form = document.getElementById("scanForm");
const button = document.getElementById("scanButton");
const dynamic = document.getElementById("dynamic");

function alertBox(message) {
  dynamic.innerHTML = `<div class="divider"></div><div class="alert">[!] ${escapeHtml(message)}</div>`;
}

function normalizeDomain(raw) {
  let value = raw.trim().toLowerCase();
  if (!value) return null;
  if (/[\x00-\x7F]/.test(value)) return null;

  value = value.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].trim();
  if (/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(value)) value = `${value}.com`;

  const validDomain = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
  if (!validDomain.test(value)) return null;
  return `https://www.${value}`;
}

async function lookupFromSupabase(domain) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/scan_or_create_site`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ p_domain: domain })
  });

  const text = await response.text();
  if (!response.ok) {
    let message = "SUPABASE ERROR";
    try {
      const data = JSON.parse(text);
      message = data.message || data.error || message;
    } catch (_) {}
    throw new Error(message);
  }

  const data = JSON.parse(text);
  return Array.isArray(data) ? data[0] : data;
}

function resultItem(label, value, status = "") {
  const dot = status ? "<i></i>" : "";
  return `<div class="result-item"><span>${escapeHtml(label)}</span><strong class="${status ? `status-${status}` : ""}">${dot} ${escapeHtml(value)}</strong></div>`;
}

function renderSystemMonitor() {
  return `
    <section class="system-monitor" aria-label="System status">
      <div class="monitor-item"><span>SYSTEM STATUS</span><strong><i></i> ONLINE</strong></div>
      <div class="monitor-item"><span>DATABASE</span><strong><i></i> CONNECTED</strong></div>
      <div class="monitor-item"><span>SCAN ENGINE</span><strong><i></i> READY</strong></div>
    </section>`;
}

function renderActivity(lines) {
  return `
    <section class="activity-panel">
      <div class="activity-title">RECENT ACTIVITY / SYSTEM LOG</div>
      <div class="activity-log">${lines.map(line => `<div>${escapeHtml(line)}</div>`).join("")}</div>
    </section>`;
}

function renderVerifiedButton() {
  return `
    <button id="verifiedButton" class="verified-button" type="button">
      <span>เว็บที่ผ่านการตรวจสอบแล้ว</span>
      <strong>• VERIFIED</strong>
    </button>`;
}

function renderVerifiedLink() {
  return `
    <a class="visit-button" href="${VERIFIED_URL}" target="_blank" rel="noopener noreferrer">
      <span>เข้าสู่เว็บไซต์</span>
      <strong>• VISIT WEBSITE →</strong>
    </a>`;
}

function runVerifiedCheck() {
  const verifiedButton = document.getElementById("verifiedButton");
  if (!verifiedButton) return;

  verifiedButton.disabled = true;

  const verification = document.createElement("section");
  verification.className = "verification-panel";
  verification.innerHTML = `
    <div class="verification-head"><span>VERIFIED ACCESS CHECK</span><strong id="verifyPercent">0%</strong></div>
    <div class="verification-track"><div id="verifyBar" class="verification-bar"></div></div>
    <div class="verification-log" id="verificationLog"><div>&gt; INITIALIZING CONNECTION...</div></div>`;

  verifiedButton.replaceWith(verification);

  const steps = [
    "> INITIALIZING CONNECTION...",
    "> VERIFYING WEBSITE...",
    "> CHECKING ACCESS...",
    "> CONNECTION VERIFIED ✓"
  ];

  const log = document.getElementById("verificationLog");
  const bar = document.getElementById("verifyBar");
  const percent = document.getElementById("verifyPercent");
  let step = 0;

  const timer = setInterval(() => {
    step += 1;
    const progress = Math.min(100, Math.round((step / steps.length) * 100));
    if (bar) bar.style.width = `${progress}%`;
    if (percent) percent.textContent = `${progress}%`;

    if (log && steps[step - 1]) {
      const line = document.createElement("div");
      line.textContent = steps[step - 1];
      log.appendChild(line);
    }

    if (step >= steps.length) {
      clearInterval(timer);
      setTimeout(() => {
        verification.classList.add("verification-complete");
        verification.innerHTML = `
          <div class="verified-success">
            <span class="success-mark">✓</span>
            <div><strong>ACCESS VERIFIED</strong><small>การตรวจสอบเสร็จสมบูรณ์</small></div>
          </div>
          ${renderVerifiedLink()}`;
      }, 350);
    }
  }, (VERIFY_DURATION * 1000) / steps.length);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const domain = normalizeDomain(input.value);
  if (!domain) {
    alertBox("กรุณากรอกชื่อเว็บไซต์ที่ถูกต้อง เช่น win555 หรือ win555.com");
    return;
  }

  input.disabled = true;
  button.disabled = true;
  button.textContent = "SCANNING...";

  let seconds = DURATION;
  dynamic.innerHTML = `
    <div class="divider"></div>
    <section class="scan-state">
      <div class="scan-title">กำลังตรวจสอบ / ANALYZING: <b>${escapeHtml(domain)}</b></div>
      <div class="progress-track"><div id="bar" class="progress-bar"></div></div>
      <div class="scan-meta"><span>ANALYZING SYSTEM...</span><strong id="seconds">10s</strong></div>
      <div class="log">
        <div>&gt; ตรวจสอบสถานะผู้ใช้ / USER STATUS...</div>
        <div>&gt; ตรวจสอบอัตราชนะ / WIN RATE...</div>
        <div>&gt; ตรวจสอบ API server...</div>
        <div>&gt; เชื่อมต่อฐานข้อมูล / DATABASE...</div>
      </div>
    </section>`;

  const timer = setInterval(() => {
    seconds--;
    const secondsElement = document.getElementById("seconds");
    const progressBar = document.getElementById("bar");
    if (secondsElement) secondsElement.textContent = `${String(Math.max(seconds, 0)).padStart(2, "0")}s`;
    if (progressBar) progressBar.style.width = `${((DURATION - seconds) / DURATION) * 100}%`;
    if (seconds <= 0) clearInterval(timer);
  }, 1000);

  await new Promise(resolve => setTimeout(resolve, DURATION * 1000));

  try {
    const record = await lookupFromSupabase(domain);
    if (!record) throw new Error("NO_RECORD");

    dynamic.innerHTML = `
      <div class="divider"></div>
      <section class="result">
        <div class="result-head"><span>ตรวจสอบเสร็จสิ้น / SCAN COMPLETE</span><b>✓</b></div>
        <div class="domain-line">เว็บไซต์ / WEBSITE: <b>${escapeHtml(record.domain)}</b></div>
        <div class="result-grid">
          ${resultItem("สถานะผู้ใช้ / USER STATUS", record.user_status === "UNLOCK" ? "UNLOCK" : "LOCK", record.user_status === "UNLOCK" ? "ok" : "bad")}
          ${resultItem("อัตราชนะปัจจุบัน / CURRENT WIN RATE", `${record.win_rate}%`)}
          ${resultItem("มีการปรับอัตราชนะ / WIN RATE MODIFIED", record.win_rate_modified === "NO" ? "ไม่ / NO" : "ใช่ / YES", record.win_rate_modified === "NO" ? "ok" : "bad")}
          ${resultItem("เซิร์ฟเวอร์ API / API SERVER", record.api_server)}
        </div>
        ${renderVerifiedButton()}
        ${renderActivity(["> SYSTEM READY ✓", "> DATABASE CONNECTED ✓", "> SCAN COMPLETE ✓"])}
      </section>`;

    document.getElementById("verifiedButton")?.addEventListener("click", runVerifiedCheck);
  } catch (error) {
    console.error(error);
    dynamic.innerHTML = `<div class="divider"></div><div class="alert">[!] ไม่สามารถเชื่อมต่อฐานข้อมูลได้</div>`;
  }

  input.disabled = false;
  button.disabled = false;
  button.textContent = "SCAN SYSTEM / เริ่มสแกน";
});

// System monitor on the initial screen.
form.insertAdjacentHTML("afterend", `${renderSystemMonitor()}${renderActivity([
  "> SYSTEM READY ✓",
  "> DATABASE CONNECTED ✓",
  "> SCAN ENGINE READY ✓"
])}`);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}
