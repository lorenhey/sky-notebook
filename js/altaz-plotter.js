/**
 * sky-notebook - AltAzPlotter
 * High-precision interactive SVG celestial altitude and airmass curve renderer
 * across astronomical twilight zones and culmination meridian.
 */

const AltAzPlotter = (() => {
  /**
   * Render an interactive SVG Altitude/Airmass timeline.
   * @param {HTMLElement} container - DOM container element
   * @param {Object} trajectory - Data from AstroCalc.generateNightTrajectory
   * @param {Object} target - Target metadata (name, ra, dec)
   * @param {Object} site - Site metadata (name, lat, lon)
   */
  function render(container, trajectory, target, site) {
    if (!container || !trajectory || !trajectory.samples || trajectory.samples.length === 0) {
      if (container) container.innerHTML = '<div class="text-gray-400 p-4">Sin datos de trayectoria.</div>';
      return;
    }

    const width = 800;
    const height = 300;
    const padding = { top: 35, right: 60, bottom: 45, left: 60 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const samples = trajectory.samples;
    const numSamples = samples.length;

    // Y scale: altitude from -20 deg to +90 deg
    const minAlt = -20;
    const maxAlt = 90;
    const altRange = maxAlt - minAlt;

    function getY(alt) {
      const clamped = Math.max(minAlt, Math.min(maxAlt, alt));
      return padding.top + plotH * (1.0 - (clamped - minAlt) / altRange);
    }

    function getX(i) {
      return padding.left + (i / (numSamples - 1)) * plotW;
    }

    // Build SVG path for target altitude
    let pathD = '';
    let transitIdx = 0;
    let maxFoundAlt = -999;

    samples.forEach((s, i) => {
      const x = getX(i);
      const y = getY(s.altitude);
      if (i === 0) {
        pathD += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      } else {
        pathD += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      if (s.altitude > maxFoundAlt) {
        maxFoundAlt = s.altitude;
        transitIdx = i;
      }
    });

    // Altitude lines
    const gridAlts = [0, 30, 60, 90];
    let gridLinesSvg = '';
    gridAlts.forEach(alt => {
      const y = getY(alt);
      const isHorizon = alt === 0;
      const isAirmass2 = alt === 30;
      const stroke = isHorizon ? '#ef4444' : isAirmass2 ? '#f59e0b' : '#374151';
      const strokeDash = isHorizon ? '4 3' : isAirmass2 ? '6 4' : '2 2';
      const label = isHorizon ? 'Horizonte 0°' : isAirmass2 ? 'Airmass X=2.0 (30°)' : `${alt}°`;
      
      gridLinesSvg += `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${stroke}" stroke-dasharray="${strokeDash}" stroke-width="1.2" opacity="0.8"/>
        <text x="${padding.left - 8}" y="${y + 4}" fill="${stroke}" font-size="10" text-anchor="end" font-family="monospace">${alt}°</text>
      `;
    });

    // Right-side airmass labels
    const airmassLabels = [
      { alt: 90, label: 'X=1.0' },
      { alt: 60, label: 'X=1.15' },
      { alt: 30, label: 'X=2.0' },
      { alt: 15, label: 'X=3.8' }
    ];
    let airmassSvg = '';
    airmassLabels.forEach(item => {
      const y = getY(item.alt);
      airmassSvg += `
        <text x="${width - padding.right + 8}" y="${y + 4}" fill="#9ca3af" font-size="10" text-anchor="start" font-family="monospace">${item.label}</text>
      `;
    });

    // Time ticks (every 4 samples = 1 hour)
    let timeTicksSvg = '';
    for (let i = 0; i < numSamples; i += 4) {
      const x = getX(i);
      const timeStr = samples[i].timeStr;
      timeTicksSvg += `
        <line x1="${x}" y1="${padding.top}" x2="${x}" y2="${height - padding.bottom}" stroke="#374151" stroke-dasharray="2 2" stroke-width="0.8" opacity="0.4"/>
        <text x="${x}" y="${height - padding.bottom + 18}" fill="#9ca3af" font-size="10" text-anchor="middle" font-family="monospace">${timeStr}</text>
      `;
    }

    // Transit culmination marker
    const transitX = getX(transitIdx);
    const transitY = getY(samples[transitIdx].altitude);
    const transitSample = samples[transitIdx];

    // Build complete SVG markup
    const svg = `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-auto bg-gray-900 rounded-lg shadow-inner select-none" id="altaz-svg-root">
        <defs>
          <linearGradient id="nightSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="60%" stop-color="#020617" />
            <stop offset="100%" stop-color="#000000" />
          </linearGradient>
          <linearGradient id="optZoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#10b981" stop-opacity="0.0" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Background -->
        <rect x="0" y="0" width="${width}" height="${height}" fill="url(#nightSkyGrad)" rx="8"/>

        <!-- Optimal imaging band (Alt >= 30 deg) -->
        <rect x="${padding.left}" y="${getY(90)}" width="${plotW}" height="${getY(30) - getY(90)}" fill="url(#optZoneGrad)"/>

        <!-- Grid lines and scales -->
        ${gridLinesSvg}
        ${airmassSvg}
        ${timeTicksSvg}

        <!-- Altitude Path -->
        <path d="${pathD}" fill="none" stroke="#38bdf8" stroke-width="2.8" filter="url(#glow)"/>

        <!-- Transit Culmination Point -->
        <circle cx="${transitX}" cy="${transitY}" r="5.5" fill="#f59e0b" stroke="#ffffff" stroke-width="1.8"/>
        <line x1="${transitX}" y1="${transitY}" x2="${transitX}" y2="${height - padding.bottom}" stroke="#f59e0b" stroke-dasharray="3 3" stroke-width="1.2" opacity="0.7"/>
        <text x="${transitX}" y="${transitY - 10}" fill="#fbbf24" font-size="11" font-weight="bold" text-anchor="middle" font-family="sans-serif">
          Tránsito: ${transitSample.altitude.toFixed(1)}° (${transitSample.timeStr})
        </text>

        <!-- Chart Title & Metadata -->
        <text x="${padding.left}" y="20" fill="#f3f4f6" font-size="13" font-weight="bold" font-family="sans-serif">
          ${target.name} (${target.id.toUpperCase()}) — Curva de Altitud y Masa de Aire
        </text>
        <text x="${width - padding.right}" y="20" fill="#9ca3af" font-size="11" text-anchor="end" font-family="sans-serif">
          Sitio: ${site.name} (Lat: ${site.latitude.toFixed(2)}°)
        </text>

        <!-- Axis Titles -->
        <text x="${padding.left - 35}" y="${height / 2}" fill="#9ca3af" font-size="11" text-anchor="middle" transform="rotate(-90 ${padding.left - 35} ${height / 2})" font-family="sans-serif">
          Altitud (°)
        </text>
        <text x="${width - 15}" y="${height / 2}" fill="#9ca3af" font-size="11" text-anchor="middle" transform="rotate(90 ${width - 15} ${height / 2})" font-family="sans-serif">
          Masa de Aire (X)
        </text>

        <!-- Interactive Hover Group -->
        <g id="hover-group" style="display: none;">
          <line id="hover-line" x1="0" y1="${padding.top}" x2="0" y2="${height - padding.bottom}" stroke="#a855f7" stroke-width="1.5" stroke-dasharray="4 2"/>
          <circle id="hover-circle" cx="0" cy="0" r="5" fill="#a855f7" stroke="#ffffff" stroke-width="1.5"/>
          <rect id="hover-box" x="0" y="0" width="135" height="52" rx="4" fill="#0f172a" stroke="#a855f7" stroke-width="1.2" opacity="0.95"/>
          <text id="hover-text-1" x="0" y="0" fill="#f8fafc" font-size="10" font-family="monospace" font-weight="bold"></text>
          <text id="hover-text-2" x="0" y="0" fill="#38bdf8" font-size="10" font-family="monospace"></text>
          <text id="hover-text-3" x="0" y="0" fill="#f59e0b" font-size="10" font-family="monospace"></text>
        </g>
      </svg>
    `;

    container.innerHTML = svg;

    // Attach interactive hover listener
    const svgEl = container.querySelector('#altaz-svg-root');
    const hoverGroup = container.querySelector('#hover-group');
    const hoverLine = container.querySelector('#hover-line');
    const hoverCircle = container.querySelector('#hover-circle');
    const hoverBox = container.querySelector('#hover-box');
    const hoverText1 = container.querySelector('#hover-text-1');
    const hoverText2 = container.querySelector('#hover-text-2');
    const hoverText3 = container.querySelector('#hover-text-3');

    if (!svgEl) return;

    svgEl.addEventListener('mousemove', (e) => {
      const rect = svgEl.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const svgX = (clientX / rect.width) * width;

      if (svgX < padding.left || svgX > width - padding.right) {
        hoverGroup.style.display = 'none';
        return;
      }

      // Find nearest sample
      const ratio = (svgX - padding.left) / plotW;
      const sampleIdx = Math.max(0, Math.min(numSamples - 1, Math.round(ratio * (numSamples - 1))));
      const s = samples[sampleIdx];
      const curX = getX(sampleIdx);
      const curY = getY(s.altitude);

      hoverGroup.style.display = 'block';
      hoverLine.setAttribute('x1', curX);
      hoverLine.setAttribute('x2', curX);
      hoverCircle.setAttribute('cx', curX);
      hoverCircle.setAttribute('cy', curY);

      let boxX = curX + 10;
      if (boxX + 140 > width - padding.right) {
        boxX = curX - 145;
      }
      let boxY = Math.min(curY - 10, height - padding.bottom - 55);
      if (boxY < padding.top) boxY = padding.top + 5;

      hoverBox.setAttribute('x', boxX);
      hoverBox.setAttribute('y', boxY);

      hoverText1.setAttribute('x', boxX + 8);
      hoverText1.setAttribute('y', boxY + 16);
      hoverText1.textContent = `Hora: ${s.timeStr}`;

      hoverText2.setAttribute('x', boxX + 8);
      hoverText2.setAttribute('y', boxY + 30);
      hoverText2.textContent = `Alt: ${s.altitude.toFixed(1)}° | Az: ${s.azimuth.toFixed(0)}°`;

      hoverText3.setAttribute('x', boxX + 8);
      hoverText3.setAttribute('y', boxY + 44);
      hoverText3.textContent = `Airmass: ${s.airmass < 50 ? s.airmass.toFixed(2) : 'Bajo Horizonte'}`;
    });

    svgEl.addEventListener('mouseleave', () => {
      hoverGroup.style.display = 'none';
    });
  }

  return {
    render
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AltAzPlotter;
}
