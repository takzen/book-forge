"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveCoverDesignAction } from "@/app/books/[bookId]/actions";

export type CoverElement = {
  id: string;
  type: "text" | "image" | "shape";
  content?: string; // for text or image url
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  fontSize?: number; // pt
  fontFamily?: "serif" | "sans" | "mono" | "display";
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textTransform?: "none" | "uppercase" | "lowercase";
  textAlign?: "left" | "center" | "right";
  color?: string;
  backgroundColor?: string;
  letterSpacing?: number; // px
  opacity?: number; // 0-1
  borderWidth?: number; // px
  borderColor?: string;
  borderRadius?: number; // px
  zIndex: number;
};

export type CoverDesignState = {
  backgroundType: "color" | "gradient" | "image";
  backgroundColor: string;
  backgroundGradient: string;
  backgroundImageUrl: string;
  hasBorder: boolean;
  borderColor: string;
  borderMargin: number; // px
  borderWidth: number; // px
  elements: CoverElement[];
};

type CoverDesignerProps = {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookFormat: string;
  initialDesign?: string;
  coverImage?: string;
};

const DEFAULT_TEMPLATES = [
  {
    name: "Classic Minimalist",
    description: "Serif typography, clean warm ivory background and delicate framing",
    build: (title: string, author: string): CoverDesignState => ({
      backgroundType: "color",
      backgroundColor: "#f7f3eb",
      backgroundGradient: "",
      backgroundImageUrl: "",
      hasBorder: true,
      borderColor: "#b15636",
      borderMargin: 24,
      borderWidth: 2,
      elements: [
        {
          id: "sub-1",
          type: "text",
          content: "A NOVEL",
          x: 10,
          y: 20,
          width: 80,
          fontSize: 12,
          fontFamily: "sans",
          fontWeight: "bold",
          fontStyle: "normal",
          textTransform: "uppercase",
          textAlign: "center",
          color: "#8c533e",
          letterSpacing: 4,
          zIndex: 1,
        },
        {
          id: "title-1",
          type: "text",
          content: title || "Book Title",
          x: 10,
          y: 35,
          width: 80,
          fontSize: 36,
          fontFamily: "serif",
          fontWeight: "bold",
          fontStyle: "normal",
          textTransform: "none",
          textAlign: "center",
          color: "#1d241d",
          letterSpacing: -0.5,
          zIndex: 2,
        },
        {
          id: "author-1",
          type: "text",
          content: author || "Author Name",
          x: 10,
          y: 82,
          width: 80,
          fontSize: 15,
          fontFamily: "serif",
          fontWeight: "normal",
          fontStyle: "italic",
          textTransform: "none",
          textAlign: "center",
          color: "#465243",
          letterSpacing: 2,
          zIndex: 3,
        },
      ],
    }),
  },
  {
    name: "Modern Emerald",
    description: "Deep dark green gradient with luminous gold & cream typography",
    build: (title: string, author: string): CoverDesignState => ({
      backgroundType: "gradient",
      backgroundColor: "#162822",
      backgroundGradient: "linear-gradient(145deg, #10211c 0%, #1e382f 50%, #10241e 100%)",
      backgroundImageUrl: "",
      hasBorder: false,
      borderColor: "#d99d67",
      borderMargin: 20,
      borderWidth: 1,
      elements: [
        {
          id: "tag-1",
          type: "text",
          content: "FIRST EDITION",
          x: 12,
          y: 16,
          width: 76,
          fontSize: 10,
          fontFamily: "sans",
          fontWeight: "bold",
          fontStyle: "normal",
          textTransform: "uppercase",
          textAlign: "left",
          color: "#d99d67",
          letterSpacing: 3,
          zIndex: 1,
        },
        {
          id: "title-1",
          type: "text",
          content: title || "Book Title",
          x: 12,
          y: 28,
          width: 76,
          fontSize: 42,
          fontFamily: "sans",
          fontWeight: "bold",
          fontStyle: "normal",
          textTransform: "none",
          textAlign: "left",
          color: "#f8f1dd",
          letterSpacing: -1,
          zIndex: 2,
        },
        {
          id: "author-1",
          type: "text",
          content: author ? `BY ${author.toUpperCase()}` : "BY AUTHOR",
          x: 12,
          y: 84,
          width: 76,
          fontSize: 13,
          fontFamily: "sans",
          fontWeight: "bold",
          fontStyle: "normal",
          textTransform: "uppercase",
          textAlign: "left",
          color: "#9cb69e",
          letterSpacing: 2,
          zIndex: 3,
        },
      ],
    }),
  },
  {
    name: "Midnight Indigo",
    description: "Sleek dark theme with centered luxury serif title",
    build: (title: string, author: string): CoverDesignState => ({
      backgroundType: "gradient",
      backgroundColor: "#141724",
      backgroundGradient: "linear-gradient(180deg, #1a1e30 0%, #0d0f17 100%)",
      backgroundImageUrl: "",
      hasBorder: true,
      borderColor: "#3b4468",
      borderMargin: 20,
      borderWidth: 1,
      elements: [
        {
          id: "title-1",
          type: "text",
          content: title || "Book Title",
          x: 10,
          y: 40,
          width: 80,
          fontSize: 34,
          fontFamily: "serif",
          fontWeight: "bold",
          fontStyle: "normal",
          textTransform: "none",
          textAlign: "center",
          color: "#ffffff",
          letterSpacing: 0,
          zIndex: 2,
        },
        {
          id: "author-1",
          type: "text",
          content: author || "Author Name",
          x: 10,
          y: 78,
          width: 80,
          fontSize: 14,
          fontFamily: "sans",
          fontWeight: "normal",
          fontStyle: "normal",
          textTransform: "uppercase",
          textAlign: "center",
          color: "#96a1cc",
          letterSpacing: 3,
          zIndex: 3,
        },
      ],
    }),
  },
  {
    name: "Terracotta Earth",
    description: "Warm earth tones with striking bold title and accent bar",
    build: (title: string, author: string): CoverDesignState => ({
      backgroundType: "color",
      backgroundColor: "#b15636",
      backgroundGradient: "",
      backgroundImageUrl: "",
      hasBorder: false,
      borderColor: "#f8f1dd",
      borderMargin: 20,
      borderWidth: 1,
      elements: [
        {
          id: "title-1",
          type: "text",
          content: title || "Book Title",
          x: 10,
          y: 30,
          width: 80,
          fontSize: 38,
          fontFamily: "serif",
          fontWeight: "bold",
          fontStyle: "normal",
          textTransform: "none",
          textAlign: "center",
          color: "#f8f1dd",
          letterSpacing: -0.5,
          zIndex: 2,
        },
        {
          id: "author-1",
          type: "text",
          content: author || "Author Name",
          x: 10,
          y: 75,
          width: 80,
          fontSize: 15,
          fontFamily: "sans",
          fontWeight: "bold",
          fontStyle: "normal",
          textTransform: "uppercase",
          textAlign: "center",
          color: "#284c42",
          backgroundColor: "#f8f1dd",
          letterSpacing: 2,
          borderRadius: 8,
          zIndex: 3,
        },
      ],
    }),
  },
];

export function CoverDesigner({
  bookId,
  bookTitle,
  bookAuthor,
  bookFormat,
  initialDesign,
  coverImage: initialCoverImage,
}: CoverDesignerProps) {
  // Parse or initialize design state
  const [design, setDesign] = useState<CoverDesignState>(() => {
    if (initialDesign) {
      try {
        return JSON.parse(initialDesign);
      } catch {
        // Fallback
      }
    }
    return DEFAULT_TEMPLATES[0].build(bookTitle, bookAuthor);
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [currentCoverUrl, setCurrentCoverUrl] = useState(initialCoverImage || "");
  const [isExporting, setIsExporting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    elementId: string;
    startX: number;
    startY: number;
    elemStartX: number;
    elemStartY: number;
  } | null>(null);

  // Aspect ratios based on book format
  const aspectRatios: Record<string, string> = {
    a5: "aspect-[148/210]", // 1 : 1.419
    "six-by-nine": "aspect-[6/9]", // 1 : 1.5
    a4: "aspect-[210/297]", // 1 : 1.414
  };
  const canvasAspect = aspectRatios[bookFormat] || "aspect-[148/210]";

  const selectedElement = design.elements.find((e) => e.id === selectedId);

  // Save design to database
  const saveDesign = useCallback(
    async (coverImgUrl?: string) => {
      setIsSaving(true);
      setSavedSuccess(false);
      try {
        const json = JSON.stringify(design);
        await saveCoverDesignAction({
          bookId,
          coverDesign: json,
          coverImage: coverImgUrl !== undefined ? coverImgUrl : currentCoverUrl,
        });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSaving(false);
      }
    },
    [bookId, design, currentCoverUrl]
  );

  // Dragging logic
  function handleMouseDown(e: React.MouseEvent, elementId: string) {
    e.stopPropagation();
    setSelectedId(elementId);

    const elem = design.elements.find((el) => el.id === elementId);
    if (!elem || !canvasRef.current) return;

    dragRef.current = {
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      elemStartX: elem.x,
      elemStartY: elem.y,
    };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const deltaXPercent = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - dragRef.current.startY) / rect.height) * 100;

    const newX = Math.max(0, Math.min(100 - (selectedElement?.width ?? 20), dragRef.current.elemStartX + deltaXPercent));
    const newY = Math.max(0, Math.min(95, dragRef.current.elemStartY + deltaYPercent));

    setDesign((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === dragRef.current?.elementId
          ? { ...el, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 }
          : el
      ),
    }));
  }

  function handleMouseUp() {
    dragRef.current = null;
  }

  // Update selected element property
  function updateSelected(updates: Partial<CoverElement>) {
    if (!selectedId) return;
    setDesign((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === selectedId ? { ...el, ...updates } : el)),
    }));
  }

  // Add new element
  function addElement(type: "text" | "image" | "shape") {
    const newId = `elem-${Date.now()}`;
    const maxZ = Math.max(...design.elements.map((e) => e.zIndex), 0);

    const newElem: CoverElement = {
      id: newId,
      type,
      content: type === "text" ? "New Text Line" : "",
      x: 15,
      y: 50,
      width: 70,
      fontSize: 20,
      fontFamily: "serif",
      fontWeight: "normal",
      fontStyle: "normal",
      textTransform: "none",
      textAlign: "center",
      color: design.backgroundType === "color" && design.backgroundColor === "#f7f3eb" ? "#1d241d" : "#ffffff",
      letterSpacing: 0,
      zIndex: maxZ + 1,
    };

    setDesign((prev) => ({
      ...prev,
      elements: [...prev.elements, newElem],
    }));
    setSelectedId(newId);
  }

  // Delete element
  function deleteElement(id: string) {
    setDesign((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
    }));
    if (selectedId === id) setSelectedId(null);
  }

  // Export to high-res PNG
  async function exportHighResCover() {
    if (!canvasRef.current) return;
    setIsExporting(true);

    try {
      // Create offscreen canvas with print resolution (e.g. 1600 x 2400)
      const width = 1600;
      const height = bookFormat === "six-by-nine" ? 2400 : 2262; // A5 aspect is 1:1.414, 6x9 is 1:1.5

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // 1. Draw Background
      if (design.backgroundType === "gradient" && design.backgroundGradient) {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        if (design.backgroundColor === "#162822") {
          grad.addColorStop(0, "#10211c");
          grad.addColorStop(0.5, "#1e382f");
          grad.addColorStop(1, "#10241e");
        } else if (design.backgroundColor === "#141724") {
          grad.addColorStop(0, "#1a1e30");
          grad.addColorStop(1, "#0d0f17");
        } else {
          grad.addColorStop(0, "#284c42");
          grad.addColorStop(1, "#12201c");
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = design.backgroundColor || "#f7f3eb";
        ctx.fillRect(0, 0, width, height);
      }

      // Background Image if present
      if (design.backgroundImageUrl) {
        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          bgImg.onload = resolve;
          bgImg.onerror = reject;
          bgImg.src = design.backgroundImageUrl;
        });
        ctx.drawImage(bgImg, 0, 0, width, height);
      }

      // 2. Draw Outer Border Frame if enabled
      if (design.hasBorder) {
        ctx.strokeStyle = design.borderColor || "#b15636";
        ctx.lineWidth = (design.borderWidth || 2) * 4;
        const margin = (design.borderMargin || 24) * 4;
        ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
      }

      // 3. Draw Elements sorted by zIndex
      const sortedElements = [...design.elements].sort((a, b) => a.zIndex - b.zIndex);

      for (const el of sortedElements) {
        const elX = (el.x / 100) * width;
        const elY = (el.y / 100) * height;
        const elWidth = (el.width / 100) * width;

        if (el.type === "text" && el.content) {
          const fontPt = el.fontSize || 20;
          const fontPx = fontPt * 3.8; // scale up for high-res
          const family =
            el.fontFamily === "serif"
              ? "Georgia, serif"
              : el.fontFamily === "mono"
              ? "monospace"
              : "Inter, sans-serif";

          ctx.save();
          ctx.font = `${el.fontStyle === "italic" ? "italic " : ""}${
            el.fontWeight === "bold" ? "bold " : ""
          }${fontPx}px ${family}`;
          ctx.fillStyle = el.color || "#1d241d";
          ctx.textBaseline = "top";

          let textToDraw = el.content;
          if (el.textTransform === "uppercase") textToDraw = textToDraw.toUpperCase();
          if (el.textTransform === "lowercase") textToDraw = textToDraw.toLowerCase();

          // Calculate text position based on alignment
          let drawX = elX;
          if (el.textAlign === "center") {
            ctx.textAlign = "center";
            drawX = elX + elWidth / 2;
          } else if (el.textAlign === "right") {
            ctx.textAlign = "right";
            drawX = elX + elWidth;
          } else {
            ctx.textAlign = "left";
            drawX = elX;
          }

          // Draw background pill if present
          if (el.backgroundColor) {
            const metrics = ctx.measureText(textToDraw);
            const padding = 24;
            ctx.fillStyle = el.backgroundColor;
            const pillX = el.textAlign === "center" ? drawX - metrics.width / 2 - padding : drawX - padding;
            ctx.beginPath();
            ctx.roundRect(pillX, elY - padding / 2, metrics.width + padding * 2, fontPx + padding, 16);
            ctx.fill();
            ctx.fillStyle = el.color || "#ffffff";
          }

          ctx.fillText(textToDraw, drawX, elY);
          ctx.restore();
        } else if (el.type === "image" && el.content) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve; // don't crash
            img.src = el.content!;
          });
          const imgH = elWidth * (img.height / (img.width || 1));
          ctx.drawImage(img, elX, elY, elWidth, imgH);
        }
      }

      // Convert canvas to Blob
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1.0));
      if (!blob) throw new Error("Could not create PNG blob");

      // Upload to project uploads
      const formData = new FormData();
      formData.append("bookId", bookId);
      formData.append("image", new File([blob], "cover.png", { type: "image/png" }));

      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();

      if (res.ok && data.url) {
        setCurrentCoverUrl(data.url);
        await saveDesign(data.url);

        // Also trigger browser download for the user
        const a = document.createElement("a");
        a.href = data.url;
        a.download = `${bookTitle.toLowerCase().replace(/\s+/g, "-")}-cover.png`;
        a.click();
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export cover. Please check element images.");
    } finally {
      setIsExporting(false);
    }
  }

  // Handle image upload for elements or background
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, target: "background" | "element") {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("bookId", bookId);
      formData.append("image", file);
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();

      if (res.ok && data.url) {
        if (target === "background") {
          setDesign((prev) => ({
            ...prev,
            backgroundType: "image",
            backgroundImageUrl: data.url,
          }));
        } else {
          const newId = `img-${Date.now()}`;
          const maxZ = Math.max(...design.elements.map((el) => el.zIndex), 0);
          setDesign((prev) => ({
            ...prev,
            elements: [
              ...prev.elements,
              {
                id: newId,
                type: "image",
                content: data.url,
                x: 25,
                y: 30,
                width: 50,
                zIndex: maxZ + 1,
              },
            ],
          }));
          setSelectedId(newId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#e9e1d3] text-[#1d241d]">
      {/* Top Navbar */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1d241d]/15 bg-[#f6f1e8] px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/books/${bookId}`}
            className="text-xs font-bold tracking-[0.16em] text-[#b15636] uppercase hover:opacity-80"
          >
            ← Back to Manuscript
          </Link>
          <span className="h-4 w-[1px] bg-[#1d241d]/15" />
          <h1 className="font-serif text-xl font-bold tracking-tight text-[#1d241d]">{bookTitle} — Cover Studio</h1>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && <span className="text-xs font-bold text-[#3e5934]">✓ Cover saved locally</span>}

          <button
            type="button"
            onClick={() => saveDesign()}
            disabled={isSaving}
            className="rounded-full border border-[#1d241d]/20 bg-[#fdfaf3] px-4 py-2 text-xs font-bold text-[#1d241d] transition hover:bg-white"
          >
            {isSaving ? "Saving…" : "Save Design"}
          </button>

          <button
            type="button"
            onClick={exportHighResCover}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-full bg-[#284c42] px-5 py-2 text-xs font-bold text-[#f8f1dd] shadow-sm transition hover:bg-[#1d241d]"
          >
            {isExporting ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Exporting 300 DPI…
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export High-Res PNG
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[20rem_1fr_22rem]">
        {/* Left Sidebar: Presets & Tools */}
        <aside className="border-b border-[#1d241d]/15 bg-[#f6f1e8] p-6 lg:border-r lg:border-b-0">
          <p className="text-xs font-bold tracking-[0.16em] text-[#66705f] uppercase">Cover Templates</p>
          <div className="mt-3 space-y-2.5">
            {DEFAULT_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => {
                  if (confirm(`Load "${tmpl.name}" template? This will replace current cover elements.`)) {
                    setDesign(tmpl.build(bookTitle, bookAuthor));
                    setSelectedId(null);
                  }
                }}
                className="w-full rounded-2xl border border-[#1d241d]/10 bg-[#fdfaf3] p-3 text-left transition hover:border-[#b15636] hover:shadow-sm"
              >
                <p className="font-serif text-sm font-bold text-[#1d241d]">{tmpl.name}</p>
                <p className="mt-1 text-xs text-[#66705f]">{tmpl.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-8 border-t border-[#1d241d]/15 pt-6">
            <p className="text-xs font-bold tracking-[0.16em] text-[#66705f] uppercase">Add Elements</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => addElement("text")}
                className="rounded-xl border border-[#1d241d]/15 bg-[#fdfaf3] p-2.5 text-xs font-semibold text-[#1d241d] transition hover:border-[#b15636]"
              >
                + Add Text
              </button>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[#1d241d]/15 bg-[#fdfaf3] p-2.5 text-xs font-semibold text-[#1d241d] transition hover:border-[#b15636]">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handleImageUpload(e, "element")}
                />
                {uploadingImage ? "Uploading…" : "+ Add Image"}
              </label>
            </div>
          </div>

          {/* Background Settings */}
          <div className="mt-8 border-t border-[#1d241d]/15 pt-6">
            <p className="text-xs font-bold tracking-[0.16em] text-[#66705f] uppercase">Background</p>
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDesign((prev) => ({ ...prev, backgroundType: "color", backgroundColor: "#f7f3eb" }))}
                  className="h-7 w-7 rounded-full border border-[#1d241d]/20 bg-[#f7f3eb]"
                  title="Cream"
                />
                <button
                  type="button"
                  onClick={() => setDesign((prev) => ({ ...prev, backgroundType: "color", backgroundColor: "#ffffff" }))}
                  className="h-7 w-7 rounded-full border border-[#1d241d]/20 bg-white"
                  title="White"
                />
                <button
                  type="button"
                  onClick={() => setDesign((prev) => ({ ...prev, backgroundType: "color", backgroundColor: "#b15636" }))}
                  className="h-7 w-7 rounded-full bg-[#b15636]"
                  title="Terracotta"
                />
                <button
                  type="button"
                  onClick={() => setDesign((prev) => ({ ...prev, backgroundType: "color", backgroundColor: "#284c42" }))}
                  className="h-7 w-7 rounded-full bg-[#284c42]"
                  title="Forest"
                />
                <button
                  type="button"
                  onClick={() => setDesign((prev) => ({ ...prev, backgroundType: "color", backgroundColor: "#181b22" }))}
                  className="h-7 w-7 rounded-full bg-[#181b22]"
                  title="Charcoal"
                />
                <input
                  type="color"
                  value={design.backgroundColor}
                  onChange={(e) =>
                    setDesign((prev) => ({ ...prev, backgroundType: "color", backgroundColor: e.target.value }))
                  }
                  className="h-7 w-7 cursor-pointer rounded-full border-0"
                  title="Custom Color"
                />
              </div>

              {/* Decorative Frame Toggle */}
              <label className="flex cursor-pointer items-center justify-between rounded-xl bg-[#fdfaf3] p-2.5 text-xs font-semibold text-[#1d241d]">
                <span>Border Frame</span>
                <input
                  type="checkbox"
                  checked={design.hasBorder}
                  onChange={(e) => setDesign((prev) => ({ ...prev, hasBorder: e.target.checked }))}
                  className="h-4 w-4 rounded accent-[#b15636]"
                />
              </label>

              {design.hasBorder && (
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="text-[#66705f]">Border Color</span>
                  <input
                    type="color"
                    value={design.borderColor}
                    onChange={(e) => setDesign((prev) => ({ ...prev, borderColor: e.target.value }))}
                    className="h-6 w-6 cursor-pointer rounded border-0"
                  />
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Center: Canvas Viewport */}
        <main
          className="flex min-h-[70vh] items-center justify-center p-6 sm:p-10"
          onClick={() => setSelectedId(null)}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Canvas Box */}
          <div
            ref={canvasRef}
            style={{
              backgroundColor: design.backgroundType === "color" ? design.backgroundColor : undefined,
              backgroundImage:
                design.backgroundType === "gradient"
                  ? design.backgroundGradient
                  : design.backgroundType === "image" && design.backgroundImageUrl
                  ? `url(${design.backgroundImageUrl})`
                  : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            className={`relative w-full max-w-[420px] ${canvasAspect} select-none overflow-hidden rounded-xl shadow-2xl transition-all duration-150`}
          >
            {/* Outer Border Frame */}
            {design.hasBorder && (
              <div
                style={{
                  borderColor: design.borderColor || "#b15636",
                  borderWidth: `${design.borderWidth || 2}px`,
                  inset: `${design.borderMargin || 24}px`,
                }}
                className="pointer-events-none absolute border"
              />
            )}

            {/* Elements */}
            {design.elements.map((el) => {
              const isSelected = el.id === selectedId;
              const familyClass =
                el.fontFamily === "serif"
                  ? "font-serif"
                  : el.fontFamily === "mono"
                  ? "font-mono"
                  : "font-sans";

              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => handleMouseDown(e, el.id)}
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}%`,
                    zIndex: el.zIndex,
                  }}
                  className={`absolute cursor-move transition-shadow ${
                    isSelected ? "ring-2 ring-[#b15636] ring-offset-2" : "hover:outline hover:outline-1 hover:outline-[#b15636]/50"
                  }`}
                >
                  {el.type === "text" && (
                    <p
                      style={{
                        fontSize: `${el.fontSize}px`,
                        color: el.color,
                        fontWeight: el.fontWeight,
                        fontStyle: el.fontStyle,
                        textTransform: el.textTransform,
                        textAlign: el.textAlign,
                        letterSpacing: `${el.letterSpacing}px`,
                        backgroundColor: el.backgroundColor,
                        borderRadius: `${el.borderRadius || 0}px`,
                        padding: el.backgroundColor ? "4px 12px" : "0",
                      }}
                      className={`${familyClass} leading-tight break-words`}
                    >
                      {el.content || "Empty Text"}
                    </p>
                  )}

                  {el.type === "image" && el.content && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={el.content}
                      alt="Cover element"
                      className="pointer-events-none w-full rounded object-contain"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </main>

        {/* Right Sidebar: Inspector */}
        <aside className="border-t border-[#1d241d]/15 bg-[#f6f1e8] p-6 lg:border-t-0 lg:border-l">
          <p className="text-xs font-bold tracking-[0.16em] text-[#66705f] uppercase">Element Properties</p>

          {selectedElement ? (
            <div className="mt-4 space-y-4 text-xs">
              {/* Text content */}
              {selectedElement.type === "text" && (
                <div>
                  <label className="font-semibold text-[#1d241d]">Text Content</label>
                  <textarea
                    value={selectedElement.content || ""}
                    onChange={(e) => updateSelected({ content: e.target.value })}
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-[#1d241d]/20 bg-[#fdfaf3] p-2 text-xs outline-none focus:border-[#b15636]"
                  />
                </div>
              )}

              {/* Font Family */}
              {selectedElement.type === "text" && (
                <div>
                  <label className="font-semibold text-[#1d241d]">Typography Font</label>
                  <select
                    value={selectedElement.fontFamily || "serif"}
                    onChange={(e) => updateSelected({ fontFamily: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-[#1d241d]/20 bg-[#fdfaf3] p-2 text-xs outline-none focus:border-[#b15636]"
                  >
                    <option value="serif">Serif (Georgia / Classic)</option>
                    <option value="sans">Sans-serif (Modern Clean)</option>
                    <option value="mono">Monospace (Technical / Minimal)</option>
                  </select>
                </div>
              )}

              {/* Size & Weight */}
              {selectedElement.type === "text" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-[#1d241d]">Font Size ({selectedElement.fontSize}px)</label>
                    <input
                      type="range"
                      min={10}
                      max={64}
                      value={selectedElement.fontSize || 20}
                      onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                      className="mt-2 w-full accent-[#b15636]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#1d241d]">Width ({Math.round(selectedElement.width)}%)</label>
                    <input
                      type="range"
                      min={20}
                      max={100}
                      value={selectedElement.width}
                      onChange={(e) => updateSelected({ width: Number(e.target.value) })}
                      className="mt-2 w-full accent-[#b15636]"
                    />
                  </div>
                </div>
              )}

              {/* Styling toggles */}
              {selectedElement.type === "text" && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      updateSelected({ fontWeight: selectedElement.fontWeight === "bold" ? "normal" : "bold" })
                    }
                    className={`rounded-lg px-2.5 py-1.5 font-bold ${
                      selectedElement.fontWeight === "bold" ? "bg-[#1d241d] text-white" : "bg-[#fdfaf3]"
                    }`}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateSelected({ fontStyle: selectedElement.fontStyle === "italic" ? "normal" : "italic" })
                    }
                    className={`rounded-lg px-2.5 py-1.5 italic ${
                      selectedElement.fontStyle === "italic" ? "bg-[#1d241d] text-white" : "bg-[#fdfaf3]"
                    }`}
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateSelected({
                        textTransform: selectedElement.textTransform === "uppercase" ? "none" : "uppercase",
                      })
                    }
                    className={`rounded-lg px-2.5 py-1.5 uppercase ${
                      selectedElement.textTransform === "uppercase" ? "bg-[#1d241d] text-white" : "bg-[#fdfaf3]"
                    }`}
                  >
                    AA
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelected({ textAlign: "left" })}
                    className={`rounded-lg px-2.5 py-1.5 ${
                      selectedElement.textAlign === "left" ? "bg-[#1d241d] text-white" : "bg-[#fdfaf3]"
                    }`}
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelected({ textAlign: "center" })}
                    className={`rounded-lg px-2.5 py-1.5 ${
                      selectedElement.textAlign === "center" ? "bg-[#1d241d] text-white" : "bg-[#fdfaf3]"
                    }`}
                  >
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelected({ textAlign: "right" })}
                    className={`rounded-lg px-2.5 py-1.5 ${
                      selectedElement.textAlign === "right" ? "bg-[#1d241d] text-white" : "bg-[#fdfaf3]"
                    }`}
                  >
                    Right
                  </button>
                </div>
              )}

              {/* Text Color */}
              {selectedElement.type === "text" && (
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-[#1d241d]">Text Color</span>
                  <input
                    type="color"
                    value={selectedElement.color || "#1d241d"}
                    onChange={(e) => updateSelected({ color: e.target.value })}
                    className="h-7 w-7 cursor-pointer rounded border-0"
                  />
                </div>
              )}

              {/* Layer Controls & Delete */}
              <div className="mt-6 border-t border-[#1d241d]/15 pt-4">
                <button
                  type="button"
                  onClick={() => deleteElement(selectedElement.id)}
                  className="w-full rounded-xl border border-red-200 bg-red-50 py-2 font-bold text-red-700 transition hover:bg-red-100"
                >
                  Delete Element
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-10 text-center text-[#66705f]">
              <p className="font-serif text-lg">No element selected</p>
              <p className="mt-1">Click on any text or image on the canvas to edit its properties, or add new elements from the left panel.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
