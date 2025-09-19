import re

file_path = "c:\\Users\\Maia\\FocuseAR\\src\\index.css"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

cleaned_content_parts = []

# 1. Tailwind Directives (should be at the very top)
tailwind_directives_match = re.match(r"(@tailwind base;\s*@tailwind components;\s*@tailwind utilities;)", content)
if tailwind_directives_match:
    cleaned_content_parts.append(tailwind_directives_match.group(1))
    content = content[tailwind_directives_match.end():]

# 2. Font Imports
font_imports = []
font_import_pattern = re.compile(r"@import url\(\\'[^\\]*\\\'\);")
for match in font_import_pattern.finditer(content):
    font_imports.append(match.group(0))
content = font_import_pattern.sub("", content) # Remove from main content
cleaned_content_parts.append("\n/* ===== ESTILO DE FUENTES Y ANIMACIÓN ===== */\n" + "\n".join(sorted(list(set(font_imports))))) # Deduplicate and sort

# 3. CSS Variables (prioritize the first definition found)
css_variables = {}
variable_block_pattern = re.compile(r"(:root\s*\{.*?\}|\\\[data-theme=\\'dark\\'\]\s*\{.*?\})", re.DOTALL)

for match in variable_block_pattern.finditer(content):
    block_content = match.group(0)
    # Simple parsing to extract variables, assuming no complex nested rules
    for line in block_content.split('\n'):
        var_match = re.match(r"\s*(--[a-zA-Z0-9-]+):\s*(.*?);", line)
        if var_match:
            var_name = var_match.group(1)
            var_value = var_match.group(2)
            if var_name not in css_variables: # Prioritize first definition
                css_variables[var_name] = var_value

# Reconstruct variable blocks
reconstructed_root = ":root {\n"
reconstructed_dark = "[data-theme='dark'] {\n"

for var_name, var_value in css_variables.items():
    if var_name.startswith('--'):
        # Simple heuristic to separate light/dark mode variables
        # This might need refinement for more complex themes
        if 'dark' in var_name or '#2D3748' in var_value or '#1A202C' in var_value or '#f9fafb' in var_value or '#CBD5E0' in var_value or '#4A5568' in var_value:
            reconstructed_dark += f"  {var_name}: {var_value};\n"
        else:
            reconstructed_root += f"  {var_name}: {var_value};\n"

reconstructed_root += "}\n"
reconstructed_dark += "}\n"

cleaned_content_parts.append("\n/* ===== VARIABLES Y COLORES (MODO CLARO) ===== */\n" + reconstructed_root)
cleaned_content_parts.append("\n/* ===== VARIABLES PARA MODO OSCURO ===== */\n" + reconstructed_dark)

content = variable_block_pattern.sub("", content) # Remove from main content

# 4. General Styles (body, html, a, button, img, etc.)
general_styles = {}
general_style_pattern = re.compile(r"(html\s*\{.*?\}|body\s*\{.*?\}|a\s*\{.*?\}|button\s*\{.*?\}|img,\s*video,\s*iframe\s*\{.*?\}|\*\s*\{.*?\}|\*::before,\s*\*::after\s*\{.*?\}|\.modal\s*\{.*?\}|\.form-grid\s*\{.*?\}|\.react-datepicker__day\s*\{.*?\})", re.DOTALL)

for match in general_style_pattern.finditer(content):
    selector = match.group(0).split('{')[0].strip()
    if selector not in general_styles:
        general_styles[selector] = match.group(0)
content = general_style_pattern.sub("", content) # Remove from main content

cleaned_content_parts.append("\n/* Base Typography and Global Styles */\n" + "\n".join(general_styles.values()))

# 5. App Layout Flexbox (specific to .app-container, .content-area)
app_layout_styles = {}
app_layout_pattern = re.compile(r"(\.app-container\s*\{.*?\}|\.content-area\s*\{.*?\})", re.DOTALL)
for match in app_layout_pattern.finditer(content):
    selector = match.group(0).split('{')[0].strip()
    if selector not in app_layout_styles:
        app_layout_styles[selector] = match.group(0)
content = app_layout_pattern.sub("", content) # Remove from main content
cleaned_content_parts.append("\n/* App Layout Flexbox */\n" + "\n".join(app_layout_styles.values()))

# 6. Component-Specific Styles (remaining content)
# This is a fallback for anything not explicitly parsed above
cleaned_content_parts.append("\n/* Component-Specific Styles */\n" + content.strip())

final_content = "\n".join(cleaned_content_parts)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print("Successfully cleaned and optimized src/index.css")
