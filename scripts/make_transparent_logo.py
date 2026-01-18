from __future__ import annotations

from collections import deque
from pathlib import Path
from typing import Iterable, Tuple

from PIL import Image


def _avg_color(pixels: Iterable[Tuple[int, int, int]]) -> Tuple[int, int, int]:
    items = list(pixels)
    if not items:
        return (255, 255, 255)
    r = sum(p[0] for p in items) // len(items)
    g = sum(p[1] for p in items) // len(items)
    b = sum(p[2] for p in items) // len(items)
    return (r, g, b)


def _color_close(a: Tuple[int, int, int], b: Tuple[int, int, int], tol: int) -> bool:
    return abs(a[0] - b[0]) <= tol and abs(a[1] - b[1]) <= tol and abs(a[2] - b[2]) <= tol


def remove_background_floodfill(
    input_path: Path,
    output_path: Path,
    *,
    tolerance: int = 18,
) -> None:
    """Remove a solid-ish background by flood-filling from image edges.

    - Preserves interior whites (e.g. sun/shine) if they are not connected to the outer background.
    - Works best when background is mostly uniform (e.g. white).
    """

    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    px = img.load()

    # Estimate background color from corners (robust against minor compression artifacts)
    corner_samples = []
    for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        r, g, b, a = px[x, y]
        if a == 0:
            continue
        corner_samples.append((r, g, b))

    bg = _avg_color(corner_samples) if corner_samples else (255, 255, 255)

    visited = [[False] * w for _ in range(h)]
    q: deque[Tuple[int, int]] = deque()

    def push(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h:
            return
        if visited[y][x]:
            return
        r, g, b, a = px[x, y]
        if a == 0:
            visited[y][x] = True
            q.append((x, y))
            return
        if _color_close((r, g, b), bg, tolerance):
            visited[y][x] = True
            q.append((x, y))

    # Seed with all edge pixels
    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)

    while q:
        x, y = q.popleft()
        # Make background pixels transparent
        r, g, b, a = px[x, y]
        if a != 0 and _color_close((r, g, b), bg, tolerance):
            px[x, y] = (r, g, b, 0)

        # 4-neighborhood flood fill
        push(x + 1, y)
        push(x - 1, y)
        push(x, y + 1)
        push(x, y - 1)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path, format="PNG")


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]

    inp = repo_root / "public" / "ChatGPT Image 14 Oca 2026 17_26_03.png"
    out = repo_root / "public" / "logos" / "endonezya-kasifi-logo.png"

    if not inp.exists():
        raise SystemExit(f"Girdi bulunamadı: {inp}")

    remove_background_floodfill(inp, out, tolerance=18)
    print(f"OK: {out}")


if __name__ == "__main__":
    main()
