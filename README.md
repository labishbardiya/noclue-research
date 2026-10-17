# noClue Research

An evidence-first workspace for finding, qualifying, and approaching speakers,
attendees, sponsors, venues, and community partners for Reality Check.

## System design overview

```text
Team request
    ↓
Research plan
    ↓
Approved public-source collection
    ↓
Evidence and candidate records
    ↓
Human-reviewed contact lookup and outreach
    ↓
Outcomes, objections, and reusable learning
```

### Core parts

| Part | Responsibility |
|---|---|
| Research planner | Turns a plain-language goal into an editable brief: target type, city, criteria, exclusions, and source-search ideas. |
| Public collector | Reads only user-approved public webpages, keeps the source snapshot, and records each collection step in a visible trace. |
| Evidence vault | Stores source links, retrieval dates, excerpts, and review state alongside people and organisation records. |
| Contact layer | Uses an explicitly chosen provider only after a human decides that a person is worth contacting. |
| Outreach layer | Keeps drafts, message experiments, replies, objections, and outcomes as reusable team learning. |
| Knowledge vault | Will index Reality Check materials and organiser context so future research and drafts use grounded internal information. |

### Trust boundaries

- Public collection is limited to approved domains and exact webpages.
- A research trace shows scope, source actions, visible findings, and concise decision summaries.
- Contact enrichment, sending, proposals, and commitments remain human-approved actions.
- Every recommendation should distinguish verified evidence from an inference or a human decision.
- Provider keys remain server-side. Portable workspace data prevents lock-in to one provider.

### Current and target deployment

The current application uses a React interface and a Node service. Local Ollama can
structure a research request without using contact-provider credits. A production
team deployment should use durable database storage, a hosted retrieval service,
and a hosted model endpoint; the Vercel interface alone is not the permanent
source of truth.
