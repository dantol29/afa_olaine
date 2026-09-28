import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { load } from "cheerio";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AdminLoginView } from "../src/components/admin/admin-login-view";

const $ = load(renderToStaticMarkup(<AdminLoginView formAction={() => undefined} pending={false} />));
assert.equal($('main[aria-labelledby="admin-login-title"]').length, 1, "login uses a branded admin shell");
assert.match($('#admin-login-title').text(), /Administrācija/i, "login has a clear admin title");
assert.equal($('img[alt="AFA Olaine"]').length, 1, "login uses the public club identity");
assert.equal($('input[name="password"][type="password"]').length, 1, "the password field remains available");
assert.equal($('button[type="submit"]').length, 1, "the login action remains available");
assert.equal($('[data-admin-login-panel] form').length, 1, "the sign-in form is integrated into the page hero panel");
assert.match($('img[data-admin-login-hero]').attr('src') ?? '', /match-stadium/, "login uses the club stadium photograph");

async function checkSidebar() {
  const require = createRequire(import.meta.url);
  require.cache[require.resolve("server-only")] = { id: require.resolve("server-only"), filename: require.resolve("server-only"), loaded: true, exports: {} } as NodeJS.Module;
  const { AdminSidebar } = await import("../src/components/admin/admin-sidebar");
  const sidebar = load(renderToStaticMarkup(createElement(PathnameContext.Provider, { value: "/admin/teams" }, createElement(AdminSidebar))));
  assert.equal(sidebar('nav[aria-label="Administrācijas navigācija"] a[href="/admin/aptaujas"]').length, 0, "poll management is absent from the admin navigation");
  assert.equal(sidebar('nav[aria-label="Administrācijas navigācija"] a[href="/admin/teams"]').length, 1, "team management remains in the admin navigation");
  console.log("admin keeps the branded login and navigation without poll management");
}

void checkSidebar();
