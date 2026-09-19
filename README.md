# MasterScan V2 — GitHub Pages

ไฟล์ชุดนี้เป็น Static HTML/CSS/JavaScript สำหรับ GitHub Pages โดยตรง

## ใส่ใน Repository

- `index.html`
- `style.css`
- `script.js`

## สิ่งที่ปรับ

- ผลลัพธ์เปลี่ยนเป็นภาษาไทย
- ช่องกรอกตรวจสอบเฉพาะชื่อเว็บ/โดเมน
- `win555` จะ normalize เป็น `https://www.win555.com`
- ปฏิเสธอักขระภาษาไทยและข้อความที่ไม่ใช่โดเมน
- เตรียมฟังก์ชัน `lookupFromSupabase()` สำหรับต่อฐานข้อมูล
- ถ้าไม่มีข้อมูลใน Supabase จะขึ้น `ไม่พบข้อมูลเว็บไซต์นี้ในระบบ`
- ไม่สุ่มหรือสร้างผลลัพธ์สำหรับเว็บที่ไม่มีข้อมูล

## Supabase

เมื่อพร้อม ให้ต่อ `lookupFromSupabase()` กับตารางของคุณ โดยให้ค้นจาก normalized URL และคืนค่า:

```js
{
  user_status: "LOCK" | "UNLOCK",
  win_rate: "xx%",
  win_rate_modified: "YES" | "NO",
  api_server: "..."
}
```

ควรบังคับความถูกต้องและสิทธิ์การอ่านด้วย Supabase RLS.
