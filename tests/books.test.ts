import { describe, expect, it } from "vitest";
import {
  createBook,
  createChapter,
  deleteBook,
  duplicateBook,
  exportBookToZip,
  getBook,
  getBookSettings,
  importBookFromZip,
  listBooks,
  listChapters,
  reorderChapters,
  updateBook,
  updateBookCover,
  updateBookSettings,
  updateChapter,
} from "@/lib/books";

describe("Book Forge - Core Operations", () => {
  it("creates, updates, and reads a book and its chapters", () => {
    const bookId = createBook({
      title: "Test Book",
      author: "Test Author",
      format: "a5",
    });

    expect(bookId).toBeDefined();
    const book = getBook(bookId);
    expect(book).toBeDefined();
    expect(book?.title).toBe("Test Book");
    expect(book?.author).toBe("Test Author");
    expect(book?.format).toBe("a5");

    // Check default chapter was created
    const initialChapters = listChapters(bookId);
    expect(initialChapters.length).toBe(1);
    expect(initialChapters[0].title).toBe("Chapter 1");

    // Add a second chapter
    const chapter2Id = createChapter(bookId);
    updateChapter({
      bookId,
      chapterId: chapter2Id,
      title: "Second Chapter",
      content: "# Second Chapter\n\nContent goes here.",
    });

    const updatedChapters = listChapters(bookId);
    expect(updatedChapters.length).toBe(2);
    expect(updatedChapters[1].title).toBe("Second Chapter");

    // Reorder chapters
    reorderChapters(bookId, [chapter2Id, initialChapters[0].id]);
    const reordered = listChapters(bookId);
    expect(reordered[0].id).toBe(chapter2Id);
    expect(reordered[1].id).toBe(initialChapters[0].id);

    // Update settings
    updateBookSettings(bookId, {
      fontFamily: "sans",
      fontSizePt: 12,
      lineHeight: 170,
    });
    const settings = getBookSettings(bookId);
    expect(settings.fontFamily).toBe("sans");
    expect(settings.fontSizePt).toBe(12);

    // Cleanup
    deleteBook(bookId);
    expect(getBook(bookId)).toBeUndefined();
  });

  it("duplicates a book with chapters and custom settings", async () => {
    const originalBookId = createBook({
      title: "Original Work",
      author: "Original Author",
      format: "six-by-nine",
    });

    updateBookCover({
      id: originalBookId,
      coverDesign: JSON.stringify({ theme: "emerald", title: "Original Work" }),
      coverImage: `/api/uploads/${originalBookId}/cover.png`,
    });

    updateBookSettings(originalBookId, {
      fontFamily: "serif",
      marginTopMm: 25,
    });

    const ch2 = createChapter(originalBookId);
    updateChapter({
      bookId: originalBookId,
      chapterId: ch2,
      title: "Illustration Chapter",
      content: `Here is an illustration: ![diagram](/api/uploads/${originalBookId}/diagram.png)`,
    });

    // Duplicate
    const duplicatedBookId = await duplicateBook(originalBookId);
    expect(duplicatedBookId).not.toBe(originalBookId);

    const dupBook = getBook(duplicatedBookId);
    expect(dupBook?.title).toBe("Original Work (Copy)");
    expect(dupBook?.author).toBe("Original Author");
    expect(dupBook?.format).toBe("six-by-nine");
    // Verify upload URLs were remapped to the new book ID
    expect(dupBook?.coverImage).toBe(`/api/uploads/${duplicatedBookId}/cover.png`);

    const dupChapters = listChapters(duplicatedBookId);
    expect(dupChapters.length).toBe(2);
    const illChapter = dupChapters.find((c) => c.title === "Illustration Chapter");
    expect(illChapter?.content).toContain(`/api/uploads/${duplicatedBookId}/diagram.png`);

    const dupSettings = getBookSettings(duplicatedBookId);
    expect(dupSettings.marginTopMm).toBe(25);

    // Cleanup
    await deleteBook(originalBookId);
    await deleteBook(duplicatedBookId);
  });

  it("exports a book to ZIP and imports it back", async () => {
    const bookId = createBook({
      title: "ZIP Roundtrip Book",
      author: "Archiver",
      format: "a4",
    });

    const ch2 = createChapter(bookId);
    updateChapter({
      bookId,
      chapterId: ch2,
      title: "Archived Notes",
      content: "## Notes\n\nThese notes were preserved across archive exports.",
    });

    // Export to ZIP
    const { filename, buffer } = await exportBookToZip(bookId);
    expect(filename).toContain(".zip");
    expect(buffer.length).toBeGreaterThan(0);

    // Import from ZIP
    const importedBookId = await importBookFromZip(buffer);
    expect(importedBookId).toBeDefined();

    const importedBook = getBook(importedBookId);
    expect(importedBook?.title).toBe("ZIP Roundtrip Book");
    expect(importedBook?.author).toBe("Archiver");
    expect(importedBook?.format).toBe("a4");

    const importedChapters = listChapters(importedBookId);
    expect(importedChapters.length).toBe(2);
    const noteChapter = importedChapters.find((c) => c.title === "Archived Notes");
    expect(noteChapter?.content).toContain("These notes were preserved across archive exports.");

    // Cleanup
    await deleteBook(bookId);
    await deleteBook(importedBookId);
  });
});
