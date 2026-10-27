# AI Mystery Room --- Product & Engineering Specification

**Document ID:** AMR-SPEC-001\
**Version:** 1.0.0\
**Status:** Build baseline\
**Purpose:** Single source of truth for Codex and all contributors\
**Last updated:** 2026-10-27

------------------------------------------------------------------------

## 0. Instructions for Codex

Treat this document as the authoritative product and technical
specification. Before implementing a feature, inspect this document and
the existing repository. Do not invent product behavior that conflicts
with it.

### Required working rules

1.  Implement in small, testable milestones; do not generate the entire
    application in one unreviewable change.
2.  Preserve existing conventions when they do not conflict with this
    specification.
3.  If a requirement is ambiguous, choose the simplest safe
    implementation and document the assumption in `docs/DECISIONS.md`.
    Do not silently change product scope.
4.  Never put Gemini API keys, JWT secrets, database credentials, or
    other secrets in frontend code or commit them to source control.
5.  All AI-generated case content is fictional and must be presented as
    fictional. Do not use real people's private data or imply generated
    evidence is authentic.
6.  AI output is untrusted input. Validate it against schemas on the
    server before saving or returning it.
7.  Build responsive, accessible interfaces and meaningful loading,
    empty, and error states---not just happy-path screens.
8.  Add tests for business rules, API contracts, authorization,
    validation, and AI output parsing.
9.  Keep the app runnable from documented setup instructions. Update
    `.env.example`, README, and tests when configuration or behavior
    changes.
10. Do not claim a feature is complete unless its acceptance criteria
    and relevant tests pass.

### Source-of-truth precedence

1.  This specification
2.  Accepted decisions recorded in `docs/DECISIONS.md`
3.  Tests that encode requirements in this specification
4.  Existing implementation
5.  Assumptions made by a contributor

If code conflicts with this specification, flag the conflict and resolve
it deliberately rather than blindly copying the existing behavior.

------------------------------------------------------------------------

## 1. Product Overview

### 1.1 Product name

**AI Mystery Room**

### 1.2 Product concept

AI Mystery Room is a web-based, single-player fictional investigation
game. A user submits a short scenario, premise, or story seed. The
backend uses Google Gemini to create a coherent fictional mystery case
containing a culprit, suspects, a timeline, clues, and evidence
artifacts. The player inspects the case evidence and selects the person
they believe committed the fictional crime or incident. The app then
evaluates the accusation and reveals the solution with an explanation
grounded in the case evidence.

Evidence may include: - Chat or WhatsApp-style message transcripts -
Still images or image descriptions - Fictional CCTV/camera footage
representations - Witness statements - Call logs or access logs -
Timelines, receipts, notes, and other case files

For the initial release, the game should be fun, understandable,
replayable, and technically reliable. AI-generated content must be
internally consistent and must not masquerade as real evidence.

### 1.3 Product goals

-   Turn a user's story seed into a playable mystery.
-   Make evidence inspection feel like a detective case file rather than
    a plain chat response.
-   Provide a fair challenge: the correct culprit must be inferable from
    evidence.
-   Support generated text and evidence metadata reliably; use generated
    media only where the configured providers and budget support it.
-   Allow users to submit an accusation and receive a satisfying
    solution reveal.
-   Keep generation, validation, persistence, and game evaluation on the
    backend.
-   Create a codebase that can be extended with accounts, difficulty
    settings, leaderboards, and additional evidence types later without
    requiring them for MVP.

### 1.4 Non-goals for MVP

-   Real criminal investigations or real-world accusation workflows.
-   Use of real private messages, real surveillance footage, or real
    people's personal data.
-   Live camera access, microphone recording, or device surveillance.
-   Multiplayer, chat rooms, leaderboards, payments, subscriptions, or
    social sharing.
-   A full video-generation pipeline unless a separate video provider is
    explicitly configured and approved.
-   Training or fine-tuning a model.
-   Letting the model decide authorization, user identity, or database
    permissions.
-   Allowing arbitrary model-generated HTML, JavaScript, or executable
    code in the client.

### 1.5 Target users

People who enjoy detective stories, escape-room puzzles, interactive
fiction, and casual reasoning games.

### 1.6 Core product principle

**The story is fictional, but the logic must be fair.** Every solution
must be supported by evidence shown to the player. Avoid a reveal that
depends on a fact the player never had a chance to discover.

------------------------------------------------------------------------

## 2. MVP Scope and User Journey

### 2.1 Primary user journey

1.  User opens the landing page.
2.  User enters a story seed in a text area, optionally selects a
    difficulty and theme, and starts a case.
3.  Frontend sends the request to the backend.
4.  Backend validates the request, creates a case-generation job, calls
    Gemini, validates the returned structured case, and stores the case.
5.  User is taken to the investigation room.
6.  User reviews the case briefing, suspects, timeline, and evidence
    artifacts.
7.  User can open evidence items in a detail viewer and cross-reference
    clues.
8.  User chooses one suspect as the culprit and submits an accusation.
9.  Backend evaluates the submitted suspect against the stored solution
    and records the result.
10. User sees a reveal screen with correct/incorrect status,
    explanation, decisive clues, and a play-again action.

### 2.2 MVP feature list

**Must have** - Landing page with product explanation and clear start
action. - Story-seed form with validation and character counter. -
Difficulty selection: Easy, Medium, Hard. - Case generation with
progress/loading state. - Server-side Gemini integration. - Strict
schema validation of generated cases. - Suspect cards with names,
profiles, motives, and alibis. - Evidence board/grid with type, title,
summary, and details. - Evidence viewer for text-based artifacts and
image placeholders/illustrations. - Suspect selection and accusation
submission. - Server-side verdict evaluation and solution reveal. -
Persistence of cases and completed attempts in MongoDB. - Responsive
design, keyboard navigation, and basic accessibility. - Error handling,
retry guidance, and rate limiting. - Setup documentation and
`.env.example`.

**Should have** - Filter evidence by type. - Case progress indicator
(e.g., evidence reviewed count), without forcing a particular solving
order. - Copy/shareable case ID, but not public case access by
default. - Regenerate case action if generation fails validation. -
Basic generation-cost and latency logging without logging secrets or
full sensitive inputs.

**Not in MVP unless explicitly approved** - Authentication and user
profiles. - Saved case library across devices. - Actual AI-generated
video or audio files. - Uploading user images or documents. - Public
sharing of cases. - Leaderboards or competitive scoring.

### 2.3 Difficulty behavior

-   **Easy:** 3 suspects; 5--7 evidence items; decisive clues are
    relatively direct.
-   **Medium:** 4 suspects; 7--9 evidence items; clues require combining
    at least two pieces of evidence.
-   **Hard:** 5 suspects; 9--12 evidence items; includes plausible red
    herrings but the solution remains logically supported.
-   Difficulty controls complexity, not graphic violence or disturbing
    content.
-   The server enforces allowed ranges even if the model returns a
    different number.

### 2.4 Case-generation progress

Show meaningful staged progress such as: 1. Creating the case premise 2.
Building suspects and timeline 3. Preparing evidence 4. Checking clue
consistency 5. Opening the investigation

These are UI progress labels, not claims about exact internal model
steps unless the backend actually performs them. Do not fake a
percentage that implies precise completion. Prefer stage labels and an
indeterminate progress indicator.

------------------------------------------------------------------------

## 3. Functional Requirements

### FR-001: Story seed input

-   User can enter a short story premise.
-   Minimum length: 20 characters after trimming.
-   Maximum length: 1,500 characters.
-   Empty or whitespace-only submissions are rejected.
-   Frontend displays character count and validation errors.
-   Backend repeats all validation; frontend validation is not a
    security boundary.
-   The seed must be framed as fictional content. Do not ask for
    real-world personal details.

### FR-002: Optional case settings

-   User can select difficulty: `easy`, `medium`, or `hard`.
-   User may select a theme from a controlled list: `classic_detective`,
    `locked_room`, `workplace_mystery`, `historical_fiction`, `sci_fi`,
    `campus_mystery`, `custom`.
-   Default difficulty: `medium`.
-   Default theme: `classic_detective`.
-   Unknown values are rejected or replaced only according to an
    explicit server-side default policy; never pass unchecked values
    directly into prompts.

### FR-003: Case generation

-   Backend generates a complete case using Gemini.
-   Case includes a case title, briefing, setting, incident, suspects,
    evidence items, timeline, culprit, solution explanation, and
    clue-to-solution mapping.
-   Generation is considered successful only after schema and
    consistency validation pass.
-   If the output is malformed, the backend may make one controlled
    repair/regeneration attempt.
-   If validation still fails, return a safe error and do not save a
    playable broken case.
-   Do not expose the culprit or solution in the public case payload
    before the player submits an accusation.

### FR-004: Suspects

Each suspect must have: - Stable ID within the case - Name - Short
profile - Relationship to the incident/victim/object, where relevant -
Plausible motive or reason for suspicion - Alibi - At least one evidence
connection - A fair reason they may appear suspicious - A
private-to-solution status indicating whether they are the culprit
(never sent to the client before reveal)

Avoid stereotypes and real-person impersonation. Use fictional names and
fictional details.

### FR-005: Evidence

Each evidence item must have: - Stable ID - Type - Title - Short
summary - Full content or media metadata - Discovery/source
description - One or more suspect links where relevant - Whether it is a
decisive clue, supporting clue, or red herring (private metadata; do not
reveal this classification to the player) - A logical interpretation
stored in the solution mapping - Optional asset URL for generated media,
served from an approved storage provider

Evidence must not contradict the case timeline or other evidence unless
the contradiction is intentionally explained as a clue. Red herrings
must be fair and resolvable, not arbitrary misinformation.

### FR-006: Evidence types and rendering

MVP supported types: - `chat_transcript` - `image` - `camera_log` -
`witness_statement` - `document` - `call_log` - `timeline_entry`

Rendering rules: - `chat_transcript`: render fictional conversation
bubbles, sender labels, timestamps, and message text. Use a generic chat
interface; do not imply access to a real WhatsApp account. - `image`: if
no real image-generation integration is configured, render a clearly
labeled illustrated placeholder or textual visual description. Do not
fabricate an asset URL. - `camera_log`: MVP renders a fictional camera
record with timestamp, camera label, event summary, and optional
generated still image. Actual video generation is not required. -
`witness_statement`: render a statement card with witness name/role and
statement. - `document`: render a readable document panel. - `call_log`:
render fictional caller labels, timestamps, and durations without real
phone numbers. - `timeline_entry`: render timestamp and event details.

All evidence detail views must display a small, consistent **"FICTIONAL
CASE EVIDENCE"** label.

### FR-007: Investigation room

-   Show case title and short briefing.
-   Show suspects in a dedicated panel or section.
-   Show evidence in a searchable/filterable grid where feasible.
-   Evidence items open into a modal, drawer, or detail route.
-   User can revisit evidence without losing progress.
-   Do not expose the solution, culprit flag, hidden clue labels, or
    internal model prompt.
-   Make evidence relationships easy to inspect without giving away the
    answer automatically.

### FR-008: Accusation

-   User must select exactly one suspect.
-   Submit action is disabled until a valid suspect is selected.
-   Backend verifies that the suspect belongs to the case.
-   A case can have one final accusation in MVP. If retry attempts are
    later enabled, define attempt limits and scoring explicitly before
    implementing.
-   Do not trust any client-supplied culprit ID or solution data.

### FR-009: Verdict and reveal

-   Backend compares the selected suspect with the stored culprit ID.
-   Return verdict (`correct` or `incorrect`), a spoiler-safe
    explanation, decisive clues, and a case resolution.
-   The reveal must explain why the culprit fits the evidence and why
    the strongest alternatives do not.
-   Do not ask Gemini to independently invent the verdict at submission
    time. The stored validated solution is authoritative.
-   The client only receives solution fields after a valid accusation is
    accepted.
-   The result page offers "Play another case" and optionally "Review
    evidence."

### FR-010: Failure and recovery

-   Show friendly errors for invalid input, generation failure,
    unavailable AI provider, network failure, missing case, and failed
    accusation.
-   Provide a retry action when retry is safe.
-   Never show stack traces, database errors, secrets, raw provider
    responses, or prompts to the user.
-   Avoid creating duplicate cases when a client retries the same
    request. Use an idempotency key where practical, or disable
    duplicate submission while a request is in flight.

### FR-011: Fiction and safety labels

-   Clearly label the product and generated cases as fictional.
-   Do not create evidence presented as authentic records from real
    people.
-   If a user seed contains real names, private messages, or allegations
    against identifiable people, steer generation toward fictionalized
    names and details or reject the input when appropriate.
-   Do not generate explicit sexual content, graphic violence, or
    instructions for committing real crimes. Keep mysteries suitable for
    a broad audience.
-   The product is entertainment, not a tool for identifying or accusing
    real people.

------------------------------------------------------------------------

## 4. AI and Content-Generation Design

### 4.1 Provider

-   Primary model provider: Google Gemini.
-   Access Gemini only from the backend.
-   Use the official supported Google GenAI SDK/API available at
    implementation time.
-   Pin dependencies to compatible versions and document the selected
    model identifier in configuration.
-   Do not hardcode the model name in multiple files; centralize it in
    server configuration.

### 4.2 AI architecture

Recommended generation pipeline: 1. Validate and normalize the user
seed. 2. Build a server-owned prompt with explicit schema and safety
rules. 3. Ask Gemini for structured JSON output when supported. 4. Parse
the result as untrusted data. 5. Validate using a runtime schema library
(e.g., Zod). 6. Run deterministic consistency checks. 7. If invalid,
make at most one repair attempt with validation errors summarized
safely. 8. Persist the validated case, separating public and private
fields. 9. Return only the public case DTO to the frontend.

### 4.3 Required generated case structure

The validated internal case object must include: - `title` -
`difficulty` - `theme` - `premise` - `briefing` - `setting` -
`incident` - `suspects[]` - `evidence[]` - `timeline[]` -
`culpritSuspectId` - `solutionSummary` - `solutionExplanation` -
`decisiveEvidenceIds[]` - `suspectReasoning[]` (one explanation per
suspect) - `createdAt` - `generationVersion`

### 4.4 Prompt design principles

System/developer prompt must instruct the model to: - Create a wholly
fictional mystery. - Treat the user seed as inspiration, not permission
to include real private information. - Choose one culprit and keep the
identity consistent throughout the case. - Make all clues, times,
alibis, and relationships logically coherent. - Include enough evidence
to infer the solution without external knowledge. - Ensure every
decisive clue is visible to the player before accusation. - Include
plausible alternatives and fair red herrings. - Avoid clues based solely
on stereotypes or arbitrary authorial statements. - Return JSON matching
the required schema and no surrounding prose. - Never return HTML,
JavaScript, executable code, markdown fences, or remote asset URLs it
has not actually generated. - Follow content-safety limits and
broad-audience tone.

### 4.5 Deterministic validation

At minimum, server-side validation must check: - Required strings are
non-empty and within defined length limits. - Difficulty and evidence
types are valid enums. - Suspect count matches difficulty range. -
Evidence count matches difficulty range. - IDs are unique within their
collection. - `culpritSuspectId` refers to an existing suspect. - Every
evidence suspect reference refers to an existing suspect. - Every
decisive evidence ID refers to existing evidence. - Every suspect has a
profile, motive/suspicion rationale, alibi, and evidence connection. -
Timeline entries have valid normalized timestamps or clearly ordered
sequence values. - The case has at least two clues that support the
culprit identification. - The explanation references existing evidence
IDs and does not refer to evidence absent from the case. - Public DTO
generation removes private solution fields. - String lengths and nested
array sizes are bounded to limit abuse and token/cost surprises.

If consistency checks cannot establish a fair puzzle, reject/regenerate
instead of serving it.

### 4.6 AI-generated images and camera media

MVP must work without image/video generation APIs. Use typed evidence
and clearly labeled placeholders where needed. If image generation is
added: - Isolate it behind a backend media-provider interface. - Store
media in a configured object-storage service, not as huge base64 strings
in MongoDB. - Persist only asset metadata and approved URLs. - Set
file-size, MIME-type, and timeout limits. - Do not assume Gemini text
generation itself returns a usable image or video file. - Do not
fabricate media URLs. - If generation fails, preserve a playable
text-based evidence item. - Actual camera video generation is an
optional later phase requiring an explicit provider, budget, and quality
review.

### 4.7 AI observability

Record safe operational metadata: - Provider/model identifier -
Generation duration - Validation outcome - Retry count - Approximate
token/usage metadata if available - Error category

Do not log API keys, full authorization headers, or unnecessary raw user
content. Avoid storing full prompts and provider responses in production
logs by default.

------------------------------------------------------------------------

## 5. Technical Architecture

### 5.1 Required stack

**Frontend** - React - Vite - JavaScript or TypeScript (prefer
TypeScript for schema-aligned contracts; if the repository already uses
JavaScript, keep consistent unless migration is explicitly approved) -
React Router - Fetch or Axios, using one consistent HTTP client - CSS
Modules, plain CSS, or a single chosen styling system; do not mix
multiple styling frameworks without a decision

**Backend** - Node.js - Express - MongoDB - Mongoose - Gemini SDK/API -
Runtime validation library such as Zod - Authentication is not required
for MVP; protect all non-public admin/operational endpoints if
introduced

**Testing** - Frontend component tests with Vitest and React Testing
Library - Backend tests with Vitest or Jest and Supertest - Unit tests
for validation and solution evaluation - Integration tests with mocked
Gemini responses - Optional end-to-end tests with Playwright

### 5.2 High-level flow

`React UI → Express API → Request validation → Case-generation service → Gemini → Schema/logic validation → MongoDB → Public case DTO → React investigation room`

Accusation flow:
`React accusation form → Express API → Validate case and suspect → Compare against stored culprit ID → Persist attempt/result → Return reveal DTO`

### 5.3 Suggested repository structure

Use a monorepo with separate client and server directories unless an
existing repository already has a clear structure.

``` text
ai-mystery-room/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── evidence/
│   │   │   ├── suspects/
│   │   │   └── common/
│   │   ├── pages/
│   │   │   ├── HomePage
│   │   │   ├── CreateCasePage
│   │   │   ├── InvestigationPage
│   │   │   └── RevealPage
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── styles/
│   │   └── main
│   ├── .env.example
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   ├── case/
│   │   │   └── evaluation/
│   │   ├── prompts/
│   │   ├── utils/
│   │   ├── app
│   │   └── server
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── DECISIONS.md
│   └── API.md
├── .gitignore
├── package.json
└── README.md
```

File extensions and exact structure may follow the repository's existing
language conventions.

### 5.4 Architecture rules

-   Keep route handlers thin; put generation and evaluation logic in
    services.
-   Keep database models separate from API DTOs.
-   Keep prompt templates in versioned server files, not in React.
-   Centralize environment configuration and validate required
    environment variables at startup.
-   Use a single error-handling middleware.
-   Use async/await and avoid unhandled promise rejections.
-   Avoid circular imports and giant components/services.
-   Never return raw MongoDB documents directly to the client.
-   Keep solution fields private until reveal.
-   Use server-side pagination if a future feature lists many cases.

------------------------------------------------------------------------

## 6. Data Model

### 6.1 MysteryCase collection

Suggested Mongoose fields: - `_id`: ObjectId - `caseCode`: unique,
non-sensitive public identifier - `title`: string - `difficulty`: enum -
`theme`: enum - `premise`: string - `briefing`: string - `setting`:
string - `incident`: string - `suspects`: array of suspect
subdocuments - `evidence`: array of evidence subdocuments - `timeline`:
array of timeline subdocuments - `solution`: private nested object -
`status`: `ready` \| `failed` (only ready cases are playable) -
`generationVersion`: string - `providerModel`: string - `createdAt`,
`updatedAt`: timestamps - Optional `expiresAt` for future TTL cleanup,
only if product retention policy is approved

Do not put `solution` inside any public response object. Use a dedicated
serializer/DTO to whitelist public fields.

### 6.2 Suspect subdocument

-   `suspectId`: string, stable within the case
-   `name`: string
-   `profile`: string
-   `relationship`: string
-   `motive`: string
-   `alibi`: string
-   `suspicionReason`: string
-   `evidenceIds`: string\[\]
-   Private `isCulprit`: boolean only if useful internally; preferably
    rely on `solution.culpritSuspectId` to avoid duplicate sources of
    truth

### 6.3 Evidence subdocument

-   `evidenceId`: string
-   `type`: supported enum
-   `title`: string
-   `summary`: string
-   `content`: structured object or bounded string, depending on
    evidence type
-   `sourceDescription`: string
-   `suspectIds`: string\[\]
-   `asset`: optional `{ url, mimeType, altText, provider }`
-   Private `classification`: `decisive` \| `supporting` \|
    `red_herring`
-   Optional `createdAtInStory`: normalized timestamp/string

Never store generated image/video binaries directly in MongoDB documents
for MVP.

### 6.4 Solution subdocument (private)

-   `culpritSuspectId`: string
-   `summary`: string
-   `explanation`: string
-   `decisiveEvidenceIds`: string\[\]
-   `suspectReasoning`: array of
    `{ suspectId, reasoning, ruledOutByEvidenceIds }`

### 6.5 CaseAttempt collection

-   `_id`
-   `caseId`
-   `selectedSuspectId`
-   `verdict`: `correct` \| `incorrect`
-   `submittedAt`
-   Optional anonymous session identifier only if needed for abuse
    prevention; do not use a persistent fingerprint.
-   Avoid storing unnecessary IP addresses or device identifiers.
-   MVP: enforce one final attempt per case per client flow. Since there
    is no authentication, do not promise robust per-user attempt limits
    across browsers.

### 6.6 Indexes

-   Unique index on `caseCode`.
-   Index on `createdAt` for operational cleanup/analytics if needed.
-   Index on `caseId` in `CaseAttempt`.
-   Avoid adding indexes without a query or operational need.

------------------------------------------------------------------------

## 7. API Contract

Base path: `/api/v1`

All responses use JSON. Set appropriate HTTP status codes. Error shape:

``` json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please provide a story premise between 20 and 1500 characters.",
    "requestId": "server-generated-id"
  }
}
```

Never include stack traces or secrets in error responses.

### 7.1 `GET /api/v1/health`

Purpose: health check. - `200`: `{ "status": "ok" }` - Do not expose
database credentials, environment variables, or detailed infrastructure
information.

### 7.2 `POST /api/v1/cases`

Create and generate a case.

Request:

``` json
{
  "storySeed": "A museum curator discovers that a rare clock disappeared during a private evening event.",
  "difficulty": "medium",
  "theme": "classic_detective"
}
```

Validation: - `storySeed`: 20--1500 characters after trim -
`difficulty`: `easy | medium | hard` - `theme`: one of the allowed theme
enum values

Success `201`:

``` json
{
  "case": {
    "id": "case-public-id",
    "title": "The Clock That Stopped",
    "difficulty": "medium",
    "theme": "classic_detective",
    "premise": "A rare clock vanishes during a private museum event.",
    "briefing": "A fictional briefing...",
    "setting": "A fictional museum...",
    "incident": "A rare clock disappeared...",
    "suspects": [
      {
        "id": "suspect-1",
        "name": "Mara Vale",
        "profile": "Museum conservator...",
        "relationship": "Works with the curator...",
        "motive": "Believed the clock was being sold improperly.",
        "alibi": "Says she was cataloguing objects...",
        "suspicionReason": "She had access to the display room.",
        "evidenceIds": ["evidence-1"]
      }
    ],
    "evidence": [
      {
        "id": "evidence-1",
        "type": "camera_log",
        "title": "West Hall Camera Log",
        "summary": "A brief movement is recorded near the display room.",
        "content": {
          "cameraLabel": "West Hall — Fictional Camera",
          "timestamp": "20:14",
          "event": "A figure enters the corridor; identity is unclear."
        },
        "sourceDescription": "Fictional security log"
      }
    ],
    "timeline": [
      {
        "id": "event-1",
        "timestamp": "20:00",
        "description": "The private event begins."
      }
    ]
  }
}
```

The sample is illustrative, not a fixed story. Public response must not
contain `culpritSuspectId`, `solution`, hidden evidence classifications,
or internal prompts.

Failure responses: - `400 VALIDATION_ERROR` - `429 RATE_LIMITED` -
`502 AI_PROVIDER_ERROR` or `503 AI_UNAVAILABLE` - `500 INTERNAL_ERROR`

### 7.3 `GET /api/v1/cases/:caseId`

Retrieve a playable case. - `200`: same public case shape as above. -
`404 CASE_NOT_FOUND` if the ID is invalid or unavailable. - Must never
reveal solution fields before an accusation has been accepted.

### 7.4 `POST /api/v1/cases/:caseId/accusation`

Submit the final accusation.

Request:

``` json
{
  "suspectId": "suspect-2"
}
```

Success `200`:

``` json
{
  "result": {
    "verdict": "incorrect",
    "selectedSuspectId": "suspect-2",
    "culprit": {
      "id": "suspect-1",
      "name": "Mara Vale"
    },
    "solutionSummary": "The clock was moved using a service corridor.",
    "solutionExplanation": "The access record and message timestamp contradict the suspect's alibi.",
    "decisiveEvidence": [
      {
        "id": "evidence-3",
        "title": "Service Corridor Access Record",
        "explanation": "This record places the culprit near the display at the relevant time."
      }
    ],
    "suspectReasoning": [
      {
        "suspectId": "suspect-1",
        "reasoning": "The access record and message timestamp contradict the alibi."
      }
    ]
  }
}
```

Validation and behavior: - Verify case exists and is ready. - Verify
`suspectId` exists in that case. - Do not accept a culprit ID from the
client. - Apply the one-final-accusation policy for the current case
flow; duplicate submissions should return the previously recorded result
or a clear conflict response, not create contradictory attempts. -
`400 VALIDATION_ERROR`, `404 CASE_NOT_FOUND`, `404 SUSPECT_NOT_FOUND`,
`409 ACCUSATION_ALREADY_SUBMITTED`, or `500 INTERNAL_ERROR` as
appropriate. - The result reveals the solution only after valid
submission.

### 7.5 API implementation notes

-   Generate a request ID for logs and error responses.
-   Validate request bodies and route parameters.
-   Set request body size limits.
-   Apply rate limits to case generation and accusation endpoints.
-   Configure CORS using an explicit frontend origin allowlist.
-   Use consistent naming and casing across backend DTOs and frontend
    types.
-   Document any intentional contract change in `docs/DECISIONS.md` and
    update tests.

------------------------------------------------------------------------

## 8. UX and Visual Design

### 8.1 Design direction

Create a cinematic, premium detective-room interface: dark charcoal/navy
surfaces, warm paper-like evidence cards, restrained amber or brass
accents, clear typography, subtle shadows, and focused use of motion.
The interface should feel atmospheric without sacrificing readability.

Avoid: - Overly busy dashboards - Excessive neon/glow effects - Tiny
low-contrast text - Animation that blocks interaction - Fake film grain
over body text - Fake system alerts that resemble real device warnings

### 8.2 Required screens

**A. Home / Landing** - Brand: AI Mystery Room - Headline explaining the
experience in one sentence - Short supporting copy - Primary CTA:
"Create a Mystery" - Brief "How it works" section - Fictional-content
disclaimer - Responsive header/footer

**B. Create Case** - Story-seed textarea - Character count - Difficulty
cards or select - Theme selector - Submit CTA - Input validation and
loading state

**C. Generating** - Stage-based status copy - Clear cancellation/back
behavior if supported - Retry/error screen if generation fails - Do not
lose the seed if generation fails

**D. Investigation Room** - Case title, ID/code, briefing, and
incident - Suspect cards - Evidence board - Evidence type filters -
Evidence detail modal/drawer - Timeline section - Persistent "Make an
Accusation" action - Fictional evidence label

**E. Accusation Confirmation** - Selected suspect summary -
Confirm/cancel actions - Clear warning that submission reveals the
solution

**F. Reveal** - Correct/incorrect result state - Culprit profile -
Explanation grounded in evidence - Decisive clues - Reason other
suspects were ruled out - "Review Evidence" and "Create Another Mystery"
actions

### 8.3 Component guidelines

Suggested reusable components: - `AppShell` - `Header` - `Footer` -
`PrimaryButton` - `DifficultySelector` - `StorySeedForm` -
`GenerationStatus` - `CaseBriefing` - `SuspectCard` - `SuspectGrid` -
`EvidenceCard` - `EvidenceFilter` - `EvidenceViewer` - `Timeline` -
`AccusationPanel` - `VerdictBanner` - `SolutionBreakdown` -
`ErrorState` - `LoadingSkeleton` - `FictionalEvidenceBadge`

Keep components focused. Avoid putting API calls, generation rules, and
all page UI into one component.

### 8.4 Responsive requirements

-   Mobile-first layout.
-   At 320px viewport width, no horizontal page overflow.
-   On mobile, stack suspect and evidence sections; use a full-screen
    evidence viewer if needed.
-   On tablet, use a two-column investigation layout where space
    permits.
-   On desktop, use a multi-column evidence board with a readable
    content width.
-   Interactive controls should have comfortable touch targets (aim for
    44×44 CSS px).
-   Dialogs must fit within the viewport and support scrolling.

### 8.5 Accessibility requirements

-   Semantic HTML and meaningful heading order.
-   Keyboard-operable navigation, dialogs, filters, and suspect
    selection.
-   Visible focus indicators.
-   Sufficient text/background contrast.
-   Labels for form controls and accessible error messages.
-   Dialog focus management and Escape-to-close where appropriate.
-   Do not communicate verdicts through color alone.
-   Respect reduced-motion preferences.
-   Add descriptive alt text to images; mark purely decorative imagery
    appropriately.

### 8.6 Visual states

Every async UI must cover: - Idle - Loading - Success - Empty, where
applicable - Validation error - Network/provider error - Retry state -
Disabled state

------------------------------------------------------------------------

## 9. Security, Privacy, and Abuse Prevention

### 9.1 Secrets

Required server environment variables: - `PORT` - `MONGODB_URI` -
`GEMINI_API_KEY` - `GEMINI_MODEL` - `CLIENT_ORIGIN` - `NODE_ENV`

Optional: - `RATE_LIMIT_WINDOW_MS` - `RATE_LIMIT_MAX_REQUESTS` -
`CASE_RETENTION_DAYS` (only if retention cleanup is implemented and
documented) - Media provider credentials only if a real media provider
is added

Use separate client and server environment files. Frontend variables
must never contain server secrets. Commit `.env.example`, never `.env`.

### 9.2 Input and output safety

-   Trim and length-limit user input.
-   Treat the story seed as data, not as instructions that can override
    system constraints.
-   Validate all model output before persistence.
-   Render user/model text as text; do not use unsafe HTML injection.
-   Sanitize or reject unexpected URLs in generated assets.
-   Restrict media types and size if uploads are added later.
-   Do not execute generated content.

### 9.3 API security

-   Explicit CORS allowlist.
-   Rate limit generation endpoints.
-   Limit request body size.
-   Use Helmet or equivalent secure HTTP headers.
-   Avoid exposing internal errors.
-   Validate MongoDB ObjectIds/public IDs before querying.
-   Use parameterized model queries and never construct database
    operators from unchecked client objects.
-   Do not add unauthenticated admin/debug endpoints.

### 9.4 Privacy and retention

-   MVP does not require accounts.
-   Explain that story seeds and generated cases are sent to the
    configured AI provider and stored by the app to deliver the game.
-   Do not ask for real names, addresses, phone numbers, or private
    communications.
-   Define a retention policy before public launch. If no TTL cleanup is
    implemented, disclose that cases may remain stored until manually
    removed.
-   Avoid collecting analytics beyond what is necessary for reliability
    and product improvement.
-   Provide a way to delete stored case data if a public
    retention/deletion feature is introduced.

### 9.5 Abuse and cost controls

-   Apply per-IP or session-based rate limits without relying on
    invasive fingerprinting.
-   Set provider request timeouts.
-   Cap story-seed size, number of suspects, evidence count, output
    token budget, and repair attempts.
-   Do not run unbounded regeneration loops.
-   Consider per-day quotas and budget alerts before public deployment.
-   Return `429` when rate-limited and explain when the user can retry
    if that information is available.

------------------------------------------------------------------------

## 10. Error Handling and Logging

### 10.1 Error categories

-   `VALIDATION_ERROR`
-   `RATE_LIMITED`
-   `CASE_NOT_FOUND`
-   `SUSPECT_NOT_FOUND`
-   `CASE_GENERATION_FAILED`
-   `AI_PROVIDER_ERROR`
-   `AI_UNAVAILABLE`
-   `AI_OUTPUT_INVALID`
-   `DATABASE_ERROR`
-   `ACCUSATION_ALREADY_SUBMITTED`
-   `INTERNAL_ERROR`

### 10.2 Logging

-   Use structured logs with timestamp, severity, request ID, route,
    duration, and error category.
-   Never log secrets.
-   Avoid logging full user seeds or complete generated evidence by
    default.
-   In development, provide actionable diagnostics without leaking
    credentials.
-   In production, return generic safe errors to clients and preserve
    detailed diagnostics in protected server logs.

------------------------------------------------------------------------

## 11. Testing and Quality Gates

### 11.1 Unit tests

-   Story-seed length validation
-   Difficulty/theme validation
-   Generated case schema validation
-   Suspect/evidence ID uniqueness
-   Culprit reference validation
-   Timeline and evidence reference consistency
-   Public DTO excludes solution fields
-   Accusation evaluation returns correct verdict
-   Duplicate accusation behavior
-   Error-to-HTTP mapping

### 11.2 Integration tests

-   `POST /cases` with mocked valid Gemini output
-   `POST /cases` with malformed output and repair failure
-   `GET /cases/:id` returns only public fields
-   Accusation with valid suspect
-   Accusation with unknown case or suspect
-   Duplicate accusation request
-   Gemini timeout/provider failure
-   MongoDB unavailable behavior
-   Rate limiting and request validation

### 11.3 Frontend tests

-   Story form validation
-   Loading and error states
-   Case rendering from API fixture
-   Evidence detail viewer opens and closes accessibly
-   Suspect selection
-   Accusation confirmation
-   Reveal screen displays explanation and decisive evidence
-   Mobile layout smoke checks

### 11.4 Definition of Done

A feature is done only when: - It meets its acceptance criteria. -
Relevant tests pass. - Loading, error, and empty states are handled. -
No secret or private solution data leaks to the client. - Responsive and
accessibility behavior has been checked. - Documentation and environment
examples are updated. - No lint/build errors remain. - Any new design or
scope decision is documented.

------------------------------------------------------------------------

## 12. Acceptance Criteria for MVP

### AC-01: Create a case

Given a valid story seed and settings, when the user submits the form,
the app generates and persists a valid case and opens the investigation
room.

### AC-02: Reject invalid input

Given a blank or too-short/too-long seed, when submitted, the user sees
a clear validation message and no AI generation request is made.

### AC-03: Handle malformed AI output

Given Gemini returns malformed or inconsistent content, the backend
attempts at most one controlled repair. If still invalid, no broken case
is exposed and the user receives a recoverable error.

### AC-04: Protect the solution

Before accusation, no API response or frontend bundle/state contains the
culprit ID, private solution explanation, hidden evidence
classifications, or internal prompt.

### AC-05: Inspect evidence

The user can open each evidence item and read its full supported content
on desktop and mobile.

### AC-06: Make an accusation

The user can select exactly one suspect and submit the accusation.
Invalid suspect IDs are rejected by the backend.

### AC-07: Reveal the result

After valid submission, the result page displays the verdict, culprit,
solution explanation, and decisive clues consistent with the stored
case.

### AC-08: Correctness is deterministic

The verdict is calculated by the backend from the persisted solution. It
is not generated anew by the AI at accusation time.

### AC-09: Failure handling

If the database, network, or AI provider fails, the app displays a
useful error and does not leak internal details.

### AC-10: Responsive accessibility

Core flow works at 320px mobile width and desktop widths; all primary
actions are keyboard accessible and have visible focus states.

### AC-11: Fictional presentation

Every case and evidence viewer clearly indicates that the content is
fictional.

### AC-12: Setup reproducibility

A new developer can configure environment variables, install
dependencies, run client/server, and execute tests using the README.

------------------------------------------------------------------------

## 13. Implementation Milestones

### Milestone 0 --- Repository and setup

-   Inspect repository and identify existing framework/language
    conventions.
-   Create or confirm monorepo structure.
-   Add linting, formatting, scripts, environment validation,
    `.gitignore`, and README.
-   Add `/health` endpoint and database connection handling.
-   Deliverable: client and server start reliably.

### Milestone 1 --- Product shell and static UI

-   Build landing, create-case form, investigation layout, and reveal
    layout using fixture data.
-   Establish design tokens, responsive layout, reusable components, and
    accessibility baseline.
-   Deliverable: end-to-end visual prototype with no live AI.

### Milestone 2 --- Data contracts and backend case flow

-   Implement Mongoose schemas, runtime validation, DTO serializers, API
    routes, and error handling.
-   Add fixture-backed case creation for development/testing.
-   Deliverable: case API works with deterministic fixtures.

### Milestone 3 --- Gemini integration

-   Add prompt templates, Gemini service, structured output parsing,
    validation, bounded repair attempt, timeout, and safe logging.
-   Add mocked integration tests.
-   Deliverable: valid cases generated from user seeds.

### Milestone 4 --- Investigation and evidence experience

-   Render suspects, timeline, all MVP evidence types, filters, and
    evidence viewer.
-   Confirm no private solution data leaks to client.
-   Deliverable: a user can inspect a generated case.

### Milestone 5 --- Accusation and reveal

-   Implement final accusation, deterministic evaluation, attempt
    persistence, reveal DTO, and solution UI.
-   Deliverable: complete playable loop.

### Milestone 6 --- Hardening

-   Rate limits, security headers, CORS, body limits, timeouts, error
    states, accessibility, responsive checks, and retention
    documentation.
-   Run unit/integration/UI tests and production build.
-   Deliverable: MVP release candidate.

### Milestone 7 --- Optional media enhancement

Only after MVP is stable: - Select and document an image-generation
provider. - Add object storage and media metadata. - Generate selected
still images for image/camera-log evidence. - Add provider failure
fallbacks and cost controls. - Actual video generation requires a
separate approved scope.

**Implementation rule:** Finish and verify one milestone before moving
to the next. Do not skip directly to AI integration before contracts and
fixture-based flows are stable.

------------------------------------------------------------------------

## 14. Deployment and Operations

### 14.1 Environments

-   Local development
-   Test/CI
-   Production

Keep separate database instances/credentials and AI keys where feasible.

### 14.2 Production readiness

-   Configure frontend and backend origins.
-   Use HTTPS.
-   Set production secrets through hosting-provider secret management.
-   Verify MongoDB network access and least-privilege credentials.
-   Set request timeouts and rate limits.
-   Configure logs and basic uptime monitoring.
-   Confirm the application can start when the AI provider is
    temporarily unavailable.
-   Never expose server environment variables in frontend build output.
-   Document backup and data-retention policy before public launch.

### 14.3 Minimum scripts

Provide equivalent scripts appropriate to the package manager: - `dev`:
run development services - `build`: production frontend build and
backend checks - `start`: start production server - `test`: run tests -
`lint`: lint source - `format`: format source

If using separate client/server package files, document commands for
each and a root-level convenience workflow if practical.

------------------------------------------------------------------------

## 15. Future Roadmap (Not MVP Commitments)

Potential future features, subject to separate specification: - User
accounts and saved case library - Multiple accusation attempts with
scoring - Case difficulty calibration and player feedback - Generated
still images for selected evidence - Real generated video clips from an
approved media provider - Shareable read-only cases with spoiler
protection - Case templates and curated hand-authored cases - Additional
languages - Content moderation and age/tone settings - Admin analytics
and generation-cost dashboard

Do not implement these merely because they appear here. They are future
ideas, not MVP requirements.

------------------------------------------------------------------------

## 16. Decisions and Open Questions

The following defaults are resolved for MVP unless deliberately changed
in `docs/DECISIONS.md`: 1. **Authentication:** no account required. 2.
**Attempts:** one final accusation per case flow. 3. **Media:**
text-based evidence and UI-rendered artifacts first; actual image/video
generation is optional. 4. **Provider:** Gemini is called only from the
backend. 5. **Verdict:** deterministic comparison against the stored
solution. 6. **Case access:** cases are accessed through an opaque case
ID; do not expose a public browse/list endpoint. 7. **Storage:** MongoDB
stores structured case content; external storage is required for future
binary media. 8. **Content:** fictional, broad-audience mysteries; no
real-person accusations. 9. **Case generation failure:** one bounded
repair attempt, then fail safely. 10. **Styling:** choose one consistent
styling approach and document it.

Before public release, explicitly decide: - Case retention duration and
deletion behavior. - Whether anonymous case URLs can be shared. -
Whether generated images justify their provider cost and latency. -
Whether to add authentication or abuse quotas. - Which exact Gemini
model and SDK version are supported by the deployment environment.

------------------------------------------------------------------------

## 17. Codex Build Prompt

Use the following as the initial instruction when opening the repository
in Codex:

> Build **AI Mystery Room** according to `SPEC.md` (AMR-SPEC-001). Treat
> `SPEC.md` as the authoritative source of truth. First inspect the
> repository and summarize its current structure, then propose a
> milestone-based implementation plan mapped to Section 13. Do not start
> by generating the entire application in one change.
>
> Implement Milestone 0 first. After each milestone, run the relevant
> tests/build, report files changed, list commands executed and results,
> identify any specification gaps, and wait for review before making
> broad architectural changes.
>
> Preserve all security and privacy requirements. Gemini must be called
> only from the backend. Validate all AI output with runtime schemas and
> deterministic consistency checks. Keep culprit/solution fields out of
> all pre-accusation API responses. The backend must calculate the
> verdict from the persisted solution; do not ask the model to decide
> the verdict during accusation submission.
>
> If the repository has existing code, inspect it before changing
> anything. Do not overwrite working code without understanding it. If a
> requirement cannot be implemented as written, explain why and propose
> the smallest compliant alternative. Record approved deviations in
> `docs/DECISIONS.md`. Do not implement future-roadmap features unless
> separately approved.

------------------------------------------------------------------------

## 18. Release Checklist

-   [ ] User can create a case from a valid story seed.
-   [ ] Invalid seeds are rejected before provider calls.
-   [ ] Gemini key is server-only.
-   [ ] AI output is schema-validated and logically checked.
-   [ ] Failed generation never creates a playable broken case.
-   [ ] Public case DTO excludes all solution-only data.
-   [ ] All evidence items are labeled fictional.
-   [ ] Suspect and evidence IDs are validated server-side.
-   [ ] Accusation verdict is deterministic.
-   [ ] Duplicate submissions are handled consistently.
-   [ ] Rate limits, request limits, timeouts, CORS, and security
    headers are configured.
-   [ ] No secrets or raw stack traces are exposed.
-   [ ] Mobile, keyboard, and reduced-motion checks are complete.
-   [ ] Tests, lint, and production build pass.
-   [ ] README and `.env.example` are complete.
-   [ ] Data retention policy is documented.
-   [ ] Deployment secrets are configured outside source control.

**End of specification --- AMR-SPEC-001 v1.0.0**
