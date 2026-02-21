# schema-org-atproto-profile

A minimal, additive Schema.org profile that adds atproto-flavoured metadata to web pages so atproto clients (Bluesky, etc.) can render richer URL cards.

---

## Why

Open Graph (OG) is widely used but effectively unmaintained. Schema.org JSON-LD is actively maintained, well-documented, and already embedded in millions of pages by CMSes and publishers today.

This repository proposes a tiny **atproto-flavoured Article profile** that:

- **Publishers already emit** Schema.org JSON-LD — adding a handful of `atproto:*` fields is a one-line CMS change.
- **Adds atproto identity + feed linkage** via a small custom namespace (`atproto:`), without touching any standard Schema.org fields.
- **Stays fully backward-compatible** — non-atproto consumers simply see a normal `Article` object and ignore the extra fields.

---

## Design

The profile uses a dual `@context`:

```json
"@context": ["https://schema.org", { "atproto": "https://atproto.com/ns#" }]
```

### Full JSON-LD example

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

### atproto-specific fields

| Field | Location | Type | Description |
|---|---|---|---|
| `atproto:did` | `author` | string | The author's atproto DID (e.g. `did:plc:…`) |
| `atproto:handle` | `author` | string | The author's atproto handle (e.g. `alice.bsky.social`) |
| `atproto:feed` | root | string | Optional AT URI of a feed/series (e.g. an `app.bsky.feed.generator` URI) |

---

## How clients use this

1. **Detect the atproto namespace** in `@context` — look for an object containing a key whose value starts with `https://atproto.com/ns`.
2. **Resolve author identity** — use `atproto:did` or `atproto:handle` to fetch the author's avatar, follower count, or offer a "Follow" button.
3. **Link to a feed/series** — use `atproto:feed` to add a "More from this series" action in the URL card.

Non-atproto clients that do not recognise these fields will simply skip them.

---

## Demo

Open `demo/index.html` directly in a browser (no server needed):

```
open demo/index.html
```

The page contains:
- A fake blog article with a concrete JSON-LD block using this profile.
- A rendered URL card built by `demo/card-demo.js` from the JSON-LD on the page.
- An **atproto badge** and extra identity line when atproto fields are present.

---

## Repository structure

```
README.md          – This file
PLAYGROUND.md      – Example URLs and list of supporting clients
spec/
  article.md       – Human-readable spec: fields, required/optional, client behaviour
schema/
  article.jsonld   – Copy-pasteable JSON-LD template (empty values)
demo/
  index.html       – Fake blog post with embedded JSON-LD
  styles.css       – Card layout styles
  card-demo.js     – Reads JSON-LD, builds card, adds atproto UI bits
```

---

## Status

Early draft — feedback welcome via issues or the [atproto community discourse thread](https://discourse.atprotocol.community/t/ideas-on-extending-open-graph-embed-displays-for-atproto/631/9).
