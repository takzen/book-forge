import type { CSSProperties } from "react";

export type CoverElement = {
  id: string;
  type: "text" | "image";
  content?: string;
  /** Percentages of the cover box. */
  x: number;
  y: number;
  width: number;
  /** Type size in px, relative to `COVER_REFERENCE_WIDTH`. */
  fontSize?: number;
  fontFamily?: "serif" | "sans" | "mono";
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textTransform?: "none" | "uppercase" | "lowercase";
  textAlign?: "left" | "center" | "right";
  color?: string;
  backgroundColor?: string;
  /** px, relative to `COVER_REFERENCE_WIDTH`. */
  letterSpacing?: number;
  opacity?: number;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  zIndex: number;
};

export type CoverDesignState = {
  backgroundType: "color" | "gradient" | "image";
  backgroundColor: string;
  backgroundGradient: string;
  backgroundImageUrl: string;
  hasBorder: boolean;
  borderColor: string;
  /** px, relative to `COVER_REFERENCE_WIDTH`. */
  borderMargin: number;
  borderWidth: number;
  elements: CoverElement[];
};

/**
 * Every px value in a design is authored against a cover this wide. Rendering
 * at any other width scales by `width / COVER_REFERENCE_WIDTH`, which is what
 * keeps the editor canvas and the exported PNG identical — the export used to
 * hard-code a 3.8× factor that only matched when the editor happened to be at
 * its full 420px.
 */
export const COVER_REFERENCE_WIDTH = 420;

export const COVER_ASPECT: Record<string, { widthMm: number; heightMm: number }> = {
  a5: { widthMm: 148, heightMm: 210 },
  "six-by-nine": { widthMm: 152.4, heightMm: 228.6 },
  a4: { widthMm: 210, heightMm: 297 },
};

export function getCoverAspect(format: string) {
  return COVER_ASPECT[format] ?? COVER_ASPECT.a5;
}

/** Pixel height of a cover rendered at `width` for the given book format. */
export function getCoverHeight(format: string, width: number) {
  const { widthMm, heightMm } = getCoverAspect(format);
  return Math.round((width * heightMm) / widthMm);
}

const FONT_CLASSES: Record<string, string> = {
  serif: "font-serif",
  sans: "font-sans",
  mono: "font-mono",
};

export function coverBackgroundStyle(design: CoverDesignState): CSSProperties {
  if (design.backgroundType === "gradient" && design.backgroundGradient) {
    return { backgroundImage: design.backgroundGradient };
  }
  if (design.backgroundType === "image" && design.backgroundImageUrl) {
    return {
      backgroundImage: `url(${design.backgroundImageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: design.backgroundColor,
    };
  }
  return { backgroundColor: design.backgroundColor };
}

type CoverArtworkProps = {
  design: CoverDesignState;
  /** Scale factor applied to every px-authored value. 1 = reference width. */
  scale?: number;
  /** Rendered around the selected element inside the editor. */
  renderElementOverlay?: (element: CoverElement) => React.ReactNode;
  onElementMouseDown?: (event: React.MouseEvent, elementId: string) => void;
};

/**
 * The cover artwork itself — shared verbatim by the design canvas and by the
 * off-screen page the PNG export screenshots. Because both render this exact
 * component, the export cannot drift from the preview.
 */
export function CoverArtwork({
  design,
  scale = 1,
  renderElementOverlay,
  onElementMouseDown,
}: CoverArtworkProps) {
  return (
    <>
      {design.hasBorder && (
        <div
          style={{
            borderColor: design.borderColor || "#b15636",
            borderWidth: `${(design.borderWidth || 2) * scale}px`,
            borderStyle: "solid",
            inset: `${(design.borderMargin || 24) * scale}px`,
          }}
          className="pointer-events-none absolute"
        />
      )}

      {design.elements.map((element) => {
        const familyClass = FONT_CLASSES[element.fontFamily ?? "sans"] ?? "font-sans";

        return (
          <div
            key={element.id}
            onMouseDown={
              onElementMouseDown
                ? (event) => onElementMouseDown(event, element.id)
                : undefined
            }
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${element.width}%`,
              zIndex: element.zIndex,
              opacity: element.opacity ?? 1,
            }}
            className={`absolute ${onElementMouseDown ? "group cursor-move" : ""}`}
          >
            {renderElementOverlay?.(element)}

            {element.type === "text" && (
              <p
                style={{
                  fontSize: `${(element.fontSize ?? 20) * scale}px`,
                  color: element.color,
                  fontWeight: element.fontWeight,
                  fontStyle: element.fontStyle,
                  textTransform: element.textTransform,
                  textAlign: element.textAlign,
                  letterSpacing: `${(element.letterSpacing ?? 0) * scale}px`,
                  backgroundColor: element.backgroundColor,
                  borderRadius: `${(element.borderRadius ?? 0) * scale}px`,
                  borderWidth: element.borderWidth
                    ? `${element.borderWidth * scale}px`
                    : undefined,
                  borderColor: element.borderColor,
                  borderStyle: element.borderWidth ? "solid" : undefined,
                  padding: element.backgroundColor
                    ? `${4 * scale}px ${12 * scale}px`
                    : 0,
                  margin: 0,
                }}
                className={`${familyClass} leading-tight break-words select-none`}
              >
                {element.content || "Empty Text"}
              </p>
            )}

            {element.type === "image" && element.content && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={element.content}
                alt=""
                style={{
                  borderRadius: `${(element.borderRadius ?? 0) * scale}px`,
                  borderWidth: element.borderWidth
                    ? `${element.borderWidth * scale}px`
                    : undefined,
                  borderColor: element.borderColor,
                  borderStyle: element.borderWidth ? "solid" : undefined,
                }}
                className="pointer-events-none w-full object-contain select-none"
              />
            )}
          </div>
        );
      })}
    </>
  );
}
