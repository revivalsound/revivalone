import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the Revival One first experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Revival One/);
  assert.match(html, /One movement/);
  assert.match(html, /Revival Cells/);
  assert.match(html, /Rev Academy/);
  assert.match(html, /href="\/home"/);
  assert.match(html, /href="\/community"/);
  assert.match(html, /href="\/events"/);
  assert.match(html, /href="\/academy"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("renders Supabase account routes", async () => {
  for (const [path, expected] of [["/sign-in", /Enter Revival One/], ["/sign-up", /Join the movement/]]) {
    const response = await render(path);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, expected);
    assert.match(html, /aria-label="Show password"/);
    if (path === "/sign-in") assert.doesNotMatch(html, /SECURE SIGN-IN|PRIVATE BY DEFAULT|SUPABASE AUTH/);
  }
});

test("renders each premium application route", async () => {
  const routes = [
    ["/home", /Good evening/],
    ["/community", /We carry the flame/],
    ["/events", /Step into/],
    ["/academy", /Formed in truth/],
  ];

  for (const [path, expected] of routes) {
    const response = await render(path);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, expected);
    assert.match(html, /Create/);
  }
});

test("renders the profile and Word details experiences", async () => {
  const profile = await render("/profile");
  assert.equal(profile.status, 200);
  assert.match(await profile.text(), /Preparing your profile/);

  const word = await render("/word/isaiah-40-31");
  assert.equal(word.status, 200);
  const wordHtml = await word.text();
  assert.match(wordHtml, /Strength for/);
  assert.match(wordHtml, /NIV|NKJV/);
  assert.match(wordHtml, /Waiting is not/);
});

test("protects profile data and exposes licensed Bible configuration status", async () => {
  const profileApi = await render("/api/profile");
  assert.equal(profileApi.status, 401);

  const bibleApi = await render("/api/bible/passage?version=NIV");
  assert.equal(bibleApi.status, 503);
  assert.equal((await bibleApi.json()).configured, false);
});
