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

  let newId: string;
  try {
    newId = await duplicateBook(id);
  } catch (error) {
    console.error("Duplicate error:", error);
    redirect("/dashboard?error=duplicate-failed");
  }

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

  // `redirect()` reports the redirect by throwing, so it has to stay outside the
  // try block — catching it here turned every successful import into
  // "import-failed" even though the book had already been created.
  let newId: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    newId = await importBookFromZip(buffer);
  } catch (error) {
    console.error("Import error:", error);
    redirect("/dashboard?error=import-failed");
  }

  revalidatePath("/dashboard");
  redirect(`/books/${newId}`);
}
