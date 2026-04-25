# founder-cinematic

Dark + cream + amber aesthetic for founder workshop talks. Read `style.md` for tokens and `image-prompts.md` for a prompt reference library. Open `html-scaffold.html` in any browser to preview the 8 layout patterns.

## Files

- `style.md` — design tokens, font stack, layout catalog.
- `html-scaffold.html` — working starter deck with 8 layout examples. Keyboard: `→` / `←` / `Space` navigate, `F` fullscreen.
- `image-prompts.md` — Kinfolk-style prompt library for FLUX / Ideogram / Recraft.

## Customize

The scaffold uses CSS custom properties declared at `:root`. To rebrand:

1. Change `--accent` (currently `#F5B942` amber) to your brand accent.
2. Swap Google Fonts `<link>` in `<head>` if you want different typography.
3. Regenerate images with your brand's photo mood phrase (edit the suffix in `image-prompts.md`).

Everything else (layouts, spacing, ratios) should stay fixed — that is where the "premium, not preachy" feel comes from.

## License

MIT, same as the parent skill.
