import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const imageTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const maximumImageSize = 20 * 1024 * 1024;
const bookIdPattern = /^[0-9a-f-]{36}$/i;

export async function POST(request: Request) {
  const formData = await request.formData();
  const bookId = String(formData.get("bookId") ?? "");
  const image = formData.get("image");

  if (!bookIdPattern.test(bookId)) {
    return NextResponse.json({ error: "Invalid book." }, { status: 400 });
  }

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }

  const extension = imageTypes.get(image.type);
  if (!extension) {
    return NextResponse.json({ error: "Use a PNG, JPG, WebP or GIF image." }, { status: 415 });
  }

  if (image.size === 0 || image.size > maximumImageSize) {
    return NextResponse.json({ error: "The image must be smaller than 20 MB." }, { status: 413 });
  }

  const filename = `${randomUUID()}.${extension}`;
  const directory = join(process.cwd(), "data", "uploads", bookId);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, filename), Buffer.from(await image.arrayBuffer()));

  return NextResponse.json({ url: `/api/uploads/${bookId}/${filename}` }, { status: 201 });
}
