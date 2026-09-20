"""Build a balanced ImageFolder subset for weed CNN training."""
from pathlib import Path
import os
import random
import shutil

SRC = Path(__file__).parent / "data" / "weed_species" / "by_class"
DST = Path(__file__).parent / "data" / "weed_species" / "train_balanced"
MAX_PER_CLASS = 300
SEED = 42


def main():
    rng = random.Random(SEED)
    if DST.exists():
        shutil.rmtree(DST)
    DST.mkdir(parents=True)
    for cls in sorted(p.name for p in SRC.iterdir() if p.is_dir()):
        files = [p for p in (SRC / cls).iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png"}]
        rng.shuffle(files)
        chosen = files[:MAX_PER_CLASS]
        out = DST / cls
        out.mkdir()
        for src in chosen:
            os.link(src, out / src.name)
        print(f"{cls}: {len(chosen)}")


if __name__ == "__main__":
    main()
