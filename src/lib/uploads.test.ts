import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";

import { GET } from "@/app/uploads/[...path]/route";
import { deleteUploadedPhoto, saveUploadedPhoto, UPLOADS_ROOT } from "@/lib/uploads";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** UPLOADS_ROOT is fixed when the module loads, so each UPLOADS_DIR value needs its own process. */
function uploadsRootFor(uploadsDir: string | undefined): string {
  const env = { ...process.env };
  if (uploadsDir === undefined) delete env.UPLOADS_DIR;
  else env.UPLOADS_DIR = uploadsDir;
  return execFileSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", 'const { UPLOADS_ROOT } = await import("./src/lib/uploads.ts"); process.stdout.write(UPLOADS_ROOT);'],
    { env, encoding: "utf8" },
  );
}

function image(type: string, size = 16) {
  return new File([new Uint8Array(size)], "ignored-name.png", { type });
}

function serve(...segments: string[]) {
  return GET(new Request("http://localhost:3000/uploads"), { params: Promise.resolve({ path: segments }) });
}

describe("UPLOADS_ROOT", () => {
  test("keeps an absolute UPLOADS_DIR as it is", () => {
    assert.equal(UPLOADS_ROOT, process.env.UPLOADS_DIR);
    const absolute = path.join(UPLOADS_ROOT, "elsewhere");
    assert.equal(uploadsRootFor(absolute), absolute);
  });

  test("resolves a relative UPLOADS_DIR, or the default, against the app folder", () => {
    assert.equal(uploadsRootFor("public/uploads"), path.join(process.cwd(), "public/uploads"));
    assert.equal(uploadsRootFor(undefined), path.join(process.cwd(), "uploads"));
  });
});

describe("saveUploadedPhoto", () => {
  test("writes JPEG, PNG and WebP under a fresh name with the extension of its type", async () => {
    for (const [type, extension] of [["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"]]) {
      const url = await saveUploadedPhoto(image(type), "players");
      assert.match(url, new RegExp(`^/uploads/players/[0-9a-f-]{36}\\${extension}$`));
      assert.ok(existsSync(path.join(UPLOADS_ROOT, url.slice("/uploads/".length))));
    }
    assert.ok(!readdirSync(path.join(UPLOADS_ROOT, "players")).includes("ignored-name.png"));
  });

  test("rejects other types and files over 5 MB", async () => {
    for (const type of ["image/gif", "image/svg+xml", "text/html", ""]) {
      await assert.rejects(saveUploadedPhoto(image(type), "players"), /JPEG, PNG vai WebP/, type);
    }
    await assert.rejects(saveUploadedPhoto(image("image/png", MAX_FILE_SIZE + 1), "players"), /5 MB/);
    await saveUploadedPhoto(image("image/png", MAX_FILE_SIZE), "players");
  });
});

describe("deleteUploadedPhoto", () => {
  test("deletes an uploaded file and ignores one that is already gone", async () => {
    const url = await saveUploadedPhoto(image("image/png"), "coaches");
    await deleteUploadedPhoto(url);
    assert.ok(!existsSync(path.join(UPLOADS_ROOT, url.slice("/uploads/".length))));
    await deleteUploadedPhoto(url);
  });

  test("never deletes anything outside the uploads folder", async () => {
    const outsideDir = path.dirname(UPLOADS_ROOT);
    const outsideFile = path.join(outsideDir, "app.db");
    writeFileSync(outsideFile, "data");
    const fromRoot = path.relative(UPLOADS_ROOT, outsideFile);

    for (const url of [null, "", "/coach-portrait.png", `/${fromRoot}`, `/uploads/${fromRoot}`, `/uploads/players/../../${fromRoot}`, "https://cdn.example.lv/x.png"]) {
      await deleteUploadedPhoto(url);
      assert.ok(existsSync(outsideFile), String(url));
    }
  });
});

describe("uploads route", () => {
  test("serves a saved image with its type and a long cache lifetime", async () => {
    const url = await saveUploadedPhoto(image("image/webp", 32), "partners");
    const response = await serve(...url.slice("/uploads/".length).split("/"));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/webp");
    assert.equal(response.headers.get("content-length"), "32");
    assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable");
  });

  test("matches the extension case-insensitively", async () => {
    mkdirSync(path.join(UPLOADS_ROOT, "clubs"), { recursive: true });
    writeFileSync(path.join(UPLOADS_ROOT, "clubs", "LOGO.JPG"), "x");
    assert.equal((await serve("clubs", "LOGO.JPG")).headers.get("content-type"), "image/jpeg");
  });

  test("returns 404 for unsupported extensions even if the file exists", async () => {
    for (const name of ["notes.txt", "page.html", "icon.svg", "anim.gif", "noextension"]) {
      writeFileSync(path.join(UPLOADS_ROOT, name), "x");
      assert.equal((await serve(name)).status, 404, name);
    }
  });

  test("returns 404 for path traversal, folders and missing files", async () => {
    writeFileSync(path.join(path.dirname(UPLOADS_ROOT), "afa-test-secret.png"), "x");
    for (const segments of [[], [".."], ["..", "afa-test-secret.png"], ["clubs", "..", "..", "afa-test-secret.png"], ["clubs/../../afa-test-secret.png"], ["%2e%2e", "afa-test-secret.png"], ["..%2fafa-test-secret.png"], ["clubs.png"], ["missing.png"]]) {
      assert.equal((await serve(...segments)).status, 404, segments.join(" | "));
    }
  });
});
