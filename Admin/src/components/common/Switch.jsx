import React from 'react';

// Ein/Aus-Schalter (Knopf wandert in RTL automatisch auf die andere Seite)
const Switch = ({ id, checked, onChange, label, disabled }) => (
  <button id={id} type="button" role="switch" aria-checked={checked} aria-label={label} title={label}
    className={`switch-x ${checked ? 'on' : ''}`} disabled={disabled} onClick={() => onChange(!checked)}>
    <span className="switch-x-knob" aria-hidden="true"></span>
  </button>
);

export default Switch;
