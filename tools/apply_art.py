"""Tema JSON'larina illustrasyon tarifi (`art`) ekler ve resimlenebilen sozcuklere
listen/match modlarini acar. Tekrar calistirilabilir. Kullanim: python tools/apply_art.py"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content" / "grade3"
MODE_ORDER = ["listen", "read", "match", "spell", "say"]


def combo(main, badge):
    return {"kind": "combo", "main": main, "badge": badge}


def draw(name, badge=None):
    d = {"kind": "draw", "name": name}
    if badge:
        d["badge"] = badge
    return d


def room(*items):
    return {"kind": "room", "items": list(items)}


def group(e, n=None):
    d = {"kind": "group", "e": e}
    if n:
        d["n"] = n
    return d


def body(part):
    return {"kind": "body", "part": part}


def family(who):
    return {"kind": "family", "who": who}


def color(hex_, badge=None):
    d = {"kind": "color", "hex": hex_}
    if badge:
        d["badge"] = badge
    return d


MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]

ART = {
    # ---- Tema 1 ----
    "classmate": group(["👦", "👧"]),
    "librarian": combo("🧑", "📚"),
    "school_nurse": combo("🧑‍⚕️", "🏫"),
    "headteacher": combo("🧑‍💼", "🏫"),
    "caretaker": combo("🧑‍🔧", "🧹"),
    "art_room": room("🎨", "🖼️"),
    "music_room": room("🎹", "🎵"),
    "meeting_room": room("🪑", "📋", "🪑"),
    "office": room("🖥️", "📁"),
    "sports_field": draw("sportsfield"),
    "corridor": draw("corridor"),
    "gym": room("🏀", "🤸"),
    "birthday": combo("🎂", "🎉"),
    "birthday_party": group(["🎉", "🎂", "🎈"]),
    "summer_holiday": combo("🏖️", "☀️"),
    "surprise": combo("🎁", "🤩"),
    "prepare": combo("🧑‍🍳", "🎂"),
    "decorate": combo("🎀", "✨"),
    "bring": combo("🤲", "📦"),
    "write_a_song": combo("✍️", "🎼"),
    "ask": combo("🙋", "❓"),
    "find": combo("🔍", "🧦"),
    # ---- Tema 2 ----
    "teachers_desk": draw("desk", "🧑‍🏫"),
    "students_desk": draw("desk", "🧒"),
    "teachers_chair": draw("chair", "🧑‍🏫"),
    "coursebook": combo("📘", "🏫"),
    "workbook": combo("📗", "✏️"),
    "exercise_book": combo("📒", "📝"),
    "whiteboard": draw("whiteboard"),
    "blackboard": draw("blackboard"),
    "duster": draw("duster"),
    "flashcard": draw("flashcard"),
    "card": draw("card"),
    "lesson": combo("📖", "⏰"),
    "life_study": combo("🌍", "🏠"),
    "maths": combo("➗", "🔢"),
    "turkish": combo("🇹🇷", "📖"),
    "english": combo("🇬🇧", "📖"),
    "word": draw("word"),
    "letter": draw("letter"),
    "point": draw("point"),
    "winner": combo("🏆", "🥇"),
    "prize": combo("🎁", "🏅"),
    "red": color("#e53935"),
    "white": color("#fafafa"),
    "black": color("#212121"),
    "pink": color("#f48fb1"),
    "grey": color("#9e9e9e"),
    "blue": color("#1e88e5"),
    "purple": color("#8e24aa"),
    "yellow": color("#fdd835"),
    "brown": color("#795548"),
    "green": color("#43a047"),
    "dark": color("#283593", "🌙"),
    "light": color("#e3f2fd", "☀️"),
    "warm": combo("🌡️", "🌤️"),
    "windy": combo("💨", "🌳"),
    # ---- Tema 3 ----
    "foot": body("foot"), "feet": body("feet"), "back": body("back"), "tooth": body("tooth"),
    "teeth": body("teeth"), "chin": body("chin"), "eyelash": body("eyelash"), "eyebrow": body("eyebrow"),
    "neck": body("neck"), "shoulders": body("shoulders"), "knees": body("knees"), "toes": body("toes"),
    "tongue": body("tongue"), "fingers": body("fingers"),
    "blond": draw("hair_blond"),
    "curly": draw("hair_curly"),
    "straight": draw("hair_straight"),
    "little": draw("little"),
    "weak": combo("🥀", "😮‍💨"),
    "beautiful": combo("👸", "✨"),
    "pretty": combo("🎀", "😊"),
    "nice": combo("😊", "🌟"),
    "handsome": combo("🤵", "✨"),
    "sweatshirt": draw("hoodie"),
    "jumper": draw("jumper"),
    "skirt": draw("skirt"),
    "coat": draw("coat"),
    # ---- Tema 4 ----
    "cousin": family("cousin"), "aunt": family("aunt"), "uncle": family("uncle"), "parent": family("parent"),
    "grandparent": family("grandparent"), "grandson": family("grandson"), "granddaughter": family("granddaughter"),
    "dad": family("dad"), "mum": family("mum"),
    "children": group("🧒", 3),
    "men": group("👨", 2),
    "women": group("👩", 2),
    "kid": combo("🧒", "🎈"),
    "wake_up": combo("⏰", "🌅"),
    "wash_face": combo("🧼", "💦"),
    "brush_teeth": combo("🪥", "🦷"),
    "put_on_a_dress": combo("👗", "🧍"),
    "have_breakfast": combo("🥣", "🌅"),
    "go_to_school": combo("🏫", "🎒"),
    "work": combo("💼", "🏢"),
    "study": combo("📝", "📚"),
    "have_lunch": combo("🍱", "☀️"),
    "go_home": combo("🏠", "🚶"),
    "have_dinner": combo("🍽️", "🌙"),
    "do_homework": combo("✏️", "📓"),
    "go_to_bed": combo("🛏️", "🌙"),
    "cook": combo("👩‍🍳", "🍳"),
    "clean": combo("🧹", "✨"),
    "iron": draw("iron"),
    "wash_the_dishes": combo("🧽", "🍽️"),
    "make_the_bed": draw("bed", "✨"),
    "put_the_garbage_out": combo("🗑️", "🚪"),
    # ---- Tema 5 ----
    "hen": combo("🐔", "🥚"),
    "chicken": {"kind": "emoji", "e": "🐔"},
    "village": draw("village"),
    "farm": combo("🏡", "🐄"),
    "field": draw("field"),
    "feed": combo("🥣", "🐔"),
    "bake": combo("🍞", "🔥"),
    "water_v": combo("🌱", "💧"),
    "milk_v": combo("🐄", "🥛"),
    "garden_v": combo("🧑‍🌾", "🌷"),
    "plant_v": combo("🌱", "🤲"),
    "grow": combo("🌻", "📈"),
    "collect_eggs": combo("🧺", "🥚"),
    # ---- Tema 6 ----
    "breakfast": combo("🥣", "🌅"),
    "lunch": combo("🍱", "☀️"),
    "dinner": combo("🍽️", "🌙"),
    "toast": draw("toast"),
    "restaurant": draw("restaurant"),
    "eat": combo("😋", "🍽️"),
    "drink": combo("🥤", "😋"),
    "order": combo("🙋", "📋"),
    "have": combo("🤲", "🍎"),
    "want": combo("🙏", "🍦"),
}
for i, m in enumerate(MONTHS):
    ART[m] = {"kind": "month", "n": i + 1, "badge": None}  # badge sözcüğün kendi emojisi olur

# Artık resimle ayirt edilebilen sozcukler: listen + match acilir.
PICTURE = set(MONTHS) | {
    "students_desk", "teachers_chair", "lesson", "life_study", "word", "letter", "point",
    "foot", "feet", "back", "tooth", "teeth", "chin", "eyelash", "eyebrow", "neck", "shoulders", "knees", "toes", "tongue", "fingers",
    "straight", "jumper", "skirt", "coat",
    "cousin", "aunt", "uncle", "parent", "grandparent", "grandson", "granddaughter", "children", "men", "women",
    "iron", "make_the_bed", "hen", "plant_v", "toast",
}


def dump(data: dict) -> str:
    """Sozcuk/kalip/sosyal ogeleri tek satirda tutan okunabilir JSON."""
    lines = ["{"]
    keys = list(data.keys())
    for ki, k in enumerate(keys):
        v = data[k]
        comma = "," if ki < len(keys) - 1 else ""
        if k in ("words", "chunks", "social") and isinstance(v, list):
            lines.append(f'  "{k}": [')
            last_cat = None
            for i, item in enumerate(v):
                cat = item.get("cat") if k == "words" else None
                if k == "words" and last_cat is not None and cat != last_cat:
                    lines.append("")
                last_cat = cat
                c = "," if i < len(v) - 1 else ""
                lines.append("    " + json.dumps(item, ensure_ascii=False) + c)
            lines.append("  ]" + comma)
        else:
            body_ = json.dumps(v, ensure_ascii=False, indent=2)
            body_ = "\n".join(("  " + ln) if n else ln for n, ln in enumerate(body_.splitlines()))
            lines.append(f'  "{k}": {body_}{comma}')
    lines.append("}")
    return "\n".join(lines) + "\n"


def main() -> None:
    used = set()
    for f in sorted(CONTENT.glob("theme*.json")):
        data = json.loads(f.read_text(encoding="utf-8"))
        changed = 0
        for w in data["words"]:
            art = ART.get(w["id"])
            if art:
                art = dict(art)
                if art.get("kind") == "month":
                    art["badge"] = w.get("emoji", "📅")
                if w.get("art") != art:
                    w["art"] = art
                    changed += 1
                used.add(w["id"])
            if w["id"] in PICTURE:
                modes = set(w["modes"]) | {"listen", "match"}
                new = [m for m in MODE_ORDER if m in modes]
                if new != w["modes"]:
                    w["modes"] = new
                    changed += 1
        f.write_text(dump(data), encoding="utf-8")
        print(f"{f.name}: {changed} degisiklik")
    missing = set(ART) - used
    if missing:
        print("UYARI, JSON'da olmayan id:", sorted(missing))


if __name__ == "__main__":
    main()
