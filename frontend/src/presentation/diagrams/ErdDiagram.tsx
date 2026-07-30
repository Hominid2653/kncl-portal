function EntityBox({ name, fields }: { name: string; fields: string[] }) {
  return (
    <div className="rounded-lg border-2 border-[#111b2e] bg-white shadow-sm">
      <div className="border-b-2 border-[#111b2e] bg-[#111b2e] px-4 py-2 text-center text-lg font-bold text-white xl:text-xl">
        {name}
      </div>
      <ul className="space-y-1 px-4 py-3 text-center text-base font-semibold text-[#111b2e] xl:text-lg 2xl:text-xl">
        {fields.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </div>
  )
}

export default function ErdDiagram() {
  return (
    <div className="grid w-full max-w-6xl grid-cols-3 gap-4">
      <EntityBox name="leagues" fields={['id', 'name', 'description']} />
      <EntityBox name="clubs" fields={['id', 'league_id FK', 'name', 'county']} />
      <EntityBox name="players" fields={['id', 'user_id', 'federation_id', 'county']} />
      <EntityBox name="club_members" fields={['club_id FK', 'player_id FK', 'season_id FK']} />
      <EntityBox name="transfers" fields={['id', 'player_id FK', 'from_club_id', 'to_club_id', 'status']} />
      <EntityBox name="registrations" fields={['id', 'player_id FK', 'season_id FK', 'status']} />
      <EntityBox name="documents" fields={['id', 'club_id FK', 'storage_path', 'type']} />
      <EntityBox name="user_profiles" fields={['id', 'auth_user_id', 'role', 'league_id']} />
      <EntityBox name="applications" fields={['player / club captain', 'status', 'submitted_at']} />
    </div>
  )
}
