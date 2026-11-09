#!/usr/bin/env python3
"""Gera malbec/index.html (arquivo único, imagens embutidas) a partir de src/index.html + src/img/."""
import base64, re, pathlib, zipfile

root = pathlib.Path(__file__).parent
html = (root / "src" / "index.html").read_text(encoding="utf-8")
mime = {".png": "image/png", ".jpg": "image/jpeg"}

def embed(m):
    f = root / "src" / "img" / m.group(1)
    data = base64.b64encode(f.read_bytes()).decode()
    return f"data:{mime[f.suffix]};base64,{data}"

out = re.sub(r"img/([a-z0-9]+\.(?:png|jpg))", embed, html)
(root / "index.html").write_text(out, encoding="utf-8")
with zipfile.ZipFile(root / "malbec-previa-codrian.zip", "w", zipfile.ZIP_DEFLATED) as z:
    z.write(root / "index.html", "index.html")
print("ok", len(out) // 1024, "KB")
