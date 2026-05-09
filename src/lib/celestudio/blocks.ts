// CeleStudio Block System
// Every ebook is an ordered array of blocks. The renderer maps each block to a styled component.
// Blocks are intentionally constrained — quality over flexibility.

export type BlockType =
  | 'cover'           // Title page
  | 'chapter_intro'   // Chapter opening
  | 'heading'         // Section heading (h1/h2/h3)
  | 'paragraph'       // Body text
  | 'quote'           // Pull quote
  | 'callout'         // Highlighted info box
  | 'checklist'       // Checked/unchecked list
  | 'list'            // Numbered or bulleted list
  | 'key_stat'        // Big number + label (or row of stats)
  | 'framework'       // Card with steps/principles
  | 'divider'         // Visual divider between sections
  | 'cta';            // Call-to-action with button

interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface CoverBlock extends BaseBlock {
  type: 'cover';
  title: string;
  subtitle?: string;
  author?: string;
  edition?: string; // e.g. "First Edition" or "2026"
}

export interface ChapterIntroBlock extends BaseBlock {
  type: 'chapter_intro';
  chapterNumber: number;
  title: string;
  subtitle?: string;
  intro?: string;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
  eyebrow?: string; // Small text above the heading
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  text: string;
  emphasis?: 'normal' | 'lead'; // 'lead' = larger intro paragraph
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  text: string;
  attribution?: string;
  source?: string;
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  variant: 'info' | 'tip' | 'warning' | 'insight';
  title?: string;
  body: string;
}

export interface ChecklistBlock extends BaseBlock {
  type: 'checklist';
  title?: string;
  items: { text: string; checked?: boolean }[];
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  style: 'numbered' | 'bulleted';
  title?: string;
  items: string[];
}

export interface KeyStatBlock extends BaseBlock {
  type: 'key_stat';
  stats: { value: string; label: string; description?: string }[];
}

export interface FrameworkBlock extends BaseBlock {
  type: 'framework';
  title: string;
  description?: string;
  steps: { label: string; title: string; description: string }[];
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
  label?: string; // Optional text inside divider
}

export interface CtaBlock extends BaseBlock {
  type: 'cta';
  eyebrow?: string;
  title: string;
  body?: string;
  buttonText: string;
  buttonUrl?: string;
}

export type Block =
  | CoverBlock
  | ChapterIntroBlock
  | HeadingBlock
  | ParagraphBlock
  | QuoteBlock
  | CalloutBlock
  | ChecklistBlock
  | ListBlock
  | KeyStatBlock
  | FrameworkBlock
  | DividerBlock
  | CtaBlock;

// Helper for generating IDs without needing crypto.randomUUID on edge runtime
export function makeBlockId(): string {
  return `blk_${Math.random().toString(36).slice(2, 11)}`;
}
