import requests

API_KEY = "plane_api_512377479beb4978a69cce11b70cac71"
WORKSPACE = "lead-flow"
PROJECT_ID = "439788cb-26c2-408d-a5e3-fde74e493f07"
BASE_URL = "https://api.plane.so"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

# Get all issues
url = f"{BASE_URL}/api/v1/workspaces/{WORKSPACE}/projects/{PROJECT_ID}/issues/"
response = requests.get(url, headers=headers)
if response.status_code != 200:
    print(f"Failed to fetch issues: {response.text}")
    exit(1)

issues = response.json().get("results", [])

# Find ISSUE-101 and ISSUE-201
issue_101_id = None
issue_201_id = None

for issue in issues:
    name = issue.get("name", "")
    if "ISSUE-101" in name:
        issue_101_id = issue.get("id")
    elif "ISSUE-201" in name:
        issue_201_id = issue.get("id")

print(f"Found ISSUE-101 ID: {issue_101_id}")
print(f"Found ISSUE-201 ID: {issue_201_id}")

def patch_issue(issue_id, new_name):
    if not issue_id:
        print("Issue ID not found, skipping.")
        return
    patch_url = f"{BASE_URL}/api/v1/workspaces/{WORKSPACE}/projects/{PROJECT_ID}/issues/{issue_id}/"
    resp = requests.patch(patch_url, headers=headers, json={"name": new_name})
    if resp.status_code == 200:
        print(f"Successfully updated issue {issue_id}")
    else:
        print(f"Failed to update issue {issue_id}: {resp.text}")

patch_issue(issue_101_id, "ISSUE-101: Initial Setup of Hybrid Monorepo: Next.js (Dashboard) & Astro+SolidJS (Client LP with Shadow DOM) & Styling Token System")
patch_issue(issue_201_id, "ISSUE-201: Build Owner Realtime Kanban Board Component in Next.js + React")
