import type { SlideDefinition } from '@/presentation/types'
import ApiDiagram from '@/presentation/diagrams/ApiDiagram'
import DemoFlowDiagram from '@/presentation/diagrams/DemoFlowDiagram'
import ErdDiagram from '@/presentation/diagrams/ErdDiagram'
import GitWorkflowDiagram from '@/presentation/diagrams/GitWorkflowDiagram'
import LayeredArchitecture from '@/presentation/diagrams/LayeredArchitecture'

export const presentationSlides: SlideDefinition[] = [
  {
    id: 'title',
    title: 'Kenya National Chess League',
    subtitle: 'Transfer Portal',
    layout: 'title',
    speakerNotes:
      'Introduce the team and project scope. State that this is a full-stack registration and transfer management system built for Chess Kenya federation operations. Mention deployment: Vercel frontend, Render API, Supabase database.',
    meta: [
      { label: 'Team', value: 'KNCL Development Team' },
      { label: 'Institution', value: 'Moringa School' },
      { label: 'Course', value: 'Software Engineering Project' },
    ],
  },
  {
    id: 'agenda',
    title: 'Agenda',
    layout: 'agenda',
    speakerNotes:
      'Walk through the structure. Signal that the demo comes near the end. Keep this under 30 seconds.',
    bullets: [
      { text: 'Project overview' },
      { text: 'Problem and solution' },
      { text: 'System architecture' },
      { text: 'Technology stack' },
      { text: 'Security and API design' },
      { text: 'Live demonstration' },
      { text: 'Challenges and lessons learned' },
      { text: 'Questions' },
    ],
  },
  {
    id: 'problem',
    title: 'Problem Statement',
    subtitle: 'Why a digital portal was needed',
    layout: 'bullets',
    speakerNotes:
      'Emphasize pain points observed in manual league operations. Paper forms get lost. Transfer approvals lack audit trails. Coordinators cannot see a single source of truth for player status.',
    bullets: [
      { text: 'Paper-based player registration' },
      { text: 'Manual approval chains via email and spreadsheets' },
      { text: 'Slow inter-club transfer processing' },
      { text: 'No centralized player registry' },
      { text: 'Limited visibility into application status' },
      { text: 'Difficulty verifying online chess accounts' },
    ],
  },
  {
    id: 'solution',
    title: 'Solution',
    subtitle: 'What we built',
    layout: 'bullets',
    speakerNotes:
      'Connect each bullet to a feature in the app. Role-based portals for players, captains, coordinators, and federation admins.',
    bullets: [
      { text: 'Web platform accessible from any browser' },
      { text: 'Digital club and player registration with email verification' },
      { text: 'Structured transfer workflow with approvals' },
      { text: 'In-app notifications and audit logging' },
      { text: 'Role-based access across four user types' },
      { text: 'Automated provisioning after coordinator approval' },
    ],
  },
  {
    id: 'tech-stack',
    title: 'Technology Stack',
    subtitle: 'Selected for maintainability and team familiarity',
    layout: 'grid',
    speakerNotes:
      'Justify choices briefly. React for component reuse. FastAPI for typed Python APIs. SQLAlchemy for ORM productivity. Supabase for managed Postgres and auth. Tailwind + shadcn for consistent UI without custom CSS overhead.',
    grid: [
      { label: 'React + Vite', detail: 'Component-based SPA with fast dev builds' },
      { label: 'FastAPI', detail: 'Async Python API with automatic OpenAPI docs' },
      { label: 'SQLAlchemy', detail: 'ORM for models, queries, and relationships' },
      { label: 'Alembic', detail: 'Version-controlled schema migrations' },
      { label: 'Supabase', detail: 'PostgreSQL, Auth JWTs, object storage' },
      { label: 'Tailwind + shadcn/ui', detail: 'Design system with accessible primitives' },
      { label: 'TanStack Query', detail: 'Server state caching and refetching' },
      { label: 'Lucide', detail: 'Consistent iconography across the portal' },
    ],
  },
  {
    id: 'architecture',
    title: 'System Architecture',
    subtitle: 'Three-tier design with clear separation of concerns',
    layout: 'diagram',
    diagram: <LayeredArchitecture />,
    speakerNotes:
      'Explain request flow: browser calls REST endpoints, FastAPI validates JWT and role, service layer applies business rules, repository persists via SQLAlchemy. Supabase Auth is external; we store application roles in user_profiles.',
  },
  {
    id: 'database',
    title: 'Database Design',
    subtitle: 'Relational model in Supabase PostgreSQL',
    layout: 'diagram',
    diagram: <ErdDiagram />,
    speakerNotes:
      'Highlight key relationships: clubs belong to leagues, players link to user_profiles, club_members is the roster junction table, transfers reference players and clubs. Application tables separate onboarding from active records.',
    bullets: [
      { text: 'Normalized schema with foreign keys and enums' },
      { text: 'Alembic migrations track every schema change' },
      { text: 'Seed data supports local development and demos' },
    ],
  },
  {
    id: 'rest-api',
    title: 'REST API Design',
    subtitle: 'Resource-oriented endpoints under /api/v1',
    layout: 'diagram',
    diagram: <ApiDiagram />,
    speakerNotes:
      'Mention OpenAPI at /docs in development. Pydantic schemas validate request and response shapes. HTTP verbs map to CRUD operations. Status codes communicate outcome without parsing body text.',
    bullets: [
      { text: 'Routers grouped by domain: players, transfers, clubs, auth' },
      { text: 'Pydantic schemas enforce input validation' },
      { text: 'Consistent error responses via exception handlers' },
    ],
  },
  {
    id: 'authentication',
    title: 'Authentication & Authorization',
    layout: 'two-column',
    speakerNotes:
      'Clarify: Supabase issues JWTs. FastAPI dependency get_current_user validates the token. authorization_service checks role and league scope. Frontend ProtectedRoute mirrors backend rules for UX, but backend is the authority.',
    columns: [
      {
        heading: 'Authentication',
        items: [
          'Supabase Auth for sign-in',
          'JWT bearer tokens on API calls',
          'Password reset via email OTP',
          'Session refresh on the client',
        ],
      },
      {
        heading: 'Authorization',
        items: [
          'Four roles: Player, Captain, Coordinator, Federation',
          'Protected routes on frontend and backend',
          'League-scoped data for coordinators',
          'Audit log for sensitive actions',
        ],
      },
    ],
  },
  {
    id: 'frontend-arch',
    title: 'Frontend Architecture',
    layout: 'two-column',
    speakerNotes:
      'Point to routes/index.tsx for routing map. Context providers wrap the app in main.tsx. API layer in src/api uses axios with shared base URL helper. Pages are thin; logic lives in hooks and contexts.',
    columns: [
      {
        heading: 'Structure',
        items: [
          'React Router v7 with nested layouts',
          'Marketing, auth, and portal layouts',
          'Role-specific page directories',
          'Reusable shadcn/ui components',
        ],
      },
      {
        heading: 'State',
        items: [
          'AuthContext for session and role',
          'TanStack Query for API data',
          'Domain contexts: transfers, seasons, onboarding',
          'Zod + react-hook-form for forms',
        ],
      },
    ],
  },
  {
    id: 'backend-arch',
    title: 'Backend Architecture',
    layout: 'two-column',
    speakerNotes:
      'Follow a request through: endpoint -> dependency injection -> service -> repository -> model. This pattern keeps endpoints thin and makes unit testing services straightforward.',
    columns: [
      {
        heading: 'Layers',
        items: [
          'api/v1/endpoints — HTTP handlers',
          'schemas — Pydantic request/response models',
          'services — business logic',
          'repositories — database queries',
          'models — SQLAlchemy table definitions',
        ],
      },
      {
        heading: 'Patterns',
        items: [
          'Dependency injection via FastAPI Depends',
          'Centralized config in core/config.py',
          'Custom exceptions mapped to HTTP status',
          'Seed script for reproducible dev data',
        ],
      },
    ],
  },
  {
    id: 'sqlalchemy',
    title: 'SQLAlchemy ORM',
    layout: 'bullets',
    speakerNotes:
      'ORM maps Python classes to tables. Relationships use foreign keys and back_populates. Migrations handle schema drift. Repositories encapsulate queries so services stay database-agnostic.',
    bullets: [
      { text: 'Declarative models with typed columns and enums' },
      { text: 'Relationships: one-to-many, many-to-many via junction tables' },
      { text: 'Session-per-request pattern with dependency injection' },
      { text: 'Validation at schema layer; constraints at database layer' },
      { text: 'Faster development than raw SQL for complex joins' },
    ],
  },
  {
    id: 'alembic',
    title: 'Alembic Migrations',
    layout: 'bullets',
    speakerNotes:
      'Every schema change gets a migration file in backend/migrations/versions. Teams apply upgrades with alembic upgrade head. Rollback is possible but should be tested. Never edit production schema manually.',
    bullets: [
      { text: 'Version-controlled database schema alongside code' },
      { text: 'autogenerate detects model changes for review' },
      { text: 'upgrade head applies pending migrations' },
      { text: 'downgrade for controlled rollback in staging' },
      { text: 'Keeps dev, staging, and production in sync' },
    ],
  },
  {
    id: 'supabase',
    title: 'Supabase Integration',
    layout: 'bullets',
    speakerNotes:
      'We use Supabase as infrastructure, not as a replacement for our API. Auth users live in auth.users; application data lives in public schema tables managed by SQLAlchemy.',
    bullets: [
      { text: 'Managed PostgreSQL with connection pooling' },
      { text: 'Auth service issues and validates JWTs' },
      { text: 'Storage buckets for headshots and club documents' },
      { text: 'Environment variables for keys and URLs' },
      { text: 'Realtime subscriptions reserved for future notifications' },
    ],
  },
  {
    id: 'pagination',
    title: 'Pagination',
    layout: 'bullets',
    speakerNotes:
      'Player and admin list endpoints accept skip/limit or page parameters. Returning all rows would degrade performance as the registry grows. Frontend DataTable handles client-side filtering on fetched pages.',
    bullets: [
      { text: 'Server-side limit and offset on list endpoints' },
      { text: 'Prevents loading entire tables into memory' },
      { text: 'Faster response times for large datasets' },
      { text: 'Total count returned for UI page controls' },
      { text: 'Implemented in player and audit log repositories' },
    ],
  },
  {
    id: 'filtering',
    title: 'Filtering & Search',
    layout: 'bullets',
    speakerNotes:
      'Query parameters map to SQLAlchemy filters. Player listings support search by name, county, federation ID. Coordinators see league-scoped results via authorization checks, not just UI hiding.',
    bullets: [
      { text: 'Query params: search, status, league_id, season_id' },
      { text: 'Indexed columns where lookup is frequent' },
      { text: 'Frontend search debounced before API call' },
      { text: 'Sorting via order_by in repository layer' },
      { text: 'Combines with pagination for scalable lists' },
    ],
  },
  {
    id: 'idempotency',
    title: 'Idempotency',
    subtitle: 'Safe retries without duplicate side effects',
    layout: 'bullets',
    speakerNotes:
      'Common interview question. GET can be called repeatedly with same result. PUT replaces a resource — same payload, same outcome. DELETE on missing resource may return 404 but state is unchanged. POST creates new resources each time — not idempotent. PATCH may or may not be depending on implementation.',
    bullets: [
      { text: 'GET — read-only, safe to repeat' },
      { text: 'PUT — replace resource, same result on retry' },
      { text: 'DELETE — removing twice yields same final state' },
      { text: 'POST — each call may create a new record' },
      { text: 'PATCH — partial update; design matters for retries' },
      { text: 'Transfer status updates use explicit state machine' },
    ],
  },
  {
    id: 'rate-limiting',
    title: 'Rate Limiting',
    layout: 'bullets',
    speakerNotes:
      'Implemented in-memory for OTP and external API lookups. Production would use Redis. Protects against brute-force OTP attempts and Chess.com/Lichess API abuse.',
    bullets: [
      { text: 'OTP endpoints limited per email and per IP' },
      { text: 'External rating lookups throttled' },
      { text: 'Returns HTTP 429 when limit exceeded' },
      { text: 'Configurable windows in settings' },
      { text: 'Future: Redis-backed limiter for multi-instance API' },
    ],
  },
  {
    id: 'security',
    title: 'Security Measures',
    layout: 'bullets',
    speakerNotes:
      'Defense in depth. Never trust client-side role checks alone. Environment variables for secrets. Pydantic prevents unexpected input shapes. CORS restricted to known frontend origins.',
    bullets: [
      { text: 'Passwords hashed by Supabase Auth (bcrypt)' },
      { text: 'JWT validation on every protected endpoint' },
      { text: 'Pydantic input validation on all requests' },
      { text: 'Secrets in environment variables, not in code' },
      { text: 'SQLAlchemy parameterized queries prevent injection' },
      { text: 'CORS allowlist for production frontend URL' },
      { text: 'HTTPS enforced in production deployments' },
    ],
  },
  {
    id: 'git-workflow',
    title: 'Git Workflow',
    subtitle: 'Collaborative development with review',
    layout: 'diagram',
    diagram: <GitWorkflowDiagram />,
    speakerNotes:
      'Describe your actual process: feature branches, PR reviews, merge to main triggers deploy. Mention README documents setup steps for new contributors.',
  },
  {
    id: 'rubric',
    title: 'Rubric Coverage',
    subtitle: 'Mapping project deliverables to grading criteria',
    layout: 'table',
    speakerNotes:
      'Walk examiners through each row. Offer to show code or live demo for any criterion they want to verify.',
    table: [
      { criterion: 'Authentication', evidence: 'Supabase JWT, login, password reset, role-based routes' },
      { criterion: 'CRUD operations', evidence: 'Players, clubs, transfers, registrations, documents' },
      { criterion: 'Pagination', evidence: 'List endpoints with skip/limit; admin data tables' },
      { criterion: 'Protected routes', evidence: 'ProtectedRoute + FastAPI Depends auth' },
      { criterion: 'README', evidence: 'Root readme with setup, architecture, env vars' },
      { criterion: 'Seed file', evidence: 'backend/app/seed with demo leagues and users' },
      { criterion: 'Git workflow', evidence: 'GitHub repo with feature branches and PRs' },
      { criterion: 'Maintainability', evidence: 'Layered backend, typed frontend, shared design system' },
    ],
  },
  {
    id: 'challenges',
    title: 'Challenges',
    layout: 'bullets',
    speakerNotes:
      'Be honest about real issues: CORS with trailing slashes on API URL, coordinator league scoping hiding player apps, merge conflicts after parallel work. Explain the fix, not just the symptom.',
    bullets: [
      { text: 'CORS failures from double-slash API URLs in production' },
      { text: 'Aligning Supabase auth users with application profiles' },
      { text: 'League-scoped coordinator filters hiding valid records' },
      { text: 'Headshot moderation required a dedicated pending endpoint' },
      { text: 'Merge conflicts across frontend types and UI components' },
    ],
  },
  {
    id: 'future',
    title: 'Future Work',
    layout: 'bullets',
    speakerNotes:
      'Show awareness of gaps. Chess.com and Lichess integrations exist partially. Email notifications need production SMTP. PDF export for transfer certificates is a common federation request.',
    bullets: [
      { text: 'Full Chess.com and Lichess account verification' },
      { text: 'Email notifications for approvals and transfers' },
      { text: 'Analytics dashboard for federation reporting' },
      { text: 'PDF generation for registration certificates' },
      { text: 'Multi-step transfer approval chains' },
      { text: 'Supabase Realtime for live notification feed' },
    ],
  },
  {
    id: 'demo',
    title: 'Live Demonstration',
    subtitle: 'Application flows by role',
    layout: 'diagram',
    diagram: <DemoFlowDiagram />,
    speakerNotes:
      'Switch to the deployed app or local dev. Recommended order: public registration -> coordinator approval -> captain roster -> player engagement -> transfer submission. Keep demo under 3 minutes.',
  },
  {
    id: 'lessons',
    title: 'Lessons Learned',
    layout: 'bullets',
    speakerNotes:
      'Reflect genuinely. Early API contract agreement would have reduced frontend/backend rework. Database modelling upfront saved migration pain later.',
    bullets: [
      { text: 'Define API contracts before parallel frontend work' },
      { text: 'Invest in database design early — migrations are costly later' },
      { text: 'Role-based access must be enforced server-side' },
      { text: 'Feature branches and small PRs reduce merge pain' },
      { text: 'Seed data accelerates testing across all roles' },
      { text: 'Regular team syncs prevent duplicated effort' },
    ],
  },
  {
    id: 'questions',
    title: 'Thank You',
    subtitle: 'Questions?',
    layout: 'closing',
    speakerNotes:
      'Pause. Invite questions on architecture, security, or demo. Have the GitHub repo and deployed URLs ready.',
  },
]
