// Everything the README shows as an image. Edit here, then run `npm run build` in this folder.

export const cards = [
  {
    id: 'dajia',
    title: 'Dajia.lol',
    description: 'Your links, profile and current music on one page',
    href: 'https://dajia.lol',
    shot: 'dajia.webp',
  },
  {
    id: 'mail',
    title: 'Otus Mail',
    description: 'A JMAP mail client for Android and iOS',
    href: 'https://github.com/otus-foss/mail',
    shot: 'mail.jpg',
  },
  {
    id: 'rubylabs',
    title: 'Rubylabs',
    description: 'My design studio and the work I care about most',
    href: 'https://rubylabs.design',
    shot: 'rubylabs.jpg',
  },
  {
    id: 'portfolio',
    title: 'Portfolio',
    description: 'Everything about me, from music to blogs',
    href: 'https://ruu.by',
    shot: { light: 'portfolio-light.jpg', dark: 'portfolio-dark.jpg' },
  },
  {
    id: 'iconpacker',
    title: 'Iconpacker',
    description: 'Design and export app icon packs in the browser',
    href: 'https://iconpacker.ruu.by',
    shot: { light: 'iconpacker-light.jpg', dark: 'iconpacker-dark.jpg' },
  },
  {
    id: 'ghchart',
    title: 'Contributions Chart Builder',
    // TODO(human): write this card's one-line description (about 50 characters, it wraps to two
    // lines at most). The line below is a placeholder draft.
    description: 'GitHub activity charts you can embed anywhere',
    href: 'https://gh.ruu.by',
    shot: { light: 'ghchart-light.jpg', dark: 'ghchart-dark.jpg' },
  },
];

// The button under the project grid, drawn like the header buttons.
export const moreButton = {
  id: 'more',
  label: 'View more projects',
  icon: 'folder',
  href: 'https://ruu.by/projects',
};

export const buttons = [
  { id: 'portfolio', label: 'Portfolio', icon: 'house', href: 'https://ruu.by' },
  { id: 'studio', label: 'My design studio', icon: 'rubylabs', href: 'https://rubylabs.design' },
  { id: 'dajia', label: 'Dajia', icon: 'music', href: 'https://dajia.lol' },
  { id: 'mail', label: 'Mail', icon: 'mail', href: 'mailto:florian@ruu.by' },
];

export const sections = [
  { id: 'about', label: 'About me', icon: 'hand-wave' },
  { id: 'projects', label: 'Projects', icon: 'folder' },
  { id: 'stats', label: 'Fun stats', icon: 'star' },
];

