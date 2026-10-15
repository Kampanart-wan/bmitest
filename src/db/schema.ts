import { integer, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";

export const bmiRecords = pgTable("bmi_records", {
  id: serial("id").primaryKey(),
  nickname: text("nickname").notNull(),
  age: integer("age").notNull(),
  weightKg: real("weight_kg").notNull(),
  heightCm: real("height_cm").notNull(),
  bmi: real("bmi").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type BmiRecord = typeof bmiRecords.$inferSelect;
