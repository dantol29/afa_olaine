import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { firstSearchParam, withSearchParam } from "@/lib/url-state";

describe("firstSearchParam", () => {
  test("returns a single value as is", () => {
    assert.equal(firstSearchParam("treneri"), "treneri");
  });

  test("takes the first value of a repeated param", () => {
    assert.equal(firstSearchParam(["treneri", "speletaji"]), "treneri");
  });

  test("returns undefined when the param is missing or the array is empty", () => {
    assert.equal(firstSearchParam(undefined), undefined);
    assert.equal(firstSearchParam([]), undefined);
  });
});

describe("withSearchParam", () => {
  test("adds a param to a plain path", () => {
    assert.equal(withSearchParam("/komanda", "skats", "treneri"), "/komanda?skats=treneri");
  });

  test("replaces an existing value and keeps other params and the hash", () => {
    assert.equal(withSearchParam("/x?a=1&skats=old#top", "skats", "new"), "/x?a=1&skats=new#top");
  });

  test("removes the param when the value is null, leaving no dangling question mark", () => {
    assert.equal(withSearchParam("/komanda?skats=treneri", "skats", null), "/komanda");
    assert.equal(withSearchParam("/x?a=1&skats=treneri", "skats", null), "/x?a=1");
  });

  test("encodes special characters in the value", () => {
    assert.equal(withSearchParam("/x", "q", "a b&c"), "/x?q=a+b%26c");
  });
});
