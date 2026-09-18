import { describe, expect, it } from "vitest";
import {
  createBook,
  createChapter,
  createTocChapter,
  deleteBook,
  getBookSettings,
  listChapters,
  updateBookSettings,
} from "@/lib/books";
import { isTocChapter, splitChapters } from "@/lib/chapters";
import { toFilenameStem } from "@/lib/filename";
import { countPages, splitContentIntoPages } from "@/lib/pagination";

describe("table-of-contents detection", () => {
  it("recognises explicit TOC chapters and legacy titles", () => {
    expect(isTocChapter({ id: "1", title: "Cokolwiek", type: "toc" })).toBe(true);
    expect(isTocChapter({ id: "2", title: "Spis treści" })).toBe(true);
    expect(isTocChapter({ id: "3", title: "Spis treści (cd.)" })).toBe(true);
    expect(isTocChapter({ id: "4", title: "Table of Contents" })).toBe(true);
  });

  it("leaves ordinary chapters that merely mention a contents page alone", () => {
    // A substring match used to classify these as TOC pages and drop them from
    // the manuscript entirely.
    expect(isTocChapter({ id: "5", title: "Jak czytać spis treści" })).toBe(false);
    expect(isTocChapter({ id: "6", title: "O spisie treści i indeksach" })).toBe(false);
  });

  it("partitions a chapter list without losing anything", () => {
    const chapters = [
      { id: "a", title: "Spis treści", type: "toc" },
      { id: "b", title: "Rozdział pierwszy" },
      { id: "c", title: "Jak czytać spis treści" },
    ];
    const { tocChapters, regularChapters } = splitChapters(chapters);
    expect(tocChapters.map((c) => c.id)).toEqual(["a"]);
    expect(regularChapters.map((c) => c.id)).toEqual(["b", "c"]);
  });
});

describe("pagination", () => {
  it("keeps countPages and splitContentIntoPages in agreement", () => {
    const content = Array.from({ length: 40 }, (_, i) =>
      `Akapit ${i}. ${"słowo ".repeat(30)}`
    ).join("\n\n");

    expect(countPages(content, "a5")).toBe(splitContentIntoPages(content, "a5").length);
    expect(countPages(content, "a4")).toBe(splitContentIntoPages(content, "a4").length);
  });

  it("never returns fewer than one page, even for empty chapters", () => {
    expect(splitContentIntoPages("", "a5")).toEqual([""]);
    expect(countPages("", "a5")).toBe(1);
  });

  it("gives a larger format fewer pages for the same text", () => {
    const content = Array.from({ length: 60 }, () => "słowo ".repeat(40)).join("\n\n");
    expect(countPages(content, "a4")).toBeLessThan(countPages(content, "a5"));
  });

  it("charges images for the vertical space they take", () => {
    const text = "Akapit z tekstem. ".repeat(20);
    const withImages = `${text}\n\n![a](/api/uploads/x/a.png)\n\n![b](/api/uploads/x/b.png)\n\n${text}`;
    const withoutImages = `${text}\n\n${text}`;

    expect(countPages(withImages, "a5")).toBeGreaterThan(
      countPages(withoutImages, "a5")
    );
  });

  it("never splits a paragraph in half", () => {
    const paragraphs = Array.from({ length: 30 }, (_, i) => `Akapit-${i} ${"x ".repeat(50)}`);
    const pages = splitContentIntoPages(paragraphs.join("\n\n"), "a5");

    const rejoined = pages.join("\n\n").split(/\n\n+/).map((p) => p.trim());
    expect(rejoined).toEqual(paragraphs.map((p) => p.trim()));
  });
});

describe("filenames", () => {
  it("transliterates Polish diacritics instead of dropping the letters", () => {
    // The old regex reduced this to "ksi-ka".
    expect(toFilenameStem("Książka")).toBe("ksiazka");
    expect(toFilenameStem("Zażółć gęślą jaźń")).toBe("zazolc-gesla-jazn");
  });

  it("falls back when nothing survives sanitising", () => {
    expect(toFilenameStem("日本語")).toBe("book");
    expect(toFilenameStem("???", "chapter")).toBe("chapter");
  });
});

describe("chapter creation", () => {
  it("numbers new chapters by chapter count, not by sortOrder", () => {
    const bookId = createBook({ title: "Numbering", format: "a5" });
    try {
      // Inserting contents pages shifts sortOrder; the fourth chapter used to
      // end up called "Chapter 7" because of it.
      createTocChapter(bookId);
      createTocChapter(bookId);
      createChapter(bookId);

      const titles = listChapters(bookId)
        .filter((chapter) => !isTocChapter(chapter))
        .map((chapter) => chapter.title);

      expect(titles).toEqual(["Chapter 1", "Chapter 2"]);
    } finally {
      deleteBook(bookId);
    }
  });
});

describe("book settings", () => {
  it("clamps out-of-range values instead of storing them", () => {
    const bookId = createBook({ title: "Settings", format: "a5" });
    try {
      updateBookSettings(bookId, {
        fontSizePt: 999,
        lineHeight: 5,
        marginTopMm: -20,
        marginSideMm: 400,
      });

      const settings = getBookSettings(bookId);
      expect(settings.fontSizePt).toBe(18);
      expect(settings.lineHeight).toBe(100);
      expect(settings.marginTopMm).toBe(5);
      expect(settings.marginSideMm).toBe(40);
    } finally {
      deleteBook(bookId);
    }
  });

  it("ignores unknown font families and chapter-start values", () => {
    const bookId = createBook({ title: "Settings 2", format: "a5" });
    try {
      updateBookSettings(bookId, {
        // @ts-expect-error deliberately invalid, as an untrusted import would be
        fontFamily: "comic-sans",
        // @ts-expect-error deliberately invalid
        chapterStart: "sideways",
      });

      const settings = getBookSettings(bookId);
      expect(settings.fontFamily).toBe("serif");
      expect(settings.chapterStart).toBe("any");
    } finally {
      deleteBook(bookId);
    }
  });

  it("creates a settings row on demand for books that predate the table", () => {
    const bookId = createBook({ title: "Settings 3", format: "a5" });
    try {
      updateBookSettings(bookId, { fontSizePt: 13 });
      expect(getBookSettings(bookId).fontSizePt).toBe(13);
    } finally {
      deleteBook(bookId);
    }
  });
});
