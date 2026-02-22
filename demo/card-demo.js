/**
 * card-demo.js
 * Reads all <script type="application/ld+json"> blocks in the page,
 * resolves a Schema.org Article (+ linked author entity), and builds
 * a URL card inside #card.
 * Avatar strategy: use author.image first; if missing, try resolver
 * adapters (currently a Bluesky-compatible profile lookup) with cache.
 * When atproto fields are present the card gets an extra identity line
 * and the .card--atproto modifier class.
 */

(function () {
  "use strict";

  // ── 1. Parse JSON-LD ──────────────────────────────────────────────
  const scriptEls = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  if (scriptEls.length === 0) return;

  function toTypeList(value) {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }

  function hasType(entity, typeName) {
    return toTypeList(entity && entity["@type"]).includes(typeName);
  }

  function normalizeHandle(value) {
    if (typeof value !== "string") return "";
    return value.trim().replace(/^@/, "").toLowerCase();
  }

  function normalizeDid(value) {
    return typeof value === "string" && value.startsWith("did:") ? value : "";
  }

  function resolveFeedHref(feedValue) {
    if (typeof feedValue !== "string") return "";
    const value = feedValue.trim();
    if (!value) return "";

    if (value.startsWith("https://") || value.startsWith("http://")) {
      return value;
    }

    if (value.startsWith("at://")) {
      return value;
    }

    return "";
  }

  const avatarLookupCache = new Map();

  function getAvatarCacheKey(identity) {
    const handle = normalizeHandle(identity.handle || "");
    const did = normalizeDid(identity.did || "");
    if (!handle && !did) return "";
    return handle + "|" + did;
  }

  async function resolveAvatarViaBskyAppView(identity) {
    const handle = normalizeHandle(identity.handle || "");
    const did = normalizeDid(identity.did || "");
    const actor = handle || did;
    if (!actor) return "";

    const endpoint =
      "https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=" +
      encodeURIComponent(actor);

    try {
      const response = await fetch(endpoint);
      if (!response.ok) return "";

      const profile = await response.json();
      return typeof profile.avatar === "string" ? profile.avatar : "";
    } catch (_) {
      return "";
    }
  }

  async function resolveAvatarViaAdapters(identity) {
    const cacheKey = getAvatarCacheKey(identity);
    if (!cacheKey) return "";

    if (avatarLookupCache.has(cacheKey)) {
      return avatarLookupCache.get(cacheKey);
    }

    const lookupPromise = (async () => {
      const adapters = [
        // Current pragmatic fallback adapter; replace or extend over time.
        resolveAvatarViaBskyAppView
      ];

      for (const adapter of adapters) {
        try {
          const avatarUrl = await adapter(identity);
          if (avatarUrl) return avatarUrl;
        } catch (_) {
          // Ignore adapter failures and try the next one.
        }
      }

      return "";
    })();

    avatarLookupCache.set(cacheKey, lookupPromise);
    return lookupPromise;
  }

  const docs = [];
  for (const scriptEl of scriptEls) {
    try {
      const parsed = JSON.parse(scriptEl.textContent);
      docs.push(parsed);
    } catch (e) {
      console.warn("card-demo.js: Could not parse one JSON-LD block.", e);
    }
  }

  if (docs.length === 0) return;

  const data = docs.find((doc) => hasType(doc, "Article"));
  if (!data) return;

  // ── 2. Detect atproto namespace ───────────────────────────────────
  function hasAtprotoContext(ctx) {
    if (!Array.isArray(ctx)) return false;
    return ctx.some(
      (entry) =>
        entry !== null &&
        typeof entry === "object" &&
        Object.values(entry).some(
          (v) => typeof v === "string" && v.startsWith("https://atproto.com/ns")
        )
    );
  }

  const isAtproto = hasAtprotoContext(data["@context"]);

  // ── 3. Extract fields ─────────────────────────────────────────────
  const headline = data.headline || "";
  const description = data.description || "";
  const images = Array.isArray(data.image) ? data.image : (data.image ? [data.image] : []);
  const author = data.author || {};
  const authorName = author.name || "";
  const authorId = author["@id"] || "";

  const did = author["atproto:did"] || "";
  const handle = author["atproto:handle"] || "";
  const feed = data["atproto:feed"] || "";

  const linkedPerson = docs.find((doc) => {
    if (!hasType(doc, "Person")) return false;
    if (authorId && doc["@id"] === authorId) return true;
    return (
      (did && doc["atproto:did"] === did) ||
      (handle && doc["atproto:handle"] === handle)
    );
  }) || null;

  const personImage = linkedPerson && linkedPerson.image;
  const authorImageSource = author.image || personImage || "";
  const authorImage = Array.isArray(authorImageSource) ? authorImageSource[0] : authorImageSource;

  const atprotoPresent = isAtproto && (did || handle || feed);

  // ── 4. Build card DOM ─────────────────────────────────────────────
  const card = document.getElementById("card");
  if (!card) return;

  const article = document.createElement("article");
  article.className = "card" + (atprotoPresent ? " card--atproto" : "");

  // Image
  if (images.length > 0) {
    const img = document.createElement("img");
    img.className = "card__image";
    img.src = images[0];
    img.alt = headline;
    article.appendChild(img);
  }

  // Body
  const body = document.createElement("div");
  body.className = "card__body";

  // Title
  const titleEl = document.createElement("div");
  titleEl.className = "card__title";
  titleEl.textContent = headline;
  body.appendChild(titleEl);

  // Description
  if (description) {
    const descEl = document.createElement("p");
    descEl.className = "card__description";
    descEl.textContent = description;
    body.appendChild(descEl);
  }

  // Author
  if (authorName) {
    const authorEl = document.createElement("div");
    authorEl.className = "card__author";

    let authorAvatar = null;
    if (authorImage && typeof authorImage === "string") {
      authorAvatar = document.createElement("img");
      authorAvatar.className = "card__author-avatar";
      authorAvatar.src = authorImage;
      authorAvatar.alt = authorName;
      authorEl.appendChild(authorAvatar);
    }

    const authorNameEl = document.createElement("span");
    authorNameEl.className = "card__author-name";
    authorNameEl.textContent = "By " + authorName;
    authorEl.appendChild(authorNameEl);

    body.appendChild(authorEl);

    if (!authorAvatar) {
      resolveAvatarViaAdapters({ did, handle }).then((avatarUrl) => {
        if (!avatarUrl) return;

        const fetchedAvatar = document.createElement("img");
        fetchedAvatar.className = "card__author-avatar";
        fetchedAvatar.src = avatarUrl;
        fetchedAvatar.alt = authorName;
        authorEl.insertBefore(fetchedAvatar, authorNameEl);
      });
    }
  }

  // atproto meta line
  if (atprotoPresent) {
    const meta = document.createElement("div");
    meta.className = "card__atproto-meta";

    const badge = document.createElement("span");
    badge.className = "card__atproto-badge";
    badge.textContent = "atproto";
    meta.appendChild(badge);

    if (handle) {
      const handleEl = document.createElement("span");
      handleEl.className = "card__atproto-handle";
      handleEl.textContent = "@" + handle;
      meta.appendChild(handleEl);
    }

    if (did) {
      const didEl = document.createElement("span");
      didEl.className = "card__atproto-did";
      didEl.textContent = did.slice(0, 20) + (did.length > 20 ? "…" : "");
      meta.appendChild(didEl);
    }

    if (feed) {
      const resolvedFeedHref = resolveFeedHref(feed);
      if (resolvedFeedHref) {
        const feedLink = document.createElement("a");
        feedLink.className = "card__atproto-feed";
        feedLink.href = resolvedFeedHref;
        feedLink.target = "_blank";
        feedLink.rel = "noopener noreferrer";
        feedLink.title = feed;
        feedLink.textContent = "View series →";
        meta.appendChild(feedLink);
      }
    }

    body.appendChild(meta);
  }

  article.appendChild(body);
  card.appendChild(article);
})();
