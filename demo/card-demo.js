/**
 * card-demo.js
 * Reads the first <script type="application/ld+json"> in the page,
 * parses it as a Schema.org Article, and builds a URL card inside #card.
 * When atproto fields are present the card gets an extra identity line
 * and the .card--atproto modifier class.
 */

(function () {
  "use strict";

  // ── 1. Parse JSON-LD ──────────────────────────────────────────────
  const scriptEl = document.querySelector('script[type="application/ld+json"]');
  if (!scriptEl) return;

  let data;
  try {
    data = JSON.parse(scriptEl.textContent);
  } catch (e) {
    console.warn("card-demo.js: Could not parse JSON-LD.", e);
    return;
  }

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
  const headline    = data.headline    || "";
  const description = data.description || "";
  const images      = Array.isArray(data.image) ? data.image : (data.image ? [data.image] : []);
  const author      = data.author      || {};
  const authorName  = author.name      || "";

  const did    = author["atproto:did"]    || "";
  const handle = author["atproto:handle"] || "";
  const feed   = data["atproto:feed"]     || "";

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
    authorEl.textContent = "By " + authorName;
    body.appendChild(authorEl);
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
      const feedLink = document.createElement("a");
      feedLink.className = "card__atproto-feed";
      feedLink.href = feed;
      feedLink.textContent = "View series →";
      meta.appendChild(feedLink);
    }

    body.appendChild(meta);
  }

  article.appendChild(body);
  card.appendChild(article);
})();
