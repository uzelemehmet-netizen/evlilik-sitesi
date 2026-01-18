MoonStar minimal mark SVGs

- moonstar_mark.svg: Navy+teal version
- moonstar_mark_mono.svg: Uses currentColor (ideal for dark/light themes)

Mono lockups (mark + brand name)

- moonstar_lockup_horizontal_mono_navy.svg: Horizontal lockup, default navy
- moonstar_lockup_horizontal_mono_white.svg: Horizontal lockup, default white
- moonstar_lockup_stacked_mono_navy.svg: Stacked lockup, default navy
- moonstar_lockup_stacked_mono_white.svg: Stacked lockup, default white

Usage examples:
- In HTML: <img src="/logos/moonstar_mark.svg" alt="MoonStar" />
- For mono: set CSS color on the <img> parent only if inlined; otherwise convert to two files (dark/light).

Notes:
- The mono lockups use currentColor with an in-file default color via the SVG root style.
- If you need dynamic recoloring via CSS, inline the SVG or render the wordmark in HTML next to moonstar_mark_mono.svg.
