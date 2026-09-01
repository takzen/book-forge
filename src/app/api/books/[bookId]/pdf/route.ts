import { getBook } from "@/lib/books";
import { type NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const profile = searchParams.get("profile") || "screen";
  const font = searchParams.get("font") || "serif";
  const size = searchParams.get("size") || "11";

  const book = getBook(bookId);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const printUrl = `${protocol}://${host}/books/${bookId}/print?font=${font}&size=${size}&profile=${profile}`;

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.goto(printUrl, { waitUntil: "networkidle" });

    // Emulate print media
    await page.emulateMedia({ media: "print" });

    const pdfBuffer = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: false,
    });

    await browser.close();

    const filename = `${book.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")}-${profile}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err) {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    console.error("Playwright PDF generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF with Playwright engine", details: String(err) },
      { status: 500 }
    );
  }
}
