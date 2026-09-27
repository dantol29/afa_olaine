import assert from "node:assert/strict";
import { load } from "cheerio";
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

console.log("admin login keeps authentication controls in the club-branded shell");
