import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const books = sqliteTable("books", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull().default(""),
  description: text("description").notNull().default(""),
  format: text("format").notNull().default("a5"),
  status: text("status").notNull().default("draft"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const chapters = sqliteTable("chapters", {
  id: text("id").primaryKey(),
  bookId: text("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  type: text("type").notNull().default("chapter"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const bookSettings = sqliteTable("book_settings", {
  bookId: text("book_id")
    .primaryKey()
    .references(() => books.id, { onDelete: "cascade" }),
  fontFamily: text("font_family").notNull().default("serif"),
  fontSizePt: integer("font_size_pt").notNull().default(11),
  lineHeight: integer("line_height").notNull().default(160),
  marginTopMm: integer("margin_top_mm").notNull().default(20),
  marginBottomMm: integer("margin_bottom_mm").notNull().default(20),
  marginSideMm: integer("margin_side_mm").notNull().default(18),
  chapterStart: text("chapter_start").notNull().default("any"),
  updatedAt: integer("updated_at").notNull(),
});
