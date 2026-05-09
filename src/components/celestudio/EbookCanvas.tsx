'use client';

import { CSSProperties, ReactNode } from 'react';
import type { Block } from '@/lib/celestudio/blocks';
import { DESIGN_SYSTEMS, type DesignSystem, type DesignSystemSlug, type DesignTokens } from '@/lib/celestudio/design-systems';
import { CheckSquare, Square, Lightbulb, Info, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';

interface EbookCanvasProps {
  blocks: Block[];
  designSystem: DesignSystemSlug;
  mode?: 'light' | 'dark';
  zoom?: number;
}

export function EbookCanvas({ blocks, designSystem, mode = 'light', zoom = 1 }: EbookCanvasProps) {
  const ds = DESIGN_SYSTEMS[designSystem] ?? DESIGN_SYSTEMS['minimal-editorial'];
  const tokens = mode === 'dark' ? ds.dark : ds.light;

  const canvasStyle: CSSProperties = {
    background: tokens.page,
    color: tokens.text,
    fontFamily: ds.fontBody,
    letterSpacing: ds.letterSpacingBody,
    lineHeight: ds.lineHeightBody,
    transform: zoom !== 1 ? `scale(${zoom})` : undefined,
    transformOrigin: 'top left',
    width: zoom !== 1 ? `${100 / zoom}%` : undefined,
    position: 'relative',
  };

  const innerStyle: CSSProperties = {
    maxWidth: ds.pageMaxWidth,
    margin: '0 auto',
    padding: '4rem 1.5rem 6rem',
    position: 'relative',
  };

  return (
    <div style={canvasStyle} className="celestudio-canvas">
      <div style={innerStyle}>
        {blocks.map((block, i) => (
          <BlockNode
            key={block.id || i}
            block={block}
            ds={ds}
            tokens={tokens}
            index={i}
            blocks={blocks}
          />
        ))}
      </div>
    </div>
  );
}

interface BlockProps {
  block: Block;
  ds: DesignSystem;
  tokens: DesignTokens;
  index: number;
  blocks: Block[];
}

function BlockNode({ block, ds, tokens, index, blocks }: BlockProps) {
  const wrapperStyle: CSSProperties = {
    marginTop: index === 0 ? 0 : block.type === 'chapter_intro' ? ds.sectionSpacing : '2.5rem',
    marginBottom: block.type === 'chapter_intro' ? ds.sectionSpacing : 0,
  };
  return <div style={wrapperStyle}>{renderBlock(block, ds, tokens, index, blocks)}</div>;
}

function renderBlock(block: Block, ds: DesignSystem, tokens: DesignTokens, index: number, blocks: Block[]) {
  switch (block.type) {
    case 'cover':           return <Cover block={block} ds={ds} tokens={tokens} />;
    case 'chapter_intro':   return <ChapterIntro block={block} ds={ds} tokens={tokens} />;
    case 'heading':         return <Heading block={block} ds={ds} tokens={tokens} />;
    case 'paragraph':       return <Paragraph block={block} ds={ds} tokens={tokens} prevBlock={blocks[index - 1]} />;
    case 'quote':           return <BlockQuote block={block} ds={ds} tokens={tokens} />;
    case 'callout':         return <Callout block={block} ds={ds} tokens={tokens} />;
    case 'checklist':       return <Checklist block={block} ds={ds} tokens={tokens} />;
    case 'list':            return <ListBlock block={block} ds={ds} tokens={tokens} />;
    case 'key_stat':        return <KeyStat block={block} ds={ds} tokens={tokens} />;
    case 'framework':       return <Framework block={block} ds={ds} tokens={tokens} />;
    case 'divider':         return <Divider block={block} ds={ds} tokens={tokens} />;
    case 'cta':             return <Cta block={block} ds={ds} tokens={tokens} />;
    default: return null;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

// Pull the first character off a string for use as a drop cap.
function splitDropCap(text: string): { first: string; rest: string } {
  const trimmed = text.trimStart();
  if (!trimmed) return { first: '', rest: text };
  const match = trimmed.match(/^[\p{L}\p{N}]/u);
  if (!match) return { first: '', rest: text };
  return { first: trimmed[0], rest: trimmed.slice(1) };
}

// Decorative cover artwork — abstract organic SVG composition tinted to design system.
function CoverDecoration({ ds, tokens }: { ds: DesignSystem; tokens: DesignTokens }) {
  // Different ornament style per design system
  if (ds.slug === 'luxury-black-gold') {
    return (
      <svg className="celestudio-cover-art" viewBox="0 0 200 200" style={{ position: 'absolute', top: -10, right: -10, width: 280, height: 280, opacity: 0.45, pointerEvents: 'none' }} aria-hidden="true">
        <circle cx="135" cy="65" r="58" fill={tokens.accent} fillOpacity="0.18" />
        <circle cx="135" cy="65" r="38" fill={tokens.accent} fillOpacity="0.25" />
        <circle cx="135" cy="65" r="20" fill={tokens.accent} fillOpacity="0.4" />
        <path d="M0 165 Q 60 130 130 155 T 200 145" stroke={tokens.accent} strokeOpacity="0.3" strokeWidth="0.8" fill="none" />
      </svg>
    );
  }
  if (ds.slug === 'futuristic-ai') {
    return (
      <svg className="celestudio-cover-art" viewBox="0 0 200 200" style={{ position: 'absolute', top: -10, right: -20, width: 320, height: 320, opacity: 0.35, pointerEvents: 'none' }} aria-hidden="true">
        <defs>
          <radialGradient id="rg-fa" cx="0.7" cy="0.3" r="0.6">
            <stop offset="0%" stopColor={tokens.accent} stopOpacity="0.7" />
            <stop offset="60%" stopColor={tokens.accent} stopOpacity="0.1" />
            <stop offset="100%" stopColor={tokens.accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="140" cy="60" r="80" fill="url(#rg-fa)" />
        <g stroke={tokens.accent} strokeOpacity="0.4" strokeWidth="0.5" fill="none">
          <line x1="0" y1="40" x2="200" y2="40" />
          <line x1="0" y1="80" x2="200" y2="80" />
          <line x1="0" y1="120" x2="200" y2="120" />
          <line x1="0" y1="160" x2="200" y2="160" />
        </g>
      </svg>
    );
  }
  // default: editorial / startup / wellness / corporate
  return (
    <svg className="celestudio-cover-art" viewBox="0 0 200 200" style={{ position: 'absolute', top: -20, right: -20, width: 300, height: 300, opacity: 0.4, pointerEvents: 'none' }} aria-hidden="true">
      <circle cx="135" cy="65" r="55" fill={tokens.accent} fillOpacity="0.22" />
      <circle cx="155" cy="100" r="32" fill={tokens.accent} fillOpacity="0.35" />
      <circle cx="115" cy="130" r="20" fill={tokens.accent} fillOpacity="0.18" />
      <path d="M40 175 Q 100 120 175 175" stroke={tokens.accent} strokeOpacity="0.35" strokeWidth="1.2" fill="none" />
      <path d="M20 155 Q 80 95 165 150" stroke={tokens.accent} strokeOpacity="0.18" strokeWidth="0.8" fill="none" />
    </svg>
  );
}

// Halftone dot grid for editorial / luxury covers
function CoverHalftone({ tokens }: { tokens: DesignTokens }) {
  return (
    <svg viewBox="0 0 80 80" style={{ position: 'absolute', bottom: -8, left: -8, width: 100, height: 100, opacity: 0.22, pointerEvents: 'none' }} aria-hidden="true">
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 6 }).map((_, col) => (
          <circle key={`${row}-${col}`} cx={6 + col * 12} cy={6 + row * 12} r={1.6 - row * 0.18} fill={tokens.accent} />
        ))
      )}
    </svg>
  );
}

// Tiny ornament glyph used between sections — flexes per design system
function ornamentGlyph(ds: DesignSystem): string {
  if (ds.slug === 'luxury-black-gold') return '✦';
  if (ds.slug === 'wellness-soft') return '❋';
  if (ds.slug === 'futuristic-ai') return '◇';
  if (ds.slug === 'corporate-clean') return '§';
  return '·';
}

// Author initials for the cover author chip
function getInitials(name?: string): string {
  if (!name) return '★';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? '')
    .join('') || '★';
}

// ── Cover ───────────────────────────────────────────────────────────────────

function Cover({ block, ds, tokens }: { block: Extract<Block, { type: 'cover' }>; ds: DesignSystem; tokens: DesignTokens }) {
  // Prefer the topical Unsplash photo when present (server-side AI suggested
  // the search query, server fetched the URL). Fall back to deterministic
  // Picsum when Unsplash isn't configured or didn't return a result.
  const seed = encodeURIComponent(block.title.slice(0, 40).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'celebio');
  const photoUrl = block.imageUrl || `https://picsum.photos/seed/${seed}/1600/2000`;

  // The overlay is what makes text readable on top of the photo, AND it carries
  // the design system's brand color into the cover. Different recipe per system.
  const overlayGradient = ds.slug === 'modern-startup'
    ? `linear-gradient(135deg, ${tokens.accent}E6 0%, ${blend(tokens.accent, '#EC4899', 0.5)}CC 100%)`
    : ds.slug === 'futuristic-ai'
    ? `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(5,5,7,0.92) 100%), radial-gradient(circle at 70% 30%, ${tokens.accent}55, transparent 60%)`
    : ds.slug === 'luxury-black-gold'
    ? `linear-gradient(180deg, rgba(10,9,8,0.55) 0%, rgba(10,9,8,0.95) 100%)`
    : ds.slug === 'wellness-soft'
    ? `linear-gradient(180deg, rgba(193,154,117,0.4) 0%, rgba(58,46,34,0.85) 100%)`
    : ds.slug === 'corporate-clean'
    ? `linear-gradient(180deg, rgba(15,23,42,0.45) 0%, rgba(15,23,42,0.92) 100%)`
    : /* minimal-editorial */ `linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.85) 100%)`;

  // On a photo-darkened background, white-ish text is the most readable choice
  // for every design system.
  const onCoverText = '#FFFFFF';
  const onCoverMuted = 'rgba(255,255,255,0.88)';
  const onCoverFaint = 'rgba(255,255,255,0.65)';
  const accentOnCover = ds.slug === 'luxury-black-gold' || ds.slug === 'wellness-soft' ? tokens.accent : '#FFFFFF';

  const initials = getInitials(block.author);

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: ds.blockRadius,
        marginBottom: '1rem',
        minHeight: '38rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        boxShadow: '0 30px 60px -20px rgba(0,0,0,0.5), 0 18px 36px -18px rgba(0,0,0,0.4)',
      }}
    >
      {/* Layer 1: Real photograph */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url('${photoUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          // Subtle desaturation for editorial look on certain design systems
          filter: ds.slug === 'corporate-clean' || ds.slug === 'minimal-editorial' ? 'grayscale(0.2) contrast(1.05)' :
                  ds.slug === 'luxury-black-gold' ? 'grayscale(0.6) contrast(1.1) brightness(0.9)' :
                  'none',
        }}
      />

      {/* Layer 2: Gradient overlay — brand color + readability */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: overlayGradient }} />

      {/* Layer 3: Decorative SVG art on top of overlay */}
      <CoverDecoration ds={ds} tokens={{ ...tokens, accent: accentOnCover }} />
      {(ds.slug === 'minimal-editorial' || ds.slug === 'luxury-black-gold' || ds.slug === 'corporate-clean') && (
        <CoverHalftone tokens={{ ...tokens, accent: accentOnCover }} />
      )}

      <div style={{ position: 'relative', padding: '5rem 2.5rem 4rem' }}>
        {/* Edition kicker (always light over the photographic backdrop) */}
        <p style={{
          margin: 0,
          fontSize: '0.7rem',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: accentOnCover,
          fontFamily: ds.fontMono || ds.fontBody,
          fontWeight: 600,
        }}>
          {block.edition || 'CeleStudio Edition'}
        </p>

        {/* Title — dramatic typography */}
        <h1
          style={{
            fontFamily: ds.fontHeading,
            fontSize: `${4.4 * ds.headingScale}rem`,
            fontWeight: ds.slug === 'luxury-black-gold' ? 400 : 600,
            lineHeight: 1.0,
            letterSpacing: ds.letterSpacingHeading,
            color: onCoverText,
            margin: '1.5rem 0 0',
            maxWidth: '14em',
            textWrap: 'balance' as const,
          }}
        >
          {block.title}
        </h1>

        {/* Subtitle */}
        {block.subtitle && (
          <p style={{
            fontFamily: ds.slug === 'luxury-black-gold' ? ds.fontHeading : ds.fontBody,
            fontStyle: ds.slug === 'luxury-black-gold' ? 'italic' : 'normal',
            fontSize: '1.25rem',
            lineHeight: 1.45,
            color: onCoverMuted,
            margin: '1.75rem 0 0',
            maxWidth: '32em',
          }}>
            {block.subtitle}
          </p>
        )}

        {/* Author chip with avatar — glassmorphic so it reads over the photo */}
        {block.author && (
          <div style={{
            marginTop: '3rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.4rem 0.75rem 0.4rem 0.4rem',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}>
            <div style={{
              width: '1.75rem',
              height: '1.75rem',
              borderRadius: '999px',
              background: `linear-gradient(135deg, ${tokens.accent} 0%, ${blend(tokens.accent, '#FCA5A5', 0.5)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: tokens.accentText,
              fontFamily: ds.fontHeading,
            }}>
              {initials}
            </div>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: onCoverText,
              letterSpacing: '0.01em',
            }}>
              {block.author}
            </span>
          </div>
        )}

        {/* Bottom row: barcode-y identifier + ornament */}
        <div style={{
          marginTop: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.7rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: onCoverFaint,
          fontFamily: ds.fontMono || ds.fontBody,
        }}>
          <span style={{ width: '2rem', height: 1, background: onCoverFaint, opacity: 0.5 }} />
          <span>{ornamentGlyph(ds)}  Cele.bio  {ornamentGlyph(ds)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Chapter intro ───────────────────────────────────────────────────────────

function ChapterIntro({ block, ds, tokens }: { block: Extract<Block, { type: 'chapter_intro' }>; ds: DesignSystem; tokens: DesignTokens }) {
  const num = String(block.chapterNumber).padStart(2, '0');
  // Prefer AI-suggested topical Unsplash photo, fall back to deterministic Picsum
  // (seeded with title + chapter number so each chapter is visually distinct).
  const seed = encodeURIComponent(`${block.title.slice(0, 30).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-ch${num}` || `chapter-${num}`);
  const photoUrl = block.imageUrl || `https://picsum.photos/seed/${seed}/1600/600`;
  return (
    <div style={{ position: 'relative', padding: '4rem 0 1rem' }}>
      {/* Chapter hero image — horizontal strip with gradient fade */}
      <figure style={{
        position: 'relative',
        margin: '0 0 3.5rem',
        height: '14rem',
        borderRadius: ds.blockRadius,
        overflow: 'hidden',
        boxShadow: '0 16px 32px -16px rgba(0,0,0,0.35)',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url('${photoUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: ds.slug === 'corporate-clean' || ds.slug === 'minimal-editorial' ? 'grayscale(0.15)' :
                  ds.slug === 'luxury-black-gold' ? 'grayscale(0.5) brightness(0.85)' :
                  'none',
        }} />
        {/* Bottom-fade overlay so the chapter number badge can sit on top */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, transparent 40%, ${tokens.page}E0 100%)`,
        }} />
        {/* Chapter number badge sitting on the bottom-right of the photo */}
        <div style={{
          position: 'absolute',
          right: '1.25rem',
          bottom: '1.25rem',
          padding: '0.5rem 0.875rem',
          background: tokens.surface,
          borderRadius: ds.blockRadius,
          border: `1px solid ${tokens.border}`,
          fontFamily: ds.fontMono || ds.fontBody,
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.25em',
          color: tokens.accent,
          textTransform: 'uppercase',
        }}>
          Ch · {num}
        </div>
      </figure>
      {/* Massive watermark chapter number behind everything */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          fontFamily: ds.fontHeading,
          fontSize: '14rem',
          fontWeight: 700,
          lineHeight: 0.85,
          color: tokens.accent,
          opacity: 0.06,
          letterSpacing: '-0.05em',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {num}
      </div>

      {/* Eyebrow row */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
        <span style={{
          fontFamily: ds.fontMono || ds.fontBody,
          fontSize: '0.7rem',
          fontWeight: 600,
          color: tokens.accent,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
        }}>
          Chapter {num}
        </span>
        <div style={{ flex: 1, height: 1, background: tokens.divider, opacity: 0.4 }} />
        <span style={{ fontFamily: ds.fontHeading, fontSize: '1rem', color: tokens.divider, opacity: 0.7 }}>
          {ornamentGlyph(ds)}
        </span>
      </div>

      {/* Chapter title */}
      <h2 style={{
        position: 'relative',
        fontFamily: ds.fontHeading,
        fontSize: `${3.2 * ds.headingScale}rem`,
        fontWeight: ds.slug === 'luxury-black-gold' ? 400 : 600,
        lineHeight: 1.05,
        letterSpacing: ds.letterSpacingHeading,
        color: tokens.text,
        margin: 0,
        textWrap: 'balance' as const,
      }}>
        {block.title}
      </h2>

      {/* Subtitle */}
      {block.subtitle && (
        <p style={{
          position: 'relative',
          fontFamily: ds.fontHeading,
          fontSize: '1.5rem',
          fontStyle: 'italic',
          lineHeight: 1.4,
          color: tokens.textMuted,
          margin: '1rem 0 0',
        }}>
          {block.subtitle}
        </p>
      )}

      {/* Intro with drop cap */}
      {block.intro && <DropCapParagraph text={block.intro} ds={ds} tokens={tokens} mt="2.5rem" />}
    </div>
  );
}

// ── Drop cap paragraph (used for chapter intros + lead paragraphs) ──────────

function DropCapParagraph({ text, ds, tokens, mt }: { text: string; ds: DesignSystem; tokens: DesignTokens; mt?: string }) {
  const { first, rest } = splitDropCap(text);
  if (!first) return <p style={{ marginTop: mt, fontSize: '1.125rem', color: tokens.textMuted, lineHeight: 1.7 }}>{text}</p>;
  return (
    <p style={{
      marginTop: mt ?? 0,
      fontSize: '1.125rem',
      color: tokens.text,
      lineHeight: 1.7,
      maxWidth: '34em',
    }}>
      <span
        style={{
          float: 'left',
          fontFamily: ds.fontHeading,
          fontSize: '4.5rem',
          fontWeight: ds.slug === 'luxury-black-gold' ? 400 : 700,
          lineHeight: 0.85,
          color: tokens.accent,
          padding: '0.5rem 0.5rem 0 0',
          marginRight: '0.25rem',
          letterSpacing: '-0.02em',
        }}
      >
        {first}
      </span>
      {rest}
    </p>
  );
}

// ── Heading ─────────────────────────────────────────────────────────────────

function Heading({ block, ds, tokens }: { block: Extract<Block, { type: 'heading' }>; ds: DesignSystem; tokens: DesignTokens }) {
  const sizes = { 1: 2.5, 2: 1.875, 3: 1.4 };
  const size = sizes[block.level] * ds.headingScale;
  return (
    <div style={{ marginTop: '3.5rem' }}>
      {block.eyebrow && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <span style={{ width: '1.5rem', height: 1, background: tokens.accent }} />
          <span style={{
            fontFamily: ds.fontMono || ds.fontBody,
            fontSize: '0.7rem',
            color: tokens.accent,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            {block.eyebrow}
          </span>
        </div>
      )}
      <h3 style={{
        fontFamily: ds.fontHeading,
        fontSize: `${size}rem`,
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: ds.letterSpacingHeading,
        color: tokens.text,
        margin: 0,
        textWrap: 'balance' as const,
      }}>
        {block.text}
      </h3>
    </div>
  );
}

// ── Paragraph ───────────────────────────────────────────────────────────────

function Paragraph({ block, ds, tokens, prevBlock }: { block: Extract<Block, { type: 'paragraph' }>; ds: DesignSystem; tokens: DesignTokens; prevBlock?: Block }) {
  // Lead paragraph just after a chapter_intro: drop cap treatment
  const isAfterChapterIntro = prevBlock?.type === 'chapter_intro';
  const isLead = block.emphasis === 'lead';
  const shouldDropCap = isLead && isAfterChapterIntro;

  if (shouldDropCap) {
    return <DropCapParagraph text={block.text} ds={ds} tokens={tokens} mt="1.5rem" />;
  }

  return (
    <p style={{
      fontSize: isLead ? '1.25rem' : '1.0625rem',
      color: tokens.text,
      lineHeight: ds.lineHeightBody,
      margin: '1.5rem 0',
      maxWidth: isLead ? '34em' : 'none',
      fontWeight: 400,
    }}>
      {block.text}
    </p>
  );
}

// ── Quote (giant decorative quote mark) ─────────────────────────────────────

function BlockQuote({ block, ds, tokens }: { block: Extract<Block, { type: 'quote' }>; ds: DesignSystem; tokens: DesignTokens }) {
  return (
    <figure style={{
      position: 'relative',
      margin: '4rem 0',
      padding: '2.5rem 1.5rem 2.5rem 5rem',
      background: tokens.calloutBg,
      borderRadius: ds.blockRadius,
      overflow: 'hidden',
    }}>
      {/* Giant decorative opening quote mark */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-1.5rem',
          left: '0.5rem',
          fontFamily: ds.fontHeading,
          fontSize: '10rem',
          lineHeight: 1,
          color: tokens.accent,
          opacity: 0.18,
          fontWeight: 700,
          userSelect: 'none',
        }}
      >
        “
      </span>

      <blockquote style={{
        position: 'relative',
        fontFamily: ds.fontHeading,
        fontSize: '1.625rem',
        fontStyle: ds.fontHeading.toLowerCase().includes('serif') || ds.fontHeading.includes('Cormorant') || ds.fontHeading.includes('Garamond') || ds.fontHeading.includes('Fraunces') || ds.fontHeading.includes('DM Serif') ? 'italic' : 'normal',
        fontWeight: ds.slug === 'luxury-black-gold' ? 400 : 500,
        lineHeight: 1.4,
        letterSpacing: ds.letterSpacingHeading,
        color: tokens.text,
        margin: 0,
      }}>
        {block.text}
      </blockquote>

      {(block.attribution || block.source) && (
        <figcaption style={{
          position: 'relative',
          marginTop: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <span style={{ width: '1.5rem', height: 1, background: tokens.accent }} />
          <span style={{ fontSize: '0.875rem', color: tokens.textMuted, letterSpacing: '0.02em' }}>
            {block.attribution && <span style={{ fontWeight: 600, color: tokens.text }}>{block.attribution}</span>}
            {block.source && <span style={{ fontStyle: 'italic' }}>{block.attribution ? ', ' : ''}{block.source}</span>}
          </span>
        </figcaption>
      )}
    </figure>
  );
}

// ── Callout ─────────────────────────────────────────────────────────────────

function Callout({ block, ds, tokens }: { block: Extract<Block, { type: 'callout' }>; ds: DesignSystem; tokens: DesignTokens }) {
  const variants = {
    info:    { Icon: Info,           tint: tokens.accent },
    tip:     { Icon: Lightbulb,      tint: '#10B981' },
    warning: { Icon: AlertTriangle,  tint: '#F59E0B' },
    insight: { Icon: Sparkles,       tint: tokens.accent },
  };
  const { Icon, tint } = variants[block.variant] || variants.info;

  return (
    <aside style={{
      position: 'relative',
      margin: '2.5rem 0',
      padding: '1.75rem 1.75rem 1.75rem 5rem',
      background: tokens.calloutBg,
      borderRadius: ds.blockRadius,
      overflow: 'hidden',
      border: `1px solid ${tokens.border}`,
    }}>
      {/* Left accent gradient strip */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '3.5rem',
        background: `linear-gradient(180deg, ${tint}25 0%, ${tint}10 100%)`,
        borderRight: `1px solid ${tint}30`,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '1.75rem',
      }}>
        <Icon size={22} color={tint} strokeWidth={1.6} />
      </div>

      <div style={{ position: 'relative' }}>
        {block.title && (
          <h4 style={{
            fontFamily: ds.fontHeading,
            fontSize: '1.0625rem',
            fontWeight: 700,
            margin: '0 0 0.5rem 0',
            color: tokens.text,
            letterSpacing: ds.letterSpacingHeading,
          }}>
            {block.title}
          </h4>
        )}
        <p style={{ margin: 0, fontSize: '1rem', color: tokens.text, lineHeight: 1.65 }}>{block.body}</p>
      </div>
    </aside>
  );
}

// ── Checklist ───────────────────────────────────────────────────────────────

function Checklist({ block, ds, tokens }: { block: Extract<Block, { type: 'checklist' }>; ds: DesignSystem; tokens: DesignTokens }) {
  return (
    <div style={{
      margin: '2.5rem 0',
      padding: '1.75rem',
      background: tokens.surface,
      border: `1px solid ${tokens.border}`,
      borderRadius: ds.blockRadius,
    }}>
      {block.title && (
        <h4 style={{ fontFamily: ds.fontHeading, fontSize: '1.125rem', fontWeight: 600, margin: '0 0 1rem 0', color: tokens.text }}>
          {block.title}
        </h4>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {block.items.map((item, i) => (
          <li key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.875rem',
            padding: '0.875rem 0',
            borderBottom: i < block.items.length - 1 ? `1px solid ${tokens.border}` : 'none',
          }}>
            {item.checked
              ? <CheckSquare size={20} color={tokens.accent} strokeWidth={1.75} style={{ flexShrink: 0, marginTop: 2 }} />
              : <Square size={20} color={tokens.textSubtle} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
            }
            <span style={{ fontSize: '1rem', color: tokens.text, lineHeight: 1.6 }}>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── List ────────────────────────────────────────────────────────────────────

function ListBlock({ block, ds, tokens }: { block: Extract<Block, { type: 'list' }>; ds: DesignSystem; tokens: DesignTokens }) {
  return (
    <div style={{ margin: '2rem 0' }}>
      {block.title && (
        <h4 style={{ fontFamily: ds.fontHeading, fontSize: '1.125rem', fontWeight: 600, margin: '0 0 1rem 0' }}>{block.title}</h4>
      )}
      {block.style === 'numbered' ? (
        <ol style={{ paddingLeft: 0, margin: 0, color: tokens.text, listStyle: 'none' }}>
          {block.items.map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0', alignItems: 'baseline' }}>
              <span style={{
                fontFamily: ds.fontHeading,
                color: tokens.accent,
                fontWeight: 700,
                fontSize: '1.0625rem',
                minWidth: '1.5rem',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: '1rem', lineHeight: 1.65 }}>{item}</span>
            </li>
          ))}
        </ol>
      ) : (
        <ul style={{ paddingLeft: 0, margin: 0, color: tokens.text, listStyle: 'none' }}>
          {block.items.map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: '0.875rem', padding: '0.5rem 0', alignItems: 'baseline' }}>
              <span style={{ color: tokens.accent, fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem' }}>—</span>
              <span style={{ fontSize: '1rem', lineHeight: 1.65 }}>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Key stat (massive numbers) ──────────────────────────────────────────────

function KeyStat({ block, ds, tokens }: { block: Extract<Block, { type: 'key_stat' }>; ds: DesignSystem; tokens: DesignTokens }) {
  return (
    <div style={{
      margin: '3.5rem 0',
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(block.stats.length, 3)}, 1fr)`,
      gap: '1.25rem',
    }}>
      {block.stats.map((stat, i) => (
        <div key={i} style={{
          position: 'relative',
          padding: '2.5rem 1.5rem 2rem',
          background: tokens.statBg,
          border: `1px solid ${tokens.border}`,
          borderRadius: ds.blockRadius,
          overflow: 'hidden',
        }}>
          {/* Accent gradient at top */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${tokens.accent} 0%, transparent 100%)` }} />
          <div style={{
            fontFamily: ds.fontHeading,
            fontSize: '4rem',
            fontWeight: 700,
            lineHeight: 1,
            color: tokens.accent,
            letterSpacing: '-0.04em',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {stat.value}
          </div>
          <div style={{
            marginTop: '0.75rem',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: tokens.text,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
            {stat.label}
          </div>
          {stat.description && (
            <p style={{ marginTop: '0.75rem', marginBottom: 0, fontSize: '0.875rem', color: tokens.textMuted, lineHeight: 1.55 }}>
              {stat.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Framework (steps with connector line) ───────────────────────────────────

function Framework({ block, ds, tokens }: { block: Extract<Block, { type: 'framework' }>; ds: DesignSystem; tokens: DesignTokens }) {
  return (
    <div style={{ margin: '3.5rem 0' }}>
      <h3 style={{
        fontFamily: ds.fontHeading,
        fontSize: `${1.875 * ds.headingScale}rem`,
        fontWeight: 600,
        margin: '0 0 0.75rem 0',
        letterSpacing: ds.letterSpacingHeading,
        color: tokens.text,
        textWrap: 'balance' as const,
      }}>
        {block.title}
      </h3>
      {block.description && (
        <p style={{ fontSize: '1.0625rem', color: tokens.textMuted, margin: '0 0 2rem 0', maxWidth: '34em', lineHeight: 1.6 }}>
          {block.description}
        </p>
      )}
      <div style={{ position: 'relative', marginTop: '1.5rem' }}>
        {/* Vertical connector line */}
        <div style={{
          position: 'absolute',
          left: '1.125rem',
          top: '1.5rem',
          bottom: '1.5rem',
          width: 2,
          background: `linear-gradient(180deg, ${tokens.accent} 0%, ${tokens.accent}30 100%)`,
          opacity: 0.3,
        }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {block.steps.map((step, i) => (
            <div key={i} style={{
              position: 'relative',
              display: 'flex',
              gap: '1.5rem',
              padding: '1.25rem 1.5rem',
              background: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: ds.blockRadius,
            }}>
              <div style={{
                flexShrink: 0,
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '999px',
                background: tokens.accent,
                color: tokens.accentText,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: ds.fontHeading,
                fontWeight: 700,
                fontSize: '0.875rem',
                boxShadow: `0 4px 12px ${tokens.accent}30`,
                position: 'relative',
                zIndex: 1,
              }}>
                {step.label || (i + 1)}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontFamily: ds.fontHeading, fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.375rem 0', color: tokens.text, letterSpacing: ds.letterSpacingHeading }}>
                  {step.title}
                </h4>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: tokens.textMuted, lineHeight: 1.6 }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Divider (per-design-system ornament) ───────────────────────────────────

function Divider({ block, ds, tokens }: { block: Extract<Block, { type: 'divider' }>; ds: DesignSystem; tokens: DesignTokens }) {
  const renderOrnament = (): ReactNode => {
    if (ds.divider === 'ornament' || ds.slug === 'luxury-black-gold') {
      return (
        <svg width="120" height="20" viewBox="0 0 120 20" aria-hidden="true">
          <line x1="0" y1="10" x2="40" y2="10" stroke={tokens.divider} strokeWidth="0.5" opacity="0.4" />
          <circle cx="50" cy="10" r="1.5" fill={tokens.divider} />
          <text x="60" y="15" textAnchor="middle" fontSize="14" fill={tokens.divider} fontFamily={ds.fontHeading}>✦</text>
          <circle cx="70" cy="10" r="1.5" fill={tokens.divider} />
          <line x1="80" y1="10" x2="120" y2="10" stroke={tokens.divider} strokeWidth="0.5" opacity="0.4" />
        </svg>
      );
    }
    if (ds.divider === 'dot' || ds.slug === 'wellness-soft') {
      return (
        <svg width="60" height="6" viewBox="0 0 60 6" aria-hidden="true">
          <circle cx="6" cy="3" r="2.5" fill={tokens.divider} opacity="0.6" />
          <circle cx="30" cy="3" r="3" fill={tokens.divider} />
          <circle cx="54" cy="3" r="2.5" fill={tokens.divider} opacity="0.6" />
        </svg>
      );
    }
    if (ds.divider === 'gradient' || ds.slug === 'modern-startup' || ds.slug === 'futuristic-ai') {
      return (
        <div style={{ width: '100%', maxWidth: '14rem' }}>
          <div style={{
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${tokens.divider} 50%, transparent 100%)`,
            opacity: 0.7,
          }} />
        </div>
      );
    }
    // rule (default)
    return (
      <div style={{ width: '4rem', height: 1, background: tokens.divider, opacity: 0.5 }} />
    );
  };

  return (
    <div style={{ margin: '4rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      {renderOrnament()}
      {block.label && (
        <p style={{
          margin: 0,
          fontFamily: ds.fontMono || ds.fontBody,
          fontSize: '0.7rem',
          color: tokens.textSubtle,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
        }}>
          {block.label}
        </p>
      )}
    </div>
  );
}

// ── CTA ─────────────────────────────────────────────────────────────────────

function Cta({ block, ds, tokens }: { block: Extract<Block, { type: 'cta' }>; ds: DesignSystem; tokens: DesignTokens }) {
  return (
    <div style={{
      position: 'relative',
      margin: '4.5rem 0 2rem',
      padding: '3.5rem 2rem',
      background: `linear-gradient(135deg, ${tokens.accent} 0%, ${blend(tokens.accent, '#A78BFA', 0.5)} 100%)`,
      borderRadius: ds.blockRadius,
      textAlign: 'center',
      overflow: 'hidden',
    }}>
      {/* Decorative glow */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: '-50%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        height: '120%',
        background: 'radial-gradient(ellipse, rgba(255,255,255,0.25) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative' }}>
        {block.eyebrow && (
          <p style={{
            fontSize: '0.7rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: tokens.accentText,
            opacity: 0.85,
            margin: '0 0 1rem',
            fontFamily: ds.fontMono || ds.fontBody,
            fontWeight: 600,
          }}>
            {block.eyebrow}
          </p>
        )}
        <h3 style={{
          fontFamily: ds.fontHeading,
          fontSize: `${2.25 * ds.headingScale}rem`,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: ds.letterSpacingHeading,
          color: tokens.accentText,
          margin: '0 auto',
          maxWidth: '20em',
          textWrap: 'balance' as const,
        }}>
          {block.title}
        </h3>
        {block.body && (
          <p style={{ fontSize: '1.0625rem', color: tokens.accentText, opacity: 0.9, margin: '1.25rem auto 0', maxWidth: '32em', lineHeight: 1.55 }}>
            {block.body}
          </p>
        )}
        <a
          href={block.buttonUrl || '#'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.625rem',
            marginTop: '2.25rem',
            padding: '1rem 2rem',
            background: tokens.accentText,
            color: tokens.accent,
            borderRadius: ds.blockRadius,
            fontWeight: 700,
            fontSize: '1rem',
            textDecoration: 'none',
            boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
            letterSpacing: '0.01em',
          }}
        >
          {block.buttonText}
          <ArrowRight size={18} strokeWidth={2.5} />
        </a>
      </div>
    </div>
  );
}

// ── Color helpers ───────────────────────────────────────────────────────────

// Mix two hex colors by ratio (0=full a, 1=full b). Used for gradient endpoints.
function blend(a: string, b: string, ratio: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * ratio);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * ratio);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * ratio);
  return `#${[r, g, bl].map(c => c.toString(16).padStart(2, '0')).join('')}`;
}

function parseHex(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
