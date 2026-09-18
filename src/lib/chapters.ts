/**
 * Pure chapter helpers shared by server code and client components.
 *
 * Keep this module free of node-only imports: the sidebar, the editor and the
 * book preview are client components and cannot pull in `lib/books.ts`.
 */

export type ChapterLike = {
  id: string;
  title: string;
  type?: string | null;
};

/**
 * Titles that identify a legacy table-of-contents chapter, i.e. one created
 * before chapters carried an explicit `type`.
 *
 * Matching is exact (after trimming an optional "(cd.)" continuation suffix)
 * rather than a substring test. A substring test classified any chapter whose
 * title merely mentioned a table of contents — "Jak czytać spis treści" — as a
 * TOC page, which removed it from the manuscript entirely.
 */
const LEGACY_TOC_TITLES = new Set([
  "spis treści",
  "spis tresci",
  "table of contents",
  "contents",
]);

export function isTocChapter(chapter: ChapterLike): boolean {
  if (chapter.type === "toc") {
    return true;
  }

  const normalised = chapter.title
    .toLowerCase()
    .replace(/\s*\((cd\.?|cont\.?|continued)\)\s*$/i, "")
    .trim();

  return LEGACY_TOC_TITLES.has(normalised);
}

export function splitChapters<T extends ChapterLike>(chapters: T[]) {
  const tocChapters: T[] = [];
  const regularChapters: T[] = [];

  for (const chapter of chapters) {
    if (isTocChapter(chapter)) {
      tocChapters.push(chapter);
    } else {
      regularChapters.push(chapter);
    }
  }

  return { tocChapters, regularChapters };
}
