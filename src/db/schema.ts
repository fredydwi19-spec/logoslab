import { mysqlTable, serial, varchar, timestamp, mysqlEnum, int, bigint } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 100 }).unique(),
  password: varchar("password", { length: 255 }),
  googleId: varchar("google_id", { length: 255 }).unique(),
  role: mysqlEnum("role", ["KETUA_TIM", "PEMBUAT_GAME", "PEMBUAT_MATERI", "PAKAR", "USER"]).default("USER").notNull(),
  profilePicture: varchar("profile_picture", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const projects = mysqlTable("projects", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["GAME", "MATERI"]).notNull(),
  status: mysqlEnum("status", ["DRAFT", "REVIEW", "ACCEPTED", "PUBLISHED"]).default("DRAFT").notNull(),
  idPembuat: bigint("id_pembuat", { mode: 'number', unsigned: true }).references(() => users.id).notNull(),
  idPakar: bigint("id_pakar", { mode: 'number', unsigned: true }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
