import urllib.request, json, os, ssl, sys


def env_requerida(nombre, pista=""):
    """Devuelve el valor de una variable de entorno obligatoria.

    Si falta (o esta vacia) aborta ruidosamente: nunca se usa un valor por
    defecto para un secreto, porque un default silencioso solo consigue que el
    script parezca funcionar mientras habla con el sitio equivocado.
    """
    valor = os.environ.get(nombre, "").strip()
    if not valor:
        mensaje = (
            f"ERROR: falta la variable de entorno obligatoria {nombre}.\n"
            f"       Definela antes de ejecutar este script, por ejemplo:\n"
            f'       export {nombre}="<valor-real>"'
        )
        if pista:
            mensaje += f"\n       {pista}"
        print(mensaje, file=sys.stderr)
        sys.exit(1)
    return valor


# Verificacion TLS activada siempre. Si la instancia de n8n usa un certificado
# propio o autofirmado, apunta N8N_CA_BUNDLE al fichero PEM de esa CA; jamas se
# desactiva la verificacion, porque por esta conexion viajan credenciales.
CA_BUNDLE = os.environ.get("N8N_CA_BUNDLE", "").strip()
if CA_BUNDLE:
    if not os.path.isfile(CA_BUNDLE):
        print(
            f"ERROR: N8N_CA_BUNDLE apunta a un fichero inexistente: {CA_BUNDLE}",
            file=sys.stderr,
        )
        sys.exit(1)
    ctx = ssl.create_default_context(cafile=CA_BUNDLE)
else:
    ctx = ssl.create_default_context()

# Secretos: obligatorios por entorno, nunca en el repositorio (es publico).
N8N_KEY = env_requerida(
    "N8N_API_KEY",
    "Se obtiene en n8n > Settings > n8n API > Create an API key.",
)
EVOLUTION_API_KEY = env_requerida(
    "EVOLUTION_API_KEY",
    "Es la apikey global de la instancia de Evolution API.",
)
SUPABASE_SERVICE_ROLE_KEY = env_requerida(
    "SUPABASE_SERVICE_ROLE_KEY",
    "Supabase > Project Settings > API > service_role. NO es la anon key.",
)

HEADERS = {"X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json", "User-Agent": "curl/7.81.0"}

# Configuracion no secreta: se puede sobreescribir por entorno.
N8N_BASE_URL = os.environ.get("N8N_BASE_URL", "https://n8n.arcav.us").rstrip("/")
BASE_URL = f"{N8N_BASE_URL}/api/v1/workflows"
WORKFLOW_ID = os.environ.get("N8N_WORKFLOW_ID", "S28GbSKscgVXBzJy")
CATALOG_DOMAIN = os.environ.get("CATALOG_DOMAIN", "center-gas-site.vercel.app")
CATALOG_URL = os.environ.get("CATALOG_URL", "https://center-gas-site.vercel.app")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://fsfaqzayoziaeaihycos.supabase.co")
EVOLUTION_API_URL = os.environ.get("EVOLUTION_API_URL", "https://evolution.arcav.us")
EVOLUTION_INSTANCE_NAME = os.environ.get("EVOLUTION_INSTANCE_NAME", "centerGas")

with open("workflows/n8n/WF-01_WhatsApp_Inbound.json", "r") as f:
    wf_str = f.read()

# Los placeholders {{ $env.* }} del JSON se resuelven aqui porque la instancia de
# n8n tiene N8N_BLOCK_ENV_ACCESS_IN_NODE activo y los nodos no pueden leer el
# entorno (ver docs/walkthroughs/ISSUE-403-evolution-v2-infrastructure.md:59);
# ese fue el motivo original de dejar los valores en claro en este script.
# TODO(medio plazo): la solucion correcta son las Credentials nativas de n8n
# (Header Auth / Supabase), que se referencian por id desde el nodo y NO se
# serializan en el export del workflow. Migrando a Credentials, ningun secreto
# tendria que pasar por este fichero ni acabar dentro del JSON subido.
wf_str = wf_str.replace("{{ $env.CATALOG_DOMAIN }}", CATALOG_DOMAIN)
wf_str = wf_str.replace("{{ $env.CATALOG_URL }}", CATALOG_URL)
wf_str = wf_str.replace("{{ $env.SUPABASE_URL }}", SUPABASE_URL)
wf_str = wf_str.replace("{{ $env.EVOLUTION_API_URL }}", EVOLUTION_API_URL)
wf_str = wf_str.replace("{{ $env.EVOLUTION_INSTANCE_NAME }}", EVOLUTION_INSTANCE_NAME)
wf_str = wf_str.replace("{{ $env.EVOLUTION_API_KEY }}", EVOLUTION_API_KEY)
wf_str = wf_str.replace("{{ $env.SUPABASE_SERVICE_ROLE_KEY }}", SUPABASE_SERVICE_ROLE_KEY)

wf_data = json.loads(wf_str)

# keep only allowed properties
allowed = ['name', 'nodes', 'connections', 'settings', 'staticData']
new_wf = {k: wf_data[k] for k in allowed if k in wf_data}

# PUT al workflow configurado en N8N_WORKFLOW_ID
req = urllib.request.Request(f"{BASE_URL}/{WORKFLOW_ID}", data=json.dumps(new_wf).encode(), headers=HEADERS, method="PUT")
resp = urllib.request.urlopen(req, context=ctx)
print(f"Updated {WORKFLOW_ID} from local file")
