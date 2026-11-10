"""에셋 제작기용 작은 서버: 이 폴더의 파일을 보여 주고, POST /save?f=상대경로 로 받은 파일을 에셋 폴더에 저장한다."""
import http.server, os, sys, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(sys.argv[1])
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=HERE, **k)
    def do_POST(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        rel = q.get('f', [''])[0].replace('\\', '/')
        dest = os.path.abspath(os.path.join(OUT, rel))
        if not rel or not dest.startswith(OUT + os.sep) or not rel.split('.')[-1] in ('png', 'glb', 'json'):
            self.send_response(400); self.end_headers(); return
        n = int(self.headers.get('Content-Length', 0)); data = self.rfile.read(n)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        open(dest, 'wb').write(data)
        self.send_response(200); self.end_headers(); self.wfile.write(b'ok')
        print('saved', rel, len(data), flush=True)
http.server.ThreadingHTTPServer(('127.0.0.1', 8808), H).serve_forever()
