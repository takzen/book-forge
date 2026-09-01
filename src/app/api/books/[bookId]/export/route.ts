import { NextResponse } from "next/server";
import { exportBookToZip } from "@/lib/books";

export const runtime = "nodejs";

const bookIdPattern = /^[0-9a-f-]{36}$/i;

export async function GET(
  _: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;

  if (!bookIdPattern.test(bookId)) {
    return new NextResponse("Invalid book ID", { status: 400 });
  }

  try {
    const { filename, buffer } = await exportBookToZip(bookId);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Export zip error:", error);
    return new NextResponse("Book not found or failed to export", { status: 404 });
  }
}
