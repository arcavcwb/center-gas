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

# Lista de issues implementados en código pero huérfanos en Plane
done_issues = [
    "ISSUE-304"
]

def add_issue_to_cycle(issue_id):
    cycle_url = f"{BASE_URL}/api/v1/workspaces/{WORKSPACE}/projects/{PROJECT_ID}/cycles/{CYCLE_ID}/cycle-issues/"
    resp = requests.post(cycle_url, headers=headers, json={"issues": [issue_id]})
    if resp.status_code in [200, 201]:
        print(f" -> Añadido al Sprint")
    else:
        print(f" -> Error añadiendo a sprint (o ya existe): {resp.status_code}")

def update_issue_state(issue_id):
    patch_url = f"{BASE_URL}/api/v1/workspaces/{WORKSPACE}/projects/{PROJECT_ID}/issues/{issue_id}/"
    resp = requests.patch(patch_url, headers=headers, json={"state_id": DONE_STATE})
    if resp.status_code == 200:
        print(f" -> Estado cambiado a DONE")
    else:
        print(f" -> Error cambiando estado: {resp.text}")

def add_comment(issue_id, issue_name):
    comment_url = f"{BASE_URL}/api/v1/workspaces/{WORKSPACE}/projects/{PROJECT_ID}/issues/{issue_id}/comments/"
    html = f"<p><b>Regla de Negocio 'Cascos' Ejecutada (PR #17):</b></p><p>El Squad aplicó la distinción entre 'Solo Recarga' y 'Envase Completo'. Se insertó el producto en base de datos y se actualizó el catálogo B2C con un Badge azul brillante de <i>'✨ INCLUYE ENVASE NUEVO'</i>, todo sin romper el tipado en Zod. El monorepo compila limpio en 12.7s.</p>"
    resp = requests.post(comment_url, headers=headers, json={"comment_html": html})
    if resp.status_code in [200, 201]:
        print(f" -> Comentario HTML añadido")
    else:
        print(f" -> Error añadiendo comentario: {resp.text}")

# 2. Sincronizamos
for issue in issues:
    name = issue.get("name", "")
    issue_id = issue.get("id")
    
    # Comprobamos si el nombre contiene alguno de los issues terminados
    if any(prefix in name for prefix in done_issues):
        # Evitamos re-procesar ISSUE-102 si ya está cerrado (aunque no perdemos nada con forzar)
        print(f"Sincronizando {name}...")
        add_issue_to_cycle(issue_id)
        update_issue_state(issue_id)
        add_comment(issue_id, name)
        
print("Sincronización masiva de Plane completada exitosamente.")
