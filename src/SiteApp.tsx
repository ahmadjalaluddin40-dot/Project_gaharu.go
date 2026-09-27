import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ExternalLink,
  MapPin,
  Menu,
  Search,
  Share2,
  X,
} from "lucide-react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { copy, pick } from "./data/copy";
import type { AppContent, Article, ArticleCategory, EditorialImage, Language, Localized, Program } from "./data/types";
import { fallbackContent, fetchSiteContent } from "./lib/sanity";
import { messagesTable, supabase } from "./lib/supabase";
import fallbackLogoSvg from "./assets/gaharu-logo.svg?raw";

// Bundling the mark as data avoids broken asset paths on nested routes and preview hosts.
const fallbackLogoUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fallbackLogoSvg)}`;

type SiteContextValue = {
  lang: Language;
  content: AppContent;
  ui: (typeof copy)[Language];
};

const SiteContext = createContext<SiteContextValue | null>(null);

function useSite() {
  const context = useContext(SiteContext);
  if (!context) throw new Error("Site components must be rendered inside SiteContext.");
  return context;
}

function pathFor(lang: Language, path = "") {
  return `/${lang}${path}`;
}

function phoneHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `tel:${digits.startsWith("0") ? `+62${digits.slice(1)}` : `+${digits}`}`;
}

function sizedImage(url: string, width: number) {
  if (!url) return "";
  if (url.includes("images.pexels.com")) return `${url}${url.includes("?") ? "&" : "?"}w=${width}`;
  if (url.includes("cdn.sanity.io")) return `${url}${url.includes("?") ? "&" : "?"}w=${width}&auto=format&fit=max`;
  return url;
}

function Photo({
  image,
  className = "",
  sizes = "(max-width: 700px) 100vw, 50vw",
  priority = false,
}: {
  image: EditorialImage;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const { lang } = useSite();
  const widths = [480, 800, 1200, 1800];

  return (
    <img
      className={className}
      src={sizedImage(image.url, priority ? 1800 : 800)}
      srcSet={widths.map((width) => `${sizedImage(image.url, width)} ${width}w`).join(", ")}
      sizes={sizes}
      alt={pick(image.alt, lang)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
    />
  );
}

function PhotoCaption({ image, showNote = false }: { image: EditorialImage; showNote?: boolean }) {
  const { ui, lang } = useSite();
  return (
    <figcaption className="photo-caption">
      {showNote && <span>{ui.illustrationNote} </span>}
      {image.credit && (
        <a href={image.creditUrl || undefined} target="_blank" rel="noopener noreferrer">
          {image.credit.replace("(foto ilustrasi)", lang === "en" ? "(illustrative photo)" : "(foto ilustrasi)")}
        </a>
      )}
    </figcaption>
  );
}

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = element.current;
    if (!node || !("IntersectionObserver" in window)) return;
    node.classList.add("reveal--ready");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("is-visible");
          observer.unobserve(node);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={element}
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

function TextLink({ to, children, light = false }: { to: string; children: ReactNode; light?: boolean }) {
  return (
    <Link to={to} className={`text-link${light ? " text-link--light" : ""}`}>
      <span>{children}</span>
      <ArrowUpRight size={19} strokeWidth={1.8} aria-hidden="true" />
    </Link>
  );
}

function ActionLink({
  to,
  children,
  variant = "gold",
}: {
  to: string;
  children: ReactNode;
  variant?: "gold" | "outline" | "forest" | "white";
}) {
  return (
    <Link to={to} className={`action-link action-link--${variant}`}>
      <span>{children}</span>
      <ArrowUpRight size={18} strokeWidth={2} aria-hidden="true" />
    </Link>
  );
}

function Brand({ inverse = false, onClick }: { inverse?: boolean; onClick?: () => void }) {
  const { lang, ui } = useSite();
  const logoUrl = import.meta.env.VITE_GAHARU_LOGO_URL || fallbackLogoUrl;
  return (
    <Link to={pathFor(lang)} className={`brand${inverse ? " brand--inverse" : ""}`} aria-label={`GAHARU - ${ui.navHome}`} onClick={onClick}>
      <img
        src={logoUrl}
        alt=""
        width="56"
        height="56"
        onError={(event) => {
          if (event.currentTarget.src !== fallbackLogoUrl) event.currentTarget.src = fallbackLogoUrl;
        }}
      />
      <span className="brand__type">
        <strong>GAHARU</strong>
        <small>SAVE OUR EARTH</small>
      </span>
    </Link>
  );
}

function LanguageSwitch({ onChoose }: { onChoose?: () => void }) {
  const { lang, ui } = useSite();
  const location = useLocation();
  const suffix = location.pathname.replace(/^\/(id|en)/, "") || "";

  return (
    <div className="language-switch" aria-label={ui.changeLanguage} role="group">
      {(["id", "en"] as const).map((option, index) => (
        <span className="language-switch__part" key={option}>
          {index > 0 && <span className="language-switch__divider" aria-hidden="true">/</span>}
          <Link
            to={`/${option}${suffix}${location.search}`}
            className={lang === option ? "is-active" : ""}
            aria-current={lang === option ? "page" : undefined}
            onClick={onChoose}
          >
            {option.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );
}

function Header() {
  const { lang, ui } = useSite();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  const links = [
    { to: pathFor(lang), label: ui.navHome, end: true },
    { to: pathFor(lang, "/tentang-kami"), label: ui.navAbout },
    { to: pathFor(lang, "/program"), label: ui.navPrograms },
    { to: pathFor(lang, "/publikasi"), label: ui.navPublications },
    { to: pathFor(lang, "/wilayah-kerja"), label: ui.navMap },
  ];

  return (
    <header className="site-header">
      <div className="site-header__inner page-wrap">
        <Brand onClick={() => setMenuOpen(false)} />
        <nav className="desktop-nav" aria-label={lang === "id" ? "Navigasi utama" : "Main navigation"}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => (isActive ? "is-active" : "")}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <LanguageSwitch />
          <Link className="header-partner" to={pathFor(lang, "/kemitraan")}>
            {ui.navPartnership}<ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <button
          className="mobile-menu-button"
          type="button"
          aria-label={menuOpen ? ui.closeMenu : ui.openMenu}
          aria-controls="mobile-navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={26} strokeWidth={1.8} /> : <Menu size={26} strokeWidth={1.8} />}
        </button>
      </div>
      <div id="mobile-navigation" className={`mobile-navigation${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
        <nav aria-label={lang === "id" ? "Navigasi seluler" : "Mobile navigation"}>
          {[...links, { to: pathFor(lang, "/kemitraan"), label: ui.navPartnership }, { to: pathFor(lang, "/kontak"), label: ui.navContact }].map((link) => (
            <NavLink key={link.to} to={link.to} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}>
              {link.label}<ArrowUpRight size={19} aria-hidden="true" />
            </NavLink>
          ))}
        </nav>
        <div className="mobile-navigation__bottom"><LanguageSwitch onChoose={() => setMenuOpen(false)} /></div>
      </div>
    </header>
  );
}

function Footer() {
  const { lang, ui, content } = useSite();
  return (
    <footer className="site-footer">
      <div className="page-wrap">
        <div className="footer-main">
          <div className="footer-intro">
            <Brand inverse />
            <p>{ui.footerDescription}</p>
          </div>
          <div className="footer-column">
            <h2>{ui.footerExplore}</h2>
            <Link to={pathFor(lang, "/tentang-kami")}>{ui.navAbout}</Link>
            <Link to={pathFor(lang, "/program")}>{ui.navPrograms}</Link>
            <Link to={pathFor(lang, "/publikasi")}>{ui.navPublications}</Link>
            <Link to={pathFor(lang, "/wilayah-kerja")}>{ui.navMap}</Link>
          </div>
          <div className="footer-column">
            <h2>{ui.footerConnect}</h2>
            <Link to={pathFor(lang, "/kemitraan")}>{ui.navPartnership}</Link>
            <Link to={pathFor(lang, "/kontak")}>{ui.navContact}</Link>
            <Link to={pathFor(lang, "/kredit-foto")}>{ui.footerPhoto}</Link>
          </div>
          <div className="footer-location">
            <h2>{ui.officeLabel}</h2>
            <p>{pick(content.site.office.address, lang)}</p>
            <a href={googleMapsSearchUrl(content.site.office.address.id)} target="_blank" rel="noopener noreferrer">
              {ui.openAreaMap}<ArrowUpRight size={15} aria-hidden="true" />
            </a>
            {content.site.office.phone && <a href={phoneHref(content.site.office.phone)} aria-label={`${ui.phoneLabel}: ${content.site.office.phone}`}>{content.site.office.phone}</a>}
            {content.site.office.email && <a href={`mailto:${content.site.office.email}`} aria-label={`${ui.emailLabel}: ${content.site.office.email}`}>{content.site.office.email}</a>}
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} GAHARU. {ui.copyright}</span>
          <span>{ui.footerBased}</span>
        </div>
      </div>
    </footer>
  );
}

function setMeta(attribute: "name" | "property", key: string, value: string) {
  let element = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = value;
}

function Seo({
  title,
  description,
  image,
  type = "website",
  article,
}: {
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article";
  article?: Article;
}) {
  const { lang } = useSite();
  const location = useLocation();

  useEffect(() => {
    const base = (import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, "");
    const url = `${base}${location.pathname}`;
    document.title = title;
    document.documentElement.lang = lang;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", url);
    setMeta("property", "og:locale", lang === "id" ? "id_ID" : "en_US");
    if (image) setMeta("property", "og:image", sizedImage(image, 1200));
    else document.querySelector('meta[property="og:image"]')?.remove();
    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    for (const option of ["id", "en"] as const) {
      let alternate = document.querySelector(`link[rel="alternate"][hreflang="${option}"]`) as HTMLLinkElement | null;
      if (!alternate) {
        alternate = document.createElement("link");
        alternate.rel = "alternate";
        alternate.hreflang = option;
        document.head.appendChild(alternate);
      }
      alternate.href = `${base}${location.pathname.replace(/^\/(id|en)/, `/${option}`)}`;
    }

    document.getElementById("article-schema")?.remove();
    if (article) {
      const script = document.createElement("script");
      script.id = "article-schema";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: pick(article.title, lang),
        description: pick(article.excerpt, lang),
        ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
        image: article.cover.url,
        inLanguage: lang,
        url,
        ...(article.authorName ? { author: { "@type": "Person", name: pick(article.authorName, lang) } } : {}),
        publisher: { "@type": "Organization", name: "GAHARU" },
      });
      document.head.appendChild(script);
    }
  }, [article, description, image, lang, location.pathname, title, type]);

  return null;
}

function PageSeo({ page, image }: { page: keyof AppContent["site"]["seo"]; image?: string }) {
  const { lang, content } = useSite();
  const seo = content.site.seo[page];
  return <Seo title={pick(seo.title, lang)} description={pick(seo.description, lang)} image={image} />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function Home() {
  const { lang, content, ui } = useSite();
  const site = content.site;
  const featured = content.programs.filter((program) => program.featured).slice(0, 3);
  const latest = [...content.articles].sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || "")).slice(0, 3);

  return (
    <>
      <PageSeo page="home" image={site.hero.image.url} />
      <section className="home-hero" aria-labelledby="home-title">
        <Photo image={site.hero.image} className="home-hero__photo" sizes="100vw" priority />
        <div className="home-hero__shade" />
        <div className="page-wrap home-hero__content">
          <p className="eyebrow eyebrow--gold hero-enter hero-enter--one">{pick(site.hero.eyebrow, lang)}</p>
          <h1 id="home-title" className="home-hero__brand hero-enter hero-enter--two">GAHARU<span>.</span></h1>
          <h2 className="home-hero__headline hero-enter hero-enter--three">{pick(site.hero.headline, lang)}</h2>
          <p className="home-hero__body hero-enter hero-enter--four">{pick(site.hero.body, lang)}</p>
          <div className="home-hero__actions hero-enter hero-enter--five">
            <ActionLink to={pathFor(lang, "/program")}>{ui.explorePrograms}</ActionLink>
            <ActionLink to={pathFor(lang, "/tentang-kami")} variant="outline">{ui.meetUs}</ActionLink>
          </div>
        </div>
      </section>

      <section className="impact-section section-space" aria-labelledby="impact-title">
        <div className="page-wrap">
          <Reveal className="impact-section__intro">
            <div>
              <p className="eyebrow">{pick(site.impact.eyebrow, lang)}</p>
              <h2 id="impact-title" className="section-title">{pick(site.impact.title, lang)}</h2>
            </div>
            <p className="section-lead">{pick(site.impact.body, lang)}</p>
          </Reveal>
          <div className="impact-metrics">
            {site.metrics.map((metric, index) => (
              <Reveal className="impact-metric" delay={index * 90} key={`${metric.value.id}-${index}`}>
                <strong>{pick(metric.value, lang)}</strong>
                <span>{pick(metric.label, lang)}</span>
                {metric.note && <small>{pick(metric.note, lang)}</small>}
              </Reveal>
            ))}
          </div>
          <Reveal className="impact-section__link">
            <TextLink to={pathFor(lang, "/program/rehabilitasi-mangrove-muna-barat")}>{ui.readCaseStudy}</TextLink>
          </Reveal>
        </div>
      </section>

      <section className="home-about" aria-labelledby="home-about-title">
        <div className="home-about__media"><Photo image={site.aboutPreview.image} sizes="(max-width: 850px) 100vw, 50vw" /></div>
        <div className="home-about__content">
          <Reveal>
            <p className="eyebrow">{pick(site.aboutPreview.eyebrow, lang)}</p>
            <h2 id="home-about-title" className="section-title">{pick(site.aboutPreview.title, lang)}</h2>
            <p className="section-lead">{pick(site.aboutPreview.body, lang)}</p>
            <TextLink to={pathFor(lang, "/tentang-kami")}>{ui.readAbout}</TextLink>
          </Reveal>
        </div>
      </section>

      <section className="home-programs section-space" aria-labelledby="home-programs-title">
        <div className="page-wrap">
          <Reveal className="section-heading section-heading--dark">
            <div>
              <p className="eyebrow eyebrow--gold">{pick(site.programsPreview.eyebrow, lang)}</p>
              <h2 id="home-programs-title" className="section-title">{pick(site.programsPreview.title, lang)}</h2>
            </div>
            <div className="section-heading__side"><p>{pick(site.programsPreview.body, lang)}</p><TextLink to={pathFor(lang, "/program")} light>{ui.allPrograms}</TextLink></div>
          </Reveal>
          <div className="featured-programs">
            {featured.map((program, index) => (
              <Reveal delay={index * 100} key={program.slug}>
                <Link className="featured-program" to={pathFor(lang, `/program/${program.slug}`)}>
                  <div className="featured-program__image"><Photo image={program.cover} sizes="(max-width: 700px) 100vw, 33vw" /></div>
                  <div className="featured-program__meta"><span>0{index + 1} / {pick(program.category, lang)}</span><ArrowUpRight size={22} strokeWidth={1.6} aria-hidden="true" /></div>
                  <h3>{pick(program.title, lang)}</h3><p>{pick(program.summary, lang)}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="home-map section-space" aria-labelledby="home-map-title">
        <div className="page-wrap home-map__inner">
          <Reveal className="home-map__content">
            <p className="eyebrow">{pick(site.mapPreview.eyebrow, lang)}</p>
            <h2 id="home-map-title" className="section-title">{pick(site.mapPreview.title, lang)}</h2>
            <p className="section-lead">{pick(site.mapPreview.body, lang)}</p>
            <TextLink to={pathFor(lang, "/wilayah-kerja")}>{ui.viewMap}</TextLink>
          </Reveal>
          <Reveal className="home-map__visual" delay={120}>
            <GoogleMapEmbed query={villages[0].query} title={`${ui.googleMapTitle}: Muna Barat`} zoom={11} />
            <a className="map-external-link" href={googleMapsSearchUrl(villages[0].query)} target="_blank" rel="noopener noreferrer">
              {ui.openInGoogleMaps}<ExternalLink size={17} aria-hidden="true" />
            </a>
          </Reveal>
        </div>
      </section>

      <section className="home-stories section-space" aria-labelledby="home-stories-title">
        <div className="page-wrap">
          <Reveal className="section-heading">
            <div><p className="eyebrow">{pick(site.publicationsPreview.eyebrow, lang)}</p><h2 id="home-stories-title" className="section-title">{pick(site.publicationsPreview.title, lang)}</h2></div>
            <div className="section-heading__side"><p>{pick(site.publicationsPreview.body, lang)}</p><TextLink to={pathFor(lang, "/publikasi")}>{ui.allArticles}</TextLink></div>
          </Reveal>
          <div className="article-grid">{latest.map((article, index) => <Reveal delay={index * 90} key={article.slug}><ArticleCard article={article} /></Reveal>)}</div>
        </div>
      </section>

      <section className="partner-banner" aria-labelledby="partner-banner-title">
        <Photo image={site.partnerCta.image} className="partner-banner__photo" sizes="100vw" />
        <div className="partner-banner__shade" />
        <div className="page-wrap partner-banner__content">
          <Reveal><p className="eyebrow eyebrow--gold">{pick(site.partnerCta.eyebrow, lang)}</p><h2 id="partner-banner-title">{pick(site.partnerCta.title, lang)}</h2><p>{pick(site.partnerCta.body, lang)}</p><ActionLink to={pathFor(lang, "/kemitraan")}>{ui.collaborate}</ActionLink></Reveal>
        </div>
      </section>
    </>
  );
}

function PlainPageHero({ eyebrow, title, body, back }: { eyebrow: Localized; title: Localized; body: Localized; back?: { to: string; label: string } }) {
  const { lang } = useSite();
  return (
    <section className="plain-page-hero"><div className="page-wrap">
      {back && <Link className="back-link" to={back.to}><ArrowLeft size={18} aria-hidden="true" />{back.label}</Link>}
      <p className="eyebrow">{pick(eyebrow, lang)}</p><h1>{pick(title, lang)}</h1><p className="plain-page-hero__body">{pick(body, lang)}</p>
    </div></section>
  );
}

function PhotoPageHero({ eyebrow, title, body, image, back }: { eyebrow: Localized; title: Localized; body: Localized; image: EditorialImage; back?: { to: string; label: string } }) {
  const { lang } = useSite();
  return (
    <section className="photo-page-hero">
      <Photo image={image} className="photo-page-hero__photo" sizes="100vw" priority /><div className="photo-page-hero__shade" />
      <div className="page-wrap photo-page-hero__content">
        {back && <Link className="back-link back-link--light" to={back.to}><ArrowLeft size={18} aria-hidden="true" />{back.label}</Link>}
        <p className="eyebrow eyebrow--gold">{pick(eyebrow, lang)}</p><h1>{pick(title, lang)}</h1><p>{pick(body, lang)}</p>
      </div>
    </section>
  );
}

function Paragraphs({ value, className = "" }: { value: string; className?: string }) {
  return (
    <div className={`prose-copy ${className}`}>
      {value.split(/\n\s*\n/).filter(Boolean).map((part, index) =>
        part.startsWith("## ") ? <h2 key={`${index}-${part}`}>{part.slice(3)}</h2> : <p key={`${index}-${part}`}>{part}</p>,
      )}
    </div>
  );
}

function AboutPage() {
  const { lang, content, ui } = useSite();
  const page = content.site.aboutPage;
  return (
    <>
      <PageSeo page="about" image={page.image.url} />
      <PlainPageHero eyebrow={page.eyebrow} title={page.title} body={page.body} />
      <figure className="about-wide-photo"><Photo image={page.image} sizes="100vw" /><PhotoCaption image={page.image} showNote /></figure>
      <section className="about-history section-space"><div className="page-wrap about-history__grid">
        <Reveal><p className="eyebrow">{ui.aboutHistory} / 2011</p></Reveal>
        <Reveal delay={90}><h2 className="section-title">{pick(page.historyTitle, lang)}</h2><Paragraphs value={pick(page.history, lang)} /></Reveal>
      </div></section>
      <section className="about-beliefs section-space"><div className="page-wrap">
        <Reveal><p className="eyebrow">{ui.aboutPrinciples}</p></Reveal>
        <div className="about-beliefs__grid">
          <Reveal><span className="about-beliefs__index">01 / {lang === "id" ? "VISI" : "VISION"}</span><h2>{pick(page.visionTitle, lang)}</h2><p>{pick(page.vision, lang)}</p></Reveal>
          <Reveal delay={90} className="about-mission"><span className="about-beliefs__index">02 / {lang === "id" ? "MISI" : "MISSION"}</span><h2>{pick(page.missionTitle, lang)}</h2><p>{pick(page.mission, lang)}</p>{page.missionItems?.[lang]?.length ? <ol>{page.missionItems[lang].map((item) => <li key={item}>{item}</li>)}</ol> : null}</Reveal>
        </div>
        <Reveal className="about-values">{ui.values.map((value, index) => <span key={value}>{value}{index < ui.values.length - 1 && <i aria-hidden="true">/</i>}</span>)}</Reveal>
      </div></section>
      {Boolean(page.team?.length) && <section className="about-team section-space"><div className="page-wrap">
        <Reveal><p className="eyebrow">GAHARU / {lang === "id" ? "TIM" : "TEAM"}</p><h2 className="section-title">{ui.teamTitle}</h2></Reveal>
        <div className="about-team__grid">{page.team?.map((member) => <div className="about-team__person" key={member.name}>
          {member.photo?.url && <Photo image={member.photo} sizes="(max-width: 700px) 50vw, 25vw" />}
          <h3>{member.name}</h3><p>{pick(member.role, lang)}</p>
        </div>)}</div>
      </div></section>}
      <section className="about-governance section-space"><div className="page-wrap about-governance__grid">
        <Reveal><p className="eyebrow eyebrow--gold">{lang === "id" ? "TRANSPARANSI / INTEGRITAS" : "TRANSPARENCY / INTEGRITY"}</p><h2 className="section-title">{pick(page.governanceTitle, lang)}</h2></Reveal>
        <Reveal delay={90}>
          <p>{pick(page.governance, lang)}</p>
          {Boolean(page.documents?.some((document) => document.url)) && <div className="governance-documents">
            <h3>{ui.documentsTitle}</h3>
            {page.documents?.filter((document) => document.url).map((document) => <a href={document.url} key={`${document.title.id}-${document.year || ""}`} target="_blank" rel="noopener noreferrer"><span>{pick(document.title, lang)}{document.year ? ` (${document.year})` : ""}</span><ArrowUpRight size={18} aria-hidden="true" /></a>)}
          </div>}
          <TextLink to={pathFor(lang, "/kontak")} light>{ui.navContact}</TextLink>
        </Reveal>
      </div></section>
    </>
  );
}

function ProgramsPage() {
  const { lang, content, ui } = useSite();
  const page = content.site.programPage;
  const programs = [...content.programs].sort((a, b) => a.order - b.order);
  return (
    <>
      <PageSeo page="programs" image={page.image.url} />
      <PhotoPageHero eyebrow={page.eyebrow} title={page.title} body={page.body} image={page.image} />
      <section className="program-list-section section-space"><div className="page-wrap">
        <Reveal className="list-intro"><p className="eyebrow">{ui.navPrograms} / GAHARU</p><p>{pick(content.site.programsPreview.body, lang)}</p></Reveal>
        <div className="program-list">
          {programs.map((program, index) => <Reveal key={program.slug}>
            <Link className="program-list-item" to={pathFor(lang, `/program/${program.slug}`)}>
              <span className="program-list-item__number">0{index + 1}</span>
              <div className="program-list-item__image"><Photo image={program.cover} sizes="(max-width: 700px) 100vw, 28vw" /></div>
              <div className="program-list-item__copy"><span className="eyebrow">{pick(program.category, lang)}</span><h2>{pick(program.title, lang)}</h2><p>{pick(program.summary, lang)}</p><span className="program-list-item__more">{ui.readProgram}<ArrowUpRight size={17} aria-hidden="true" /></span></div>
              <ArrowUpRight className="program-list-item__arrow" size={28} strokeWidth={1.4} aria-hidden="true" />
            </Link>
          </Reveal>)}
        </div>
      </div></section>
    </>
  );
}

function GrowthChart({ data }: { data: NonNullable<Program["growthData"]> }) {
  const { ui, lang } = useSite();
  const formatPercent = (value: number) => `${new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-US", { maximumFractionDigits: 2 }).format(value)}%`;
  const barWidth = (value: number) => `${Math.max(0, Math.min(100, value))}%`;
  return (
    <section className="growth-section section-space" aria-labelledby="growth-title"><div className="page-wrap growth-section__grid">
      <Reveal><p className="eyebrow">{lang === "id" ? "DATA LAPANGAN" : "FIELD DATA"}</p><h2 id="growth-title" className="section-title">{pick(data.title, lang)}</h2><p className="section-lead">{pick(data.intro, lang)}</p><p className="growth-section__source">{pick(data.source, lang)}</p></Reveal>
      <Reveal className="growth-chart" delay={100}>
        <div className="growth-chart__topline"><span>{lang === "id" ? "PERSEN TUMBUH TANAMAN" : "PLANT SURVIVAL"}</span><span>0 - 100%</span></div>
        <div className="growth-chart__row"><div className="growth-chart__label"><span>{ui.initialAssessment}</span><strong>{formatPercent(data.initial)}</strong></div><div className="growth-chart__track"><div className="growth-chart__fill growth-chart__fill--initial" style={{ width: barWidth(data.initial) }} /></div></div>
        <div className="growth-chart__row"><div className="growth-chart__label"><span>{ui.firstYear}</span><strong>{formatPercent(data.followupMin)}-{formatPercent(data.followupMax)}</strong></div><div className="growth-chart__track"><div className="growth-chart__fill growth-chart__fill--year" style={{ width: barWidth(data.followupMax) }} /><span className="growth-chart__range" style={{ left: barWidth(data.followupMin) }} /></div></div>
        <div className="growth-chart__minimum"><span style={{ left: barWidth(data.standard) }} />{ui.minimum}: {formatPercent(data.standard)}</div><p>{pick(data.note, lang)}</p>
      </Reveal>
    </div></section>
  );
}

function ProgramDetailPage() {
  const { slug } = useParams();
  const { lang, content, ui } = useSite();
  const program = content.programs.find((item) => item.slug === slug);
  if (!program) return <NotFoundPage />;
  const otherProgram = content.programs.find((item) => item.slug !== program.slug);

  return (
    <>
      <Seo title={pick(program.metaTitle || program.title, lang) + (program.metaTitle ? "" : " | GAHARU")} description={pick(program.metaDescription || program.summary, lang)} image={program.cover.url} />
      <PhotoPageHero eyebrow={program.category} title={program.title} body={program.summary} image={program.cover} back={{ to: pathFor(lang, "/program"), label: ui.backToPrograms }} />
      <section className="program-detail-main section-space"><div className="page-wrap">
        <div className="program-detail-main__grid">
          <Reveal><p className="eyebrow">{ui.programOverview}</p><h2 className="section-title">{pick(program.summary, lang)}</h2><Paragraphs value={pick(program.body, lang)} /></Reveal>
          <Reveal className="program-facts" delay={90}>
            <h3>{ui.programDetails}</h3>
            {[[ui.programLocation, pick(program.location, lang)], [ui.programPeriod, pick(program.period, lang)], [ui.programPartner, pick(program.partner, lang)], [ui.programStatus, pick(program.status, lang)]].map(([label, value]) => <div className="program-facts__row" key={label}><span>{label}</span><strong>{value}</strong></div>)}
          </Reveal>
        </div>
        {program.metrics?.length > 0 && <div className="program-detail-metrics">{program.metrics.map((metric) => <div key={metric.value.id}><strong>{pick(metric.value, lang)}</strong><span>{pick(metric.label, lang)}</span></div>)}</div>}
      </div></section>
      {program.growthData && <GrowthChart data={program.growthData} />}
      {Boolean(program.gallery?.length || program.galleryVideos?.length) && <section className="program-gallery section-space" aria-labelledby="program-gallery-title"><div className="page-wrap">
        <Reveal><p className="eyebrow">{lang === "id" ? "GALERI" : "GALLERY"}</p><h2 id="program-gallery-title" className="section-title">{ui.fieldGallery}</h2></Reveal>
        <div className="program-gallery__grid">
          {(program.gallery || []).map((image, index) => <Reveal key={`${image.url}-${index}`} delay={index * 90}><figure><Photo image={image} sizes="(max-width: 700px) 100vw, 50vw" /><PhotoCaption image={image} /></figure></Reveal>)}
          {(program.galleryVideos || []).filter((video) => video.url).map((video, index) => <Reveal key={`${video.url}-${index}`} delay={index * 90}><figure className="program-gallery__video"><video controls preload="none" poster={video.poster?.url ? sizedImage(video.poster.url, 800) : undefined} aria-label={pick(video.title, lang)}><source src={video.url} /></video><figcaption>{pick(video.title, lang)}</figcaption></figure></Reveal>)}
        </div>
        {program.gallery?.length > 0 && <p className="program-gallery__note">{ui.illustrationNote}</p>}
      </div></section>}
      <section className="detail-next"><div className="page-wrap detail-next__inner"><div><p className="eyebrow">{ui.nextProgram}</p><h2>{otherProgram ? pick(otherProgram.title, lang) : ui.navPrograms}</h2></div><TextLink to={otherProgram ? pathFor(lang, `/program/${otherProgram.slug}`) : pathFor(lang, "/program")}>{ui.readProgram}</TextLink></div></section>
    </>
  );
}

function categoryName(category: ArticleCategory, lang: Language) {
  const ui = copy[lang];
  switch (category) {
    case "edukasi": return ui.education;
    case "riset": return ui.research;
    case "opini": return ui.opinions;
    default: return ui.updates;
  }
}

function formatDate(date: string, lang: Language) {
  return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-US", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}

function ArticleCard({ article }: { article: Article }) {
  const { lang, ui } = useSite();
  return (
    <Link className="article-card" to={pathFor(lang, `/publikasi/${article.slug}`)}>
      <div className="article-card__image"><Photo image={article.cover} sizes="(max-width: 700px) 100vw, 33vw" /></div>
      <div className="article-card__meta">
        <span>{categoryName(article.category, lang)}</span>
        {article.authorName && <span>{pick(article.authorName, lang)}</span>}
        {article.publishedAt && <span>{formatDate(article.publishedAt, lang)}</span>}
      </div>
      <h3>{pick(article.title, lang)}</h3><p>{pick(article.excerpt, lang)}</p><span className="article-card__read">{ui.readArticle}<ArrowUpRight size={17} aria-hidden="true" /></span>
    </Link>
  );
}

function PublicationsPage() {
  const { lang, content, ui } = useSite();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ArticleCategory | "all">("all");
  const [year, setYear] = useState("all");
  const page = content.site.publicationsPage;
  const years = [...new Set(content.articles.flatMap((article) => article.publishedAt ? [article.publishedAt.slice(0, 4)] : []))].sort().reverse();
  const articles = useMemo(() => {
    const term = search.trim().toLocaleLowerCase(lang === "id" ? "id-ID" : "en-US");
    return [...content.articles]
      .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
      .filter((article) => category === "all" || article.category === category)
      .filter((article) => year === "all" || article.publishedAt?.startsWith(year))
      .filter((article) => !term || `${pick(article.title, lang)} ${pick(article.excerpt, lang)} ${categoryName(article.category, lang)}`.toLocaleLowerCase(lang === "id" ? "id-ID" : "en-US").includes(term));
  }, [category, content.articles, lang, search, year]);

  return (
    <>
      <PageSeo page="publications" /><PlainPageHero eyebrow={page.eyebrow} title={page.title} body={page.body} />
      <section className="publications-section section-space"><div className="page-wrap">
        <div className="article-filters">
          <div className="article-filters__search"><label htmlFor="article-search" className="sr-only">{ui.searchArticles}</label><Search size={21} strokeWidth={1.8} aria-hidden="true" /><input id="article-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={ui.searchPlaceholder} /></div>
          <div className="article-filters__year"><label htmlFor="article-year" className="sr-only">{ui.filterYear}</label><select id="article-year" value={year} onChange={(event) => setYear(event.target.value)}><option value="all">{ui.allYears}</option>{years.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={17} aria-hidden="true" /></div>
        </div>
        <div className="article-filter-row"><div className="category-tabs" role="group" aria-label={ui.filterCategory}>{(["all", "edukasi", "riset", "kabar", "opini"] as const).map((item) => <button type="button" key={item} className={category === item ? "is-active" : ""} aria-pressed={category === item} onClick={() => setCategory(item)}>{item === "all" ? ui.allCategories : categoryName(item, lang)}</button>)}</div><span className="article-filter-row__count">{articles.length} {ui.articlesFound}</span></div>
        {articles.length > 0 ? <div className="article-grid article-grid--listing">{articles.map((article) => <ArticleCard key={article.slug} article={article} />)}</div> : <div className="empty-results"><h2>{ui.noArticles}</h2><p>{ui.noArticlesDetail}</p><button type="button" onClick={() => { setSearch(""); setCategory("all"); setYear("all"); }}>{ui.resetFilters}<ArrowRight size={18} aria-hidden="true" /></button></div>}
      </div></section>
    </>
  );
}

function ArticleDetailPage() {
  const { slug } = useParams();
  const { lang, content, ui } = useSite();
  const article = content.articles.find((item) => item.slug === slug);
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");
  if (!article) return <NotFoundPage />;
  const related = [...content.articles].filter((item) => item.slug !== article.slug).sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || "")).slice(0, 2);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: pick(article!.title, lang), url });
      else { await navigator.clipboard.writeText(url); setShareState("copied"); }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareState("error");
    }
  }

  return (
    <>
      <Seo title={pick(article.metaTitle || article.title, lang) + (article.metaTitle ? "" : " | GAHARU")} description={pick(article.metaDescription || article.excerpt, lang)} image={article.cover.url} type="article" article={article} />
      <header className="article-header">
        <div className="article-header__inner">
          <Link className="back-link" to={pathFor(lang, "/publikasi")}><ArrowLeft size={18} aria-hidden="true" />{ui.backToArticles}</Link>
          <div className="article-header__meta">
            <span>{categoryName(article.category, lang)}</span>
            {article.publishedAt && <span>{formatDate(article.publishedAt, lang)}</span>}
            {article.readTime && <span>{article.readTime} {ui.minRead}</span>}
          </div>
          <h1>{pick(article.title, lang)}</h1>
          <p className="article-header__excerpt">{pick(article.excerpt, lang)}</p>
          {article.authorName && <div className="article-byline"><strong>{pick(article.authorName, lang)}</strong>{article.authorRole && <span>{pick(article.authorRole, lang)}</span>}</div>}
          {article.authorBio && <p className="article-header__bio">{pick(article.authorBio, lang)}</p>}
          {article.category === "opini" && lang === "en" && <p className="article-translation-note">{ui.opinionEnglishNotice}</p>}
        </div>
      </header>
      <figure className="article-cover page-wrap"><Photo image={article.cover} sizes="(max-width: 700px) 100vw, 85vw" priority /><PhotoCaption image={article.cover} showNote /></figure>
      <article className="article-body">
        {article.category === "opini" && <aside className="article-opinion-note"><strong>{ui.opinionLabel}</strong><p>{article.editorialNote ? pick(article.editorialNote, lang) : ui.opinionDisclaimer}</p></aside>}
        <Paragraphs value={pick(article.body, lang)} />
        <div className="article-share"><span>{ui.shareArticle}</span><button type="button" onClick={share}><Share2 size={17} aria-hidden="true" />{ui.shareLink}</button><span className="article-share__feedback" role="status">{shareState === "copied" ? <><Check size={15} aria-hidden="true" />{ui.copied}</> : shareState === "error" ? ui.copyFailed : ""}</span></div>
      </article>
      <section className="related-stories section-space"><div className="page-wrap"><div className="section-heading"><div><p className="eyebrow">{ui.navPublications}</p><h2 className="section-title">{ui.latestStories}</h2></div><TextLink to={pathFor(lang, "/publikasi")}>{ui.allArticles}</TextLink></div><div className="article-grid article-grid--related">{related.map((item) => <ArticleCard key={item.slug} article={item} />)}</div></div></section>
    </>
  );
}

const villages = [
  { name: "Lahaji", query: "Desa Lahaji, Napano Kusambi, Muna Barat, Sulawesi Tenggara" },
  { name: "Umba", query: "Desa Umba, Napano Kusambi, Muna Barat, Sulawesi Tenggara" },
  { name: "Lemoambo", query: "Desa Lemoambo, Kusambi, Muna Barat, Sulawesi Tenggara" },
  { name: "Kasakamu", query: "Desa Kasakamu, Kusambi, Muna Barat, Sulawesi Tenggara" },
];

function googleMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function GoogleMapEmbed({ query, title, zoom = 12 }: { query: string; title: string; zoom?: number }) {
  const { lang } = useSite();
  const key = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY?.trim();
  const src = key
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}&zoom=${zoom}&language=${lang}&region=ID`
    : `https://maps.google.com/maps?hl=${lang}&q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;

  return (
    <div className="google-map">
      <iframe
        key={`${lang}-${query}`}
        src={src}
        title={title}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}

function MapPage() {
  const { lang, content, ui } = useSite();
  const [selected, setSelected] = useState("Lahaji");
  const page = content.site.mapPage;
  const selectedVillage = villages.find((village) => village.name === selected) || villages[0];

  return (
    <>
      <PageSeo page="map" /><PlainPageHero eyebrow={page.eyebrow} title={page.title} body={page.body} />
      <section className="national-scope" aria-label={ui.workArea}>
        <div className="page-wrap national-scope__inner">
          <div><p className="eyebrow">{ui.workArea}</p><h2>{pick(content.site.workArea.scope, lang)}</h2></div>
          <p>{pick(content.site.workArea.note, lang)}</p>
        </div>
      </section>
      <section className="map-page-section section-space"><div className="page-wrap map-page-section__grid">
        <div>
          <GoogleMapEmbed query={selectedVillage.query} title={`${ui.googleMapTitle}: ${selected}`} />
          <div className="map-page-section__under-map">
            <p className="map-page-section__note">{ui.mapIllustration}</p>
            <a className="map-external-link" href={googleMapsSearchUrl(selectedVillage.query)} target="_blank" rel="noopener noreferrer">
              {ui.openInGoogleMaps}<ExternalLink size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="map-page-info"><p className="eyebrow">{ui.localCaseStudy}</p><h2 className="section-title">{ui.fourVillages}</h2><p>{ui.subdistricts}</p>
          <div className="village-list" aria-label={ui.selectVillage}>{villages.map((village, index) => <button key={village.name} type="button" className={selected === village.name ? "is-selected" : ""} onClick={() => setSelected(village.name)} aria-pressed={selected === village.name}><span>0{index + 1}</span><strong>{village.name}</strong><ArrowUpRight size={18} aria-hidden="true" /></button>)}</div>
          <div className="village-detail" aria-live="polite"><MapPin size={18} strokeWidth={1.6} aria-hidden="true" /><div><strong>{lang === "id" ? "Desa" : "Village"} {selected}</strong><p>{ui.mapDetail}</p></div></div>
          <TextLink to={pathFor(lang, "/program/rehabilitasi-mangrove-muna-barat")}>{ui.mapToProgram}</TextLink>
        </div>
      </div></section>
    </>
  );
}

function ContactForm({ subject = "contact" }: { subject?: "contact" | "partner" }) {
  const { ui } = useSite();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "local">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const formData = new FormData(form);

    if (supabase) {
      setStatus("loading");
      const row = {
        form_type: subject,
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        organization: String(formData.get("organization") || "") || null,
        message: String(formData.get("message") || ""),
      };
      const { error } = await supabase.from(messagesTable).insert(row);
      if (!error) {
        form.reset();
        setStatus("success");
        return;
      }
      // Table missing / RLS problem: fall back to the Netlify form flow below.
      console.warn("Supabase insert failed; falling back to Netlify form flow.", error.message);
    }

    const netlifyReady = import.meta.env.VITE_NETLIFY_FORMS_ENABLED === "true" || window.location.hostname.endsWith(".netlify.app");
    if (!netlifyReady) { setStatus("local"); return; }
    setStatus("loading");
    const body = new URLSearchParams();
    formData.forEach((value, key) => { if (typeof value === "string") body.append(key, value); });
    try {
      const response = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
      if (!response.ok) throw new Error("Form submission failed");
      form.reset();
      setStatus("success");
    } catch { setStatus("error"); }
  }

  return (
    <form className="contact-form" name="gaharu-contact" method="POST" action="/" data-netlify="true" data-netlify-honeypot="bot-field" onSubmit={handleSubmit}>
      <input type="hidden" name="form-name" value="gaharu-contact" />
      <input type="hidden" name="subject" value={subject === "partner" ? ui.formSubjectPartner : ui.formSubjectContact} />
      <p className="honeypot" aria-hidden="true"><label>{ui.formHoneypot}<input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
      <div className="form-row"><label htmlFor={`${subject}-name`}>{ui.formName}<input id={`${subject}-name`} name="name" type="text" autoComplete="name" required maxLength={120} /></label><label htmlFor={`${subject}-email`}>{ui.formEmail}<input id={`${subject}-email`} name="email" type="email" autoComplete="email" required maxLength={180} /></label></div>
      <label htmlFor={`${subject}-organization`}>{ui.formOrganization} <span>({ui.formOrganizationHint})</span><input id={`${subject}-organization`} name="organization" type="text" autoComplete="organization" maxLength={180} /></label>
      <label htmlFor={`${subject}-message`}>{ui.formMessage}<textarea id={`${subject}-message`} name="message" rows={5} minLength={10} maxLength={4000} placeholder={ui.formMessagePlaceholder} required /></label>
      <div className="contact-form__bottom"><button className="action-link action-link--forest" type="submit" disabled={status === "loading"}><span>{status === "loading" ? ui.formSubmitting : ui.formSubmit}</span><ArrowUpRight size={18} aria-hidden="true" /></button><p>{ui.responseNote}</p></div>
      <p className={`form-feedback${status === "success" ? " form-feedback--success" : ""}`} role="status" aria-live="polite">{status === "success" ? ui.formSuccess : status === "error" ? ui.formError : status === "local" ? ui.formLocal : ""}</p>
    </form>
  );
}

function PartnershipPage() {
  const { lang, content, ui } = useSite();
  const page = content.site.partnershipPage;
  const ways = [[ui.partnerWay1, ui.partnerWay1Body], [ui.partnerWay2, ui.partnerWay2Body], [ui.partnerWay3, ui.partnerWay3Body]];
  return (
    <>
      <PageSeo page="partnership" image={page.image.url} /><PhotoPageHero eyebrow={page.eyebrow} title={page.title} body={page.body} image={page.image} />
      <section className="partnership-approach section-space"><div className="page-wrap partnership-approach__grid">
        <Reveal><p className="eyebrow">{ui.navPartnership} / GAHARU</p><h2 className="section-title">{pick(page.approachTitle, lang)}</h2><p className="section-lead">{pick(page.approachBody, lang)}</p></Reveal>
        <div className="partnership-ways">{ways.map(([title, body], index) => <Reveal key={title} delay={index * 90} className="partnership-way"><span>0{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div></Reveal>)}</div>
      </div></section>
      {page.partnerTypes?.length > 0 && <section className="partner-types-section section-space" aria-labelledby="partner-types-title">
        <div className="page-wrap partner-types-section__inner">
          <Reveal className="partner-types-section__intro">
            <p className="eyebrow eyebrow--gold">{ui.navPartnership} / GAHARU</p>
            <h2 id="partner-types-title" className="section-title">{pick(page.partnerTypesTitle, lang)}</h2>
            <p>{pick(page.partnerTypesIntro, lang)}</p>
          </Reveal>
          <ol className="partner-types-list">
            {page.partnerTypes.map((partner, index) => <Reveal key={`${partner.id}-${index}`} delay={index * 55}>
              <li><span>{String(index + 1).padStart(2, "0")}</span><strong>{pick(partner, lang)}</strong><ArrowUpRight size={20} aria-hidden="true" /></li>
            </Reveal>)}
          </ol>
        </div>
      </section>}
      <section className="form-section section-space"><div className="page-wrap form-section__grid"><div><p className="eyebrow">{ui.navContact}</p><h2 className="section-title">{ui.partnershipFormTitle}</h2><p className="section-lead">{ui.partnershipFormBody}</p></div><ContactForm subject="partner" /></div></section>
    </>
  );
}

function ContactPage() {
  const { lang, content, ui } = useSite();
  const page = content.site.contactPage;
  const officeQuery = content.site.office.address.id;

  return (
    <>
      <PageSeo page="contact" />
      <PlainPageHero eyebrow={page.eyebrow} title={page.title} body={page.body} />
      <section className="contact-page-section section-space">
        <div className="page-wrap contact-page-section__grid">
          <div className="contact-page-section__info">
            <p className="eyebrow">{ui.officeLabel}</p>
            <h2>{pick(content.site.office.address, lang)}</h2>
            <a href={googleMapsSearchUrl(officeQuery)} target="_blank" rel="noopener noreferrer" className="text-link">
              <span>{ui.openAreaMap}</span><ExternalLink size={18} aria-hidden="true" />
            </a>
            <div className="contact-direct">
              {content.site.office.contactPerson && <div><span>{ui.contactPerson}</span><strong>{content.site.office.contactPerson}</strong></div>}
              {content.site.office.phone && <div><span>{ui.phoneLabel}</span><a href={phoneHref(content.site.office.phone)}>{content.site.office.phone}</a></div>}
              {content.site.office.email && <div><span>{ui.emailLabel}</span><a href={`mailto:${content.site.office.email}`}>{content.site.office.email}</a></div>}
            </div>
            <div className="contact-page-section__map">
              <GoogleMapEmbed query={officeQuery} title={`${ui.googleMapTitle}: Raha`} zoom={12} />
              <p>{ui.officeMapNote}</p>
            </div>
          </div>
          <div className="contact-page-section__form">
            <h2>{ui.contactFormTitle}</h2><p>{ui.contactFormBody}</p><ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}

function CreditsPage() {
  const { lang, content, ui } = useSite();
  const allImages = [content.site.hero.image, content.site.aboutPreview.image, content.site.partnerCta.image, content.site.aboutPage.image, content.site.programPage.image, content.site.partnershipPage.image, ...content.programs.flatMap((program) => [program.cover, ...program.gallery]), ...content.articles.map((article) => article.cover)];
  const images = [...new Map(allImages.filter((image) => image?.url).map((image) => [image.url, image])).values()];
  return (
    <>
      <Seo title={`${ui.photoCreditsTitle} | GAHARU`} description={ui.photoCreditsBody} />
      <section className="plain-page-hero"><div className="page-wrap"><p className="eyebrow">GAHARU</p><h1>{ui.photoCreditsTitle}</h1><p className="plain-page-hero__body">{ui.photoCreditsBody}</p></div></section>
      <section className="credits-section section-space"><div className="page-wrap"><p className="credits-section__note">{ui.footerPhotoNote}</p><div className="credits-list">{images.map((image, index) => <div key={image.url}><span>{String(index + 1).padStart(2, "0")}</span><p>{pick(image.alt, lang)}</p><a href={image.creditUrl || image.url} target="_blank" rel="noopener noreferrer">{image.credit?.replace("(foto ilustrasi)", lang === "en" ? "(illustrative photo)" : "(foto ilustrasi)") || "Photo source"}<ArrowUpRight size={16} aria-hidden="true" /></a></div>)}</div></div></section>
    </>
  );
}

function NotFoundPage() {
  const { lang, ui } = useSite();
  return <section className="not-found page-wrap"><Seo title={`${ui.notFoundTitle} | GAHARU`} description={ui.notFoundBody} /><p className="eyebrow">404 / GAHARU</p><h1>{ui.notFoundTitle}</h1><p>{ui.notFoundBody}</p><ActionLink to={pathFor(lang)} variant="forest">{ui.backHome}</ActionLink></section>;
}

function LocalizedSite({ content }: { content: AppContent }) {
  const { lang: parameter } = useParams();
  const lang: Language = parameter === "en" ? "en" : "id";
  const context = useMemo(() => ({ lang, content, ui: copy[lang] }), [lang, content]);
  if (parameter !== "id" && parameter !== "en") return <Navigate to="/id" replace />;

  return (
    <SiteContext.Provider value={context}>
      <ScrollToTop /><a className="skip-link" href="#main-content">{lang === "id" ? "Lewati ke konten" : "Skip to content"}</a><Header />
      <main id="main-content"><Routes>
        <Route index element={<Home />} /><Route path="tentang-kami" element={<AboutPage />} /><Route path="program" element={<ProgramsPage />} /><Route path="program/:slug" element={<ProgramDetailPage />} /><Route path="publikasi" element={<PublicationsPage />} /><Route path="publikasi/:slug" element={<ArticleDetailPage />} /><Route path="wilayah-kerja" element={<MapPage />} /><Route path="kemitraan" element={<PartnershipPage />} /><Route path="kontak" element={<ContactPage />} /><Route path="kredit-foto" element={<CreditsPage />} /><Route path="*" element={<NotFoundPage />} />
      </Routes></main><Footer />
    </SiteContext.Provider>
  );
}

export default function SiteApp() {
  const [content, setContent] = useState<AppContent>(fallbackContent);
  useEffect(() => {
    const customLogo = import.meta.env.VITE_GAHARU_LOGO_URL;
    const favicon = document.getElementById("gaharu-favicon") as HTMLLinkElement | null;
    if (favicon) {
      favicon.href = customLogo || fallbackLogoUrl;
      favicon.type = !customLogo || customLogo.toLowerCase().includes(".svg") ? "image/svg+xml" : "image/png";
    }

    let mounted = true;
    fetchSiteContent().then((data) => { if (mounted && data) setContent(data); }).catch(() => { /* Keep the fallback if the CMS is temporarily unavailable. */ });
    return () => { mounted = false; };
  }, []);

  return <BrowserRouter><Routes><Route path="/" element={<Navigate to="/id" replace />} /><Route path="/:lang/*" element={<LocalizedSite content={content} />} /><Route path="*" element={<Navigate to="/id" replace />} /></Routes></BrowserRouter>;
}