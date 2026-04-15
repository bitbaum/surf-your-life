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

export const leadStatusEnum = pgEnum("lead_status", ["new", "contacted", "dismissed"])

export const mainConcernEnum = pgEnum("main_concern_type", [
  "burnout",
  "long_covid",
  "midlife_reinvention",
  "general_wellbeing",
  "other",
])

export const programStatusEnum = pgEnum("program_status", ["active", "completed", "paused"])

export const activityLevelEnum = pgEnum("activity_level", ["rest", "light", "moderate", "active"])

export const alertTypeEnum = pgEnum("alert_type", [
  "energy_decline",
  "fatigue_spike",
  "pem_cluster",
  "missed_checkins",
  "mood_decline",
  "stress_spike",
  "orthostatic_intolerance",
])

export const alertSeverityEnum = pgEnum("alert_severity", ["low", "medium", "high"])

export const techniqueCategoryEnum = pgEnum("technique_category", [
  "breathwork",
  "movement",
  "mindfulness",
  "cognitive",
  "pacing",
  "sleep",
  "social",
])

export const techniqueDifficultyEnum = pgEnum("technique_difficulty", ["easy", "moderate", "challenging"])

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
  // Identity
  gender: text("gender"),
  dateOfBirth: text("date_of_birth"),
  occupation: text("occupation"),
  workHoursPerWeek: integer("work_hours_per_week"),
  insuranceProvider: text("insurance_provider"),
  // Clinical
  mainConcern: mainConcernEnum("main_concern"),
  currentSituation: text("current_situation"),
  goals: text("goals"),
  existingDiagnoses: text("existing_diagnoses"),
  familyHistory: text("family_history"),
  previousTherapy: boolean("previous_therapy").default(false),
  medications: text("medications"),
  // Physical
  heightCm: integer("height_cm"),
  weightKg: integer("weight_kg"),
  // Lifestyle
  sleepQuality: integer("sleep_quality"), // 1-10
  sleepSchedule: text("sleep_schedule"),
  exerciseFrequency: text("exercise_frequency"),
  alcoholTobacco: text("alcohol_tobacco"),
  socialSupport: integer("social_support"), // 1-10
  stressLevel: integer("stress_level"), // 1-10
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
    // Symptom severity tracking (all optional, 1–10)
    symptomFatigue: integer("symptom_fatigue"),
    symptomBrainFog: integer("symptom_brain_fog"),
    symptomPain: integer("symptom_pain"),
    stressLevel: integer("stress_level"),
    // Activity & PEM (Post-Exertional Malaise) tracking — key for Long COVID clients
    activityLevel: activityLevelEnum("activity_level"),
    pemFlag: boolean("pem_flag").default(false),
    pemSeverity: integer("pem_severity"), // 1-10, only relevant when pemFlag is true
    // Sleep quality (1–5: very poor → excellent) — separate from duration
    sleepQuality: integer("sleep_quality"),
    // Orthostatic intolerance: dizziness on standing — common Long COVID / POTS indicator
    orthostaticSymptoms: boolean("orthostatic_symptoms"),
    // Single journal entry replacing separate wins/challenges/notes fields
    journalEntry: text("journal_entry"),
    // AI-generated analysis stored alongside the raw data
    aiInsight: text("ai_insight"),
    embedding: vector("embedding", { dimensions: 1536 }),
    // Practitioner feedback on this check-in
    practitionerNote: text("practitioner_note"),
    practitionerNoteAt: timestamp("practitioner_note_at", { mode: "date" }),
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

// ─── Leads (marketing intake) ─────────────────────────────────────────────────

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    message: text("message"),
    source: text("source").default("contact_form"), // where did they come from
    status: leadStatusEnum("status").notNull().default("new"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("leads_email_idx").on(table.email)]
)

// ─── Services & Bookings ──────────────────────────────────────────────────────

export const serviceCategoryEnum = pgEnum("service_category", ["machine", "space", "consultation"])
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "cancelled"])

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  category: serviceCategoryEnum("category").notNull(),
  durationMinutes: integer("duration_minutes"),
  available: boolean("available").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
})

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    preferredDate: text("preferred_date"), // ISO: YYYY-MM-DD
    preferredTime: text("preferred_time"), // "morning" | "afternoon" | "flexible"
    notes: text("notes"),
    status: bookingStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("bookings_user_idx").on(table.userId),
    index("bookings_status_idx").on(table.status),
  ]
)

// ─── Password reset tokens ────────────────────────────────────────────────────

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  usedAt: timestamp("used_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
})

// ─── Messaging ────────────────────────────────────────────────────────────────

export const threads = pgTable(
  "threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    subject: text("subject"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("threads_client_id_idx").on(table.clientId)]
)

export const threadMessages = pgTable(
  "thread_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("thread_messages_thread_id_idx").on(table.threadId),
    index("thread_messages_sender_id_idx").on(table.senderId),
  ]
)

// ─── Programs ─────────────────────────────────────────────────────────────────

export const programs = pgTable("programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  durationWeeks: integer("duration_weeks"),
  targetConcern: mainConcernEnum("target_concern"),
  isTemplate: boolean("is_template").default(false).notNull(),
  // Array of phase objects: [{ week: number, title: string, guidance: string }]
  phaseConfig: jsonb("phase_config"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const programEnrollments = pgTable(
  "program_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
    status: programStatusEnum("status").notNull().default("active"),
    startDate: timestamp("start_date", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("program_enrollments_client_id_idx").on(table.clientId),
    index("program_enrollments_program_id_idx").on(table.programId),
  ]
)

// ─── Functional Assessments (monthly capacity evaluations) ───────────────────

export const functionalAssessments = pgTable(
  "functional_assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assessedAt: timestamp("assessed_at", { mode: "date" }).defaultNow().notNull(),
    overallCapacity: integer("overall_capacity").notNull(), // 1-10
    cognitiveCapacity: integer("cognitive_capacity"), // 1-10
    physicalCapacity: integer("physical_capacity"), // 1-10
    emotionalCapacity: integer("emotional_capacity"), // 1-10
    socialCapacity: integer("social_capacity"), // 1-10
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("functional_assessments_user_idx").on(table.userId)]
)

// ─── Medication Log ───────────────────────────────────────────────────────────

export const medicationLog = pgTable(
  "medication_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    medicationName: text("medication_name").notNull(),
    dose: text("dose"),
    frequency: text("frequency"),
    startDate: text("start_date"), // ISO date string
    endDate: text("end_date"), // ISO date string, null = ongoing
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("medication_log_user_idx").on(table.userId)]
)

// ─── Client Alerts (rule-based clinical signals for practitioners) ────────────

export const clientAlerts = pgTable(
  "client_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: alertTypeEnum("type").notNull(),
    severity: alertSeverityEnum("severity").notNull().default("medium"),
    title: text("title").notNull(),
    message: text("message").notNull(),
    isResolved: boolean("is_resolved").default(false).notNull(),
    checkInId: uuid("check_in_id").references(() => checkIns.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("client_alerts_client_id_idx").on(table.clientId),
    index("client_alerts_resolved_idx").on(table.isResolved),
  ]
)

// ─── AI Chat ─────────────────────────────────────────────────────────────────

export const aiMessages = pgTable(
  "ai_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // 'user' = client message, 'assistant' = AI response
    role: text("role").$type<"user" | "assistant">().notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("ai_messages_user_id_idx").on(table.userId),
    index("ai_messages_created_at_idx").on(table.createdAt),
  ]
)

// ─── Techniques (therapeutic technique library + assignment + tracking) ───────

export const techniques = pgTable(
  "techniques",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    category: techniqueCategoryEnum("category").notNull(),
    instructions: text("instructions"),
    durationMinutes: integer("duration_minutes"),
    difficulty: techniqueDifficultyEnum("difficulty").notNull().default("easy"),
    resourceUrl: text("resource_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("techniques_category_idx").on(table.category),
    index("techniques_active_idx").on(table.isActive),
  ]
)

export const techniqueAssignments = pgTable(
  "technique_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    techniqueId: uuid("technique_id")
      .notNull()
      .references(() => techniques.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedBy: uuid("assigned_by")
      .notNull()
      .references(() => users.id),
    frequencyPerDay: integer("frequency_per_day").notNull().default(1),
    // Safety cap stored as ×100 integer: 150 = 1.5× daily target (protects Long COVID / PEM clients)
    safetyCapMultiplier: integer("safety_cap_multiplier").notNull().default(150),
    // Debt older than this many days is forgiven — prevents crushing catch-up loads
    maxDebtDays: integer("max_debt_days").notNull().default(7),
    startDate: text("start_date").notNull(), // ISO: YYYY-MM-DD
    endDate: text("end_date"), // null = ongoing
    notes: text("notes"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("technique_assignments_client_idx").on(table.clientId),
    index("technique_assignments_technique_idx").on(table.techniqueId),
  ]
)

export const techniqueLogs = pgTable(
  "technique_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => techniqueAssignments.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // ISO: YYYY-MM-DD
    completedReps: integer("completed_reps").notNull().default(1),
    notes: text("notes"),
    isRestDay: boolean("is_rest_day").default(false).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("technique_logs_user_idx").on(table.userId),
    index("technique_logs_assignment_idx").on(table.assignmentId),
    index("technique_logs_date_idx").on(table.date),
  ]
)

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  checkIns: many(checkIns),
  documents: many(documents),
  assignmentsAsClient: many(assignments, { relationName: "client" }),
  assignmentsAsPractitioner: many(assignments, { relationName: "practitioner" }),
  bookings: many(bookings),
  threads: many(threads),
  sentMessages: many(threadMessages),
  programEnrollments: many(programEnrollments),
  functionalAssessments: many(functionalAssessments),
  medicationLog: many(medicationLog),
  alerts: many(clientAlerts),
  aiMessages: many(aiMessages),
  techniqueAssignments: many(techniqueAssignments),
  techniqueLogs: many(techniqueLogs),
}))

export const servicesRelations = relations(services, ({ many }) => ({
  bookings: many(bookings),
}))

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  service: one(services, { fields: [bookings.serviceId], references: [services.id] }),
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

export const threadsRelations = relations(threads, ({ one, many }) => ({
  client: one(users, { fields: [threads.clientId], references: [users.id] }),
  messages: many(threadMessages),
}))

export const threadMessagesRelations = relations(threadMessages, ({ one }) => ({
  thread: one(threads, { fields: [threadMessages.threadId], references: [threads.id] }),
  sender: one(users, { fields: [threadMessages.senderId], references: [users.id] }),
}))

export const programsRelations = relations(programs, ({ one, many }) => ({
  createdByUser: one(users, { fields: [programs.createdBy], references: [users.id] }),
  enrollments: many(programEnrollments),
}))

export const programEnrollmentsRelations = relations(programEnrollments, ({ one }) => ({
  client: one(users, { fields: [programEnrollments.clientId], references: [users.id] }),
  program: one(programs, { fields: [programEnrollments.programId], references: [programs.id] }),
}))

export const functionalAssessmentsRelations = relations(functionalAssessments, ({ one }) => ({
  user: one(users, { fields: [functionalAssessments.userId], references: [users.id] }),
}))

export const medicationLogRelations = relations(medicationLog, ({ one }) => ({
  user: one(users, { fields: [medicationLog.userId], references: [users.id] }),
}))

export const clientAlertsRelations = relations(clientAlerts, ({ one }) => ({
  client: one(users, { fields: [clientAlerts.clientId], references: [users.id] }),
  checkIn: one(checkIns, { fields: [clientAlerts.checkInId], references: [checkIns.id] }),
}))

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  user: one(users, { fields: [aiMessages.userId], references: [users.id] }),
}))

export const techniquesRelations = relations(techniques, ({ one, many }) => ({
  createdByUser: one(users, { fields: [techniques.createdBy], references: [users.id] }),
  assignments: many(techniqueAssignments),
}))

export const techniqueAssignmentsRelations = relations(techniqueAssignments, ({ one, many }) => ({
  technique: one(techniques, { fields: [techniqueAssignments.techniqueId], references: [techniques.id] }),
  client: one(users, { fields: [techniqueAssignments.clientId], references: [users.id] }),
  assignedByUser: one(users, { fields: [techniqueAssignments.assignedBy], references: [users.id] }),
  logs: many(techniqueLogs),
}))

export const techniqueLogsRelations = relations(techniqueLogs, ({ one }) => ({
  user: one(users, { fields: [techniqueLogs.userId], references: [users.id] }),
  assignment: one(techniqueAssignments, { fields: [techniqueLogs.assignmentId], references: [techniqueAssignments.id] }),
}))

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Profile = typeof profiles.$inferSelect
export type CheckIn = typeof checkIns.$inferSelect
export type Document = typeof documents.$inferSelect
export type Lead = typeof leads.$inferSelect
export type LeadStatus = (typeof leadStatusEnum.enumValues)[number]
export type Service = typeof services.$inferSelect
export type Booking = typeof bookings.$inferSelect
export type Role = (typeof roleEnum.enumValues)[number]
export type Thread = typeof threads.$inferSelect
export type ThreadMessage = typeof threadMessages.$inferSelect
export type Program = typeof programs.$inferSelect
export type ProgramEnrollment = typeof programEnrollments.$inferSelect
export type MainConcern = (typeof mainConcernEnum.enumValues)[number]
export type ProgramStatus = (typeof programStatusEnum.enumValues)[number]
export type ActivityLevel = (typeof activityLevelEnum.enumValues)[number]
export type AlertType = (typeof alertTypeEnum.enumValues)[number]
export type AlertSeverity = (typeof alertSeverityEnum.enumValues)[number]
export type FunctionalAssessment = typeof functionalAssessments.$inferSelect
export type MedicationEntry = typeof medicationLog.$inferSelect
export type ClientAlert = typeof clientAlerts.$inferSelect
export type AiMessage = typeof aiMessages.$inferSelect
export type Technique = typeof techniques.$inferSelect
export type NewTechnique = typeof techniques.$inferInsert
export type TechniqueCategory = (typeof techniqueCategoryEnum.enumValues)[number]
export type TechniqueDifficulty = (typeof techniqueDifficultyEnum.enumValues)[number]
export type TechniqueAssignment = typeof techniqueAssignments.$inferSelect
export type NewTechniqueAssignment = typeof techniqueAssignments.$inferInsert
export type TechniqueLog = typeof techniqueLogs.$inferSelect
export type NewTechniqueLog = typeof techniqueLogs.$inferInsert
