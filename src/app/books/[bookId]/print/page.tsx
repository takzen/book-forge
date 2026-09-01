import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getBook, listChapters } from "@/lib/books";

export const dynamic = "force-dynamic";

type PrintPageProps = {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ font?: string; size?: string; profile?: string }>;
};

const FORMAT_SPECS: Record<string, { width: string; height: string; sizeName: string }> = {
  a5: { width: "148mm", height: "210mm", sizeName: "148mm 210mm" },
  "six-by-nine": { width: "152.4mm", height: "228.6mm", sizeName: "152.4mm 228.6mm" },
  a4: { width: "210mm", height: "297mm", sizeName: "210mm 297mm" },
};

export default async function BookPrintPage({ params, searchParams }: PrintPageProps) {
  const { bookId } = await params;
  const { font = "serif", size = "11" } = await searchParams;
  const book = getBook(bookId);

  if (!book) {
    notFound();
  }

  const chapters = listChapters(bookId);
  const formatSpec = FORMAT_SPECS[book.format] || FORMAT_SPECS.a5;

  const fontClass =
    font === "sans" ? "font-sans" : font === "mono" ? "font-mono" : "font-serif";

  const totalWords = chapters.reduce((sum, ch) => {
    const words = ch.content.trim().match(/\S+/g);
    return sum + (words?.length ?? 0);
  }, 0);

  return (
    <div className={`bg-white text-[#1d241d] ${fontClass}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: ${formatSpec.sizeName};
          margin: 0;
        }
        body {
          background: #ffffff !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .page {
          width: ${formatSpec.width};
          height: ${formatSpec.height};
          min-height: ${formatSpec.height};
          max-height: ${formatSpec.height};
          page-break-after: always;
          break-after: page;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 22mm 20mm 18mm 20mm;
          background: #ffffff;
          box-sizing: border-box;
        }
        .cover-page {
          padding: 0 !important;
          background: #f7f3eb;
        }
      ` }} />

      {/* 1. COVER PAGE */}
      <section className="page cover-page">
        {book.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverImage}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col justify-between border-[12px] border-[#b15636] p-16 text-center">
            <p className="font-sans text-xs font-bold tracking-[0.25em] text-[#b15636] uppercase">BOOK FORGE EDITION</p>
            <div>
              <h1 className="font-serif text-5xl font-bold tracking-tight text-[#1d241d]">{book.title}</h1>
              <p className="mt-4 text-xl text-[#52604e]">A Work in Progress</p>
            </div>
            <div>
              <p className="font-serif text-lg italic text-[#1d241d]">{book.author || "Anonymous Author"}</p>
              <p className="mt-2 text-xs uppercase tracking-widest text-[#8c9785]">{book.format.toUpperCase()} · MANUSCRIPT</p>
            </div>
          </div>
        )}
      </section>

      {/* 2. HALF-TITLE & TITLE PAGE */}
      <section className="page text-center">
        <div />
        <div>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-[#1d241d]">{book.title}</h1>
          <div className="mx-auto my-6 h-[1px] w-16 bg-[#b15636]" />
          <p className="font-serif text-xl italic text-[#52604e]">{book.author || "Anonymous Author"}</p>
        </div>
        <div className="border-t border-[#1d241d]/15 pt-6 text-xs text-[#66705f]">
          <p className="font-semibold text-[#1d241d]">{book.title}</p>
          <p className="mt-1">First Edition · {new Date().getFullYear()}</p>
          <p className="mt-0.5">Typeset locally with Book Forge · {totalWords.toLocaleString()} words · {chapters.length} chapters</p>
        </div>
      </section>

      {/* 3. TABLE OF CONTENTS */}
      <section className="page">
        <header className="border-b border-[#1d241d]/20 pb-4 text-center">
          <h2 className="font-serif text-2xl font-bold tracking-tight uppercase">Contents</h2>
          <p className="mt-1 text-xs text-[#66705f]">Spis Treści</p>
        </header>

        <nav className="my-6 flex-1 space-y-3">
          {chapters.map((chapter, idx) => (
            <div
              key={chapter.id}
              className="flex items-baseline justify-between border-b border-dotted border-[#1d241d]/25 pb-1 text-sm text-[#1d241d]"
            >
              <span className="font-serif font-semibold">
                <span className="mr-3 font-sans text-xs text-[#b15636]">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                {chapter.title || "Untitled Chapter"}
              </span>
              <span className="font-mono text-xs text-[#66705f]">Ch. {idx + 1}</span>
            </div>
          ))}
        </nav>

        <footer className="border-t border-[#1d241d]/15 pt-3 text-center text-xs text-[#8c9785]">
          — Contents —
        </footer>
      </section>

      {/* 4. CHAPTER PAGES */}
      {chapters.map((chapter, idx) => (
        <section
          key={chapter.id}
          className="page"
          style={{ fontSize: `${size}pt` }}
        >
          <div className="flex items-center justify-between border-b border-[#1d241d]/15 pb-2 text-[0.75rem] text-[#66705f]">
            <span className="font-serif italic">{book.title}</span>
            <span className="font-sans uppercase tracking-wider">Chapter {idx + 1}</span>
          </div>

          <div className="flex-1 py-6">
            <div className="mb-6">
              <p className="text-xs font-bold tracking-[0.2em] text-[#b15636] uppercase">Chapter {idx + 1}</p>
              <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#1d241d]">{chapter.title}</h2>
              <div className="mt-3 h-[1px] w-12 bg-[#b15636]" />
            </div>

            <article className={`markdown-preview ${fontClass} leading-relaxed text-[#222822]`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {chapter.content}
              </ReactMarkdown>
            </article>
          </div>

          <div className="border-t border-[#1d241d]/15 pt-2 text-center text-xs font-mono text-[#66705f]">
            — {idx + 4} —
          </div>
        </section>
      ))}
    </div>
  );
}
