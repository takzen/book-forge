import { notFound } from "next/navigation";
import { CoverDesigner } from "@/components/cover/cover-designer";
import { getBook } from "@/lib/books";

export const dynamic = "force-dynamic";

type CoverPageProps = {
  params: Promise<{ bookId: string }>;
};

export default async function BookCoverPage({ params }: CoverPageProps) {
  const { bookId } = await params;
  const book = getBook(bookId);

  if (!book) {
    notFound();
  }

  return (
    <CoverDesigner
      bookId={bookId}
      bookTitle={book.title}
      bookAuthor={book.author}
      bookFormat={book.format}
      initialDesign={book.coverDesign}
      coverImage={book.coverImage}
    />
  );
}
