import urllib.request
import re
import os
import hashlib

url = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700&family=Rajdhani:wght@500;600;700&family=Share+Tech+Mono&family=Space+Grotesk:wght@400;500;600;700&display=swap'

os.makedirs('fonts', exist_ok=True)

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'})
css = urllib.request.urlopen(req).read().decode('utf-8')

font_urls = sorted(list(set(re.findall(r'url\((https://[^)]+)\)', css))))
print(f"Downloading {len(font_urls)} unique font files...")

url_to_local = {}
for i, f_url in enumerate(font_urls):
    ext = os.path.splitext(f_url.split('/')[-1])[1] or '.woff2'
    # Nome do arquivo com hash para evitar colisões
    h = hashlib.md5(f_url.encode('utf-8')).hexdigest()[:8]
    raw_name = f_url.split('/')[-1].split('?')[0]
    filename = f"{h}_{raw_name}"
    local_path = os.path.join('fonts', filename)
    
    if not os.path.exists(local_path):
        f_req = urllib.request.Request(f_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        data = urllib.request.urlopen(f_req).read()
        with open(local_path, 'wb') as f:
            f.write(data)
    url_to_local[f_url] = f"../fonts/{filename}"
    if (i + 1) % 15 == 0 or i == len(font_urls) - 1:
        print(f"Downloaded {i + 1}/{len(font_urls)}")

# Ajusta links no CSS para apontar para a pasta local
for f_url, local_rel in url_to_local.items():
    css = css.replace(f_url, local_rel)

with open('css/fonts.css', 'w', encoding='utf-8') as f:
    f.write("/* Fontes locais para uso offline */\n" + css)

print("Offline fonts successfully saved in 'fonts/' and 'css/fonts.css' generated!")
