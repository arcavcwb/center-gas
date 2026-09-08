#!/usr/bin/env bash
# ==============================================================================
# Antigravity Squad — Universal Agentic Flow Scaffolder
# Despliega en 1 solo comando el flujo agéntico (Enterprise u Operativo)
# ==============================================================================
set -e

# Colores para salida de terminal
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Ubicación absoluta de este script y sus plantillas
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TEMPLATES_DIR="${REPO_ROOT}/templates/agentic-flow"

# Configuración por defecto
TARGET_DIR="$(pwd)"
MODE=""
CHECK_ENV=false

show_banner() {
  echo -e "${CYAN}${BOLD}"
  echo "┌────────────────────────────────────────────────────────┐"
  echo "│         ANTIGRAVITY SQUAD — FLOW SCAFFOLDER            │"
  echo "│     Zero-Trust • Impeccable • Ponytail • Caveman       │"
  echo "└────────────────────────────────────────────────────────┘"
  echo -e "${NC}"
}

show_help() {
  echo -e "${BOLD}Uso:${NC} bash $0 [opciones]"
  echo ""
  echo -e "${BOLD}Opciones:${NC}"
  echo "  -m, --mode <operative|enterprise>  Modo de flujo a instalar (requerido en headless)"
  echo "  -t, --target <directorio>          Directorio destino (por defecto: actual)"
  echo "  -c, --check-env                    Ejecuta el diagnóstico Doctor sobre el entorno"
  echo "  -h, --help                         Muestra esta ayuda"
  echo ""
  echo -e "${BOLD}Ejemplos:${NC}"
  echo "  bash $0                            # Menú interactivo"
  echo "  bash $0 --mode operative           # Instala Modo Operativo en carpeta actual"
  echo "  bash $0 --mode enterprise -t ./app # Instala Modo Enterprise en ./app"
  echo "  bash $0 --check-env                # Verifica salud del entorno y variables"
  exit 0
}

# Parseo de argumentos CLI
while [[ $# -gt 0 ]]; do
  case $1 in
    -m|--mode)
      MODE="$2"
      shift 2
      ;;
    -t|--target)
      TARGET_DIR="$(cd "$2" 2>/dev/null && pwd || echo "$2")"
      shift 2
      ;;
    -c|--check-env)
      CHECK_ENV=true
      shift
      ;;
    -h|--help)
      show_help
      ;;
    *)
      echo -e "${RED}Opción desconocida: $1${NC}"
      show_help
      ;;
  esac
done

# Función: Diagnóstico del entorno (Doctor)
run_doctor() {
  echo -e "${BLUE}${BOLD}🔍 Ejecutando Diagnóstico de Entorno (Doctor)...${NC}\n"
  local issues=0

  # 1. Verificar Git
  if git -C "$TARGET_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Git inicializado"
    local branch
    branch="$(git -C "$TARGET_DIR" branch --show-current 2>/dev/null || echo 'desconocida')"
    echo -e "    Rama activa: ${CYAN}${branch}${NC}"
  else
    echo -e "  ${YELLOW}⚠${NC} Git no inicializado en $TARGET_DIR"
    issues=$((issues + 1))
  fi

  # 2. Verificar GitHub CLI
  if command -v gh >/dev/null 2>&1; then
    if gh auth status >/dev/null 2>&1; then
      local gh_user
      gh_user="$(gh api user -q .login 2>/dev/null || echo 'autenticado')"
      echo -e "  ${GREEN}✓${NC} GitHub CLI (gh) autenticado como: ${CYAN}@${gh_user}${NC}"
    else
      echo -e "  ${YELLOW}⚠${NC} GitHub CLI (gh) instalado pero no autenticado (ejecuta: gh auth login)"
      issues=$((issues + 1))
    fi
  else
    echo -e "  ${YELLOW}⚠${NC} GitHub CLI (gh) no encontrado en PATH"
    issues=$((issues + 1))
  fi

  # 3. Verificar archivo .env
  if [[ -f "$TARGET_DIR/.env" ]]; then
    echo -e "  ${GREEN}✓${NC} Archivo .env presente"
    if grep -q "PLANE_API_KEY=plane_api_" "$TARGET_DIR/.env" 2>/dev/null; then
      echo -e "    ${CYAN}•${NC} Plane API Key detectada"
    fi
    if grep -q "SUPABASE" "$TARGET_DIR/.env" 2>/dev/null; then
      echo -e "    ${CYAN}•${NC} Variables Supabase detectadas"
    fi
  else
    echo -e "  ${YELLOW}⚠${NC} Archivo .env no encontrado en $TARGET_DIR (crea uno desde .env.example)"
    issues=$((issues + 1))
  fi

  # 4. Verificar Skills esenciales
  local skills_found=0
  local all_skills=(impeccable caveman ponytail contract-first-api vite-modernizer web-vitals-heavy-media pnpm-monorepo-architect playwright-e2e-suite)
  for sk in "${all_skills[@]}"; do
    if [[ -d "$TARGET_DIR/.agents/skills/$sk" ]]; then
      skills_found=$((skills_found + 1))
    fi
  done

  if [[ $skills_found -eq ${#all_skills[@]} ]]; then
    echo -e "  ${GREEN}✓${NC} Todas las skills maestras presentes (${skills_found}/${#all_skills[@]})"
  else
    echo -e "  ${YELLOW}⚠${NC} Faltan skills maestras en .agents/skills/ (${skills_found}/${#all_skills[@]} encontradas)"
    issues=$((issues + 1))
  fi

  # 5. Verificar verificación de diseño en package.json
  if [[ -f "$TARGET_DIR/package.json" ]]; then
    if grep -q "check:design" "$TARGET_DIR/package.json"; then
      echo -e "  ${GREEN}✓${NC} Script 'check:design' configurado en package.json"
    else
      echo -e "  ${YELLOW}⚠${NC} Script 'check:design' falta en package.json"
    fi
  fi

  echo ""
  if [[ $issues -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}✨ Todo en orden. Tu entorno agéntico está 100% operativo.${NC}\n"
  else
    echo -e "${YELLOW}${BOLD}⚠ Se detectaron $issues advertencia(s). Revisa las notas anteriores.${NC}\n"
  fi
}

if [[ "$CHECK_ENV" == true ]]; then
  show_banner
  run_doctor
  exit 0
fi

show_banner

# Menú interactivo si no se pasó --mode
if [[ -z "$MODE" ]]; then
  echo -e "${BOLD}¿Qué modo de flujo deseas desplegar en este proyecto?${NC}"
  echo -e "  ${GREEN}1)${NC} ${BOLD}Modo Operativo${NC} (Recomendado: Git-Only, sin Plane ni Scrum, máxima velocidad)"
  echo -e "  ${BLUE}2)${NC} ${BOLD}Modo Enterprise${NC} (Gobernanza completa: Plane.so + Sprints + Scrum)"
  echo ""
  read -r -p "Selecciona una opción [1 o 2, default: 1]: " choice
  case "$choice" in
    2|enterprise|Enterprise)
      MODE="enterprise"
      ;;
    *)
      MODE="operative"
      ;;
  esac
fi

# Validar modo
if [[ "$MODE" != "operative" && "$MODE" != "enterprise" ]]; then
  echo -e "${RED}Error: Modo no válido '$MODE'. Debe ser 'operative' o 'enterprise'.${NC}"
  exit 1
fi

SRC_TEMPLATE="${TEMPLATES_DIR}/mode-${MODE}"

if [[ ! -d "$SRC_TEMPLATE" ]]; then
  echo -e "${RED}Error: Plantilla no encontrada en $SRC_TEMPLATE${NC}"
  exit 1
fi

echo -e "\n${BLUE}🚀 Configurando proyecto en:${NC} ${BOLD}${TARGET_DIR}${NC}"
echo -e "${BLUE}📦 Modo seleccionado:${NC} ${BOLD}${MODE}${NC}\n"

mkdir -p "$TARGET_DIR"

# 1. Inicializar Git si no existe
if ! git -C "$TARGET_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo -e "  ${CYAN}•${NC} Inicializando repositorio Git..."
  git -C "$TARGET_DIR" init >/dev/null
fi

# 2. Crear directorios de destino
mkdir -p "$TARGET_DIR/.agents/rules"
mkdir -p "$TARGET_DIR/.agents/skills"
mkdir -p "$TARGET_DIR/docs/walkthroughs"

# 3. Copiar reglas y AGENTS.md
echo -e "  ${CYAN}•${NC} Desplegando reglas de gobernanza y AGENTS.md..."
cp "${SRC_TEMPLATE}/rules/superules.md" "$TARGET_DIR/.agents/rules/superules.md"
cp "${SRC_TEMPLATE}/AGENTS.md" "$TARGET_DIR/AGENTS.md"
cp "${SRC_TEMPLATE}/task-template.md" "$TARGET_DIR/task.md"

# 4. Copiar core skills
echo -e "  ${CYAN}•${NC} Instalando skills maestras (Impeccable, Caveman, Ponytail, Contracts, Vite, Web Vitals, Monorepo, Playwright)..."
cp -r "${TEMPLATES_DIR}/core-skills/"* "$TARGET_DIR/.agents/skills/"

# 5. Generar .env.example y .env inicial
echo -e "  ${CYAN}•${NC} Configurando variables de entorno (.env.example)..."
cp "${SRC_TEMPLATE}/.env.example" "$TARGET_DIR/.env.example"
if [[ ! -f "$TARGET_DIR/.env" ]]; then
  cp "${SRC_TEMPLATE}/.env.example" "$TARGET_DIR/.env"
  echo -e "    ${GREEN}✓${NC} Archivo .env inicial creado a partir de .env.example"
else
  echo -e "    ${YELLOW}ℹ${NC} Archivo .env preexistente preservado"
fi

# 6. Generar .agents/mcp_config.json dinámico
echo -e "  ${CYAN}•${NC} Generando configuración MCP (.agents/mcp_config.json)..."
if [[ -f "${SRC_TEMPLATE}/mcp_config.template.json" ]]; then
  # Reemplazo de variables de entorno si existen en el entorno o .env
  if [[ -f "$TARGET_DIR/.env" ]]; then
    # Inyectar usando perl/envsubst seguro sin romper JSON
    export $(grep -v '^#' "$TARGET_DIR/.env" | xargs 2>/dev/null || true)
  fi
  
  if command -v envsubst >/dev/null 2>&1; then
    envsubst < "${SRC_TEMPLATE}/mcp_config.template.json" > "$TARGET_DIR/.agents/mcp_config.json"
  else
    cp "${SRC_TEMPLATE}/mcp_config.template.json" "$TARGET_DIR/.agents/mcp_config.json"
  fi
fi

# 7. Reforzar .gitignore
echo -e "  ${CYAN}•${NC} Blindando .gitignore..."
GITIGNORE_FILE="$TARGET_DIR/.gitignore"
touch "$GITIGNORE_FILE"

ensure_ignore() {
  local entry="$1"
  if ! grep -q "^${entry}$" "$GITIGNORE_FILE" 2>/dev/null; then
    echo "$entry" >> "$GITIGNORE_FILE"
  fi
}

ensure_ignore ".env"
ensure_ignore ".env.local"
ensure_ignore "*.log"
ensure_ignore "node_modules/"
ensure_ignore ".turbo/"
ensure_ignore "dist/"
ensure_ignore "coverage/"
ensure_ignore "playwright-report/"
ensure_ignore "test-results/"

# 8. Si existe package.json, inyectar check:design
if [[ -f "$TARGET_DIR/package.json" ]]; then
  if ! grep -q "check:design" "$TARGET_DIR/package.json"; then
    echo -e "  ${CYAN}•${NC} Inyectando script 'check:design' en package.json..."
    # Usar node para editar el JSON limpiamente
    node -e "
      const fs = require('fs');
      const p = '$TARGET_DIR/package.json';
      const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
      pkg.scripts = pkg.scripts || {};
      pkg.scripts['check:design'] = '.agents/skills/impeccable/scripts/impeccable detect';
      fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
    " 2>/dev/null || true
  fi
fi

# 9. Inicializar README en docs/walkthroughs/
if [[ ! -f "$TARGET_DIR/docs/walkthroughs/README.md" ]]; then
  cat << 'EOF' > "$TARGET_DIR/docs/walkthroughs/README.md"
# Registro de Walkthroughs y Entregas

Este directorio almacena los reportes técnicos detallados generados al finalizar cada tarea o Issue.
Cada archivo documenta: cambios realizados, contratos modificados, comandos ejecutados y resultados de pruebas.
EOF
fi

echo -e "\n${GREEN}${BOLD}🎉 ¡Flujo Agéntico desplegado con éxito en Modo ${MODE^^}!${NC}\n"
echo -e "${BOLD}Resumen de configuración:${NC}"
echo -e "  • Modo: ${CYAN}${MODE}${NC}"
echo -e "  • Reglas: ${CYAN}.agents/rules/superules.md${NC}"
echo -e "  • Contexto: ${CYAN}AGENTS.md${NC}"
echo -e "  • Skills: ${CYAN}impeccable, caveman, ponytail${NC} en .agents/skills/"
echo -e "  • Check-env: Ejecuta ${YELLOW}bash $0 --check-env${NC} para verificar salud"
echo ""
echo -e "${BOLD}Siguientes pasos:${NC}"
echo -e "  1. Revisa o completa las credenciales en ${CYAN}.env${NC}"
echo -e "  2. Abre Antigravity o ejecuta tu sesión CLI"
echo -e "  3. Inicia tu primera tarea usando ${CYAN}task.md${NC} como guía de trabajo"
echo ""
