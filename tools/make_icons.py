"""App icon builder.

1) python tools/make_icons.py serve   -> opens a local page (http://127.0.0.1:8770/) that draws 몽글이 with the
   game's own character code and posts two 1024px PNGs back to this script.
2) The script then resizes them into every size the manifest / App Store / Play Store needs.
"""
import base64, http.server, json, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "www" / "icons"
html = (ROOT / "www" / "index.html").read_text(encoding="utf-8")
code = html[html.index("const INK = "):html.index("function eggSVG")]

PAGE = f"""<!doctype html><meta charset="utf-8"><title>icon</title><body>
<script>{code}
async function draw(scale, bg = true, size = 1024, pet = true) {{
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(512, 390, 0, 512, 390, 760);
  g.addColorStop(0, '#F3FFF9'); g.addColorStop(.42, '#F3FFF9'); g.addColorStop(.43, '#DDF4EA'); g.addColorStop(1, '#CDEFE2');
  x.scale(size / 1024, size / 1024);
  if (bg) {{ x.fillStyle = g; x.fillRect(0, 0, 1024, 1024); }}
  if (!pet) return c.toDataURL('image/png');
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(petSVG('bunny', {{ mood: 'happy', stage: 'kid', hat: 'ribbon' }}));
  await img.decode();
  const s = 1024 * scale; x.drawImage(img, 512 - s / 2, 532 - s / 2, s, s);
  return c.toDataURL('image/png');
}}
(async () => {{
  // maskable: 안드로이드가 원/물방울로 잘라도 캐릭터가 가운데 80% 안에 남도록 작게
  const body = JSON.stringify({{ any: await draw(.86), mask: await draw(.64), fg: await draw(.64, false), bgonly: await draw(0, true, 1024, false), splash: await draw(.3, true, 2732) }});
  const r = await fetch('/save', {{ method: 'POST', body }});
  document.title = r.ok ? 'saved' : 'failed';
}})();
</script>"""

def build(any_png: Path, mask_png: Path):
    anyi = Image.open(any_png).convert("RGB"); mask = Image.open(mask_png).convert("RGB")
    # 앱스토어 아이콘은 알파 채널이 있으면 거절되므로 RGB로 다시 저장
    anyi.save(any_png); mask.save(mask_png)
    icon_only = ROOT / "assets" / "icon-only.png"
    if icon_only.exists(): Image.open(icon_only).convert("RGB").save(icon_only)
    for size in (512, 192):
        anyi.resize((size, size), Image.LANCZOS).save(OUT / f"icon-{size}.png")
        mask.resize((size, size), Image.LANCZOS).save(OUT / f"maskable-{size}.png")
    anyi.resize((180, 180), Image.LANCZOS).save(OUT / "apple-touch-icon.png")
    anyi.resize((32, 32), Image.LANCZOS).save(OUT / "favicon-32.png")
    print("icons:", sorted(p.name for p in OUT.iterdir()), flush=True)

class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200); self.send_header("Content-Type", "text/html; charset=utf-8"); self.end_headers()
        self.wfile.write(PAGE.encode("utf-8"))
    def do_POST(self):
        data = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        OUT.mkdir(parents=True, exist_ok=True)
        for key, name in (("any", "icon-1024.png"), ("mask", "maskable-1024.png")):
            (OUT / name).write_bytes(base64.b64decode(data[key].split(",", 1)[1]))
        # Capacitor 네이티브 아이콘·스플래시 원본 (npx @capacitor/assets generate 가 읽는 이름)
        assets = ROOT / "assets"; assets.mkdir(exist_ok=True)
        for key, name in (("any", "icon-only.png"), ("fg", "icon-foreground.png"), ("bgonly", "icon-background.png"), ("splash", "splash.png")):
            (assets / name).write_bytes(base64.b64decode(data[key].split(",", 1)[1]))
        build(OUT / "icon-1024.png", OUT / "maskable-1024.png")
        self.send_response(200); self.end_headers()
    def log_message(self, *a): pass

if __name__ == "__main__":
    if sys.argv[1:] == ["serve"]:
        print("open http://127.0.0.1:8770/", flush=True)
        http.server.HTTPServer(("127.0.0.1", 8770), H).serve_forever()
    else:
        build(OUT / "icon-1024.png", OUT / "maskable-1024.png")
