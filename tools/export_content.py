"""영어 내용을 검수용 CSV로 내보낸다. Node로 게임 파일의 ENG 데이터를 읽는다.
Run:  python tools/export_content.py
"""
import csv, json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
html = (ROOT / "www" / "index.html").read_text(encoding="utf-8")
start = html.index("const ENG = [")
end = html.index("/* ---------- 단계별 해금", start)
out = subprocess.run(["node", "-"], input=html[start:end] + "\nprocess.stdout.write(JSON.stringify(ENG));",
                     capture_output=True, check=True, encoding="utf-8").stdout
rows = []
for st in json.loads(out):
    for u in st["units"]:
        base = [st["name"], u["t"]]
        for w in u.get("w", []):
            rows.append(base + ["단어", w[0], w[1], "", ""])
        for x in u.get("s", []):
            rows.append(base + ["문장", x[0], x[1], "", ""])
        for x in u.get("b", []):
            rows.append(base + ["빈칸", x[0], x[3], x[1], " / ".join(x[2])])
        for x in u.get("talk", []):
            rows.append(base + ["대화", x[0], x[3], x[1], " / ".join(x[2])])
        for x in u.get("r", []):
            rows.append(base + ["읽기", x["p"] + " Q: " + x["q"], x["k"], x["a"], " / ".join(x["o"])])
        for x in u.get("d", []):
            rows.append(base + ["회화", x[0], x[1], x[2] + " (" + x[3] + ")", " / ".join(x[4])])
# 게임과 이야기에 따로 들어 있는 문장도 함께 내보낸다
def chunk(start_mark, end_mark, expr, stubs=""):
    i = html.index(start_mark)
    j = html.index(end_mark, i)
    code = stubs + html[i:j] + f"\nprocess.stdout.write(JSON.stringify({expr}));"
    return json.loads(subprocess.run(["node", "-"], input=code, capture_output=True, check=True, encoding="utf-8").stdout)
for level, items in chunk("const EG_TRAIN = {", "function egTrain", "EG_TRAIN").items():
    for en, ko in items:
        rows.append(["게임", "문장 기차 " + level, "문장", en, ko, "", ""])
for st in chunk("const STORIES = {", "function egStory", "Object.values(STORIES)"):
    for sc in st["scenes"].values():
        rows.append(["게임", "이야기 극장 " + st["t"], "이야기", sc["en"], sc["k"], "", ""])
        for c in sc["c"]:
            rows.append(["게임", "이야기 극장 " + st["t"], "선택지", c[0], c[1], "", ""])
stubs = "const egAlphabet=0,egCatch=0,egCafe=0,egJungle=0,egTrain=0,egSpeak=0;"
for i, ch in enumerate(chunk("const SAGA_WHO = {", "const SAGA_TREE", "SAGA", stubs), 1):
    for line in ch["before"] + ch["after"]:
        rows.append(["이야기 모험", f"{i}장 {ch['t']}", "대사", line[1], line[2], "", ""])
    a = ch["ask"]
    rows.append(["이야기 모험", f"{i}장 {ch['t']}", "대답", a["q"], a["k"], a["a"], " / ".join(a["o"])])
path = ROOT / "docs" / "content_review.csv"
with path.open("w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f)
    w.writerow(["단계", "레슨", "유형", "영어", "뜻", "정답", "오답", "검수 결과", "수정 제안"])
    w.writerows(rows)
print(path, len(rows))
