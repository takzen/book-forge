import { randomUUID } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { and, asc, desc, eq } from "drizzle-orm";
import JSZip from "jszip";
import { isTocChapter, splitChapters } from "@/lib/chapters";
import { toFilenameStem } from "@/lib/filename";
import { countPages } from "@/lib/pagination";
import { getDb } from "@/lib/db";
import { getBookUploadsDir } from "@/lib/storage";
import { bookSettings, books, chapters } from "@/lib/db/schema";

/** Cover + title page, rendered ahead of the table of contents. */
export const FRONT_MATTER_PAGES = 2;

export type NewBookInput = {
  title: string;
  author?: string;
  format?: "a5" | "a4" | "six-by-nine";
};

export type BookFormat = "a5" | "a4" | "six-by-nine";

export type BookFontFamily = "serif" | "sans" | "mono";

export type ChapterStart = "any" | "recto" | "verso";

export type BookSettingsInput = {
  fontFamily?: BookFontFamily;
  fontSizePt?: number;
  lineHeight?: number;
  marginTopMm?: number;
  marginBottomMm?: number;
  marginSideMm?: number;
  chapterStart?: ChapterStart;
};

export type BookSettings = {
  bookId: string;
  fontFamily: string;
  fontSizePt: number;
  lineHeight: number;
  marginTopMm: number;
  marginBottomMm: number;
  marginSideMm: number;
  chapterStart: string;
  updatedAt: number;
};

export const BOOK_FONT_FAMILIES: BookFontFamily[] = ["serif", "sans", "mono"];
export const CHAPTER_STARTS: ChapterStart[] = ["any", "recto", "verso"];

/** Bounds applied to every settings write, so a bad value can never reach the layout. */
export const SETTINGS_LIMITS = {
  fontSizePt: { min: 8, max: 18 },
  /** Stored as a percentage: 160 means 1.6. */
  lineHeight: { min: 100, max: 250 },
  marginMm: { min: 5, max: 40 },
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

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
  await rm(getBookUploadsDir(bookId), {
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
  const updates: BookSettingsInput & { updatedAt: number } = { updatedAt: now };

  if (input.fontFamily && BOOK_FONT_FAMILIES.includes(input.fontFamily)) {
    updates.fontFamily = input.fontFamily;
  }
  if (input.chapterStart && CHAPTER_STARTS.includes(input.chapterStart)) {
    updates.chapterStart = input.chapterStart;
  }
  if (typeof input.fontSizePt === "number" && Number.isFinite(input.fontSizePt)) {
    const { min, max } = SETTINGS_LIMITS.fontSizePt;
    updates.fontSizePt = clamp(input.fontSizePt, min, max);
  }
  if (typeof input.lineHeight === "number" && Number.isFinite(input.lineHeight)) {
    const { min, max } = SETTINGS_LIMITS.lineHeight;
    updates.lineHeight = clamp(input.lineHeight, min, max);
  }

  const { min: marginMin, max: marginMax } = SETTINGS_LIMITS.marginMm;
  for (const key of ["marginTopMm", "marginBottomMm", "marginSideMm"] as const) {
    const value = input[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      updates[key] = clamp(value, marginMin, marginMax);
    }
  }

  // Ensure the row exists before updating: books created before the settings
  // table was introduced have no row of their own.
  getBookSettings(bookId);

  getDb()
    .update(bookSettings)
    .set(updates)
    .where(eq(bookSettings.bookId, bookId))
    .run();
}

export function deleteChapter(bookId: string, chapterId: string) {
  const now = Date.now();
  const db = getDb();

  db.transaction((tx) => {
    // Scope the delete to the book as well: a chapter id alone would let a
    // stale or crafted request remove a chapter from a different book.
    tx.delete(chapters)
      .where(and(eq(chapters.id, chapterId), eq(chapters.bookId, bookId)))
      .run();
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

export function generateTocMarkdown(
  bookId: string,
  pageOrChapterId?: number | string,
  itemsPerPage = 16
): string {
  const chapterList = listChapters(bookId);
  const { tocChapters: existingTocs, regularChapters } = splitChapters(chapterList);

  if (regularChapters.length === 0) {
    return "# Spis treści\n\n*Brak rozdziałów do wyświetlenia.*";
  }

  let pageNumber = 1;
  if (typeof pageOrChapterId === "number") {
    pageNumber = Math.max(1, pageOrChapterId);
  } else if (typeof pageOrChapterId === "string" && pageOrChapterId) {
    const idx = existingTocs.findIndex((t) => t.id === pageOrChapterId);
    if (idx !== -1) {
      pageNumber = idx + 1;
    }
  }

  const startIndex = (pageNumber - 1) * itemsPerPage;
  const pageItems = regularChapters.slice(startIndex, startIndex + itemsPerPage);

  if (pageItems.length === 0 && pageNumber > 1) {
    return `### Spis treści (cd.)\n\n*(Brak kolejnych pozycji na tej stronie)*\n`;
  }

  const book = getBook(bookId);
  const format = book?.format ?? "a5";

  // Running page estimate, so the generated list carries the page each chapter
  // starts on instead of a bare chapter number.
  const frontMatterPages = FRONT_MATTER_PAGES + Math.max(existingTocs.length, 1);
  const startPages: number[] = [];
  let cursor = frontMatterPages + 1;
  for (const chapter of regularChapters) {
    startPages.push(cursor);
    cursor += countPages(chapter.content, format);
  }

  const titleHeader =
    pageNumber === 1 ? "# Spis treści\n\n" : `### Spis treści (cd.)\n\n`;

  let md = titleHeader;
  pageItems.forEach((ch, idx) => {
    const globalIdx = startIndex + idx;
    const title = ch.title || `Rozdział ${globalIdx + 1}`;
    md += `${globalIdx + 1}. **${title}** — s. ${startPages[globalIdx]}\n`;
  });

  return md;
}

export function createTocChapter(bookId: string) {
  const db = getDb();
  const now = Date.now();
  const existingChapters = listChapters(bookId);
  const existingTocs = existingChapters.filter(isTocChapter);

  const pageNumber = existingTocs.length + 1;
  const title = "Spis treści";
  const chapterId = randomUUID();
  const tocContent = generateTocMarkdown(bookId, pageNumber);

  // Insert right after the last TOC page, or at sortOrder: 0 if first
  let insertSortOrder = 0;
  if (existingTocs.length > 0) {
    const lastToc = existingTocs[existingTocs.length - 1];
    insertSortOrder = lastToc.sortOrder + 1;
  }

  db.transaction((tx) => {
    // Shift subsequent chapters down by 1
    existingChapters.forEach((ch) => {
      if (ch.sortOrder >= insertSortOrder) {
        tx.update(chapters)
          .set({ sortOrder: ch.sortOrder + 1, updatedAt: now })
          .where(eq(chapters.id, ch.id))
          .run();
      }
    });

    tx.insert(chapters)
      .values({
        id: chapterId,
        bookId,
        title,
        content: tocContent,
        type: "toc",
        sortOrder: insertSortOrder,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    tx.update(books).set({ updatedAt: now }).where(eq(books.id, bookId)).run();
  });

  return chapterId;
}

export function createChapter(bookId: string) {
  const db = getDb();
  const existingChapters = listChapters(bookId);
  const lastSortOrder = existingChapters.reduce(
    (max, chapter) => Math.max(max, chapter.sortOrder),
    -1
  );

  // Name the chapter after how many real chapters exist, not after its
  // sortOrder. Inserting table-of-contents pages shifts sortOrder, which used
  // to produce gaps like a fourth chapter called "Chapter 7".
  const chapterCount = existingChapters.filter(
    (chapter) => !isTocChapter(chapter)
  ).length;

  const now = Date.now();
  const chapterId = randomUUID();

  db.transaction((tx) => {
    tx.insert(chapters)
      .values({
        id: chapterId,
        bookId,
        title: `Chapter ${chapterCount + 1}`,
        content: "",
        sortOrder: lastSortOrder + 1,
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
  const sourceDir = getBookUploadsDir(sourceBookId);
  const targetDir = getBookUploadsDir(targetBookId);
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
    const safeTitle = toFilenameStem(ch.title, "chapter");
    chaptersFolder?.file(`${padded}_${safeTitle}.md`, ch.content);
  });

  const uploadsDir = getBookUploadsDir(bookId);
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

  const filename = `${toFilenameStem(book.title)}-export.zip`;

  return { filename, buffer: zipBuffer };
}

type ImportedChapter = {
  title?: string;
  content?: string;
  type?: string;
  sortOrder?: number;
};

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

  const targetUploadsDir = getBookUploadsDir(newBookId);
  const entries = Object.keys(zip.files).filter(
    (path) => path.startsWith("uploads/") && !zip.files[path].dir
  );

  if (entries.length > 0) {
    await mkdir(targetUploadsDir, { recursive: true });
    for (const entryPath of entries) {
      const filename = entryPath.replace(/^uploads\//, "");
      // Only accept plain filenames from the archive. Anything carrying a path
      // separator or a `..` segment is dropped rather than written outside the
      // book's own upload directory.
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(filename) || filename.includes("..")) {
        continue;
      }
      const fileData = await zip.files[entryPath].async("nodebuffer");
      await writeFile(join(targetUploadsDir, filename), fileData);
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

    const importNumber = (
      value: unknown,
      fallback: number,
      { min, max }: { min: number; max: number }
    ) =>
      typeof value === "number" && Number.isFinite(value)
        ? clamp(value, min, max)
        : fallback;

    tx.insert(bookSettings)
      .values({
        bookId: newBookId,
        fontFamily: BOOK_FONT_FAMILIES.includes(settingsData.fontFamily)
          ? settingsData.fontFamily
          : "serif",
        fontSizePt: importNumber(
          settingsData.fontSizePt,
          11,
          SETTINGS_LIMITS.fontSizePt
        ),
        lineHeight: importNumber(
          settingsData.lineHeight,
          160,
          SETTINGS_LIMITS.lineHeight
        ),
        marginTopMm: importNumber(
          settingsData.marginTopMm,
          20,
          SETTINGS_LIMITS.marginMm
        ),
        marginBottomMm: importNumber(
          settingsData.marginBottomMm,
          20,
          SETTINGS_LIMITS.marginMm
        ),
        marginSideMm: importNumber(
          settingsData.marginSideMm,
          18,
          SETTINGS_LIMITS.marginMm
        ),
        chapterStart: CHAPTER_STARTS.includes(settingsData.chapterStart)
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
      chaptersData.forEach((ch: ImportedChapter, idx: number) => {
        const content = replaceUploadUrls(ch.content ?? "");
        tx.insert(chapters)
          .values({
            id: randomUUID(),
            bookId: newBookId,
            title: ch.title || `Chapter ${idx + 1}`,
            content,
            type: ch.type === "toc" ? "toc" : "chapter",
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
