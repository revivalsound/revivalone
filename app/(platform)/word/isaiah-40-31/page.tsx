"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const versions = [
  { code: "NIV", name: "New International Version", link: "https://www.bible.com/bible/111/ISA.40.NIV" },
  { code: "NKJV", name: "New King James Version", link: "https://www.bible.com/bible/114/ISA.40.NKJV" },
  { code: "NLT", name: "New Living Translation", link: "https://www.bible.com/bible/116/ISA.40.NLT" },
  { code: "AMP", name: "Amplified Bible", link: "https://www.bible.com/bible/1588/ISA.40.AMP" },
];

type Passage = { configured?: boolean; content?: string; reference?: string; copyright?: string; externalUrl?: string; error?: string };

export default function WordDetailsPage() {
  const [selected, setSelected] = useState("NIV");
  const [passage, setPassage] = useState<Passage>({});
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);
  const [prayed, setPrayed] = useState(false);
  const current = versions.find((version) => version.code === selected) ?? versions[0];

  useEffect(() => {
    let active = true;
    fetch(`/api/bible/passage?version=${selected}`)
      .then(async (response) => ({ ok: response.ok, body: await response.json() }))
      .then(({ ok, body }) => { if (active) setPassage(ok ? body : { ...body, configured: body.configured ?? false }); })
      .catch(() => { if (active) setPassage({ configured: false, error: "Bible text is temporarily unavailable." }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selected]);

  async function shareWord() {
    if (navigator.share) await navigator.share({ title: "Today&apos;s Word · Isaiah 40:31", url: window.location.href });
    else { await navigator.clipboard.writeText(window.location.href); setShared(true); }
  }

  function selectVersion(code: string) {
    if (code === selected) return;
    setLoading(true);
    setSelected(code);
  }

  return <div className="ro-page word-page">
    <div className="word-topline"><Link href="/home">← Today&apos;s Word</Link><span>DAILY SCRIPTURE · ISAIAH 40:31</span><button type="button" onClick={shareWord}>{shared ? "Link copied ✓" : "Share ↗"}</button></div>

    <section className="word-hero">
      <div className="word-orbit" /><img src="/revival-flame.png" alt="" />
      <div className="word-hero-copy"><p className="ro-overline bright">TODAY&apos;S WORD</p><h1>Strength for<br /><em>the waiting.</em></h1><p>Isaiah 40:31 is not a promise that faithful people never grow tired. It is an invitation to discover where renewed strength comes from when they do.</p><div className="word-meta"><span>7 MIN READ</span><span>SPIRITUAL FORMATION</span><span>28 JULY 2026</span></div></div>
      <aside className="word-day"><span>28</span><b>JUL</b><small>DAY 209</small></aside>
    </section>

    <div className="word-layout">
      <main className="word-reading-column">
        <section className="word-scripture-card" id="scripture">
          <div className="word-card-head"><div><p className="ro-overline">THE SCRIPTURE</p><h2>Isaiah 40:31</h2></div><a href={current.link} target="_blank" rel="noreferrer">Open full chapter ↗</a></div>
          <div className="word-version-tabs" role="tablist" aria-label="Bible translation">{versions.map((version) => <button role="tab" aria-selected={selected === version.code} className={selected === version.code ? "active" : ""} key={version.code} onClick={() => selectVersion(version.code)}><b>{version.code}</b><span>{version.name}</span></button>)}</div>
          <div className="word-passage" aria-live="polite">
            {loading ? <div className="word-passage-loading"><span /><span /><span /></div> : passage.content ? <><blockquote>{passage.content}</blockquote><p>{passage.copyright}</p></> : <div className="word-license-note"><span>◎</span><div><b>{current.name}</b><p>The reader is ready for licensed text. Connect a YouVersion Platform App Key to display this translation inside Revival One.</p><a href={passage.externalUrl ?? current.link} target="_blank" rel="noreferrer">Read Isaiah 40:31 in YouVersion <i>↗</i></a></div></div>}
          </div>
          <div className="word-paraphrase"><span>DEVOTIONAL PARAPHRASE</span><p>Those who place their hope in the Lord receive fresh strength. They rise beyond exhaustion, keep moving through resistance, and are sustained for the long road.</p></div>
        </section>

        <article className="word-study" id="understand">
          <header><span>01</span><div><p className="ro-overline">UNDERSTAND THE WORD</p><h2>Waiting is not<br /><em>wasted time.</em></h2></div></header>
          <p>Isaiah speaks to people who have carried disappointment for so long that weariness feels permanent. Their question is not whether God exists, but whether He still sees them. The chapter answers with a vision of a God whose understanding is beyond measure and whose strength never runs dry.</p>
          <p>To wait for the Lord is not to sit without direction. Biblical waiting is active trust: holding your position, listening for instruction, and refusing to build your future from panic. Hope becomes the place where exhausted strength is exchanged for God&apos;s supply.</p>
          <blockquote>God does not only give strength for the spectacular moment. He gives grace to soar, to run, and—most often—to keep walking.</blockquote>
        </article>

        <section className="word-breakdown">
          <div className="word-section-heading"><p className="ro-overline">PHRASE BY PHRASE</p><h2>What the promise<br /><em>is forming in you.</em></h2></div>
          <div className="word-breakdown-grid"><article><span>01</span><h3>Hope in the Lord</h3><p>Move your expectation away from outcomes you cannot control and anchor it in the character of God.</p></article><article><span>02</span><h3>Renewed strength</h3><p>Renewal is an exchange. Bring honest weakness; receive the strength needed for today&apos;s obedience.</p></article><article><span>03</span><h3>Keep walking</h3><p>Maturity is not measured only by moments of flight. Quiet consistency is also evidence of sustaining grace.</p></article></div>
        </section>

        <section className="word-practice" id="practice"><div><p className="ro-overline bright">PRACTICE THE WORD</p><h2>Carry it into<br /><em>today.</em></h2></div><ol><li><span>1</span><p><b>Name the weight.</b> Write down the one situation that is draining your strength.</p></li><li><span>2</span><p><b>Wait without noise.</b> Give God ten unhurried minutes before reaching for another solution.</p></li><li><span>3</span><p><b>Take the faithful step.</b> Do the next clear thing, even if the full path is not visible yet.</p></li></ol></section>

        <section className="word-prayer" id="prayer"><img src="/revival-flame.png" alt="" /><p className="ro-overline">PRAY THE WORD</p><h2>Father, I bring You the places where I am tired of waiting. Re-anchor my hope in who You are. Exchange my anxiety for Your strength, teach me to recognize today&apos;s grace, and keep me faithful on the road ahead. Amen.</h2><button type="button" onClick={() => setPrayed((value) => !value)}>{prayed ? "Prayer marked ✓" : "I prayed this"} <span>{prayed ? "♥" : "♡"}</span></button></section>
      </main>

      <aside className="word-side-column">
        <nav className="word-contents"><p className="ro-overline">IN THIS READING</p><a href="#scripture" className="active"><span>01</span>The Scripture</a><a href="#understand"><span>02</span>Understand</a><a href="#practice"><span>03</span>Practice</a><a href="#prayer"><span>04</span>Pray</a></nav>
        <section className="word-key-thought"><span>✦</span><p className="ro-overline">KEY THOUGHT</p><h3>Waiting becomes worship when trust replaces the need to control.</h3></section>
        <section className="word-related"><p className="ro-overline">KEEP READING</p><a href="https://www.bible.com/bible/111/PSA.27.14.NIV" target="_blank" rel="noreferrer"><span>PS</span><div><b>Psalm 27:14</b><small>Courage while you wait</small></div><i>↗</i></a><a href="https://www.bible.com/bible/111/2CO.12.9.NIV" target="_blank" rel="noreferrer"><span>2C</span><div><b>2 Corinthians 12:9</b><small>Strength in weakness</small></div><i>↗</i></a><a href="https://www.bible.com/bible/111/GAL.6.9.NIV" target="_blank" rel="noreferrer"><span>GA</span><div><b>Galatians 6:9</b><small>Do not grow weary</small></div><i>↗</i></a></section>
      </aside>
    </div>
  </div>;
}
