import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const contentTypes: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

const bookIdPattern = /^[0-9a-f-]{36}$/i;
const filenamePattern = /^[0-9a-f-]{36}\.(png|jpg|webp|gif)$/i;

export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const [bookId, filename] = path;

  if (path.length !== 2 || !bookIdPattern.test(bookId) || !filenamePattern.test(filename)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const file = await readFile(join(process.cwd(), "data", "uploads", bookId, filename));
    const extension = filename.split(".").pop()?.toLowerCase() ?? "";
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentTypes[extension] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
