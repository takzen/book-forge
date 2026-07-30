import Link from "next/link";
import { createBookAction } from "./actions";
import { listBooks } from "@/lib/books";

export const dynamic = "force-dynamic";

const formatLabels = {
  a5: "A5",
  a4: "A4",
  "six-by-nine": "6 × 9 in",
};

export default function DashboardPage() {
  const books = listBooks();

  return (
    <main className="min-h-screen bg-[#f6f1e8] px-6 py-6 text-[#1d241d] sm:px-10 lg:px-16">
      <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-[#1d241d]/15 pb-5">
        <Link href="/" className="text-sm font-bold tracking-[0.1em] uppercase">Book Forge</Link>
        <span className="text-sm text-[#66705f]">Your local library</span>
      </nav>

      <div className="mx-auto grid max-w-7xl gap-12 py-12 lg:grid-cols-[1fr_22rem] lg:py-16">
        <section>
          <p className="text-xs font-bold tracking-[0.2em] text-[#b15636] uppercase">Library</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="font-serif text-5xl tracking-[-0.05em] sm:text-6xl">Your books</h1>
              <p className="mt-3 text-[#52604e]">Everything is stored locally on this computer.</p>
            </div>
            <p className="rounded-full border border-[#1d241d]/15 px-4 py-2 text-sm text-[#52604e]">{books.length} {books.length === 1 ? "project" : "projects"}</p>
          </div>

          {books.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-[#1d241d]/20 bg-[#fdfaf3] p-10">
              <p className="font-serif text-3xl">The shelf is waiting.</p>
              <p className="mt-3 max-w-md leading-7 text-[#52604e]">Create your first book to start building chapters, writing in Markdown, and shaping the final PDF.</p>
            </div>
          ) : (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {books.map((book) => (
                <Link key={book.id} href={`/books/${book.id}`} className="group rounded-3xl border border-[#1d241d]/15 bg-[#fdfaf3] p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#76866c]/10">
                  <span className="text-xs font-bold tracking-[0.14em] text-[#b15636] uppercase">{formatLabels[book.format as keyof typeof formatLabels] ?? book.format}</span>
                  <h2 className="mt-10 font-serif text-3xl tracking-[-0.04em] group-hover:text-[#b15636]">{book.title}</h2>
                  <p className="mt-2 text-sm text-[#52604e]">{book.author || "No author yet"}</p>
                  <p className="mt-7 text-sm font-bold">Open project <span aria-hidden="true">→</span></p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-3xl bg-[#284c42] p-6 text-[#f8f1dd] sm:p-7">
          <p className="text-xs font-bold tracking-[0.18em] text-[#d99d67] uppercase">New project</p>
          <h2 className="mt-3 font-serif text-3xl tracking-[-0.04em]">Begin with a title.</h2>
          <form action={createBookAction} className="mt-7 grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium">
              Title
              <input name="title" required maxLength={160} placeholder="The Quiet Work" className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-[#f8f1dd] outline-none placeholder:text-[#f8f1dd]/45 focus:border-[#d99d67]" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Author
              <input name="author" maxLength={120} placeholder="Your name" className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-[#f8f1dd] outline-none placeholder:text-[#f8f1dd]/45 focus:border-[#d99d67]" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Page size
              <select name="format" defaultValue="a5" className="rounded-xl border border-white/15 bg-[#284c42] px-3 py-2.5 outline-none focus:border-[#d99d67]">
                <option value="a5">A5 — book</option>
                <option value="six-by-nine">6 × 9 in — book</option>
                <option value="a4">A4 — workbook</option>
              </select>
            </label>
            <button className="mt-2 rounded-xl bg-[#f8f1dd] px-4 py-3 text-sm font-bold text-[#284c42] transition hover:bg-white">Create book</button>
          </form>
        </aside>
      </div>
    </main>
  );
}
