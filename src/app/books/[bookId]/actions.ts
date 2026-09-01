"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createChapter,
  deleteBook,
  deleteChapter,
  getBook,
  reorderChapters,
  updateBook,
  updateChapter,
} from "@/lib/books";

export async function createChapterAction(formData: FormData) {
  const bookId = String(formData.get("bookId") ?? "");

  if (!bookId || !getBook(bookId)) {
    redirect("/dashboard");
  }

  const chapterId = createChapter(bookId);
  revalidatePath(`/books/${bookId}`);
  redirect(`/books/${bookId}?chapter=${chapterId}`);
}

export async function saveChapterAction(formData: FormData) {
  const bookId = String(formData.get("bookId") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "");

  if (
    !bookId ||
    !chapterId ||
    !title ||
    title.length > 180 ||
    content.length > 1_000_000
  ) {
    redirect(`/books/${bookId}?chapter=${chapterId}&error=invalid-content`);
  }

  updateChapter({ bookId, chapterId, title, content });
  revalidatePath(`/books/${bookId}`);
  redirect(`/books/${bookId}?chapter=${chapterId}&saved=1`);
}

export async function deleteChapterAction(
  bookIdOrFormData: string | FormData,
  chapterIdArg?: string
) {
  let bookId = "";
  let chapterId = "";

  if (typeof bookIdOrFormData === "string") {
    bookId = bookIdOrFormData;
    chapterId = chapterIdArg ?? "";
  } else {
    bookId = String(bookIdOrFormData.get("bookId") ?? "");
    chapterId = String(bookIdOrFormData.get("chapterId") ?? "");
  }

  if (!bookId || !chapterId) {
    redirect("/dashboard");
  }

  deleteChapter(bookId, chapterId);
  revalidatePath(`/books/${bookId}`);
  redirect(`/books/${bookId}`);
}

export async function reorderChaptersAction(
  bookIdOrFormData: string | FormData,
  orderedIdsArg?: string[]
) {
  let bookId = "";
  let orderedIds: string[] = [];

  if (typeof bookIdOrFormData === "string") {
    bookId = bookIdOrFormData;
    orderedIds = orderedIdsArg ?? [];
  } else {
    bookId = String(bookIdOrFormData.get("bookId") ?? "");
    const orderedIdsRaw = String(bookIdOrFormData.get("orderedIds") ?? "");
    orderedIds = orderedIdsRaw.split(",").filter(Boolean);
  }

  if (!bookId || !orderedIds.length) {
    return { success: false };
  }

  reorderChapters(bookId, orderedIds);
  revalidatePath(`/books/${bookId}`);
  return { success: true };
}

export async function autosaveChapterAction(
  inputOrFormData:
    | { bookId: string; chapterId: string; title: string; content: string }
    | FormData
) {
  let bookId = "";
  let chapterId = "";
  let title = "";
  let content = "";

  if ("get" in inputOrFormData) {
    bookId = String(inputOrFormData.get("bookId") ?? "");
    chapterId = String(inputOrFormData.get("chapterId") ?? "");
    title = String(inputOrFormData.get("title") ?? "").trim();
    content = String(inputOrFormData.get("content") ?? "");
  } else {
    bookId = inputOrFormData.bookId;
    chapterId = inputOrFormData.chapterId;
    title = inputOrFormData.title.trim();
    content = inputOrFormData.content;
  }

  if (
    !bookId ||
    !chapterId ||
    !title ||
    title.length > 180 ||
    content.length > 1_000_000
  ) {
    return { success: false, error: "Invalid content length or empty title" };
  }

  updateChapter({ bookId, chapterId, title, content });
  revalidatePath(`/books/${bookId}`);
  return { success: true };
}

export async function updateBookDetailsAction({
  id,
  title,
  author,
  format,
}: {
  id: string;
  title: string;
  author: string;
  format: "a5" | "a4" | "six-by-nine";
}) {
  if (!id || !title.trim() || title.length > 160 || author.length > 120) {
    return { success: false, error: "Invalid title or author" };
  }

  updateBook({ id, title: title.trim(), author: author.trim(), format });
  revalidatePath(`/books/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteBookFromWorkspaceAction(bookId: string) {
  if (!bookId) {
    redirect("/dashboard");
  }

  await deleteBook(bookId);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function saveCoverDesignAction({
  bookId,
  coverDesign,
  coverImage,
}: {
  bookId: string;
  coverDesign: string;
  coverImage?: string;
}) {
  if (!bookId) {
    return { success: false, error: "Invalid book ID" };
  }

  const { updateBookCover } = await import("@/lib/books");
  updateBookCover({ id: bookId, coverDesign, coverImage });
  revalidatePath(`/books/${bookId}`);
  revalidatePath(`/books/${bookId}/cover`);
  return { success: true };
}

export async function duplicateBookFromWorkspaceAction(bookId: string) {
  if (!bookId) {
    redirect("/dashboard");
  }

  const { duplicateBook } = await import("@/lib/books");
  const newId = await duplicateBook(bookId);
  revalidatePath("/dashboard");
  redirect(`/books/${newId}`);
}
