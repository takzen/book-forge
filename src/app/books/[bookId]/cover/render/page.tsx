import { notFound } from "next/navigation";
import {
  COVER_REFERENCE_WIDTH,
  CoverArtwork,
  type CoverDesignState,
  coverBackgroundStyle,
  getCoverHeight,
} from "@/components/cover/cover-artwork";
import { getBook } from "@/lib/books";

export const dynamic = "force-dynamic";

type CoverRenderPageProps = {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ width?: string }>;
};

const DEFAULT_WIDTH = 1600;
const MAX_WIDTH = 4000;

/**
 * Off-screen page that the PNG export screenshots. It renders the very same
 * `CoverArtwork` the design canvas uses, so the exported file is the design —
 * not a canvas re-implementation of it that silently dropped letter-spacing,
 * opacity, borders, text wrapping and custom gradients.
 */
export default async function CoverRenderPage({
  params,
  searchParams,
}: CoverRenderPageProps) {
  const { bookId } = await params;
  const { width: widthParam } = await searchParams;
  const book = getBook(bookId);

  if (!book || !book.coverDesign) {
    notFound();
  }

  let design: CoverDesignState;
  try {
    const parsed = JSON.parse(book.coverDesign);
    if (!parsed || !Array.isArray(parsed.elements)) {
      notFound();
    }
    design = parsed;
  } catch {
    notFound();
  }

  const requested = Number(widthParam);
  const width =
    Number.isFinite(requested) && requested >= 200 && requested <= MAX_WIDTH
      ? Math.round(requested)
      : DEFAULT_WIDTH;
  const height = getCoverHeight(book.format, width);
  const scale = width / COVER_REFERENCE_WIDTH;

  return (
    <div
      id="cover-root"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: "relative",
        overflow: "hidden",
        ...coverBackgroundStyle(design),
      }}
    >
      <CoverArtwork design={design} scale={scale} />
    </div>
  );
}
