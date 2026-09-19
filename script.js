const LIMIT=3,DURATION=10;
const input=document.getElementById("website"),form=document.getElementById("scanForm"),button=document.getElementById("scanButton"),quota=document.getElementById("quota"),dynamic=document.getElementById("dynamic");

function todayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function getCount(){try{const x=JSON.parse(localStorage.getItem("masterscan_daily")||"null");return x&&x.date===todayKey()?Number(x.count)||0:0}catch{return 0}}
function setCount(n){localStorage.setItem("masterscan_daily",JSON.stringify({date:todayKey(),count:n}));updateQuota()}
function updateQuota(){const n=getCount();quota.textContent=`${n} / ${LIMIT}`;button.disabled=n>=LIMIT;button.textContent=n>=LIMIT?"DAILY LIMIT REACHED":"SCAN SYSTEM"}
function alertBox(msg){dynamic.innerHTML=`<div class="divider"></div><div class="alert">[!] ${msg}</div>`}

/* Accept only a domain/name, never Thai text or arbitrary sentences.
   Examples: win555 -> https://www.win555.com
             win555.com -> https://www.win555.com */
function normalizeDomain(raw){
  let value=raw.trim().toLowerCase();
  if(!value)return null;
  if(/[^\x00-\x7F]/.test(value))return null;
  value=value.replace(/^https?:\/\//,"").replace(/^www\./,"").split("/")[0].trim();
  if(!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(value)){
    if(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(value)) value=value+".com";
    else return null;
  }
  return "https://www."+value;
}

function item(label,value,status=""){
  const dot=status?'<i></i>':"";
  return `<div class="result-item"><span>${label}</span><strong class="${status?"status-"+status:""}">${dot} ${escapeHtml(value)}</strong></div>`;
}

async function lookupFromSupabase(url){
  /*
    SUPABASE HOOK:
    Later replace this function with a read from your Supabase table.
    The browser should receive the stored record for this normalized URL.
    Do not invent or randomize a result when the record is missing.
  */
  return null;
}

form.addEventListener("submit",async e=>{
  e.preventDefault();
  const normalized=normalizeDomain(input.value);
  if(!normalized){alertBox("กรุณากรอกชื่อเว็บไซต์ที่ถูกต้อง เช่น win555 หรือ win555.com");return}
  const n=getCount();
  if(n>=LIMIT){alertBox("ครบจำนวนการตรวจสอบ 3 ครั้งต่อวันแล้ว");return}
  setCount(n+1);input.disabled=true;button.disabled=true;

  let seconds=DURATION;
  dynamic.innerHTML=`<div class="divider"></div><section class="scan-state">
    <div class="scan-title">กำลังตรวจสอบ: <b>${escapeHtml(normalized)}</b></div>
    <div class="progress-track"><div id="bar" class="progress-bar"></div></div>
    <div class="scan-meta"><span>ANALYZING SYSTEM...</span><strong id="seconds">10s</strong></div>
    <div class="log"><div>&gt; ตรวจสอบสถานะผู้ใช้...</div><div>&gt; ตรวจสอบอัตราชนะ...</div><div>&gt; ตรวจสอบ API server...</div></div>
  </section>`;

  const timer=setInterval(()=>{
    seconds--;
    const s=document.getElementById("seconds"),bar=document.getElementById("bar");
    if(s)s.textContent=`${String(Math.max(seconds,0)).padStart(2,"0")}s`;
    if(bar)bar.style.width=`${((DURATION-seconds)/DURATION)*100}%`;
    if(seconds<=0)clearInterval(timer);
  },1000);

  await new Promise(r=>setTimeout(r,DURATION*1000));

  const record=await lookupFromSupabase(normalized);
  if(!record){
    dynamic.innerHTML=`<div class="divider"></div><div class="alert">[!] ไม่พบข้อมูลเว็บไซต์นี้ในระบบ</div>`;
  }else{
    dynamic.innerHTML=`<div class="divider"></div><section class="result">
      <div class="result-head"><span>ตรวจสอบเสร็จสิ้น</span><b>✓</b></div>
      <div class="domain-line">เว็บไซต์: <b>${escapeHtml(normalized)}</b></div>
      <div class="result-grid">
        ${item("สถานะผู้ใช้",record.user_status,record.user_status==="UNLOCK"?"ok":"bad")}
        ${item("อัตราชนะปัจจุบัน",record.win_rate)}
        ${item("มีการปรับอัตราชนะ",record.win_rate_modified==="NO"?"ไม่":"ใช่",record.win_rate_modified==="NO"?"ok":"bad")}
        ${item("เซิร์ฟเวอร์ API",record.api_server)}
      </div>
    </section>`;
  }
  input.disabled=false;updateQuota();
});

function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
updateQuota();