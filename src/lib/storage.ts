import { isAbsolute, join } from "node:path";

/**
 * Root directory for uploaded images. Overridable through `BOOK_FORGE_UPLOADS`
 * so the test suite stays out of the real library, matching `BOOK_FORGE_DB`.
 */
export function getUploadsRoot() {
  const override = process.env.BOOK_FORGE_UPLOADS;
  if (override) {
    return isAbsolute(override) ? override : join(process.cwd(), override);
  }
  return join(process.cwd(), "data", "uploads");
}

export function getBookUploadsDir(bookId: string) {
  return join(getUploadsRoot(), bookId);
}
