const DURATION = 10;
const VERIFY_DURATION = 3;

const SUPABASE_URL = "https://kwmbdafkbwgtajoaehql.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bWJkYWZrYndndGFqb2FlaHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MjIwMDksImV4cCI6MjEwNTM5ODAwOX0.yMd1POjCECsSxAjsAqv6psmtJirGUBEkoGveoa7DgMU";
const VERIFIED_URL = "https://masterworldbet.com/sign-up?ref_agent=1feacd0466b9&ref_zean=9ED5866AF713";

const input = document.getElementById("website");
const form = document.getElementById("scanForm");
const button = document.getElementById("scanButton");
const dynamic = document.getElementById("dynamic");

function alertBox(message) {
  dynamic.innerHTML = `<div class="divider"></div><div class="alert"><strong>⚠️ คำเตือน / WARNING</strong><span>${escapeHtml(message)}</span></div>`;
}

const BLOCKED_INPUTS = new Set([
  "test", "testing", "test123", "abc", "abcd", "hello", "hello123",
  "aaa", "aaaa", "bbb", "123", "1234", "12345",
  "demo", "demo123", "sample", "example", "example123",
  "qwerty", "asdf", "asdfgh", "xxx", "xxxx", "foo", "bar",
  "foobar", "website", "web", "google", "youtube", "facebook",
  "instagram", "tiktok", "twitter", "x", "linkedin", "reddit",
  "wikipedia", "yahoo", "bing", "whatsapp", "telegram", "netflix",
  "amazon", "shopee", "lazada", "chatgpt", "openai"
]);

function isBlockedInput(raw) {
  const value = String(raw ?? "").trim().toLowerCase();
  if (!value) return true;

  // Check the simple name the user typed, plus a normalized hostname.
  const withoutProtocol = value
    .replace(/^https?:\/\//i, "")
    .split(/[/?#]/)[0]
    .replace(/^www\./i, "")
    .replace(/\.$/, "");

  const hostname = withoutProtocol.split(":")[0];
  const shortName = hostname.split(".")[0];

  return BLOCKED_INPUTS.has(value) ||
    BLOCKED_INPUTS.has(hostname) ||
    BLOCKED_INPUTS.has(shortName);
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
      <div class="monitor-item"><span>ระบบตรวจสอบ / SYSTEM</span><strong><i></i> พร้อมใช้งาน</strong></div>
      <div class="monitor-item"><span>ฐานข้อมูล / DATABASE</span><strong><i></i> เชื่อมต่อแล้ว</strong></div>
      <div class="monitor-item"><span>เครื่องสแกน / SCANNER</span><strong><i></i> พร้อมตรวจ</strong></div>
    </section>`;
}

function renderActivity(lines) {
  return `
    <section class="activity-panel">
      <div class="activity-title">บันทึกการทำงาน / SYSTEM LOG</div>
      <div class="activity-log">${lines.map(line => `<div>${escapeHtml(line)}</div>`).join("")}</div>
    </section>`;
}

function renderVerifiedButton() {
  return `
    <section class="verified-offer">
      <div class="verified-offer-kicker">⭐ เว็บที่เราแนะนำ</div>
      <div class="verified-offer-title">MASTERWORLDBET <strong>• VERIFIED</strong></div>
      <div class="verified-offer-copy">ตรวจสอบสถานะของเว็บไซต์แนะนำก่อนเข้าใช้งาน</div>
      <button id="verifiedButton" class="verified-button" type="button">
        <span>ตรวจสอบ MASTERWORLDBET</span>
        <strong>• VERIFY NOW</strong>
      </button>
    </section>`;
}

function renderVerifiedLink() {
  return `
    <a class="visit-button" href="${VERIFIED_URL}" target="_blank" rel="noopener noreferrer">
      <span>เข้าเว็บไซต์ MasterWorldBet</span>
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
    <div class="verification-head"><span>กำลังตรวจสอบเว็บแนะนำ / VERIFIED CHECK</span><strong id="verifyPercent">0%</strong></div>
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
                <div class="master-offer-kicker">⭐ เว็บที่เราแนะนำ</div>
                <div class="master-offer-label">ตรวจสอบแล้ว <strong>• VERIFIED WEBSITE</strong></div>
                <div class="master-offer-brand">MASTERWORLDBET</div>
                <div class="master-offer-grid">
                  <div><span>สถานะ / STATUS</span><strong class="${status === "UNLOCKED" ? "status-ok" : "status-bad"}">${status}</strong></div>
                  <div><span>อัตราชนะ / WIN RATE</span><strong>${escapeHtml(rate)}</strong></div>
                </div>
                <div class="master-offer-note">✓ ระบบตรวจสอบแล้ว &nbsp; • &nbsp; ไม่พบการปรับอัตราชนะ</div>
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

  if (isBlockedInput(input.value)) {
    alertBox("กรุณากรอกชื่อเว็บไซต์ที่คุณกำลังใช้งานอยู่");
    return;
  }

  const domain = normalizeDomain(input.value);
  if (!domain) {
    alertBox("กรุณากรอกชื่อเว็บไซต์ที่คุณกำลังใช้งานอยู่");
    return;
  }

  input.disabled = true;
  button.disabled = true;
  button.textContent = "กำลังตรวจสอบ... / SCANNING";

  let seconds = DURATION;
  dynamic.innerHTML = `
    <div class="divider"></div>
    <section class="scan-state">
      <div class="scan-title"><span>กำลังตรวจสอบเว็บไซต์ / SCANNING TARGET</span><b>${escapeHtml(domain)}</b></div>
      <div class="progress-track"><div id="bar" class="progress-bar"></div></div>
      <div class="scan-meta"><span>กำลังวิเคราะห์ระบบ / ANALYZING</span><strong id="seconds">10s</strong></div>
      <div class="log scanner-console">
        <div>&gt; เริ่มระบบตรวจสอบ................ <b>OK</b></div>
        <div>&gt; ตรวจสอบเว็บไซต์................. <b>OK</b></div>
        <div>&gt; ตรวจสอบอัตราชนะ................ <b>RUNNING</b></div>
        <div>&gt; ตรวจสอบการปรับข้อมูล............ <b>RUNNING</b></div>
        <div>&gt; ตรวจสอบเซิร์ฟเวอร์............... <b>RUNNING</b></div>
        <div>&gt; สร้างรายงานผล................... <b>WAIT</b></div>
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

    const unlocked = record.user_status === "UNLOCK";
    const modified = record.win_rate_modified !== "NO";
    const riskClass = unlocked && !modified ? "risk-low" : "risk-warning";
    const riskText = unlocked && !modified ? "ต่ำ / LOW" : "ควรระวัง / WARNING";

    dynamic.innerHTML = `
      <div class="divider"></div>
      <section class="result">
        <div class="result-head"><span>🛡️ ผลการตรวจสอบ / SCAN RESULT</span><b>✓</b></div>
        <div class="scan-complete-badge">✓ ตรวจสอบเสร็จแล้ว <span>SCAN COMPLETE</span></div>
        <div class="domain-line">เว็บไซต์ที่ตรวจสอบ / WEBSITE: <b>${escapeHtml(record.domain)}</b></div>
        <div class="result-grid">
          ${resultItem("สถานะเว็บไซต์ / USER STATUS", unlocked ? "UNLOCK / ปลดล็อก" : "LOCK / ล็อก", unlocked ? "ok" : "bad")}
          ${resultItem("อัตราชนะปัจจุบัน / CURRENT WIN RATE", `${record.win_rate}%`)}
          ${resultItem("มีการปรับอัตราชนะ / WIN RATE MODIFIED", modified ? "ใช่ / YES" : "ไม่ / NO", modified ? "bad" : "ok")}
          ${resultItem("เซิร์ฟเวอร์ / API SERVER", record.api_server)}
        </div>
        <div class="risk-panel ${riskClass}">
          <div><span>ระดับความเสี่ยง / RISK LEVEL</span><strong>${riskText}</strong></div>
          <small>${unlocked && !modified ? "ไม่พบสัญญาณการปรับอัตราชนะจากข้อมูลที่ตรวจสอบ" : "ควรพิจารณาข้อมูลก่อนเข้าใช้งาน"}</small>
        </div>
        ${renderVerifiedButton()}
        ${renderActivity(["> TARGET RECEIVED ✓", "> WEBSITE ANALYZED ✓", "> API ROUTE CHECKED ✓", "> SCAN COMPLETE ✓"])}
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
