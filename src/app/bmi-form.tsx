"use client";

import { useActionState, useEffect, useState } from "react";
import { BMI_LEVELS, LEVEL_TONE, bmiLevel } from "@/lib/bmi";
import { submitBmi, type BmiState } from "./actions";
import { AdvicePanel } from "./advice-panel";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base text-zinc-900 outline-none transition duration-200 placeholder:text-zinc-400 hover:border-zinc-300 focus:-translate-y-0.5 focus:border-red-500 focus:bg-white focus:shadow-lg focus:shadow-red-500/10 focus:ring-4 focus:ring-red-500/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-900";

// ช่วง BMI ที่แสดงบนแถบเกจ
const GAUGE_MIN = 15;
const GAUGE_MAX = 35;
const toPct = (v: number) =>
  Math.min(100, Math.max(0, ((v - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 100));

export function BmiForm() {
  const [state, formAction, pending] = useActionState<BmiState, FormData>(submitBmi, {
    status: "idle",
  });
  const values = state.status === "idle" ? undefined : state.values;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <form action={formAction} className="space-y-4">
          <Field label="ชื่อเล่น" hint="เช่น บอส, มิ้นท์" delay={0}>
            <input name="nickname" required maxLength={50} placeholder="ชื่อเล่นของคุณ" defaultValue={values?.nickname} className={inputClass} />
          </Field>
          <Field label="อายุ" hint="ปี" delay={60}>
            <input name="age" type="number" inputMode="numeric" min={1} max={120} required placeholder="25" defaultValue={values?.age} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="น้ำหนัก" hint="กก." delay={120}>
              <input name="weight" type="number" inputMode="decimal" step="0.1" min={1} required placeholder="60" defaultValue={values?.weight} className={inputClass} />
            </Field>
            <Field label="ส่วนสูง" hint="ซม." delay={180}>
              <input name="height" type="number" inputMode="decimal" step="0.1" min={30} required placeholder="170" defaultValue={values?.height} className={inputClass} />
            </Field>
          </div>

          {state.status === "error" && (
            <p
              key={state.at}
              role="alert"
              className="animate-shake rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
            >
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            style={{ animationDelay: "240ms" }}
            className="group relative flex w-full animate-fade-up items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-red-600/25 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-600/30 active:translate-y-0 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
          >
            <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[120%] skew-x-[-20deg] bg-white/25 transition-transform duration-700 group-hover:translate-x-[320%]" />
            {pending && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {pending ? "กำลังคำนวณ..." : "คำนวณ BMI"}
          </button>
        </form>

        {state.status === "ok" ? (
          <Result key={state.at} nickname={state.nickname} bmi={state.bmi} />
        ) : (
          <Placeholder pending={pending} />
        )}
      </div>

      {state.status === "ok" && (
        <AdvicePanel
          key={state.at}
          input={{
            nickname: state.nickname,
            age: Number(state.values.age),
            weightKg: Number(state.values.weight),
            heightCm: Number(state.values.height),
          }}
        />
      )}
    </div>
  );
}

function Placeholder({ pending }: { pending: boolean }) {
  return (
    <div className="flex min-h-72 animate-fade-up flex-col items-center justify-center rounded-2xl border-2 border-dashed border-red-200 bg-red-50/50 p-6 text-center [animation-delay:150ms] dark:border-red-900/60 dark:bg-red-950/20">
      <div
        className={`mb-3 flex size-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600 dark:bg-red-900/40 dark:text-red-400 ${pending ? "animate-ping" : "animate-float"}`}
      >
        ♥
      </div>
      <p className="font-medium text-zinc-700 dark:text-zinc-300">
        {pending ? "กำลังคำนวณ..." : "ผลลัพธ์จะแสดงที่นี่"}
      </p>
      <p className="mt-1 text-sm text-zinc-500">กรอกข้อมูลแล้วกดคำนวณ</p>
    </div>
  );
}

function Result({ nickname, bmi }: { nickname: string; bmi: number }) {
  const level = bmiLevel(bmi);
  const tone = LEVEL_TONE[level.key];
  const shown = useCountUp(bmi);
  const [pct, setPct] = useState(0);

  // เลื่อนหมุดจากซ้ายไปตำแหน่งจริงหลังการ์ดโผล่
  useEffect(() => {
    const t = setTimeout(() => setPct(toPct(bmi)), 150);
    return () => clearTimeout(t);
  }, [bmi]);

  return (
    <div
      aria-live="polite"
      className={`relative flex min-h-72 animate-pop-in flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-xl transition-colors ${tone.card}`}
    >
      {/* เงาแสงวิ่งผ่านการ์ดตอนโผล่ */}
      <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-white/20" />
      <div className="pointer-events-none absolute -right-10 -top-10 size-40 animate-float rounded-full bg-white/10" />

      <div className="relative">
        <p className="animate-fade-up text-sm text-white/85 [animation-delay:100ms]">สวัสดีคุณ {nickname} 👋</p>
        <p className="mt-1 animate-fade-up text-sm text-white/85 [animation-delay:150ms]">ค่า BMI ของคุณคือ</p>
        <p className="mt-1 text-6xl font-bold tabular-nums tracking-tight">{shown.toFixed(1)}</p>
        <span className="mt-3 inline-block animate-pop-in rounded-full bg-white/25 px-3 py-1 text-sm font-semibold backdrop-blur [animation-delay:350ms]">
          {level.label}
        </span>
        <p className="mt-3 animate-fade-up text-sm text-white/90 [animation-delay:450ms]">{level.advice}</p>
      </div>

      <div className="relative mt-6 animate-fade-up rounded-xl bg-white/95 p-3 [animation-delay:300ms] dark:bg-zinc-950/90">
        <div className="relative flex h-2.5 overflow-hidden rounded-full">
          {BMI_LEVELS.map((l, i) => {
            const start = toPct(l.min);
            const end = toPct(BMI_LEVELS[i + 1]?.min ?? GAUGE_MAX);
            return (
              <div
                key={l.key}
                className={`${LEVEL_TONE[l.key].bar} transition-opacity duration-500 ${l.key === level.key ? "opacity-100" : "opacity-35"}`}
                style={{ width: `${end - start}%` }}
              />
            );
          })}
        </div>
        <div
          className={`absolute top-3 size-5 -translate-x-1/2 -translate-y-[5px] rounded-full border-[3px] border-white bg-zinc-900 shadow-md ring-2 transition-[left] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${tone.ring}`}
          style={{ left: `calc(0.75rem + (100% - 1.5rem) * ${pct / 100})` }}
        />
        <div className="relative mt-2 h-4 text-[11px] text-zinc-500">
          {BMI_LEVELS.slice(1).map((l) => (
            <span key={l.key} className="absolute -translate-x-1/2 tabular-nums" style={{ left: `${toPct(l.min)}%` }}>
              {l.min}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// นับตัวเลขขึ้นจาก 0 ถึงค่าจริงแบบนุ่มนวล
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

function Field({
  label,
  hint,
  delay,
  children,
}: {
  label: string;
  hint?: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <label className="block animate-fade-up space-y-1.5" style={{ animationDelay: `${delay}ms` }}>
      <span className="flex items-baseline justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {hint && <span className="text-xs font-normal text-zinc-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
