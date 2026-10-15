# BMI Check

Next.js + Tailwind + Drizzle ORM + PostgreSQL — dev ทั้งหมดใน Docker

## เริ่มใช้งาน

```bash
docker compose up --build
```

- เว็บ: http://localhost:3100 (แก้โค้ดแล้ว hot reload อัตโนมัติ)
- Postgres: `localhost:5434` (user/pass/db = `bmi`)

ตอน container `web` เริ่ม จะรัน `drizzle-kit push` เพื่อสร้าง/อัปเดตตารางจาก `src/db/schema.ts` ให้อัตโนมัติ

## คำแนะนำจาก AI (Google Gemini)

ใส่ API key ในไฟล์ `.env` แล้วรีสตาร์ต:

```
GEMINI_API_KEY=ใส่คีย์ของคุณ
# GEMINI_MODEL=gemini-flash-lite-latest   (ไม่บังคับ, ค่าเริ่มต้น)
```

```bash
docker compose restart web
```

หลังคำนวณ BMI กดปุ่ม "ขอคำแนะนำจาก AI" ระบบจะส่งข้อมูลเป็น JSON ไปที่ Gemini และขอคำตอบกลับเป็น JSON ตาม schema ใน `src/lib/advice.ts`

## คำสั่งที่ใช้บ่อย

```bash
docker compose exec web npm run db:push     # sync schema หลังแก้ src/db/schema.ts
docker compose exec web npm i <package>     # ติดตั้ง package ใน container
docker compose down                         # หยุด (ข้อมูลยังอยู่)
docker compose down -v                      # หยุดและลบข้อมูล DB
```

**แก้ CSS แล้วหน้าเว็บไม่เปลี่ยน?** ล้าง cache ของ Next.js ในคอนเทนเนอร์แล้วรีสตาร์ต:

```bash
docker compose exec web sh -c 'rm -rf .next/*' && docker compose restart web
```

## โครงสร้าง

- `src/db/schema.ts` — ตาราง `bmi_records`
- `src/app/actions.ts` — server action คำนวณ BMI + บันทึกลง DB
- `src/app/bmi-form.tsx` — ฟอร์มและการ์ดผลลัพธ์
- `src/lib/bmi.ts` — สูตร BMI และเกณฑ์ (WHO Asia-Pacific)
- `src/lib/advice.ts` — schema และ prompt ที่ส่งให้ Gemini
- `src/app/advice-actions.ts` — server action เรียก Gemini API
- `src/app/advice-panel.tsx` — ปุ่มขอคำแนะนำและการ์ดแสดงผล
