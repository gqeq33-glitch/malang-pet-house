"""Build the claude.ai artifact page from www/index.html.

The artifact host adds its own <html>/<head>/<body> wrapper and only allows scripts from public CDNs,
so this strips the wrapper and loads Three.js from cdnjs instead of the bundled vendor copy.
Run:  python tools/make_artifact.py <output.html>
"""
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
s = (ROOT / "www" / "index.html").read_text(encoding="utf-8")
s = s.replace('<script src="vendor/three.min.js"></script>',
              '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>')
s = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>\s*', "", s)  # 공유 페이지는 CDN을 쓰고 호스트가 자체 보안 설정을 둔다
s = re.sub(r"<!doctype html>\s*<html[^>]*>\s*<head>\s*", "", s, flags=re.I)
s = re.sub(r'<meta charset="utf-8">\s*', "", s)
s = re.sub(r'<meta name="viewport"[^>]*>\s*', "", s)
s = re.sub(r"</head>\s*<body>\s*", "", s)
s = re.sub(r"</body>\s*</html>\s*$", "", s)
out = Path(sys.argv[1])
out.write_text(s, encoding="utf-8")
print(out, len(s))
