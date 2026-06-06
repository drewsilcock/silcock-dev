import sharp from "sharp";

const W = 1200;
const H = 630;

const background = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="84%" cy="14%" r="58%">
      <stop offset="0%" stop-color="#F5A623" stop-opacity="0.20" />
      <stop offset="62%" stop-color="#F5A623" stop-opacity="0" />
    </radialGradient>
    <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="1.4" cy="1.4" r="1.4" fill="#ffffff" fill-opacity="0.045" />
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="#0D0D0F" />
  <rect width="${W}" height="${H}" fill="url(#dots)" />
  <rect width="${W}" height="${H}" fill="url(#glow)" />
  <g fill="none" stroke="#F5A623" stroke-opacity="0.06" stroke-width="54" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 720 215 L 1000 400 L 720 585" />
  </g>
  <rect x="1035" y="560" width="150" height="34" rx="8" fill="#F5A623" fill-opacity="0.06" />
</svg>`;

const logo = `
<svg width="176" height="176" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect x="1.4" y="1.4" width="29.2" height="29.2" rx="8" fill="none" stroke="#F5A623" stroke-width="2.2" />
  <g fill="none" stroke="#F5A623" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 11l4 5-4 5" />
  </g>
  <rect x="17.5" y="19.4" width="7.5" height="2.6" rx="1.3" fill="#F5A623" />
</svg>`;

await sharp(Buffer.from(background)).png().toFile("images/og-background.png");
await sharp(Buffer.from(logo)).png().toFile("images/og-logo.png");

console.log("Generated images/og-background.png and images/og-logo.png");
