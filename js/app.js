/**
 * sky-notebook - Main Application Controller
 * Manages tabs, reactive views, event binding, ephemeris calculations,
 * markdown narrative preview, and astronomical Red Mode.
 */

document.addEventListener('DOMContentLoaded', () => {
  let vault = VaultStore.loadVault();
  let currentSessionId = vault.sessions[0] ? vault.sessions[0].id : null;
  let currentTargetId = 'ngc3372';
  let currentSiteId = 'casleo';
  let currentRigId = 'rig_triplet80';

  // DOM Elements
  const tabButtons = document.querySelectorAll('.nav-tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const redModeToggleBtn = document.getElementById('red-mode-toggle');

  // Initialize Red Mode from localStorage
  if (localStorage.getItem('sky_notebook_red_mode') === 'true') {
    document.body.classList.add('red-mode');
  }

  redModeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('red-mode');
    const isRed = document.body.classList.contains('red-mode');
    localStorage.setItem('sky_notebook_red_mode', isRed);
  });

  // Keyboard shortcut: Shift + R for Red Mode
  document.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key.toLowerCase() === 'r' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      redModeToggleBtn.click();
    }
  });

  // Tab Switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  function switchTab(tabId) {
    tabButtons.forEach(b => {
      if (b.getAttribute('data-tab') === tabId) {
        b.classList.add('active-tab');
        b.classList.remove('inactive-tab');
      } else {
        b.classList.remove('active-tab');
        b.classList.add('inactive-tab');
      }
    });

    tabContents.forEach(c => {
      if (c.id === `tab-${tabId}`) {
        c.classList.remove('hidden');
      } else {
        c.classList.add('hidden');
      }
    });

    // Re-render relevant tab components
    if (tabId === 'planner') {
      renderPlanner();
    } else if (tabId === 'rigs') {
      renderOpticalCalc();
    } else if (tabId === 'journal') {
      renderJournal();
    } else if (tabId === 'targets') {
      renderTargets();
    }
  }

  // --- JOURNAL TAB ---
  function renderJournal() {
    const listContainer = document.getElementById('journal-sessions-list');
    const detailContainer = document.getElementById('session-detail-view');
    if (!listContainer || !detailContainer) return;

    listContainer.innerHTML = '';
    vault.sessions.forEach(sess => {
      const isSelected = sess.id === currentSessionId;
      const card = document.createElement('div');
      card.className = `p-4 rounded-lg border cursor-pointer transition ${
        isSelected ? 'bg-gray-800 border-sky-500 shadow-lg' : 'bg-gray-800/60 border-gray-700 hover:border-gray-500'
      }`;

      const targetBadges = (sess.targets || []).map(t => `<span class="bg-sky-950 text-sky-300 text-xs px-2 py-0.5 rounded border border-sky-700/50">${t.toUpperCase()}</span>`).join(' ');
      const outcomeClass = sess.outcome === 'successful' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                           sess.outcome === 'partial' ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-rose-950 text-rose-300 border-rose-800';

      card.innerHTML = `
        <div class="flex justify-between items-start mb-1">
          <h3 class="font-bold text-gray-100">${sess.id}: Noche ${sess.observing_night}</h3>
          <span class="text-xs px-2 py-0.5 rounded border font-semibold ${outcomeClass}">${sess.outcome || 'activo'}</span>
        </div>
        <p class="text-xs text-gray-400 mb-2">${sess.project || 'Sin proyecto asignado'}</p>
        <div class="flex items-center gap-2">
          ${targetBadges}
          <span class="text-xs text-gray-400 ml-auto">${sess.seeing_arcsec ? `Seeing: ${sess.seeing_arcsec}"` : ''}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        currentSessionId = sess.id;
        renderJournal();
      });

      listContainer.appendChild(card);
    });

    // Render details for current session
    const currentSession = vault.sessions.find(s => s.id === currentSessionId) || vault.sessions[0];
    if (currentSession) {
      renderSessionDetail(currentSession, detailContainer);
    }
  }

  function renderSessionDetail(session, container) {
    const siteObj = vault.sites.find(s => s.id === session.site) || vault.sites[0];
    const rigObj = vault.rigs.find(r => r.id === session.rig) || vault.rigs[0];

    const eventsList = (session.events || []).map(ev => `
      <li class="relative pl-6 pb-4 border-l border-gray-700 last:border-0 last:pb-0">
        <span class="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-sky-500 border border-gray-900"></span>
        <div class="text-xs font-mono text-gray-400">${new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC</div>
        <div class="text-sm font-semibold text-gray-200 capitalize">${ev.event_type.replace(/_/g, ' ')}</div>
        <div class="text-xs text-gray-300 mt-0.5">${ev.content}</div>
      </li>
    `).join('');

    const filesList = (session.files || []).map(f => `
      <div class="flex justify-between items-center text-xs p-2 bg-gray-900 rounded border border-gray-800 font-mono">
        <span class="text-gray-300 truncate max-w-xs">${f.path}</span>
        <span class="px-1.5 py-0.5 rounded bg-gray-800 text-sky-400">${f.type}</span>
      </div>
    `).join('') || '<div class="text-xs text-gray-400">Sin archivos FITS asociados.</div>';

    const measurementsList = (session.measurements || []).map(m => `
      <div class="p-2.5 bg-gray-900/80 rounded border border-gray-800 flex justify-between items-center text-xs">
        <span class="text-gray-400">${m.quantity}</span>
        <span class="font-bold text-emerald-400 font-mono">${m.value} ${m.unit}</span>
      </div>
    `).join('') || '<div class="text-xs text-gray-400">Sin mediciones instrumentales.</div>';

    // Parse simple markdown for narrative
    const rawMarkdown = session.markdown_narrative || `# Sesión ${session.id}\n\nSin notas registradas.`;
    const renderedHtml = simpleMarkdownToHtml(rawMarkdown);

    container.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
        <div class="flex justify-between items-start border-b border-gray-700 pb-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-100 flex items-center gap-2">
              ${session.id}
              <span class="text-sm font-normal px-2.5 py-0.5 rounded bg-gray-700 text-gray-300">Noche: ${session.observing_night}</span>
            </h2>
            <p class="text-sm text-sky-400 mt-1">${session.project || 'Observación General'}</p>
          </div>
          <div class="flex gap-2">
            <button id="export-session-md-btn" class="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition">
              Descargar .md
            </button>
          </div>
        </div>

        <!-- Metadata Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div class="bg-gray-900 p-3 rounded border border-gray-800">
            <span class="text-gray-400 block">Sitio Observacional</span>
            <span class="font-semibold text-gray-200">${siteObj.name}</span>
          </div>
          <div class="bg-gray-900 p-3 rounded border border-gray-800">
            <span class="text-gray-400 block">Instrumentación / Rig</span>
            <span class="font-semibold text-gray-200">${rigObj.name}</span>
          </div>
          <div class="bg-gray-900 p-3 rounded border border-gray-800">
            <span class="text-gray-400 block">Condición de Cielo</span>
            <span class="font-semibold text-emerald-400">Bortle ${siteObj.bortle} (SQM ${session.sqm_measured || siteObj.sqm})</span>
          </div>
          <div class="bg-gray-900 p-3 rounded border border-gray-800">
            <span class="text-gray-400 block">Seeing / Calidad</span>
            <span class="font-semibold text-amber-400">${session.seeing_arcsec ? `${session.seeing_arcsec}" FWHM` : 'No medido'}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Narrative Column -->
          <div class="lg:col-span-2 space-y-4">
            <h4 class="text-sm font-bold text-gray-300 uppercase tracking-wide border-b border-gray-700/60 pb-1">
              Narrativa de Campo y Bitácora
            </h4>
            <div class="prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed bg-gray-900/60 p-4 rounded border border-gray-800">
              ${renderedHtml}
            </div>

            <!-- New Note Inline Form -->
            <div class="pt-2">
              <label class="block text-xs font-medium text-gray-400 mb-1">Agregar Nota Rápida a la Sesión:</label>
              <div class="flex gap-2">
                <input type="text" id="inline-note-input" placeholder="Ej: Guiado estable tras recalibrar estrella guía..." class="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-sky-500">
                <button id="inline-note-btn" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition">
                  Registrar
                </button>
              </div>
            </div>
          </div>

          <!-- Secondary Column: Events, Files & Measurements -->
          <div class="space-y-6">
            <div>
              <h4 class="text-sm font-bold text-gray-300 uppercase tracking-wide border-b border-gray-700/60 pb-1 mb-3">
                Cronología de Eventos
              </h4>
              <ul class="space-y-1">
                ${eventsList}
              </ul>
            </div>

            <div>
              <h4 class="text-sm font-bold text-gray-300 uppercase tracking-wide border-b border-gray-700/60 pb-1 mb-2">
                Mediciones de Sesión
              </h4>
              <div class="space-y-2">
                ${measurementsList}
              </div>
            </div>

            <div>
              <h4 class="text-sm font-bold text-gray-300 uppercase tracking-wide border-b border-gray-700/60 pb-1 mb-2">
                Archivos FITS Registrados
              </h4>
              <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                ${filesList}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind note button
    const noteInput = container.querySelector('#inline-note-input');
    const noteBtn = container.querySelector('#inline-note-btn');
    const exportBtn = container.querySelector('#export-session-md-btn');

    noteBtn.addEventListener('click', () => {
      const val = noteInput.value.trim();
      if (val) {
        session.events.push({
          timestamp: new Date().toISOString(),
          event_type: 'field_note',
          content: val,
          provenance: 'manual'
        });
        session.markdown_narrative += `\n\n> **${new Date().toLocaleTimeString()}**: ${val}`;
        VaultStore.saveVault(vault);
        renderJournal();
      }
    });

    exportBtn.addEventListener('click', () => {
      downloadFile(`${session.id}.md`, VaultStore.sessionToMarkdown(session));
    });
  }

  // --- PLANNER TAB ---
  function renderPlanner() {
    const targetSelect = document.getElementById('planner-target-select');
    const siteSelect = document.getElementById('planner-site-select');
    const chartContainer = document.getElementById('altaz-chart-container');
    const targetInfoContainer = document.getElementById('planner-target-info');

    if (!targetSelect || !siteSelect || !chartContainer) return;

    // Populate selects if empty
    if (targetSelect.children.length === 0) {
      vault.targets.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `${t.name} (${t.id.toUpperCase()})`;
        if (t.id === currentTargetId) opt.selected = true;
        targetSelect.appendChild(opt);
      });
    }

    if (siteSelect.children.length === 0) {
      vault.sites.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} (Bortle ${s.bortle})`;
        if (s.id === currentSiteId) opt.selected = true;
        siteSelect.appendChild(opt);
      });
    }

    targetSelect.addEventListener('change', () => {
      currentTargetId = targetSelect.value;
      updatePlannerChart();
    });

    siteSelect.addEventListener('change', () => {
      currentSiteId = siteSelect.value;
      updatePlannerChart();
    });

    updatePlannerChart();

    function updatePlannerChart() {
      const target = vault.targets.find(t => t.id === currentTargetId) || vault.targets[0];
      const site = vault.sites.find(s => s.id === currentSiteId) || vault.sites[0];

      const raDeg = AstroCalc.parseRA(target.ra);
      const decDeg = AstroCalc.parseDec(target.dec);
      const trajectory = AstroCalc.generateNightTrajectory(raDeg, decDeg, site, new Date());

      AltAzPlotter.render(chartContainer, trajectory, target, site);

      // Moon info for tonight
      const moon = AstroCalc.getMoonInfo(new Date());

      if (targetInfoContainer) {
        targetInfoContainer.innerHTML = `
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div class="bg-gray-800 p-3 rounded border border-gray-700">
              <span class="text-gray-400 block">Ascensión Recta (RA)</span>
              <span class="font-mono text-gray-200 font-semibold">${AstroCalc.formatRA(raDeg)}</span>
              <span class="text-gray-400 block text-[10px]">(${raDeg.toFixed(3)}°)</span>
            </div>
            <div class="bg-gray-800 p-3 rounded border border-gray-700">
              <span class="text-gray-400 block">Declinación (Dec)</span>
              <span class="font-mono text-gray-200 font-semibold">${AstroCalc.formatDec(decDeg)}</span>
              <span class="text-gray-400 block text-[10px]">(${decDeg.toFixed(3)}°)</span>
            </div>
            <div class="bg-gray-800 p-3 rounded border border-gray-700">
              <span class="text-gray-400 block">Culminación / Altitud Máx.</span>
              <span class="font-mono text-emerald-400 font-bold text-sm">${trajectory.transitCulmination}°</span>
              <span class="text-gray-400 block text-[10px]">${parseFloat(trajectory.transitCulmination) >= 30 ? 'Zona Óptima (Airmass < 2.0)' : 'Requiere horizonte despejado'}</span>
            </div>
            <div class="bg-gray-800 p-3 rounded border border-gray-700">
              <span class="text-gray-400 block">Fase Lunar (Esta Noche)</span>
              <span class="font-semibold text-amber-400">${moon.phaseName}</span>
              <span class="text-gray-400 block text-[10px]">${moon.illuminationPercent}% iluminada (edad: ${moon.ageDays.toFixed(1)}d)</span>
            </div>
          </div>
        `;
      }
    }
  }

  // --- TARGETS TAB ---
  function renderTargets() {
    const grid = document.getElementById('targets-catalog-grid');
    if (!grid) return;

    grid.innerHTML = '';
    vault.targets.forEach(t => {
      const card = document.createElement('div');
      card.className = 'bg-gray-800 p-5 rounded-lg border border-gray-700 hover:border-sky-500/60 transition flex flex-col justify-between';
      card.innerHTML = `
        <div>
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-bold text-lg text-gray-100">${t.name}</h3>
            <span class="px-2 py-0.5 bg-sky-950 text-sky-400 border border-sky-800 rounded text-xs font-mono">${t.id.toUpperCase()}</span>
          </div>
          <p class="text-xs text-sky-400 mb-2">${t.object_type || 'Deep Sky'}</p>
          <div class="bg-gray-900 p-2.5 rounded border border-gray-800 font-mono text-xs space-y-1 mb-3">
            <div><span class="text-gray-500">RA:</span>  ${t.ra}</div>
            <div><span class="text-gray-500">Dec:</span> ${t.dec}</div>
            <div><span class="text-gray-500">Mag:</span> ${t.magnitude || 'N/D'}</div>
          </div>
          <p class="text-xs text-gray-300 leading-relaxed">${t.notes || 'Sin descripción adicional.'}</p>
        </div>
        <div class="mt-4 pt-3 border-t border-gray-700/60 flex justify-between items-center">
          <button class="plan-target-btn text-xs font-semibold text-sky-400 hover:text-sky-300" data-tid="${t.id}">
            Planificar Altitud &rarr;
          </button>
          <button class="export-target-btn text-xs text-gray-400 hover:text-gray-200" data-tid="${t.id}">
            Exportar .md
          </button>
        </div>
      `;

      card.querySelector('.plan-target-btn').addEventListener('click', () => {
        currentTargetId = t.id;
        switchTab('planner');
      });

      card.querySelector('.export-target-btn').addEventListener('click', () => {
        downloadFile(`${t.id}.md`, VaultStore.targetToMarkdown(t));
      });

      grid.appendChild(card);
    });

    // Handle new target creation
    const newTargetForm = document.getElementById('new-target-form');
    if (newTargetForm && !newTargetForm.dataset.bound) {
      newTargetForm.dataset.bound = 'true';
      newTargetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('nt-id').value.trim().toLowerCase();
        const name = document.getElementById('nt-name').value.trim();
        const ra = document.getElementById('nt-ra').value.trim();
        const dec = document.getElementById('nt-dec').value.trim();
        const type = document.getElementById('nt-type').value.trim();
        const notes = document.getElementById('nt-notes').value.trim();

        if (id && name) {
          vault.targets.push({
            id,
            name,
            aliases: [id.toUpperCase()],
            object_type: type || 'Deep Sky',
            ra: ra || '00h00m00s',
            dec: dec || '+00d00m00s',
            epoch: 'J2000',
            is_moving: false,
            notes: notes || 'Objetivo agregado desde la interfaz web.'
          });
          VaultStore.saveVault(vault);
          renderTargets();
          newTargetForm.reset();
        }
      });
    }
  }

  // --- RIGS & OPTICAL CALCULATOR TAB ---
  function renderOpticalCalc() {
    const apertureInput = document.getElementById('calc-aperture');
    const focalInput = document.getElementById('calc-focal');
    const pixelInput = document.getElementById('calc-pixel');
    const widthInput = document.getElementById('calc-width');
    const heightInput = document.getElementById('calc-height');
    const rigSelect = document.getElementById('calc-rig-preset-select');
    const resultsContainer = document.getElementById('optical-results-container');

    if (!apertureInput || !focalInput || !pixelInput || !resultsContainer) return;

    if (rigSelect && rigSelect.children.length === 0) {
      vault.rigs.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.name;
        if (r.id === currentRigId) opt.selected = true;
        rigSelect.appendChild(opt);
      });

      rigSelect.addEventListener('change', () => {
        const selectedRig = vault.rigs.find(r => r.id === rigSelect.value);
        if (selectedRig) {
          apertureInput.value = selectedRig.aperture_mm;
          focalInput.value = selectedRig.focal_length_mm;
          pixelInput.value = selectedRig.pixel_pitch_um;
          widthInput.value = selectedRig.sensor_width_px;
          heightInput.value = selectedRig.sensor_height_px;
          recalculate();
        }
      });
    }

    [apertureInput, focalInput, pixelInput, widthInput, heightInput].forEach(inp => {
      inp.addEventListener('input', recalculate);
    });

    recalculate();

    function recalculate() {
      const D = parseFloat(apertureInput.value) || 80;
      const f = parseFloat(focalInput.value) || 600;
      const p = parseFloat(pixelInput.value) || 3.76;
      const w = parseFloat(widthInput.value) || 6248;
      const h = parseFloat(heightInput.value) || 4176;

      const metrics = AstroCalc.calculateOpticalMetrics(D, f, p, w, h);

      // Nyquist sampling recommendation
      const scale = parseFloat(metrics.imageScaleArcsec);
      let samplingVerdict = 'Muestreo Óptimo (1.0" - 2.0"/px)';
      let verdictColor = 'text-emerald-400';
      if (scale < 0.7) {
        samplingVerdict = 'Sobremuestreo (Over-sampled) — sensible a seeing adverso';
        verdictColor = 'text-amber-400';
      } else if (scale > 2.5) {
        samplingVerdict = 'Submuestreo (Under-sampled) — estrellas pixeladas, ideal para gran campo';
        verdictColor = 'text-sky-400';
      }

      resultsContainer.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div class="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <span class="text-gray-400 block text-xs">Relación Focal</span>
            <span class="text-xl font-bold font-mono text-gray-100">f/${metrics.focalRatio}</span>
            <span class="text-[11px] text-gray-500 block mt-1">Velocidad lumínica del sistema</span>
          </div>
          <div class="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <span class="text-gray-400 block text-xs">Escala de Placa (Image Scale)</span>
            <span class="text-xl font-bold font-mono text-sky-400">${metrics.imageScaleArcsec}"/px</span>
            <span class="text-[11px] ${verdictColor} font-semibold block mt-1">${samplingVerdict}</span>
          </div>
          <div class="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <span class="text-gray-400 block text-xs">Campo Visual (FOV)</span>
            <span class="text-xl font-bold font-mono text-gray-100">${metrics.fovXArcmin}' x ${metrics.fovYArcmin}'</span>
            <span class="text-[11px] text-gray-500 block mt-1">Sensor: ${metrics.sensorWidthMm} x ${metrics.sensorHeightMm} mm</span>
          </div>
          <div class="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <span class="text-gray-400 block text-xs">Poder de Resolución (Dawes)</span>
            <span class="text-xl font-bold font-mono text-emerald-400">${metrics.dawesLimitArcsec}"</span>
            <span class="text-[11px] text-gray-500 block mt-1">Rayleigh: ${metrics.rayleighArcsec}"</span>
          </div>
          <div class="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <span class="text-gray-400 block text-xs">Capacidad Colectora de Luz</span>
            <span class="text-xl font-bold font-mono text-purple-400">${metrics.lightGrasp}x</span>
            <span class="text-[11px] text-gray-500 block mt-1">vs pupila humana de 7mm</span>
          </div>
          <div class="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <span class="text-gray-400 block text-xs">Criterio Crítico de Seeing</span>
            <span class="text-xl font-bold font-mono text-amber-400">${(scale * 2.5).toFixed(1)}" FWHM</span>
            <span class="text-[11px] text-gray-500 block mt-1">Límite de Nyquist (2.5 px por FWHM)</span>
          </div>
        </div>
      `;
    }
  }

  // --- MARKDOWN & YAML EDITOR TAB ---
  function renderEditor() {
    const editorSessionSelect = document.getElementById('editor-session-select');
    const editorTextarea = document.getElementById('editor-raw-textarea');
    const editorPreview = document.getElementById('editor-live-preview');
    const saveBtn = document.getElementById('editor-save-btn');
    const downloadBtn = document.getElementById('editor-download-btn');

    if (!editorSessionSelect || !editorTextarea || !editorPreview) return;

    editorSessionSelect.innerHTML = '';
    vault.sessions.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.id} (${s.observing_night})`;
      editorSessionSelect.appendChild(opt);
    });

    function loadEditorContent() {
      const sess = vault.sessions.find(s => s.id === editorSessionSelect.value) || vault.sessions[0];
      if (sess) {
        editorTextarea.value = VaultStore.sessionToMarkdown(sess);
        updatePreview();
      }
    }

    function updatePreview() {
      const val = editorTextarea.value;
      // Split frontmatter and markdown
      const parts = val.split('---');
      if (parts.length >= 3) {
        const mdContent = parts.slice(2).join('---').trim();
        editorPreview.innerHTML = simpleMarkdownToHtml(mdContent);
      } else {
        editorPreview.innerHTML = simpleMarkdownToHtml(val);
      }
    }

    editorSessionSelect.addEventListener('change', loadEditorContent);
    editorTextarea.addEventListener('input', updatePreview);

    saveBtn.addEventListener('click', () => {
      const sess = vault.sessions.find(s => s.id === editorSessionSelect.value);
      if (sess) {
        const parts = editorTextarea.value.split('---');
        if (parts.length >= 3) {
          sess.markdown_narrative = parts.slice(2).join('---').trim();
        } else {
          sess.markdown_narrative = editorTextarea.value;
        }
        VaultStore.saveVault(vault);
        alert(`Sesión ${sess.id} guardada en el vault local.`);
        renderJournal();
      }
    });

    downloadBtn.addEventListener('click', () => {
      const sess = vault.sessions.find(s => s.id === editorSessionSelect.value);
      if (sess) {
        downloadFile(`${sess.id}.md`, editorTextarea.value);
      }
    });

    loadEditorContent();
  }

  // Helper: simple markdown renderer
  function simpleMarkdownToHtml(md) {
    if (!md) return '';
    let html = md
      .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-sky-400 mt-3 mb-1">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-gray-100 mt-4 mb-2 border-b border-gray-700/60 pb-1">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-gray-100 mt-4 mb-2 pb-1 border-b border-gray-700">$1</h1>')
      .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-sky-500 pl-3 py-1 my-2 bg-gray-900/60 text-gray-300 italic text-xs">$1</blockquote>')
      .replace(/\*\*(.*)\*\*/gim, '<strong class="text-gray-100">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em class="text-gray-300">$1</em>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-gray-300 text-xs">$1</li>')
      .replace(/\n$/gim, '<br />');

    return html.split('\n\n').map(p => {
      if (p.startsWith('<h') || p.startsWith('<blockquote') || p.startsWith('<li')) return p;
      return `<p class="mb-2 text-xs leading-relaxed">${p}</p>`;
    }).join('');
  }

  // Helper: file download
  function downloadFile(filename, text) {
    const el = document.createElement('a');
    el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    el.setAttribute('download', filename);
    el.style.display = 'none';
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  }

  // Initialize CLI emulator
  const cliOutput = document.getElementById('cli-terminal-output');
  const cliInput = document.getElementById('cli-terminal-input');
  if (cliOutput && cliInput) {
    CliEmulator.init(cliOutput, cliInput, vault, () => {
      renderJournal();
      renderPlanner();
      renderTargets();
    });
  }

  // Initialize Views
  renderJournal();
  renderPlanner();
  renderTargets();
  renderOpticalCalc();
  renderEditor();
});
