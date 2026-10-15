import { Suspense } from "react";
import { connection } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { bmiRecords } from "@/db/schema";
import { LEVEL_TONE, bmiLevel } from "@/lib/bmi";
import { BmiForm } from "./bmi-form";

export default function Home() {
  return (
    <div className="flex-1 bg-gradient-to-b from-red-50 via-white to-white dark:from-red-950/30 dark:via-zinc-950 dark:to-zinc-950">
      <header className="animate-fade-up mx-auto flex w-full max-w-4xl items-center gap-2 px-4 pt-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-rose-500 font-bold text-white shadow-md shadow-red-600/30">
          B
        </div>
        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">BMI Check</span>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <section className="mb-8 animate-fade-up [animation-delay:80ms]">
          <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
            ดัชนีมวลกาย
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            เช็ค <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">BMI</span> ของคุณ
          </h1>
          <p className="mt-2 text-zinc-500">กรอก 4 ช่อง แล้วรู้ผลทันที</p>
        </section>

        <div className="animate-fade-up [animation-delay:160ms] rounded-3xl border border-zinc-200/80 bg-white/80 p-5 shadow-xl shadow-red-900/5 backdrop-blur sm:p-8 dark:border-zinc-800 dark:bg-zinc-950/80">
          <BmiForm />
        </div>

        <section className="mt-12 animate-fade-up [animation-delay:240ms]">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">ประวัติล่าสุด</h2>
          <Suspense fallback={<p className="text-sm text-zinc-500">กำลังโหลด...</p>}>
            <History />
          </Suspense>
        </section>
      </main>
    </div>
  );
}

async function History() {
  await connection();
  const rows = await db.select().from(bmiRecords).orderBy(desc(bmiRecords.createdAt)).limit(10);

  if (rows.length === 0) {
    return <p className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800">ยังไม่มีข้อมูล</p>;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {rows.map((r, i) => {
        const level = bmiLevel(r.bmi);
        const tone = LEVEL_TONE[level.key];
        return (
          <li
            key={r.id}
            style={{ animationDelay: `${i * 50}ms` }}
            className="flex animate-fade-up items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${tone.badge}`}>
              {r.nickname.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{r.nickname}</p>
              <p className="text-xs text-zinc-500">
                {r.age} ปี · {r.weightKg} กก. · {r.heightCm} ซม.
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold tabular-nums ${tone.text}`}>{r.bmi.toFixed(1)}</p>
              <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${tone.badge}`}>{level.short}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
