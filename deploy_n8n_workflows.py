import requests
import json
import sys

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjN2QzZTZjMS00OGM0LTRjNzAtYjhkOS1mY2FkY2VjMGNiMTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNWRlZDY1ODEtMDQ0YS00N2M1LTllN2YtYTU1N2I5ZTM3ZmQzIiwiaWF0IjoxNzg1NjI4Njg4fQ.Ciuly3RZhOFzZZe3lH7fwe9DgCKvRUH4yB3c5tlFucE"
URL = "https://n8n.arcav.us/api/v1/workflows"

headers = {
    "X-N8N-API-KEY": API_KEY,
    "Content-Type": "application/json"
}

def deploy_workflow(file_path):
    with open(file_path, "r") as f:
        data = json.load(f)
        
    print(f"Deploying {data.get('name')}...")
    
    resp = requests.post(URL, headers=headers, json=data, timeout=15)
    if resp.status_code == 200 or resp.status_code == 201:
        print(f"✅ Success! Workflow ID: {resp.json().get('id')}")
    else:
        print(f"❌ Failed: {resp.status_code} - {resp.text}")

deploy_workflow("workflows/n8n/WF-01_WhatsApp_Inbound.json")
deploy_workflow("workflows/n8n/WF-02_WhatsApp_Outbound.json")
deploy_workflow("workflows/n8n/WF-04_Global_Error_Handler.json")
