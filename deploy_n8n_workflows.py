import os
import requests
import json
import sys


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
    "N8N_API_KEY",
    "Se obtiene en n8n > Settings > n8n API > Create an API key.",
)

# Configuracion no secreta: se puede sobreescribir por entorno.
BASE_URL = os.environ.get("N8N_BASE_URL", "https://n8n.arcav.us").rstrip("/")
URL = f"{BASE_URL}/api/v1/workflows"

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
