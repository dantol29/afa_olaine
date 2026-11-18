import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

// Next 16 refuses revalidatePath/revalidateTag/updateTag while a page renders ("used revalidatePath during render
// which is unsupported", HTTP 500). They belong in Server Actions ("use server" files) and Route Handlers (route.ts).
const SOURCE_ROOT = path.join(process.cwd(), "src");
const REVALIDATION_CALL = /\b(revalidatePath|revalidateTag|updateTag)\s*\(/;

test("cache revalidation is only called from Server Actions and Route Handlers", () => {
  const files = readdirSync(SOURCE_ROOT, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts"))
    .map((entry) => path.join(entry.parentPath, entry.name));

  const offenders = files.filter((file) => {
    const source = readFileSync(file, "utf8");
    if (!REVALIDATION_CALL.test(source)) return false;
    return path.basename(file) !== "route.ts" && !/^\s*["']use server["']/.test(source);
  });

  assert.deepEqual(offenders.map((file) => path.relative(SOURCE_ROOT, file)), []);
  assert.ok(files.length > 50, "the scan found the source files");
});
