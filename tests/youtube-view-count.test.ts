import assert from "node:assert/strict";
import { formatYouTubeViews, parseYouTubeViewCounts } from "../src/lib/youtube-view-count";

assert.equal(formatYouTubeViews(459), "459 skatījumi");
assert.equal(formatYouTubeViews(1), "1 skatījums");
assert.equal(formatYouTubeViews(1234), "1234 skatījumi");

assert.deepEqual(parseYouTubeViewCounts({ items: [
  { id: "first", statistics: { viewCount: "459" } },
  { id: "second", statistics: { viewCount: "bad" } },
  { id: "third" },
] }), { first: 459 });

console.log("YouTube view counts are formatted and parsed correctly");
