"""개인정보처리방침의 문의 이메일을 실제 주소로 바꾼다 (한국어·영어 두 곳).
Run:  python tools/set_contact_email.py help@example.org
"""
import re, sys
from pathlib import Path

if len(sys.argv) != 2 or not re.fullmatch(r"[^@\s<>\"']+@[^@\s<>\"']+\.[A-Za-z]{2,}", sys.argv[1]):
    sys.exit("사용법: python tools/set_contact_email.py 실제이메일주소")
path = Path(__file__).resolve().parent.parent / "www" / "privacy.html"
text = path.read_text(encoding="utf-8")
new, n = re.subn(r"(개인정보 관련 문의: |Privacy inquiries: )[^<]+", lambda m: m.group(1) + sys.argv[1], text)
if n != 2:
    sys.exit(f"문의 이메일 자리 2곳을 찾지 못했어요 ({n}곳)")
path.write_text(new, encoding="utf-8", newline="\n")
print("설정했어요:", sys.argv[1])
