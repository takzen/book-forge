"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createChapterAction,
  createTocChapterAction,
  deleteChapterAction,
  reorderChaptersAction,
  updateBookDetailsAction,
  deleteBookFromWorkspaceAction,
  duplicateBookFromWorkspaceAction,
} from "@/app/books/[bookId]/actions";

type ChapterItem = {
  id: string;
  title: string;
  content: string;
  type?: string;
  sortOrder: number;
};

type BookSidebarProps = {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookFormat: string;
  chapters: ChapterItem[];
  activeChapterId?: string;
};

export function BookSidebar({
  bookId,
  bookTitle,
  bookAuthor,
  bookFormat,
  chapters: initialChapters,
  activeChapterId,
}: BookSidebarProps) {
  const router = useRouter();
  const [chapters, setChapters] = useState(initialChapters);
  const [isPending, startTransition] = useTransition();
  const [isEditingBook, setIsEditingBook] = useState(false);
  const [bookTitleVal, setBookTitleVal] = useState(bookTitle);
  const [bookAuthorVal, setBookAuthorVal] = useState(bookAuthor);
  const [bookFormatVal, setBookFormatVal] = useState(bookFormat);
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null);

  const totalWords = chapters.reduce((sum, ch) => {
    const words = ch.content.trim().match(/\S+/g);
    return sum + (words?.length ?? 0);
  }, 0);

  // Sync if props update
  if (initialChapters !== chapters && initialChapters.length !== chapters.length) {
    setChapters(initialChapters);
  }

  async function handleMoveChapter(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    const updated = [...chapters];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setChapters(updated);

    const orderedIds = updated.map((ch) => ch.id);
    startTransition(async () => {
      await reorderChaptersAction(bookId, orderedIds);
    });
  }

  async function handleDeleteChapter(chapterId: string) {
    if (!confirm("Are you sure you want to delete this chapter? This cannot be undone.")) {
      return;
    }
    setDeletingChapterId(chapterId);
    startTransition(async () => {
      await deleteChapterAction(bookId, chapterId);
      setDeletingChapterId(null);
    });
  }

  async function handleSaveBookDetails(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateBookDetailsAction({
        id: bookId,
        title: bookTitleVal,
        author: bookAuthorVal,
        format: bookFormatVal as "a5" | "a4" | "six-by-nine",
      });
      setIsEditingBook(false);
      router.refresh();
    });
  }

  async function handleDuplicateBook() {
    startTransition(async () => {
      await duplicateBookFromWorkspaceAction(bookId);
    });
  }

  async function handleDeleteBook() {
    if (
      !confirm(
        `Are you sure you want to delete "${bookTitle}" and all its chapters? This action is irreversible.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      await deleteBookFromWorkspaceAction(bookId);
    });
  }

  const formatLabels: Record<string, string> = {
    a5: "A5 (Book)",
    a4: "A4 (Workbook)",
    "six-by-nine": "6 × 9 in (Trade Book)",
  };

  return (
    <aside className="flex flex-col border-b border-[#1d241d]/15 bg-[#f6f1e8] p-5 sm:p-6 lg:min-h-screen lg:border-r lg:border-b-0">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.16em] text-[#b15636] uppercase transition hover:opacity-80"
        >
          <span>←</span> Library
        </Link>

        <button
          onClick={() => setIsEditingBook(!isEditingBook)}
          title="Project settings"
          className="rounded-lg p-1.5 text-xs text-[#52604e] transition hover:bg-[#e9e1d3] hover:text-[#1d241d]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Book details edit modal / drawer */}
      {isEditingBook ? (
        <form onSubmit={handleSaveBookDetails} className="mt-4 rounded-2xl border border-[#1d241d]/15 bg-[#fdfaf3] p-4 text-xs">
          <p className="font-bold tracking-wider text-[#b15636] uppercase">Book Settings</p>
          
          <label className="mt-3 block font-semibold text-[#1d241d]">
            Title
            <input
              type="text"
              value={bookTitleVal}
              onChange={(e) => setBookTitleVal(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-[#1d241d]/20 bg-white px-2.5 py-1.5 text-xs text-[#1d241d] outline-none focus:border-[#b15636]"
            />
          </label>

          <label className="mt-2.5 block font-semibold text-[#1d241d]">
            Author
            <input
              type="text"
              value={bookAuthorVal}
              onChange={(e) => setBookAuthorVal(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#1d241d]/20 bg-white px-2.5 py-1.5 text-xs text-[#1d241d] outline-none focus:border-[#b15636]"
            />
          </label>

          <label className="mt-2.5 block font-semibold text-[#1d241d]">
            Page Size
            <select
              value={bookFormatVal}
              onChange={(e) => setBookFormatVal(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#1d241d]/20 bg-white px-2.5 py-1.5 text-xs text-[#1d241d] outline-none focus:border-[#b15636]"
            >
              <option value="a5">A5 — standard book</option>
              <option value="six-by-nine">6 × 9 in — trade book</option>
              <option value="a4">A4 — workbook / document</option>
            </select>
          </label>

          {/* Quick Actions (Duplicate, Export ZIP) */}
          <div className="mt-3 flex gap-2 border-t border-[#1d241d]/10 pt-3">
            <button
              type="button"
              onClick={handleDuplicateBook}
              disabled={isPending}
              className="flex-1 rounded-lg border border-[#1d241d]/15 bg-white py-1.5 text-center font-medium text-[#52604e] transition hover:bg-[#e9e1d3] hover:text-[#1d241d]"
            >
              📋 Duplicate
            </button>
            <a
              href={`/api/books/${bookId}/export`}
              download
              className="flex-1 rounded-lg border border-[#1d241d]/15 bg-white py-1.5 text-center font-medium text-[#52604e] transition hover:bg-[#e9e1d3] hover:text-[#1d241d]"
            >
              📦 Export ZIP
            </a>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#1d241d]/10 pt-3">
            <button
              type="button"
              onClick={handleDeleteBook}
              className="rounded-lg px-2 py-1 text-xs font-bold text-[#b15636] transition hover:bg-[#b15636]/10"
            >
              Delete book
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingBook(false)}
                className="rounded-lg px-2.5 py-1 text-xs text-[#52604e] hover:bg-[#e9e1d3]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-[#284c42] px-3 py-1 text-xs font-bold text-[#f8f1dd] hover:bg-[#1d241d]"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-5">
          <h1 className="font-serif text-3xl leading-tight tracking-[-0.04em] text-[#1d241d]">{bookTitle}</h1>
          <p className="mt-1.5 text-sm text-[#66705f]">{bookAuthor || "No author assigned"}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-md bg-[#e5d2bd] px-2 py-0.5 text-[0.7rem] font-bold text-[#52604e]">
              {formatLabels[bookFormat] ?? bookFormat}
            </span>
            <span className="text-[0.75rem] text-[#66705f]">
              {totalWords.toLocaleString()} total words
            </span>
          </div>

          {/* Studio Navigation Tabs */}
          <div className="mt-5 grid grid-cols-3 gap-1 rounded-2xl bg-[#e9e1d3] p-1 text-[0.7rem] font-bold">
            <Link
              href={`/books/${bookId}`}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-[#fdfaf3] py-2 text-[#1d241d] shadow-xs transition hover:text-[#b15636]"
            >
              <span>📝</span> Manuscript
            </Link>
            <Link
              href={`/books/${bookId}/cover`}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[#52604e] transition hover:bg-[#fdfaf3] hover:text-[#b15636]"
            >
              <span>🎨</span> Cover
            </Link>
            <Link
              href={`/books/${bookId}/preview`}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[#52604e] transition hover:bg-[#fdfaf3] hover:text-[#b15636]"
            >
              <span>📖</span> Preview & PDF
            </Link>
          </div>
        </div>
      )}

      {/* Chapters header */}
      <div className="mt-8 flex items-center justify-between">
        <p className="text-xs font-bold tracking-[0.16em] text-[#66705f] uppercase">Manuscript</p>
        <span className="rounded-full bg-[#e5d2bd] px-2 py-0.5 text-[0.68rem] font-bold text-[#1d241d]">
          {chapters.length} {chapters.length === 1 ? "chapter" : "chapters"}
        </span>
      </div>

      {/* Chapters list */}
      <nav className="mt-3 flex-1 space-y-1 overflow-y-auto">
        {chapters.map((chapter, index) => {
          const isActive = chapter.id === activeChapterId;
          const isToc = chapter.type === "toc" || chapter.title.toLowerCase().includes("spis treści") || chapter.title.toLowerCase().includes("table of contents");
          const existingTocs = chapters.filter((c) => c.type === "toc" || c.title.toLowerCase().includes("spis treści") || c.title.toLowerCase().includes("table of contents"));
          const regularChapters = chapters.filter((c) => !existingTocs.some((t) => t.id === c.id));
          const tocIdx = existingTocs.findIndex((t) => t.id === chapter.id);
          const regIdx = regularChapters.findIndex((r) => r.id === chapter.id);

          return (
            <div
              key={chapter.id}
              className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-[#284c42] font-semibold text-[#f8f1dd] shadow-sm"
                  : "text-[#52604e] hover:bg-[#e9e1d3]/80 hover:text-[#1d241d]"
              }`}
            >
              <Link
                href={`/books/${bookId}?chapter=${chapter.id}`}
                className="flex min-w-0 flex-1 items-center gap-2.5 py-0.5"
              >
                {isToc ? (
                  <span className={`text-xs ${isActive ? "text-[#f8f1dd]" : "text-[#b15636]"}`}>
                    📑
                  </span>
                ) : (
                  <span className={`text-xs ${isActive ? "text-[#f8f1dd]/70" : "text-[#8c9785]"}`}>
                    {String(regIdx + 1).padStart(2, "0")}
                  </span>
                )}
                <span className="truncate">{chapter.title || "Untitled Chapter"}</span>
                {isToc && (
                  <span className={`ml-auto mr-2 rounded px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${
                    isActive ? "bg-white/20 text-[#f8f1dd]" : "bg-[#e5d2bd] text-[#52604e]"
                  }`}>
                    {existingTocs.length > 1 ? `TOC · Str. ${tocIdx + 1}` : "TOC"}
                  </span>
                )}
              </Link>

              {/* Action controls (reorder, delete) */}
              <div
                className={`flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 ${
                  isActive ? "opacity-100" : ""
                }`}
              >
                {/* Move Up */}
                <button
                  onClick={() => handleMoveChapter(index, "up")}
                  disabled={index === 0}
                  title="Move up"
                  className={`rounded p-1 text-xs transition disabled:opacity-20 ${
                    isActive ? "hover:bg-white/20 text-[#f8f1dd]" : "hover:bg-[#1d241d]/10 text-[#52604e]"
                  }`}
                >
                  ▲
                </button>

                {/* Move Down */}
                <button
                  onClick={() => handleMoveChapter(index, "down")}
                  disabled={index === chapters.length - 1}
                  title="Move down"
                  className={`rounded p-1 text-xs transition disabled:opacity-20 ${
                    isActive ? "hover:bg-white/20 text-[#f8f1dd]" : "hover:bg-[#1d241d]/10 text-[#52604e]"
                  }`}
                >
                  ▼
                </button>

                {/* Delete chapter */}
                {chapters.length > 1 && (
                  <button
                    onClick={() => handleDeleteChapter(chapter.id)}
                    disabled={deletingChapterId === chapter.id}
                    title="Delete"
                    className={`rounded p-1 text-xs transition ${
                      isActive
                        ? "text-[#f8f1dd]/70 hover:bg-white/20 hover:text-red-300"
                        : "text-[#8c9785] hover:bg-red-100 hover:text-red-700"
                    }`}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Add chapter and TOC buttons */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <form action={createChapterAction}>
          <input type="hidden" name="bookId" value={bookId} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#1d241d]/25 bg-[#fdfaf3]/50 px-2 py-2 text-xs font-bold text-[#52604e] transition hover:border-[#b15636] hover:bg-[#fdfaf3] hover:text-[#b15636]"
          >
            <span>+</span> Rozdział
          </button>
        </form>

        <form action={createTocChapterAction}>
          <input type="hidden" name="bookId" value={bookId} />
          <button
            type="submit"
            title="Wstaw nową stronę spisu treści (możesz dodać wiele stron spisu)"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#b15636]/40 bg-[#fdfaf3]/50 px-2 py-2 text-xs font-bold text-[#b15636] transition hover:border-[#b15636] hover:bg-[#fdfaf3]"
          >
            <span>📑</span> + Strona spisu
          </button>
        </form>
      </div>

      {/* Bottom footer status */}
      <div className="mt-6 border-t border-[#1d241d]/15 pt-4 text-xs text-[#66705f]">
        <p className="font-semibold text-[#1d241d]">Local Manuscript Mode</p>
        <p className="mt-0.5">Auto-saves as you type. Storage is 100% offline.</p>
      </div>
    </aside>
  );
}
