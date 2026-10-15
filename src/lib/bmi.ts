export function calculateBmi(weightKg: number, heightCm: number) {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 100) / 100;
}

export type BmiLevelKey = "under" | "normal" | "over" | "obese1" | "obese2";

// เกณฑ์ BMI สำหรับคนเอเชีย (WHO Asia-Pacific)
export const BMI_LEVELS: { key: BmiLevelKey; min: number; label: string; short: string; advice: string }[] = [
  { key: "under", min: 0, label: "น้ำหนักน้อย / ผอม", short: "ผอม", advice: "ควรทานอาหารให้ครบ 5 หมู่และเพิ่มพลังงานให้เพียงพอ" },
  { key: "normal", min: 18.5, label: "ปกติ (สุขภาพดี)", short: "ปกติ", advice: "เยี่ยมมาก! รักษาการกินและออกกำลังกายแบบนี้ต่อไป" },
  { key: "over", min: 23, label: "ท้วม / โรคอ้วนระดับ 1", short: "ท้วม", advice: "เริ่มเกินเกณฑ์ ลองคุมอาหารและออกกำลังกายสม่ำเสมอ" },
  { key: "obese1", min: 25, label: "อ้วน / โรคอ้วนระดับ 2", short: "อ้วน", advice: "เสี่ยงต่อโรค ควรปรับพฤติกรรมการกินและออกกำลังกาย" },
  { key: "obese2", min: 30, label: "อ้วนมาก / โรคอ้วนระดับ 3", short: "อ้วนมาก", advice: "เสี่ยงสูง ควรปรึกษาแพทย์เพื่อวางแผนลดน้ำหนัก" },
];

export function bmiLevel(bmi: number) {
  return [...BMI_LEVELS].reverse().find((l) => bmi >= l.min)!;
}

export function bmiCategory(bmi: number) {
  return bmiLevel(bmi).label;
}

// คลาสสีตามสถานะ (เขียนเป็นสตริงเต็มเพื่อให้ Tailwind สแกนเจอ)
export const LEVEL_TONE: Record<
  BmiLevelKey,
  { card: string; badge: string; text: string; bar: string; ring: string }
> = {
  under: {
    card: "from-sky-500 to-blue-600 shadow-sky-500/30",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    text: "text-sky-600 dark:text-sky-400",
    bar: "bg-sky-400",
    ring: "ring-sky-500",
  },
  normal: {
    card: "from-emerald-500 to-teal-600 shadow-emerald-500/30",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    text: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    ring: "ring-emerald-500",
  },
  over: {
    card: "from-amber-500 to-orange-500 shadow-amber-500/30",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    text: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-400",
    ring: "ring-amber-500",
  },
  obese1: {
    card: "from-orange-500 to-red-500 shadow-orange-500/30",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
    text: "text-orange-600 dark:text-orange-400",
    bar: "bg-orange-500",
    ring: "ring-orange-500",
  },
  obese2: {
    card: "from-red-600 to-rose-700 shadow-red-600/30",
    badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    text: "text-red-600 dark:text-red-400",
    bar: "bg-red-600",
    ring: "ring-red-600",
  },
};
