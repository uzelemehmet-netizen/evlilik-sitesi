from __future__ import annotations

import os
from collections import deque
from dataclasses import dataclass
from typing import List, Tuple

from PIL import Image


@dataclass(frozen=True)
class Component:
    x0: int
    y0: int
    x1: int
    y1: int
    count: int

    @property
    def w(self) -> int:
        return self.x1 - self.x0

    @property
    def h(self) -> int:
        return self.y1 - self.y0

    @property
    def area(self) -> int:
        return self.w * self.h


def is_ink(px: Tuple[int, int, int, int], white_thr: int = 245, alpha_thr: int = 10) -> bool:
    r, g, b, a = px
    if a <= alpha_thr:
        return False
    # treat near-white as background
    if r >= white_thr and g >= white_thr and b >= white_thr:
        return False
    return True


def mean_color(crop: Image.Image) -> Tuple[int, int, int]:
    rgb = crop.convert('RGB')
    pix = rgb.load()
    w, h = rgb.size
    tr = tg = tb = 0
    n = 0
    for y in range(h):
        for x in range(w):
            r, g, b = pix[x, y]
            if r >= 245 and g >= 245 and b >= 245:
                continue
            tr += r
            tg += g
            tb += b
            n += 1
    if n <= 0:
        return (255, 255, 255)
    return (tr // n, tg // n, tb // n)


def find_components(img: Image.Image, step: int = 3, min_pixels: int = 600) -> List[Component]:
    w, h = img.size
    ds_w = max(1, w // step)
    ds_h = max(1, h // step)
    small = img.resize((ds_w, ds_h), resample=Image.BILINEAR)
    pix = small.load()

    visited = [[False] * ds_w for _ in range(ds_h)]
    comps: List[Component] = []

    def bfs(si: int, sj: int) -> Component:
        q = deque([(si, sj)])
        visited[si][sj] = True
        min_i = max_i = si
        min_j = max_j = sj
        count = 0
        while q:
            i, j = q.popleft()
            count += 1
            if i < min_i:
                min_i = i
            if i > max_i:
                max_i = i
            if j < min_j:
                min_j = j
            if j > max_j:
                max_j = j
            for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ni, nj = i + di, j + dj
                if ni < 0 or nj < 0 or ni >= ds_h or nj >= ds_w:
                    continue
                if visited[ni][nj]:
                    continue
                if not is_ink(pix[nj, ni]):
                    continue
                visited[ni][nj] = True
                q.append((ni, nj))

        # scale bbox back
        pad = max(2, step * 2)
        x0 = max(0, min_j * step - pad)
        y0 = max(0, min_i * step - pad)
        x1 = min(w, (max_j + 1) * step + pad)
        y1 = min(h, (max_i + 1) * step + pad)
        return Component(x0=x0, y0=y0, x1=x1, y1=y1, count=count)

    for i in range(ds_h):
        for j in range(ds_w):
            if visited[i][j]:
                continue
            if not is_ink(pix[j, i]):
                continue
            c = bfs(i, j)
            if c.count >= min_pixels:
                comps.append(c)

    comps.sort(key=lambda c: (c.area, c.count), reverse=True)
    return comps


def main() -> None:
    src = os.path.join('public', 'logos', 'set-colorful-empty-explore-web-button-icon-design.png')
    out_dir = os.path.join('public', 'logo-button-set')
    os.makedirs(out_dir, exist_ok=True)

    img = Image.open(src).convert('RGBA')
    comps = find_components(img, step=3, min_pixels=600)

    print('source:', src)
    print('image:', img.size)
    print('components:', len(comps))

    # export top N big components and a sheet for manual selection
    exported = 0
    for i, c in enumerate(comps[:24], 1):
        if c.w < 160 or c.h < 48:
            continue
        crop = img.crop((c.x0, c.y0, c.x1, c.y1))
        mc = mean_color(crop)
        out = os.path.join(out_dir, f'btn-{i:02d}.png')
        crop.save(out)
        exported += 1
        print(f'#{i:02d} -> {out} bbox=({c.x0},{c.y0},{c.x1},{c.y1}) size={c.w}x{c.h} mean={mc}')

    print('done. exported:', exported)


if __name__ == '__main__':
    main()
