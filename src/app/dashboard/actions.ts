"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createBook, deleteBook, duplicateBook, importBookFromZip, updateBook } from "@/lib/books";

export async function createBookAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const selectedFormat = String(formData.get("format") ?? "a5");
  const format = ["a5", "a4", "six-by-nine"].includes(selectedFormat)
    ? (selectedFormat as "a5" | "a4" | "six-by-nine")
    : "a5";

  if (!title || title.length > 160 || author.length > 120) {
    redirect("/dashboard?error=invalid-book-details");
  }

  const id = createBook({ title, author, format });
  revalidatePath("/dashboard");
  redirect(`/books/${id}`);
}

export async function updateBookAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const format = String(formData.get("format") ?? "a5") as
    | "a5"
    | "a4"
    | "six-by-nine";

  if (!id || !title || title.length > 160 || author.length > 120) {
    redirect("/dashboard?error=invalid-book-details");
  }

  updateBook({ id, title, author, format });
  revalidatePath("/dashboard");
}

export async function deleteBookAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/dashboard?error=invalid-book");
  }

  await deleteBook(id);
  revalidatePath("/dashboard");
}

export async function duplicateBookAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/dashboard?error=invalid-book");
  }

  const newId = await duplicateBook(id);
  revalidatePath("/dashboard");
  redirect(`/books/${newId}`);
}

export async function importBookZipAction(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/dashboard?error=no-file-uploaded");
  }

  if (file.size > 50 * 1024 * 1024) {
    redirect("/dashboard?error=file-too-large");
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const newId = await importBookFromZip(buffer);
    revalidatePath("/dashboard");
    redirect(`/books/${newId}`);
  } catch (error) {
    console.error("Import error:", error);
    redirect("/dashboard?error=import-failed");
  }
}
