const steps = [
  { label: 'main', desc: 'Protected production branch' },
  { label: 'feature/*', desc: 'Isolated feature work' },
  { label: 'Pull Request', desc: 'Peer review before merge' },
  { label: 'CI checks', desc: 'Lint, typecheck, tests' },
  { label: 'Merge', desc: 'Squash or merge commit' },
]

export default function GitWorkflowDiagram() {
  return (
    <div className="flex w-full max-w-4xl flex-col gap-4">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#111b2e] text-xl font-bold text-white xl:size-14 xl:text-2xl">
            {i + 1}
          </div>
          <div className="flex-1 rounded-xl border-2 border-[#111b2e] bg-white px-6 py-4 text-center">
            <p className="text-2xl font-bold text-[#111b2e] xl:text-3xl 2xl:text-4xl">{step.label}</p>
            <p className="mt-1 text-xl font-semibold text-muted-foreground xl:text-2xl">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
