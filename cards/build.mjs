// Draws the README's cards, buttons and section labels as SVG files in ../assets, one light and
// one dark file each. GitHub shows them through <img>, where an SVG can't load fonts or other
// files, so text is drawn as outlines and screenshots are embedded.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import opentype from 'opentype.js';
import { buttons, cards, kinds, moreCard, sections } from './cards.mjs';

const here = (path) => new URL(path, import.meta.url);

// Colours from the portfolio's tokens.css and themes/dark.css. `edge` is its --stroke-edge
// hairline, which is what separates a card from GitHub's page colour.
const themes = {
  light: {
    surface: '#f9fafb',
    stroke: '#ffffff',
    edge: '#e2e3e5',
    title: '#111827',
    body: '#6b7280',
    label: '#6b7280',
    buttonFill: '#111827',
    buttonIcon: '#ffffff',
  },
  dark: {
    surface: '#171718',
    stroke: '#1c1c1d',
    edge: '#303032',
    title: '#d4d4d8',
    body: '#92929a',
    label: '#83838b',
    buttonFill: '#d4d4d8',
    buttonIcon: '#171718',
  },
};

// The red panel looks the same in both themes, as on the portfolio.
const studio = { light: '#d0303a', mid: '#a50f18', deep: '#6a0910' };

const STROKE = 3;
const LABEL_TRACKING = 0.06;

const fonts = Object.fromEntries(
  [
    [400, 'Regular'],
    [500, 'Medium'],
    [600, 'SemiBold'],
  ].map(([weight, name]) => [
    weight,
    opentype.parse(readFileSync(here(`fonts/FigtreeRound-${name}.ttf`)).buffer),
  ]),
);

const round = (n) => Math.round(n * 100) / 100;

/** Lays out one line of text and returns its outline and width. */
function line(string, { size, weight = 400, tracking = 0 }) {
  const font = fonts[weight];
  const scale = size / font.unitsPerEm;
  const glyphs = font.stringToGlyphs(string);
  let x = 0;
  const d = glyphs
    .map((glyph, i) => {
      const path = glyph.getPath(x, 0, size).toPathData(2);
      const kerning = glyphs[i + 1] ? font.getKerningValue(glyph, glyphs[i + 1]) : 0;
      x += (glyph.advanceWidth + kerning) * scale + tracking * size;
      return path;
    })
    .join('');
  return { d, width: x - tracking * size };
}

function text(string, { x, y, fill, ...style }) {
  const { d } = line(string, style);
  return `<path transform="translate(${round(x)} ${round(y)})" fill="${fill}" d="${d}"/>`;
}

const textWidth = (string, style) => line(string, style).width;

function wrap(string, maxWidth, style) {
  return string.split(' ').reduce((lines, word) => {
    const candidate = lines.length ? `${lines.at(-1)} ${word}` : word;
    return lines.length && textWidth(candidate, style) <= maxWidth
      ? [...lines.slice(0, -1), candidate]
      : [...lines, word];
  }, []);
}

/** An icon file's shapes, recoloured and placed in a square of `size`. */
function icon(name, { x, y, size, color }) {
  const source = readFileSync(here(`icons/${name}.svg`), 'utf8');
  const viewBox = source.match(/viewBox="([^"]+)"/)[1];
  const [minX, minY, viewWidth, viewHeight] = viewBox.split(/\s+/).map(Number);
  const shapes = source
    .slice(source.indexOf('>', source.indexOf('<svg')) + 1, source.lastIndexOf('</svg>'))
    .replace(/<!--.*?-->/gs, '')
    .replace(/\s(fill|stroke)="[^"]*"/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const paint = /<svg[^>]*stroke="currentColor"/s.test(source)
    ? `fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`
    : `fill="${color}"`;
  return `<g transform="translate(${round(x)} ${round(y)}) scale(${round(size / viewWidth)} ${round(size / viewHeight)}) translate(${round(-minX)} ${round(-minY)})" ${paint}>${shapes}</g>`;
}

const embeddedImage = (file) => {
  const mime = file.endsWith('.webp') ? 'image/webp' : file.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${readFileSync(here(`shots/${file}`)).toString('base64')}`;
};

const rect = ({ x, y, w, h, r, ...attrs }) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ${Object.entries(attrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ')}/>`;

/** The portfolio's card: a stroke with a hairline on both sides, around the surface. */
function shell({ x, y, w, h, r }, theme, surface = theme.surface) {
  const inner = { x: x + STROKE, y: y + STROKE, w: w - 2 * STROKE, h: h - 2 * STROKE, r: r - STROKE };
  return {
    inner,
    svg:
      rect({ x: x + 0.5, y: y + 0.5, w: w - 1, h: h - 1, r, fill: theme.stroke, stroke: theme.edge }) +
      rect({ ...inner, fill: surface, stroke: theme.edge }),
  };
}

const arrow = ({ cx, cy, size, color }) =>
  `<path transform="translate(${cx} ${cy})" d="M${-size} ${size}L${size} ${-size}M${-size * 0.6} ${-size}H${size}V${size * 0.6}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;

const arrowButton = ({ cx, cy, fill, color }) =>
  `<circle cx="${cx}" cy="${cy}" r="17" fill="${fill}"/>${arrow({ cx, cy, size: 4.5, color })}`;

/** Small uppercase label with an icon, as on every portfolio card. */
function label(string, iconName, { x, y, color, size = 11, iconSize = 12 }) {
  const style = { size, weight: 500, tracking: LABEL_TRACKING };
  const upper = string.toUpperCase();
  return {
    width: iconSize + 6 + textWidth(upper, style),
    svg: icon(iconName, { x, y: y - iconSize + 3, size: iconSize, color }) + text(upper, { x: x + iconSize + 6, y, fill: color, ...style }),
  };
}

const svg = (width, height, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${round(width)}" height="${height}" viewBox="0 0 ${round(width)} ${height}">${body}</svg>\n`;

// Cards carry their own gutter, since a README has no way to set a gap between images.
const CARD = { w: 440, h: 322, gutter: 6, radius: 12, padding: 18, media: 200 };
const cardBox = { x: CARD.gutter, y: CARD.gutter, w: CARD.w - 2 * CARD.gutter, h: CARD.h - 2 * CARD.gutter, r: CARD.radius };

/** Title, description and arrow button, in the strip of `box` below `top`. */
function caption({ title, description }, box, top, theme) {
  const x = box.x + CARD.padding;
  const buttonX = box.x + box.w - CARD.padding - 17;
  const descriptionStyle = { size: 15, weight: 400 };
  const lines = wrap(description, buttonX - 17 - 14 - x, descriptionStyle).slice(0, 2);
  const middle = (top + box.y + box.h) / 2;
  const firstLine = middle - (lines.length * 18) / 2 + 4;
  return (
    text(title, { x, y: firstLine, size: 20, weight: 600, fill: theme.title }) +
    lines
      .map((string, i) => text(string, { x, y: firstLine + 23 + i * 19, fill: theme.body, ...descriptionStyle }))
      .join('') +
    arrowButton({ cx: buttonX, cy: middle, fill: theme.buttonFill, color: theme.buttonIcon })
  );
}

/** The label in the card's top left corner, on a pill so it reads over any image. */
function pill(kind, inner, theme) {
  const heading = label(kind.label, kind.icon, { x: inner.x + 22, y: inner.y + 28, color: theme.label });
  return (
    rect({ x: inner.x + 12, y: inner.y + 12, w: heading.width + 20, h: 24, r: 12, fill: theme.surface, 'fill-opacity': 0.92 }) +
    heading.svg
  );
}

function projectCard(card, theme, mode) {
  const { inner, svg: frame } = shell(cardBox, theme);
  const shot = typeof card.shot === 'string' ? card.shot : card.shot[mode];
  return svg(
    CARD.w,
    CARD.h,
    `<clipPath id="media">${rect({ ...inner, h: CARD.media + inner.r })}</clipPath>` +
      frame +
      `<g clip-path="url(#media)"><image href="${embeddedImage(shot)}" x="${inner.x}" y="${inner.y}" width="${inner.w}" height="${CARD.media}" preserveAspectRatio="xMidYMin slice"/></g>` +
      rect({ x: inner.x, y: inner.y + CARD.media, w: inner.w, h: inner.h - CARD.media, r: 0, fill: theme.surface }) +
      rect({ x: inner.x, y: inner.y + CARD.media, w: inner.w, h: 1, r: 0, fill: theme.edge }) +
      rect({ ...inner, fill: 'none', stroke: theme.edge }) +
      pill(kinds[card.kind], inner, theme) +
      caption(card, inner, inner.y + CARD.media, theme),
  );
}

/** The closing card: the portfolio's red panel with nothing on it but the caption. */
function moreCardSvg(theme) {
  const { inner, svg: frame } = shell(cardBox, theme, 'url(#studio)');
  return svg(
    CARD.w,
    CARD.h,
    `<radialGradient id="studio" cx="0.5" cy="0" r="1.1"><stop offset="0" stop-color="${studio.light}"/><stop offset="0.55" stop-color="${studio.mid}"/><stop offset="1" stop-color="${studio.deep}"/></radialGradient>` +
    frame +
      `<clipPath id="more-panel">${rect({ ...inner, fill: '#fff' })}</clipPath><rect x="${inner.x}" y="${inner.y}" width="${inner.w}" height="${inner.h}" fill="url(#studio)" clip-path="url(#more-panel)"/>` +
      rect({ x: inner.x, y: inner.y + CARD.media, w: inner.w, h: inner.h - CARD.media, r: 0, fill: theme.surface }) +
      rect({ ...inner, fill: 'none', stroke: theme.edge }) +
      pill(kinds.more, inner, theme) +
      `${caption(moreCard, inner, inner.y + CARD.media, theme)}`,
  );
}

const BUTTON = { h: 40, gutter: 4, radius: 8, padding: 13 };

function button({ label: string, icon: iconName }, theme) {
  const style = { size: 13.5, weight: 500 };
  const textX = BUTTON.padding + 15 + 8;
  const arrowX = textX + textWidth(string, style) + 13;
  const width = arrowX + 4 + BUTTON.padding;
  const middle = BUTTON.h / 2;
  return svg(
    width + BUTTON.gutter,
    BUTTON.h,
    shell({ x: 0, y: 0, w: width, h: BUTTON.h, r: BUTTON.radius }, theme).svg +
      icon(iconName, { x: BUTTON.padding, y: middle - 7.5, size: 15, color: theme.body }) +
      text(string, { x: textX, y: middle + 4.7, fill: theme.title, ...style }) +
      arrow({ cx: arrowX, cy: middle, size: 3.2, color: theme.body }),
  );
}

function section({ label: string, icon: iconName }, theme) {
  const heading = label(string, iconName, { x: 0, y: 20, color: theme.label, size: 15, iconSize: 15 });
  return svg(heading.width + 1, 26, heading.svg);
}

const files = (mode, theme) => [
  ...cards.map((card) => [card.id === 'dajia' ? 'card-dajia-showcase' : `card-${card.id}`, projectCard(card, theme, mode)]),
  [`card-${moreCard.id}`, moreCardSvg(theme)],
  ...buttons.map((item) => [`button-${item.id}`, button(item, theme)]),
  ...sections.map((item) => [`label-${item.id}`, section(item, theme)]),
];

mkdirSync(here('../assets/'), { recursive: true });
Object.entries(themes)
  .flatMap(([mode, theme]) => files(mode, theme).map(([name, body]) => [`${name}-${mode}.svg`, body]))
  .forEach(([file, body]) => {
    writeFileSync(here(`../assets/${file}`), body);
    console.log(`${file}  ${Math.round(body.length / 1024)} KB`);
  });
