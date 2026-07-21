#!/usr/bin/env python3
"""Drag-and-drop / file-browser desktop UI for compare_pdfs.py."""

import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, scrolledtext

from tkinterdnd2 import DND_FILES, TkinterDnD

from compare_pdfs import build_report, compare_pdfs


class DropZone(tk.Frame):
    def __init__(self, master, label_text, on_change):
        super().__init__(master, bd=2, relief=tk.GROOVE, bg="#f0f0f0")
        self.on_change = on_change
        self.path: Path | None = None

        self.label = tk.Label(
            self,
            text=f"Drop {label_text} here\nor click Browse...",
            bg="#f0f0f0",
            fg="#555",
            justify=tk.CENTER,
        )
        self.label.pack(expand=True, fill=tk.BOTH, padx=10, pady=10)

        self.browse_btn = tk.Button(self, text="Browse...", command=self.browse)
        self.browse_btn.pack(pady=(0, 10))

        for widget in (self, self.label):
            widget.drop_target_register(DND_FILES)
            widget.dnd_bind("<<Drop>>", self.on_drop)

    def browse(self):
        path = filedialog.askopenfilename(
            title="Select a PDF", filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")]
        )
        if path:
            self.set_path(Path(path))

    def on_drop(self, event):
        raw = event.data.strip()
        if raw.startswith("{") and raw.endswith("}"):
            raw = raw[1:-1]
        path = Path(raw)
        if path.suffix.lower() != ".pdf":
            messagebox.showerror("Invalid file", f"Not a PDF file:\n{path}")
            return
        self.set_path(path)

    def set_path(self, path: Path):
        self.path = path
        self.label.config(text=str(path), fg="#000")
        self.on_change()


class App(TkinterDnD.Tk):
    def __init__(self):
        super().__init__()
        self.title("PDF Compare")
        self.geometry("700x600")
        self.minsize(560, 420)

        top = tk.Frame(self)
        top.pack(fill=tk.X, padx=10, pady=10)
        top.columnconfigure(0, weight=1)
        top.columnconfigure(1, weight=1)

        self.zone_a = DropZone(top, "PDF A", self.update_button_state)
        self.zone_a.grid(row=0, column=0, sticky="nsew", padx=(0, 5), ipady=20)
        self.zone_b = DropZone(top, "PDF B", self.update_button_state)
        self.zone_b.grid(row=0, column=1, sticky="nsew", padx=(5, 0), ipady=20)

        options = tk.Frame(self)
        options.pack(fill=tk.X, padx=10)
        self.show_diff_var = tk.BooleanVar(value=True)
        tk.Checkbutton(
            options, text="Show unified diff for differing pages", variable=self.show_diff_var
        ).pack(side=tk.LEFT)

        self.compare_btn = tk.Button(
            self, text="Compare", state=tk.DISABLED, command=self.run_compare, height=2
        )
        self.compare_btn.pack(fill=tk.X, padx=10, pady=10)

        self.output = scrolledtext.ScrolledText(self, wrap=tk.WORD, font=("Courier", 10))
        self.output.pack(fill=tk.BOTH, expand=True, padx=10, pady=(0, 10))
        self.output.config(state=tk.DISABLED)

    def update_button_state(self):
        ready = self.zone_a.path is not None and self.zone_b.path is not None
        self.compare_btn.config(state=tk.NORMAL if ready else tk.DISABLED)

    def run_compare(self):
        path_a, path_b = self.zone_a.path, self.zone_b.path
        try:
            result = compare_pdfs(path_a, path_b)
            report = build_report(path_a, path_b, result, show_diff=self.show_diff_var.get())
        except Exception as exc:
            report = f"Error comparing files:\n{exc}"

        self.output.config(state=tk.NORMAL)
        self.output.delete("1.0", tk.END)
        self.output.insert(tk.END, report)
        self.output.config(state=tk.DISABLED)


if __name__ == "__main__":
    App().mainloop()
