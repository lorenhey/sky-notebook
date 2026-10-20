/**
 * sky-notebook - AstroCalc
 * Rigorous celestial mechanics, coordinate conversion, ephemeris,
 * altitude-azimuth projection, airmass, and optical train mathematics.
 */

const AstroCalc = (() => {
  const DEG2RAD = Math.PI / 180.0;
  const RAD2DEG = 180.0 / Math.PI;
  const HRS2RAD = Math.PI / 12.0;
  const RAD2HRS = 12.0 / Math.PI;

  /**
   * Parse Right Ascension string (e.g. "00h42m44.3s", "05:35:17", "84.1") into degrees.
   */
  function parseRA(str) {
    if (typeof str === 'number') return str;
    if (!str || typeof str !== 'string') return 0;
    const clean = str.trim();
    // Format "05h35m17.3s" or "05h 35m 17s"
    const hms = clean.match(/^([+-]?\d+(?:\.\d+)?)[hH:\s]+(\d+(?:\.\d+)?)[mM:\s]+(\d+(?:\.\d+)?)s?$/);
    if (hms) {
      const h = parseFloat(hms[1]);
      const m = parseFloat(hms[2]);
      const s = parseFloat(hms[3]);
      return (h + m / 60.0 + s / 3600.0) * 15.0;
    }
    // Simple decimal hours or degrees
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
  }

  /**
   * Parse Declination string (e.g. "+41d16m09s", "-05:23:28", "-5.39") into degrees.
   */
  function parseDec(str) {
    if (typeof str === 'number') return str;
    if (!str || typeof str !== 'string') return 0;
    const clean = str.trim();
    const sign = clean.startsWith('-') ? -1 : 1;
    const dms = clean.match(/^[+-]?(\d+(?:\.\d+)?)[dD:\s]+(\d+(?:\.\d+)?)[mM:\s]+(\d+(?:\.\d+)?)s?$/);
    if (dms) {
      const d = parseFloat(dms[1]);
      const m = parseFloat(dms[2]);
      const s = parseFloat(dms[3]);
      return sign * (d + m / 60.0 + s / 3600.0);
    }
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
  }

  /**
   * Format decimal degrees to Sexagesimal RA ("HHh MMm SS.Ss")
   */
  function formatRA(deg) {
    let hrs = (deg / 15.0) % 24.0;
    if (hrs < 0) hrs += 24.0;
    const h = Math.floor(hrs);
    const remM = (hrs - h) * 60.0;
    const m = Math.floor(remM);
    const s = ((remM - m) * 60.0).toFixed(1);
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(4, '0')}s`;
  }

  /**
   * Format decimal degrees to Sexagesimal Dec ("+DD° MM' SS\"")
   */
  function formatDec(deg) {
    const sign = deg < 0 ? '-' : '+';
    const abs = Math.abs(deg);
    const d = Math.floor(abs);
    const remM = (abs - d) * 60.0;
    const m = Math.floor(remM);
    const s = Math.round((remM - m) * 60.0);
    return `${sign}${String(d).padStart(2, '0')}° ${String(m).padStart(2, '0')}' ${String(s).padStart(2, '0')}"`;
  }

  /**
   * Calculate Julian Date from a JavaScript Date object (UTC).
   */
  function toJulianDate(date) {
    const time = date.getTime();
    return time / 86400000.0 + 2440587.5;
  }

  /**
   * Calculate Greenwich Mean Sidereal Time (GMST) in degrees.
   */
  function getGMST(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000.0;
    gmst = gmst % 360.0;
    if (gmst < 0) gmst += 360.0;
    return gmst;
  }

  /**
   * Calculate Local Sidereal Time (LST) in degrees.
   * Longitude in degrees: East positive (+), West negative (-).
   */
  function getLST(date, lonDeg) {
    const jd = toJulianDate(date);
    const gmst = getGMST(jd);
    let lst = (gmst + lonDeg) % 360.0;
    if (lst < 0) lst += 360.0;
    return lst;
  }

  /**
   * Calculate Altitude and Azimuth for a celestial target.
   * @param {number} raDeg - Right Ascension in degrees (0..360)
   * @param {number} decDeg - Declination in degrees (-90..+90)
   * @param {number} latDeg - Observer latitude in degrees (-90..+90)
   * @param {number} lonDeg - Observer longitude in degrees (-180..+180)
   * @param {Date} date - Observation time
   * @returns {{ altitude: number, azimuth: number, hourAngleHours: number, airmass: number }}
   */
  function getHorizontalCoordinates(raDeg, decDeg, latDeg, lonDeg, date) {
    const lstDeg = getLST(date, lonDeg);
    let haDeg = lstDeg - raDeg;
    while (haDeg < -180.0) haDeg += 360.0;
    while (haDeg > 180.0) haDeg -= 360.0;

    const haRad = haDeg * DEG2RAD;
    const decRad = decDeg * DEG2RAD;
    const latRad = latDeg * DEG2RAD;

    // sin(alt) = sin(lat)*sin(dec) + cos(lat)*cos(dec)*cos(ha)
    const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
    const altRad = Math.asin(Math.max(-1.0, Math.min(1.0, sinAlt)));
    const altDeg = altRad * RAD2DEG;

    // cos(az) = (sin(dec) - sin(lat)*sin(alt)) / (cos(lat)*cos(alt))
    const cosAlt = Math.cos(altRad);
    let azDeg = 0;
    if (Math.abs(cosAlt) > 1e-6) {
      let cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinAlt) / (Math.cos(latRad) * cosAlt);
      cosAz = Math.max(-1.0, Math.min(1.0, cosAz));
      azDeg = Math.acos(cosAz) * RAD2DEG;
      if (Math.sin(haRad) > 0) {
        azDeg = 360.0 - azDeg;
      }
    }

    // Airmass calculation (Rozenberg 1966)
    let airmass = Infinity;
    if (altDeg > 0) {
      airmass = 1.0 / (Math.sin(altRad) + 0.001867 * Math.pow(altDeg + 3.8299, -1.2536));
      if (airmass < 1.0) airmass = 1.0;
    }

    return {
      altitude: altDeg,
      azimuth: azDeg,
      hourAngleHours: haDeg / 15.0,
      airmass: altDeg > 0 ? airmass : 99.0
    };
  }

  /**
   * Approximate Moon phase and position for a given date.
   */
  function getMoonInfo(date) {
    const jd = toJulianDate(date);
    // Days since Jan 6 2000 (New Moon reference epoch: JD 2451549.5)
    const daysSinceNew = (jd - 2451549.5) % 29.53058867;
    const age = daysSinceNew < 0 ? daysSinceNew + 29.53058867 : daysSinceNew;
    const phaseFraction = age / 29.53058867; // 0..1
    const illumination = 0.5 * (1 - Math.cos(phaseFraction * 2 * Math.PI)); // 0..1

    let phaseName = 'Luna Nueva';
    if (age >= 1.8 && age < 5.5) phaseName = 'Creciente Cóncava';
    else if (age >= 5.5 && age < 9.2) phaseName = 'Cuarto Creciente';
    else if (age >= 9.2 && age < 12.9) phaseName = 'Creciente Gibosa';
    else if (age >= 12.9 && age < 16.6) phaseName = 'Luna Llena';
    else if (age >= 16.6 && age < 20.3) phaseName = 'Menguante Gibosa';
    else if (age >= 20.3 && age < 24.0) phaseName = 'Cuarto Menguante';
    else if (age >= 24.0 && age < 27.7) phaseName = 'Menguante Cóncava';

    return {
      ageDays: age,
      phaseFraction,
      illuminationPercent: Math.round(illumination * 100),
      phaseName
    };
  }

  /**
   * Calculate optical train and sensor sampling metrics.
   * @param {number} apertureMm - Telescope clear aperture in mm
   * @param {number} focalLengthMm - Telescope focal length in mm
   * @param {number} pixelSizeUm - Sensor pixel pitch in micrometers
   * @param {number} sensorWidthPx - Sensor resolution width in pixels
   * @param {number} sensorHeightPx - Sensor resolution height in pixels
   */
  function calculateOpticalMetrics(apertureMm, focalLengthMm, pixelSizeUm, sensorWidthPx, sensorHeightPx) {
    const fRatio = focalLengthMm / apertureMm;
    // Image scale in arcsec/pixel = 206.265 * pixelSize(um) / focalLength(mm)
    const imageScaleArcsec = (206.265 * pixelSizeUm) / focalLengthMm;
    // Dawes limit in arcseconds = 116 / D(mm)
    const dawesLimitArcsec = 116.0 / apertureMm;
    // Rayleigh criterion in arcseconds = 138 / D(mm)
    const rayleighArcsec = 138.0 / apertureMm;
    // Sensor physical dimensions in mm
    const sensorWidthMm = (sensorWidthPx * pixelSizeUm) / 1000.0;
    const sensorHeightMm = (sensorHeightPx * pixelSizeUm) / 1000.0;
    // Field of view in arcminutes
    const fovXArcmin = (sensorWidthMm / focalLengthMm) * (180.0 / Math.PI) * 60.0;
    const fovYArcmin = (sensorHeightMm / focalLengthMm) * (180.0 / Math.PI) * 60.0;
    // Light gathering power relative to 7mm dark-adapted human eye
    const lightGrasp = Math.pow(apertureMm / 7.0, 2);

    return {
      focalRatio: fRatio.toFixed(2),
      imageScaleArcsec: imageScaleArcsec.toFixed(2),
      dawesLimitArcsec: dawesLimitArcsec.toFixed(2),
      rayleighArcsec: rayleighArcsec.toFixed(2),
      sensorWidthMm: sensorWidthMm.toFixed(2),
      sensorHeightMm: sensorHeightMm.toFixed(2),
      fovXArcmin: fovXArcmin.toFixed(1),
      fovYArcmin: fovYArcmin.toFixed(1),
      lightGrasp: Math.round(lightGrasp)
    };
  }

  /**
   * Generate full night timeline samples (e.g. 18:00 to 06:00 local time).
   */
  function generateNightTrajectory(raDeg, decDeg, site, observingNightDate) {
    const samples = [];
    const baseDate = new Date(observingNightDate);
    // Start at 18:00 on observing night (local approximate)
    baseDate.setHours(18, 0, 0, 0);

    // Sample every 15 minutes for 14 hours (56 sample points)
    for (let i = 0; i <= 56; i++) {
      const pointDate = new Date(baseDate.getTime() + i * 15 * 60 * 1000);
      const coords = getHorizontalCoordinates(raDeg, decDeg, site.latitude, site.longitude, pointDate);
      samples.push({
        time: pointDate,
        timeStr: pointDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        altitude: coords.altitude,
        azimuth: coords.azimuth,
        airmass: coords.airmass,
        isUp: coords.altitude > 0,
        isOptimal: coords.altitude >= 30.0 // Airmass <= 2.0
      });
    }

    // Transit analysis (meridian transit is when Hour Angle is 0)
    const maxAlt = 90.0 - Math.abs(site.latitude - decDeg);

    return {
      samples,
      maxAltitude: maxAlt,
      transitCulmination: maxAlt.toFixed(1)
    };
  }

  return {
    parseRA,
    parseDec,
    formatRA,
    formatDec,
    toJulianDate,
    getGMST,
    getLST,
    getHorizontalCoordinates,
    getMoonInfo,
    calculateOpticalMetrics,
    generateNightTrajectory
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AstroCalc;
}
