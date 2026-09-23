# Sports News Admin

This context manages the editorial lifecycle that converts eligible sports-news evidence into administrator-approved Facebook Page posts. It distinguishes source evidence from AI-generated editorial content and from external publication results.

## Language

**Source**:
An allowlisted publisher or discovery feed from which news items are retrieved. A Source has a reliability tier and may be enabled or disabled.
_Avoid_: Website, provider

**Source Item**:
One retrieved item from a Source, retaining its original URL, title, excerpt, and timestamps as evidence.
_Avoid_: Article, feed row

**Discovery Item**:
A Tier 3 Source Item that may help find a story but cannot be credited or approved until linked to eligible original evidence.
_Avoid_: Publishable source

**Story**:
A canonical editorial subject that groups one or more Source Items about the same sports event or development.
_Avoid_: News item, post

**Evidence**:
A Source Item linked to a Story. It preserves the source’s claim and reliability context rather than replacing it with a summary.
_Avoid_: Citation, reference

**Candidate**:
A Story that the system has scored and presented for the administrator to select or dismiss.
_Avoid_: Approved story, draft

**Editorial Post**:
The internal, versioned caption-and-image record for one selected Story. It can be drafted, approved, scheduled, or published.
_Avoid_: Facebook post, article

**Publication**:
The confirmed external Facebook Page post created from an Editorial Post.
_Avoid_: Editorial Post, publish request

**Approval**:
The explicit, recorded editorial decision that permits an Editorial Post to be scheduled or immediately published.
_Avoid_: Selection, generation

**Source Tier**:
The trust classification assigned to a Source: Tier 1 Official, Tier 2 Established Media, or Tier 3 Discovery.
_Avoid_: Score, verification status

**Prompt Version**:
An immutable snapshot of the base instruction or preset used to generate editorial content.
_Avoid_: Prompt setting

**Brand Version**:
An immutable snapshot of visual and caption-identity settings used for a generated image or Editorial Post.
_Avoid_: Theme setting
