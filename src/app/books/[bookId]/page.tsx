import { notFound } from "next/navigation";
import { ChapterEditor } from "@/components/editor/chapter-editor";
import { BookSidebar } from "@/components/sidebar/book-sidebar";
import {
  type BookFontFamily,
  FRONT_MATTER_PAGES,
  getBook,
  getBookSettings,
  listChapters,
} from "@/lib/books";
import { isTocChapter, splitChapters } from "@/lib/chapters";
import { countPages } from "@/lib/pagination";

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
  const settings = getBookSettings(bookId);

  const activeIndex = chapters.findIndex((chapter) => chapter.id === query.chapter);
  const activeChapterIndex = activeIndex !== -1 ? activeIndex : 0;
  const activeChapter = chapters[activeChapterIndex];

  const { tocChapters } = splitChapters(chapters);

  // Running page number for the active chapter, using the shared estimator so
  // the footer numbers in the editor line up with the generated contents list.
  const tocPageCount = Math.max(tocChapters.length, 1);
  let startPageNumber = FRONT_MATTER_PAGES + tocPageCount + 1;
  for (let i = 0; i < activeChapterIndex; i += 1) {
    const chapter = chapters[i];
    // A contents page is one sheet; its slot is already counted above.
    if (isTocChapter(chapter)) {
      continue;
    }
    startPageNumber += countPages(chapter.content, book.format);
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
          settings={{
            fontFamily: settings.fontFamily as BookFontFamily,
            fontSizePt: settings.fontSizePt,
            lineHeight: settings.lineHeight,
            marginTopMm: settings.marginTopMm,
            marginBottomMm: settings.marginBottomMm,
            marginSideMm: settings.marginSideMm,
            chapterStart: settings.chapterStart as "any" | "recto" | "verso",
          }}
        />

        <section className="h-full min-w-0 overflow-hidden p-4 sm:p-6 lg:p-8 flex flex-col">
          {activeChapter ? (
            <ChapterEditor
              key={activeChapter.id}
              bookId={bookId}
              chapterId={activeChapter.id}
              startPageNumber={startPageNumber}
              initialTitle={activeChapter.title}
              initialContent={activeChapter.content}
              chapterType={activeChapter.type}
              bookTitle={book.title}
              bookFormat={book.format}
              fontFamily={settings.fontFamily as BookFontFamily}
              fontSizePt={settings.fontSizePt}
              lineHeight={settings.lineHeight / 100}
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
