import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { getBook, updateBookCover } from "@/lib/books";
import { getBookUploadsDir } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bookIdPattern = /^[0-9a-f-]{36}$/i;
const DEFAULT_WIDTH = 1600;
const MAX_WIDTH = 4000;

/**
 * Renders the cover to PNG by screenshotting the same React component the
 * designer draws on screen, then stores it as the book's cover image.
 *
 * This replaces a hand-written canvas renderer that reproduced the design
 * approximately: it used different font stacks than the preview, scaled type by
 * a hard-coded factor, ignored letter-spacing, opacity and element borders,
 * never wrapped long text, and recognised only three hard-coded gradients.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;

  if (!bookIdPattern.test(bookId)) {
    return NextResponse.json({ error: "Invalid book ID" }, { status: 400 });
  }

  const book = getBook(bookId);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }
  if (!book.coverDesign) {
    return NextResponse.json(
      { error: "Save the cover design before exporting." },
      { status: 400 }
    );
  }

  const requested = Number(request.nextUrl.searchParams.get("width"));
  const width =
    Number.isFinite(requested) && requested >= 200 && requested <= MAX_WIDTH
      ? Math.round(requested)
      : DEFAULT_WIDTH;

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const renderUrl = `${protocol}://${host}/books/${bookId}/cover/render?width=${width}`;

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    // deviceScaleFactor 1: the page already renders at the full export size, so
    // scaling again would only resample it.
    const page = await browser.newPage({
      viewport: { width, height: Math.min(width * 2, 8000) },
      deviceScaleFactor: 1,
    });
    await page.goto(renderUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("load", { timeout: 60_000 }).catch(() => {});

    const element = await page.$("#cover-root");
    if (!element) {
      throw new Error("Cover render page produced no artwork");
    }
    const screenshot = await element.screenshot({ type: "png" });

    await browser.close();
    browser = undefined;

    const directory = getBookUploadsDir(bookId);
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}.png`;
    await writeFile(join(directory, filename), screenshot);

    const url = `/api/uploads/${bookId}/${filename}`;
    updateBookCover({ id: bookId, coverImage: url });

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("Cover render error:", error);
    return NextResponse.json(
      { error: "Failed to render the cover.", details: String(error) },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
