import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const loginUserSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  rememberMe: z.boolean().optional(),
});

// Speech sessions table to store practice history
export const speechSessions = pgTable("speech_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  transcript: text("transcript").notNull(),
  duration: integer("duration").notNull(), // in seconds
  speechScore: integer("speech_score"), // 0-100
  bodyLanguageScore: integer("body_language_score"), // 0-100
  confidenceScore: integer("confidence_score"), // 0-100
  totalScore: integer("total_score"), // 0-100
  feedback: text("feedback"),
  metrics: json("metrics").$type<{
    vocabulary: number;
    grammar: number;
    fluency: number;
    posture: number;
    gestures: number;
    eyeContact: number;
    energy: number;
    clarity: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Set up relations
export const usersRelations = relations(users, ({ many }) => ({
  speechSessions: many(speechSessions),
}));

export const speechSessionsRelations = relations(speechSessions, ({ one }) => ({
  user: one(users, {
    fields: [speechSessions.userId],
    references: [users.id],
  }),
}));

// Insert schema for speech sessions
export const insertSpeechSessionSchema = createInsertSchema(speechSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type SpeechSession = typeof speechSessions.$inferSelect;
export type InsertSpeechSession = z.infer<typeof insertSpeechSessionSchema>;
