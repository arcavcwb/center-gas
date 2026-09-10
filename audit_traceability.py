import os
import sys

import requests


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


# Secreto: nunca se hardcodea en el repositorio (es publico).
API_KEY = env_requerida(
    "PLANE_API_KEY",
    "Se obtiene en Plane > Workspace Settings > API Tokens.",
)

# Configuracion no secreta: se puede sobreescribir por entorno.
WORKSPACE = os.environ.get("PLANE_WORKSPACE", "lead-flow")
PROJECT_ID = os.environ.get("PLANE_PROJECT_ID", "439788cb-26c2-408d-a5e3-fde74e493f07")
BASE_URL = os.environ.get("PLANE_BASE_URL", "https://api.plane.so").rstrip("/")

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

# Mapping of Issue prefixes to the direct-to-main commits
audit_map = {
    "ISSUE-103": "530135d",
    "ISSUE-107": "530135d",
    "ISSUE-203": "530135d",
    "ISSUE-301": "b1ac7ef"
}

def add_audit_comment(issue_id, issue_name, commit_hash):
    comment_url = f"{BASE_URL}/api/v1/workspaces/{WORKSPACE}/projects/{PROJECT_ID}/issues/{issue_id}/comments/"
    html = f"""
    <p><b>🛡️ Auditoría de Trazabilidad Histórica:</b></p>
    <p>Este ticket fue implementado durante la fase inicial del MVP donde se realizaron merges directos a <code>main</code> (sin PR). 
    El código que resuelve esta funcionalidad se encuentra en el commit <b>{commit_hash}</b> en la rama principal.</p>
    <p><i>Nota generada automáticamente para mantener la coherencia del historial agéntico.</i></p>
    """
    resp = requests.post(comment_url, headers=headers, json={"comment_html": html})
    if resp.status_code in [200, 201]:
        print(f"Auditoría inyectada para {issue_name} (Commit: {commit_hash})")
    else:
        print(f"Error inyectando auditoría en {issue_name}: {resp.text}")

# 1. Fetch issues
url = f"{BASE_URL}/api/v1/workspaces/{WORKSPACE}/projects/{PROJECT_ID}/issues/"
response = requests.get(url, headers=headers)
issues = response.json().get("results", [])

for issue in issues:
    name = issue.get("name", "")
    issue_id = issue.get("id")
    
    for prefix, commit_hash in audit_map.items():
        if prefix in name:
            add_audit_comment(issue_id, name, commit_hash)

print("Traceability audit completed for Plane.")
