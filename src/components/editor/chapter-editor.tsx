"use client";

import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { autosaveChapterAction, createTocChapterAction, refreshTocContentAction, saveChapterAction } from "@/app/books/[bookId]/actions";

type ChapterEditorProps = {
  bookId: string;
  chapterId: string;
  initialTitle: string;
  initialContent: string;
  chapterType?: string;
  bookTitle?: string;
  bookFormat?: string;
  chapterNumber?: number;
  startPageNumber?: number;
  saved?: boolean;
  hasError?: boolean;
};

type SaveStatus = "saved" | "saving" | "unsaved" | "error";
type ViewMode = "split" | "editor" | "preview";

const formatDimensions: Record<
  string,
  { name: string; widthMm: number; heightMm: number; fontSizePt: number; lineHeight: number }
> = {
  a5: { name: "A5", widthMm: 148, heightMm: 210, fontSizePt: 10.5, lineHeight: 1.6 },
  b5: { name: "B5", widthMm: 170, heightMm: 240, fontSizePt: 11, lineHeight: 1.6 },
  "six-by-nine": { name: "6 × 9 in", widthMm: 152.4, heightMm: 228.6, fontSizePt: 11, lineHeight: 1.6 },
  a4: { name: "A4", widthMm: 210, heightMm: 297, fontSizePt: 12, lineHeight: 1.65 },
};

export function ChapterEditor({
  bookId,
  chapterId,
  initialTitle,
  initialContent,
  chapterType = "chapter",
  bookTitle = "",
  bookFormat = "a5",
  chapterNumber = 1,
  startPageNumber = 4,
  saved = false,
  hasError = false,
}: ChapterEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(
    hasError ? "error" : saved ? "saved" : "saved"
  );
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const isToc =
    chapterType === "toc" ||
    title.toLowerCase().includes("spis treści") ||
    title.toLowerCase().includes("table of contents") ||
    chapterNumber === 0;
  const isTocChapter = isToc;
  const currentFormat = formatDimensions[bookFormat] || formatDimensions.a5;

  // Keep track of values for timer cleanup
  const currentValuesRef = useRef({ title, content });
  currentValuesRef.current = { title, content };

  // Calculate live statistics
  const wordCount = (content.trim().match(/\S+/g) || []).length;
  const charCount = content.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Split content into fixed-size book pages
  const bookPages = useMemo(() => {
    if (!content.trim()) {
      return [""];
    }

    const wordsPerPage = bookFormat === "a4" ? 450 : bookFormat === "six-by-nine" ? 280 : 240;
    const firstPageWords = Math.floor(wordsPerPage * 0.75); // Reserve space for title & header
    
    const paragraphs = content.split(/\n\n+/);
    const pages: string[] = [];
    let currentParagraphs: string[] = [];
    let currentWordCount = 0;
    let isFirstPage = true;

    for (const para of paragraphs) {
      const paraWords = (para.trim().match(/\S+/g) || []).length;
      const limit = isFirstPage ? firstPageWords : wordsPerPage;

      if (currentParagraphs.length > 0 && currentWordCount + paraWords > limit) {
        pages.push(currentParagraphs.join("\n\n"));
        currentParagraphs = [para];
        currentWordCount = paraWords;
        isFirstPage = false;
      } else {
        currentParagraphs.push(para);
        currentWordCount += paraWords;
      }
    }

    if (currentParagraphs.length > 0) {
      pages.push(currentParagraphs.join("\n\n"));
    }

    return pages.length > 0 ? pages : [""];
  }, [content, bookFormat]);

  // Perform save
  const performSave = useCallback(
    async (currentTitle: string, currentContent: string) => {
      if (!currentTitle.trim()) {
        setSaveStatus("error");
        return;
      }
      setSaveStatus("saving");
      try {
        const result = await autosaveChapterAction({
          bookId,
          chapterId,
          title: currentTitle,
          content: currentContent,
        });

        if (result.success) {
          setSaveStatus("saved");
          setLastSavedAt(new Date());
        } else {
          setSaveStatus("error");
        }
      } catch {
        setSaveStatus("error");
      }
    },
    [bookId, chapterId]
  );

  // Debounced autosave effect
  useEffect(() => {
    // If title and content match initial, don't trigger
    if (title === initialTitle && content === initialContent && saveStatus === "saved") {
      return;
    }

    setSaveStatus("unsaved");

    const timer = setTimeout(() => {
      performSave(title, content);
    }, 1500);

    return () => clearTimeout(timer);
  }, [title, content, initialTitle, initialContent, performSave]);

  // Warn on closing window if unsaved
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (saveStatus === "unsaved" || saveStatus === "saving") {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus]);

  // Format Helper: Wrap selection
  function wrapSelection(before: string, after: string, defaultText = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end) || defaultText;
    const replacement = `${before}${selected}${after}`;

    const newContent = `${content.slice(0, start)}${replacement}${content.slice(end)}`;
    setContent(newContent);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorStart = start + before.length;
      const cursorEnd = cursorStart + selected.length;
      textarea.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  // Format Helper: Prefix current line or selected lines
  function prefixLines(prefix: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Find full lines spanning selection
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = content.indexOf("\n", end) === -1 ? content.length : content.indexOf("\n", end);

    const selectedText = content.slice(lineStart, lineEnd);
    const modifiedLines = selectedText
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n");

    const newContent = `${content.slice(0, lineStart)}${modifiedLines}${content.slice(lineEnd)}`;
    setContent(newContent);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + modifiedLines.length);
    });
  }

  // Format Helper: Insert Block
  function insertBlock(blockText: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newContent = `${content.slice(0, start)}${blockText}${content.slice(end)}`;
    setContent(newContent);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + blockText.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  // Keyboard shortcut handlers
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    const isMeta = e.ctrlKey || e.metaKey;

    if (isMeta && e.key.toLowerCase() === "s") {
      e.preventDefault();
      performSave(title, content);
      return;
    }

    if (isMeta && e.key.toLowerCase() === "b") {
      e.preventDefault();
      wrapSelection("**", "**", "bold text");
      return;
    }

    if (isMeta && e.key.toLowerCase() === "i") {
      e.preventDefault();
      wrapSelection("*", "*", "italic text");
      return;
    }

    if (isMeta && e.key.toLowerCase() === "k") {
      e.preventDefault();
      wrapSelection("[", "](https://...)", "link text");
      return;
    }

    // Tab key indent
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      setContent((prev) => `${prev.slice(0, start)}  ${prev.slice(end)}`);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  }

  // Insert image handler
  async function insertImage(event: ChangeEvent<HTMLInputElement>) {
    const image = event.target.files?.[0];
    event.target.value = "";

    if (!image) return;

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("bookId", bookId);
      formData.append("image", image);
      const response = await fetch("/api/uploads", { method: "POST", body: formData });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "The image could not be uploaded.");
      }

      const alt = image.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
      const textarea = textareaRef.current;
      const start = textarea?.selectionStart ?? content.length;
      const end = textarea?.selectionEnd ?? content.length;
      const imageMarkdown = `\n\n![${alt}](${payload.url})\n\n`;

      setContent((curr) => `${curr.slice(0, start)}${imageMarkdown}${curr.slice(end)}`);
      requestAnimationFrame(() => {
        textarea?.focus();
        const cursor = start + imageMarkdown.length;
        textarea?.setSelectionRange(cursor, cursor);
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "The image could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1d241d]/15 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-[0.18em] text-[#b15636] uppercase">
              Chapter Editor
            </span>
            {saveStatus === "saved" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#557549]/15 px-2.5 py-0.5 text-xs font-bold text-[#3e5934]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#557549]" />
                Saved locally {lastSavedAt && `(${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`}
              </span>
            )}
            {saveStatus === "saving" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d99d67]/20 px-2.5 py-0.5 text-xs font-bold text-[#96571e]">
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving changes…
              </span>
            )}
            {saveStatus === "unsaved" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e9e1d3] px-2.5 py-0.5 text-xs font-semibold text-[#66705f]">
                ● Unsaved changes
              </span>
            )}
            {saveStatus === "error" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                ⚠ Save error (check title)
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[#66705f]">
            <strong className="font-semibold text-[#1d241d]">{wordCount.toLocaleString()}</strong> words · {charCount.toLocaleString()} characters · ~{readingTimeMinutes} min read
          </p>
        </div>

        {/* View Mode & Save Button */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="hidden items-center rounded-xl bg-[#e9e1d3]/70 p-1 sm:flex">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                viewMode === "split" ? "bg-[#fdfaf3] text-[#1d241d] shadow-sm" : "text-[#66705f] hover:text-[#1d241d]"
              }`}
            >
              Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode("editor")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                viewMode === "editor" ? "bg-[#fdfaf3] text-[#1d241d] shadow-sm" : "text-[#66705f] hover:text-[#1d241d]"
              }`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                viewMode === "preview" ? "bg-[#fdfaf3] text-[#1d241d] shadow-sm" : "text-[#66705f] hover:text-[#1d241d]"
              }`}
            >
              Preview
            </button>
          </div>

          {/* Explicit Save Button */}
          <button
            type="button"
            onClick={() => performSave(title, content)}
            disabled={saveStatus === "saving"}
            title="Save changes (Ctrl+S / Cmd+S)"
            className="flex items-center gap-1.5 rounded-full bg-[#1d241d] px-4 py-2 text-xs font-bold text-[#f8f1dd] transition hover:bg-[#284c42] disabled:opacity-50"
          >
            <span>Save</span>
            <span className="hidden text-[0.65rem] opacity-60 sm:inline">⌘S</span>
          </button>
        </div>
      </div>

      {/* Chapter Title Field */}
      <div className="mt-6">
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={180}
          required
          placeholder="Chapter title..."
          className="w-full bg-transparent font-serif text-3xl font-bold tracking-[-0.04em] text-[#1d241d] outline-none placeholder:text-[#1d241d]/30 sm:text-5xl"
        />
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#1d241d]/15 bg-[#fdfaf3] p-2 text-sm text-[#52604e] shadow-xs">
        {/* Headings */}
        <button
          type="button"
          onClick={() => prefixLines("# ")}
          title="Heading 1"
          className="rounded-lg px-2 py-1 font-serif font-bold hover:bg-[#e9e1d3] hover:text-[#1d241d]"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => prefixLines("## ")}
          title="Heading 2"
          className="rounded-lg px-2 py-1 font-serif font-bold hover:bg-[#e9e1d3] hover:text-[#1d241d]"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => prefixLines("### ")}
          title="Heading 3"
          className="rounded-lg px-2 py-1 font-serif font-bold hover:bg-[#e9e1d3] hover:text-[#1d241d]"
        >
          H3
        </button>

        <span className="mx-1 h-5 w-[1px] bg-[#1d241d]/15" />

        {/* Text styling */}
        <button
          type="button"
          onClick={() => wrapSelection("**", "**", "bold text")}
          title="Bold (Ctrl+B)"
          className="rounded-lg px-2.5 py-1 font-bold hover:bg-[#e9e1d3] hover:text-[#1d241d]"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => wrapSelection("*", "*", "italic text")}
          title="Italic (Ctrl+I)"
          className="rounded-lg px-2.5 py-1 italic hover:bg-[#e9e1d3] hover:text-[#1d241d]"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => wrapSelection("~~", "~~", "strikethrough")}
          title="Strikethrough"
          className="rounded-lg px-2.5 py-1 line-through hover:bg-[#e9e1d3] hover:text-[#1d241d]"
        >
          S
        </button>

        <span className="mx-1 h-5 w-[1px] bg-[#1d241d]/15" />

        {/* Blocks & Lists */}
        <button
          type="button"
          onClick={() => prefixLines("> ")}
          title="Quote"
          className="rounded-lg px-2.5 py-1 font-serif hover:bg-[#e9e1d3] hover:text-[#1d241d]"
        >
          ❝ Quote
        </button>
        <button
          type="button"
          onClick={() => prefixLines("- ")}
          title="Bullet List"
          className="rounded-lg px-2.5 py-1 hover:bg-[#e9e1d3] hover:text-[#1d241d]"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => prefixLines("1. ")}
          title="Numbered List"
          className="rounded-lg px-2.5 py-1 hover:bg-[#e9e1d3] hover:text-[#1d241d]"
        >
          1. Numbered
        </button>
        <button
          type="button"
          onClick={() => wrapSelection("`", "`", "code")}
          title="Inline Code"
          className="rounded-lg px-2.5 py-1 font-mono text-xs hover:bg-[#e9e1d3] hover:text-[#1d241d]"
        >
          &lt;/&gt;
        </button>
        <button
          type="button"
          onClick={() => insertBlock("\n```\n// Code block here\n```\n")}
          title="Code Block"
          className="rounded-lg px-2.5 py-1 font-mono text-xs hover:bg-[#e9e1d3] hover:text-[#1d241d]"
        >
          ```
        </button>
        <button
          type="button"
          onClick={() => insertBlock("\n\n---\n\n")}
          title="Horizontal Divider"
          className="rounded-lg px-2.5 py-1 hover:bg-[#e9e1d3] hover:text-[#1d241d]"
        >
          ― Divider
        </button>
        <button
          type="button"
          onClick={() => wrapSelection("[", "](https://...)", "link text")}
          title="Link (Ctrl+K)"
          className="rounded-lg px-2.5 py-1 hover:bg-[#e9e1d3] hover:text-[#1d241d]"
        >
          🔗 Link
        </button>

        <span className="mx-1 h-5 w-[1px] bg-[#1d241d]/15" />

        {/* Image upload button */}
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-[#b15636] transition hover:bg-[#b15636]/10">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={insertImage}
            disabled={uploading}
          />
          <span>🖼 {uploading ? "Uploading…" : "Add image"}</span>
        </label>

        {/* Generate / Refresh / Add Table of Contents pages */}
        {isTocChapter && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const res = await refreshTocContentAction(bookId, chapterId);
                if (res.success && res.content) {
                  setContent(res.content);
                  performSave(title, res.content);
                }
              }}
              title="Odśwież rozdziały dla tej strony spisu treści"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#284c42]/10 px-2.5 py-1 text-xs font-bold text-[#284c42] transition hover:bg-[#284c42] hover:text-[#f8f1dd]"
            >
              <span>📑</span>
              <span>Odśwież tę stronę spisu</span>
            </button>

            <form action={createTocChapterAction}>
              <input type="hidden" name="bookId" value={bookId} />
              <button
                type="submit"
                title="Wstaw nową kolejną stronę spisu treści"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#b15636] px-2.5 py-1 text-xs font-bold text-white transition hover:bg-[#964225] shadow-xs"
              >
                <span>+</span>
                <span>Wstaw kolejną stronę spisu</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="mt-2 rounded-xl bg-red-50 p-2.5 text-xs font-medium text-red-700">
          ⚠ {uploadError}
        </div>
      )}

      {/* Editor & Preview Panes */}
      <div className="mt-4 flex-1 min-h-0 grid gap-6 xl:grid-cols-2">
        {/* Editor Pane */}
        {(viewMode === "split" || viewMode === "editor") && (
          <div className={`flex h-full min-h-0 flex-col ${viewMode === "editor" ? "xl:col-span-2" : ""}`}>
            <div className="mb-2 flex shrink-0 items-center justify-between text-xs font-bold tracking-[0.16em] text-[#66705f] uppercase">
              <span>Edytor tekstu</span>
              <span className="text-[11px] font-medium lowercase tracking-normal text-[#8c9785]">autozapis aktywny</span>
            </div>
            <textarea
              ref={textareaRef}
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Wpisz treść rozdziału..."
              className="h-full w-full resize-none overflow-y-auto rounded-2xl border border-[#1d241d]/15 bg-[#fdfaf3] p-6 font-mono text-sm leading-relaxed text-[#2a332a] outline-none transition focus:border-[#b15636] focus:ring-4 focus:ring-[#b15636]/10"
              spellCheck
            />
          </div>
        )}

        {/* Live Preview Pane */}
        {(viewMode === "split" || viewMode === "preview") && (
          <div className={`flex h-full min-h-0 flex-col ${viewMode === "preview" ? "xl:col-span-2" : ""}`}>
            <div className="mb-2 flex shrink-0 items-center justify-between text-xs font-bold tracking-[0.16em] text-[#66705f] uppercase">
              <span>
                Strony książki ({currentFormat.name}) · {isToc ? "Spis treści" : `Rozdział ${chapterNumber}`} · {bookPages.length} {bookPages.length === 1 ? "strona" : "stron"}
              </span>
              <span className="text-[11px] font-medium lowercase tracking-normal text-[#8c9785]">
                strony {startPageNumber}–{startPageNumber + bookPages.length - 1} w książce
              </span>
            </div>
            {/* Real eBook Page Viewport with Fixed-Height Sheets */}
            <div className="flex h-full w-full min-h-0 flex-col items-center overflow-y-auto rounded-2xl border border-[#1d241d]/15 bg-[#ded7c8]/50 p-4 sm:p-8 shadow-inner space-y-8">
              {bookPages.map((pageText, pageIndex) => (
                <div
                  key={pageIndex}
                  style={{
                    width: `${currentFormat.widthMm * 3.78}px`,
                    height: `${currentFormat.heightMm * 3.78}px`,
                  }}
                  className="book-page chapter-page shrink-0 bg-white p-10 sm:p-14 shadow-2xl transition flex flex-col justify-between overflow-hidden"
                >
                  {/* Header running title (Żywa pagina) */}
                  <div className="flex items-center justify-between border-b border-[#1d241d]/10 pb-3 text-[0.75rem] text-[#66705f] shrink-0">
                    <span className="font-serif italic truncate max-w-[220px]" title={bookTitle}>
                      {bookTitle || "Książka"}
                    </span>
                    <span className="font-sans uppercase tracking-wider text-[0.7rem] text-[#b15636] font-semibold truncate max-w-[240px]">
                      {isToc
                        ? pageIndex === 0
                          ? "Spis treści"
                          : "Spis treści (cd.)"
                        : pageIndex === 0
                        ? `Rozdział ${chapterNumber}: ${title.trim() || "Bez tytułu"}`
                        : `${title.trim() || "Rozdział"} (cd.)`}
                    </span>
                  </div>

                  {/* Chapter Content Body */}
                  <div className="flex-1 min-h-0 py-6 overflow-hidden">
                    {pageIndex === 0 && (
                      <div className="mb-6 shrink-0">
                        <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1d241d]">
                          {title || "Bez tytułu"}
                        </h2>
                        <div className="mt-4 h-[1px] w-12 bg-[#b15636]" />
                      </div>
                    )}

                    <article
                      className="markdown-preview leading-relaxed text-[#222822]"
                      style={{
                        fontSize: `${currentFormat.fontSizePt}pt`,
                        lineHeight: currentFormat.lineHeight,
                      }}
                    >
                      {pageText.trim() ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{pageText}</ReactMarkdown>
                      ) : (
                        <p className="font-sans text-sm italic text-[#8c9785]">
                          Prawa strona od razu pokazuje sformatowany tekst tak, jak widzi go czytelnik w gotowej książce.
                        </p>
                      )}
                    </article>
                  </div>

                  {/* Page Footer (Numeracja stron w książce) */}
                  <div className="flex items-center justify-between border-t border-[#1d241d]/10 pt-3 text-xs font-serif text-[#66705f] shrink-0">
                    <span className="text-[11px] text-[#8c9785]">
                      Strona {pageIndex + 1} z {bookPages.length}
                    </span>
                    <span className="font-semibold text-[#1d241d]">
                      — {startPageNumber + pageIndex} —
                    </span>
                    <span className="text-[11px] text-[#8c9785]">
                      {currentFormat.name} · {currentFormat.fontSizePt}pt
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Form fallback for non-JS / standard form submissions */}
      <form action={saveChapterAction} className="sr-only">
        <input type="hidden" name="bookId" value={bookId} />
        <input type="hidden" name="chapterId" value={chapterId} />
        <input type="hidden" name="title" value={title} />
        <input type="hidden" name="content" value={content} />
      </form>
    </div>
  );
}
