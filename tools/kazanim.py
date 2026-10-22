"""docs/KAZANIM_ESLEME.md icindeki tema tablosunu JSON'lardan yeniden uretir.
Kullanim: python tools/kazanim.py"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content" / "grade3"
DOC = ROOT / "docs" / "KAZANIM_ESLEME.md"
SKILLS = ["L", "R", "S", "W", "G"]


def main() -> None:
    rows = ["| Tema | Kalıp | " + " | ".join(SKILLS) + " |", "|---|---|" + "|".join("---" for _ in SKILLS) + "|"]
    for f in sorted(CONTENT.glob("theme*.json")):
        d = json.loads(f.read_text(encoding="utf-8"))
        counts = {s: sum(1 for c in d["chunks"] if s in c.get("skills", [])) for s in SKILLS}
        rows.append(f"| {d['id']} {d['title_en']} | {len(d['chunks'])} | " + " | ".join(str(counts[s]) for s in SKILLS) + " |")
    table = "\n".join(rows)
    text = DOC.read_text(encoding="utf-8")
    new = re.sub(r"<!-- kazanim:start -->.*?<!-- kazanim:end -->", f"<!-- kazanim:start -->\n{table}\n<!-- kazanim:end -->", text, flags=re.S)
    DOC.write_text(new, encoding="utf-8")
    print(table)


if __name__ == "__main__":
    main()
