"""영어 내용을 검수용 CSV로 내보낸다. Node로 게임 파일의 ENG 데이터를 읽는다.
Run:  python tools/export_content.py
"""
import csv, json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
html = (ROOT / "www" / "index.html").read_text(encoding="utf-8")
start = html.index("const ENG = [")
end = html.index("/* ---------- 단계별 해금", start)
out = subprocess.run(["node", "-e", html[start:end] + "\nprocess.stdout.write(JSON.stringify(ENG));"],
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
path = ROOT / "docs" / "content_review.csv"
with path.open("w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f)
    w.writerow(["단계", "레슨", "유형", "영어", "뜻", "정답", "오답", "검수 결과", "수정 제안"])
    w.writerows(rows)
print(path, len(rows))
