"""Subset the bundled TTF fonts to ASCII + KS X 1001 Hangul (2,350 common syllables) and write WOFF2.

Rare syllables outside the set fall back to the system Korean font, so names still display.
Run:  python tools/make_fonts.py
"""
from pathlib import Path
from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "fonts-src"
FONTS = ROOT / "www" / "fonts"

chars = set(chr(c) for c in range(0x20, 0x7F))
chars |= set(chr(c) for c in range(0x3131, 0x318F))          # Hangul compatibility jamo
for c in range(0xAC00, 0xD7A4):                                 # syllables that exist in EUC-KR
    try:
        chr(c).encode("euc-kr")
        chars.add(chr(c))
    except UnicodeEncodeError:
        pass
# every character the game itself prints (covers syllables outside EUC-KR, if any)
chars |= set((ROOT / "www" / "index.html").read_text(encoding="utf-8")) if (ROOT / "www" / "index.html").exists() else set()
chars |= set("·…~!?♪★☆♥")
text = "".join(sorted(chars))

for name in ("Jua-Regular", "GowunDodum-Regular"):
    src = SRC / f"{name}.ttf"
    out = FONTS / f"{name}.woff2"
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    font = subset.load_font(str(src), opts)
    sub = subset.Subsetter(opts)
    sub.populate(text=text)
    sub.subset(font)
    subset.save_font(font, str(out), opts)
    print(f"{out.name}: {out.stat().st_size/1024:.0f} KB (from {src.stat().st_size/1024:.0f} KB)")
