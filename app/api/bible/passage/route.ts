import { NextResponse } from "next/server";

const versions = {
  NIV: { id: 111, name: "New International Version", link: "https://www.bible.com/bible/111/ISA.40.31.NIV" },
  NKJV: { id: 114, name: "New King James Version", link: "https://www.bible.com/bible/114/ISA.40.31.NKJV" },
  NLT: { id: 116, name: "New Living Translation", link: "https://www.bible.com/bible/116/ISA.40.31.NLT" },
  AMP: { id: 1588, name: "Amplified Bible", link: "https://www.bible.com/bible/1588/ISA.40.31.AMP" },
} as const;

function plainText(value: string) {
  return value.replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = (url.searchParams.get("version") ?? "NIV").toUpperCase() as keyof typeof versions;
  const version = versions[code];
  if (!version) return NextResponse.json({ error: "Unsupported Bible version." }, { status: 400 });

  const appKey = process.env.YVP_APP_KEY;
  if (!appKey) {
    return NextResponse.json({ configured: false, version: code, name: version.name, externalUrl: version.link }, { status: 503 });
  }

  const headers = { "X-YVP-App-Key": appKey };
  const [passageResponse, bibleResponse] = await Promise.all([
    fetch(`https://api.youversion.com/v1/bibles/${version.id}/passages/ISA.40.31`, { headers, next: { revalidate: 86400 } }),
    fetch(`https://api.youversion.com/v1/bibles/${version.id}`, { headers, next: { revalidate: 86400 } }),
  ]);

  if (!passageResponse.ok) return NextResponse.json({ error: "This translation is not yet licensed for the connected YouVersion app.", externalUrl: version.link }, { status: passageResponse.status });

  const passageJson = await passageResponse.json();
  const bibleJson = bibleResponse.ok ? await bibleResponse.json() : {};
  const passage = passageJson.data ?? passageJson;
  const bible = bibleJson.data ?? bibleJson;

  return NextResponse.json({
    configured: true,
    version: code,
    name: version.name,
    reference: passage.reference ?? "Isaiah 40:31",
    content: plainText(passage.content ?? ""),
    copyright: bible.copyright ?? "",
    publisherUrl: bible.publisher_url ?? version.link,
    externalUrl: version.link,
  }, { headers: { "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
}
