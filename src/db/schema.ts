import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const celebs = pgTable("celebs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  elo: integer("elo").notNull().default(1200),
  matches: integer("matches").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const duels = pgTable("duels", {
  id: serial("id").primaryKey(),
  celebAId: integer("celeb_a")
    .notNull()
    .references(() => celebs.id, { onDelete: "cascade" }),
  celebBId: integer("celeb_b")
    .notNull()
    .references(() => celebs.id, { onDelete: "cascade" }),
  winnerId: integer("winner").references(() => celebs.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const celebsRelations = relations(celebs, ({ many }) => ({
  duelsAsA: many(duels, { relationName: "celebA" }),
  duelsAsB: many(duels, { relationName: "celebB" }),
  wins: many(duels, { relationName: "winner" }),
}));

export const duelsRelations = relations(duels, ({ one }) => ({
  celebA: one(celebs, {
    fields: [duels.celebAId],
    references: [celebs.id],
    relationName: "celebA",
  }),
  celebB: one(celebs, {
    fields: [duels.celebBId],
    references: [celebs.id],
    relationName: "celebB",
  }),
  winner: one(celebs, {
    fields: [duels.winnerId],
    references: [celebs.id],
    relationName: "winner",
  }),
}));

export type InsertCeleb = typeof celebs.$inferInsert;
export type SelectCeleb = typeof celebs.$inferSelect;
export type InsertDuel = typeof duels.$inferInsert;
export type SelectDuel = typeof duels.$inferSelect;
