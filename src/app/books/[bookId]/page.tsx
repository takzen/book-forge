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
    <main className="min-h-screen bg-[#e9e1d3] text-[#1d241d]">
      <div className="grid min-h-screen lg:grid-cols-[20rem_1fr]">
        <BookSidebar
          bookId={bookId}
          bookTitle={book.title}
          bookAuthor={book.author}
          bookFormat={book.format}
          chapters={chapters}
          activeChapterId={activeChapter?.id}
        />

        <section className="min-w-0 p-5 sm:p-8 lg:p-12">
          {activeChapter ? (
            <ChapterEditor
              key={activeChapter.id}
              bookId={bookId}
              chapterId={activeChapter.id}
              initialTitle={activeChapter.title}
              initialContent={activeChapter.content}
              chapterType={activeChapter.type}
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
