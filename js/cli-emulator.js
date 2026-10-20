/**
 * sky-notebook - CliEmulator
 * In-browser interactive command-line interface emulating the sky-notebook CLI tool.
 */

const CliEmulator = (() => {
  let outputElement = null;
  let inputElement = null;
  let vaultRef = null;
  let onVaultUpdate = null;

  const COMMAND_HISTORY = [];
  let historyIndex = -1;

  function init(outputEl, inputEl, vault, updateCallback) {
    outputElement = outputEl;
    inputElement = inputEl;
    vaultRef = vault;
    onVaultUpdate = updateCallback;

    printBanner();

    inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = inputElement.value.trim();
        if (cmd) {
          COMMAND_HISTORY.push(cmd);
          historyIndex = COMMAND_HISTORY.length;
          printLine(`$ ${cmd}`, 'text-emerald-400 font-bold');
          executeCommand(cmd);
          inputElement.value = '';
          scrollBottom();
        }
      } else if (e.key === 'ArrowUp') {
        if (historyIndex > 0) {
          historyIndex--;
          inputElement.value = COMMAND_HISTORY[historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        if (historyIndex < COMMAND_HISTORY.length - 1) {
          historyIndex++;
          inputElement.value = COMMAND_HISTORY[historyIndex];
        } else {
          historyIndex = COMMAND_HISTORY.length;
          inputElement.value = '';
        }
      }
    });
  }

  function printBanner() {
    printLine('Sky Notebook CLI v2.0.0 — Scientific Observational Journal', 'text-sky-400 font-bold');
    printLine('Escribí "help" para ver los comandos disponibles o "demo" para una demostración guiada.\n', 'text-gray-400');
  }

  function printLine(text, className = 'text-gray-200') {
    if (!outputElement) return;
    const div = document.createElement('div');
    div.className = className;
    div.textContent = text;
    outputElement.appendChild(div);
  }

  function scrollBottom() {
    if (outputElement) {
      outputElement.scrollTop = outputElement.scrollHeight;
    }
  }

  function executeCommand(rawInput) {
    const parts = rawInput.split(' ').filter(Boolean);
    let cmd = parts[0];
    let args = parts.slice(1);

    if (cmd === 'sky-notebook' && parts.length > 1) {
      cmd = parts[1];
      args = parts.slice(2);
    }

    switch (cmd) {
      case 'help':
        printLine('Comandos soportados:', 'text-yellow-400 font-semibold');
        printLine('  help                                  Muestra esta lista de comandos.');
        printLine('  demo                                  Ejecuta una secuencia de demostración completa.');
        printLine('  clear                                 Limpia la terminal.');
        printLine('  list                                  Lista sesiones y objetivos astronómicos registrados.');
        printLine('  new-target <id> "<nombre>" [ra] [dec] Registra un nuevo objetivo astronómico.');
        printLine('  start-session <id> <fecha> [target]   Inicia una nueva sesión observacional.');
        printLine('  note <sess_id> "<texto>"              Agrega una nota o hito a la sesión.');
        printLine('  end-session <sess_id> [outcome]       Cierra la sesión (successful, partial, failed).');
        printLine('  ephemeris <target_id>                 Calcula coordenadas horizontales y culminación.');
        printLine('  optical-calc <D_mm> <f_mm> <p_um>     Calcula escala de placa, resolución y FOV.');
        printLine('  reset-vault                           Restaura el vault a valores predeterminados.');
        break;

      case 'clear':
        if (outputElement) outputElement.innerHTML = '';
        break;

      case 'list':
        printLine('--- OBJETIVOS ASTRONÓMICOS ---', 'text-blue-400 font-bold');
        vaultRef.targets.forEach(t => {
          printLine(`  [${t.id}] ${t.name} | RA: ${t.ra} | Dec: ${t.dec} (${t.object_type})`);
        });
        printLine('\n--- SESIONES OBSERVACIONALES ---', 'text-purple-400 font-bold');
        vaultRef.sessions.forEach(s => {
          printLine(`  [${s.id}] Noche: ${s.observing_night} | Obj: ${(s.targets || []).join(', ')} | Estado: ${s.outcome}`);
        });
        break;

      case 'ephemeris':
        if (!args[0]) {
          printLine('Uso: ephemeris <target_id>', 'text-red-400');
          return;
        }
        const target = vaultRef.targets.find(t => t.id.toLowerCase() === args[0].toLowerCase());
        if (!target) {
          printLine(`Error: Objetivo "${args[0]}" no encontrado en el vault.`, 'text-red-400');
          return;
        }
        const site = vaultRef.sites[0];
        const raDeg = AstroCalc.parseRA(target.ra);
        const decDeg = AstroCalc.parseDec(target.dec);
        const traj = AstroCalc.generateNightTrajectory(raDeg, decDeg, site, new Date());
        printLine(`Efemérides para ${target.name} desde ${site.name}:`, 'text-emerald-400 font-bold');
        printLine(`  Ascensión Recta: ${AstroCalc.formatRA(raDeg)} (${raDeg.toFixed(3)}°)`);
        printLine(`  Declinación:     ${AstroCalc.formatDec(decDeg)} (${decDeg.toFixed(3)}°)`);
        printLine(`  Altitud Máxima:  ${traj.transitCulmination}°`);
        printLine(`  Visibilidad:     ${parseFloat(traj.transitCulmination) >= 30 ? 'ÓPTIMA (Airmass < 2.0)' : 'BAJA ALTITUD'}`);
        break;

      case 'optical-calc':
        if (args.length < 3) {
          printLine('Uso: optical-calc <apertura_mm> <dist_focal_mm> <pixel_pitch_um> [ancho_px] [alto_px]', 'text-red-400');
          return;
        }
        const D = parseFloat(args[0]);
        const f = parseFloat(args[1]);
        const p = parseFloat(args[2]);
        const w = args[3] ? parseFloat(args[3]) : 6248;
        const h = args[4] ? parseFloat(args[4]) : 4176;
        const opt = AstroCalc.calculateOpticalMetrics(D, f, p, w, h);
        printLine(`Cálculo Óptico para Tren Instrumental (D=${D}mm, f=${f}mm, p=${p}µm):`, 'text-emerald-400 font-bold');
        printLine(`  Relación Focal:      f/${opt.focalRatio}`);
        printLine(`  Escala de Imagen:    ${opt.imageScaleArcsec} arcsec/pixel`);
        printLine(`  Límite de Dawes:     ${opt.dawesLimitArcsec} arcsec`);
        printLine(`  Criterio de Rayleigh: ${opt.rayleighArcsec} arcsec`);
        printLine(`  Campo Visual (FOV):  ${opt.fovXArcmin}' x ${opt.fovYArcmin}' arcmin`);
        printLine(`  Capacidad de Luz:    ${opt.lightGrasp}x (vs ojo humano 7mm)`);
        break;

      case 'new-target':
        if (args.length < 2) {
          printLine('Uso: new-target <id> "<nombre>" [ra] [dec]', 'text-red-400');
          return;
        }
        const tid = args[0];
        const tname = args[1].replace(/["']/g, '');
        const tra = args[2] || '00h00m00s';
        const tdec = args[3] || '+00d00m00s';
        const newT = {
          id: tid,
          name: tname,
          aliases: [tid.toUpperCase()],
          object_type: 'Deep Sky',
          ra: tra,
          dec: tdec,
          epoch: 'J2000',
          is_moving: false,
          notes: `Objetivo ingresado interactivamente desde la terminal web de sky-notebook.`
        };
        vaultRef.targets.push(newT);
        VaultStore.saveVault(vaultRef);
        printLine(`Objetivo "${tid}" creado exitosamente.`, 'text-emerald-400 font-semibold');
        if (onVaultUpdate) onVaultUpdate();
        break;

      case 'start-session':
        if (args.length < 2) {
          printLine('Uso: start-session <sess_id> <observing_night> [target_id]', 'text-red-400');
          return;
        }
        const sid = args[0];
        const night = args[1];
        const tg = args[2] ? [args[2]] : ['m31'];
        const nowIso = new Date().toISOString();
        const newS = {
          id: sid,
          observing_night: night,
          start_time: nowIso,
          end_time: null,
          timezone: 'UTC-03:00',
          outcome: 'in_progress',
          project: 'Astronomical Field Session',
          targets: tg,
          site: 'casleo',
          rig: 'rig_triplet80',
          events: [
            {
              timestamp: nowIso,
              event_type: 'session_init',
              content: 'Sesión iniciada vía CLI.',
              provenance: 'manual'
            }
          ],
          files: [],
          measurements: [],
          markdown_narrative: `# Sesión ${sid}\n\nObservación iniciada en la noche del ${night}.`
        };
        vaultRef.sessions.unshift(newS);
        VaultStore.saveVault(vaultRef);
        printLine(`Sesión "${sid}" iniciada para la noche ${night}.`, 'text-emerald-400 font-semibold');
        if (onVaultUpdate) onVaultUpdate();
        break;

      case 'note':
        if (args.length < 2) {
          printLine('Uso: note <sess_id> "<contenido_de_la_nota>"', 'text-red-400');
          return;
        }
        const noteSid = args[0];
        const noteContent = args.slice(1).join(' ').replace(/["']/g, '');
        const targetSession = vaultRef.sessions.find(s => s.id === noteSid);
        if (!targetSession) {
          printLine(`Error: Sesión "${noteSid}" no encontrada.`, 'text-red-400');
          return;
        }
        targetSession.events.push({
          timestamp: new Date().toISOString(),
          event_type: 'field_note',
          content: noteContent,
          provenance: 'manual'
        });
        targetSession.markdown_narrative += `\n\n> **${new Date().toLocaleTimeString()}**: ${noteContent}`;
        VaultStore.saveVault(vaultRef);
        printLine(`Nota agregada a sesión "${noteSid}".`, 'text-emerald-400');
        if (onVaultUpdate) onVaultUpdate();
        break;

      case 'end-session':
        if (args.length < 1) {
          printLine('Uso: end-session <sess_id> [outcome]', 'text-red-400');
          return;
        }
        const endSid = args[0];
        const outcome = args[1] || 'successful';
        const endSess = vaultRef.sessions.find(s => s.id === endSid);
        if (!endSess) {
          printLine(`Error: Sesión "${endSid}" no encontrada.`, 'text-red-400');
          return;
        }
        endSess.end_time = new Date().toISOString();
        endSess.outcome = outcome;
        VaultStore.saveVault(vaultRef);
        printLine(`Sesión "${endSid}" cerrada con estado "${outcome}".`, 'text-emerald-400');
        if (onVaultUpdate) onVaultUpdate();
        break;

      case 'reset-vault':
        vaultRef = VaultStore.resetVault();
        printLine('Vault restaurado a valores de fábrica.', 'text-yellow-400');
        if (onVaultUpdate) onVaultUpdate();
        break;

      case 'demo':
        runDemo();
        break;

      default:
        printLine(`Comando no reconocido: "${cmd}". Escribí "help" para ver opciones.`, 'text-red-400');
        break;
    }
  }

  function runDemo() {
    printLine('\n=== EJECUTANDO DEMO ASTRONÓMICA INTERACTIVA ===', 'text-cyan-400 font-bold');
    setTimeout(() => {
      printLine('> sky-notebook ephemeris ngc3372', 'text-emerald-400 font-mono');
      executeCommand('ephemeris ngc3372');
    }, 400);

    setTimeout(() => {
      printLine('\n> sky-notebook optical-calc 80 600 3.76', 'text-emerald-400 font-mono');
      executeCommand('optical-calc 80 600 3.76');
    }, 1200);

    setTimeout(() => {
      printLine('\n> sky-notebook note sess-01 "Enfoque recalibrado tras variación de 1.2°C ambiente."', 'text-emerald-400 font-mono');
      executeCommand('note sess-01 Enfoque recalibrado tras variación de 1.2°C ambiente.');
      printLine('=== DEMO COMPLETADA EXITOSAMENTE ===\n', 'text-cyan-400 font-bold');
      scrollBottom();
    }, 2000);
  }

  return {
    init,
    printLine
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CliEmulator;
}
