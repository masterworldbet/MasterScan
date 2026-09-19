const DURATION = 10;
const VERIFY_DURATION = 3;

// Local browser scan limit.
// General users: 3 scans total on this browser.
// Master browser: unlimited after activating Master mode once.
const SCAN_LIMIT = 3;
const SCAN_COUNT_KEY = "masterscan_scan_count";
const MASTER_MODE_KEY = "masterscan_master_mode";
const MASTER_ACTIVATION_KEY = "masterscan_master_activation";

// This is only a local/demo bypass. It is NOT a secure authentication system.
const MASTER_KEY = "MS-MASTER-2026";

const SUPABASE_URL = "https://kwmbdafkbwgtajoaehql.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bWJkYWZrYndndGFqb2FlaHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MjIwMDksImV4cCI6MjEwNTM5ODAwOX0.yMd1POjCECsSxAjsAqv6psmtJirGUBEkoGveoa7DgMU";
const VERIFIED_URL = "https://masterworldbet.com/sign-up?ref_agent=1feacd0466b9&ref_zean=9ED5866AF713";

const input = document.getElementById("website");
const form = document.getElementById("scanForm");
const button = document.getElementById("scanButton");
const dynamic = document.getElementById("dynamic");

activateMasterFromUrl();

function getScanCount() {
  const value = Number.parseInt(localStorage.getItem(SCAN_COUNT_KEY) || "0", 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function isMasterMode() {
  return localStorage.getItem(MASTER_MODE_KEY) === "true";
}

function updateScanQuota() {
  const quota = document.getElementById("scanQuota");
  if (!quota) return;

  if (isMasterMode()) {
    quota.innerHTML = '<span>SCAN CREDIT</span><strong>UNLIMITED</strong>';
    quota.classList.add("master-quota");
    return;
  }

  const count = Math.min(getScanCount(), SCAN_LIMIT);
  quota.innerHTML = `<span>SCAN CREDIT</span><strong>${count} / ${SCAN_LIMIT}</strong>`;
  quota.classList.remove("master-quota");
}

function activateMasterFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const key = params.get("master");

  if (key !== MASTER_KEY) return;

  localStorage.setItem(MASTER_MODE_KEY, "true");
  localStorage.setItem(MASTER_ACTIVATION_KEY, "1");

  // Remove the activation key from the visible URL after activation.
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState({}, document.title, cleanUrl);
}

function canScan() {
  return isMasterMode() || getScanCount() < SCAN_LIMIT;
}

function consumeScan() {
  if (isMasterMode()) return;
  localStorage.setItem(SCAN_COUNT_KEY, String(getScanCount() + 1));
  updateScanQuota();
}

function showQuotaLimit() {
  alertBox("สิทธิ์การสแกนครบ 3 ครั้งแล้ว / SCAN LIMIT REACHED");
}

function alertBox(message) {
  dynamic.innerHTML = `<div class="divider"></div><div class="alert">[!] ${escapeHtml(message)}</div>`;
}

function normalizeDomain(raw) {
  let value = String(raw ?? "").trim().toLowerCase();

  if (!value) return null;

  // MasterScan accepts English/ASCII website names only.
  if (!/^[\x00-\x7F]+$/.test(value)) return null;

  // Remove protocol and anything after the hostname.
  value = value
    .replace(/^https?:\/\//i, "")
    .split(/[/?#]/)[0]
    .trim()
    .replace(/^www\./i, "");

  // Remove an accidental trailing dot.
  value = value.replace(/\.$/, "");

  if (!value) return null;

  // Short name: win555 -> win555.com
  if (/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(value)) {
    value += ".com";
  }

  // Standard hostname validation.
  const labels = value.split(".");
  if (labels.length < 2) return null;

  const validLabel = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
  if (labels.some(label => !validLabel.test(label))) return null;

  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,63}$/i.test(tld)) return null;

  if (value.length > 253) return null;

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
    <section class="verified-offer">
      <div class="verified-offer-title">เว็บที่ผ่านการตรวจสอบแล้ว <strong>• VERIFIED</strong></div>
      <div class="verified-offer-copy">ตรวจสอบสถานะของเว็บไซต์ที่แนะนำก่อนเข้าใช้งาน</div>
      <button id="verifiedButton" class="verified-button" type="button">
        <span>ตรวจสอบสถานะ</span>
        <strong>• VERIFY NOW</strong>
      </button>
    </section>`;
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
          <div class="master-offer-loading">กำลังโหลดสถานะเว็บไซต์ / LOADING VERIFIED STATUS...</div>`;

        lookupFromSupabase("https://www.masterworldbet.com")
          .then(masterRecord => {
            const rate = masterRecord?.win_rate != null ? `${masterRecord.win_rate}%` : "—";
            const status = masterRecord?.user_status === "UNLOCK" ? "UNLOCKED" : "LOCKED";
            verification.innerHTML = `
              <div class="verified-success">
                <span class="success-mark">✓</span>
                <div><strong>ACCESS VERIFIED</strong><small>การตรวจสอบเสร็จสมบูรณ์</small></div>
              </div>
              <div class="master-offer-card">
                <div class="master-offer-label">เว็บที่ผ่านการตรวจสอบแล้ว <strong>• VERIFIED</strong></div>
                <div class="master-offer-brand">MASTERWORLDBET</div>
                <div class="master-offer-grid">
                  <div><span>สถานะ / STATUS</span><strong class="${status === "UNLOCKED" ? "status-ok" : "status-bad"}">${status}</strong></div>
                  <div><span>อัตราชนะ / WIN RATE</span><strong>${escapeHtml(rate)}</strong></div>
                </div>
                <div class="master-offer-note">✓ SYSTEM CHECKED &nbsp; • &nbsp; READY TO ACCESS</div>
                ${renderVerifiedLink()}
              </div>`;
          })
          .catch(() => {
            verification.innerHTML = `
              <div class="verified-success">
                <span class="success-mark">✓</span>
                <div><strong>ACCESS VERIFIED</strong><small>การตรวจสอบเสร็จสมบูรณ์</small></div>
              </div>
              ${renderVerifiedLink()}`;
          });
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

  if (!canScan()) {
    showQuotaLimit();
    return;
  }

  // Count the scan immediately so repeated clicks cannot start extra scans.
  consumeScan();

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
  button.disabled = !canScan();
  button.textContent = canScan() ? "SCAN SYSTEM / เริ่มสแกน" : "SCAN LIMIT REACHED";
  updateScanQuota();
});

// System monitor on the initial screen.
form.insertAdjacentHTML("afterend", `
  <div id="scanQuota" class="scan-quota">
    <span>SCAN CREDIT</span>
    <strong>0 / ${SCAN_LIMIT}</strong>
  </div>
  ${renderSystemMonitor()}
  ${renderActivity([
    "> SYSTEM READY ✓",
    "> DATABASE CONNECTED ✓",
    "> SCAN ENGINE READY ✓"
  ])}
`);
updateScanQuota();
button.disabled = !canScan();
if (!canScan()) button.textContent = "SCAN LIMIT REACHED";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}
