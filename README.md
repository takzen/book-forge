# Book Forge

Book Forge is a private, local workspace for creating ebooks and books from the first outline to a final PDF.

It is built for one writer working on their own computer: no accounts, no cloud storage, and no publishing platform required.

## Planned workflow

1. Create a book project and arrange its chapters.
2. Write each chapter in Markdown with a live preview.
3. Add images and captions directly into the manuscript.
4. Create a cover using text, photographs, and graphic elements.
5. Review the complete book in a print-aware preview.
6. Export an optimised PDF for reading on screen or high-quality printing.

## Key principles

- **Local first** — manuscripts, images, covers, and exports stay on the computer.
- **Markdown at the core** — portable source files without locking the book into a proprietary editor.
- **One reliable layout** — the preview and exported PDF are rendered from the same book template.
- **Made for the whole book** — writing, chapter structure, cover design, and PDF export live in one focused tool.

## Planned stack

- Next.js, TypeScript, and pnpm
- Tailwind CSS
- SQLite with Drizzle ORM for local project data
- Markdown rendered with remark/rehype
- Konva.js for the cover designer
- Playwright for screen-ready and print-ready PDF exports

## Development

Install dependencies and start the local development server:

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Status

The initial application shell is in place. The active implementation plan, including task checkboxes, is available in [PLAN.md](./PLAN.md).
