import urllib.request, json, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjN2QzZTZjMS00OGM0LTRjNzAtYjhkOS1mY2FkY2VjMGNiMTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNWRlZDY1ODEtMDQ0YS00N2M1LTllN2YtYTU1N2I5ZTM3ZmQzIiwiaWF0IjoxNzg1NjI4Njg4fQ.Ciuly3RZhOFzZZe3lH7fwe9DgCKvRUH4yB3c5tlFucE"
HEADERS = {"X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json", "User-Agent": "curl/7.81.0"}
BASE_URL = "https://n8n.arcav.us/api/v1/workflows"

REPLACEMENTS = {
    "{{ $env.PUBLIC_SUPABASE_URL }}": "https://fsfaqzayoziaeaihycos.supabase.co",
    "{{ $env.SUPABASE_URL }}": "https://fsfaqzayoziaeaihycos.supabase.co",
    "{{ $env.EVOLUTION_API_URL }}": "https://evolution.arcav.us",
    "{{ $env.EVOLUTION_INSTANCE_NAME }}": "centerGas",
    "{{ $env.EVOLUTION_API_KEY }}": "CENTERGAS_EVOLUTION_KEY_2026",
    "{{ $env.OWNER_WHATSAPP_NUMBER }}": "559581048349",
    "{{ $env.SUPABASE_SERVICE_ROLE_KEY }}": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZmFxemF5b3ppYWVhaWh5Y29zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzk5MTYyMywiZXhwIjoyMTAzNTY3NjIzfQ.NOMiAeXjILk-85YSbT4KKrI8A4Z-_vmCMDkNhFKNDhg",
    "{{ $env.SUPABASE_ANON_KEY }}": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZmFxemF5b3ppYWVhaWh5Y29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5OTE2MjMsImV4cCI6MjEwMzU2NzYyM30.VeIsAMcImkKzUk1Ims52Y54btygJg12UNgOvqaAMhIw"
}

def update_workflow(wid):
    try:
        req = urllib.request.Request(f"{BASE_URL}/{wid}", headers=HEADERS)
        resp = urllib.request.urlopen(req, context=ctx)
        wf = json.loads(resp.read().decode())
        
        # Keep only allowed properties
        allowed = ['name', 'nodes', 'connections', 'settings', 'staticData', 'tags']
        new_wf = {k: wf[k] for k in allowed if k in wf}
                
        wf_str = json.dumps(new_wf)
        for k, v in REPLACEMENTS.items():
            wf_str = wf_str.replace(k, v)
        
        updated_wf = json.loads(wf_str)
        
        req_put = urllib.request.Request(f"{BASE_URL}/{wid}", data=json.dumps(updated_wf).encode(), headers=HEADERS, method="PUT")
        urllib.request.urlopen(req_put, context=ctx)
        print(f"Updated {wid} successfully")
    except urllib.error.HTTPError as e:
        print(f"Error updating {wid}: {e.code} - {e.read().decode()}")
    except Exception as e:
        print(f"Error updating {wid}: {e}")

# WF-01, WF-02/03, WF-04
for wid in ["S28GbSKscgVXBzJy", "SCqre7me1lAPKeH1", "lqecFPUmQqc5qul0"]:
    update_workflow(wid)
