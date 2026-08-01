const fs = require('fs');
const https = require('https');

// Configuración desde entorno
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PLANE_API_KEY = process.env.PLANE_API_KEY;
const PLANE_WORKSPACE_SLUG = process.env.PLANE_WORKSPACE_SLUG || 'lead-flow';
const PROJECT_ID = '439788cb-26c2-408d-a5e3-fde74e493f07';

const issueId = process.argv[2]; // Ej: ISSUE-101
const prDiff = fs.readFileSync(0, 'utf-8'); // Leer diff de stdin

if (!GEMINI_API_KEY) {
  console.error("Falta GEMINI_API_KEY");
  process.exit(1);
}

// 1. Leer instrucciones del agente
const agentConfig = fs.readFileSync('.agents/agents/pr-reviewer-agent/agent.md', 'utf-8');
const prd = fs.readFileSync('docs/06-prd.md', 'utf-8');

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
  path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY_CLEAN}`,
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
    try {
      const response = JSON.parse(responseBody);
      const text = response.candidates[0].content.parts[0].text;
      const result = JSON.parse(text);
      
      console.log(JSON.stringify(result, null, 2));
      
      // Aquí se conectaría a Plane para dejar el comentario si tuviéramos el Issue UUID exacto
      // Por simplicidad en este script, delegamos el post en bash usando 'gh' o curl.
      
      if (result.decision === 'REJECT') {
        console.error("PR RECHAZADO por el Agente:\n" + result.reason);
        process.exit(1);
      } else {
        console.log("✅ Aprobado por el pr-reviewer-agent. Listo para QA.");
        process.exit(0);
      }
    } catch (err) {
      console.error("Error parseando respuesta de Gemini:", err, responseBody);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(e);
  process.exit(1);
});

req.write(data);
req.end();
