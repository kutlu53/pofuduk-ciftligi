"""Tema JSON dosyalarini dogrular. Kullanim: python tools/validate.py"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content" / "grade3"
MODES = {"listen", "read", "match", "spell", "say"}
SKILLS = {"L", "R", "S", "W", "G", "P", "V"}
WORD_KEYS = {"id", "en", "tr", "cat", "modes", "asset"}
ART_KINDS = {"emoji", "combo", "group", "body", "family", "color", "month", "room", "draw"}
TOP_KEYS = {"id", "grade", "title_en", "title_tr", "program_url", "subthemes", "words",
            "chunks", "social", "phonics", "performance", "outcome_tags"}


def check(data: dict) -> list[str]:
    errors: list[str] = []
    missing = TOP_KEYS - data.keys()
    if missing:
        errors.append(f"eksik ust alanlar: {sorted(missing)}")
    ids: set[str] = set()
    for i, w in enumerate(data.get("words", [])):
        where = f"words[{i}] ({w.get('id', '?')})"
        miss = WORD_KEYS - w.keys()
        if miss:
            errors.append(f"{where}: eksik alan {sorted(miss)}")
            continue
        if w["id"] in ids:
            errors.append(f"{where}: tekrar eden id")
        ids.add(w["id"])
        bad = set(w["modes"]) - MODES
        if bad:
            errors.append(f"{where}: bilinmeyen mod {sorted(bad)}")
        if not w["modes"]:
            errors.append(f"{where}: modes bos")
        if set(w["asset"].keys()) != {"img", "audio"}:
            errors.append(f"{where}: asset alanlari img/audio olmali")
        for key in ("img", "audio"):
            val = w["asset"][key]
            if val is not None and not (ROOT / val).exists():
                errors.append(f"{where}: {key} dosyasi yok: {val}")
        if ("listen" in w["modes"] or "match" in w["modes"]) and not (w.get("emoji") or w.get("art") or w["asset"]["img"]):
            errors.append(f"{where}: listen/match modu icin emoji, art veya img gerekli")
        art = w.get("art")
        if art is not None and (not isinstance(art, dict) or art.get("kind") not in ART_KINDS):
            errors.append(f"{where}: gecersiz art: {art}")
    for i, c in enumerate(data.get("chunks", [])):
        bad = set(c.get("skills", [])) - SKILLS
        if bad:
            errors.append(f"chunks[{i}]: bilinmeyen beceri {sorted(bad)}")
        if not {"id", "en", "tr"} <= c.keys():
            errors.append(f"chunks[{i}]: id/en/tr gerekli")
    for i, s in enumerate(data.get("social", [])):
        if not {"en", "tr"} <= s.keys():
            errors.append(f"social[{i}]: en/tr gerekli")
    perf = data.get("performance", {})
    if not {"title_tr", "steps_tr"} <= perf.keys():
        errors.append("performance: title_tr/steps_tr gerekli")
    return errors


def main() -> int:
    files = sorted(CONTENT.glob("theme*.json"))
    if not files:
        print("Tema dosyasi bulunamadi:", CONTENT)
        return 1
    failed = False
    for f in files:
        data = json.loads(f.read_text(encoding="utf-8"))
        errs = check(data)
        summary = (f"{len(data.get('words', []))} sozcuk, "
                   f"{len(data.get('chunks', []))} kalip, "
                   f"{len(data.get('social', []))} sosyal")
        if errs:
            failed = True
            print(f"HATA {f.name}: {summary}")
            for e in errs:
                print("  -", e)
        else:
            print(f"OK   {f.name}: {summary}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
