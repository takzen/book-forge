import { randomUUID } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { and, asc, desc, eq } from "drizzle-orm";
import JSZip from "jszip";
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

export function updateBookCover({
  id,
  coverDesign,
  coverImage,
}: {
  id: string;
  coverDesign?: string;
  coverImage?: string;
}) {
  const now = Date.now();
  const updates: Record<string, unknown> = { updatedAt: now };
  if (coverDesign !== undefined) updates.coverDesign = coverDesign;
  if (coverImage !== undefined) updates.coverImage = coverImage;

  getDb().update(books).set(updates).where(eq(books.id, id)).run();
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

async function copyUploadsDir(sourceBookId: string, targetBookId: string) {
  const sourceDir = join(process.cwd(), "data", "uploads", sourceBookId);
  const targetDir = join(process.cwd(), "data", "uploads", targetBookId);
  try {
    const stats = await stat(sourceDir);
    if (stats.isDirectory()) {
      await mkdir(targetDir, { recursive: true });
      await cp(sourceDir, targetDir, { recursive: true });
    }
  } catch {
    // Directory might not exist if no uploads yet
  }
}

export async function duplicateBook(bookId: string) {
  const db = getDb();
  const original = db.select().from(books).where(eq(books.id, bookId)).get();
  if (!original) {
    throw new Error("Book not found");
  }

  const originalSettings = db.select().from(bookSettings).where(eq(bookSettings.bookId, bookId)).get();
  const originalChapters = db
    .select()
    .from(chapters)
    .where(eq(chapters.bookId, bookId))
    .orderBy(asc(chapters.sortOrder), asc(chapters.createdAt))
    .all();

  const newBookId = randomUUID();
  const now = Date.now();

  await copyUploadsDir(bookId, newBookId);

  const urlRegex = new RegExp(`/api/uploads/${bookId}/`, "g");
  const newCoverImage = (original.coverImage || "").replace(urlRegex, `/api/uploads/${newBookId}/`);
  const newCoverDesign = (original.coverDesign || "").replace(urlRegex, `/api/uploads/${newBookId}/`);

  db.transaction((tx) => {
    tx.insert(books)
      .values({
        id: newBookId,
        title: `${original.title} (Copy)`,
        author: original.author,
        description: original.description,
        format: original.format,
        status: original.status,
        coverImage: newCoverImage,
        coverDesign: newCoverDesign,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    if (originalSettings) {
      tx.insert(bookSettings)
        .values({
          bookId: newBookId,
          fontFamily: originalSettings.fontFamily,
          fontSizePt: originalSettings.fontSizePt,
          lineHeight: originalSettings.lineHeight,
          marginTopMm: originalSettings.marginTopMm,
          marginBottomMm: originalSettings.marginBottomMm,
          marginSideMm: originalSettings.marginSideMm,
          chapterStart: originalSettings.chapterStart,
          updatedAt: now,
        })
        .run();
    } else {
      tx.insert(bookSettings).values({ bookId: newBookId, updatedAt: now }).run();
    }

    for (const chapter of originalChapters) {
      const newContent = (chapter.content || "").replace(urlRegex, `/api/uploads/${newBookId}/`);
      tx.insert(chapters)
        .values({
          id: randomUUID(),
          bookId: newBookId,
          parentId: chapter.parentId,
          title: chapter.title,
          content: newContent,
          type: chapter.type,
          sortOrder: chapter.sortOrder,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }
  });

  return newBookId;
}

export async function exportBookToZip(bookId: string): Promise<{ filename: string; buffer: Buffer }> {
  const db = getDb();
  const book = db.select().from(books).where(eq(books.id, bookId)).get();
  if (!book) {
    throw new Error("Book not found");
  }

  const settings = getBookSettings(bookId);
  const chapterList = listChapters(bookId);

  const zip = new JSZip();

  const metadata = {
    version: "1.0",
    bookForge: true,
    exportedAt: new Date().toISOString(),
    book: {
      title: book.title,
      author: book.author,
      description: book.description,
      format: book.format,
      status: book.status,
      coverDesign: book.coverDesign,
      coverImage: book.coverImage,
    },
    settings: {
      fontFamily: settings.fontFamily,
      fontSizePt: settings.fontSizePt,
      lineHeight: settings.lineHeight,
      marginTopMm: settings.marginTopMm,
      marginBottomMm: settings.marginBottomMm,
      marginSideMm: settings.marginSideMm,
      chapterStart: settings.chapterStart,
    },
    chapters: chapterList.map((ch) => ({
      title: ch.title,
      sortOrder: ch.sortOrder,
      type: ch.type,
      content: ch.content,
    })),
  };

  zip.file("book.json", JSON.stringify(metadata, null, 2));

  const chaptersFolder = zip.folder("chapters");
  chapterList.forEach((ch, idx) => {
    const padded = String(idx + 1).padStart(2, "0");
    const safeTitle = ch.title.toLowerCase().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
    chaptersFolder?.file(`${padded}_${safeTitle || "chapter"}.md`, ch.content);
  });

  const uploadsDir = join(process.cwd(), "data", "uploads", bookId);
  try {
    const stats = await stat(uploadsDir);
    if (stats.isDirectory()) {
      const files = await readdir(uploadsDir);
      const uploadsFolder = zip.folder("uploads");
      for (const file of files) {
        const filePath = join(uploadsDir, file);
        const fileStat = await stat(filePath);
        if (fileStat.isFile()) {
          const content = await readFile(filePath);
          uploadsFolder?.file(file, content);
        }
      }
    }
  } catch {
    // No uploads directory exists
  }

  const zipBuffer = (await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  })) as Buffer;

  const safeBookTitle = book.title.toLowerCase().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
  const filename = `${safeBookTitle || "book"}-export.zip`;

  return { filename, buffer: zipBuffer };
}

export async function importBookFromZip(zipBuffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(zipBuffer);
  const bookJsonFile = zip.file("book.json");
  if (!bookJsonFile) {
    throw new Error("Invalid Book Forge archive: missing book.json");
  }

  const jsonContent = await bookJsonFile.async("string");
  const data = JSON.parse(jsonContent);

  if (!data.book || !data.book.title) {
    throw new Error("Invalid book structure in book.json");
  }

  const newBookId = randomUUID();
  const now = Date.now();
  const db = getDb();

  const targetUploadsDir = join(process.cwd(), "data", "uploads", newBookId);
  const entries = Object.keys(zip.files).filter(
    (path) => path.startsWith("uploads/") && !zip.files[path].dir
  );

  if (entries.length > 0) {
    await mkdir(targetUploadsDir, { recursive: true });
    for (const entryPath of entries) {
      const filename = entryPath.replace(/^uploads\//, "");
      if (filename && !filename.includes("/")) {
        const fileData = await zip.files[entryPath].async("nodebuffer");
        await writeFile(join(targetUploadsDir, filename), fileData);
      }
    }
  }

  const replaceUploadUrls = (str: string) => {
    if (!str) return str;
    return str.replace(/\/api\/uploads\/[0-9a-f-]{36}\//gi, `/api/uploads/${newBookId}/`);
  };

  const bookData = data.book;
  const settingsData = data.settings ?? {};
  const chaptersData = Array.isArray(data.chapters) ? data.chapters : [];

  const coverDesign = replaceUploadUrls(bookData.coverDesign ?? "");
  const coverImage = replaceUploadUrls(bookData.coverImage ?? "");

  db.transaction((tx) => {
    tx.insert(books)
      .values({
        id: newBookId,
        title: bookData.title,
        author: bookData.author ?? "",
        description: bookData.description ?? "",
        format: ["a5", "a4", "six-by-nine"].includes(bookData.format)
          ? bookData.format
          : "a5",
        status: bookData.status ?? "draft",
        coverDesign,
        coverImage,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    tx.insert(bookSettings)
      .values({
        bookId: newBookId,
        fontFamily: settingsData.fontFamily ?? "serif",
        fontSizePt:
          typeof settingsData.fontSizePt === "number"
            ? settingsData.fontSizePt
            : 11,
        lineHeight:
          typeof settingsData.lineHeight === "number"
            ? settingsData.lineHeight
            : 160,
        marginTopMm:
          typeof settingsData.marginTopMm === "number"
            ? settingsData.marginTopMm
            : 20,
        marginBottomMm:
          typeof settingsData.marginBottomMm === "number"
            ? settingsData.marginBottomMm
            : 20,
        marginSideMm:
          typeof settingsData.marginSideMm === "number"
            ? settingsData.marginSideMm
            : 18,
        chapterStart: ["any", "recto", "verso"].includes(
          settingsData.chapterStart
        )
          ? settingsData.chapterStart
          : "any",
        updatedAt: now,
      })
      .run();

    if (chaptersData.length === 0) {
      tx.insert(chapters)
        .values({
          id: randomUUID(),
          bookId: newBookId,
          title: "Chapter 1",
          content: "# Chapter 1\n\n",
          sortOrder: 0,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    } else {
      chaptersData.forEach((ch: any, idx: number) => {
        const content = replaceUploadUrls(ch.content ?? "");
        tx.insert(chapters)
          .values({
            id: randomUUID(),
            bookId: newBookId,
            title: ch.title || `Chapter ${idx + 1}`,
            content,
            type: ch.type || "chapter",
            sortOrder: typeof ch.sortOrder === "number" ? ch.sortOrder : idx,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      });
    }
  });

  return newBookId;
}
