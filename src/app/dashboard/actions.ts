"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createBook } from "@/lib/books";

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
