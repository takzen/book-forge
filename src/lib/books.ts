import { randomUUID } from "node:crypto";
import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { books, chapters } from "@/lib/db/schema";

export type NewBookInput = {
  title: string;
  author?: string;
  format?: "a5" | "a4" | "six-by-nine";
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

export function createBook({ title, author = "", format = "a5" }: NewBookInput) {
  const id = randomUUID();
  const chapterId = randomUUID();
  const now = Date.now();
  const db = getDb();

  db.transaction((tx) => {
    tx.insert(books)
      .values({ id, title, author, format, createdAt: now, updatedAt: now })
      .run();
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
