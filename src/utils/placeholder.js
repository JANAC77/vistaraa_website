/**
 * Generates an inline SVG placeholder image that works offline
 * to prevent network closure errors (ERR_CONNECTION_CLOSED) from third-party placeholder services.
 */
export function getPlaceholderImage(width = 400, height = 400, text = "Vistaraa") {
  // Use HSL/Hex values properly escaped for Data URIs
  const bgColor = "%23f1f5f9";
  const textColor = "%2394a3b8";
  const fontSize = Math.max(12, Math.round(width / 12));
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="${bgColor}"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="${fontSize}" fill="${textColor}">
      ${encodeURIComponent(text)}
    </text>
  </svg>`.replace(/\s+/g, ' ');

  return `data:image/svg+xml;utf8,${svg}`;
}
