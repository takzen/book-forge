const features = [
  {
    number: "01",
    title: "Write in Markdown",
    description: "A calm, focused space for chapters, notes, and images.",
  },
  {
    number: "02",
    title: "Design your cover",
    description: "Compose text, photography, and graphics on a real canvas.",
  },
  {
    number: "03",
    title: "Export with confidence",
    description: "Create a polished PDF for screens or print from one layout.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f1e8] text-[#1d241d]">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 sm:px-10 lg:px-16">
        <nav className="flex items-center justify-between border-b border-[#1d241d]/15 pb-5 text-sm font-medium tracking-[0.08em] uppercase">
          <span>Book Forge</span>
          <span className="text-[#66705f]">Local writing studio</span>
        </nav>

        <div className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="max-w-2xl">
            <p className="mb-6 text-xs font-bold tracking-[0.2em] text-[#b15636] uppercase">
              Your book, from first line to final PDF
            </p>
            <h1 className="font-serif text-5xl leading-[0.95] tracking-[-0.055em] sm:text-7xl lg:text-8xl">
              Make room for the book you want to finish.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#52604e] sm:text-xl">
              Book Forge is a private, local workspace for writing Markdown chapters,
              placing illustrations, designing a cover, and exporting a beautiful PDF.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <button className="rounded-full bg-[#1d241d] px-6 py-3 text-sm font-bold text-[#f6f1e8] transition-transform hover:-translate-y-0.5">
                Create your first book
              </button>
              <button className="rounded-full border border-[#1d241d]/25 px-6 py-3 text-sm font-bold transition-colors hover:bg-[#e9e1d3]">
                Open a project
              </button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-7 -z-0 rounded-[3rem] bg-[#d9e2ca]" />
            <article className="relative z-10 aspect-[0.72] -rotate-3 rounded-sm bg-[#284c42] p-7 text-[#f8f1dd] shadow-2xl shadow-[#5f765b]/35 transition-transform duration-500 hover:rotate-0 sm:p-10">
              <div className="flex h-full flex-col justify-between border border-[#f8f1dd]/50 p-7 sm:p-9">
                <p className="text-[0.65rem] font-bold tracking-[0.28em] uppercase">A field guide to</p>
                <div>
                  <p className="font-serif text-5xl leading-[0.82] tracking-[-0.055em] sm:text-6xl">The<br />Quiet<br />Work</p>
                  <div className="mt-8 h-px w-16 bg-[#d99d67]" />
                </div>
                <p className="text-xs font-bold tracking-[0.18em] uppercase">Written in Book Forge</p>
              </div>
            </article>
            <div className="absolute -bottom-7 -left-10 z-20 max-w-[13rem] rounded-2xl bg-[#fdfaf3] p-4 shadow-xl shadow-[#465942]/15">
              <p className="text-xs font-bold tracking-[0.12em] text-[#b15636] uppercase">A better process</p>
              <p className="mt-1 text-sm leading-5 text-[#52604e]">Structure, write, design, and export without leaving your desk.</p>
            </div>
          </div>
        </div>

        <section className="grid border-t border-[#1d241d]/15 py-7 sm:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.number} className="border-[#1d241d]/15 py-5 sm:border-r sm:px-7 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0">
              <p className="text-xs font-bold tracking-[0.16em] text-[#b15636]">{feature.number}</p>
              <h2 className="mt-3 text-lg font-bold">{feature.title}</h2>
              <p className="mt-1 max-w-xs text-sm leading-6 text-[#52604e]">{feature.description}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
