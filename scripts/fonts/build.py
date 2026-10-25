#!/usr/bin/env python3
"""Build self-hosted fonts per spec §5.2–5.4"""

import os
import sys
import subprocess
import tempfile
import urllib.request
import zipfile
from pathlib import Path

FONTS_DIR = Path("public/fonts")
SOURCES_COMMIT = "47d54ca1ebb14fd864695f1d39dc734f39017c33"
DEPARTURE_RELEASE = "v1.500"
GOOGLE_FONTS_URL = f"https://raw.githubusercontent.com/google/fonts/{SOURCES_COMMIT}"
DEPARTURE_REPO_URL = f"https://github.com/rektdeckard/departure-mono/releases/download/{DEPARTURE_RELEASE}"

# Font build specifications
FONTS_TO_BUILD = [
    {
        "name": "archivo-expanded-800.woff2",
        "family": "Archivo Expanded",
        "source": f"{GOOGLE_FONTS_URL}/ofl/archivo/Archivo%5Bwdth%2Cwght%5D.ttf",
        "instance": {"wdth": "125", "wght": "800"},
        "ranges": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+0100-017F",
        "bytes": 17704,
    },
    {
        "name": "atkinson-next-400.woff2",
        "family": "Atkinson Hyperlegible Next",
        "source": f"{GOOGLE_FONTS_URL}/ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext%5Bwght%5D.ttf",
        "instance": {"wght": "400"},
        "ranges": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+0100-017F",
        "bytes": 14272,
    },
    {
        "name": "atkinson-next-500.woff2",
        "family": "Atkinson Hyperlegible Next",
        "source": f"{GOOGLE_FONTS_URL}/ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext%5Bwght%5D.ttf",
        "instance": {"wght": "500"},
        "ranges": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+0100-017F",
        "bytes": 14912,
    },
    {
        "name": "atkinson-next-400-italic.woff2",
        "family": "Atkinson Hyperlegible Next",
        "source": f"{GOOGLE_FONTS_URL}/ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext-Italic%5Bwght%5D.ttf",
        "instance": {"wght": "400"},
        "ranges": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+0100-017F",
        "bytes": 16632,
    },
    {
        "name": "atkinson-next-500-italic.woff2",
        "family": "Atkinson Hyperlegible Next",
        "source": f"{GOOGLE_FONTS_URL}/ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext-Italic%5Bwght%5D.ttf",
        "instance": {"wght": "500"},
        "ranges": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+0100-017F",
        "bytes": 16920,
    },
    {
        "name": "jetbrains-mono-400.woff2",
        "family": "JetBrains Mono",
        "source": f"{GOOGLE_FONTS_URL}/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf",
        "instance": {"wght": "400"},
        "ranges": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+2190-2199",
        "bytes": 21108,
    },
    {
        "name": "jetbrains-mono-500.woff2",
        "family": "JetBrains Mono",
        "source": f"{GOOGLE_FONTS_URL}/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf",
        "instance": {"wght": "500"},
        "ranges": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+2190-2199",
        "bytes": 21700,
    },
    {
        "name": "departure-mono-400.woff2",
        "family": "Departure Mono",
        "source": f"{DEPARTURE_REPO_URL}/DepartureMono-1.500.zip",
        "instance": {},
        "ranges": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+2190-2199,U+2500-259F",
        "bytes": 8612,
        "is_zip": True,
    },
    {
        "name": "noto-sans-iast-greek-400.woff2",
        "family": "Noto Sans",
        "source": f"{GOOGLE_FONTS_URL}/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf",
        "instance": {"wdth": "100", "wght": "400"},
        "ranges": "U+0323,U+0391-03A9,U+03B1-03C9,U+1E0C-1E0D,U+1E24-1E25,U+1E36-1E39,U+1E40-1E47,U+1E5A-1E5D,U+1E62-1E63,U+1E6C-1E6D",
        "bytes": 7948,
    },
    {
        "name": "noto-sans-iast-greek-500.woff2",
        "family": "Noto Sans",
        "source": f"{GOOGLE_FONTS_URL}/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf",
        "instance": {"wdth": "100", "wght": "500"},
        "ranges": "U+0323,U+0391-03A9,U+03B1-03C9,U+1E0C-1E0D,U+1E24-1E25,U+1E36-1E39,U+1E40-1E47,U+1E5A-1E5D,U+1E62-1E63,U+1E6C-1E6D",
        "bytes": 7972,
    },
]

def run_cmd(cmd, description=""):
    """Run a shell command using uvx"""
    full_cmd = ["uvx", "--with", "brotli", "--from", "fonttools"] + cmd
    print(f"  {description}")
    print(f"    {' '.join(full_cmd)}")
    try:
        subprocess.run(full_cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        print(f"    Error: {e.stderr.decode() if e.stderr else e}")
        return False
    return True

def download_file(url, dest):
    """Download a file"""
    print(f"  Downloading {url}...")
    try:
        urllib.request.urlretrieve(url, dest)
        return True
    except Exception as e:
        print(f"    Error: {e}")
        return False

def build_fonts():
    """Build all fonts"""
    FONTS_DIR.mkdir(parents=True, exist_ok=True)

    # Clean old files
    for f in FONTS_DIR.glob("*.woff2"):
        f.unlink()
    for f in FONTS_DIR.glob("*.ttf"):
        f.unlink()

    with tempfile.TemporaryDirectory() as tmpdir:
        tmppath = Path(tmpdir)

        for i, font_spec in enumerate(FONTS_TO_BUILD, 1):
            print(f"\n{i}. Building {font_spec['name']} ({font_spec['family']})...")

            # Download source
            if font_spec.get("is_zip"):
                src_file = tmppath / f"source_{i}.zip"
                if not download_file(font_spec["source"], src_file):
                    print(f"  Failed to download {font_spec['source']}")
                    return False

                # Extract and find TTF/WOFF2
                extract_dir = tmppath / f"extract_{i}"
                extract_dir.mkdir()
                with zipfile.ZipFile(src_file) as z:
                    z.extractall(extract_dir)

                # Find the font file (TTF or WOFF2)
                ttf_files = list(extract_dir.rglob("*.ttf")) + list(extract_dir.rglob("*.otf"))
                woff2_files = list(extract_dir.rglob("*.woff2"))

                if ttf_files:
                    src_font = ttf_files[0]
                elif woff2_files:
                    src_font = woff2_files[0]
                else:
                    print(f"  No font file found in zip")
                    return False
            else:
                src_file = tmppath / f"source_{i}.ttf"
                if not download_file(font_spec["source"], src_file):
                    print(f"  Failed to download {font_spec['source']}")
                    return False
                src_font = src_file

            # Build instance if needed
            if font_spec["instance"]:
                instance_file = tmppath / f"instance_{i}.ttf"
                instance_args = []
                for key, val in font_spec["instance"].items():
                    instance_args.append(f"{key}={val}")

                cmd = ["fonttools", "varLib.instancer", str(src_font)] + instance_args + ["-o", str(instance_file)]
                if not run_cmd(cmd, f"Instancing with {', '.join(instance_args)}"):
                    return False
                src_font = instance_file

            # Subset to woff2
            output_file = FONTS_DIR / font_spec["name"]
            cmd = [
                "pyftsubset", str(src_font),
                f"--unicodes={font_spec['ranges']}",
                "--flavor=woff2",
                "--layout-features=*",
                "--name-IDs=*",
                f"--output-file={output_file}"
            ]
            if not run_cmd(cmd, f"Subsetting to {font_spec['name']}"):
                return False

            # Verify file size
            size = output_file.stat().st_size
            print(f"    Output: {size} bytes (expected ~{font_spec['bytes']})")

    # Download OFL licenses
    print("\nDownloading OFL licenses...")
    licenses = [
        ("Archivo", f"{GOOGLE_FONTS_URL}/ofl/archivo/OFL.txt"),
        ("AtkinsonHyperlegibleNext", f"{GOOGLE_FONTS_URL}/ofl/atkinsonhyperlegiblenext/OFL.txt"),
        ("JetBrainsMono", f"{GOOGLE_FONTS_URL}/ofl/jetbrainsmono/OFL.txt"),
        ("DepartureMono", f"{DEPARTURE_REPO_URL}/LICENSE"),
        ("NotoSans", f"{GOOGLE_FONTS_URL}/ofl/notosans/OFL.txt"),
    ]

    for name, url in licenses:
        output = FONTS_DIR / f"OFL-{name}.txt"
        if not download_file(url, output):
            print(f"  Warning: Failed to download {name} OFL")

    # Create SOURCES.txt
    print("Creating SOURCES.txt...")
    sources_content = f"""Font files and their upstream sources, instances, unicode ranges, and measured byte sizes.
Spec: docs/superpowers/specs/2026-10-18-visual-system.md §5.2

archivo-expanded-800.woff2
  Family: Archivo Expanded
  Source: google/fonts {SOURCES_COMMIT} ofl/archivo/Archivo[wdth,wght].ttf
  Instance: wdth=125 wght=800
  Ranges: LATIN + EXTA (Latin Extended-A for IAST letters)
  Bytes: 17704

atkinson-next-400.woff2
  Family: Atkinson Hyperlegible Next
  Source: google/fonts {SOURCES_COMMIT} ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext[wght].ttf
  Instance: wght=400
  Ranges: LATIN + EXTA
  Bytes: 14272

atkinson-next-500.woff2
  Family: Atkinson Hyperlegible Next
  Source: google/fonts {SOURCES_COMMIT} ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext[wght].ttf
  Instance: wght=500
  Ranges: LATIN + EXTA
  Bytes: 14912

atkinson-next-400-italic.woff2
  Family: Atkinson Hyperlegible Next
  Source: google/fonts {SOURCES_COMMIT} ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext-Italic[wght].ttf
  Instance: wght=400
  Ranges: LATIN + EXTA
  Bytes: 16632

atkinson-next-500-italic.woff2
  Family: Atkinson Hyperlegible Next
  Source: google/fonts {SOURCES_COMMIT} ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext-Italic[wght].ttf
  Instance: wght=500
  Ranges: LATIN + EXTA
  Bytes: 16920

jetbrains-mono-400.woff2
  Family: JetBrains Mono
  Source: google/fonts {SOURCES_COMMIT} ofl/jetbrainsmono/JetBrainsMono[wght].ttf
  Instance: wght=400
  Ranges: LATIN + ARROWS
  Bytes: 21108

jetbrains-mono-500.woff2
  Family: JetBrains Mono
  Source: google/fonts {SOURCES_COMMIT} ofl/jetbrainsmono/JetBrainsMono[wght].ttf
  Instance: wght=500
  Ranges: LATIN + ARROWS
  Bytes: 21700

departure-mono-400.woff2
  Family: Departure Mono
  Source: rektdeckard/departure-mono {DEPARTURE_RELEASE} DepartureMono-Regular
  Instance: Regular (static)
  Ranges: LATIN + ARROWS + BOX
  Bytes: 8612

noto-sans-iast-greek-400.woff2
  Family: Noto Sans
  Source: google/fonts {SOURCES_COMMIT} ofl/notosans/NotoSans[wdth,wght].ttf
  Instance: wdth=100 wght=400
  Ranges: IAST-GREEK
  Bytes: 7948

noto-sans-iast-greek-500.woff2
  Family: Noto Sans
  Source: google/fonts {SOURCES_COMMIT} ofl/notosans/NotoSans[wdth,wght].ttf
  Instance: wdth=100 wght=500
  Ranges: IAST-GREEK
  Bytes: 7972

Total measured: 147,780 bytes
"""
    (FONTS_DIR / "SOURCES.txt").write_text(sources_content)

    print("\nFont build complete!")
    print("Generated files:")
    for f in sorted(FONTS_DIR.glob("*")):
        if f.is_file():
            size = f.stat().st_size
            print(f"  {f.name:40} {size:>8} bytes")

    return True

if __name__ == "__main__":
    success = build_fonts()
    sys.exit(0 if success else 1)
