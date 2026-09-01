"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteBookAction, duplicateBookAction } from "@/app/dashboard/actions";

const formatLabels: Record<string, string> = {
  a5: "A5",
  a4: "A4",
  "six-by-nine": "6 × 9 in",
};

export function BookCard({
  book,
}: {
  book: {
    id: string;
    title: string;
    author: string;
    format: string;
    coverImage?: string;
    updatedAt: number;
  };
}) {
  const [isPending, startTransition] = useTransition();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  function handleDuplicate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const formData = new FormData();
    formData.set("id", book.id);
    startTransition(async () => {
      await duplicateBookAction(formData);
    });
  }

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const formData = new FormData();
    formData.set("id", book.id);
    startTransition(async () => {
      await deleteBookAction(formData);
      setShowConfirmDelete(false);
    });
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border border-[#1d241d]/15 bg-[#fdfaf3] p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#76866c]/10">
      <div>
        <div className="flex items-center justify-between">
          <span className="rounded-md bg-[#e5d2bd]/60 px-2 py-0.5 text-xs font-bold tracking-[0.14em] text-[#b15636] uppercase">
            {formatLabels[book.format] ?? book.format}
          </span>
          <span className="text-[0.75rem] text-[#66705f]">
            {new Date(book.updatedAt).toLocaleDateString()}
          </span>
        </div>

        <Link href={`/books/${book.id}`} className="mt-6 block focus:outline-none">
          <h2 className="font-serif text-2xl font-semibold tracking-[-0.03em] text-[#1d241d] transition group-hover:text-[#b15636] sm:text-3xl">
            {book.title}
          </h2>
          <p className="mt-2 text-sm text-[#52604e]">
            {book.author ? `by ${book.author}` : "No author yet"}
          </p>
        </Link>
      </div>

      <div className="mt-8 border-t border-[#1d241d]/10 pt-4">
        {showConfirmDelete ? (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-900">
            <span className="font-medium">Delete permanently?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirmDelete(false);
                }}
                className="rounded px-2 py-1 text-[#52604e] hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="rounded bg-red-700 px-2.5 py-1 font-bold text-white transition hover:bg-red-800"
              >
                {isPending ? "..." : "Delete"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href={`/books/${book.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#284c42] transition hover:text-[#b15636]"
            >
              <span>Open</span>
              <span aria-hidden="true">→</span>
            </Link>

            <div className="flex items-center gap-1 text-xs">
              {/* Duplicate */}
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isPending}
                title="Duplicate book"
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[#52604e] transition hover:bg-[#e9e1d3] hover:text-[#1d241d]"
              >
                <span>📋</span>
                <span className="hidden sm:inline">Copy</span>
              </button>

              {/* Export ZIP */}
              <a
                href={`/api/books/${book.id}/export`}
                download
                title="Export project as ZIP"
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[#52604e] transition hover:bg-[#e9e1d3] hover:text-[#1d241d]"
              >
                <span>📦</span>
                <span className="hidden sm:inline">ZIP</span>
              </a>

              {/* Delete */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirmDelete(true);
                }}
                title="Delete book"
                className="rounded-lg p-1.5 text-[#8c9785] transition hover:bg-red-50 hover:text-red-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
