"""Extract individual glossy buttons from a sheet image.

Input:
- public/logos/glossy-web-buttons-set-different-colors.png

Output:
- public/glossy-button-set/btn-01.png ..

Method:
- Downscale the image for faster connected-component detection.
- Build a foreground mask by detecting non-white pixels.
- Find connected components (buttons) on the mask.
- Map component bounding boxes back to full-res, pad, and export.

This matches previous extraction utilities in this repo.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import List, Tuple

from PIL import Image


@dataclass
class Box:
    x0: int
    y0: int
    x1: int
    y1: int

    def pad(self, p: int, w: int, h: int) -> "Box":
        return Box(max(0, self.x0 - p), max(0, self.y0 - p), min(w, self.x1 + p), min(h, self.y1 + p))


def is_foreground(rgb: Tuple[int, int, int]) -> bool:
    r, g, b = rgb
    # treat near-white as background
    return not (r >= 245 and g >= 245 and b >= 245)


def main() -> int:
    src_path = "public/logos/glossy-web-buttons-set-different-colors.png"
    if not os.path.exists(src_path):
        print(f"Missing: {src_path}")
        return 1

    img = Image.open(src_path).convert("RGBA")
    w, h = img.size
    print("source", src_path, "size", (w, h))

    # downscale for component detection
    scale = 4
    small = img.resize((w // scale, h // scale), Image.Resampling.BILINEAR)
    bg = Image.new("RGBA", small.size, (255, 255, 255, 255))
    bg.alpha_composite(small)
    rgb = bg.convert("RGB")

    sw, sh = rgb.size
    px = rgb.load()

    mask = [[False] * sw for _ in range(sh)]
    for y in range(sh):
        for x in range(sw):
            mask[y][x] = is_foreground(px[x, y])

    visited = [[False] * sw for _ in range(sh)]

    def bfs(x0: int, y0: int) -> Box:
        q = [(x0, y0)]
        visited[y0][x0] = True
        minx = maxx = x0
        miny = maxy = y0
        i = 0
        while i < len(q):
            x, y = q[i]
            i += 1
            if x < minx:
                minx = x
            if x > maxx:
                maxx = x
            if y < miny:
                miny = y
            if y > maxy:
                maxy = y
            # 4-neighborhood
            if x > 0 and mask[y][x - 1] and not visited[y][x - 1]:
                visited[y][x - 1] = True
                q.append((x - 1, y))
            if x + 1 < sw and mask[y][x + 1] and not visited[y][x + 1]:
                visited[y][x + 1] = True
                q.append((x + 1, y))
            if y > 0 and mask[y - 1][x] and not visited[y - 1][x]:
                visited[y - 1][x] = True
                q.append((x, y - 1))
            if y + 1 < sh and mask[y + 1][x] and not visited[y + 1][x]:
                visited[y + 1][x] = True
                q.append((x, y + 1))

        return Box(minx, miny, maxx + 1, maxy + 1)

    boxes: List[Box] = []
    min_area = 250  # in small pixels

    for y in range(sh):
        for x in range(sw):
            if mask[y][x] and not visited[y][x]:
                b = bfs(x, y)
                area = (b.x1 - b.x0) * (b.y1 - b.y0)
                if area >= min_area:
                    boxes.append(b)

    # sort top-to-bottom, then left-to-right
    boxes.sort(key=lambda b: (b.y0, b.x0))
    print("components", len(boxes))

    out_dir = "public/glossy-button-set"
    os.makedirs(out_dir, exist_ok=True)

    # export
    exported = 0
    for i, b in enumerate(boxes, start=1):
        full = Box(b.x0 * scale, b.y0 * scale, b.x1 * scale, b.y1 * scale).pad(8, w, h)
        crop = img.crop((full.x0, full.y0, full.x1, full.y1))
        out_path = os.path.join(out_dir, f"btn-{i:02d}.png")
        crop.save(out_path)
        exported += 1

    print("exported", exported, "to", out_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
