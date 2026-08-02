# Auditoría de Trazabilidad Histórica (Git <-> Plane)

Este documento sirve como "Índice de Cordura" para explicar las desviaciones del flujo de CI/CD que ocurrieron durante la fase de desarrollo MVP inicial (Sprints 1 y 2). 
Debido a la velocidad del prototipado, el escuadrón de agentes saltó el protocolo de Pull Requests y realizó *commits directos* a la rama `main`, lo que desconectó el historial de GitHub de los tickets de Plane.

Para no recurrir a un `git push --force` destructivo, se inyectaron comentarios directamente en los tickets afectados de Plane, apuntando a los hashes exactos donde reside el código.

## 🛠️ Mapa de Resoluciones Directas a Main (Bypassed PR Flow)

| Issue Plane | Descripción | Commit en `main` |
| :--- | :--- | :--- |
| **ISSUE-103** | Seed Database: Products & Configs | `530135d` |
| **ISSUE-107** | Owner & Driver Auth (Supabase) | `530135d` |
| **ISSUE-203** | Manual Order Creation (Kanban) | `530135d` |
| **ISSUE-301** | B2C Self-Service Catalog Page | `b1ac7ef` |

## 🛡️ Hito de Gobernanza
A partir de la Épica 5 (n8n & WhatsApp) y el proceso de QA (ISSUE-601), se refuerza estrictamente el protocolo de **Trunk-Based Development protegido**. 

**Reglas vigentes:**
1. Ningún agente puede ejecutar un commit sobre `main`.
2. Toda feature debe nacer en una rama `feat/ISSUE-XXX`.
3. Todo Pull Request debe tener descripción inyectada vía API (debido al bug GraphQL de la CLI local `gh`).
4. Ningún ticket de Plane puede cerrarse sin referenciar el Commit Hash de Git.
