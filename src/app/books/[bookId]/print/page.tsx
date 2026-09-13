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
    <div className={`bg-white text-[#1d241d] ${fontClass}`} style={{ fontSize: `${size}pt` }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: ${formatSpec.sizeName};
          margin: 22mm 20mm 18mm 20mm;
          @bottom-center {
            content: '— ' counter(page) ' —';
            font-size: 9pt;
            color: #8c9785;
            font-family: ui-monospace, monospace;
          }
        }
        @page :first {
          margin: 0;
          @bottom-center { content: none; }
        }
        body {
          background: #ffffff !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .cover-page {
          width: ${formatSpec.width};
          height: ${formatSpec.height};
          padding: 0;
          background: #f7f3eb;
          display: flex;
          flex-direction: column;
          page-break-after: always;
          break-after: page;
        }
        .front-matter-page {
          break-before: page;
          page-break-before: always;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .chapter-content {
          break-before: page;
          page-break-before: always;
          padding-top: 2rem;
        }
        .toc-page {
          break-before: page;
          page-break-before: always;
          padding-top: 2rem;
        }
        .prose p {
          margin-bottom: 1em;
          text-align: justify;
        }
        .prose h1, .prose h2, .prose h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          page-break-after: avoid;
          break-after: avoid;
        }
      ` }} />

      {/* 1. COVER PAGE */}
      <section className="cover-page">
        {book.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverImage}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col justify-between border-[12px] border-[#b15636] p-16 text-center">
            <p className="font-sans text-xs font-bold tracking-[0.25em] text-[#b15636] uppercase">EDYCJA BOOK FORGE</p>
            <div>
              <h1 className="font-serif text-5xl font-bold tracking-tight text-[#1d241d]">{book.title}</h1>
              <p className="mt-4 text-xl text-[#52604e]">Rękopis</p>
            </div>
            <div>
              <p className="font-serif text-lg italic text-[#1d241d]">{book.author || "Anonimowy Autor"}</p>
              <p className="mt-2 text-xs uppercase tracking-widest text-[#8c9785]">{book.format.toUpperCase()} · MANUSKRYPT</p>
            </div>
          </div>
        )}
      </section>

      {/* 2. TITLE PAGE */}
      <section className="front-matter-page text-center">
        <h1 className="text-4xl font-bold tracking-tight">{book.title}</h1>
        <p className="mt-6 text-xl text-[#52604e]">{book.author || "Anonimowy Autor"}</p>
      </section>

      {/* 3. COPYRIGHT / IMPRINT PAGE */}
      <section className="front-matter-page text-center text-sm text-[#52604e] flex flex-col justify-end pb-20">
        <div className="max-w-xs mx-auto space-y-4">
          <p className="font-semibold text-base text-[#1d241d]">{book.title}</p>
          <p>© {new Date().getFullYear()} {book.author || "Anonimowy Autor"}</p>
          <p>Wszelkie prawa zastrzeżone</p>
          <div className="h-px w-12 bg-[#8c9785] mx-auto my-6"></div>
          <p>Wydanie pierwsze · {new Date().getFullYear()}</p>
          <p>Liczba słów: {totalWords.toLocaleString('pl-PL')}</p>
          <p>Liczba rozdziałów: {chapters.length}</p>
          <p className="mt-8 font-mono text-xs uppercase tracking-widest text-[#8c9785]">Skład cyfrowy: Book Forge</p>
        </div>
      </section>

      {/* 4. TABLE OF CONTENTS */}
      <section className="toc-page">
        <h2 className="mb-8 text-3xl font-bold">Spis treści</h2>
        <ul className="space-y-3">
          {chapters.map((ch, idx) => (
            <li key={ch.id} className="flex justify-between items-end">
              <span className="font-medium pr-4">{ch.title || `Rozdział ${idx + 1}`}</span>
              <div className="flex-1 border-b border-dotted border-[#8c9785] opacity-50 mb-1"></div>
            </li>
          ))}
        </ul>
      </section>

      {/* 5. CHAPTERS */}
      {chapters.map((chapter) => (
        <section key={chapter.id} className="chapter-content prose max-w-none">
          <h2 className="text-3xl font-bold mb-6">{chapter.title}</h2>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {chapter.content}
          </ReactMarkdown>
        </section>
      ))}
    </div>
  );
}
