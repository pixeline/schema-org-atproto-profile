# Article Profile — Specification

Version: 0.1 (draft)

---

## Overview

This document defines the **atproto-flavoured Article profile**: a minimal, additive extension of the Schema.org `Article` type that enables websites and applications, including atproto clients (e.g. Bluesky) to render richer URL cards while remaining fully valid and backward-compatible Schema.org JSON-LD.

### Goals

- Provide a single, copy-pasteable JSON-LD template publishers can drop into existing CMS templates.
- Carry enough atproto identity data (DID, handle) for a client to display identity context or offer a "Follow" button.
- Optionally point to a feed or series so clients can show a "More from this series" link.

---

## `@context`

```json
"@context": ["https://schema.org", { "atproto": "https://atproto.com/ns#" }]
```

The second context entry introduces the `atproto:` prefix. Clients that do not understand this prefix safely ignore all `atproto:*` keys.

---

## Fields

### Standard Schema.org fields

All standard fields are used exactly as Schema.org defines them. The following subset is required or recommended by this profile.

| Field | Type | Required | Description |
|---|---|---|---|
| `@type` | string | **Required** | Must be `"Article"`. |
| `headline` | string | **Required** | The article title, ≤ 110 characters recommended. |
| `description` | string | Recommended | A short summary (1–3 sentences). |
| `datePublished` | string | Recommended | ISO 8601 date (e.g. `"2025-06-01"`). |
| `image` | array of strings | Recommended | One or more absolute image URLs. The first element is used as the card thumbnail. |
| `author` | object | Recommended | A `Person` object (see below). |
| `author.@type` | string | Recommended | Should be `"Person"`. |
| `author.name` | string | Recommended | The author's display name. |
| `author.url` | string | Optional | URL of the author's profile or homepage. |
| `author.image` | string | Optional | Absolute URL for the author's avatar/profile image. Prefer this for straightforward client rendering. |

### atproto-specific fields

These fields are defined under the `atproto:` namespace. They are **optional** — their absence does not make the document invalid.

| Field | Location | Type | Description |
|---|---|---|---|
| `atproto:did` | `author` object | string | The author's atproto DID, e.g. `"did:plc:abc123xyz456"`. Clients can use this as a stable identity anchor for follow actions and resolver adapters. |
| `atproto:handle` | `author` object | string | The author's atproto handle, e.g. `"alice.bsky.social"`. Used for display and deep-linking. |
| `atproto:feed` | root object | string | Feed/series link. Must be either an `at://` URI (e.g. `"at://did:plc:…/app.bsky.feed.generator/my-series"`) or an absolute `http(s)://` URL. Clients may show a "More from this series" link. |

---

## Example

```json
{
  "@context": ["https://schema.org", { "atproto": "https://atproto.com/ns#" }],
  "@type": "Article",
  "headline": "How atproto handles identity",
  "description": "A deep dive into DIDs, handles, and the AT Protocol identity layer.",
  "datePublished": "2025-06-01",
  "image": [
    "https://example.com/images/atproto-identity.jpg"
  ],
  "author": {
    "@type": "Person",
    "name": "Alice Dubois",
    "url": "https://example.com/authors/alice",
    "image": "https://example.com/images/alice.jpg",
    "atproto:did": "did:plc:abc123xyz456",
    "atproto:handle": "alice.bsky.social"
  },
  "atproto:feed": "at://did:plc:abc123xyz456/app.bsky.feed.generator/atproto-news"
}
```

---

## Notes for publishers

1. **Embed in `<head>`** inside a `<script type="application/ld+json">` tag.
2. **Omit atproto fields** entirely if you do not have an atproto identity — the document remains valid Schema.org JSON-LD.
3. **Keep `image` as an array**, even if there is only one image, for forward compatibility.
4. **Use absolute URLs** for `image` and `author.url`.
5. **Prefer `author.image` when available** — it is the simplest cross-client way to provide an avatar without requiring resolver-specific logic.

## Notes for clients

1. **Detect atproto namespace** by checking whether any value in the `@context` array is an object containing a key whose value starts with `"https://atproto.com/ns"`.
2. **Gracefully handle missing fields** — treat any atproto field as optional and never fail card rendering if they are absent.
3. **Do not rely on field ordering** inside the JSON object.
4. **Shorten DIDs for display** — DIDs can be long; show only the first 12–20 characters when space is limited.
5. **Prefer standard avatar fields first** — use `author.image` when present.
6. **Use resolver adapters as a client-layer fallback** — when `author.image` is absent, clients may resolve avatars through implementation-specific adapters (for example, a Bluesky-compatible profile lookup), with caching and graceful failure.
7. **Accept both feed URI forms** — treat `atproto:feed` as valid when it is either `at://` or absolute `http(s)://`.
