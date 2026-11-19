import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { fitWithinMaxSide, MAX_IMAGE_SIDE } from "@/lib/client-image-resize";

// The canvas and DataTransfer part of the module needs a browser and is not covered here.
describe("fitWithinMaxSide", () => {
  test("keeps an image whose longest side is within the limit unchanged", () => {
    assert.deepEqual(fitWithinMaxSide(1200, 800, MAX_IMAGE_SIDE), { width: 1200, height: 800 });
    assert.deepEqual(fitWithinMaxSide(MAX_IMAGE_SIDE, 1000, MAX_IMAGE_SIDE), { width: MAX_IMAGE_SIDE, height: 1000 });
  });

  test("never scales a small image up", () => {
    assert.deepEqual(fitWithinMaxSide(10, 20, MAX_IMAGE_SIDE), { width: 10, height: 20 });
  });

  test("scales a landscape image so its width becomes the limit", () => {
    assert.deepEqual(fitWithinMaxSide(6000, 4000, MAX_IMAGE_SIDE), { width: 2280, height: 1520 });
  });

  test("scales a portrait image so its height becomes the limit", () => {
    assert.deepEqual(fitWithinMaxSide(3024, 4032, MAX_IMAGE_SIDE), { width: 1710, height: 2280 });
  });

  test("scales a square image to the limit on both sides", () => {
    assert.deepEqual(fitWithinMaxSide(5000, 5000, MAX_IMAGE_SIDE), { width: 2280, height: 2280 });
  });

  test("keeps at least one pixel on the short side of a very narrow image", () => {
    assert.deepEqual(fitWithinMaxSide(10000, 1, MAX_IMAGE_SIDE), { width: 2280, height: 1 });
  });
});
