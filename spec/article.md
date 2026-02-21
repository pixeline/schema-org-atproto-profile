# Article Profile — Specification

Version: 0.1 (draft)

---

## Overview

This document defines the **atproto-flavoured Article profile**: a minimal, additive extension of the Schema.org `Article` type that enables atproto clients (e.g. Bluesky) to render richer URL cards while remaining fully valid and backward-compatible Schema.org JSON-LD.

### Goals

- Provide a single, copy-pasteable JSON-LD template publishers can drop into existing CMS templates.
- Carry enough atproto identity data (DID, handle) for a client to display an author avatar or offer a "Follow" button.
- Optionally point to a feed or series so clients can show a "More from this series" link.

### Non-goals

- This profile does **not** replace Open Graph tags; publishers may keep both.
- This profile does **not** define a Lexicon or any atproto record type — it is purely a convention for structured data embedded in HTML pages.
- This profile does **not** cover `VideoObject`, `AudioObject`, or other Schema.org types in this version.

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

### atproto-specific fields

These fields are defined under the `atproto:` namespace. They are **optional** — their absence does not make the document invalid.

| Field | Location | Type | Description |
|---|---|---|---|
| `atproto:did` | `author` object | string | The author's atproto DID, e.g. `"did:plc:abc123xyz456"`. Clients can use this to fetch the author's avatar or offer a Follow action. |
| `atproto:handle` | `author` object | string | The author's atproto handle, e.g. `"alice.bsky.social"`. Used for display and deep-linking. |
| `atproto:feed` | root object | string | AT URI of a feed/series, e.g. `"at://did:plc:…/app.bsky.feed.generator/my-series"`. Clients may show a "More from this series" link. |

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

## Notes for clients

1. **Detect atproto namespace** by checking whether any value in the `@context` array is an object containing a key whose value starts with `"https://atproto.com/ns"`.
2. **Gracefully handle missing fields** — treat any atproto field as optional and never fail card rendering if they are absent.
3. **Do not rely on field ordering** inside the JSON object.
4. **Shorten DIDs for display** — DIDs can be long; show only the first 12–20 characters when space is limited.
