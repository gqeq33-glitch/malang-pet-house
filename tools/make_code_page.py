"""Build a "copy the whole code" page: every project text file embedded, each with a copy button.

The first entry is a single-file version of the game (3D library and fonts from public CDNs),
so copying just that one file and opening it in a browser runs the game.
Run:  python tools/make_code_page.py <output.html>
"""
import base64, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
game = (ROOT / "www" / "index.html").read_text(encoding="utf-8")
# 한 파일 실행용은 CDN의 3D 라이브러리·글꼴을 쓰므로 앱용 보안 설정(CSP)을 뺀다
game_nocsp = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>\s*', "", game)
single = game_nocsp.replace('<script src="vendor/three.min.js"></script>',
                      '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>')
single = re.sub(r'@font-face\{font-family:"(Jua|Gowun Dodum)";src:url\("fonts/[^)]*\) format\("woff2"\);font-display:swap\}\n', "", single)
single = single.replace('<link rel="preload" href="fonts/Jua-Regular.woff2" as="font" type="font/woff2" crossorigin>\n',
                        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jua&family=Gowun+Dodum&display=swap">\n')

FILES = [
    ("index.html", "게임 전체 (한 파일 실행용)", "이 파일 하나만 저장해서 크롬·엣지로 열면 바로 실행돼요. 3D 라이브러리와 글꼴은 인터넷에서 불러와요.", single, True),
    ("www/index.html", "앱용 게임 파일", "설치형 앱(PWA·안드로이드)에 들어가는 원본이에요. vendor/three.min.js와 fonts 폴더가 옆에 있어야 해요.", game, False),
    ("www/sw.js", "오프라인 캐시", "인터넷 없이도 앱이 켜지게 해 줘요.", None, False),
    ("www/manifest.webmanifest", "앱 설치 정보", "앱 이름·아이콘·전체 화면 설정이에요.", None, False),
    ("www/privacy.html", "개인정보처리방침", "스토어 등록에 필요한 페이지예요.", None, False),
    ("README.md", "설치·출시 안내서", "PWA 설치, 구글 플레이, 앱스토어 출시 방법이에요.", None, False),
    ("capacitor.config.json", "네이티브 앱 설정", "앱 ID와 이름이에요.", None, False),
    ("package.json", "Capacitor 패키지 목록", "", None, False),
    (".github/workflows/android.yml", "안드로이드 자동 빌드", "GitHub에서 APK/AAB를 만들어요.", None, False),
    (".github/workflows/pages.yml", "웹앱 자동 배포", "GitHub Pages에 올려요.", None, False),
    ("tools/make_artifact.py", "공유 페이지 만들기 도구", "", None, False),
    ("tools/make_icons.py", "아이콘 만들기 도구", "", None, False),
    ("tools/make_fonts.py", "글꼴 줄이기 도구", "", None, False),
]
items = []
for path, title, desc, text, main in FILES:
    if text is None:
        text = (ROOT / path).read_text(encoding="utf-8")
    items.append({"path": path, "title": title, "desc": desc, "main": main, "lines": text.count("\n") + 1,
                  "kb": round(len(text.encode("utf-8")) / 1024), "b64": base64.b64encode(text.encode("utf-8")).decode("ascii")})

PAGE = """<title>말랑 펫하우스 코드</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jua&family=Gowun+Dodum&display=swap">
<style>
/* Layout: 한 줄 머리말 + 큰 '게임 전체 복사' 카드 + 나머지 파일 목록(펼치면 코드) */
:root{
  --bg:#EAF7F1; --card:#FFFFFF; --ink:#4A3B44; --muted:#7D6A74; --line:#D9E9E1; --accent:#FF8FA3; --accent-ink:#FFFFFF; --mint:#7ED9C3; --code-bg:#F6FBF8;
  --display:"Jua","Gowun Dodum","Apple SD Gothic Neo","Malgun Gothic",sans-serif;
  --body:"Gowun Dodum","Apple SD Gothic Neo","Malgun Gothic",sans-serif;
  --mono:ui-monospace,"Cascadia Code","D2Coding",Consolas,monospace;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#1F2A27;--card:#28362F;--ink:#EAF2EE;--muted:#A9BDB4;--line:#3A4B44;--accent:#FF8FA3;--accent-ink:#2A1A20;--mint:#7ED9C3;--code-bg:#1B2421;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#1F2A27;--card:#28362F;--ink:#EAF2EE;--muted:#A9BDB4;--line:#3A4B44;--accent:#FF8FA3;--accent-ink:#2A1A20;--mint:#7ED9C3;--code-bg:#1B2421;color-scheme:dark}
body{background:var(--bg);color:var(--ink);font-family:var(--body);font-size:15px;line-height:1.55}
.wrap{max-width:760px;margin:0 auto;padding-block:28px 48px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:flex;flex-direction:column;gap:16px}
h1{font-family:var(--display);font-weight:400;font-size:32px;line-height:1.2;margin:0;text-wrap:balance}
.lead{margin:0;color:var(--muted);max-width:60ch}
.links{display:flex;flex-wrap:wrap;gap:8px}
.links a{color:var(--ink);text-decoration:none;font-family:var(--display);font-size:15px;padding:6px 14px;border-radius:99px;background:var(--card);box-shadow:0 0 0 2px var(--line) inset}
.links a:hover,.links a:focus-visible{box-shadow:0 0 0 2px var(--ink) inset;outline:none}
.file{background:var(--card);border-radius:20px;box-shadow:0 0 0 2px var(--line) inset;padding:14px 16px;display:flex;flex-direction:column;gap:8px;min-width:0}
.file.main{box-shadow:0 0 0 3px var(--ink) inset;padding:18px}
.row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.name{flex:1;min-width:0}
.name b{font-family:var(--display);font-weight:400;font-size:18px;display:block}
.main .name b{font-size:22px}
.name code{font-family:var(--mono);font-size:12.5px;color:var(--muted);word-break:break-all}
.meta{font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}
.desc{margin:0;font-size:14px;color:var(--muted)}
button{font:inherit;cursor:pointer;color:inherit}
.copy{border:0;border-radius:14px;padding:9px 16px;font-family:var(--display);font-size:16px;background:var(--accent);color:var(--accent-ink);box-shadow:0 3px 0 rgba(0,0,0,.18)}
.main .copy{font-size:19px;padding:12px 22px}
.copy:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(0,0,0,.18)}
.copy.done{background:var(--mint);color:#1F3A32}
.show{border:0;background:none;font-family:var(--display);font-size:14px;color:var(--muted);padding:6px 4px}
.show:hover{color:var(--ink)}
button:focus-visible{outline:3px solid var(--mint);outline-offset:2px}
textarea{width:100%;height:320px;resize:vertical;font-family:var(--mono);font-size:12px;line-height:1.5;color:var(--ink);background:var(--code-bg);border:0;border-radius:12px;box-shadow:0 0 0 1.5px var(--line) inset;padding:12px;white-space:pre;overflow:auto;box-sizing:border-box}
.hint{margin:0;font-size:13px;color:var(--muted)}
.toast{position:fixed;left:50%;bottom:max(20px,env(safe-area-inset-bottom,0px));transform:translate(-50%,120px);background:var(--ink);color:var(--bg);font-family:var(--display);padding:10px 18px;border-radius:99px;transition:transform .3s;z-index:9}
.toast.on{transform:translate(-50%,0)}
@media (prefers-reduced-motion:reduce){.toast{transition:none}}
</style>

<main class="wrap">
  <h1>말랑 펫하우스 전체 코드</h1>
  <p class="lead">버튼을 누르면 파일 내용이 통째로 복사돼요. 메모장에 붙여 넣고 파일 이름 그대로 저장하면 돼요. 게임만 실행해 보려면 맨 위 <b>index.html</b> 하나면 충분해요.</p>
  <div class="links">
    <a href="https://github.com/gqeq33-glitch/malang-pet-house" target="_blank" rel="noopener">GitHub 저장소</a>
    <a href="https://github.com/gqeq33-glitch/malang-pet-house/archive/refs/heads/main.zip" target="_blank" rel="noopener">전체 폴더 zip 받기</a>
    <a href="https://gqeq33-glitch.github.io/malang-pet-house/" target="_blank" rel="noopener">웹앱 바로가기</a>
  </div>
  <div id="files"></div>
  <p class="hint">아이콘·글꼴·3D 라이브러리 같은 그림과 바이너리 파일은 복사할 수 없어서 목록에 없어요. 전부 필요하면 위의 zip 받기를 눌러 주세요.</p>
</main>
<div class="toast" id="toast" role="status"></div>
<script id="data" type="application/json">__DATA__</script>
<script>
(() => {
  const files = JSON.parse(document.getElementById('data').textContent);
  const dec = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
  const toast = msg => { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2200); };
  const box = document.getElementById('files');
  box.style.display = 'flex'; box.style.flexDirection = 'column'; box.style.gap = '12px';
  files.forEach((f, i) => {
    const el = document.createElement('section');
    el.className = 'file' + (f.main ? ' main' : '');
    el.innerHTML = `<div class="row"><div class="name"><b>${f.title}</b><code>${f.path}</code></div><span class="meta">${f.lines.toLocaleString()}줄 · ${f.kb}KB</span><button class="copy" id="copy-${i}">📋 복사</button></div>${f.desc ? `<p class="desc">${f.desc}</p>` : ''}<button class="show" id="show-${i}" aria-expanded="false">코드 펼쳐 보기 ▾</button>`;
    box.appendChild(el);
    let text = null, area = null;
    const get = () => text ?? (text = dec(f.b64));
    const open = () => {
      if (area) return area;
      area = document.createElement('textarea'); area.id = 'code-' + i; area.readOnly = true; area.spellcheck = false; area.value = get();
      area.setAttribute('aria-label', f.path + ' 코드'); el.appendChild(area);
      const s = el.querySelector('.show'); s.textContent = '코드 접기 ▴'; s.setAttribute('aria-expanded', 'true');
      return area;
    };
    el.querySelector('.show').addEventListener('click', e => {
      if (area) { area.remove(); area = null; e.target.textContent = '코드 펼쳐 보기 ▾'; e.target.setAttribute('aria-expanded', 'false'); }
      else open();
    });
    el.querySelector('.copy').addEventListener('click', e => {
      const b = e.currentTarget;
      const ok = () => { b.textContent = '✓ 복사됨'; b.classList.add('done'); toast(`${f.path} 복사했어요`); setTimeout(() => { b.textContent = '📋 복사'; b.classList.remove('done'); }, 2500); };
      const fallback = () => { const a = open(); a.focus(); a.select(); toast('자동 복사가 막혀 있어요. 선택된 코드를 Ctrl+C로 복사해 주세요'); };
      try { navigator.clipboard.writeText(get()).then(ok, fallback); } catch (err) { fallback(); }
    });
  });
})();
</script>
"""
out = Path(sys.argv[1])
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(PAGE.replace("__DATA__", json.dumps(items, ensure_ascii=False)), encoding="utf-8")
print(out, round(out.stat().st_size / 1024), "KB", len(items), "files")
