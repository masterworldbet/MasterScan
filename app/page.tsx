"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ScanResult = {
  username: string;
  userStatus: "UNLOCKED" | "LOCKED";
  winRate: string;
  winRateModified: "NO" | "YES";
  apiServer: string;
  online: boolean;
};

const LIMIT = 3;
const DURATION = 10;

function dayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [scans, setScans] = useState(0);
  const [seconds, setSeconds] = useState(DURATION);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("masterscan_daily");
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      if (data.date === dayKey()) setScans(Number(data.count) || 0);
    } catch {}
  }, []);

  const progress = useMemo(() => ((DURATION - seconds) / DURATION) * 100, [seconds]);

  function saveCount(next: number) {
    setScans(next);
    localStorage.setItem(
      "masterscan_daily",
      JSON.stringify({ date: dayKey(), count: next })
    );
  }

  async function handleScan(e: FormEvent) {
    e.preventDefault();
    const name = username.trim();

    if (!name) {
      setMessage("ENTER USERNAME FIRST");
      return;
    }

    if (scans >= LIMIT) {
      setMessage("DAILY SCAN LIMIT REACHED");
      return;
    }

    setMessage("");
    setResult(null);
    setScanning(true);
    setSeconds(DURATION);

    const nextCount = scans + 1;
    saveCount(nextCount);

    const interval = window.setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    await new Promise((resolve) => setTimeout(resolve, DURATION * 1000));

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "SCAN FAILED");
      setResult(data.result);
    } catch {
      setMessage("SCAN FAILED — PLEASE TRY AGAIN");
    } finally {
      setScanning(false);
    }
  }

  return (
    <main className="shell">
      <div className="watermark" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, row) => (
          <div className="water-row" key={row}>
            {Array.from({ length: 3 }).map((_, col) => (
              <span key={col}>Masterclass Scan</span>
            ))}
          </div>
        ))}
      </div>

      <section className="panel">
        <header className="topbar">
          <div>
            <div className="brand"><span>&gt;</span> MASTERSCAN<span className="cursor">_</span></div>
            <div className="subtitle">WEB STATUS &amp; SYSTEM ANALYZER</div>
          </div>
          <div className="online"><i /> SYSTEM ONLINE</div>
        </header>

        <div className="divider" />

        <form onSubmit={handleScan}>
          <label htmlFor="username">ENTER USERNAME</label>
          <div className="input-wrap">
            <span>&gt;</span>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="off"
              disabled={scanning}
            />
          </div>

          <button className="scan-button" disabled={scanning || scans >= LIMIT}>
            {scanning ? "SCANNING..." : "SCAN SYSTEM"}
          </button>
        </form>

        <div className="quota">
          <span>DAILY SCANS</span>
          <strong>{scans} / {LIMIT}</strong>
        </div>

        {(scanning || result || message) && <div className="divider" />}

        {scanning && (
          <section className="scan-state">
            <div className="scan-title">SCANNING USER: <b>{username.trim()}</b></div>
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <div className="scan-meta">
              <span>ANALYZING SYSTEM...</span>
              <strong>{String(seconds).padStart(2, "0")}s</strong>
            </div>
            <div className="log">
              <div>&gt; checking user status...</div>
              <div>&gt; checking win rate...</div>
              <div>&gt; checking api server...</div>
            </div>
          </section>
        )}

        {!scanning && message && (
          <div className="alert">[!] {message}</div>
        )}

        {!scanning && result && (
          <section className="result">
            <div className="result-head">
              <span>SCAN COMPLETE</span>
              <b>✓</b>
            </div>

            <div className="result-grid">
              <ResultItem label="USER STATUS" value={result.userStatus} status={result.userStatus === "UNLOCKED" ? "ok" : "bad"} />
              <ResultItem label="CURRENT WIN RATE" value={result.winRate} />
              <ResultItem label="WIN RATE MODIFIED" value={result.winRateModified} status={result.winRateModified === "NO" ? "ok" : "bad"} />
              <ResultItem label="API SERVER" value={result.apiServer} />
            </div>
          </section>
        )}

        <footer>
          <span>MASTERSCAN v1.0</span>
          <span>SECURE TERMINAL</span>
        </footer>
      </section>
    </main>
  );
}

function ResultItem({
  label,
  value,
  status
}: {
  label: string;
  value: string;
  status?: "ok" | "bad";
}) {
  return (
    <div className="result-item">
      <span>{label}</span>
      <strong className={status ? `status-${status}` : ""}>
        {status && <i />} {value}
      </strong>
    </div>
  );
}
