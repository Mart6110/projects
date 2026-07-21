# pdf-compare

Check whether two PDF files are identical, both at the byte level and at the
content (text) level.

## How it works

1. **Byte-level check**: computes the SHA-256 hash of each file. If the
   hashes match, the files are byte-for-byte identical.
2. **Content-level check**: if the hashes differ, extracts the text from
   every page of both PDFs and compares it page by page. This catches PDFs
   that look the same but were re-saved by different tools (different
   metadata, compression, or internal structure).

The report always shows both results, plus any differing metadata
(author, producer, creation date, etc.) as extra context.

## GUI usage (drag-and-drop / file browser)

There's also a desktop app (`gui.py`) if you'd rather not use the command
line: two drop zones to drag PDFs onto (or click "Browse..." to pick a file),
a "Compare" button, and the same report shown in a scrollable text box.

1. **One-time system dependency**: the GUI needs Tk, which isn't always
   installed by default.

   ```bash
   sudo apt install -y python3-tk
   ```

2. **Set up the venv and install dependencies** (same as below, `gui.py`
   needs the same `requirements.txt` plus `tkinterdnd2` for drag-and-drop).

   ```bash
   cd pdf-compare
   python3 -m venv .venv
   ./.venv/bin/pip install -r requirements.txt
   ```

3. **Launch it.**

   ```bash
   ./.venv/bin/python gui.py
   ```

4. **Drag a PDF onto each drop zone** (or click "Browse..." under each one
   to pick a file the normal way). Once both are set, the "Compare" button
   becomes active.

5. **Click Compare.** The same report you'd get from the command line
   (byte hash, text comparison, metadata differences, summary) appears in
   the text box below. Toggle "Show unified diff for differing pages" to
   include/exclude the line-by-line diff.

## Command-line usage

1. **Open a terminal in this project folder.**

   ```bash
   cd pdf-compare
   ```

2. **Create a virtual environment** (only needed the first time).

   ```bash
   python3 -m venv .venv
   ```

3. **Install the dependencies** into that environment.

   ```bash
   ./.venv/bin/pip install -r requirements.txt
   ```

4. **Run the comparison**, pointing it at your two PDF files.

   ```bash
   ./.venv/bin/python compare_pdfs.py path/to/file_a.pdf path/to/file_b.pdf
   ```

5. **Read the report.** It prints, in order:
   - the SHA-256 hash of each file and whether they're byte-identical
   - the page count and whether the extracted text matches page by page
   - any metadata fields that differ (author, producer, dates, etc.)
   - a one-line summary of the overall result

6. **(Optional) See exactly what changed** on pages that differ by adding
   `--diff`, which prints a unified diff of the text for each mismatched
   page.

   ```bash
   ./.venv/bin/python compare_pdfs.py path/to/file_a.pdf path/to/file_b.pdf --diff
   ```

7. **Check the result programmatically**, if you're scripting this, via
   the exit code: `0` = byte-identical or text-identical, `1` = content
   differs, `2` = a given file path doesn't exist.

   ```bash
   ./.venv/bin/python compare_pdfs.py file_a.pdf file_b.pdf && echo "MATCH" || echo "DIFFERENT"
   ```

## Limitations

Text extraction relies on the PDF having selectable/embedded text. Scanned
PDFs (image-only pages) will show as text-identical (both empty) even if the
images differ — this tool does not do OCR or pixel-level image comparison.
