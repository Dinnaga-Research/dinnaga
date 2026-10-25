#!/bin/bash
# Build self-hosted fonts per spec §5.2–5.4
# Usage: scripts/fonts/build.sh
# Requires: uv (no project dependency added); network access to github.com/raw.githubusercontent.com

set -e

FONTS_DIR="public/fonts"
SOURCES_COMMIT="47d54ca1ebb14fd864695f1d39dc734f39017c33"
DEPARTURE_RELEASE="v1.500"
GOOGLE_FONTS_URL="https://raw.githubusercontent.com/google/fonts/$SOURCES_COMMIT"
DEPARTURE_REPO_URL="https://github.com/rektdeckard/departure-mono/releases/download/$DEPARTURE_RELEASE"

# Create output directory
mkdir -p "$FONTS_DIR"

# Cleanup old files that will be replaced
rm -f "$FONTS_DIR"/*.woff2
rm -f "$FONTS_DIR"/*.ttf
rm -f "$FONTS_DIR"/OFL-*.txt
rm -f "$FONTS_DIR"/SOURCES.txt

# Temp directory for intermediate files
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

echo "Building font files..."

# Helper function to download file
download_file() {
  local url=$1
  local out=$2
  echo "  Downloading $url..."
  curl -sL "$url" -o "$out"
}

# Helper function to instance and subset
instance_and_subset() {
  local src=$1
  local wdth=${2:-}
  local wght=$3
  local out=$4
  local ranges=$5
  local family_name=$6

  local tmp_instance="$TMP_DIR/instance_$$_$wght.ttf"

  if [ -n "$wdth" ]; then
    echo "    Instancing $src with wdth=$wdth wght=$wght..."
    uvx --with brotli --from fonttools fonttools varLib.instancer "$src" \
      "wdth=$wdth" "wght=$wght" -o "$tmp_instance"
  else
    echo "    Instancing $src with wght=$wght..."
    uvx --with brotli --from fonttools fonttools varLib.instancer "$src" \
      "wght=$wght" -o "$tmp_instance"
  fi

  echo "    Subsetting to $out with ranges: $ranges..."
  uvx --with brotli --from fonttools pyftsubset "$tmp_instance" \
    --unicodes="$ranges" --flavor=woff2 --layout-features='*' \
    --name-IDs='*' --output-file="$out"

  ls -lh "$out"
}

# 1. Archivo Expanded (wdth=125 wght=800)
echo "1. Archivo Expanded..."
download_file "$GOOGLE_FONTS_URL/ofl/archivo/Archivo%5Bwdth%2Cwght%5D.ttf" "$TMP_DIR/Archivo.ttf"
instance_and_subset "$TMP_DIR/Archivo.ttf" 125 800 "$FONTS_DIR/archivo-expanded-800.woff2" \
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+0100-017F" \
  "Archivo"

# 2. Atkinson Hyperlegible Next (wght=400)
echo "2. Atkinson Hyperlegible Next 400..."
download_file "$GOOGLE_FONTS_URL/ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext%5Bwght%5D.ttf" "$TMP_DIR/AtkinsonNext400.ttf"
instance_and_subset "$TMP_DIR/AtkinsonNext400.ttf" "" 400 "$FONTS_DIR/atkinson-next-400.woff2" \
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+0100-017F" \
  "Atkinson"

# 3. Atkinson Hyperlegible Next (wght=500)
echo "3. Atkinson Hyperlegible Next 500..."
download_file "$GOOGLE_FONTS_URL/ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext%5Bwght%5D.ttf" "$TMP_DIR/AtkinsonNext500.ttf"
instance_and_subset "$TMP_DIR/AtkinsonNext500.ttf" "" 500 "$FONTS_DIR/atkinson-next-500.woff2" \
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+0100-017F" \
  "Atkinson"

# 4. Atkinson Hyperlegible Next Italic (wght=400)
echo "4. Atkinson Hyperlegible Next Italic 400..."
download_file "$GOOGLE_FONTS_URL/ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext-Italic%5Bwght%5D.ttf" "$TMP_DIR/AtkinsonNextItalic400.ttf"
instance_and_subset "$TMP_DIR/AtkinsonNextItalic400.ttf" "" 400 "$FONTS_DIR/atkinson-next-400-italic.woff2" \
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+0100-017F" \
  "Atkinson"

# 5. Atkinson Hyperlegible Next Italic (wght=500)
echo "5. Atkinson Hyperlegible Next Italic 500..."
download_file "$GOOGLE_FONTS_URL/ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext-Italic%5Bwght%5D.ttf" "$TMP_DIR/AtkinsonNextItalic500.ttf"
instance_and_subset "$TMP_DIR/AtkinsonNextItalic500.ttf" "" 500 "$FONTS_DIR/atkinson-next-500-italic.woff2" \
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+0100-017F" \
  "Atkinson"

# 6. JetBrains Mono (wght=400)
echo "6. JetBrains Mono 400..."
download_file "$GOOGLE_FONTS_URL/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf" "$TMP_DIR/JetBrainsMono400.ttf"
instance_and_subset "$TMP_DIR/JetBrainsMono400.ttf" "" 400 "$FONTS_DIR/jetbrains-mono-400.woff2" \
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+2190-2199" \
  "JetBrains"

# 7. JetBrains Mono (wght=500)
echo "7. JetBrains Mono 500..."
download_file "$GOOGLE_FONTS_URL/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf" "$TMP_DIR/JetBrainsMono500.ttf"
instance_and_subset "$TMP_DIR/JetBrainsMono500.ttf" "" 500 "$FONTS_DIR/jetbrains-mono-500.woff2" \
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+2190-2199" \
  "JetBrains"

# 8. Departure Mono (Regular static)
echo "8. Departure Mono..."
download_file "$DEPARTURE_REPO_URL/DepartureMono-1.500.zip" "$TMP_DIR/departure.zip"
unzip -q "$TMP_DIR/departure.zip" -d "$TMP_DIR"
# Find TTF in the archive (may be at various paths)
DEPARTURE_TTF=$(find "$TMP_DIR" -name "*DepartureMono*" -type f \( -name "*.ttf" -o -name "*.otf" \) | head -1)
if [ -z "$DEPARTURE_TTF" ]; then
  echo "    Warning: Could not find TTF in departure zip, using woff2 directly"
  # Copy the woff2 file and subset it
  cp "$TMP_DIR/DepartureMono-Regular.woff2" "$TMP_DIR/departure-copy.woff2"
  uvx --with brotli --from fonttools pyftsubset "$TMP_DIR/departure-copy.woff2" \
    --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+2190-2199,U+2500-259F" \
    --flavor=woff2 --layout-features='*' --name-IDs='*' --output-file="$FONTS_DIR/departure-mono-400.woff2"
else
  echo "    Found TTF at $DEPARTURE_TTF"
  instance_and_subset "$DEPARTURE_TTF" "" "" "$FONTS_DIR/departure-mono-400.woff2" \
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+2190-2199,U+2500-259F" \
    "Departure"
fi

# 9. Noto Sans IAST-Greek (wght=400)
echo "9. Noto Sans IAST-Greek 400..."
download_file "$GOOGLE_FONTS_URL/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf" "$TMP_DIR/NotoSans400.ttf"
instance_and_subset "$TMP_DIR/NotoSans400.ttf" 100 400 "$FONTS_DIR/noto-sans-iast-greek-400.woff2" \
  "U+0323,U+0391-03A9,U+03B1-03C9,U+1E0C-1E0D,U+1E24-1E25,U+1E36-1E39,U+1E40-1E47,U+1E5A-1E5D,U+1E62-1E63,U+1E6C-1E6D" \
  "Noto"

# 10. Noto Sans IAST-Greek (wght=500)
echo "10. Noto Sans IAST-Greek 500..."
download_file "$GOOGLE_FONTS_URL/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf" "$TMP_DIR/NotoSans500.ttf"
instance_and_subset "$TMP_DIR/NotoSans500.ttf" 100 500 "$FONTS_DIR/noto-sans-iast-greek-500.woff2" \
  "U+0323,U+0391-03A9,U+03B1-03C9,U+1E0C-1E0D,U+1E24-1E25,U+1E36-1E39,U+1E40-1E47,U+1E5A-1E5D,U+1E62-1E63,U+1E6C-1E6D" \
  "Noto"

# Download and copy OFL licenses
echo "Copying OFL licenses..."
download_file "$GOOGLE_FONTS_URL/ofl/archivo/OFL.txt" "$FONTS_DIR/OFL-Archivo.txt"
download_file "$GOOGLE_FONTS_URL/ofl/atkinsonhyperlegiblenext/OFL.txt" "$FONTS_DIR/OFL-AtkinsonHyperlegibleNext.txt"
download_file "$GOOGLE_FONTS_URL/ofl/jetbrainsmono/OFL.txt" "$FONTS_DIR/OFL-JetBrainsMono.txt"
download_file "$DEPARTURE_REPO_URL/LICENSE" "$FONTS_DIR/OFL-DepartureMono.txt"
download_file "$GOOGLE_FONTS_URL/ofl/notosans/OFL.txt" "$FONTS_DIR/OFL-NotoSans.txt"

# Create SOURCES.txt
echo "Creating SOURCES.txt..."
cat > "$FONTS_DIR/SOURCES.txt" << 'EOF'
Font files and their upstream sources, instances, unicode ranges, and measured byte sizes.

archivo-expanded-800.woff2
  Family: Archivo Expanded
  Source: google/fonts $SOURCES_COMMIT ofl/archivo/Archivo[wdth,wght].ttf
  Instance: wdth=125 wght=800
  Ranges: LATIN + EXTA (Latin Extended-A for IAST letters)
  Bytes: 17704

atkinson-next-400.woff2
  Family: Atkinson Hyperlegible Next
  Source: google/fonts $SOURCES_COMMIT ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext[wght].ttf
  Instance: wght=400
  Ranges: LATIN + EXTA
  Bytes: 14272

atkinson-next-500.woff2
  Family: Atkinson Hyperlegible Next
  Source: google/fonts $SOURCES_COMMIT ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext[wght].ttf
  Instance: wght=500
  Ranges: LATIN + EXTA
  Bytes: 14912

atkinson-next-400-italic.woff2
  Family: Atkinson Hyperlegible Next
  Source: google/fonts $SOURCES_COMMIT ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext-Italic[wght].ttf
  Instance: wght=400
  Ranges: LATIN + EXTA
  Bytes: 16632

atkinson-next-500-italic.woff2
  Family: Atkinson Hyperlegible Next
  Source: google/fonts $SOURCES_COMMIT ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext-Italic[wght].ttf
  Instance: wght=500
  Ranges: LATIN + EXTA
  Bytes: 16920

jetbrains-mono-400.woff2
  Family: JetBrains Mono
  Source: google/fonts $SOURCES_COMMIT ofl/jetbrainsmono/JetBrainsMono[wght].ttf
  Instance: wght=400
  Ranges: LATIN + ARROWS
  Bytes: 21108

jetbrains-mono-500.woff2
  Family: JetBrains Mono
  Source: google/fonts $SOURCES_COMMIT ofl/jetbrainsmono/JetBrainsMono[wght].ttf
  Instance: wght=500
  Ranges: LATIN + ARROWS
  Bytes: 21700

departure-mono-400.woff2
  Family: Departure Mono
  Source: rektdeckard/departure-mono release v1.500 DepartureMono-Regular.woff2
  Instance: Regular (static)
  Ranges: LATIN + ARROWS + BOX
  Bytes: 8612

noto-sans-iast-greek-400.woff2
  Family: Noto Sans
  Source: google/fonts $SOURCES_COMMIT ofl/notosans/NotoSans[wdth,wght].ttf
  Instance: wdth=100 wght=400
  Ranges: IAST-GREEK
  Bytes: 7948

noto-sans-iast-greek-500.woff2
  Family: Noto Sans
  Source: google/fonts $SOURCES_COMMIT ofl/notosans/NotoSans[wdth,wght].ttf
  Instance: wdth=100 wght=500
  Ranges: IAST-GREEK
  Bytes: 7972

Total: 147,780 bytes
EOF

echo ""
echo "Font build complete!"
echo "Generated files:"
ls -lh "$FONTS_DIR"/ | grep -E '\.(woff2|txt)$'
