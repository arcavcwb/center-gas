import requests

API_KEY = "plane_api_512377479beb4978a69cce11b70cac71"
WORKSPACE = "lead-flow"
PROJECT_ID = "439788cb-26c2-408d-a5e3-fde74e493f07"
BASE_URL = "https://api.plane.so"
DONE_STATE = "81c79f4c-e156-43f4-91a3-28f1c1075981"
CYCLE_ID = "07dc4f3e-11f1-4d64-b3f5-6a907d9a6e0f" # Sprint 4

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

# 1. Obtenemos todos los issues
url = f"{BASE_URL}/api/v1/workspaces/{WORKSPACE}/projects/{PROJECT_ID}/issues/"
response = requests.get(url, headers=headers)
issues = response.json().get("results", [])

epic5_issues = [
    "ISSUE-401", "ISSUE-402", "ISSUE-403"
]

def add_issue_to_cycle(issue_id):
    cycle_url = f"{BASE_URL}/api/v1/workspaces/{WORKSPACE}/projects/{PROJECT_ID}/cycles/{CYCLE_ID}/cycle-issues/"
    resp = requests.post(cycle_url, headers=headers, json={"issues": [issue_id]})

def update_issue_state(issue_id):
    patch_url = f"{BASE_URL}/api/v1/workspaces/{WORKSPACE}/projects/{PROJECT_ID}/issues/{issue_id}/"
    resp = requests.patch(patch_url, headers=headers, json={"state_id": DONE_STATE})

def add_comment(issue_id, issue_name):
    comment_url = f"{BASE_URL}/api/v1/workspaces/{WORKSPACE}/projects/{PROJECT_ID}/issues/{issue_id}/comments/"
    html = f"<p><b>Epic 5 Sincronizada:</b></p><p>Se han generado los flujos de n8n para WhatsApp y la migración SQL de Supabase Webhooks en la rama <code>feat/epic-5-n8n</code>. Hash: <code>27176c7</code>.</p>"
    resp = requests.post(comment_url, headers=headers, json={"comment_html": html})

for issue in issues:
    name = issue.get("name", "")
    issue_id = issue.get("id")
    
    if any(prefix in name for prefix in epic5_issues):
        print(f"Cerrando {name}...")
        add_issue_to_cycle(issue_id)
        update_issue_state(issue_id)
        add_comment(issue_id, name)
        
print("Epic 5 issues closed.")
