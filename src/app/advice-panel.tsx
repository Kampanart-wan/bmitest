"use client";

import { useEffect, useState, useTransition } from "react";
import { targetWeightRange, type Advice, type DayPlan } from "@/lib/advice";
import { getAdvice, type AdviceInput } from "./advice-actions";

const LOADING_STEPS = ["กำลังส่งข้อมูลให้ AI...", "กำลังวิเคราะห์ค่า BMI...", "กำลังจัดโปรแกรมออกกำลังกาย...", "กำลังเลือกเมนูอาหาร 7 วัน..."];

export function AdvicePanel({ input }: { input: AdviceInput }) {
  const [pending, startTransition] = useTransition();
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const request = () => {
    setError(null);
    startTransition(async () => {
      const res = await getAdvice(input);
      if (res.ok) setAdvice(res.advice);
      else setError(res.message);
    });
  };

  if (pending) return <AdviceSkeleton />;
  if (advice) return <AdviceCard advice={advice} input={input} onRetry={request} />;

  return (
    <div className="animate-fade-up space-y-3 [animation-delay:500ms]">
      <button
        type="button"
        onClick={request}
        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-r from-zinc-900 to-zinc-800 px-5 py-4 font-semibold text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.99] dark:border-red-900/50 dark:from-white dark:to-zinc-100 dark:text-zinc-900"
      >
        <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[120%] skew-x-[-20deg] bg-white/15 transition-transform duration-700 group-hover:translate-x-[320%]" />
        <span className="text-lg transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125">✨</span>
        ขอคำแนะนำจาก AI · แผนสุขภาพ 7 วัน
      </button>
      {error && (
        <p role="alert" className="animate-shake rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function AdviceSkeleton() {
  const [step, setStep] = useState(0);
  // เปลี่ยนข้อความทุก 2.5 วินาทีระหว่างรอ
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="animate-fade-up overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-center gap-3">
        <span className="relative flex size-10 items-center justify-center rounded-full bg-red-100 text-lg dark:bg-red-950">
          <span className="absolute inset-0 animate-ping rounded-full bg-red-400/30" />✨
        </span>
        <p key={step} className="animate-fade-up font-medium text-zinc-700 dark:text-zinc-300">{LOADING_STEPS[step]}</p>
      </div>
      <div className="space-y-3">
        {[90, 75, 60].map((w) => (
          <div key={w} className="h-3 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" style={{ width: `${w}%` }} />
        ))}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800/60" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

const INTENSITY_STYLE: Record<string, string> = {
  เบา: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  ปานกลาง: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  หนัก: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  พัก: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

function AdviceCard({ advice, input, onRetry }: { advice: Advice; input: AdviceInput; onRetry: () => void }) {
  const [day, setDay] = useState(0);
  const target = targetWeightRange(input.heightCm);
  const plan = advice.weeklyPlan[day];

  return (
    <article className="animate-pop-in overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-red-900/5 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-red-600 to-rose-500 p-6 text-white">
        <div className="pointer-events-none absolute -right-8 -top-8 size-36 animate-float rounded-full bg-white/10" />
        <p className="text-sm text-white/80">✨ แผนสุขภาพจาก AI</p>
        <h3 className="mt-1 text-2xl font-bold">แผน 7 วันของคุณ {input.nickname}</h3>
        <p className="mt-3 leading-relaxed text-white/95">{advice.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">ตอนนี้ {input.weightKg} กก.</span>
          <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">
            น้ำหนักเกณฑ์ปกติ {target.min}–{target.max} กก.
          </span>
        </div>
      </header>

      <div className="space-y-8 p-6">
        {/* Goal */}
        <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 dark:bg-red-950/30">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">เป้าหมายสัปดาห์นี้</p>
            <p className="mt-0.5 font-medium text-zinc-800 dark:text-zinc-200">{advice.goal}</p>
          </div>
        </div>

        {/* Health tips */}
        <section>
          <SectionTitle>คำแนะนำการดูแลสุขภาพ</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {advice.healthTips.map((t, i) => (
              <div
                key={i}
                style={{ animationDelay: `${150 + i * 70}ms` }}
                className="flex animate-fade-up gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm dark:bg-zinc-900">{t.emoji}</span>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{t.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly plan */}
        <section>
          <SectionTitle>โปรแกรม 7 วัน</SectionTitle>
          <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
            {advice.weeklyPlan.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setDay(i)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition duration-200 ${
                  i === day
                    ? "scale-105 bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-md shadow-red-600/25"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {d.day}
              </button>
            ))}
          </div>

          {plan && <DayDetail key={day} plan={plan} />}
        </section>

        {/* Cautions */}
        {advice.cautions.length > 0 && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
            <p className="mb-2 font-semibold text-amber-800 dark:text-amber-300">⚠️ ข้อควรระวัง</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900 dark:text-amber-200">
              {advice.cautions.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </section>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 text-xs text-zinc-500 dark:border-zinc-800">
          <p>คำแนะนำจาก AI ใช้เป็นแนวทางเท่านั้น หากมีโรคประจำตัวควรปรึกษาแพทย์</p>
          <button type="button" onClick={onRetry} className="rounded-lg px-3 py-1.5 font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40">
            ↻ ขอแผนใหม่
          </button>
        </footer>
      </div>
    </article>
  );
}

function DayDetail({ plan }: { plan: DayPlan }) {
  const meals = [
    { icon: "🌅", label: "เช้า", text: plan.meals.breakfast },
    { icon: "☀️", label: "กลางวัน", text: plan.meals.lunch },
    { icon: "🌙", label: "เย็น", text: plan.meals.dinner },
    { icon: "🍎", label: "ของว่าง", text: plan.meals.snack },
  ];

  return (
    <div className="grid animate-fade-up gap-4 md:grid-cols-5">
      <div className="rounded-2xl bg-zinc-900 p-5 text-white md:col-span-2 dark:bg-zinc-950 dark:ring-1 dark:ring-zinc-800">
        <p className="text-xs text-zinc-400">วัน{plan.day} · {plan.focus}</p>
        <p className="mt-3 text-sm text-zinc-400">🏃 ออกกำลังกาย</p>
        <p className="mt-1 text-lg font-semibold">{plan.exercise.activity}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/10 px-2.5 py-1">⏱ {plan.exercise.duration}</span>
          <span className={`rounded-full px-2.5 py-1 font-medium ${INTENSITY_STYLE[plan.exercise.intensity] ?? INTENSITY_STYLE["ปานกลาง"]}`}>
            {plan.exercise.intensity}
          </span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">{plan.exercise.detail}</p>
      </div>

      <ul className="space-y-2 md:col-span-3">
        {meals.map((m, i) => (
          <li
            key={m.label}
            style={{ animationDelay: `${i * 60}ms` }}
            className="flex animate-fade-up gap-3 rounded-2xl border border-zinc-100 p-3.5 dark:border-zinc-800"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-lg dark:bg-red-950/40">{m.icon}</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">{m.label}</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{m.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-3 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
      <span className="h-4 w-1 rounded-full bg-gradient-to-b from-red-600 to-rose-500" />
      {children}
    </h4>
  );
}
