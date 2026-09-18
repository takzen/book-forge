/**
 * Shared page-estimation used by the chapter editor's page preview and by the
 * running page numbers shown around the app.
 *
 * Both used to implement their own variant of this: the editor reserved 25% of
 * the first page for the chapter title while the page-number calculation did
 * not, so the numbers drifted apart after the first multi-page chapter. There
 * is now exactly one implementation.
 *
 * These are estimates for on-screen feedback. The exported PDF is paginated by
 * the browser's own layout engine, which is the authority on where pages break.
 */

export const WORDS_PER_PAGE: Record<string, number> = {
  a4: 450,
  "six-by-nine": 280,
  a5: 240,
};

/** Share of the first page of a chapter taken up by the chapter heading. */
const FIRST_PAGE_TITLE_SHARE = 0.75;

/**
 * Block-level markdown costs more vertical space than its word count suggests.
 * Weighting them keeps long chapters from being under-paginated (which used to
 * push content past the bottom of a fixed-height preview sheet).
 */
const IMAGE_WORD_COST = 60;
const HEADING_WORD_COST = 12;
const CODE_BLOCK_LINE_COST = 8;

export function getWordsPerPage(format: string): number {
  return WORDS_PER_PAGE[format] ?? WORDS_PER_PAGE.a5;
}

export function countWords(text: string): number {
  return text.trim().match(/\S+/g)?.length ?? 0;
}

/** Approximate the vertical cost of one markdown block, in "word" units. */
function blockCost(block: string): number {
  let cost = countWords(block);

  const images = block.match(/!\[[^\]]*\]\([^)]*\)/g);
  if (images) {
    cost += images.length * IMAGE_WORD_COST;
  }

  if (/^\s{0,3}#{1,6}\s/.test(block)) {
    cost += HEADING_WORD_COST;
  }

  if (block.trimStart().startsWith("```")) {
    cost += block.split("\n").length * CODE_BLOCK_LINE_COST;
  }

  return cost;
}

/**
 * Split chapter markdown into page-sized chunks, breaking only between blocks
 * so a paragraph is never cut in half.
 */
export function splitContentIntoPages(content: string, format: string): string[] {
  if (!content.trim()) {
    return [""];
  }

  const wordsPerPage = getWordsPerPage(format);
  const firstPageWords = Math.floor(wordsPerPage * FIRST_PAGE_TITLE_SHARE);

  const blocks = content.split(/\n\n+/);
  const pages: string[] = [];
  let current: string[] = [];
  let currentCost = 0;

  for (const block of blocks) {
    const cost = blockCost(block);
    const limit = pages.length === 0 ? firstPageWords : wordsPerPage;

    if (current.length > 0 && currentCost + cost > limit) {
      pages.push(current.join("\n\n"));
      current = [block];
      currentCost = cost;
    } else {
      current.push(block);
      currentCost += cost;
    }
  }

  if (current.length > 0) {
    pages.push(current.join("\n\n"));
  }

  return pages.length > 0 ? pages : [""];
}

/** Estimated number of printed pages a chapter occupies (never less than 1). */
export function countPages(content: string, format: string): number {
  return Math.max(1, splitContentIntoPages(content, format).length);
}
