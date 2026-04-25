#!/usr/bin/env bun
/**
 * html-to-pptx.ts — convert a deck.html produced by the founder-cinematic
 * scaffold into a text-editable PPTX.
 *
 * Not a general-purpose HTML renderer. It looks for <section class="slide ..."> blocks
 * in the scaffold's expected shape and maps each layout pattern to pptxgenjs frames.
 *
 * Text stays text. Images stay images. You can open the PPTX in Canva / Google
 * Slides / PowerPoint and keep editing.
 *
 * Usage:
 *   bun scripts/html-to-pptx.ts --in ./my-talk/deck.html --out ./my-talk/deck.pptx
 */

import { readFile, access } from "node:fs/promises";
import { resolve, dirname, join, basename } from "node:path";
import { parse, type HTMLElement } from "node-html-parser";
import PptxGenJS from "pptxgenjs";

async function fileExists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}

const COLORS = {
  bg: "0A0A0C",
  bgSoft: "14141A",
  text: "F5E6CE",
  muted: "A89E8C",
  accent: "F5B942",
  accentSoft: "8C6E2E",
};

const FONT = {
  display: "Be Vietnam Pro",
  mono: "IBM Plex Mono",
  italic: "Fraunces",
};

const SLIDE_W = 13.333; // inches, 1920px @ 144dpi
const SLIDE_H = 7.5;    // inches, 1080px @ 144dpi

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function printHelp(): void {
  console.log(`html-to-pptx.ts — convert deck.html to text-editable PPTX

Usage:
  bun scripts/html-to-pptx.ts --in <deck.html> --out <deck.pptx>

Options:
  --in <path>    Path to deck.html (required)
  --out <path>   Path to output .pptx (required)
  --help         Show this help

Notes:
  - Works with decks built from presets/founder-cinematic/html-scaffold.html.
  - Text stays text (editable). Images are embedded, paths resolved relative to --in.
  - Background images in inline style url('./images/foo.jpg') are extracted.
`);
}

async function extractBgImage(el: HTMLElement, htmlDir: string): Promise<string | null> {
  const style = el.getAttribute("style") ?? "";
  const m = style.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/i);
  if (!m) return null;
  const src = m[1]!;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  const abs = resolve(htmlDir, src);
  if (!(await fileExists(abs))) {
    console.log(`  warn: missing image ${abs} — slide will render with solid bg`);
    return null;
  }
  return abs;
}

function text(el: HTMLElement | null | undefined): string {
  if (!el) return "";
  return el.textContent.trim().replace(/\s+/g, " ");
}

function classifyLayout(section: HTMLElement): string {
  const cls = section.getAttribute("class") ?? "";
  const match = cls.match(/slide-([a-z-]+)/);
  return match ? match[1]! : "statement";
}

type Slide = ReturnType<PptxGenJS["addSlide"]>;

async function renderTitleHero(slide: Slide, section: HTMLElement, htmlDir: string): Promise<void> {
  const bg = await extractBgImage(section, htmlDir);
  if (bg) slide.background = { path: bg };
  else slide.background = { color: COLORS.bg };
  slide.addShape("rect", {
    x: 0, y: SLIDE_H * 0.35, w: SLIDE_W, h: SLIDE_H * 0.65,
    fill: { color: COLORS.bg, transparency: 10 },
    line: { type: "none" } as never,
  });
  const content = section.querySelector(".content");
  const kicker = text(content?.querySelector(".kicker"));
  const title = text(content?.querySelector("h1"));
  const subtitle = text(content?.querySelector(".subtitle"));
  if (kicker) {
    slide.addText(kicker, {
      x: 0.67, y: 4.5, w: 12, h: 0.4,
      fontFace: FONT.mono, fontSize: 14, color: COLORS.muted, charSpacing: 3,
    });
  }
  if (title) {
    slide.addText(title, {
      x: 0.67, y: 5.0, w: 12, h: 1.6,
      fontFace: FONT.display, fontSize: 60, bold: true, color: COLORS.text,
    });
  }
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.67, y: 6.7, w: 12, h: 0.5,
      fontFace: FONT.display, fontSize: 22, color: COLORS.muted,
    });
  }
}

async function renderPhotoBleed(slide: Slide, section: HTMLElement, htmlDir: string): Promise<void> {
  const bg = await extractBgImage(section, htmlDir);
  if (bg) slide.background = { path: bg };
  else slide.background = { color: COLORS.bg };
  const caption = text(section.querySelector(".caption"));
  if (caption) {
    slide.addText(caption, {
      x: 0.67, y: 6.6, w: 12, h: 0.6,
      fontFace: FONT.display, fontSize: 22, color: COLORS.text, shadow: { type: "outer", blur: 8, offset: 2, angle: 90, color: "000000", opacity: 0.7 },
    });
  }
}

function renderStat(slide: Slide, section: HTMLElement): void {
  slide.background = { color: COLORS.bg };
  const number = text(section.querySelector(".number"));
  const caption = text(section.querySelector(".caption"));
  if (number) {
    slide.addText(number, {
      x: 0.5, y: 1.5, w: SLIDE_W - 1, h: 3.5,
      fontFace: FONT.display, fontSize: 220, bold: true, color: COLORS.accent, align: "center",
    });
  }
  if (caption) {
    slide.addText(caption, {
      x: 1, y: 5.3, w: SLIDE_W - 2, h: 1.5,
      fontFace: FONT.display, fontSize: 36, color: COLORS.text, align: "center",
    });
  }
}

function renderCompare(slide: Slide, section: HTMLElement): void {
  slide.background = { color: COLORS.bg };
  const h2 = text(section.querySelector("h2"));
  if (h2) {
    slide.addText(h2, {
      x: 0.67, y: 0.8, w: 12, h: 1,
      fontFace: FONT.display, fontSize: 44, bold: true, color: COLORS.text,
    });
  }
  const cols = section.querySelectorAll(".col");
  cols.forEach((col, i) => {
    const isOld = (col.getAttribute("class") ?? "").includes("old");
    const kicker = text(col.querySelector(".kicker"));
    const body = text(col.querySelector(".body"));
    const x = i === 0 ? 0.67 : 6.93;
    if (kicker) {
      slide.addText(kicker, {
        x, y: 3, w: 5.73, h: 0.5,
        fontFace: FONT.mono, fontSize: 16, charSpacing: 3,
        color: isOld ? COLORS.accentSoft : COLORS.accent,
      });
    }
    if (body) {
      slide.addText(body, {
        x, y: 3.7, w: 5.73, h: 2.5,
        fontFace: FONT.display, fontSize: 32, bold: true, color: COLORS.text,
      });
    }
  });
}

async function renderQuote(slide: Slide, section: HTMLElement, htmlDir: string): Promise<void> {
  slide.background = { color: COLORS.bg };
  const left = section.querySelector(".left");
  const right = section.querySelector(".right");
  const kicker = text(left?.querySelector(".kicker"));
  const quote = text(left?.querySelector("blockquote"));
  const attr = text(left?.querySelector(".attribution"));
  if (kicker) {
    slide.addText(kicker, {
      x: 0.67, y: 1, w: 5.5, h: 0.5,
      fontFace: FONT.mono, fontSize: 16, color: COLORS.muted, charSpacing: 3,
    });
  }
  if (quote) {
    slide.addText(quote, {
      x: 0.67, y: 1.8, w: 5.5, h: 4,
      fontFace: FONT.italic, fontSize: 36, italic: true, color: COLORS.text,
    });
  }
  if (attr) {
    slide.addText(attr, {
      x: 0.67, y: 6.3, w: 5.5, h: 0.5,
      fontFace: FONT.mono, fontSize: 14, color: COLORS.muted, charSpacing: 3,
    });
  }
  if (right) {
    const bg = await extractBgImage(right, htmlDir);
    if (bg) {
      slide.addImage({ path: bg, x: SLIDE_W / 2, y: 0, w: SLIDE_W / 2, h: SLIDE_H, sizing: { type: "cover", w: SLIDE_W / 2, h: SLIDE_H } });
    } else {
      slide.addShape("rect", { x: SLIDE_W / 2, y: 0, w: SLIDE_W / 2, h: SLIDE_H, fill: { color: COLORS.bgSoft }, line: { type: "none" } as never });
    }
  }
}

function renderGrid(slide: Slide, section: HTMLElement): void {
  slide.background = { color: COLORS.bgSoft };
  const tiles = section.querySelectorAll(".tile");
  const cellW = SLIDE_W / 2;
  const cellH = SLIDE_H / 2;
  tiles.forEach((tile, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = col * cellW;
    const y = row * cellH;
    slide.addShape("rect", { x, y, w: cellW, h: cellH, fill: { color: COLORS.bg }, line: { color: COLORS.bgSoft, width: 1 } });
    const number = text(tile.querySelector(".tile-number"));
    const caption = text(tile.querySelector(".tile-caption"));
    if (number) {
      slide.addText(number, {
        x: x + 0.5, y: y + 0.7, w: cellW - 1, h: 2,
        fontFace: FONT.display, fontSize: 90, bold: true, color: COLORS.accent,
      });
    }
    if (caption) {
      slide.addText(caption, {
        x: x + 0.5, y: y + cellH - 1, w: cellW - 1, h: 0.6,
        fontFace: FONT.display, fontSize: 20, color: COLORS.text,
      });
    }
  });
}

function renderStatement(slide: Slide, section: HTMLElement): void {
  slide.background = { color: COLORS.bg };
  const statementEl = section.querySelector(".statement");
  const statement = text(statementEl);
  if (statement) {
    slide.addText(statement, {
      x: 1, y: 2.5, w: SLIDE_W - 2, h: 3,
      fontFace: FONT.display, fontSize: 64, bold: true, color: COLORS.text, align: "center",
    });
  }
}

async function renderHandwritten(slide: Slide, section: HTMLElement, htmlDir: string): Promise<void> {
  const bg = await extractBgImage(section, htmlDir);
  if (bg) slide.background = { path: bg };
  else slide.background = { color: COLORS.bg };
  slide.addShape("rect", {
    x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
    fill: { color: COLORS.bg, transparency: 40 },
    line: { type: "none" } as never,
  });
  const hw = text(section.querySelector(".handwriting"));
  if (hw) {
    slide.addText(hw, {
      x: 1, y: 2.5, w: SLIDE_W - 2, h: 3,
      fontFace: FONT.italic, fontSize: 88, italic: true, color: COLORS.accent, align: "center",
      rotate: -3,
    });
  }
}

async function main(): Promise<void> {
  if (hasFlag("help")) { printHelp(); return; }

  const inPath = arg("in");
  const outPath = arg("out");
  if (!inPath || !outPath) {
    printHelp();
    process.exit(1);
  }

  const html = await readFile(inPath, "utf8");
  const htmlDir = dirname(resolve(inPath));
  const root = parse(html);
  const sections = root.querySelectorAll("section.slide");
  console.log(`Found ${sections.length} slides in ${basename(inPath)}`);

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.defineLayout({ name: "TALK_PREP", width: SLIDE_W, height: SLIDE_H });
  pptx.layout = "TALK_PREP";

  for (const section of sections) {
    const layout = classifyLayout(section);
    const slide = pptx.addSlide();
    switch (layout) {
      case "title-hero":   await renderTitleHero(slide, section, htmlDir); break;
      case "photo-bleed":  await renderPhotoBleed(slide, section, htmlDir); break;
      case "stat":         renderStat(slide, section); break;
      case "compare":      renderCompare(slide, section); break;
      case "quote":        await renderQuote(slide, section, htmlDir); break;
      case "grid":         renderGrid(slide, section); break;
      case "statement":    renderStatement(slide, section); break;
      case "handwritten":  await renderHandwritten(slide, section, htmlDir); break;
      default:
        console.log(`  warn: unknown layout "${layout}", rendering as statement`);
        renderStatement(slide, section);
    }
    console.log(`  slide ${sections.indexOf(section) + 1}: ${layout}`);
  }

  await pptx.writeFile({ fileName: join(dirname(outPath), basename(outPath)) });
  console.log(`\nWrote ${outPath}`);
}

main().catch((e) => {
  console.error((e as Error).stack ?? String(e));
  process.exit(1);
});
