# noClue Research Platform

An evidence-first research operating system for sponsors, venues, speakers,
community partners, and participant outreach.

## What works now

- Create research briefs with opportunity type, cities, and criteria.
- Create scoped collection jobs with approved public source URLs, allowed domains,
  and a page budget.
- Collect approved HTML pages while checking `robots.txt`, page size, content
  type, timeout, and final response status.
- Store source snapshots, title, summary, text excerpt, content hash, public
  email routes found on the page, and evidence-review state.
- Create people, companies, venues, and opportunities; attach evidence; move
  records through the pipeline; and export records as CSV.
- Create and approve outreach drafts. Sending remains a deliberate human action.
- Use Apollo or Surfe enrichment for an approved person. Keys are server-only;
  Apollo can also be connected for one local server session from Contact tools.
- Show provider status for Apollo, Surfe, Hunter, Snov.io, and official public sources.
- Turn one plain-language request into an editable research plan with a local
  Ollama model. The planner does not fetch pages, run contact lookups, or spend
  provider credits.

## Run locally

```bash
cp .env.example .env
npm install
```

In one terminal:

```bash
npm run server
```

In a second terminal:

```bash
npm run dev
```

Open `http://127.0.0.1:5173`.

## Local request planner

The Research tool can use a model already running on your own Mac to turn a
request such as “find AI speakers in Bangalore” into an editable brief,
evaluation criteria, city selection, and suggested public-source searches.

```text
LOCAL_LLM_BASE_URL=http://127.0.0.1:11434
LOCAL_LLM_MODEL=qwen3:4b
```

Start Ollama and make sure that model is installed before using the planner:

```bash
ollama serve
ollama pull qwen3:4b
```

The planner only returns structured suggestions. You must still choose and
approve exact public webpage addresses before a collection can run.

## Contact provider setup

Fill only the provider secrets you plan to use in `.env`:

```text
SURFE_API_KEY=...
APOLLO_API_KEY=...
ROCKETREACH_API_KEY=...
HUNTER_API_KEY=...
SNOV_CLIENT_ID=...
SNOV_CLIENT_SECRET=...
```

Do not use a `VITE_` prefix for provider credentials. Variables with that
prefix are delivered to the browser.

### Webhook fields: leave them blank for now

The local app at `127.0.0.1` cannot receive a provider webhook from the
internet, and this version intentionally retrieves Apollo phone results by
polling. Therefore keep both values blank:

```text
SURFE_WEBHOOK_URL=
APOLLO_WEBHOOK_URL=
```

Do not point either one at an invented address. A webhook URL becomes useful
only after the API has a deployed public HTTPS endpoint, a matching receiver
route, and provider-signature verification. That receiver is not part of this
local version.

Apollo work-email enrichment is requested directly from a selected person
record. Apollo phone enrichment is asynchronous: this local version records it
as pending, then lets the user explicitly check the pollable result instead of
pretending a phone number is immediately ready.
For a deployed version, set `APOLLO_API_KEY` in the host's secret settings;
the local in-app key field intentionally lasts only until the server restarts.

RocketReach can be connected the same way from the Research tool. It performs a
single-person lookup from the selected record's name, employer, and optional
public LinkedIn address. Check RocketReach's own account before lookup for its
current credit and access rules.

Hunter is available in the Research tool for a work-email lookup using a saved
person's name and company domain. Snov credentials are included in the
environment template, but Snov lookup is not yet exposed in the interface.

## Data location

Local alpha records persist in `data/store.json`, which is created only after
the first write and is ignored by Git. This makes the product usable locally
without pretending that a browser-only prototype is a CRM.

## Vercel deployment note

Vercel can host the interface and API routes, but its server filesystem is
temporary and cannot reach Ollama running on your Mac. The hosted version is a
shareable workspace demonstration; its saved data can disappear after a server
restart and the local request planner remains available only at local runtime.
Use a hosted model endpoint and PostgreSQL/Supabase before treating the hosted
version as the team source of truth.

## Next production migration

The source-of-truth schema is designed to move to PostgreSQL: workspace,
research brief, collection job, source snapshot, evidence, record, opportunity,
outreach draft, enrichment, and audit event. The worker boundary can then move
to Redis/BullMQ and containerised Crawlee/Docling workers without changing the
browser workflow.
