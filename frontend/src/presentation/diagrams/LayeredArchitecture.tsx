export default function LayeredArchitecture() {
  const layers = [
    { label: 'React SPA', detail: 'Pages, layouts, contexts, TanStack Query' },
    { label: 'REST API', detail: 'FastAPI routers, Pydantic schemas, dependency injection' },
    { label: 'Service layer', detail: 'Business rules, authorization, orchestration' },
    { label: 'SQLAlchemy ORM', detail: 'Models, repositories, transactions' },
    { label: 'Supabase PostgreSQL', detail: 'Persistent relational data' },
  ]

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-2">
      {layers.map((layer, index) => (
        <div key={layer.label} className="flex w-full flex-col items-center">
          <div className="w-full rounded-xl border-2 border-[#111b2e] bg-white px-8 py-5 text-center shadow-sm">
            <p className="text-3xl font-bold text-[#111b2e] xl:text-4xl">{layer.label}</p>
            <p className="mt-2 text-xl font-semibold text-muted-foreground xl:text-2xl 2xl:text-3xl">{layer.detail}</p>
          </div>
          {index < layers.length - 1 && (
            <div className="flex h-8 items-center text-[#006b3f]" aria-hidden>
              <span className="text-4xl font-bold leading-none">↓</span>
            </div>
          )}
        </div>
      ))}
      <div className="mt-4 w-full rounded-xl border-2 border-dashed border-[#bb1e2d]/40 bg-[#bb1e2d]/5 px-6 py-4 text-center">
        <p className="text-2xl font-bold text-[#111b2e] xl:text-3xl">Supabase Auth + Storage (sidecar)</p>
        <p className="mt-1 text-xl font-semibold text-muted-foreground xl:text-2xl">JWT validation, headshots, documents</p>
      </div>
    </div>
  )
}
