import React from 'react';
import { useTranslation } from 'react-i18next';
import { currentLocale, formatPrice } from '../../i18n';

// Saubere Achsenwerte, z. B. 0 / 25 / 50 / 75 / 100
const niceMax = (value) => {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value) * magnitude;
};

const RevenueChart = ({ days }) => {
  const { t } = useTranslation();
  const max = niceMax(Math.max(...days.map((d) => d.revenue)));
  const peak = days.reduce((best, d) => (d.revenue > best.revenue ? d : best), days[0]);
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((f) => Math.round(max * f));
  const dayLabel = (date, weekday = 'short') => new Intl.DateTimeFormat(currentLocale(), { weekday }).format(date);
  const fullDate = (date) => new Intl.DateTimeFormat(currentLocale(), { weekday: 'long', day: 'numeric', month: 'short' }).format(date);
  const compact = (value) => new Intl.NumberFormat(currentLocale(), { notation: 'compact', maximumFractionDigits: 1 }).format(value);

  return (
    <>
      <div className="bar-chart" aria-hidden="true">
        <div className="bar-chart-grid">
          {ticks.map((tick) => <span key={tick} data-label={`${compact(tick)} €`}></span>)}
        </div>
        <div className="bar-chart-bars">
          {days.map((day) => {
            const height = (day.revenue / max) * 100;
            return (
              <div className="bar-col" key={day.date.toISOString()} tabIndex={0}>
                <div className="bar-tooltip">{fullDate(day.date)}: <strong>{formatPrice(day.revenue)}</strong></div>
                <div className="bar-track">
                  <div className={`bar ${day.revenue === 0 ? 'empty' : ''}`} style={{ height: `${height}%`, position: 'relative' }}>
                    {day === peak && day.revenue > 0 && <span className="bar-peak">{formatPrice(day.revenue)}</span>}
                  </div>
                </div>
                <div className="bar-day">
                  <span className="day-long">{dayLabel(day.date)}</span>
                  <span className="day-short">{dayLabel(day.date, 'narrow')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Tabelle für Screenreader */}
      <table className="visually-hidden-table">
        <caption>{t('dashboard.chartTable')}</caption>
        <tbody>
          {days.map((day) => (
            <tr key={day.date.toISOString()}><th scope="row">{fullDate(day.date)}</th><td>{formatPrice(day.revenue)}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default RevenueChart;
