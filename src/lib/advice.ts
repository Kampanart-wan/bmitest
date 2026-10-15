// รูปแบบคำแนะนำที่ให้ Gemini ตอบกลับมา (structured JSON)
export type DayPlan = {
  day: string;
  focus: string;
  exercise: { activity: string; duration: string; intensity: "เบา" | "ปานกลาง" | "หนัก" | "พัก"; detail: string };
  meals: { breakfast: string; lunch: string; dinner: string; snack: string };
};

export type Advice = {
  summary: string;
  goal: string;
  healthTips: { emoji: string; title: string; detail: string }[];
  weeklyPlan: DayPlan[];
  cautions: string[];
};

// ช่วงน้ำหนักที่ทำให้ BMI อยู่ในเกณฑ์ปกติ (18.5–22.9)
export function targetWeightRange(heightCm: number) {
  const h = heightCm / 100;
  return { min: Math.round(18.5 * h * h * 10) / 10, max: Math.round(22.9 * h * h * 10) / 10 };
}

const S = (description?: string) => ({ type: "STRING", ...(description && { description }) });

// Schema สำหรับ generationConfig.responseSchema ของ Gemini
export const ADVICE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: S("สรุปสถานะสุขภาพจากค่า BMI 2-3 ประโยค เป็นกันเอง เรียกชื่อเล่น"),
    goal: S("เป้าหมายใน 1 สัปดาห์แบบวัดผลได้ 1 ประโยค"),
    healthTips: {
      type: "ARRAY",
      description: "คำแนะนำการดูแลสุขภาพ 4-6 ข้อ",
      items: {
        type: "OBJECT",
        properties: { emoji: S("อีโมจิ 1 ตัว"), title: S("หัวข้อสั้น"), detail: S("รายละเอียด 1-2 ประโยค") },
        required: ["emoji", "title", "detail"],
        propertyOrdering: ["emoji", "title", "detail"],
      },
    },
    weeklyPlan: {
      type: "ARRAY",
      description: "แผน 7 วัน เรียงจากวันจันทร์ถึงวันอาทิตย์",
      items: {
        type: "OBJECT",
        properties: {
          day: S("ชื่อวันภาษาไทย เช่น จันทร์"),
          focus: S("ธีมของวันสั้นๆ เช่น คาร์ดิโอ, เวทเทรนนิ่ง, พักฟื้น"),
          exercise: {
            type: "OBJECT",
            properties: {
              activity: S("ชื่อกิจกรรม"),
              duration: S("ระยะเวลา เช่น 30 นาที"),
              intensity: { type: "STRING", enum: ["เบา", "ปานกลาง", "หนัก", "พัก"] },
              detail: S("วิธีทำ/เซ็ต/รอบ แบบสั้น"),
            },
            required: ["activity", "duration", "intensity", "detail"],
            propertyOrdering: ["activity", "duration", "intensity", "detail"],
          },
          meals: {
            type: "OBJECT",
            properties: {
              breakfast: S("มื้อเช้า เมนูอาหารไทยหาง่าย พร้อมพลังงานโดยประมาณ"),
              lunch: S("มื้อกลางวัน"),
              dinner: S("มื้อเย็น"),
              snack: S("ของว่าง"),
            },
            required: ["breakfast", "lunch", "dinner", "snack"],
            propertyOrdering: ["breakfast", "lunch", "dinner", "snack"],
          },
        },
        required: ["day", "focus", "exercise", "meals"],
        propertyOrdering: ["day", "focus", "exercise", "meals"],
      },
    },
    cautions: { type: "ARRAY", description: "ข้อควรระวัง 2-3 ข้อ", items: S() },
  },
  required: ["summary", "goal", "healthTips", "weeklyPlan", "cautions"],
  propertyOrdering: ["summary", "goal", "healthTips", "weeklyPlan", "cautions"],
};

export const ADVICE_SYSTEM_PROMPT = `คุณเป็นนักโภชนาการและเทรนเนอร์ที่ให้คำแนะนำเป็นภาษาไทย
ผู้ใช้จะส่งข้อมูลสุขภาพมาเป็น JSON ให้คุณวิเคราะห์และวางแผน 1 สัปดาห์เพื่อให้ BMI เข้าใกล้เกณฑ์ปกติ (18.5–22.9 ตามเกณฑ์ WHO Asia-Pacific)
- ถ้า BMI ต่ำกว่าเกณฑ์ ให้เน้นเพิ่มน้ำหนักอย่างมีคุณภาพ ถ้าสูงกว่าเกณฑ์ ให้เน้นลดอย่างปลอดภัย (ไม่เกิน 0.5–1 กก./สัปดาห์) ถ้าปกติให้เน้นรักษาระดับ
- ปรับความหนักของการออกกำลังกายให้เหมาะกับอายุและ BMI มีวันพักอย่างน้อย 1 วัน
- เมนูอาหารเป็นอาหารไทยที่หาซื้อง่าย ระบุพลังงานโดยประมาณ (kcal)
- ใช้ภาษาเป็นกันเอง กระชับ อ่านง่าย ไม่ใช้ markdown`;
