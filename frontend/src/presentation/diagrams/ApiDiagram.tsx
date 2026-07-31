const endpoints = [
  { method: 'GET', path: '/players', desc: 'List with pagination & filters' },
  { method: 'POST', path: '/transfers', desc: 'Create transfer request' },
  { method: 'PATCH', path: '/transfers/{id}', desc: 'Update transfer status' },
  { method: 'DELETE', path: '/documents/{id}', desc: 'Remove uploaded file' },
  { method: 'POST', path: '/auth/token', desc: 'Exchange credentials for JWT' },
]

const methodColor: Record<string, string> = {
  GET: 'bg-[#006b3f] text-white',
  POST: 'bg-[#111b2e] text-white',
  PATCH: 'bg-amber-600 text-white',
  DELETE: 'bg-[#bb1e2d] text-white',
}

export default function ApiDiagram() {
  return (
    <div className="w-full max-w-5xl space-y-5">
      <div className="space-y-3">
        {endpoints.map((ep) => (
          <div
            key={ep.path + ep.method}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-[#111b2e]/10 bg-white px-6 py-4 text-center sm:flex-row sm:gap-4"
          >
            <span className={`w-24 shrink-0 rounded-lg px-3 py-2 text-center text-lg font-bold xl:text-xl ${methodColor[ep.method]}`}>
              {ep.method}
            </span>
            <code className="flex-1 text-2xl font-bold text-[#111b2e] xl:text-3xl">/api/v1{ep.path}</code>
            <span className="text-xl font-semibold text-muted-foreground xl:text-2xl">{ep.desc}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {['200 OK', '201 Created', '400 Bad Request', '401 Unauthorized', '403 Forbidden', '404 Not Found', '422 Validation', '429 Rate Limited'].map(
          (code) => (
            <div key={code} className="rounded-lg border-2 border-[#111b2e]/10 bg-muted/30 px-4 py-3 text-center text-lg font-bold xl:text-xl 2xl:text-2xl">
              {code}
            </div>
          ),
        )}
      </div>
    </div>
  )
}
