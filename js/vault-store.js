/**
 * sky-notebook - VaultStore
 * Local storage, curated astronomical datasets, sessions, targets, rigs, sites,
 * and YAML frontmatter serializer/deserializer.
 */

const VaultStore = (() => {
  const STORAGE_KEY = 'sky_notebook_vault_v2';

  const DEFAULT_TARGETS = [
    {
      id: 'm31',
      name: 'Andromeda Galaxy',
      aliases: ['NGC 224', 'M31', 'Messier 31'],
      object_type: 'Galaxia Espiral',
      ra: '00h42m44.3s',
      dec: '+41d16m09s',
      epoch: 'J2000',
      is_moving: false,
      magnitude: 3.44,
      notes: 'La gran galaxia espiral más cercana a la Vía Láctea. Excelente contraste en tomas de banda ancha LRGB con extensión de brazos y polvo.'
    },
    {
      id: 'm42',
      name: 'Gran Nebulosa de Orión',
      aliases: ['NGC 1976', 'M42', 'Trapecio de Orión'],
      object_type: 'Nebulosa de Emisión / Reflexión',
      ra: '05h35m17.3s',
      dec: '-05d23m28s',
      epoch: 'J2000',
      is_moving: false,
      magnitude: 4.0,
      notes: 'Vivero estelar brillante en el cinturón de Orión. Requiere composiciones HDR para preservar el cúmulo central del Trapecio sin quemar núcleos.'
    },
    {
      id: 'ngc3372',
      name: 'Nebulosa de Carina (Eta Carinae)',
      aliases: ['NGC 3372', 'Gran Nebulosa de Carina', 'Caldwell 92'],
      object_type: 'Región HII Gigante',
      ra: '10h45m08.5s',
      dec: '-59d52m04s',
      epoch: 'J2000',
      is_moving: false,
      magnitude: 3.0,
      notes: 'Monumento del cielo austral. Incluye la estrella variable luminosa azul Eta Carinae y la nebulosa del Homúnculo. Emisión descomunal en H-alpha y OIII.'
    },
    {
      id: 'ngc5139',
      name: 'Omega Centauri',
      aliases: ['NGC 5139', 'Caldwell 80', 'ω Centauri'],
      object_type: 'Cúmulo Globular',
      ra: '13h26m47.0s',
      dec: '-47d28m51s',
      epoch: 'J2000',
      is_moving: false,
      magnitude: 3.9,
      notes: 'El cúmulo globular más masivo y brillante visible en el cielo nocturno, con más de 10 millones de estrellas. Ideal para probar resolución y seeing.'
    },
    {
      id: 'm45',
      name: 'Cúmulo de las Pléyades',
      aliases: ['M45', 'Las Siete Hermanas', 'Melotte 22'],
      object_type: 'Cúmulo Abierto con Nebulosa de Reflexión',
      ra: '03h47m24.0s',
      dec: '+24d07m00s',
      epoch: 'J2000',
      is_moving: false,
      magnitude: 1.6,
      notes: 'Cúmulo estelar joven inmerso en una nube de polvo interestelar que dispersa la luz azul de las estrellas tipo B.'
    },
    {
      id: 'm104',
      name: 'Galaxia del Sombrero',
      aliases: ['NGC 4594', 'M104'],
      object_type: 'Galaxia Espiral No Barrada',
      ra: '12h39m59.4s',
      dec: '-11d37m23s',
      epoch: 'J2000',
      is_moving: false,
      magnitude: 8.0,
      notes: 'Destacada banda de polvo oscuro ecuatorial y núcleo abultado con un agujero negro supermasivo central de mil millones de masas solares.'
    },
    {
      id: 'ngc2070',
      name: 'Nebulosa de la Tarántula',
      aliases: ['NGC 2070', '30 Doradus', 'Caldwell 103'],
      object_type: 'Super Región HII en la Gran Nube de Magallanes',
      ra: '05h38m38.0s',
      dec: '-69d05m42s',
      epoch: 'J2000',
      is_moving: false,
      magnitude: 8.0,
      notes: 'La mayor y más activa región de formación estelar del Grupo Local. Alberga el cúmulo estelar masivo R136 con estrellas hipermasivas.'
    }
  ];

  const DEFAULT_SITES = [
    {
      id: 'casleo',
      name: 'Complejo Astronómico El Leoncito (CASLEO)',
      latitude: -31.7986,
      longitude: -69.2956,
      altitude: 2552,
      timezone: 'UTC-03:00',
      bortle: 1,
      sqm: 21.9,
      province: 'San Juan, Argentina'
    },
    {
      id: 'bosque_alegre',
      name: 'Estación Astrofísica de Bosque Alegre (EABA - OAC)',
      latitude: -31.5983,
      longitude: -64.5497,
      altitude: 1250,
      timezone: 'UTC-03:00',
      bortle: 3,
      sqm: 21.3,
      province: 'Córdoba, Argentina'
    },
    {
      id: 'boxmark_plant',
      name: 'Boxmark Rooftop Observatory / San Jerónimo Norte',
      latitude: -31.5458,
      longitude: -61.0825,
      altitude: 35,
      timezone: 'UTC-03:00',
      bortle: 4,
      sqm: 20.4,
      province: 'Santa Fe, Argentina'
    },
    {
      id: 'atacama',
      name: 'Desierto de Atacama / San Pedro de Atacama',
      latitude: -22.9087,
      longitude: -68.1997,
      altitude: 2400,
      timezone: 'UTC-03:00',
      bortle: 1,
      sqm: 22.0,
      province: 'Antofagasta, Chile'
    }
  ];

  const DEFAULT_RIGS = [
    {
      id: 'rig_triplet80',
      name: 'Askar 80PHQ Petzval Flatfield Triplet',
      aperture_mm: 80,
      focal_length_mm: 600,
      f_ratio: 7.5,
      camera: 'ZWO ASI2600MM Pro (Mono APS-C)',
      pixel_pitch_um: 3.76,
      sensor_res: '6248 x 4176',
      sensor_width_px: 6248,
      sensor_height_px: 4176,
      filters: ['Luminance', 'Red', 'Green', 'Blue', 'H-Alpha 3nm', 'OIII 3nm', 'SII 3nm'],
      mount: 'ZWO AM5 Harmonic Drive',
      guiding: 'ZWO OAG-L + ASI174MM Mini'
    },
    {
      id: 'rig_newtonian200',
      name: 'Sky-Watcher Quattro 200P Astrophotograph',
      aperture_mm: 200,
      focal_length_mm: 800,
      f_ratio: 4.0,
      camera: 'QHY268M BSI (Mono APS-C)',
      pixel_pitch_um: 3.76,
      sensor_res: '6280 x 4210',
      sensor_width_px: 6280,
      sensor_height_px: 4210,
      filters: ['Baader LRGB', 'Chroma 5nm Narrowband'],
      mount: 'Sky-Watcher EQ6-R Pro',
      guiding: '60mm Guidescope + QHY5III462C'
    },
    {
      id: 'rig_sct11',
      name: 'Celestron EdgeHD 1100 + Reducer 0.7x',
      aperture_mm: 280,
      focal_length_mm: 1960,
      f_ratio: 7.0,
      camera: 'ZWO ASI6200MM Pro (Full Frame)',
      pixel_pitch_um: 3.76,
      sensor_res: '9576 x 6388',
      sensor_width_px: 9576,
      sensor_height_px: 6388,
      filters: ['Astrodon Tru-Balance E-Series Gen2 LRGB', 'Don 3nm Ha'],
      mount: 'iOptron CEM70',
      guiding: 'Celestron Off-Axis Guider'
    }
  ];

  const DEFAULT_SESSIONS = [
    {
      id: 'sess-01',
      observing_night: '2026-09-11',
      start_time: '2026-09-11T23:15:00Z',
      end_time: '2026-09-12T04:45:00Z',
      timezone: 'UTC-03:00',
      outcome: 'successful',
      project: 'Broadband Spiral Galaxies Survey',
      targets: ['m31'],
      site: 'bosque_alegre',
      rig: 'rig_triplet80',
      seeing_arcsec: 1.8,
      sqm_measured: 21.35,
      temperature_c: 8.5,
      humidity_pct: 54,
      events: [
        {
          timestamp: '2026-09-11T23:15:00Z',
          event_type: 'setup',
          content: 'Puesta en estación con polemaster y enfoque inicial con máscara de Bahtinov.',
          provenance: 'manual'
        },
        {
          timestamp: '2026-09-11T23:45:00Z',
          event_type: 'focus_run',
          content: 'Rutina de autoenfoque (curva en V hiperbólica). HFR final 1.42 px en filtro L.',
          provenance: 'automated'
        },
        {
          timestamp: '2026-09-12T01:20:00Z',
          event_type: 'meridian_flip',
          content: 'Meridian flip automático completado en 3.5 minutos. Recalibración de guiado con PHD2 exitosa (RMS 0.45").',
          provenance: 'automated'
        },
        {
          timestamp: '2026-09-12T04:30:00Z',
          event_type: 'calibration_frames',
          content: 'Captura de 30 Dark frames (-10°C, 180s) y 50 Bias frames para biblioteca maestra.',
          provenance: 'manual'
        }
      ],
      files: [
        { path: 'lights/m31/Light_M31_180s_L_001.fits', type: 'FITS', size_bytes: 52428800 },
        { path: 'lights/m31/Light_M31_180s_R_001.fits', type: 'FITS', size_bytes: 52428800 },
        { path: 'lights/m31/Light_M31_180s_G_001.fits', type: 'FITS', size_bytes: 52428800 },
        { path: 'lights/m31/Light_M31_180s_B_001.fits', type: 'FITS', size_bytes: 52428800 }
      ],
      measurements: [
        { quantity: 'Total Integration Time', value: 3.5, unit: 'hours', method: 'stack_sum' },
        { quantity: 'Average Guide RMS', value: 0.48, unit: 'arcsec', uncertainty: 0.05, method: 'phd2_log' },
        { quantity: 'Median FWHM', value: 2.1, unit: 'arcsec', uncertainty: 0.2, method: 'astap_analysis' }
      ],
      markdown_narrative: `# Sesión sess-01: M31 Galaxia de Andrómeda

Sesión de banda ancha ejecutada desde la Estación Astrofísica de Bosque Alegre (OAC).

## Condiciones y Cielo
Noche despejada y seca con viento en calma (< 5 km/h). El seeing comenzó en torno a 2.2" y mejoró sostenidamente hasta 1.7" pasada la medianoche al disiparse la inversión térmica en la serranía.

## Resumen de Integración
- **Luminance**: 30 tomas de 180s (Gain 100, Offset 30, T=-10°C)
- **Red**: 12 tomas de 180s
- **Green**: 12 tomas de 180s
- **Blue**: 12 tomas de 180s
- **Tiempo total integrado**: 3.3 horas útiles.

## Notas Técnicas y Conclusiones
El guiado sobre el AM5 se mantuvo en RMS < 0.5" durante todo el tránsito. El meridiano transcurrió sin colisión ni pérdida de estrellas guía. Se observan detalles nítidos en las bandas oscuras de polvo interestelar y las regiones HII periféricas de M31.`
    },
    {
      id: 'sess-02',
      observing_night: '2026-10-18',
      start_time: '2026-10-18T22:30:00Z',
      end_time: '2026-10-19T05:00:00Z',
      timezone: 'UTC-03:00',
      outcome: 'successful',
      project: 'Deep Austral Narrowband Survey',
      targets: ['ngc3372'],
      site: 'casleo',
      rig: 'rig_newtonian200',
      seeing_arcsec: 1.2,
      sqm_measured: 21.92,
      temperature_c: 4.2,
      humidity_pct: 28,
      events: [
        {
          timestamp: '2026-10-18T22:30:00Z',
          event_type: 'collimation',
          content: 'Colimación fina del Newtoniano con láser barlowed y cheshire en foco primario.',
          provenance: 'manual'
        },
        {
          timestamp: '2026-10-18T23:10:00Z',
          event_type: 'narrowband_run',
          content: 'Inicio de secuencia continua H-alpha 3nm (tomas de 300 segundos a ganancia unitaria).',
          provenance: 'automated'
        },
        {
          timestamp: '2026-10-19T04:40:00Z',
          event_type: 'flat_frames',
          content: 'Toma de 25 flats con panel de electroluminiscencia al amanecer náutico.',
          provenance: 'manual'
        }
      ],
      files: [
        { path: 'lights/ngc3372/Light_Carina_300s_Ha_001.fits', type: 'FITS', size_bytes: 52428800 },
        { path: 'lights/ngc3372/Light_Carina_300s_OIII_001.fits', type: 'FITS', size_bytes: 52428800 }
      ],
      measurements: [
        { quantity: 'Total Integration Time', value: 5.2, unit: 'hours', method: 'stack_sum' },
        { quantity: 'Median FWHM', value: 1.45, unit: 'arcsec', uncertainty: 0.1, method: 'astap_analysis' }
      ],
      markdown_narrative: `# Sesión sess-02: Nebulosa de Carina (Eta Carinae)

Observación de alta resolución en banda estrecha desde el Complejo Astronómico El Leoncito (CASLEO, San Juan).

## Condiciones Excepcionales
Cielo Clase 1 en escala de Bortle (SQM 21.92). Estabilidad atmosférica andina notable con seeing inferior a 1.3". Humedad relativa del 28%.

## Estrategia de Adquisición
- **H-alpha 3nm**: 40 exposiciones de 300 segundos.
- **OIII 3nm**: 22 exposiciones de 300 segundos.
- Enfoque compensado dinámicamente cada 1.0°C de caída de temperatura ambiente.

## Resultados
Estructuras filamentarias de la Nebulosa de la Cerradura (Keyhole Nebula) resueltas con extraordinario micro-contraste. La nebulosa del Homúnculo revela la bipolaridad de la eyección de 1843 con mínima saturación.`
    },
    {
      id: 'sess-03',
      observing_night: '2026-10-19',
      start_time: '2026-10-19T23:00:00Z',
      end_time: '2026-10-20T03:30:00Z',
      timezone: 'UTC-03:00',
      outcome: 'partial',
      project: 'Urban & Industrial Astrophotography Benchmarking',
      targets: ['m42'],
      site: 'boxmark_plant',
      rig: 'rig_triplet80',
      seeing_arcsec: 2.6,
      sqm_measured: 20.38,
      temperature_c: 15.1,
      humidity_pct: 78,
      events: [
        {
          timestamp: '2026-10-19T23:00:00Z',
          event_type: 'station_setup',
          content: 'Montaje sobre trípode antivibratorio en azotea este de planta Boxmark.',
          provenance: 'manual'
        },
        {
          timestamp: '2026-10-20T01:45:00Z',
          event_type: 'cloud_interruption',
          content: 'Ingreso repentino de cirrus altos desde el suroeste; degradación del guiado a RMS 1.8".',
          provenance: 'manual'
        },
        {
          timestamp: '2026-10-20T02:30:00Z',
          event_type: 'session_abort',
          content: 'Condensación en lente frontal por rocío. Se interrumpe adquisición para resguardo del equipo.',
          provenance: 'manual'
        }
      ],
      files: [
        { path: 'lights/m42/Light_M42_30s_L_001.fits', type: 'FITS', size_bytes: 52428800 },
        { path: 'lights/m42/Light_M42_180s_L_001.fits', type: 'FITS', size_bytes: 52428800 }
      ],
      measurements: [
        { quantity: 'Total Usable Time', value: 1.8, unit: 'hours', method: 'subframe_selector' }
      ],
      markdown_narrative: `# Sesión sess-03: M42 Núcleo y HDR

Prueba de caracterización de fotometría e inmunidad al fondo de cielo en entorno industrial suburbano (San Jerónimo Norte).

## Incidencias y Lecciones
La sesión inició con excelente transparencia, pero hacia las 01:45 ingresaron capas de nubes altas. Además, la humedad trepó rápidamente al 78%, superando el punto de rocío y empañando el parasol por falta de calentador calefactor (dew heater).

## Lección Aprendida (Checklist de Campo)
Instalar cinta calefactora térmica conectada a PWM regulado siempre que la temperatura descienda a menos de 3°C del punto de rocío estimado.`
    }
  ];

  /**
   * Load Vault from LocalStorage or initialize with defaults.
   */
  function loadVault() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.sessions && parsed.targets) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error loading vault from localStorage:', e);
    }
    // Return default vault
    const vault = {
      sessions: DEFAULT_SESSIONS,
      targets: DEFAULT_TARGETS,
      sites: DEFAULT_SITES,
      rigs: DEFAULT_RIGS,
      version: '2.0.0'
    };
    saveVault(vault);
    return vault;
  }

  /**
   * Save Vault state to LocalStorage.
   */
  function saveVault(vault) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
    } catch (e) {
      console.error('Error saving vault to localStorage:', e);
    }
  }

  /**
   * Reset Vault to factory defaults.
   */
  function resetVault() {
    localStorage.removeItem(STORAGE_KEY);
    return loadVault();
  }

  /**
   * Convert a session object into clean Markdown + YAML frontmatter.
   */
  function sessionToMarkdown(session) {
    const yamlHeader = [
      '---',
      `id: "${session.id}"`,
      `type: "session"`,
      `observing_night: "${session.observing_night}"`,
      `start_time: "${session.start_time}"`,
      session.end_time ? `end_time: "${session.end_time}"` : 'end_time: null',
      `timezone: "${session.timezone || 'UTC-03:00'}"`,
      session.project ? `project: "${session.project}"` : 'project: null',
      `outcome: "${session.outcome || 'successful'}"`,
      `site: "${session.site || 'casleo'}"`,
      `rig: "${session.rig || 'rig_triplet80'}"`,
      `targets: [${(session.targets || []).map(t => `"${t}"`).join(', ')}]`,
      `created_at: "${session.created_at || new Date().toISOString()}"`,
      `updated_at: "${new Date().toISOString()}"`,
      '---',
      ''
    ].join('\n');

    return yamlHeader + (session.markdown_narrative || `# Sesión ${session.id}\n\nObservaciones astronómicas registradas.`);
  }

  /**
   * Convert a target object into clean Markdown + YAML frontmatter.
   */
  function targetToMarkdown(target) {
    const yamlHeader = [
      '---',
      `id: "${target.id}"`,
      `type: "target"`,
      `name: "${target.name}"`,
      `aliases: [${(target.aliases || []).map(a => `"${a}"`).join(', ')}]`,
      `object_type: "${target.object_type || 'Deep Sky'}"`,
      `ra: "${target.ra || '00h00m00s'}"`,
      `dec: "${target.dec || '+00d00m00s'}"`,
      `epoch: "${target.epoch || 'J2000'}"`,
      `is_moving: ${target.is_moving ? 'true' : 'false'}`,
      `created_at: "${target.created_at || new Date().toISOString()}"`,
      `updated_at: "${new Date().toISOString()}"`,
      '---',
      ''
    ].join('\n');

    return yamlHeader + (target.notes ? `# ${target.name}\n\n${target.notes}` : `# ${target.name}\n\nNotas astronómicas sobre el objetivo.`);
  }

  return {
    loadVault,
    saveVault,
    resetVault,
    sessionToMarkdown,
    targetToMarkdown,
    DEFAULT_TARGETS,
    DEFAULT_SITES,
    DEFAULT_RIGS,
    DEFAULT_SESSIONS
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VaultStore;
}
