'use client';

import { CSSProperties } from 'react';
import type { Block } from '@/lib/celestudio/blocks';
import { DESIGN_SYSTEMS, type DesignSystem, type DesignSystemSlug, type DesignTokens } from '@/lib/celestudio/design-systems';
import { CheckSquare, Square, Quote as QuoteIcon, Lightbulb, Info, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';

interface EbookCanvasProps {
  blocks: Block[];
  designSystem: DesignSystemSlug;
  mode?: 'light' | 'dark';
  zoom?: number; // 1 = normal, 0.5 = half size for thumbnails
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
  };

  const innerStyle: CSSProperties = {
    maxWidth: ds.pageMaxWidth,
    margin: '0 auto',
    padding: '4rem 1.5rem 6rem',
  };

  return (
    <div style={canvasStyle} className="celestudio-canvas">
      <div style={innerStyle}>
        {blocks.map((block, i) => (
          <BlockNode key={block.id || i} block={block} ds={ds} tokens={tokens} index={i} blocks={blocks} />
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
  // Spacing rule: cover takes its own page, others stack with rhythm
  const wrapperStyle: CSSProperties = {
    marginTop: index === 0 ? 0 : block.type === 'chapter_intro' ? ds.sectionSpacing : '2rem',
    marginBottom: block.type === 'chapter_intro' ? ds.sectionSpacing : 0,
  };

  return (
    <div style={wrapperStyle}>
      {renderBlock(block, ds, tokens, index, blocks)}
    </div>
  );
}

// ── Block renderers ─────────────────────────────────────────────────────────

function renderBlock(block: Block, ds: DesignSystem, tokens: DesignTokens, _index: number, _blocks: Block[]) {
  switch (block.type) {
    case 'cover':           return <Cover block={block} ds={ds} tokens={tokens} />;
    case 'chapter_intro':   return <ChapterIntro block={block} ds={ds} tokens={tokens} />;
    case 'heading':         return <Heading block={block} ds={ds} tokens={tokens} />;
    case 'paragraph':       return <Paragraph block={block} ds={ds} tokens={tokens} />;
    case 'quote':           return <BlockQuote block={block} ds={ds} tokens={tokens} />;
    case 'callout':         return <Callout block={block} ds={ds} tokens={tokens} />;
    case 'checklist':       return <Checklist block={block} ds={ds} tokens={tokens} />;
    case 'list':            return <ListBlock block={block} ds={ds} tokens={tokens} />;
    case 'key_stat':        return <KeyStat block={block} ds={ds} tokens={tokens} />;
    case 'framework':       return <Framework block={block} ds={ds} tokens={tokens} />;
    case 'divider':         return <Divider block={block} ds={ds} tokens={tokens} />;
    case 'cta':             return <Cta block={block} ds={ds} tokens={tokens} />;
    default:
      return null;
  }
}

// ── Cover ───────────────────────────────────────────────────────────────────

function Cover({ block, ds, tokens }: { block: Extract<Block, { type: 'cover' }>; ds: DesignSystem; tokens: DesignTokens; }) {
  if (ds.hero === 'cinematic') {
    return (
      <div style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '8rem 0 4rem',
        borderBottom: `1px solid ${tokens.divider}`,
      }}>
        {block.edition && (
          <p style={{ fontFamily: ds.fontBody, fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: tokens.accent, marginBottom: '1.5rem' }}>
            {block.edition}
          </p>
        )}
        <h1 style={{
          fontFamily: ds.fontHeading,
          fontSize: `${4.5 * ds.headingScale}rem`,
          fontWeight: 400,
          lineHeight: 1.05,
          letterSpacing: ds.letterSpacingHeading,
          margin: 0,
          color: tokens.text,
        }}>
          {block.title}
        </h1>
        {block.subtitle && (
          <p style={{
            fontFamily: ds.fontBody,
            fontSize: '1.25rem',
            color: tokens.textMuted,
            marginTop: '1.5rem',
            maxWidth: '32em',
          }}>
            {block.subtitle}
          </p>
        )}
        {block.author && (
          <p style={{ fontFamily: ds.fontBody, fontSize: '0.875rem', color: tokens.textSubtle, marginTop: '3rem', letterSpacing: '0.05em' }}>
            By {block.author}
          </p>
        )}
      </div>
    );
  }

  if (ds.hero === 'centered') {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '6rem 0',
      }}>
        <h1 style={{
          fontFamily: ds.fontHeading,
          fontSize: `${3.75 * ds.headingScale}rem`,
          fontWeight: 400,
          lineHeight: 1.1,
          letterSpacing: ds.letterSpacingHeading,
          margin: 0,
          maxWidth: '14em',
        }}>
          {block.title}
        </h1>
        {block.subtitle && (
          <p style={{ fontFamily: ds.fontBody, fontSize: '1.125rem', color: tokens.textMuted, marginTop: '1.5rem', maxWidth: '32em' }}>
            {block.subtitle}
          </p>
        )}
        {block.author && (
          <p style={{ fontFamily: ds.fontBody, fontSize: '0.875rem', color: tokens.textSubtle, marginTop: '3rem' }}>
            {block.author}
          </p>
        )}
      </div>
    );
  }

  if (ds.hero === 'split') {
    return (
      <div style={{ padding: '4rem 0', borderBottom: `1px solid ${tokens.border}` }}>
        <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: 999, background: tokens.accentMuted, color: tokens.accent, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.02em', marginBottom: '2rem' }}>
          {block.edition || 'Ebook'}
        </div>
        <h1 style={{
          fontFamily: ds.fontHeading,
          fontSize: `${3.5 * ds.headingScale}rem`,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: ds.letterSpacingHeading,
          margin: 0,
          background: `linear-gradient(135deg, ${tokens.text} 0%, ${tokens.accent} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {block.title}
        </h1>
        {block.subtitle && (
          <p style={{ fontSize: '1.25rem', color: tokens.textMuted, marginTop: '1.5rem', maxWidth: '36em', lineHeight: 1.5 }}>
            {block.subtitle}
          </p>
        )}
      </div>
    );
  }

  if (ds.hero === 'overlay') {
    return (
      <div style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem 0',
        position: 'relative',
        background: `radial-gradient(circle at 20% 30%, ${tokens.accent}33 0%, transparent 50%)`,
      }}>
        <p style={{ fontFamily: ds.fontMono || ds.fontBody, fontSize: '0.75rem', color: tokens.accent, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '2rem' }}>
          {block.edition || '— EBOOK / 2026'}
        </p>
        <h1 style={{
          fontFamily: ds.fontHeading,
          fontSize: `${4 * ds.headingScale}rem`,
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: ds.letterSpacingHeading,
          margin: 0,
        }}>
          {block.title}
        </h1>
        {block.subtitle && (
          <p style={{ fontSize: '1.125rem', color: tokens.textMuted, marginTop: '2rem', maxWidth: '34em' }}>
            {block.subtitle}
          </p>
        )}
        {block.author && (
          <p style={{ fontFamily: ds.fontMono || ds.fontBody, fontSize: '0.75rem', color: tokens.textSubtle, marginTop: '4rem', letterSpacing: '0.1em' }}>
            BY {block.author?.toUpperCase()}
          </p>
        )}
      </div>
    );
  }

  // editorial (default)
  return (
    <div style={{ padding: '4rem 0 3rem', borderBottom: `2px solid ${tokens.divider}` }}>
      <p style={{ fontSize: '0.75rem', color: tokens.textSubtle, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '2rem' }}>
        {block.edition || 'A Cele.bio Publication'}
      </p>
      <h1 style={{
        fontFamily: ds.fontHeading,
        fontSize: `${3.75 * ds.headingScale}rem`,
        fontWeight: 400,
        lineHeight: 1.05,
        letterSpacing: ds.letterSpacingHeading,
        margin: 0,
      }}>
        {block.title}
      </h1>
      {block.subtitle && (
        <p style={{ fontSize: '1.25rem', color: tokens.textMuted, marginTop: '1.5rem', maxWidth: '34em', lineHeight: 1.4 }}>
          {block.subtitle}
        </p>
      )}
      {block.author && (
        <p style={{ fontSize: '0.875rem', color: tokens.textSubtle, marginTop: '2.5rem', fontStyle: 'italic' }}>
          {block.author}
        </p>
      )}
    </div>
  );
}

// ── Chapter intro ───────────────────────────────────────────────────────────

function ChapterIntro({ block, ds, tokens }: { block: Extract<Block, { type: 'chapter_intro' }>; ds: DesignSystem; tokens: DesignTokens; }) {
  return (
    <div style={{ padding: '3rem 0 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <span style={{
          fontFamily: ds.fontMono || ds.fontBody,
          fontSize: '0.75rem',
          color: tokens.accent,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}>
          Chapter {String(block.chapterNumber).padStart(2, '0')}
        </span>
        <div style={{ flex: 1, height: 1, background: tokens.border }} />
      </div>
      <h2 style={{
        fontFamily: ds.fontHeading,
        fontSize: `${2.75 * ds.headingScale}rem`,
        fontWeight: 400,
        lineHeight: 1.1,
        letterSpacing: ds.letterSpacingHeading,
        margin: 0,
        color: tokens.text,
      }}>
        {block.title}
      </h2>
      {block.subtitle && (
        <p style={{ fontFamily: ds.fontHeading, fontSize: '1.25rem', color: tokens.textMuted, marginTop: '0.75rem', fontStyle: 'italic' }}>
          {block.subtitle}
        </p>
      )}
      {block.intro && (
        <p style={{ fontSize: '1.125rem', color: tokens.textMuted, marginTop: '2rem', lineHeight: 1.7 }}>
          {block.intro}
        </p>
      )}
    </div>
  );
}

// ── Heading ─────────────────────────────────────────────────────────────────

function Heading({ block, ds, tokens }: { block: Extract<Block, { type: 'heading' }>; ds: DesignSystem; tokens: DesignTokens; }) {
  const sizes = { 1: 2.25, 2: 1.75, 3: 1.375 };
  const size = sizes[block.level] * ds.headingScale;
  return (
    <div style={{ marginTop: '3rem' }}>
      {block.eyebrow && (
        <p style={{ fontSize: '0.75rem', color: tokens.accent, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          {block.eyebrow}
        </p>
      )}
      <h3 style={{
        fontFamily: ds.fontHeading,
        fontSize: `${size}rem`,
        fontWeight: 600,
        lineHeight: 1.25,
        letterSpacing: ds.letterSpacingHeading,
        margin: 0,
        color: tokens.text,
      }}>
        {block.text}
      </h3>
    </div>
  );
}

// ── Paragraph ───────────────────────────────────────────────────────────────

function Paragraph({ block, ds, tokens }: { block: Extract<Block, { type: 'paragraph' }>; ds: DesignSystem; tokens: DesignTokens; }) {
  const isLead = block.emphasis === 'lead';
  return (
    <p style={{
      fontSize: isLead ? '1.25rem' : '1.0625rem',
      color: isLead ? tokens.text : tokens.text,
      lineHeight: ds.lineHeightBody,
      margin: '1.5rem 0',
      fontWeight: isLead ? 400 : 400,
      maxWidth: isLead ? '34em' : 'none',
    }}>
      {block.text}
    </p>
  );
}

// ── Quote ───────────────────────────────────────────────────────────────────

function BlockQuote({ block, ds, tokens }: { block: Extract<Block, { type: 'quote' }>; ds: DesignSystem; tokens: DesignTokens; }) {
  return (
    <figure style={{
      margin: '3rem 0',
      padding: '2rem 0',
      borderTop: `1px solid ${tokens.divider}`,
      borderBottom: `1px solid ${tokens.divider}`,
    }}>
      <QuoteIcon size={28} color={tokens.accent} style={{ marginBottom: '1.5rem' }} strokeWidth={1.25} />
      <blockquote style={{
        fontFamily: ds.fontHeading,
        fontSize: '1.625rem',
        lineHeight: 1.4,
        color: tokens.text,
        margin: 0,
        fontStyle: ds.fontHeading.includes('Cormorant') || ds.fontHeading.includes('Garamond') || ds.fontHeading.includes('Serif') ? 'italic' : 'normal',
        fontWeight: 400,
        letterSpacing: ds.letterSpacingHeading,
      }}>
        &ldquo;{block.text}&rdquo;
      </blockquote>
      {(block.attribution || block.source) && (
        <figcaption style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: tokens.textMuted, letterSpacing: '0.02em' }}>
          {block.attribution && <span style={{ fontWeight: 600, color: tokens.text }}>— {block.attribution}</span>}
          {block.source && <span style={{ fontStyle: 'italic' }}>{block.attribution ? ', ' : '— '}{block.source}</span>}
        </figcaption>
      )}
    </figure>
  );
}

// ── Callout ─────────────────────────────────────────────────────────────────

function Callout({ block, ds, tokens }: { block: Extract<Block, { type: 'callout' }>; ds: DesignSystem; tokens: DesignTokens; }) {
  const icons = { info: Info, tip: Lightbulb, warning: AlertTriangle, insight: Sparkles };
  const Icon = icons[block.variant] || Info;

  return (
    <aside style={{
      margin: '2.5rem 0',
      padding: '1.75rem 1.75rem 1.75rem 1.5rem',
      background: tokens.calloutBg,
      borderLeft: `3px solid ${tokens.accent}`,
      borderRadius: ds.blockRadius,
      display: 'flex',
      gap: '1rem',
    }}>
      <Icon size={22} color={tokens.accent} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        {block.title && (
          <h4 style={{
            fontFamily: ds.fontHeading,
            fontSize: '1rem',
            fontWeight: 600,
            margin: '0 0 0.5rem 0',
            color: tokens.text,
          }}>
            {block.title}
          </h4>
        )}
        <p style={{ margin: 0, fontSize: '1rem', color: tokens.text, lineHeight: 1.6 }}>
          {block.body}
        </p>
      </div>
    </aside>
  );
}

// ── Checklist ───────────────────────────────────────────────────────────────

function Checklist({ block, ds, tokens }: { block: Extract<Block, { type: 'checklist' }>; ds: DesignSystem; tokens: DesignTokens; }) {
  return (
    <div style={{ margin: '2.5rem 0' }}>
      {block.title && (
        <h4 style={{ fontFamily: ds.fontHeading, fontSize: '1.125rem', fontWeight: 600, margin: '0 0 1rem 0' }}>
          {block.title}
        </h4>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {block.items.map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 0', borderBottom: `1px solid ${tokens.border}` }}>
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

function ListBlock({ block, ds, tokens }: { block: Extract<Block, { type: 'list' }>; ds: DesignSystem; tokens: DesignTokens; }) {
  return (
    <div style={{ margin: '2rem 0' }}>
      {block.title && (
        <h4 style={{ fontFamily: ds.fontHeading, fontSize: '1.125rem', fontWeight: 600, margin: '0 0 1rem 0' }}>
          {block.title}
        </h4>
      )}
      {block.style === 'numbered' ? (
        <ol style={{ paddingLeft: '1.25rem', margin: 0, color: tokens.text, lineHeight: ds.lineHeightBody }}>
          {block.items.map((item, i) => <li key={i} style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>{item}</li>)}
        </ol>
      ) : (
        <ul style={{ paddingLeft: '1.25rem', margin: 0, color: tokens.text, lineHeight: ds.lineHeightBody }}>
          {block.items.map((item, i) => <li key={i} style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>{item}</li>)}
        </ul>
      )}
    </div>
  );
}

// ── Key stat ────────────────────────────────────────────────────────────────

function KeyStat({ block, ds, tokens }: { block: Extract<Block, { type: 'key_stat' }>; ds: DesignSystem; tokens: DesignTokens; }) {
  return (
    <div style={{
      margin: '3rem 0',
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(block.stats.length, 3)}, 1fr)`,
      gap: '1rem',
    }}>
      {block.stats.map((stat, i) => (
        <div key={i} style={{
          padding: '2rem 1.5rem',
          background: tokens.statBg,
          border: `1px solid ${tokens.border}`,
          borderRadius: ds.blockRadius,
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: ds.fontHeading,
            fontSize: '3rem',
            fontWeight: 700,
            lineHeight: 1,
            color: tokens.accent,
            letterSpacing: '-0.04em',
          }}>
            {stat.value}
          </div>
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: tokens.text,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}>
            {stat.label}
          </div>
          {stat.description && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: tokens.textMuted, lineHeight: 1.5 }}>
              {stat.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Framework ───────────────────────────────────────────────────────────────

function Framework({ block, ds, tokens }: { block: Extract<Block, { type: 'framework' }>; ds: DesignSystem; tokens: DesignTokens; }) {
  return (
    <div style={{ margin: '3rem 0' }}>
      <h3 style={{
        fontFamily: ds.fontHeading,
        fontSize: `${1.75 * ds.headingScale}rem`,
        fontWeight: 600,
        margin: '0 0 0.5rem 0',
        letterSpacing: ds.letterSpacingHeading,
        color: tokens.text,
      }}>
        {block.title}
      </h3>
      {block.description && (
        <p style={{ fontSize: '1rem', color: tokens.textMuted, margin: '0 0 1.5rem 0', maxWidth: '34em' }}>
          {block.description}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        {block.steps.map((step, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: '1.25rem',
            padding: '1.25rem 1.5rem',
            background: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: ds.blockRadius,
          }}>
            <div style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: ds.blockRadius,
              background: tokens.accentMuted,
              color: tokens.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: ds.fontHeading,
              fontWeight: 700,
              fontSize: '0.875rem',
              letterSpacing: '0.02em',
            }}>
              {step.label || (i + 1)}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontFamily: ds.fontHeading, fontSize: '1.0625rem', fontWeight: 600, margin: '0 0 0.25rem 0', color: tokens.text }}>
                {step.title}
              </h4>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: tokens.textMuted, lineHeight: 1.55 }}>
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Divider ─────────────────────────────────────────────────────────────────

function Divider({ block, ds, tokens }: { block: Extract<Block, { type: 'divider' }>; ds: DesignSystem; tokens: DesignTokens; }) {
  if (ds.divider === 'ornament') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', margin: '4rem 0' }}>
        <div style={{ flex: 1, height: 1, background: tokens.divider, opacity: 0.4 }} />
        <span style={{ color: tokens.divider, fontSize: '1.25rem', fontFamily: ds.fontHeading }}>✦</span>
        <div style={{ flex: 1, height: 1, background: tokens.divider, opacity: 0.4 }} />
      </div>
    );
  }
  if (ds.divider === 'dot') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', margin: '3.5rem 0' }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: tokens.divider }} />
        <span style={{ width: 6, height: 6, borderRadius: 999, background: tokens.divider }} />
        <span style={{ width: 6, height: 6, borderRadius: 999, background: tokens.divider }} />
      </div>
    );
  }
  if (ds.divider === 'gradient') {
    return (
      <div style={{ margin: '3.5rem 0' }}>
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent 0%, ${tokens.divider} 50%, transparent 100%)` }} />
        {block.label && (
          <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: tokens.textSubtle, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            {block.label}
          </p>
        )}
      </div>
    );
  }
  // rule
  return (
    <div style={{ margin: '3rem 0', height: 1, background: tokens.border }} />
  );
}

// ── CTA ─────────────────────────────────────────────────────────────────────

function Cta({ block, ds, tokens }: { block: Extract<Block, { type: 'cta' }>; ds: DesignSystem; tokens: DesignTokens; }) {
  return (
    <div style={{
      margin: '4rem 0 2rem',
      padding: '3rem 2rem',
      background: tokens.accent,
      borderRadius: ds.blockRadius,
      textAlign: 'center',
    }}>
      {block.eyebrow && (
        <p style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: tokens.accentText, opacity: 0.85, marginBottom: '1rem' }}>
          {block.eyebrow}
        </p>
      )}
      <h3 style={{
        fontFamily: ds.fontHeading,
        fontSize: `${2 * ds.headingScale}rem`,
        fontWeight: 600,
        lineHeight: 1.15,
        letterSpacing: ds.letterSpacingHeading,
        color: tokens.accentText,
        margin: 0,
        maxWidth: '20em',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        {block.title}
      </h3>
      {block.body && (
        <p style={{ fontSize: '1rem', color: tokens.accentText, opacity: 0.85, margin: '1rem auto 0', maxWidth: '32em', lineHeight: 1.5 }}>
          {block.body}
        </p>
      )}
      <a
        href={block.buttonUrl || '#'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '2rem',
          padding: '0.875rem 1.75rem',
          background: tokens.accentText,
          color: tokens.accent,
          borderRadius: ds.blockRadius,
          fontWeight: 600,
          fontSize: '0.9375rem',
          textDecoration: 'none',
        }}
      >
        {block.buttonText}
        <ArrowRight size={16} strokeWidth={2} />
      </a>
    </div>
  );
}
