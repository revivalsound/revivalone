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
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
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
