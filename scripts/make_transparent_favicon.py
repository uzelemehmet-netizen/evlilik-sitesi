from __future__ import annotations

from collections import deque
from pathlib import Path

try:
    from PIL import Image
except Exception as exc:  # pragma: no cover
    raise SystemExit(
        "Pillow (PIL) yüklü değil. Kurulum: pip install pillow\n"
        f"Hata: {exc}"
    )


def is_near_white(r: int, g: int, b: int, a: int, threshold: int = 18) -> bool:
    if a == 0:
        return True
    return (255 - r) <= threshold and (255 - g) <= threshold and (255 - b) <= threshold


def make_edge_connected_white_transparent(img: Image.Image, threshold: int = 18) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size

    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        if visited[y][x]:
            continue
        visited[y][x] = True

        r, g, b, a = px[x, y]
        if not is_near_white(r, g, b, a, threshold=threshold):
            continue

        px[x, y] = (r, g, b, 0)
        q.append((x + 1, y))
        q.append((x - 1, y))
        q.append((x, y + 1))
        q.append((x, y - 1))

    return rgba


def main() -> None:
    project_root = Path(__file__).resolve().parents[1]
    input_path = project_root / "public" / "ChatGPT Image 17 Kas 2025 17_20_43123.PNG"
    output_path = project_root / "public" / "favicon.png"

    if not input_path.exists():
        raise SystemExit(f"Girdi dosyası bulunamadı: {input_path}")

    img = Image.open(input_path)
    out = make_edge_connected_white_transparent(img, threshold=18)
    out.save(output_path, format="PNG", optimize=True)

    print(f"OK: {output_path} yazıldı. Boyut: {out.size}")


if __name__ == "__main__":
    main()
