from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


@dataclass(frozen=True)
class BBox:
    left: int
    top: int
    right: int
    bottom: int

    def pad(self, px: int, *, max_w: int, max_h: int) -> "BBox":
        return BBox(
            left=max(0, self.left - px),
            top=max(0, self.top - px),
            right=min(max_w, self.right + px),
            bottom=min(max_h, self.bottom + px),
        )


def find_nonwhite_bbox(img: Image.Image, *, threshold: int = 245) -> BBox | None:
    """Find bounding box of pixels that are not near-white.

    Works best for logos on white backgrounds.
    """
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size

    left, top, right, bottom = w, h, -1, -1

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if r <= threshold or g <= threshold or b <= threshold:
                if x < left:
                    left = x
                if y < top:
                    top = y
                if x > right:
                    right = x
                if y > bottom:
                    bottom = y

    if right < left or bottom < top:
        return None

    return BBox(left=left, top=top, right=right + 1, bottom=bottom + 1)


def remove_near_white_to_transparent(img: Image.Image, *, threshold: int = 250) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if r >= threshold and g >= threshold and b >= threshold:
                px[x, y] = (r, g, b, 0)
    return rgba


def make_square_canvas(img: Image.Image, *, bg=(0, 0, 0, 0), padding: int = 0) -> Image.Image:
    w, h = img.size
    size = max(w, h) + 2 * padding
    out = Image.new("RGBA", (size, size), bg)
    out.paste(img, ((size - w) // 2, (size - h) // 2), img)
    return out


def save_sizes(img: Image.Image, base_path: Path, sizes: list[int]) -> None:
    for s in sizes:
        out = img.resize((s, s), Image.Resampling.LANCZOS)
        out.save(base_path.with_name(f"{base_path.stem}-{s}x{s}{base_path.suffix}"))


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "public" / "ChatGPT Image 13 Oca 2026 20_25_55.png"
    out_dir = root / "public" / "logos"
    out_dir.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        raise SystemExit(f"Input not found: {input_path}")

    original = Image.open(input_path).convert("RGBA")

    # 1) Softer / more premium: reduce saturation + slightly deepen contrast.
    soft = original.copy()
    soft = ImageEnhance.Color(soft).enhance(0.82)
    soft = ImageEnhance.Contrast(soft).enhance(1.06)
    soft = ImageEnhance.Brightness(soft).enhance(0.98)
    soft = ImageEnhance.Sharpness(soft).enhance(1.08)
    soft.save(out_dir / "moonstar_soft.png")

    # 2) "Flatter" look: quantize colors + gentle smoothing.
    flat = original.copy().convert("RGB")
    flat = flat.quantize(colors=48, method=Image.Quantize.MEDIANCUT).convert("RGBA")
    flat = flat.filter(ImageFilter.SMOOTH_MORE)
    flat.save(out_dir / "moonstar_flat.png")

    # 3) Transparent background version (remove near-white).
    transparent = remove_near_white_to_transparent(original.copy(), threshold=252)
    transparent.save(out_dir / "moonstar_transparent.png")

    # 4) Icon crop (top portion) for favicon/profile.
    w, h = original.size
    top_crop = original.crop((0, 0, w, int(h * 0.62)))
    bbox = find_nonwhite_bbox(top_crop, threshold=245)
    if bbox is None:
        icon = top_crop
    else:
        icon = top_crop.crop((bbox.left, bbox.top, bbox.right, bbox.bottom))
    icon = remove_near_white_to_transparent(icon, threshold=252)
    icon = make_square_canvas(icon, padding=20)
    icon.save(out_dir / "moonstar_icon.png")
    save_sizes(icon, out_dir / "moonstar_icon.png", sizes=[16, 32, 48, 64, 128, 256])

    # 5) Monochrome mark (dark + light) from the icon.
    # Create mask from alpha.
    icon_rgba = icon.copy().convert("RGBA")
    _, _, _, alpha = icon_rgba.split()

    mono_dark = Image.new("RGBA", icon_rgba.size, (0, 0, 0, 0))
    mono_dark.paste((11, 31, 58, 255), mask=alpha)  # deep navy
    mono_dark.save(out_dir / "moonstar_icon_mono_dark.png")
    save_sizes(mono_dark, out_dir / "moonstar_icon_mono_dark.png", sizes=[16, 32, 48, 64, 128, 256])

    mono_light = Image.new("RGBA", icon_rgba.size, (0, 0, 0, 0))
    mono_light.paste((255, 255, 255, 255), mask=alpha)
    mono_light.save(out_dir / "moonstar_icon_mono_light.png")
    save_sizes(mono_light, out_dir / "moonstar_icon_mono_light.png", sizes=[16, 32, 48, 64, 128, 256])

    print("Wrote outputs to:", out_dir)


if __name__ == "__main__":
    main()
