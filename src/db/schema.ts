import { mysqlTable, serial, varchar, timestamp, mysqlEnum, int, bigint, boolean, text, longtext } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 100 }).unique(),
  password: varchar("password", { length: 255 }),
  googleId: varchar("google_id", { length: 255 }).unique(),
  role: mysqlEnum("role", ["KETUA_TIM", "PEMBUAT_GAME", "PEMBUAT_MATERI", "PAKAR", "USER"]).default("USER").notNull(),
  isVerified: boolean("is_verified").default(false),
  profilePicture: varchar("profile_picture", { length: 255 }),
  hasOnboarded: boolean("has_onboarded").default(false),
  interests: varchar("interests", { length: 500 }), // Store as comma-separated or JSON string
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const verificationTokens = mysqlTable("verification_tokens", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: 'number', unsigned: true }).references(() => users.id).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const projects = mysqlTable("projects", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  gameType: mysqlEnum("game_type", ["QUIZ", "FILL_THE_BLANK", "WORD_SEARCH", "CROSSWORD"]),
  type: mysqlEnum("type", ["GAME", "MATERI"]).notNull(),
  category: varchar("category", { length: 100 }), // Matching user interests
  status: mysqlEnum("status", ["DRAFT", "REVIEW_PAKAR", "REVISI_PAKAR", "ACCEPTED_PAKAR", "REVIEW_KETUA", "REVISI_KETUA", "PUBLISHED", "UNPUBLISHED"]).default("DRAFT").notNull(),
  revisionCount: int("revision_count").default(0),
  deadline: timestamp("deadline"),
  thumbnailUrl: longtext("thumbnail_url"),
  idPembuat: bigint("id_pembuat", { mode: 'number', unsigned: true }).references(() => users.id).notNull(),
  idPakar: bigint("id_pakar", { mode: 'number', unsigned: true }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const questionBank = mysqlTable("question_bank", {
  id: serial("id").primaryKey(),
  projectId: bigint("project_id", { mode: 'number', unsigned: true }).references(() => projects.id).notNull(),
  question: text("question").notNull(),
  optionA: varchar("option_a", { length: 255 }).notNull(),
  optionB: varchar("option_b", { length: 255 }).notNull(),
  optionC: varchar("option_c", { length: 255 }).notNull(),
  optionD: varchar("option_d", { length: 255 }).notNull(),
  correctAnswer: mysqlEnum("correct_answer", ["A", "B", "C", "D"]).notNull(),
  difficulty: mysqlEnum("difficulty", ["RENDAH", "SEDANG", "SULIT", "BONUS"]).notNull(),
  score: int("score").notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const gameQuestionsBank = mysqlTable("game_questions_bank", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  difficulty: mysqlEnum("difficulty", ["RENDAH", "SEDANG", "SULIT"]).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const gameFillTheBlank = mysqlTable("game_fill_the_blank", {
  id: serial("id").primaryKey(),
  projectId: bigint("project_id", { mode: 'number', unsigned: true }).references(() => projects.id).notNull(),
  questionBankId: bigint("question_bank_id", { mode: 'number', unsigned: true }).references(() => gameQuestionsBank.id),
  fullText: text("full_text").notNull(),
  answers: text("answers").notNull(), // JSON string: Array<{ word: string, explanation: string }>
  difficulty: mysqlEnum("difficulty", ["RENDAH", "SEDANG", "SULIT"]).notNull(),
  score: int("score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const reviewsHistory = mysqlTable("reviews_history", {
  id: serial("id").primaryKey(),
  projectId: bigint("project_id", { mode: 'number', unsigned: true }).references(() => projects.id).notNull(),
  reviewerId: bigint("reviewer_id", { mode: 'number', unsigned: true }).references(() => users.id).notNull(),
  feedback: text("feedback").notNull(),
  statusGiven: varchar("status_given", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: 'number', unsigned: true }).references(() => users.id).notNull(),
  message: text("message").notNull(),
  projectId: bigint("project_id", { mode: 'number', unsigned: true }).references(() => projects.id),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameWordSearch = mysqlTable("game_word_search", {
  id: serial("id").primaryKey(),
  projectId: bigint("project_id", { mode: 'number', unsigned: true }).references(() => projects.id).notNull(),
  words: text("words").notNull(), // JSON string: Array<{ word: string, explanation: string }>
  gridSize: int("grid_size").notNull(),
  difficulty: mysqlEnum("difficulty", ["EASY", "MEDIUM", "HARD"]).notNull(),
  score: int("score").notNull(),
  gridData: text("grid_data").notNull(), // JSON string: 2D array of characters
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const gameCrossword = mysqlTable("game_crossword", {
  id: serial("id").primaryKey(),
  projectId: bigint("project_id", { mode: 'number', unsigned: true }).references(() => projects.id).notNull(),
  clues: text("clues").notNull(), // JSON string: Array<{ number: number; direction: 'ACROSS'|'DOWN'; clue: string; answer: string; startRow: number; startCol: number; explanation: string; }>
  gridSize: int("grid_size").notNull(),
  difficulty: mysqlEnum("difficulty", ["EASY", "MEDIUM", "HARD"]).notNull(),
  score: int("score").notNull(),
  gridData: text("grid_data").notNull(), // JSON string: matriks 2D cell object Array<Array<{letter:string, isBlack:boolean, number:number|null}>>
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const userScores = mysqlTable("user_scores", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: 'number', unsigned: true }).references(() => users.id).notNull(),
  projectId: bigint("project_id", { mode: 'number', unsigned: true }).references(() => projects.id).notNull(),
  score: int("score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
