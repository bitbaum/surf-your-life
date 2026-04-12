import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  vector,
  pgEnum,
  index,
  primaryKey,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ─── Enums ────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["client", "practitioner", "admin"])

export const checkInMoodEnum = pgEnum("check_in_mood", [
  "very_low",
  "low",
  "neutral",
  "good",
  "excellent",
])

export const documentTypeEnum = pgEnum("document_type", [
  "assessment",
  "session_note",
  "report",
  "upload",
])

// ─── Auth tables (Auth.js v5 compatible) ──────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  password: text("password"), // null for OAuth users
  role: roleEnum("role").notNull().default("client"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
})

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })]
)

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
)

// ─── Client Profiles ──────────────────────────────────────────────────────────

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  // Health context
  dateOfBirth: text("date_of_birth"),
  occupation: text("occupation"),
  mainConcern: text("main_concern"), // burnout / Long-COVID / midlife reinvention / other
  currentSituation: text("current_situation"),
  goals: text("goals"),
  previousTherapy: boolean("previous_therapy").default(false),
  medications: text("medications"),
  // Lifestyle
  sleepQuality: integer("sleep_quality"), // 1-10
  stressLevel: integer("stress_level"), // 1-10
  exerciseFrequency: text("exercise_frequency"),
  // Embedding for semantic search over profile context
  embedding: vector("embedding", { dimensions: 1536 }),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
})

// ─── Check-ins ────────────────────────────────────────────────────────────────

export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mood: checkInMoodEnum("mood").notNull(),
    energyLevel: integer("energy_level").notNull(), // 1-10
    sleepHours: integer("sleep_hours"),
    notes: text("notes"),
    wins: text("wins"),
    challenges: text("challenges"),
    // AI-generated analysis stored alongside the raw data
    aiInsight: text("ai_insight"),
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("check_ins_user_idx").on(table.userId)]
)

// ─── Documents (assessments, session notes, reports) ─────────────────────────

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id), // practitioner who created it
    type: documentTypeEnum("type").notNull(),
    title: text("title").notNull(),
    content: text("content"), // structured or unstructured text
    metadata: jsonb("metadata"), // flexible key-value for structured data
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("documents_user_idx").on(table.userId),
    index("documents_type_idx").on(table.type),
  ]
)

// ─── Practitioner assignments ─────────────────────────────────────────────────

export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  practitionerId: uuid("practitioner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at", { mode: "date" }).defaultNow().notNull(),
  active: boolean("active").default(true).notNull(),
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  checkIns: many(checkIns),
  documents: many(documents),
  assignmentsAsClient: many(assignments, { relationName: "client" }),
  assignmentsAsPractitioner: many(assignments, { relationName: "practitioner" }),
}))

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}))

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  user: one(users, { fields: [checkIns.userId], references: [users.id] }),
}))

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, { fields: [documents.userId], references: [users.id] }),
  author: one(users, { fields: [documents.authorId], references: [users.id] }),
}))

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Profile = typeof profiles.$inferSelect
export type CheckIn = typeof checkIns.$inferSelect
export type Document = typeof documents.$inferSelect
export type Role = (typeof roleEnum.enumValues)[number]
