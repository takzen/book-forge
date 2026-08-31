import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { bookSettings, books, chapters } from "@/lib/db/schema";

export type NewBookInput = {
  title: string;
  author?: string;
  format?: "a5" | "a4" | "six-by-nine";
};

export type BookFormat = "a5" | "a4" | "six-by-nine";

export type BookSettingsInput = {
  fontFamily?: string;
  fontSizePt?: number;
  lineHeight?: number;
  marginTopMm?: number;
  marginBottomMm?: number;
  marginSideMm?: number;
  chapterStart?: "any" | "recto" | "verso";
};

export function listBooks() {
  return getDb().select().from(books).orderBy(desc(books.updatedAt)).all();
}

export function getBook(bookId: string) {
  return getDb().select().from(books).where(eq(books.id, bookId)).get();
}

export function listChapters(bookId: string) {
  return getDb()
    .select()
    .from(chapters)
    .where(eq(chapters.bookId, bookId))
    .orderBy(asc(chapters.sortOrder), asc(chapters.createdAt))
    .all();
}

export function createBook({
  title,
  author = "",
  format = "a5",
}: NewBookInput) {
  const id = randomUUID();
  const chapterId = randomUUID();
  const now = Date.now();
  const db = getDb();

  db.transaction((tx) => {
    tx.insert(books)
      .values({ id, title, author, format, createdAt: now, updatedAt: now })
      .run();
    tx.insert(bookSettings).values({ bookId: id, updatedAt: now }).run();
    tx.insert(chapters)
      .values({
        id: chapterId,
        bookId: id,
        title: "Chapter 1",
        content: "# Chapter 1\n\nStart writing your book here.",
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  });

  return id;
}

export function updateBook({
  id,
  title,
  author,
  format,
}: {
  id: string;
  title: string;
  author: string;
  format: BookFormat;
}) {
  const now = Date.now();
  getDb()
    .update(books)
    .set({ title, author, format, updatedAt: now })
    .where(eq(books.id, id))
    .run();
}

export async function deleteBook(bookId: string) {
  getDb().delete(books).where(eq(books.id, bookId)).run();
  await rm(join(process.cwd(), "data", "uploads", bookId), {
    recursive: true,
    force: true,
  });
}

export function getBookSettings(bookId: string) {
  const db = getDb();
  const existing = db
    .select()
    .from(bookSettings)
    .where(eq(bookSettings.bookId, bookId))
    .get();

  if (existing) {
    return existing;
  }

  const now = Date.now();
  db.insert(bookSettings).values({ bookId, updatedAt: now }).run();
  return db
    .select()
    .from(bookSettings)
    .where(eq(bookSettings.bookId, bookId))
    .get()!;
}

export function updateBookSettings(bookId: string, input: BookSettingsInput) {
  const now = Date.now();
  getDb()
    .update(bookSettings)
    .set({ ...input, updatedAt: now })
    .where(eq(bookSettings.bookId, bookId))
    .run();
}

export function deleteChapter(bookId: string, chapterId: string) {
  const now = Date.now();
  const db = getDb();

  db.transaction((tx) => {
    tx.delete(chapters).where(eq(chapters.id, chapterId)).run();
    tx.update(books).set({ updatedAt: now }).where(eq(books.id, bookId)).run();
  });
}

export function reorderChapters(bookId: string, orderedChapterIds: string[]) {
  const db = getDb();
  const now = Date.now();

  db.transaction((tx) => {
    orderedChapterIds.forEach((chapterId, index) => {
      tx.update(chapters)
        .set({ sortOrder: index, updatedAt: now })
        .where(and(eq(chapters.id, chapterId), eq(chapters.bookId, bookId)))
        .run();
    });
    tx.update(books).set({ updatedAt: now }).where(eq(books.id, bookId)).run();
  });
}

export function createChapter(bookId: string) {
  const db = getDb();
  const lastChapter = db
    .select({ sortOrder: chapters.sortOrder })
    .from(chapters)
    .where(eq(chapters.bookId, bookId))
    .orderBy(desc(chapters.sortOrder))
    .get();
  const now = Date.now();
  const chapterId = randomUUID();

  db.transaction((tx) => {
    tx.insert(chapters)
      .values({
        id: chapterId,
        bookId,
        title: `Chapter ${(lastChapter?.sortOrder ?? -1) + 2}`,
        content: "",
        sortOrder: (lastChapter?.sortOrder ?? -1) + 1,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    tx.update(books).set({ updatedAt: now }).where(eq(books.id, bookId)).run();
  });

  return chapterId;
}

export function updateChapter({
  bookId,
  chapterId,
  title,
  content,
}: {
  bookId: string;
  chapterId: string;
  title: string;
  content: string;
}) {
  const now = Date.now();
  const db = getDb();

  db.transaction((tx) => {
    tx.update(chapters)
      .set({ title, content, updatedAt: now })
      .where(eq(chapters.id, chapterId))
      .run();
    tx.update(books).set({ updatedAt: now }).where(eq(books.id, bookId)).run();
  });
}
