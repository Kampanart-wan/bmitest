"use server";

import { ADVICE_SCHEMA, ADVICE_SYSTEM_PROMPT, targetWeightRange, type Advice } from "@/lib/advice";
import { bmiCategory, calculateBmi } from "@/lib/bmi";

const DEFAULT_MODEL = "gemini-flash-lite-latest"; // เร็ว เหมาะกับงานนี้
const BACKUP_MODEL = "gemini-flash-latest";
const RETRYABLE = new Set([500, 502, 503, 504]);

export type AdviceInput = { nickname: string; age: number; weightKg: number; heightCm: number };
export type AdviceResult = { ok: true; advice: Advice } | { ok: false; message: string };

export async function getAdvice(input: AdviceInput): Promise<AdviceResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, message: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในไฟล์ .env" };
  }

  const { nickname, age, weightKg, heightCm } = input;
  if (!nickname || !(age > 0) || !(weightKg > 0) || !(heightCm > 0)) {
    return { ok: false, message: "ข้อมูลไม่ครบ กรุณาคำนวณ BMI ใหม่อีกครั้ง" };
  }

  // ข้อมูลที่ส่งให้ AI ในรูปแบบ JSON (คำนวณ BMI ฝั่ง server เสมอ)
  const bmi = calculateBmi(weightKg, heightCm);
  const payload = {
    profile: { nickname, age, weightKg, heightCm },
    bmi: { value: bmi, category: bmiCategory(bmi), standard: "WHO Asia-Pacific", normalRange: { min: 18.5, max: 22.9 } },
    targetWeightKg: targetWeightRange(heightCm),
    request: "ขอคำแนะนำการดูแลสุขภาพ โปรแกรมออกกำลังกาย และอาหาร 7 วัน เพื่อให้ BMI อยู่ในเกณฑ์ปกติ",
  };

  const primary = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const fallback = primary === DEFAULT_MODEL ? BACKUP_MODEL : DEFAULT_MODEL;
  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: ADVICE_SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: JSON.stringify(payload, null, 2) }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: ADVICE_SCHEMA,
      temperature: 0.7,
    },
  });

  // ถ้าโมเดลหลักคนใช้เยอะ (503) หรือตอบช้าเกินไป ให้สลับไปโมเดลสำรองทันที
  const attempts = [primary, fallback, fallback];
  const callGemini = (model: string) =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: requestBody,
      signal: AbortSignal.timeout(45_000),
    });

  try {
    let res: Response | null = null;
    let model = primary;
    for (const [i, m] of attempts.entries()) {
      model = m;
      const last = i === attempts.length - 1;
      try {
        res = await callGemini(m);
      } catch (err) {
        if (last || !(err instanceof Error && err.name === "TimeoutError")) throw err;
        console.warn(`Gemini ${m} timed out, trying next model...`);
        continue;
      }
      if (!RETRYABLE.has(res.status) || last) break;
      console.warn(`Gemini ${m} returned ${res.status}, trying next model...`);
      await new Promise((r) => setTimeout(r, 800));
    }
    if (!res) throw new Error("no response");

    if (!res.ok) {
      console.error("Gemini error", model, res.status, await res.text());
      if (res.status === 400 || res.status === 401 || res.status === 403)
        return { ok: false, message: "API key ไม่ถูกต้องหรือไม่มีสิทธิ์ใช้งาน กรุณาตรวจสอบ GEMINI_API_KEY" };
      if (res.status === 429) return { ok: false, message: "ใช้งาน AI เกินโควตาชั่วคราว ลองใหม่อีกครั้งในอีกสักครู่" };
      if (res.status === 404) return { ok: false, message: `ไม่พบโมเดล "${model}" กรุณาตรวจสอบ GEMINI_MODEL` };
      if (RETRYABLE.has(res.status))
        return { ok: false, message: "ตอนนี้มีผู้ใช้ AI ของ Google จำนวนมาก กรุณาลองใหม่อีกครั้งในอีกสักครู่" };
      return { ok: false, message: "AI ไม่สามารถตอบได้ในขณะนี้ ลองใหม่อีกครั้ง" };
    }

    const data = await res.json();
    const text: string = (data.candidates?.[0]?.content?.parts ?? [])
      .filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought)
      .map((p: { text: string }) => p.text)
      .join("");

    const advice = JSON.parse(text) as Advice;
    if (!Array.isArray(advice.weeklyPlan) || advice.weeklyPlan.length === 0) throw new Error("empty plan");
    return { ok: true, advice };
  } catch (err) {
    console.error("Gemini request failed", err);
    const timeout = err instanceof Error && err.name === "TimeoutError";
    return { ok: false, message: timeout ? "AI ใช้เวลานานเกินไป ลองใหม่อีกครั้ง" : "อ่านคำตอบจาก AI ไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
}
