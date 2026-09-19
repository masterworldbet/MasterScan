const LIMIT = 3;
const DURATION = 10;
const usernameInput = document.getElementById("username");
const scanForm = document.getElementById("scanForm");
const scanButton = document.getElementById("scanButton");
const quota = document.getElementById("quota");
const dynamic = document.getElementById("dynamic");

function todayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function getCount(){
  try{
    const data = JSON.parse(localStorage.getItem("masterscan_daily") || "null");
    return data && data.date === todayKey() ? Number(data.count) || 0 : 0;
  }catch{return 0}
}
function setCount(count){
  localStorage.setItem("masterscan_daily", JSON.stringify({date:todayKey(),count}));
  updateQuota();
}
function updateQuota(){
  const count = getCount();
  quota.textContent = `${count} / ${LIMIT}`;
  scanButton.disabled = count >= LIMIT;
  if(count >= LIMIT) scanButton.textContent = "DAILY LIMIT REACHED";
  else if(!scanButton.disabled) scanButton.textContent = "SCAN SYSTEM";
}
function showAlert(message){
  dynamic.innerHTML = `<div class="divider"></div><div class="alert">[!] ${message}</div>`;
}
function resultItem(label,value,status=""){
  const dot = status === "ok" ? '<i></i>' : status === "bad" ? '<i></i>' : "";
  return `<div class="result-item"><span>${label}</span><strong class="${status ? "status-"+status : ""}">${dot} ${value}</strong></div>`;
}

scanForm.addEventListener("submit", async (event)=>{
  event.preventDefault();
  const username = usernameInput.value.trim();
  const count = getCount();

  if(!username){ showAlert("ENTER USERNAME FIRST"); return; }
  if(count >= LIMIT){ showAlert("DAILY SCAN LIMIT REACHED"); return; }

  setCount(count + 1);
  usernameInput.disabled = true;
  scanButton.disabled = true;

  let seconds = DURATION;
  dynamic.innerHTML = `
    <div class="divider"></div>
    <section class="scan-state">
      <div class="scan-title">SCANNING USER: <b>${escapeHtml(username)}</b></div>
      <div class="progress-track"><div id="progressBar" class="progress-bar"></div></div>
      <div class="scan-meta"><span>ANALYZING SYSTEM...</span><strong id="seconds">10s</strong></div>
      <div class="log">
        <div>&gt; checking user status...</div>
        <div>&gt; checking win rate...</div>
        <div>&gt; checking api server...</div>
      </div>
    </section>`;

  const timer = setInterval(()=>{
    seconds--;
    const sec = document.getElementById("seconds");
    const bar = document.getElementById("progressBar");
    if(sec) sec.textContent = `${String(Math.max(seconds,0)).padStart(2,"0")}s`;
    if(bar) bar.style.width = `${((DURATION-seconds)/DURATION)*100}%`;
    if(seconds <= 0) clearInterval(timer);
  },1000);

  await new Promise(resolve=>setTimeout(resolve,DURATION*1000));

  dynamic.innerHTML = `
    <div class="divider"></div>
    <section class="result">
      <div class="result-head"><span>SCAN COMPLETE</span><b>✓</b></div>
      <div class="result-grid">
        ${resultItem("USER STATUS","UNLOCKED","ok")}
        ${resultItem("CURRENT WIN RATE","64.25%")}
        ${resultItem("WIN RATE MODIFIED","NO","ok")}
        ${resultItem("API SERVER","MASTERCLASS API")}
      </div>
    </section>`;

  usernameInput.disabled = false;
  updateQuota();
});

function escapeHtml(value){
  return value.replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

updateQuota();