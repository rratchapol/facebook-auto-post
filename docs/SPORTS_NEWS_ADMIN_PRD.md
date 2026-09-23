# PRD: Sports News Admin

## 1. Document control

| Field | Value |
|---|---|
| Product | Sports News Admin (working title) |
| Version | 0.1 |
| Date | 2026-09-22 |
| Status | Draft for approval |
| Owner | Page administrator |
| Output level | Standard PRD |
| Source | Product-design workshop with product owner |

### Decision ledger

**Confirmed**

- Audience: Thai sports fans who want trustworthy, concise morning news.
- Content: 3–5 stories/day; international football, Thai football, and only major stories in other sports.
- One Facebook post represents one story.
- Daily slots: 09:00 (lead story), 12:00, 16:00, and 19:00; breaking news may be scheduled outside these slots.
- A draft with image is prepared before 08:30. Nothing is published without explicit approval.
- Initial scope is one Facebook Page, one administrator, and email/password login. Editor and Approver roles will be supported later.
- Ingestion: approved RSS/API sources every 15 minutes; Google News RSS discovery every 30 minutes; timezone is `Asia/Bangkok`.
- Copy format: headline, 6–7 summary lines, one “why it matters” line, source name and URL, and no more than 2–3 hashtags.
- Tone: neutral, concise, and not sensational. Gambling-promoting content is prohibited; other content may be considered by the administrator.
- Image: branded generic AI/editorial graphic; no real logos or imitation of copyrighted news imagery; source credit/link appears in the caption.
- Stack: Next.js, Supabase, scheduled jobs, and Vercel or comparable cloud hosting.
- Secrets live only in environment variables/secret vault; tokens that must persist are encrypted.

**Recommendations in this document**

- Use Supabase Auth and object storage, and an external scheduled worker/cron suitable for the selected hosting plan.
- Treat Google News RSS as discovery only; a post must cite the original allowlisted source.
- Limit initial regeneration quotas to 3 text attempts and 2 image attempts per story. Exact monetary budget remains configurable.

**Open decisions (non-blocking for foundation work)**

- Page name, logo, final color palette, Thai typeface, and default footer text.
- Initial allowlist of sources and their assigned tier.
- AI provider/model, image provider, monthly budget, and per-generation unit limits.
- Facebook application, Page access credentials, and API permission approval.
- Production host selection, backup retention period, and admin email address.

---

## 2. Executive product brief

### One-sentence concept

A private web admin that discovers sports news from trusted sources, ranks it, generates Thai Facebook post drafts and branded generic images, and publishes only administrator-approved posts on a schedule.

### Problem and opportunity

Producing reliable daily sports content is repetitive: the administrator must monitor many sources, identify duplicate stories, summarize in Thai, create visual assets, credit the source, and publish at the right time. Manual work slows delivery; fully automated publishing risks factual errors and misleading content.

### Target user and job to be done

The initial user is a single page administrator. Each morning, they need to choose a small number of credible sports stories, turn each into a consistent Thai post within minutes, and safely schedule it for the Facebook Page.

### Value proposition

The product combines a trustworthy, scored news inbox with human editorial control. It keeps citations and change history with each post while removing the repetitive work of drafting, image creation, and timed publishing.

### Business objective

Grow followers by publishing reliable, timely sports posts that readers recognize and trust.

### Product principles

1. **Human approval before publication** — no approved status, no Facebook post.
2. **Source traceability** — every drafted claim visibly links back to its original source.
3. **Trust before speed** — source tier and editorial rules outweigh social chatter.
4. **One story, one post** — a post is focused and easy to validate.
5. **Recoverable operations** — failures are visible, retryable, and never silently duplicate a post.

### Non-goals for MVP

- A public news website or public reader accounts.
- Multi-Page publishing.
- Automated publication without approval.
- Publishing betting promotions.
- Reusing unlicensed news photographs or club logos.
- Advanced performance analytics and automated content optimization.

---

## 3. Outcomes and measurement

| Metric | Definition | Data source | Target / window |
|---|---|---|---|
| On-time publishing | Scheduled approved posts published in their intended slot | Publication records | ≥95% in first 30 days |
| Morning draft readiness | Days where at least one lead-story draft is ready by 08:30 | Draft timestamp | ≥90% in first 30 days |
| Admin effort | Median active editing/approval time per published post | Admin events | <5 minutes/post in first 30 days |
| Factual-removal guardrail | Published posts deleted because of a factual error | Audit log | 0 in first 30 days |
| Growth outcome | Facebook Page follower growth | Facebook/Page analytics | Baseline and target to be set after access is connected |

---

## 4. Scope and release strategy

### MVP hypothesis

If a single administrator receives ranked, traceable news candidates and can approve a high-quality text-and-image draft quickly, the Page can publish consistent reliable content on schedule and begin growing followers.

### MVP — Must

- Source allowlist with tiers and RSS/API ingestion.
- Google News RSS discovery feed, mapped to original sources.
- News stack with deduplication, source tier, score, and source links.
- AI-ranked daily candidate list and separate text/image generation.
- Prompt governance: locked base prompt, selectable preset, per-story instruction, and version history.
- Editable Composer with source and fact-change audit log.
- Approval, scheduled queue, breaking-news workflow, and Facebook Page publishing.
- Brand settings, in-app operational alerts, connection status, publication history, and retry/error handling.

### Later phases

- Facebook performance dashboard and content-performance recommendations.
- Editor/Approver role assignment and multi-user workflow.
- Multi-Page publishing.
- More discovery connectors, subject to licensed API access.

### Dependencies

- Approved RSS/API endpoints and initial source allowlist.
- AI text/image provider credentials.
- Facebook developer app, Page access token, permissions, and review where Meta requires it.
- Production domain/host and secure secret configuration.

---

## 5. Information architecture

Authenticated routes are private. There is no public-facing site in MVP.

| Route / area | Purpose |
|---|---|
| `/login` | Administrator authentication |
| `/dashboard` | Operational overview, alerts, upcoming queue, and connection health |
| `/news-stack` | Incoming stories, source evidence, duplicate groups, tier, score, and selection |
| `/composer/[storyId]` | Generate, edit, validate, approve, and schedule one post |
| `/queue` | Calendar/list of scheduled, publishing, published, and failed posts |
| `/sources` | Manage source allowlist, URL/RSS/API configuration, tier, and fetch health |
| `/prompts` | Base prompt, presets, version history, and publication rules |
| `/brand` | Page name, logo, colors, font choices, and caption footer |
| `/history` | Publication records and immutable audit events |
| `/settings/integrations` | Facebook and provider connection health; secrets are not displayed |

---

## 6. Critical user journeys

### J-001: Prepare the morning lead story

- **Actor:** Administrator
- **Preconditions:** At least one eligible source item has been ingested; administrator is signed in.
- **Main flow:** Open Dashboard → open AI-ranked candidate → inspect original source and tier → generate draft → edit if needed → approve → assign 09:00 slot.
- **Alternate flow:** The candidate is irrelevant or insufficiently credible → dismiss it with a reason; choose another candidate.
- **Failure/recovery:** Text/image generation fails → retry within quota or edit manually; source cannot be reached → do not approve until administrator has sufficient evidence.
- **Success:** A validated post enters `scheduled` before its planned time.
- **Related:** FR-003, FR-005 to FR-011, BR-002 to BR-006.

### J-002: Publish an approved scheduled post

- **Actor:** Scheduled publisher
- **Preconditions:** Post status is `scheduled`, it has an approval event, a source URL, copy, and an approved image.
- **Main flow:** Job claims due post → creates idempotency key → sends post and image to Facebook → stores Page post ID, URL, and actual publish time → sets status `published`.
- **Failure/recovery:** Provider failure → limited retry; final failure → `needs_attention`, in-app alert, and no duplicate post.
- **Success:** Exactly one Facebook post exists and history links to it.
- **Related:** FR-012 to FR-015, BR-007 to BR-009.

### J-003: Handle breaking news

- **Actor:** Administrator
- **Preconditions:** Administrator provides/selects an eligible original source.
- **Main flow:** Create breaking-news item → select Breaking News preset → generate/edit → verify source and time → explicitly approve → publish immediately or schedule a nonstandard time.
- **Failure/recovery:** Missing source/time or no approval → block publication and show validation reason.
- **Success:** A traceable, approved post is published without waiting for a regular slot.
- **Related:** FR-009, FR-011, BR-004, BR-006.

### J-004: Correct a published post

- **Actor:** Administrator
- **Preconditions:** A publication exists and administrator identifies a correction need.
- **Main flow:** Open history → record reason → update/delete Facebook post through the available integration action → persist change event and link.
- **Failure/recovery:** Facebook action fails → show `needs_attention`; retain original audit event and retry manually.
- **Success:** The correction action and justification are traceable.
- **Related:** FR-016, BR-010.

---

## 7. Page specifications

| Page | Primary controls | Required states |
|---|---|---|
| Dashboard | Open draft, view queue, investigate alert | Loading, no eligible news, draft ready, integration warning, job failure |
| News Stack | Filter, inspect source, merge/dismiss/select candidate | Loading, empty, duplicate group, source unavailable, selected |
| Composer | Select preset, add instruction, generate text/image, edit, validate, approve, schedule | Generating, quota reached, validation error, pending approval, approved, scheduled |
| Queue | Filter by status, change schedule before publication, open published link | Empty slot, scheduled, publishing, published, needs attention |
| Sources | Add/edit/disable source, assign tier, test fetch | Healthy, stale, failed fetch, invalid URL, duplicate source |
| Prompts | Edit base prompt/preset, publish a new version, view usage | Locked base rule warning, draft version, active version |
| Brand | Update name, colors, logo, footer, preview image template | No logo/default theme, validation error, saved preview |
| History | Inspect content versions, audit events, published links | Empty, filtered results, unavailable Facebook link |
| Integrations | Inspect connection health and renewal warning | Connected, expiring, disconnected, service failure |

Responsive requirement: all essential approval and alert-review actions must work on a mobile-width browser; detailed source and audit tables may collapse into drill-down cards.

---

## 8. Functional requirements

| ID | Requirement | Priority | Dependencies | Acceptance criteria |
|---|---|---|---|---|
| FR-001 | Authenticate authorized users with email and password. | Must | Supabase Auth | An allowlisted administrator can sign in/out; unauthenticated access to private routes redirects to login. |
| FR-002 | Store a role model with `admin`, `editor`, and `approver`; MVP grants the initial user `admin`. | Must | FR-001 | Only `admin` may manage sources, prompts, brand, and integrations; role checks are server-enforced. |
| FR-003 | Admin can create, edit, disable, and tier an allowlisted RSS/API source. | Must | Source feed | Disabled sources no longer ingest; invalid URLs are rejected; fetch health and last-success time are displayed. |
| FR-004 | Ingest approved RSS/API sources every 15 minutes and Google News RSS discovery every 30 minutes. | Must | Scheduler | Only unseen feed items are stored; source fetch failure does not stop other sources. |
| FR-005 | Deduplicate related feed items into a story group while preserving every source item. | Must | FR-004 | Admin can view grouped source items and their original URLs; individual evidence is never overwritten. |
| FR-006 | Assign each candidate a reliability tier, recency, category, and editorial score with a human-readable reason. | Must | FR-003–005 | Candidate list can be sorted by score; score reason identifies tier and relevant factors. |
| FR-007 | Let AI recommend 3–5 candidates from the stack; admin makes the final selection. | Must | FR-006, AI provider | Recommendation never publishes or schedules a post by itself. |
| FR-008 | Generate Thai copy in the required caption format using the active base prompt, preset, and optional story instruction. | Must | AI text provider | Generated copy includes headline, 6–7 summary lines, one significance line, source credit/link, and ≤3 hashtags. |
| FR-009 | Generate a branded generic editorial image separately from copy and allow independent regeneration. | Must | AI image provider, brand settings | Image generation does not alter copy; generated image contains no requested real logo or unlicensed news image. |
| FR-010 | Permit editing of all post content, evidence, image, and schedule; audit fact/source edits. | Must | FR-008–009 | Each fact/source modification records actor, timestamp, previous value, new value, and optional reason. |
| FR-011 | Validate a draft before approval. | Must | FR-008–010 | Approval is blocked if source name/URL, copy, image, or explicit approval is missing; violations are shown inline. |
| FR-012 | Create scheduled posts for the Bangkok slots or a manually selected breaking-news time. | Must | FR-011 | Time is stored and displayed in `Asia/Bangkok`; pre-publication schedule edits are audited. |
| FR-013 | Publish a due approved post to one configured Facebook Page and store external post metadata. | Must | Meta Graph API | Successful result stores post ID, public/management link when available, actual publish time, and raw provider status safely. |
| FR-014 | Prevent duplicate Facebook publication. | Must | FR-013 | Re-running a job for one post cannot create a second Facebook post; duplicate provider response is reconciled to the same record. |
| FR-015 | Retry transient publishing failures a limited configurable number of times, then alert the administrator in-app. | Must | FR-013 | Final failure becomes `needs_attention` with actionable error text; it is not silently retried indefinitely. |
| FR-016 | Record correction/removal actions for a published post. | Must | Meta Graph API | Admin must enter a reason; the audit log retains the action outcome and timestamp. |
| FR-017 | Version prompts and brand settings and associate the active versions with each generated post. | Must | FR-008–009 | A historical post shows exactly which prompt and brand version produced it. |
| FR-018 | Show integration health and expiring/failed Facebook credential warnings in the app. | Must | Meta, AI providers | Secrets are never rendered; disconnected/expiring state is visible on Dashboard and Integrations. |
| FR-019 | Retain publication history with status, external link, timestamps, and errors. | Must | FR-013–016 | Admin can filter by status/date and open an individual history record. |

---

## 9. Business rules and permissions

### Reliability tiers

| Tier | Definition | Eligibility rule |
|---|---|---|
| Tier 1 — Official | Governing body, league, club, association, athlete, or verified team official account in the allowlist | One source is sufficient to create and approve a draft. |
| Tier 2 — Established media | Allowlisted major sports newsroom or approved reporter | One source is sufficient to create and approve a draft. |
| Tier 3 — Discovery | Google News RSS result, non-allowlisted X item, or aggregator | Discovery only. Admin must link an eligible original source before generation/approval. |

| ID | Rule |
|---|---|
| BR-001 | Every source must be configured in the allowlist with a tier. Google News RSS is always Tier 3 discovery. |
| BR-002 | One eligible Tier 1 or Tier 2 source is enough to create a publishable candidate; all posts still require administrator approval. |
| BR-003 | Posts must not promote gambling or use sensational headlines. The base prompt and validation rules enforce this. |
| BR-004 | A Breaking News post must include a source and the source-information timestamp, and has the same approval rule as scheduled content. |
| BR-005 | Caption source credit requires the original publisher name and direct URL. |
| BR-006 | Copy and image regeneration are separate actions. Recommended initial quota: 3 text and 2 image regenerations/story; values must be configurable. |
| BR-007 | A post may enter `scheduled` only from `approved`. It may enter `publishing` only when due and still approved. |
| BR-008 | Publishing preconditions are: approval event, nonempty caption, original source URL and name, generated/selected image, configured Facebook connection, and non-expired credentials. |
| BR-009 | Each publication attempt uses a persistent idempotency key. A post with a stored successful Facebook post ID is never re-created. |
| BR-010 | Fact/source edits and published-post correction/removal requests require an audit event containing actor, time, old/new value where applicable, and reason. |

### Post status lifecycle

```text
discovered → grouped → candidate → selected → drafting → pending_approval
                                         ↘ dismissed
pending_approval → approved → scheduled → publishing → published
                    ↘ needs_revision       ↘ needs_attention
published → correction_requested → corrected | removal_requested → removed
```

### Permissions

| Action | Admin | Editor (later) | Approver (later) |
|---|---:|---:|---:|
| Manage sources/prompts/brand/integrations | Yes | No | No |
| Create/edit drafts | Yes | Yes | No |
| Approve/schedule/publish | Yes | No | Yes |
| View history and alerts | Yes | Yes | Yes |

---

## 10. Data requirements

| Entity | Key fields | Ownership/lifecycle |
|---|---|---|
| User | id, email, role, status | Auth provider is source of truth; application stores role. |
| Source | id, name, URL, type, tier, enabled, last fetch state | Admin-created; never hard-delete while referenced by posts. |
| Source Item | source ID, canonical URL, title, body/excerpt, published time, fetched time, raw reference | Created by ingestion; retained as source evidence. |
| Story Group | id, category, dedupe key, score, score explanation, status | Groups related source items; may be dismissed or selected. |
| Draft/Post | story group ID, caption, image asset, status, scheduled time, approval metadata, prompt/brand versions | Core editorial record; versions are preserved. |
| Prompt Version | type, content, status, created by/time | Immutable after activation; used for reproducibility. |
| Brand Version | page name, logo asset, colors, fonts, footer | Immutable snapshot associated with generated image. |
| Publication | post ID, Facebook ID, external URL, request idempotency key, actual time, provider response summary | Created per publishing workflow; never overwritten by retry. |
| Audit Event | actor, entity, action, old/new values, reason, timestamp | Append-only record. |
| Alert | type, severity, entity reference, status, created/resolved time | Operational notification shown in-app. |

**Data classification:** administrator email and credential references are confidential. Facebook/AI tokens and API secrets are secrets and must not appear in logs, browser payloads, or audit values. News source URLs and published captions are operational content.

**Retention:** exact data retention, backup, export, and deletion policy is an open operational decision. Until it is defined, do not implement automatic destructive deletion of source evidence, audit events, or publications.

---

## 11. Integrations and scheduled jobs

| Integration | Purpose | Trigger and behavior | Failure handling |
|---|---|---|---|
| RSS/API sources | Retrieve allowed source items | Poll approved RSS/API every 15 minutes | Record per-source error; continue other sources; show stale/failed state. |
| Google News RSS | Discover possible stories | Poll every 30 minutes; must resolve to original eligible source before posting | Mark discovery-only; do not cite Google News as source. |
| X API (future/optional) | Discover content from approved official/reporting accounts | Only after authorized API access and source configuration | No unauthorised scraping; connector failure creates alert. |
| AI text provider | Generate Thai caption and ranking reasoning | Admin-initiated generation after candidate selection | Quota/error shown; retain manual editing path. |
| AI image provider | Generate generic branded image | Admin-initiated, separate from text generation | Quota/error shown; block approval until image exists. |
| Meta Graph API | Publish/update/delete Facebook Page post | Due scheduled job or explicit approved breaking-news action | Idempotency, bounded retry, error alert, no duplicate post. |
| In-app alerts | Inform admin of operational exceptions | Credential state, final job failure, missed deadline, source health | Alerts persist until resolved/dismissed. |

Scheduler responsibilities: ingestion, candidate refresh, due-publication processing, bounded retries, and credential-expiry health checks. Schedules use `Asia/Bangkok`.

---

## 12. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-001 | All displayed/posting schedules must use `Asia/Bangkok`; UTC storage is permitted only if conversion is correct at every UI and job boundary. |
| NFR-002 | Private routes, server actions, and integration endpoints must enforce authentication and role authorization server-side. |
| NFR-003 | Secrets must be stored in managed environment/secret storage. They must be redacted from logs, errors, UI, and audit events. |
| NFR-004 | Tokens that require database persistence must be encrypted at rest and access restricted to publisher services. |
| NFR-005 | Background jobs must emit structured logs with job ID, post/source reference, outcome, retry count, and safe error summary. |
| NFR-006 | Every destructive or external-publishing action must have a visible status/result and audit event. |
| NFR-007 | The admin UI must be usable on desktop and mobile-width browsers for review, approval, and alert response. |
| NFR-008 | Essential controls must have keyboard-accessible labels, visible focus, sufficient text contrast, and text alternatives for non-decorative images. |
| NFR-009 | The product has no public content surface in MVP; SEO is not applicable. |
| NFR-010 | Exact availability, recovery-point, browser support, and backup targets are open decisions; before production launch, they must be set and tested. |

---

## 13. Analytics plan

| Event | Trigger | Key properties | Supports |
|---|---|---|---|
| `candidate_selected` | Admin selects a story | tier, category, score band, source type | Editorial throughput |
| `draft_generated` | Text/image generation succeeds | generation type, preset, attempt number | Cost and workflow efficiency |
| `post_approved` | Admin approves | slot type, tier, category, edit count | Approval quality/effort |
| `post_scheduled` | Draft enters scheduled | scheduled hour, breaking flag | On-time publishing readiness |
| `publish_succeeded` | Facebook accepts post | slot, actual time, retry count | On-time publishing |
| `publish_failed` | Final retry fails | safe error category, retry count | Reliability guardrail |
| `post_corrected_or_removed` | Correction/removal action | reason category, original tier | Factual-removal guardrail |

Facebook reach, engagement, and follower data are a Phase 2 integration. MVP stores the Facebook post link and identity required to connect those metrics later.

---

## 14. Acceptance and test scenarios

| ID | Scenario | Expected result | Related requirements |
|---|---|---|---|
| TS-001 | Unauthenticated visitor opens `/dashboard`. | Redirected to login; no data exposed. | FR-001, NFR-002 |
| TS-002 | Admin disables a source. | Next ingestion skips it; previous evidence remains visible. | FR-003 |
| TS-003 | Google News discovery result has no eligible original source. | Remains discovery-only; generation/approval blocked. | FR-004, BR-001 |
| TS-004 | Two feeds describe the same match event. | They appear as one story group with two preserved source links. | FR-005 |
| TS-005 | Admin selects a Tier 2 story with one source. | Draft creation is allowed and tier remains visible. | BR-002 |
| TS-006 | Admin attempts approval with no image or source URL. | Approval is blocked with field-specific validation errors. | FR-011, BR-008 |
| TS-007 | Admin regenerates the image. | Only image changes; copy version remains unchanged and event is logged. | FR-009, BR-006 |
| TS-008 | Scheduled job processes the same due record twice. | Facebook has one post only; both attempts resolve to one publication record. | FR-014, BR-009 |
| TS-009 | Meta returns a transient error until retry limit is exhausted. | Post enters `needs_attention`, alert appears, and no unbounded retry occurs. | FR-015 |
| TS-010 | Admin creates breaking-news draft with no source time. | Validation blocks approval/publication. | J-003, BR-004 |
| TS-011 | Admin edits a source link after a draft exists. | Old/new values, actor, time, and reason appear in audit history. | FR-010, BR-010 |
| TS-012 | Facebook token becomes invalid. | Health status is visible; scheduled posts are not attempted without valid credentials and admin sees an alert. | FR-018, NFR-003 |

---

## 15. Delivery guidance

### Suggested vertical slices

1. **Foundation:** Next.js/Supabase setup, authentication, roles, source model, secret configuration, audit framework.
2. **News inbox:** RSS ingestion, Google discovery, source health, source items, grouping, scoring, and News Stack.
3. **Editorial workflow:** prompt/brand versioning, text/image generation, Composer validation, approval, and Queue.
4. **Publishing reliability:** Meta connection, scheduled publisher, idempotency, retries, in-app alerts, and History.
5. **Production readiness:** configured allowlist and brand, credential monitoring, accessibility pass, test scenarios, and 30-day metric review.

### Main risks and mitigations

| Risk | Mitigation |
|---|---|
| Low-quality or inaccurate source content | Allowlist, tier display, direct source credit, human approval, and correction audit. |
| Meta/API permissions or token expiry blocks posting | Establish integration early; health page, expiry warning, bounded retry, and clear failure state. |
| AI hallucination or sensational copy | Locked base prompt, source-aware draft, manual approval, and validation rules. |
| Copyright/trademark risk in visuals | Generic branded AI graphics; prohibit logos and copied news imagery in MVP. |
| Duplicate publication from retries | Persistent idempotency key and immutable publication record. |
| Cost grows through regeneration | Configurable quota, generation logging, and per-post cost reporting when provider data permits. |

---

## 16. Traceability summary

| Goal | Journey | Requirements/rules | Tests | Metric |
|---|---|---|---|---|
| Publish reliable content | J-001, J-003 | FR-003–011; BR-001–006 | TS-002–007, TS-010–011 | Factual-removal guardrail |
| Publish consistently on schedule | J-002 | FR-012–015; BR-007–009 | TS-008–009, TS-012 | On-time publishing |
| Reduce admin work | J-001 | FR-006–010, FR-017 | TS-004–007 | Draft readiness, admin effort |
| Grow followers | All publishing journeys | FR-013, FR-019 | TS-008 | Follower growth (Phase 2 collection) |

---

## 17. Readiness verdict

**Status: Ready with assumptions.**

The product objective, MVP boundary, user workflow, source policy, approval policy, core data, operational failure behavior, and success measures are sufficiently defined to begin foundation and inbox development.

### Blocking decisions before production publishing

1. Choose and configure the Facebook developer application, Page permissions, and production token lifecycle.
2. Approve the initial source allowlist and assign each source a Tier 1 or Tier 2 classification.
3. Choose AI text/image providers, monetary budget, and final quota values.
4. Provide page brand assets and production secret/hosting configuration.
5. Confirm backup, retention, and production operational targets.

### Recommended next action

Approve this PRD as the source of truth, then create the technical implementation plan and data schema for delivery slices 1–4.
