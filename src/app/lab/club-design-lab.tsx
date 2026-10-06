"use client";

/* eslint-disable @next/next/no-img-element -- Research captures are shown at their original proportions. */
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Monitor, Smartphone } from "lucide-react";
import styles from "./lab.module.css";
import captureSizes from "./captures.json";

type Device = "desktop" | "mobile";
const fullCaptureSizes: Record<string, Record<Device, { width: number; height: number }>> = captureSizes;

const clubs = [
  {
    id: "watford", name: "Watford FC", color: "#fff200", palette: "Yellow / black / red",
    url: "https://www.watfordfc.com/", title: "Let the identity do the work.",
    description: "Our closest colour reference. Study how a strong yellow identity frames football photography and gives everyday content a recognisable club voice.",
    ideas: [
      ["Navigation", "Use a bright yellow main menu and a separate black utility bar."],
      ["Photography", "Use real players and supporters as the visual centre of the page."],
      ["For Olaine", "Pair yellow highlights with black surfaces, while keeping news text easy to read."],
    ],
    reference: "https://userexperienceawards.com/2017-submissions/watford-football-club-website/",
    referenceLabel: "Published website case study · 2016/17",
    belowFold: "Light fixture panels separate dark news and video sections. Shirt campaigns and a light sponsor grid give the page distinct changes of pace.",
  },
  {
    id: "wolves", name: "Wolves", color: "#fbb040", palette: "Old gold / black",
    url: "https://www.wolves.co.uk/", title: "Make the football easy to find.",
    description: "A useful reference for a content-rich club site: news, video, teams and match information, all organised around a clear football identity.",
    ideas: [
      ["Navigation", "Keep the main paths obvious: news, matches, teams and the academy."],
      ["Match information", "Give the last result and next fixture their own clear, compact space."],
      ["For Olaine", "Borrow the hierarchy and confident gold accents for our black and yellow palette."],
    ],
    reference: "https://gibe.digital/work/wolves/",
    referenceLabel: "Navigation case study · project began 2019",
    belowFold: "A white news grid leads into black video sections. A photo gallery breaks the rhythm before a gold-backed last/next match pair.",
  },
  {
    id: "hull", name: "Hull City", color: "#f5a623", palette: "Amber / black",
    url: "https://www.wearehullcity.co.uk/", title: "Explore another shade of yellow.",
    description: "A black header, a fixture strip immediately below it and a large photographic lead story. Amber is used as an accent, leaving the football content to carry the page.",
    ideas: [
      ["Fixture strip", "Make the upcoming opponents, dates and venues visible before the lead story."],
      ["Photography", "Give one lead story a large image with its headline anchored near the bottom."],
      ["For Olaine", "Use the comparison to choose a yellow that works with our crest and local photos."],
    ],
    belowFold: "Fixtures and a compact league table sit beneath the hero. A large amber video section leads into a light news grid and black partner footer.",
  },
];

export function ClubDesignLab() {
  const [device, setDevice] = useState<Device>("desktop");
  const [fullPage, setFullPage] = useState(false);

  function screenshotPath(club: string) {
    return `/design-lab/${club}-${device}${fullPage ? "-full.jpg" : ".png"}`;
  }

  return (
    <main className={styles.lab} lang="en">
      <header className={styles.header}>
        <Link href="/" className={styles.back}><ArrowLeft size={16} aria-hidden="true" /> AFA Olaine</Link>
        <span>Design lab</span>
        <a href="#direction" className={styles.directionLink}>Our direction <ArrowUpRight size={16} aria-hidden="true" /></a>
      </header>

      <section className={styles.intro}>
        <h1>Black. Yellow.<br /><span>Football.</span></h1>
        <div className={styles.introCopy}>
          <p>A reference wall for AFA Olaine. Explore three English club websites and the ideas we can make our own.</p>
          <p className={styles.caption}>Website captures: 6 October 2026. Published design examples are labelled separately. Club designs and imagery belong to their respective owners.</p>
        </div>
      </section>

      <nav className={styles.toolbar} aria-label="Reference controls">
        <div className={styles.clubLinks}>{clubs.map(club => <a key={club.id} href={`#${club.id}`}>{club.name}</a>)}</div>
        <div className={styles.captureControls}>
        <div className={styles.deviceControls} role="group" aria-label="Screenshot area">
          <button type="button" aria-pressed={!fullPage} onClick={() => setFullPage(false)}>First screen</button>
          <button type="button" aria-pressed={fullPage} onClick={() => setFullPage(true)}>Full page</button>
        </div>
        <div className={styles.deviceControls} role="group" aria-label="Screenshot viewport">
          <button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}><Monitor size={16} aria-hidden="true" /> Desktop</button>
          <button type="button" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}><Smartphone size={16} aria-hidden="true" /> Mobile</button>
        </div>
        </div>
      </nav>

      <div className={styles.references}>
        {clubs.map(club => (
          <section id={club.id} key={club.id} className={styles.club}>
            <div className={styles.clubHeading}>
              <div><h2>{club.name}</h2><p><span className={styles.swatch} style={{ background: club.color }} />{club.palette}</p></div>
              <a href={club.url} target="_blank" rel="noreferrer">Visit website <ArrowUpRight size={18} aria-hidden="true" /><span className={styles.srOnly}> (opens in a new tab)</span></a>
            </div>
            <div className={styles.referenceGrid}>
              <figure className={styles.figure}>
                <div className={fullPage ? styles.fullPageFrame : undefined} tabIndex={fullPage ? 0 : undefined} role={fullPage ? "region" : undefined} aria-label={fullPage ? `${club.name} full page screenshot, scroll to explore` : undefined} key={`${club.id}-${device}-${fullPage}`}>
                <a className={`${styles.capture} ${device === "mobile" ? styles.mobileCapture : ""}`} href={screenshotPath(club.id)} target="_blank" rel="noreferrer" aria-label={`Open ${fullPage ? "full page" : "first screen"} ${device} screenshot of ${club.name} in a new tab`}>
                  <img src={screenshotPath(club.id)} alt={`${club.name} ${fullPage ? "complete homepage" : "homepage first screen"} captured at ${device === "desktop" ? "1440" : "390"} pixels wide`} width={device === "desktop" ? 1440 : 390} height={fullPage ? fullCaptureSizes[club.id][device].height : device === "desktop" ? 1000 : 844} loading={club.id === "watford" ? "eager" : "lazy"} />
                </a>
                </div>
                <figcaption><span>{device === "desktop" ? "Desktop" : "Mobile"} · {fullPage ? "Full page · scroll inside to explore" : device === "desktop" ? "1440 × 1000" : "390 × 844"}</span><span>Click to open full size <ArrowUpRight size={13} aria-hidden="true" /></span></figcaption>
              </figure>
              <aside className={styles.notes}>
                <h3>{club.title}</h3><p>{club.description}</p>
                <dl>{club.ideas.map(([label, text]) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl>
                {fullPage && <div className={styles.belowFold}><h4>Beyond the first screen</h4><p>{club.belowFold}</p></div>}
                {club.reference && <a className={styles.source} href={club.reference} target="_blank" rel="noreferrer">{club.referenceLabel}<ArrowUpRight size={14} aria-hidden="true" /></a>}
              </aside>
            </div>
          </section>
        ))}
      </div>

      <section className={styles.published}>
        <h2>Behind the websites</h2>
        <p className={styles.sectionDescription}>Two published references that show the design language beyond today’s homepage.</p>
        <div className={styles.publishedGrid}>
          <figure>
            <a href="/design-lab/wolves-navigation.png" target="_blank" rel="noreferrer"><img src="/design-lab/wolves-navigation.png" width={860} height={491} alt="Published Wolves navigation design showing desktop dropdown and yellow mobile menu" loading="lazy" /></a>
            <figcaption><strong>Wolves navigation</strong><span>Historical website example. Clear categories, a confident yellow menu and a separate utility bar.</span><a href="https://gibe.digital/work/wolves/" target="_blank" rel="noreferrer">Source: Gibe Digital <ArrowUpRight size={14} aria-hidden="true" /></a></figcaption>
          </figure>
          <figure className={styles.poster}>
            <a href="/design-lab/watford-matchday.jpg" target="_blank" rel="noreferrer"><img src="/design-lab/watford-matchday.jpg" width={1080} height={1350} alt="Watford matchday poster with player portrait, oversized white and yellow lettering, and fixture details" loading="lazy" /></a>
            <figcaption><strong>Watford matchday typography</strong><span>2026/27 social identity, rather than a website screenshot. Strong type and portrait treatment to inspire Olaine’s match content.</span><a href="https://www.mikeychapman.com/watfordfc_social_rebrand" target="_blank" rel="noreferrer">Source: Mikey Chapman <ArrowUpRight size={14} aria-hidden="true" /></a></figcaption>
          </figure>
        </div>
      </section>

      <section id="direction" className={styles.direction}>
        <h2>Make it Olaine.</h2>
        <p>Watford’s expressive typography. Wolves’ clear structure. Our own players, stadium and supporters.</p>
        <div className={styles.directionGrid}>
          <div><h3>A confident first screen</h3><p>Black navigation, a prominent crest and a large local football photograph with a short Latvian headline.</p></div>
          <div><h3>The next match, upfront</h3><p>Team crests, kickoff, venue and the last result together, close to the top of the page.</p></div>
          <div><h3>Space for the whole club</h3><p>Readable news, bold team portraits and a clear academy invitation for players and parents.</p></div>
        </div>
        <Link href="/">Back to AFA Olaine <ArrowUpRight size={18} aria-hidden="true" /></Link>
      </section>
      <footer className={styles.footer}><span>AFA Olaine · design exploration</span><a href="#">Back to top</a></footer>
    </main>
  );
}
