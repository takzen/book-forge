"use client";

import Link from "next/link";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChapterItem = {
  id: string;
  title: string;
  content: string;
  sortOrder: number;
};

type BookPreviewProps = {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookFormat: string;
  coverImage?: string;
  chapters: ChapterItem[];
};

export function BookPreview({
  bookId,
  bookTitle,
  bookAuthor,
  bookFormat,
  coverImage,
  chapters,
}: BookPreviewProps) {
  const [fontFamily, setFontFamily] = useState<"serif" | "sans" | "mono">("serif");
  const [fontSize, setFontSize] = useState<number>(11);
  const [profile, setProfile] = useState<"screen" | "print">("screen");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  const formatDimensions: Record<string, { name: string; widthMm: number; heightMm: number; cssSize: string }> = {
    a5: { name: "A5 (148 × 210 mm)", widthMm: 148, heightMm: 210, cssSize: "148mm 210mm" },
    "six-by-nine": { name: "6 × 9 in (152 × 229 mm)", widthMm: 152.4, heightMm: 228.6, cssSize: "152.4mm 228.6mm" },
    a4: { name: "A4 (210 × 297 mm)", widthMm: 210, heightMm: 297, cssSize: "210mm 297mm" },
  };

  const currentFormat = formatDimensions[bookFormat] || formatDimensions.a5;

  const totalWords = chapters.reduce((sum, ch) => {
    const words = ch.content.trim().match(/\S+/g);
    return sum + (words?.length ?? 0);
  }, 0);

  // Trigger browser print
  function handlePrint() {
    window.print();
  }

  // Server-side PDF export via Playwright API
  async function handleExportPdf() {
    setIsExportingPdf(true);
    setExportMessage("Generating PDF with Playwright engine…");

    try {
      const response = await fetch(`/api/books/${bookId}/pdf?profile=${profile}&font=${fontFamily}&size=${fontSize}`);
      if (!response.ok) {
        throw new Error("Failed to generate PDF on server. Falling back to browser print.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${bookTitle.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${profile}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setExportMessage("✓ PDF downloaded successfully!");
      setTimeout(() => setExportMessage(""), 4000);
    } catch (error) {
      console.warn("Server PDF export fallback:", error);
      setExportMessage("Falling back to native browser PDF print…");
      setTimeout(() => {
        window.print();
        setExportMessage("");
      }, 500);
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#383d3b] text-[#1d241d]">
      {/* Top Floating Control Bar (Hidden on print) */}
      <header className="print:hidden sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 border-b border-black/20 bg-[#284c42] px-6 py-3.5 text-[#f8f1dd] shadow-lg">
        <div className="flex items-center gap-4">
          <Link
            href={`/books/${bookId}`}
            className="text-xs font-bold tracking-[0.16em] text-[#d99d67] uppercase hover:underline"
          >
            ← Back to Manuscript
          </Link>
          <span className="h-4 w-[1px] bg-white/20" />
          <h1 className="font-serif text-lg font-bold tracking-tight text-white">{bookTitle}</h1>
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[0.7rem] font-semibold text-[#d99d67]">
            {currentFormat.name}
          </span>
        </div>

        {/* Customization controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Font Family */}
          <div className="flex items-center gap-1.5 rounded-xl bg-black/20 px-2.5 py-1.5">
            <span className="text-white/60">Font:</span>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value as any)}
              className="bg-transparent font-semibold text-white outline-none"
            >
              <option value="serif" className="bg-[#284c42] text-white">Serif (Classic)</option>
              <option value="sans" className="bg-[#284c42] text-white">Sans (Modern)</option>
              <option value="mono" className="bg-[#284c42] text-white">Mono</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-1.5 rounded-xl bg-black/20 px-2.5 py-1.5">
            <span className="text-white/60">Size:</span>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="bg-transparent font-semibold text-white outline-none"
            >
              <option value={10} className="bg-[#284c42] text-white">10 pt</option>
              <option value={11} className="bg-[#284c42] text-white">11 pt (Standard)</option>
              <option value={12} className="bg-[#284c42] text-white">12 pt</option>
              <option value={13} className="bg-[#284c42] text-white">13 pt (Large)</option>
            </select>
          </div>

          {/* Profile: Screen vs Print */}
          <div className="flex items-center rounded-xl bg-black/25 p-0.5">
            <button
              type="button"
              onClick={() => setProfile("screen")}
              className={`rounded-lg px-2.5 py-1 font-bold transition ${
                profile === "screen" ? "bg-white text-[#284c42] shadow-xs" : "text-white/70 hover:text-white"
              }`}
            >
              Screen
            </button>
            <button
              type="button"
              onClick={() => setProfile("print")}
              className={`rounded-lg px-2.5 py-1 font-bold transition ${
                profile === "print" ? "bg-white text-[#284c42] shadow-xs" : "text-white/70 hover:text-white"
              }`}
            >
              Print / Druk
            </button>
          </div>

          {/* Browser Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            title="Open browser print dialog"
            className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 font-bold text-white transition hover:bg-white/20"
          >
            <span>🖨</span> Print / PDF
          </button>

          {/* Playwright High-Res PDF Export */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 rounded-full bg-[#d99d67] px-4 py-1.5 font-bold text-[#1d241d] shadow-sm transition hover:bg-white disabled:opacity-50"
          >
            {isExportingPdf ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Compiling PDF…
              </>
            ) : (
              <>
                <span>⚡</span> Download PDF
              </>
            )}
          </button>
        </div>
      </header>

      {exportMessage && (
        <div className="print:hidden bg-[#d99d67] px-4 py-2 text-center text-xs font-bold text-[#1d241d]">
          {exportMessage}
        </div>
      )}

      {/* Book Sheet Container */}
      <main className="mx-auto flex flex-col items-center gap-10 py-8 px-4 sm:px-6 print:m-0 print:p-0 print:gap-0">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: ${currentFormat.cssSize};
              margin: 0;
            }
            body {
              background: #ffffff !important;
              margin: 0 !important;
            }
            .book-page {
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              page-break-after: always;
              break-after: page;
              width: 100% !important;
              min-height: 100vh !important;
              height: 100vh !important;
            }
          }
        ` }} />

        {/* 1. COVER PAGE */}
        <section
          style={{
            width: `${currentFormat.widthMm * 3.78}px`,
            minHeight: `${currentFormat.heightMm * 3.78}px`,
          }}
          className="book-page relative flex flex-col justify-between overflow-hidden bg-[#f7f3eb] p-10 shadow-2xl transition print:shadow-none"
        >
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt="Book cover"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col justify-between border-4 border-[#b15636] p-10 text-center">
              <div>
                <p className="font-sans text-xs font-bold tracking-[0.25em] text-[#b15636] uppercase">BOOK FORGE EDITION</p>
              </div>
              <div>
                <h1 className="font-serif text-4xl font-bold tracking-tight text-[#1d241d] sm:text-5xl">{bookTitle}</h1>
                <p className="mt-4 text-lg text-[#52604e]">A Work in Progress</p>
              </div>
              <div>
                <p className="font-serif text-base italic text-[#1d241d]">{bookAuthor || "Anonymous"}</p>
              </div>
            </div>
          )}
        </section>

        {/* 2. HALF-TITLE & TITLE PAGE */}
        <section
          style={{
            width: `${currentFormat.widthMm * 3.78}px`,
            minHeight: `${currentFormat.heightMm * 3.78}px`,
          }}
          className="book-page flex flex-col justify-between bg-white p-12 sm:p-16 shadow-2xl print:shadow-none"
        >
          <div />
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1d241d] sm:text-4xl">{bookTitle}</h1>
            <div className="mx-auto my-6 h-[1px] w-16 bg-[#b15636]" />
            <p className="font-serif text-lg text-[#52604e]">{bookAuthor || "Anonymous Author"}</p>
          </div>

          <div className="border-t border-[#1d241d]/10 pt-6 text-center text-xs text-[#66705f]">
            <p className="font-semibold text-[#1d241d]">{bookTitle}</p>
            <p className="mt-1">First Edition · {new Date().getFullYear()}</p>
            <p className="mt-0.5">Typeset locally with Book Forge · {totalWords.toLocaleString()} words</p>
          </div>
        </section>

        {/* 3. TABLE OF CONTENTS (SPIS TREŚCI) */}
        <section
          style={{
            width: `${currentFormat.widthMm * 3.78}px`,
            minHeight: `${currentFormat.heightMm * 3.78}px`,
          }}
          className="book-page flex flex-col bg-white p-12 sm:p-16 shadow-2xl print:shadow-none"
        >
          <header className="border-b border-[#1d241d]/15 pb-4 text-center">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1d241d] uppercase">Contents</h2>
            <p className="mt-1 text-xs text-[#66705f]">Spis Treści</p>
          </header>

          <nav className="mt-8 flex-1 space-y-4 text-sm">
            {chapters.map((chapter, index) => {
              const words = chapter.content.trim().match(/\S+/g)?.length ?? 0;
              return (
                <a
                  key={chapter.id}
                  href={`#chapter-${chapter.id}`}
                  className="group flex items-baseline justify-between border-b border-dotted border-[#1d241d]/20 pb-1 text-[#1d241d] transition hover:text-[#b15636]"
                >
                  <span className="font-serif font-semibold">
                    <span className="mr-3 font-sans text-xs text-[#b15636]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {chapter.title || "Untitled Chapter"}
                  </span>
                  <span className="font-mono text-xs text-[#66705f]">
                    {words} words
                  </span>
                </a>
              );
            })}
          </nav>

          <footer className="mt-8 border-t border-[#1d241d]/10 pt-4 text-center text-xs text-[#8c9785]">
            Table of Contents
          </footer>
        </section>

        {/* 4. CHAPTER PAGES */}
        {chapters.map((chapter, index) => {
          const fontClass =
            fontFamily === "serif"
              ? "font-serif"
              : fontFamily === "mono"
              ? "font-mono"
              : "font-sans";

          return (
            <section
              key={chapter.id}
              id={`chapter-${chapter.id}`}
              style={{
                width: `${currentFormat.widthMm * 3.78}px`,
                minHeight: `${currentFormat.heightMm * 3.78}px`,
                fontSize: `${fontSize}pt`,
              }}
              className="book-page flex flex-col justify-between bg-white p-12 sm:p-16 shadow-2xl print:shadow-none"
            >
              {/* Header running title */}
              <div className="flex items-center justify-between border-b border-[#1d241d]/10 pb-3 text-[0.7rem] text-[#66705f]">
                <span className="font-serif italic">{bookTitle}</span>
                <span className="font-sans uppercase tracking-wider">Chapter {index + 1}</span>
              </div>

              {/* Chapter Content Body */}
              <div className="flex-1 py-8">
                <div className="mb-8">
                  <p className="text-xs font-bold tracking-[0.2em] text-[#b15636] uppercase">
                    Chapter {index + 1}
                  </p>
                  <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#1d241d]">
                    {chapter.title}
                  </h2>
                  <div className="mt-4 h-[1px] w-12 bg-[#b15636]" />
                </div>

                <article
                  className={`markdown-preview book-typography ${fontClass} leading-relaxed text-[#222822]`}
                  style={{ fontSize: `${fontSize}pt` }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {chapter.content}
                  </ReactMarkdown>
                </article>
              </div>

              {/* Page Footer Number */}
              <div className="border-t border-[#1d241d]/10 pt-3 text-center text-xs font-mono text-[#66705f]">
                — {index + 4} —
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
