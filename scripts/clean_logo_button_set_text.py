"""Remove built-in label text from the extracted logo button skins.

This script reads `public/logo-button-set/btn-*.png` and writes cleaned versions
next to them as `btn-XX-clean.png`.

Approach:
- Create a mask in the center band where label text appears.
- Mark very bright or very dark pixels (likely text) inside that band.
- Diffuse surrounding colors into the masked area by repeatedly compositing a
  blurred image over the masked pixels.

This keeps colors consistent with the existing skin (no new colors), and avoids
CSS overlays that can look mismatched.
"""

from __future__ import annotations

import glob
import os
from PIL import Image, ImageFilter


def clamp01(x: float) -> float:
    return 0.0 if x < 0.0 else 1.0 if x > 1.0 else x


def build_text_mask(img_rgba: Image.Image) -> Image.Image:
    """Return an L-mode mask (255=inpaint) for likely text pixels."""

    w, h = img_rgba.size

    # Region of interest: center area where the label text typically sits.
    # Tuned to these extracted assets (~520x140).
    x0 = int(w * 0.20)
    x1 = int(w * 0.80)
    y0 = int(h * 0.28)
    y1 = int(h * 0.72)

    rgb = img_rgba.convert("RGB")
    roi = rgb.crop((x0, y0, x1, y1))
    roi_px = roi.load()

    mask = Image.new("L", (w, h), 0)
    mask_px = mask.load()

    for y in range(y0, y1):
        for x in range(x0, x1):
            r, g, b = roi_px[x - x0, y - y0]
            # Luma (perceived brightness)
            luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
            # Likely text: very bright or very dark.
            is_bright = luma >= 245
            is_dark = luma <= 18
            if is_bright or is_dark:
                mask_px[x, y] = 255

    # Soften edges to avoid harsh borders in the filled area.
    mask = mask.filter(ImageFilter.GaussianBlur(radius=1.2))

    return mask


def clean_image(img_rgba: Image.Image, mask: Image.Image) -> Image.Image:
    # Start from original, then diffuse neighboring colors into masked pixels.
    out = img_rgba.copy()

    # Multiple passes: larger blur first, smaller blur last.
    for radius in (6, 5, 4, 3, 3, 2, 2, 2):
        blurred = out.filter(ImageFilter.GaussianBlur(radius=radius))
        out = Image.composite(blurred, out, mask)

    return out


def main() -> int:
    src_paths = sorted(glob.glob("public/logo-button-set/btn-*.png"))
    if not src_paths:
        print("No inputs found at public/logo-button-set/btn-*.png")
        return 1

    wrote = 0
    for src in src_paths:
        base = os.path.basename(src)
        if base.endswith("-clean.png"):
            continue

        img = Image.open(src).convert("RGBA")
        mask = build_text_mask(img)
        cleaned = clean_image(img, mask)

        dst = src.replace(".png", "-clean.png")
        cleaned.save(dst)
        wrote += 1

    print(f"Cleaned {wrote} button skins")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
