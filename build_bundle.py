import re
import os

files = [
    ("Constantes", "js/constants.js"),
    ("Regras e cálculos", "js/rules.js"),
    ("Rolador de dados D6", "js/dice.js"),
    ("Persistência local", "js/storage.js"),
    ("Importação e exportação", "js/importer-exporter.js"),
    ("Estado da aplicação", "js/state.js"),
    ("Renderização da interface", "js/ui.js"),
    ("Controle de eventos e abas", "js/app.js")
]

def clean_module(code):
    # Remove imports ES modules
    code = re.sub(r'import\s+[\s\S]*?from\s+[\'"][^\'"]+[\'"];?\s*', '', code)
    code = re.sub(r'import\s+[\'"][^\'"]+[\'"];?\s*', '', code)

    # Remove exports
    code = re.sub(r'export\s+\{[\s\S]*?\};?\s*', '', code)
    code = re.sub(r'\bexport\s+(const|let|var|function|class)\b', r'\1', code)
    code = re.sub(r'\bexport\s+default\s+', '', code)

    return code

bundle_lines = [
    "/**",
    " * Terminal Clandestino de Gerenciamento de Runner (Shadowrun: Anarchy)",
    " * Bundle dos módulos JavaScript para o site e aplicativo desktop.",
    " */",
    "(function () {",
    '  "use strict";',
    ""
]

for title, path in files:
    with open(path, "r", encoding="utf-8") as f:
        src = f.read()

    cleaned = clean_module(src)
    bundle_lines.append(f"  // --- {title} ---")

    for line in cleaned.splitlines():
        if line.strip():
            bundle_lines.append("  " + line)
        else:
            bundle_lines.append("")

    bundle_lines.append("")

bundle_lines.append("})();\n")

bundle_content = "\n".join(bundle_lines)

with open("js/bundle.js", "w", encoding="utf-8", newline="\n") as f:
    f.write(bundle_content)

print(f"Generated js/bundle.js successfully. Total lines: {len(bundle_lines)}")
