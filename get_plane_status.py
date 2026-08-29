import requests

API_KEY = "plane_api_512377479beb4978a69cce11b70cac71"
WORKSPACE = "lead-flow"
PROJECT_ID = "439788cb-26c2-408d-a5e3-fde74e493f07"
BASE_URL = "https://api.plane.so"

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
