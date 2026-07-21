#!/usr/bin/env python3
"""Compare two PDF files for byte-level and content-level equality."""

import argparse
import difflib
import hashlib
import sys
from dataclasses import dataclass, field
from pathlib import Path

from pypdf import PdfReader


def sha256_of(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


@dataclass
class ComparisonResult:
    byte_identical: bool
    hash_a: str
    hash_b: str
    page_count_a: int
    page_count_b: int
    text_identical: bool
    page_diffs: dict[int, list[str]] = field(default_factory=dict)
    metadata_a: dict = field(default_factory=dict)
    metadata_b: dict = field(default_factory=dict)


def extract_page_texts(reader: PdfReader) -> list[str]:
    return [(page.extract_text() or "") for page in reader.pages]


def compare_pdfs(path_a: Path, path_b: Path) -> ComparisonResult:
    hash_a = sha256_of(path_a)
    hash_b = sha256_of(path_b)
    byte_identical = hash_a == hash_b

    reader_a = PdfReader(path_a)
    reader_b = PdfReader(path_b)

    texts_a = extract_page_texts(reader_a)
    texts_b = extract_page_texts(reader_b)

    page_diffs: dict[int, list[str]] = {}
    for i in range(max(len(texts_a), len(texts_b))):
        text_a = texts_a[i] if i < len(texts_a) else None
        text_b = texts_b[i] if i < len(texts_b) else None
        if text_a is None:
            page_diffs[i] = [f"Page {i + 1} only exists in {path_b.name}"]
        elif text_b is None:
            page_diffs[i] = [f"Page {i + 1} only exists in {path_a.name}"]
        elif text_a != text_b:
            diff = list(
                difflib.unified_diff(
                    text_a.splitlines(),
                    text_b.splitlines(),
                    fromfile=f"{path_a.name}:page{i + 1}",
                    tofile=f"{path_b.name}:page{i + 1}",
                    lineterm="",
                )
            )
            page_diffs[i] = diff

    text_identical = not page_diffs

    return ComparisonResult(
        byte_identical=byte_identical,
        hash_a=hash_a,
        hash_b=hash_b,
        page_count_a=len(reader_a.pages),
        page_count_b=len(reader_b.pages),
        text_identical=text_identical,
        page_diffs=page_diffs,
        metadata_a=dict(reader_a.metadata or {}),
        metadata_b=dict(reader_b.metadata or {}),
    )


def build_report(path_a: Path, path_b: Path, result: ComparisonResult, show_diff: bool) -> str:
    lines: list[str] = []
    lines.append(f"Comparing:\n  A: {path_a}\n  B: {path_b}\n")

    lines.append("== Byte-level (SHA-256) ==")
    lines.append(f"  {path_a.name}: {result.hash_a}")
    lines.append(f"  {path_b.name}: {result.hash_b}")
    if result.byte_identical:
        lines.append("  Result: IDENTICAL (files are byte-for-byte the same)\n")
    else:
        lines.append("  Result: DIFFERENT\n")

    lines.append("== Content-level (extracted text) ==")
    lines.append(f"  Page count: {result.page_count_a} vs {result.page_count_b}")
    if result.text_identical:
        lines.append("  Result: IDENTICAL (text content matches on every page)\n")
    else:
        lines.append(f"  Result: DIFFERENT ({len(result.page_diffs)} page(s) differ)\n")
        if show_diff:
            for page_num in sorted(result.page_diffs):
                lines.append(f"  --- Page {page_num + 1} ---")
                for line in result.page_diffs[page_num]:
                    lines.append(f"  {line}")
                lines.append("")

    if result.metadata_a != result.metadata_b:
        lines.append("== Metadata differs (informational only) ==")
        keys = sorted(set(result.metadata_a) | set(result.metadata_b))
        for key in keys:
            val_a = result.metadata_a.get(key)
            val_b = result.metadata_b.get(key)
            if val_a != val_b:
                lines.append(f"  {key}: {val_a!r} vs {val_b!r}")
        lines.append("")

    lines.append("== Summary ==")
    if result.byte_identical:
        lines.append("The files are byte-for-byte identical.")
    elif result.text_identical:
        lines.append("The files differ at the byte level but their text content is identical")
        lines.append("(likely differing metadata, encoding, or internal structure only).")
    else:
        lines.append("The files have different content.")

    return "\n".join(lines)


def print_report(path_a: Path, path_b: Path, result: ComparisonResult, show_diff: bool) -> None:
    print(build_report(path_a, path_b, result, show_diff))


def main() -> int:
    parser = argparse.ArgumentParser(description="Check whether two PDF files are identical.")
    parser.add_argument("pdf_a", type=Path, help="Path to the first PDF")
    parser.add_argument("pdf_b", type=Path, help="Path to the second PDF")
    parser.add_argument(
        "--diff",
        action="store_true",
        help="Show a unified diff of text content for pages that differ",
    )
    args = parser.parse_args()

    for path in (args.pdf_a, args.pdf_b):
        if not path.is_file():
            print(f"error: file not found: {path}", file=sys.stderr)
            return 2

    result = compare_pdfs(args.pdf_a, args.pdf_b)
    print_report(args.pdf_a, args.pdf_b, result, show_diff=args.diff)

    return 0 if result.byte_identical or result.text_identical else 1


if __name__ == "__main__":
    raise SystemExit(main())
