const flows = [
  { role: 'Public', steps: ['Register', 'Verify email', 'Track application status'] },
  { role: 'Coordinator', steps: ['Review applications', 'Approve clubs & players', 'Moderate headshots'] },
  { role: 'Captain', steps: ['Manage roster', 'Submit transfers', 'Express interest in players'] },
  { role: 'Player', steps: ['Update profile', 'Respond to engagements', 'Request transfers'] },
]

export default function DemoFlowDiagram() {
  return (
    <div className="grid w-full max-w-6xl gap-5 sm:grid-cols-2">
      {flows.map((flow) => (
        <div key={flow.role} className="rounded-xl border-2 border-[#111b2e] bg-white p-6 text-center xl:p-8">
          <p className="text-3xl font-bold text-[#006b3f] xl:text-4xl">{flow.role}</p>
          <ol className="mt-5 space-y-3">
            {flow.steps.map((step, i) => (
              <li
                key={step}
                className="flex items-center justify-center gap-3 text-2xl font-bold text-[#111b2e] xl:text-3xl 2xl:text-4xl"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#111b2e] text-lg font-bold text-white xl:size-10 xl:text-xl">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  )
}
