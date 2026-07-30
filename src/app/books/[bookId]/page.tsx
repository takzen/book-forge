import Link from "next/link";
import { notFound } from "next/navigation";
import { createChapterAction, saveChapterAction } from "./actions";
import { getBook, listChapters } from "@/lib/books";

export const dynamic = "force-dynamic";

type BookPageProps = {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ chapter?: string; saved?: string; error?: string }>;
};

function wordCount(text: string) {
  const words = text.trim().match(/\S+/g);
  return words?.length ?? 0;
}

export default async function BookWorkspacePage({ params, searchParams }: BookPageProps) {
  const { bookId } = await params;
  const query = await searchParams;
  const book = getBook(bookId);

  if (!book) {
    notFound();
  }

  const chapters = listChapters(bookId);
  const activeChapter = chapters.find((chapter) => chapter.id === query.chapter) ?? chapters[0];

  return (
    <main className="min-h-screen bg-[#e9e1d3] text-[#1d241d]">
      <div className="grid min-h-screen lg:grid-cols-[18rem_1fr]">
        <aside className="border-b border-[#1d241d]/15 bg-[#f6f1e8] p-6 lg:border-r lg:border-b-0">
          <Link href="/dashboard" className="text-xs font-bold tracking-[0.16em] text-[#b15636] uppercase">← Library</Link>
          <h1 className="mt-6 font-serif text-4xl leading-none tracking-[-0.05em]">{book.title}</h1>
          <p className="mt-2 text-sm text-[#66705f]">{book.author || "No author yet"}</p>

          <div className="mt-10 flex items-center justify-between">
            <p className="text-xs font-bold tracking-[0.16em] text-[#66705f] uppercase">Manuscript</p>
            <span className="rounded-full bg-[#e5d2bd] px-2 py-1 text-[0.65rem] font-bold">{chapters.length}</span>
          </div>
          <nav className="mt-3 grid gap-1">
            {chapters.map((chapter, index) => (
              <Link key={chapter.id} href={`/books/${bookId}?chapter=${chapter.id}`} className={`rounded-xl px-3 py-2.5 text-sm transition ${chapter.id === activeChapter?.id ? "bg-[#284c42] font-bold text-[#f8f1dd]" : "text-[#52604e] hover:bg-[#e9e1d3]"}`}>
                <span className="mr-2 text-xs opacity-60">{String(index + 1).padStart(2, "0")}</span>
                {chapter.title}
              </Link>
            ))}
          </nav>
          <form action={createChapterAction} className="mt-3">
            <input type="hidden" name="bookId" value={bookId} />
            <button className="w-full rounded-xl border border-dashed border-[#1d241d]/20 px-3 py-2.5 text-sm font-bold text-[#52604e] transition hover:border-[#b15636] hover:text-[#b15636]">+ Add chapter</button>
          </form>

          <div className="mt-10 border-t border-[#1d241d]/15 pt-5 text-sm text-[#52604e]">
            <p className="font-bold text-[#1d241d]">{book.format === "six-by-nine" ? "6 × 9 in" : book.format.toUpperCase()}</p>
            <p className="mt-1">Print-ready layout will be configured here.</p>
          </div>
        </aside>

        <section className="min-w-0 p-5 sm:p-8 lg:p-12">
          {activeChapter ? (
            <form action={saveChapterAction} className="mx-auto max-w-4xl">
              <input type="hidden" name="bookId" value={bookId} />
              <input type="hidden" name="chapterId" value={activeChapter.id} />
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1d241d]/15 pb-5">
                <div>
                  <p className="text-xs font-bold tracking-[0.18em] text-[#b15636] uppercase">Markdown chapter</p>
                  <p className="mt-1 text-sm text-[#66705f]">{wordCount(activeChapter.content)} words</p>
                </div>
                <div className="flex items-center gap-3">
                  {query.saved === "1" && <span className="text-sm font-bold text-[#557549]">Saved locally</span>}
                  {query.error && <span className="text-sm font-bold text-[#b15636]">Check the chapter title and content.</span>}
                  <button className="rounded-full bg-[#1d241d] px-5 py-2.5 text-sm font-bold text-[#f8f1dd]">Save chapter</button>
                </div>
              </div>

              <label className="mt-10 block">
                <span className="sr-only">Chapter title</span>
                <input name="title" defaultValue={activeChapter.title} maxLength={180} required className="w-full bg-transparent font-serif text-4xl tracking-[-0.05em] outline-none placeholder:text-[#1d241d]/35 sm:text-5xl" placeholder="Chapter title" />
              </label>
              <label className="mt-7 block">
                <span className="mb-2 block text-xs font-bold tracking-[0.16em] text-[#66705f] uppercase">Write in Markdown</span>
                <textarea name="content" defaultValue={activeChapter.content} className="min-h-[52vh] w-full resize-y rounded-2xl border border-[#1d241d]/15 bg-[#fdfaf3] p-5 font-mono text-sm leading-7 text-[#2a332a] outline-none transition focus:border-[#b15636] focus:ring-4 focus:ring-[#b15636]/10" spellCheck />
              </label>
              <p className="mt-4 text-sm leading-6 text-[#66705f]">Use <code className="rounded bg-[#ded6c9] px-1.5 py-0.5">#</code> for headings, <code className="rounded bg-[#ded6c9] px-1.5 py-0.5">**text**</code> for emphasis, and <code className="rounded bg-[#ded6c9] px-1.5 py-0.5">![caption](image)</code> for an image.</p>
            </form>
          ) : (
            <div className="mx-auto max-w-xl rounded-3xl bg-[#fdfaf3] p-10">
              <h2 className="font-serif text-4xl">Your first page is ready.</h2>
              <p className="mt-3 leading-7 text-[#52604e]">Add a chapter from the sidebar to start writing.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
