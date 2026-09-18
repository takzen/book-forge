import { getBook } from "@/lib/books";
import { toFilenameStem } from "@/lib/filename";
import { type NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bookIdPattern = /^[0-9a-f-]{36}$/i;
const ALLOWED_FONTS = new Set(["serif", "sans", "mono"]);
const ALLOWED_PROFILES = new Set(["screen", "print"]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;

  if (!bookIdPattern.test(bookId)) {
    return NextResponse.json({ error: "Invalid book ID" }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const requestedProfile = searchParams.get("profile") ?? "screen";
  const profile = ALLOWED_PROFILES.has(requestedProfile) ? requestedProfile : "screen";
  const requestedFont = searchParams.get("font") ?? "";
  const requestedSize = Number(searchParams.get("size"));

  const book = getBook(bookId);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  // The print page falls back to the book's saved settings for anything not
  // passed here, so only forward values that are actually valid.
  const printParams = new URLSearchParams({ profile });
  if (ALLOWED_FONTS.has(requestedFont)) {
    printParams.set("font", requestedFont);
  }
  if (Number.isFinite(requestedSize) && requestedSize >= 8 && requestedSize <= 18) {
    printParams.set("size", String(requestedSize));
  }

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const printUrl = `${protocol}://${host}/books/${bookId}/print?${printParams}`;

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    // `networkidle` never settles against the dev server's HMR socket, so wait
    // for the document instead and then explicitly for webfonts and images.
    await page.goto(printUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("load", { timeout: 60_000 }).catch(() => {});

    await page.emulateMedia({ media: "print" });

    const pdfBuffer = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: false,
    });

    await browser.close();
    browser = undefined;

    const filename = `${toFilenameStem(book.title)}-${profile}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Playwright PDF generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF with Playwright engine", details: String(err) },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
