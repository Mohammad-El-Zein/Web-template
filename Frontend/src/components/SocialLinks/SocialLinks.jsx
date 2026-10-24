import React from "react";

// Bootstrap-Icons für bekannte Netzwerke, sonst ein allgemeines Link-Icon
const ICONS = {
  instagram: "bi-instagram",
  facebook: "bi-facebook",
  tiktok: "bi-tiktok",
  youtube: "bi-youtube",
  x: "bi-twitter-x",
  twitter: "bi-twitter-x",
  linkedin: "bi-linkedin",
  whatsapp: "bi-whatsapp",
  pinterest: "bi-pinterest",
  telegram: "bi-telegram",
  snapchat: "bi-snapchat",
  threads: "bi-threads",
};

// Links { name: url } aus den Einstellungen; nur http(s)-Links werden angezeigt
const SocialLinks = ({ links, className = "social" }) => {
  const entries = Object.entries(links || {}).filter(([, url]) => /^https?:\/\//i.test(url || ""));
  if (entries.length === 0) return null;

  return (
    <div className={className}>
      {entries.map(([name, url]) => (
        <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name} title={name}>
          <i className={ICONS[name] || "bi-link-45deg"}></i>
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;
