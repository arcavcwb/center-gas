import urllib.request, json, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjN2QzZTZjMS00OGM0LTRjNzAtYjhkOS1mY2FkY2VjMGNiMTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNWRlZDY1ODEtMDQ0YS00N2M1LTllN2YtYTU1N2I5ZTM3ZmQzIiwiaWF0IjoxNzg1NjI4Njg4fQ.Ciuly3RZhOFzZZe3lH7fwe9DgCKvRUH4yB3c5tlFucE"
HEADERS = {"X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json", "User-Agent": "curl/7.81.0"}
BASE_URL = "https://n8n.arcav.us/api/v1/workflows"

with open("workflows/n8n/WF-01_WhatsApp_Inbound.json", "r") as f:
    wf_str = f.read()

wf_str = wf_str.replace("{{ $env.CATALOG_DOMAIN }}", "center-gas-site.vercel.app")
wf_str = wf_str.replace("{{ $env.CATALOG_URL }}", "https://center-gas-site.vercel.app")
wf_str = wf_str.replace("{{ $env.SUPABASE_URL }}", "https://fsfaqzayoziaeaihycos.supabase.co")
wf_str = wf_str.replace("{{ $env.EVOLUTION_API_URL }}", "https://evolution.arcav.us")
wf_str = wf_str.replace("{{ $env.EVOLUTION_INSTANCE_NAME }}", "centerGas")
wf_str = wf_str.replace("{{ $env.EVOLUTION_API_KEY }}", "CENTERGAS_EVOLUTION_KEY_2026")
wf_str = wf_str.replace("{{ $env.SUPABASE_SERVICE_ROLE_KEY }}", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZmFxemF5b3ppYWVhaWh5Y29zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzk5MTYyMywiZXhwIjoyMTAzNTY3NjIzfQ.NOMiAeXjILk-85YSbT4KKrI8A4Z-_vmCMDkNhFKNDhg")

wf_data = json.loads(wf_str)

# keep only allowed properties
allowed = ['name', 'nodes', 'connections', 'settings', 'staticData']
new_wf = {k: wf_data[k] for k in allowed if k in wf_data}

# PUT to S28GbSKscgVXBzJy
req = urllib.request.Request(f"{BASE_URL}/S28GbSKscgVXBzJy", data=json.dumps(new_wf).encode(), headers=HEADERS, method="PUT")
resp = urllib.request.urlopen(req, context=ctx)
print("Updated S28GbSKscgVXBzJy from local file")
