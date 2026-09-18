import { notFound } from "next/navigation";
import { BookPreview } from "@/components/preview/book-preview";
import {
  type BookFontFamily,
  getBook,
  getBookSettings,
  listChapters,
} from "@/lib/books";

export const dynamic = "force-dynamic";

type PreviewPageProps = {
  params: Promise<{ bookId: string }>;
};

export default async function BookPreviewPage({ params }: PreviewPageProps) {
  const { bookId } = await params;
  const book = getBook(bookId);

  if (!book) {
    notFound();
  }

  const chapters = listChapters(bookId);
  const settings = getBookSettings(bookId);

  return (
    <BookPreview
      bookId={bookId}
      bookTitle={book.title}
      bookAuthor={book.author}
      bookFormat={book.format}
      coverImage={book.coverImage}
      chapters={chapters}
      initialFontFamily={settings.fontFamily as BookFontFamily}
      initialFontSize={settings.fontSizePt}
      lineHeight={settings.lineHeight / 100}
    />
  );
}
