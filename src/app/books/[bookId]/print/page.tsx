import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FRONT_MATTER_PAGES,
  getBook,
  getBookSettings,
  listChapters,
} from "@/lib/books";
import { splitChapters } from "@/lib/chapters";
import { countPages } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type PrintPageProps = {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ font?: string; size?: string; profile?: string }>;
};

const FORMAT_SPECS: Record<
  string,
  { widthMm: number; heightMm: number; sizeName: string }
> = {
  a5: { widthMm: 148, heightMm: 210, sizeName: "148mm 210mm" },
  "six-by-nine": { widthMm: 152.4, heightMm: 228.6, sizeName: "152.4mm 228.6mm" },
  a4: { widthMm: 210, heightMm: 297, sizeName: "210mm 297mm" },
};

const FONT_CLASSES: Record<string, string> = {
  serif: "font-book-serif",
  sans: "font-book-sans",
  mono: "font-book-mono",
};

/**
 * Mirrors the `--font-book-*` theme values. The `@page` margin box that prints
 * the folio cannot read a Tailwind class, so the stack is repeated literally.
 */
const FOLIO_FONT_STACKS: Record<string, string> = {
  serif: 'Georgia, "Times New Roman", Times, serif',
  sans: '"Segoe UI", -apple-system, "Helvetica Neue", Arial, sans-serif',
  mono: 'Consolas, "SFMono-Regular", "Courier New", monospace',
};

export default async function BookPrintPage({ params, searchParams }: PrintPageProps) {
  const { bookId } = await params;
  const query = await searchParams;
  const book = getBook(bookId);

  if (!book) {
    notFound();
  }

  const settings = getBookSettings(bookId);
  const chapters = listChapters(bookId);
  const { tocChapters, regularChapters } = splitChapters(chapters);
  const formatSpec = FORMAT_SPECS[book.format] || FORMAT_SPECS.a5;

  // Saved book settings are the baseline; the query string lets the preview
  // screen try a different font or size without saving first.
  const requestedSize = Number(query.size);
  const fontSizePt =
    Number.isFinite(requestedSize) && requestedSize >= 8 && requestedSize <= 18
      ? requestedSize
      : settings.fontSizePt;

  const fontKey =
    query.font && FONT_CLASSES[query.font] ? query.font : settings.fontFamily;
  const fontClass = FONT_CLASSES[fontKey] ?? "font-book-serif";

  const lineHeight = settings.lineHeight / 100;
  const isPrintProfile = query.profile === "print";

  // A print-shop profile drops the warm paper tint and pushes the text to near
  // black, so nothing is laid down as a light ink wash on real paper.
  const bodyColor = isPrintProfile ? "#000000" : "#1d241d";
  const mutedColor = isPrintProfile ? "#3a3a3a" : "#52604e";
  const coverBackground = isPrintProfile ? "#ffffff" : "#f7f3eb";

  const { marginTopMm, marginBottomMm, marginSideMm } = settings;

  // Exact printable height. The title page used to be sized with `100vh`, which
  // in a headless render is the browser viewport (720px), not the page box — it
  // overflowed by ~77px and pushed a blank page into every export.
  const contentHeightMm = formatSpec.heightMm - marginTopMm - marginBottomMm;

  // "recto" starts each chapter on a right-hand page, "verso" on a left-hand
  // one; Chromium implements these as `break-before: right | left`.
  const chapterBreak =
    settings.chapterStart === "recto"
      ? "right"
      : settings.chapterStart === "verso"
        ? "left"
        : "page";

  // `page-break-before` is the legacy alias of `break-before` and would reset it
  // if it were emitted as a blanket `always` alongside `left` / `right`.
  const legacyChapterBreak = chapterBreak === "page" ? "always" : chapterBreak;

  // Running page estimate for the generated contents list.
  const tocPageCount = Math.max(tocChapters.length, 1);
  const firstBodyPage = FRONT_MATTER_PAGES + tocPageCount + 1;
  const chapterStartPages: number[] = [];
  let cursor = firstBodyPage;
  for (const chapter of regularChapters) {
    chapterStartPages.push(cursor);
    cursor += countPages(chapter.content, book.format);
  }

  return (
    <div
      className={`bg-white ${fontClass}`}
      style={{ fontSize: `${fontSizePt}pt`, color: bodyColor, lineHeight }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @page {
          size: ${formatSpec.sizeName};
          margin: ${marginTopMm}mm ${marginSideMm}mm ${marginBottomMm}mm ${marginSideMm}mm;
          @bottom-center {
            content: counter(page);
            font-size: 9pt;
            color: ${isPrintProfile ? "#000000" : "#8c9785"};
            font-family: ${FOLIO_FONT_STACKS[fontKey] ?? FOLIO_FONT_STACKS.serif};
          }
        }
        @page :first {
          margin: 0;
          @bottom-center { content: none; }
        }
        html, body {
          background: #ffffff !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .cover-page {
          width: ${formatSpec.widthMm}mm;
          height: ${formatSpec.heightMm}mm;
          overflow: hidden;
          background: ${coverBackground};
          break-after: page;
          page-break-after: always;
        }
        /*
         * Sized against the real page box rather than the viewport, so the
         * title page occupies exactly one printed page.
         */
        .front-matter-page {
          height: ${contentHeightMm}mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          break-before: page;
          page-break-before: always;
          break-after: page;
          page-break-after: always;
        }
        .toc-page {
          min-height: ${contentHeightMm}mm;
          break-before: page;
          page-break-before: always;
        }
        .chapter-content {
          break-before: ${chapterBreak};
          page-break-before: ${legacyChapterBreak};
        }
        .chapter-opening {
          margin-bottom: 1.4em;
          break-after: avoid;
          page-break-after: avoid;
        }
        .toc-list {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .toc-entry {
          display: flex;
          align-items: baseline;
          gap: 0.5em;
          margin-bottom: 0.65em;
          break-inside: avoid;
        }
        .toc-leader {
          flex: 1;
          border-bottom: 1px dotted currentColor;
          opacity: 0.45;
          transform: translateY(-0.2em);
        }
        .toc-page-number {
          font-variant-numeric: tabular-nums;
        }
      `,
        }}
      />

      {/* 1. COVER */}
      <section className="cover-page">
        {book.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.coverImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col justify-between border-[12px] border-[#b15636] p-16 text-center">
            <p className="font-sans text-xs font-bold tracking-[0.25em] text-[#b15636] uppercase">
              EDYCJA BOOK FORGE
            </p>
            <div>
              <h1 className="font-serif text-5xl font-bold tracking-tight">{book.title}</h1>
              <p className="mt-4 text-xl" style={{ color: mutedColor }}>
                Rękopis
              </p>
            </div>
            <div>
              <p className="font-serif text-lg italic">{book.author || "Anonimowy Autor"}</p>
              <p className="mt-2 text-xs tracking-widest uppercase" style={{ color: mutedColor }}>
                {book.format.toUpperCase()} · MANUSKRYPT
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 2. TITLE PAGE */}
      <section className="front-matter-page text-center">
        <h1 className="text-4xl font-bold tracking-tight">{book.title}</h1>
        <p className="mt-6 text-xl" style={{ color: mutedColor }}>
          {book.author || "Anonimowy Autor"}
        </p>
      </section>

      {/* 3. TABLE OF CONTENTS */}
      {tocChapters.length > 0 ? (
        // The book carries hand-written contents pages: print those, and do not
        // also generate one. They used to be printed twice — once as a
        // generated list and again as ordinary chapters.
        tocChapters.map((chapter) => (
          <section key={chapter.id} className={`toc-page book-prose ${fontClass}`}>
            <h2 className="text-3xl font-bold">{chapter.title || "Spis treści"}</h2>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{chapter.content}</ReactMarkdown>
          </section>
        ))
      ) : (
        <section className="toc-page">
          <h2 className="mb-8 text-3xl font-bold">Spis treści</h2>
          <ul className="toc-list">
            {regularChapters.map((chapter, index) => (
              <li key={chapter.id} className="toc-entry">
                <span className="font-medium">
                  {chapter.title || `Rozdział ${index + 1}`}
                </span>
                <span className="toc-leader" />
                <span className="toc-page-number">{chapterStartPages[index]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. CHAPTERS */}
      {regularChapters.map((chapter, index) => (
        <section key={chapter.id} className={`chapter-content book-prose ${fontClass}`}>
          <div className="chapter-opening">
            <h2 className="text-3xl font-bold">
              {chapter.title || `Rozdział ${index + 1}`}
            </h2>
          </div>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{chapter.content}</ReactMarkdown>
        </section>
      ))}
    </div>
  );
}
