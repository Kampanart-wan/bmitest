"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { bmiRecords } from "@/db/schema";
import { bmiCategory, calculateBmi } from "@/lib/bmi";

export type BmiValues = { nickname: string; age: string; weight: string; height: string };

export type BmiState =
  | { status: "idle" }
  | { status: "error"; message: string; values: BmiValues; at: number }
  | { status: "ok"; nickname: string; bmi: number; values: BmiValues; at: number };

export async function submitBmi(_prev: BmiState, formData: FormData): Promise<BmiState> {
  const nickname = String(formData.get("nickname") ?? "").trim();
  const age = Number(formData.get("age"));
  const weightKg = Number(formData.get("weight"));
  const heightCm = Number(formData.get("height"));
  const values: BmiValues = {
    nickname,
    age: String(formData.get("age") ?? ""),
    weight: String(formData.get("weight") ?? ""),
    height: String(formData.get("height") ?? ""),
  };
  const fail = (message: string): BmiState => ({ status: "error", message, values, at: Date.now() });

  if (!nickname) return fail("กรุณากรอกชื่อเล่น");
  if (!Number.isInteger(age) || age < 1 || age > 120)
    return fail("อายุต้องอยู่ระหว่าง 1–120 ปี");
  if (!(weightKg > 0 && weightKg < 500))
    return fail("น้ำหนักต้องอยู่ระหว่าง 1–500 กก.");
  if (!(heightCm > 30 && heightCm < 300))
    return fail("ส่วนสูงต้องอยู่ระหว่าง 30–300 ซม.");

  const bmi = calculateBmi(weightKg, heightCm);
  const category = bmiCategory(bmi);

  await db.insert(bmiRecords).values({ nickname, age, weightKg, heightCm, bmi, category });
  revalidatePath("/");

  return { status: "ok", nickname, bmi, values, at: Date.now() };
}
