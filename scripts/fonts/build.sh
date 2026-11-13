#!/bin/bash
# ABOUTME: Builds the self-hosted fonts in public/fonts/ (spec 2026-11-12-darkroom.md §4.1–4.2).
# ABOUTME: Usage: bun run fonts [-- --all]. Needs uv (fonttools via uvx, no project dependency) and network.
# By default it builds the Darkroom files (Archivo, Chivo Mono). --all also rebuilds the doc faces
# (Atkinson, Noto Sans), whose committed files predate this script's fonttools version: their bytes
# change on a rebuild, so only pass --all when they need to change.
set -euo pipefail

ALL=0
[ "${1:-}" = "--all" ] && ALL=1

FONTS_DIR="public/fonts"
COMMIT="47d54ca1ebb14fd864695f1d39dc734f39017c33"
GF="https://raw.githubusercontent.com/google/fonts/$COMMIT"

LATIN="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
EXTA="U+0100-017F"
ARROWS="U+2190-2199"
IAST_GREEK="U+0323,U+0391-03A9,U+03B1-03C9,U+1E0C-1E0D,U+1E24-1E25,U+1E36-1E39,U+1E40-1E47,U+1E5A-1E5D,U+1E62-1E63,U+1E6C-1E6D"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
FT=(uvx --with brotli --from fonttools)

fetch() { curl -fsSL "$GF/$1" -o "$2"; }

# instance <src> <out.ttf> <axis=limits>...  (a range keeps the axis variable, a number pins it)
instance() {
  local src=$1 out=$2
  shift 2
  "${FT[@]}" fonttools varLib.instancer "$src" "$@" -o "$out" >/dev/null
}

# subset <src.ttf> <out.woff2> <unicodes>
subset() {
  "${FT[@]}" pyftsubset "$1" --unicodes="$3" --flavor=woff2 --layout-features='*' \
    --name-IDs='*' --output-file="$2"
  printf '  %-34s %7d bytes\n' "$(basename "$2")" "$(wc -c <"$2")"
}

mkdir -p "$FONTS_DIR"
echo "Downloading sources from google/fonts@$COMMIT ..."
fetch "ofl/archivo/Archivo%5Bwdth%2Cwght%5D.ttf" "$TMP/Archivo.ttf"
fetch "ofl/chivomono/ChivoMono%5Bwght%5D.ttf" "$TMP/ChivoMono.ttf"
if [ "$ALL" = 1 ]; then
  fetch "ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext%5Bwght%5D.ttf" "$TMP/Atkinson.ttf"
  fetch "ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext-Italic%5Bwght%5D.ttf" "$TMP/AtkinsonItalic.ttf"
  fetch "ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf" "$TMP/NotoSans.ttf"
fi

# Archivo keeps both axes (the width axis is the voice switch). LATIN + ARROWS is the preloaded
# file (≤ 95 KB); Latin Extended-A would take it to ~115 KB, so it is a second file that the
# browser fetches only when a page uses one of its letters (unicode-range), e.g. ā in Dignāga.
echo "Archivo (variable, wdth 62–125, wght 400–800)"
instance "$TMP/Archivo.ttf" "$TMP/archivo-var.ttf" wdth=62:125 wght=400:800
subset "$TMP/archivo-var.ttf" "$FONTS_DIR/archivo-var.woff2" "$LATIN,$ARROWS"
subset "$TMP/archivo-var.ttf" "$FONTS_DIR/archivo-var-exta.woff2" "$EXTA"

echo "Chivo Mono (doc code)"
for w in 400 500; do
  instance "$TMP/ChivoMono.ttf" "$TMP/chivo-$w.ttf" wght=$w
  subset "$TMP/chivo-$w.ttf" "$FONTS_DIR/chivo-mono-$w.woff2" "$LATIN,$ARROWS"
done

if [ "$ALL" = 1 ]; then
echo "Atkinson Hyperlegible Next (doc body)"
for w in 400 500; do
  instance "$TMP/Atkinson.ttf" "$TMP/atk-$w.ttf" wght=$w
  subset "$TMP/atk-$w.ttf" "$FONTS_DIR/atkinson-next-$w.woff2" "$LATIN,$EXTA"
  instance "$TMP/AtkinsonItalic.ttf" "$TMP/atk-$w-i.ttf" wght=$w
  subset "$TMP/atk-$w-i.ttf" "$FONTS_DIR/atkinson-next-$w-italic.woff2" "$LATIN,$EXTA"
done

echo "Noto Sans (IAST and Greek fallback)"
for w in 400 500; do
  instance "$TMP/NotoSans.ttf" "$TMP/noto-$w.ttf" wdth=100 wght=$w
  subset "$TMP/noto-$w.ttf" "$FONTS_DIR/noto-sans-iast-greek-$w.woff2" "$IAST_GREEK"
done
fi

echo "Licences"
fetch "ofl/archivo/OFL.txt" "$FONTS_DIR/OFL-Archivo.txt"
fetch "ofl/chivomono/OFL.txt" "$FONTS_DIR/OFL-ChivoMono.txt"
fetch "ofl/atkinsonhyperlegiblenext/OFL.txt" "$FONTS_DIR/OFL-AtkinsonHyperlegibleNext.txt"
fetch "ofl/notosans/OFL.txt" "$FONTS_DIR/OFL-NotoSans.txt"

echo "Done. Record the byte sizes above in $FONTS_DIR/SOURCES.txt."
