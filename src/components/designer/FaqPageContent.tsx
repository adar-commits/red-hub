import type { FaqDocumentPayload } from "@/lib/faq-shared";

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function FaqPageContent({ data }: { data: FaqDocumentPayload }) {
  const videoId = data.settings.youtube_video_id.trim();
  const iframeTitle =
    data.settings.video_iframe_title.trim() || "סרטון הדרכה — פורטל אדריכלים ומעצבים";
  const embedUrl =
    videoId.length > 0 ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` : null;

  return (
    <div className="mx-auto max-w-3xl space-y-8" dir="rtl">
      <header className="space-y-2 text-center">
        <h1 className="text-xl font-bold text-[var(--brand-red)] sm:text-2xl md:text-3xl">{data.settings.page_title}</h1>
        <p className="text-sm text-gray-600">{data.settings.page_subtitle}</p>
      </header>

      {embedUrl ? (
        <section aria-labelledby="faq-video-heading" className="space-y-3">
          <h2 id="faq-video-heading" className="sr-only">
            סרטון הדרכה
          </h2>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-black shadow-[var(--shadow-card)]">
            <div className="relative aspect-video w-full">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={embedUrl}
                title={iframeTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </section>
      ) : null}

      <div className="space-y-8">
        {data.sections.map((section, si) => (
          <section key={`faq-sec-${si}`} className="space-y-3">
            <h2 className="border-b border-gray-200 pb-2 text-lg font-bold text-gray-900">
              {section.heading}
            </h2>
            <div className="space-y-2">
              {section.items.map((item, idx) => (
                <details
                  key={`${si}-${idx}`}
                  open={idx === 0}
                  className="group rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-start text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0 flex-1 leading-snug">{item.title}</span>
                    <ChevronIcon className="h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-3 text-sm leading-relaxed text-gray-800">
                    {item.body}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
