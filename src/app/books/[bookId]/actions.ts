"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createChapter, getBook, updateChapter } from "@/lib/books";

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

  if (!bookId || !chapterId || !title || title.length > 180 || content.length > 1_000_000) {
    redirect(`/books/${bookId}?chapter=${chapterId}&error=invalid-content`);
  }

  updateChapter({ bookId, chapterId, title, content });
  revalidatePath(`/books/${bookId}`);
  redirect(`/books/${bookId}?chapter=${chapterId}&saved=1`);
}
