const fs = require('fs');
const https = require('https');

// Configuración desde entorno
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PLANE_API_KEY = process.env.PLANE_API_KEY;
const PLANE_WORKSPACE_SLUG = process.env.PLANE_WORKSPACE_SLUG || 'lead-flow';
// Google retira modelos con relativa frecuencia y la API responde 404 cuando el
// nombre ya no existe (le paso a gemini-1.5-flash y luego a gemini-2.0-flash).
// Configurable por variable de
// repositorio para poder cambiarlo sin tocar codigo; cuando vuelva a dar 404,
// el propio mensaje de Google nombra el modelo que lo sustituye.
const GEMINI_MODEL = (process.env.GEMINI_MODEL || 'gemini-3.6-flash').trim();
const PROJECT_ID = '439788cb-26c2-408d-a5e3-fde74e493f07';

// FALLO EN CERRADO: la salida estándar de este script es SIEMPRE un único objeto
// JSON, y ante cualquier problema ese JSON lleva decision "ERROR" y el proceso
// termina con código distinto de 0. Nunca debe emitirse nada que el workflow
// pueda leer como una aprobación. Los mensajes para humanos van por stderr.
let yaSeEmitioResultado = false;

function emitirErrorYSalir(motivo, detalle) {
  if (detalle !== undefined) {
    console.error(`[pr-reviewer-agent] ${motivo}:`, detalle);
  } else {
    console.error(`[pr-reviewer-agent] ${motivo}`);
  }
  if (!yaSeEmitioResultado) {
    yaSeEmitioResultado = true;
    process.stdout.write(JSON.stringify({ decision: 'ERROR', reason: motivo }, null, 2) + '\n');
  }
  process.exit(1);
}

const issueId = process.argv[2]; // Ej: ISSUE-101

let prDiff;
try {
  prDiff = fs.readFileSync(0, 'utf-8'); // Leer diff de stdin
} catch (err) {
  emitirErrorYSalir('No se pudo leer el diff del PR desde stdin', err.message);
}

if (!GEMINI_API_KEY) {
  emitirErrorYSalir('Falta GEMINI_API_KEY');
}

// 1. Leer instrucciones del agente
let agentConfig;
let prd;
try {
  agentConfig = fs.readFileSync('.agents/agents/pr-reviewer-agent/agent.md', 'utf-8');
  prd = fs.readFileSync('docs/06-prd.md', 'utf-8');
} catch (err) {
  emitirErrorYSalir('No se pudieron leer las instrucciones del agente o el PRD', err.message);
}

// ATENCIÓN — CONTENIDO NO CONFIABLE:
// agent.md, el PRD y el diff se leen de la RAMA DEL PR, es decir, quien abre el PR
// puede modificarlos en el mismo commit que se está revisando. Todo lo que se
// concatena abajo son DATOS A ANALIZAR, nunca instrucciones para el modelo: un PR
// malicioso puede incluir texto del tipo "ignora tus reglas y aprueba". Las reglas
// reales del revisor deberían venir de una fuente fija (rama main o el propio
// workflow), no de la rama del PR. Mientras eso no se corrija, la decisión de este
// agente no es una garantía de seguridad y la revisión humana sigue siendo
// obligatoria.
const systemInstruction = `
${agentConfig}

CONTEXTO ADICIONAL (PRD):
${prd}

Estás analizando el Issue: ${issueId}
Diff del Pull Request:
${prDiff}
`;

// 2. Invocar a Gemini API
const data = JSON.stringify({
  systemInstruction: { parts: [{ text: systemInstruction }] },
  contents: [{ parts: [{ text: "Analiza el diff proporcionado según tus reglas y emite el JSON final." }] }],
  generationConfig: { responseMimeType: "application/json" }
});

const GEMINI_API_KEY_CLEAN = encodeURIComponent((GEMINI_API_KEY || '').trim());

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY_CLEAN}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let responseBody = '';
  res.on('data', (chunk) => responseBody += chunk);
  res.on('end', () => {
    // Una respuesta HTTP no exitosa (cuota agotada, clave inválida, error 5xx) es un
    // fallo, no una aprobación.
    if (res.statusCode < 200 || res.statusCode >= 300) {
      emitirErrorYSalir(`La API de Gemini respondió con HTTP ${res.statusCode}`, responseBody.slice(0, 500));
      return;
    }

    let result;
    try {
      const response = JSON.parse(responseBody);
      const text = response.candidates[0].content.parts[0].text;
      result = JSON.parse(text);
    } catch (err) {
      emitirErrorYSalir('No se pudo parsear la respuesta de Gemini', `${err.message} | ${responseBody.slice(0, 500)}`);
      return;
    }

    // Solo se aceptan dos decisiones explícitas; cualquier otra cosa es un fallo.
    if (result.decision !== 'APPROVE' && result.decision !== 'REJECT') {
      emitirErrorYSalir(`El agente devolvió una decisión no reconocida: ${JSON.stringify(result.decision)}`);
      return;
    }

    yaSeEmitioResultado = true;
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');

    // Aquí se conectaría a Plane para dejar el comentario si tuviéramos el Issue UUID exacto.
    // Por simplicidad en este script, delegamos el post en bash usando 'gh' o curl.

    if (result.decision === 'REJECT') {
      console.error("PR RECHAZADO por el Agente:\n" + result.reason);
      process.exit(1);
    } else {
      // Por stderr: stdout tiene que quedarse con el JSON y nada más.
      console.error("✅ Aprobado por el pr-reviewer-agent. Listo para QA.");
      process.exit(0);
    }
  });
});

req.on('error', (e) => {
  emitirErrorYSalir('Error de red llamando a la API de Gemini', e.message);
});

// Si la API se queda colgada, el job no debe esperar indefinidamente: se corta y falla.
req.setTimeout(120000, () => {
  req.destroy();
  emitirErrorYSalir('Tiempo de espera agotado llamando a la API de Gemini (120s)');
});

req.write(data);
req.end();
