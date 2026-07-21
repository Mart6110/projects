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

## Step-by-step usage

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
