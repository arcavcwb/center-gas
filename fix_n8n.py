import urllib.request, json, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjN2QzZTZjMS00OGM0LTRjNzAtYjhkOS1mY2FkY2VjMGNiMTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNWRlZDY1ODEtMDQ0YS00N2M1LTllN2YtYTU1N2I5ZTM3ZmQzIiwiaWF0IjoxNzg1NjI4Njg4fQ.Ciuly3RZhOFzZZe3lH7fwe9DgCKvRUH4yB3c5tlFucE"
HEADERS = {"X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json", "User-Agent": "curl/7.81.0"}
BASE_URL = "https://n8n.arcav.us/api/v1/workflows"

def update_workflow(wid):
    try:
        req = urllib.request.Request(f"{BASE_URL}/{wid}", headers=HEADERS)
        resp = urllib.request.urlopen(req, context=ctx)
        wf = json.loads(resp.read().decode())
        
        allowed = ['name', 'nodes', 'connections', 'settings', 'staticData']
        new_wf = {k: wf[k] for k in allowed if k in wf}
                
        wf_str = json.dumps(new_wf)
        # Fix the payload references
        wf_str = wf_str.replace("body.record.id", "body.id")
        wf_str = wf_str.replace("body.record.status", "body.status")
        wf_str = wf_str.replace("body.record.customer_phone", "body.customer_phone")
        wf_str = wf_str.replace("body.record.driver_name", "body.driver_name")
        wf_str = wf_str.replace("body.record.", "body.")
        
        updated_wf = json.loads(wf_str)
        
        req_put = urllib.request.Request(f"{BASE_URL}/{wid}", data=json.dumps(updated_wf).encode(), headers=HEADERS, method="PUT")
        urllib.request.urlopen(req_put, context=ctx)
        print(f"Fixed {wid} successfully")
    except Exception as e:
        print(f"Error fixing {wid}: {e}")

update_workflow("SCqre7me1lAPKeH1")
