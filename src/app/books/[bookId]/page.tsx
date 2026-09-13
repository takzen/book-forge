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
  const activeChapter = chapters.find((chapter) => chapter.id === query.chapter) ?? chapters[0];

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
