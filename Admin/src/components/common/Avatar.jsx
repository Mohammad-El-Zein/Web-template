import React from 'react';

// Initialen aus Name oder E-Mail, z. B. "Mohammad El Zein" -> "ME"
const initials = (name, email) => {
  const source = (name || '').trim() || (email || '').split('@')[0];
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Avatar = ({ name, email, size = '' }) => (
  <span className={`avatar ${size}`} aria-hidden="true">{initials(name, email)}</span>
);

export default Avatar;
