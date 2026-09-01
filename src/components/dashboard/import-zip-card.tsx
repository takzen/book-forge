"use client";

import { useState, useTransition } from "react";
import { importBookZipAction } from "@/app/dashboard/actions";

export function ImportZipCard() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-3xl border border-[#1d241d]/15 bg-[#fdfaf3] p-6 text-[#1d241d] sm:p-7">
      <p className="text-xs font-bold tracking-[0.18em] text-[#b15636] uppercase">Backup & Import</p>
      <h3 className="mt-2 font-serif text-2xl tracking-[-0.03em]">Import project</h3>
      <p className="mt-2 text-xs leading-5 text-[#52604e]">
        Restore an existing book project from a Book Forge ZIP archive (including chapters, images, and cover design).
      </p>
      <form
        action={(formData) => {
          startTransition(async () => {
            await importBookZipAction(formData);
          });
        }}
        className="mt-5 grid gap-3"
      >
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#1d241d]/25 bg-white px-4 py-5 text-center transition hover:border-[#b15636]">
          <span className="text-2xl">📦</span>
          <span className="mt-1 text-xs font-semibold text-[#1d241d]">
            {selectedFile ? selectedFile.name : "Select .zip archive"}
          </span>
          <span className="text-[0.7rem] text-[#66705f]">
            {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : "Max file size 50 MB"}
          </span>
          <input
            type="file"
            name="file"
            accept=".zip,application/zip"
            required
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setSelectedFile(file);
            }}
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-[#1d241d] px-4 py-2.5 text-xs font-bold text-[#f8f1dd] transition hover:bg-[#284c42] disabled:opacity-50"
        >
          {isPending ? "Restoring..." : "Upload & Restore Book"}
        </button>
      </form>
    </div>
  );
}
