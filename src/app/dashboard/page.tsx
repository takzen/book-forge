import Link from "next/link";
import { createBookAction } from "./actions";
import { listBooks } from "@/lib/books";
import { BookCard } from "@/components/dashboard/book-card";
import { ImportZipCard } from "@/components/dashboard/import-zip-card";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  "invalid-book-details": "Title must be non-empty and under 160 characters.",
  "invalid-book": "The requested book could not be found.",
  "no-file-uploaded": "Please select a valid .zip file to import.",
  "file-too-large": "Uploaded archive exceeds the 50 MB limit.",
  "import-failed": "Failed to import book archive. Ensure it was created by Book Forge.",
  "duplicate-failed": "Failed to duplicate the project.",
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { error } = await searchParams;
  const books = listBooks();

  return (
    <main className="min-h-screen bg-[#f6f1e8] px-6 py-6 text-[#1d241d] sm:px-10 lg:px-16">
      <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-[#1d241d]/15 pb-5">
        <Link href="/" className="text-sm font-bold tracking-[0.1em] uppercase">
          Book Forge
        </Link>
        <span className="text-sm text-[#66705f]">Your local library</span>
      </nav>

      {error && (
        <div className="mx-auto mt-6 max-w-7xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Notice</p>
          <p className="mt-0.5">{errorMessages[error] ?? "An unexpected error occurred."}</p>
        </div>
      )}

      <div className="mx-auto grid max-w-7xl gap-12 py-12 lg:grid-cols-[1fr_22rem] lg:py-16">
        <section>
          <p className="text-xs font-bold tracking-[0.2em] text-[#b15636] uppercase">Library</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="font-serif text-5xl tracking-[-0.05em] sm:text-6xl">Your books</h1>
              <p className="mt-3 text-[#52604e]">Everything is stored locally on this computer.</p>
            </div>
            <p className="rounded-full border border-[#1d241d]/15 px-4 py-2 text-sm text-[#52604e]">
              {books.length} {books.length === 1 ? "project" : "projects"}
            </p>
          </div>

          {books.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-[#1d241d]/20 bg-[#fdfaf3] p-10">
              <p className="font-serif text-3xl">The shelf is waiting.</p>
              <p className="mt-3 max-w-md leading-7 text-[#52604e]">
                Create your first book or import a ZIP backup to start writing in Markdown and shaping the final PDF.
              </p>
            </div>
          ) : (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          {/* New Book Card */}
          <div className="h-fit rounded-3xl bg-[#284c42] p-6 text-[#f8f1dd] sm:p-7">
            <p className="text-xs font-bold tracking-[0.18em] text-[#d99d67] uppercase">New project</p>
            <h2 className="mt-3 font-serif text-3xl tracking-[-0.04em]">Begin with a title.</h2>
            <form action={createBookAction} className="mt-7 grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium">
                Title
                <input
                  name="title"
                  required
                  maxLength={160}
                  placeholder="The Quiet Work"
                  className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-[#f8f1dd] outline-none placeholder:text-[#f8f1dd]/45 focus:border-[#d99d67]"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Author
                <input
                  name="author"
                  maxLength={120}
                  placeholder="Your name"
                  className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-[#f8f1dd] outline-none placeholder:text-[#f8f1dd]/45 focus:border-[#d99d67]"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Page size
                <select
                  name="format"
                  defaultValue="a5"
                  className="rounded-xl border border-white/15 bg-[#284c42] px-3 py-2.5 outline-none focus:border-[#d99d67]"
                >
                  <option value="a5">A5 — standard book</option>
                  <option value="six-by-nine">6 × 9 in — trade book</option>
                  <option value="a4">A4 — workbook / document</option>
                </select>
              </label>
              <button className="mt-2 rounded-xl bg-[#f8f1dd] px-4 py-3 text-sm font-bold text-[#284c42] transition hover:bg-white">
                Create book
              </button>
            </form>
          </div>

          {/* Import ZIP Card */}
          <ImportZipCard />
        </aside>
      </div>
    </main>
  );
}

