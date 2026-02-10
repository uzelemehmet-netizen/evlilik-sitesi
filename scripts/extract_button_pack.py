from __future__ import annotations

import colorsys
import os
from collections import deque
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from PIL import Image


@dataclass(frozen=True)
class Component:
    count: int
    x0: int
    y0: int
    x1: int
    y1: int

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
    if r > white_thr and g > white_thr and b > white_thr:
        return False
    return True


def find_components(img: Image.Image, step: int = 4, min_pixels: int = 900) -> List[Component]:
    # Work on a downscaled view for speed.
    w, h = img.size
    ds_w = max(1, w // step)
    ds_h = max(1, h // step)
    small = img.resize((ds_w, ds_h), resample=Image.BILINEAR)
    pix = small.load()

    visited = [[False] * ds_w for _ in range(ds_h)]
    comps: List[Component] = []

    def bfs(si: int, sj: int) -> Optional[Component]:
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

        if count < min_pixels:
            return None

        # scale bbox back to original coords
        x0 = min_j * step
        y0 = min_i * step
        x1 = min(w, (max_j + 1) * step)
        y1 = min(h, (max_i + 1) * step)
        # add a small pad
        pad = max(2, step * 2)
        x0 = max(0, x0 - pad)
        y0 = max(0, y0 - pad)
        x1 = min(w, x1 + pad)
        y1 = min(h, y1 + pad)
        return Component(count=count, x0=x0, y0=y0, x1=x1, y1=y1)

    for i in range(ds_h):
        for j in range(ds_w):
            if visited[i][j]:
                continue
            if not is_ink(pix[j, i]):
                continue
            comp = bfs(i, j)
            if comp:
                comps.append(comp)

    comps.sort(key=lambda c: (c.area, c.count), reverse=True)
    return comps


def mean_color(crop: Image.Image) -> Tuple[int, int, int]:
    # Compute average of non-white pixels to represent button color.
    rgb = crop.convert('RGB')
    pix = rgb.load()
    w, h = rgb.size
    total_r = total_g = total_b = 0
    n = 0
    for y in range(h):
        for x in range(w):
            r, g, b = pix[x, y]
            if r > 245 and g > 245 and b > 245:
                continue
            total_r += r
            total_g += g
            total_b += b
            n += 1
    if n == 0:
        return (255, 255, 255)
    return (total_r // n, total_g // n, total_b // n)


def rgb_dist(a: Tuple[int, int, int], b: Tuple[int, int, int]) -> float:
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


def sat_of(rgb: Tuple[int, int, int]) -> float:
    r, g, b = [v / 255.0 for v in rgb]
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    return float(s)


def main() -> None:
    src = os.path.join('public', 'gradient-call-action-button-pack.png')
    out_dir = os.path.join('public', 'button-pack')
    os.makedirs(out_dir, exist_ok=True)

    img = Image.open(src).convert('RGBA')
    comps = find_components(img, step=4, min_pixels=900)
    print('source:', src)
    print('image:', img.size)
    print('components(found):', len(comps))

    # Target palette (from earlier quantization)
    targets: Dict[str, Tuple[int, int, int]] = {
        'indigo': (99, 102, 239),
        'sky': (31, 163, 230),
        'purple': (156, 102, 232),
        'teal': (81, 220, 176),
        'pink': (228, 100, 160),
        'orange': (250, 141, 100),
        'coral': (242, 96, 97),
    }

    wanted = ['indigo', 'sky', 'purple', 'teal', 'pink', 'orange', 'coral']

    candidates: List[Tuple[Component, Tuple[int, int, int], float]] = []
    for comp in comps[:80]:
        if comp.w < 220 or comp.h < 60:
            continue
        crop = img.crop((comp.x0, comp.y0, comp.x1, comp.y1))
        mc = mean_color(crop)
        s = sat_of(mc)
        if s < 0.20:
            continue
        candidates.append((comp, mc, s))

    print('candidates:', len(candidates))
    for idx, (comp, mc, s) in enumerate(candidates[:20], 1):
        r, g, b = mc
        hh, ss, vv = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
        print(
            f'  #{idx:02d} bbox=({comp.x0},{comp.y0},{comp.x1},{comp.y1}) '
            f'size={comp.w}x{comp.h} mean={mc} sat={s:.2f} hue={hh * 360:.0f}'
        )

    # Greedy one-to-one matching: each exported file uses a distinct component.
    used_ids = set()
    exported = 0
    max_dist = 140.0

    for name in wanted:
        target = targets[name]
        best_choice: Optional[Tuple[float, Component, Tuple[int, int, int]]] = None
        for comp, mc, s in candidates:
            comp_id = (comp.x0, comp.y0, comp.x1, comp.y1)
            if comp_id in used_ids:
                continue
            d = rgb_dist(mc, target)
            # prefer close color, then larger area
            score = d - min(30.0, (comp.area / 20000.0))
            if best_choice is None or score < best_choice[0]:
                best_choice = (score, comp, mc)

        if not best_choice:
            print('WARN: missing', name)
            continue

        _, comp, mc = best_choice
        d = rgb_dist(mc, target)
        if d > max_dist:
            print('WARN: no good match for', name, 'closest_dist=', round(d, 1), 'mean=', mc)
            continue

        used_ids.add((comp.x0, comp.y0, comp.x1, comp.y1))
        crop = img.crop((comp.x0, comp.y0, comp.x1, comp.y1))
        out_path = os.path.join(out_dir, f'btn-{name}.png')
        crop.save(out_path)
        exported += 1
        print(f'exported {name:7s} -> {out_path}  mean={mc}  dist={d:.1f}')

    # Always export all big components as a fallback set for manual selection
    all_dir = os.path.join(out_dir, 'all')
    os.makedirs(all_dir, exist_ok=True)
    for i, (comp, mc, s) in enumerate(candidates, 1):
        crop = img.crop((comp.x0, comp.y0, comp.x1, comp.y1))
        crop.save(os.path.join(all_dir, f'btn-{i:02d}.png'))

    print('done. exported:', exported, 'and', len(candidates), 'fallback crops in', all_dir)


if __name__ == '__main__':
    main()
