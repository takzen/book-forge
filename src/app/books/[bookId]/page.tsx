import { notFound } from "next/navigation";
import { ChapterEditor } from "@/components/editor/chapter-editor";
import { BookSidebar } from "@/components/sidebar/book-sidebar";
import { getBook, listChapters } from "@/lib/books";

export const dynamic = "force-dynamic";

type BookPageProps = {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ chapter?: string; saved?: string; error?: string }>;
};

export default async function BookWorkspacePage({ params, searchParams }: BookPageProps) {
  const { bookId } = await params;
  const query = await searchParams;
  const book = getBook(bookId);

  if (!book) {
    notFound();
  }

  const chapters = listChapters(bookId);
  const activeIndex = chapters.findIndex((chapter) => chapter.id === query.chapter);
  const activeChapterIndex = activeIndex !== -1 ? activeIndex : 0;
  const activeChapter = chapters[activeChapterIndex];

  const isTocItem = (ch: (typeof chapters)[0]) =>
    ch.type === "toc" ||
    ch.title.toLowerCase().includes("spis treści") ||
    ch.title.toLowerCase().includes("table of contents");

  const regularChapters = chapters.filter((c) => !isTocItem(c));
  const isCurrentToc = activeChapter ? isTocItem(activeChapter) : false;
  const regularIndex = activeChapter ? regularChapters.findIndex((c) => c.id === activeChapter.id) : -1;
  const chapterNumber = isCurrentToc ? 0 : regularIndex !== -1 ? regularIndex + 1 : 1;

  // Calculate start page number based on preceding chapters
  const wordsPerPage = book.format === "a4" ? 450 : book.format === "six-by-nine" ? 280 : 240;
  let startPageNumber = 1;
  for (let i = 0; i < activeChapterIndex; i++) {
    const chWords = (chapters[i].content.trim().match(/\S+/g) || []).length;
    const pagesCount = Math.max(1, Math.ceil(chWords / wordsPerPage));
    startPageNumber += pagesCount;
  }

  return (
    <main className="h-screen overflow-hidden bg-[#e9e1d3] text-[#1d241d]">
      <div className="grid h-screen lg:grid-cols-[20rem_1fr] overflow-hidden">
        <BookSidebar
          bookId={bookId}
          bookTitle={book.title}
          bookAuthor={book.author}
          bookFormat={book.format}
          chapters={chapters}
          activeChapterId={activeChapter?.id}
        />

        <section className="h-full min-w-0 overflow-hidden p-4 sm:p-6 lg:p-8 flex flex-col">
          {activeChapter ? (
            <ChapterEditor
              key={activeChapter.id}
              bookId={bookId}
              chapterId={activeChapter.id}
              chapterNumber={chapterNumber}
              startPageNumber={startPageNumber}
              initialTitle={activeChapter.title}
              initialContent={activeChapter.content}
              chapterType={activeChapter.type}
              bookTitle={book.title}
              bookFormat={book.format}
              saved={query.saved === "1"}
              hasError={Boolean(query.error)}
            />
          ) : (
            <div className="mx-auto max-w-xl rounded-3xl bg-[#fdfaf3] p-10">
              <h2 className="font-serif text-4xl">Your manuscript is empty.</h2>
              <p className="mt-3 leading-7 text-[#52604e]">Add a chapter from the sidebar to start writing.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
