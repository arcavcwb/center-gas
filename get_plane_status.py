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

url = f"{BASE_URL}/api/v1/workspaces/{WORKSPACE}/projects/{PROJECT_ID}/issues/"
response = requests.get(url, headers=headers)
issues = response.json().get("results", [])

print("Status of Issues in Plane:")
for issue in issues:
    name = issue.get("name", "")
    state_detail = issue.get("state_detail", {})
    state_name = state_detail.get("name", "Unknown") if isinstance(state_detail, dict) else issue.get("state_id")
    print(f"[{state_name}] {name}")
