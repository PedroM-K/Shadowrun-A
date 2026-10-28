import os
import subprocess
from PIL import Image

workspace = os.path.abspath(".")
svg_path = os.path.join(workspace, "icons", "icon.svg")
html_render_path = os.path.join(workspace, "icons", "render_icon.html")
png_output = os.path.join(workspace, "icons", "icon-512.png")
png_main = os.path.join(workspace, "icons", "icon.png")
ico_output = os.path.join(workspace, "icons", "icon.ico")

# Gera HTML temporário para renderizar o SVG em 512x512
html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body {{
    margin: 0;
    padding: 0;
    width: 512px;
    height: 512px;
    background: transparent;
    overflow: hidden;
  }}
  img {{
    width: 512px;
    height: 512px;
    display: block;
  }}
</style>
</head>
<body>
<img src="file:///{svg_path.replace(os.sep, '/')}" />
</body>
</html>
"""

with open(html_render_path, "w", encoding="utf-8") as f:
    f.write(html_content)

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(chrome_path):
    chrome_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

print(f"Rendering SVG with headless browser: {chrome_path}")
cmd = [
    chrome_path,
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    f"--window-size=512,512",
    f"--screenshot={png_output}",
    f"file:///{html_render_path.replace(os.sep, '/')}"
]
subprocess.run(cmd, check=True)

if os.path.exists(html_render_path):
    os.remove(html_render_path)

if os.path.exists(png_output):
    print("Generated 512x512 PNG. Converting to multi-size Windows ICO...")
    img = Image.open(png_output)
    img.save(png_main, format="PNG")
    
    # Gera o .ico com as resoluções padrão do Windows
    icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    img.save(ico_output, format="ICO", sizes=icon_sizes)

    # Remove o PNG intermediário
    try:
        os.remove(png_output)
    except Exception:
        pass

    print(f"Generated {ico_output} and {png_main} successfully!")
else:
    print("Failed to generate PNG screenshot.")
