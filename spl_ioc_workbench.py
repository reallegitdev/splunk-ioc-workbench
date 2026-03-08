#!/usr/bin/env python3

import ipaddress
from pathlib import Path
import tkinter as tk
from tkinter import ttk, messagebox


BASE_DIR = Path(__file__).resolve().parent
TEMPLATE_DIR = BASE_DIR / "templates"

TEMPLATE_FILES = {
    "traffic": TEMPLATE_DIR / "traffic.tpl",
    "dns": TEMPLATE_DIR / "dns.tpl",
    "web": TEMPLATE_DIR / "web.tpl",
}


def load_template(template_name: str) -> str:
    template_path = TEMPLATE_FILES.get(template_name)

    if template_path is None:
        raise ValueError(f"Unknown template requested: {template_name}")

    if not template_path.exists():
        raise FileNotFoundError(f"Template file not found: {template_path}")

    return template_path.read_text(encoding="utf-8")


def is_ip(value: str) -> bool:
    try:
        ipaddress.ip_address(value.strip())
        return True
    except ValueError:
        return False


def normalize_items(text: str) -> list[str]:
    items = []
    seen = set()

    for line in text.splitlines():
        value = line.strip().strip(",")
        if not value:
            continue
        if value not in seen:
            items.append(value)
            seen.add(value)

    return items


def classify_items(items: list[str]) -> str:
    if not items:
        return "unknown"

    ip_count = sum(1 for item in items if is_ip(item))
    domain_count = len(items) - ip_count

    if ip_count == len(items):
        return "ip"
    if domain_count == len(items):
        return "domain"
    if ip_count >= domain_count:
        return "mixed_ip"
    return "mixed_domain"


def format_ip_items(items: list[str]) -> str:
    return ", ".join(items)


def format_domain_items(items: list[str]) -> str:
    return ", ".join(f'"*{item}*"' for item in items)


def render_template(template: str, replacement: str) -> str:
    if "{{IOC_LIST}}" not in template:
        raise ValueError("Template is missing {{IOC_LIST}} placeholder.")
    return template.replace("{{IOC_LIST}}", replacement)


def get_clean_text(widget: tk.Text) -> str:
    return widget.get("1.0", tk.END).strip()


def copy_from(widget: tk.Text, label: str) -> None:
    text = get_clean_text(widget)
    if not text:
        messagebox.showwarning("Nothing to copy", f"No {label} search has been generated yet.")
        return

    root.clipboard_clear()
    root.clipboard_append(text)
    root.update()
    status_var.set(f"Copied {label} search to clipboard.")


def clear_all() -> None:
    items_box.delete("1.0", tk.END)

    for box in (traffic_box, dns_box, web_box):
        box.config(state="normal")
        box.delete("1.0", tk.END)

    detected_type_var.set("Detected type: n/a")
    status_var.set("Cleared.")


def generate_searches() -> None:
    raw_items = items_box.get("1.0", tk.END)
    items = normalize_items(raw_items)

    if not items:
        messagebox.showerror("Missing IOC list", "Paste at least one IP or domain.")
        return

    try:
        traffic_template = load_template("traffic")
        dns_template = load_template("dns")
        web_template = load_template("web")
    except Exception as exc:
        messagebox.showerror("Template Error", str(exc))
        status_var.set("Failed to load one or more templates.")
        return

    item_type = classify_items(items)
    detected_type_var.set(f"Detected type: {item_type}")

    traffic_output = ""
    dns_output = ""
    web_output = ""

    ip_items = [x for x in items if is_ip(x)]
    domain_items = [x for x in items if not is_ip(x)]

    try:
        if ip_items:
            traffic_output = render_template(traffic_template, format_ip_items(ip_items))

        if domain_items:
            dns_output = render_template(dns_template, format_domain_items(domain_items))
            web_output = render_template(web_template, format_domain_items(domain_items))
    except Exception as exc:
        messagebox.showerror("Render Error", str(exc))
        status_var.set("Failed to render one or more searches.")
        return

    for box, content in (
        (traffic_box, traffic_output),
        (dns_box, dns_output),
        (web_box, web_output),
    ):
        box.config(state="normal")
        box.delete("1.0", tk.END)
        box.insert("1.0", content)

    if ip_items and domain_items:
        status_var.set("Generated traffic for IPs and DNS/Web for domains.")
    elif ip_items:
        status_var.set("Generated traffic search from IP IOC list.")
    elif domain_items:
        status_var.set("Generated DNS and Web searches from domain IOC list.")
    else:
        status_var.set("No valid items found.")


def load_templates_window() -> None:
    win = tk.Toplevel(root)
    win.title("Templates")
    win.geometry("1200x800")

    outer = ttk.Frame(win, padding=10)
    outer.pack(fill="both", expand=True)

    info = ttk.Label(
        outer,
        text="These templates are loaded from disk. Edit the template files manually for permanent changes.",
    )
    info.pack(anchor="w", pady=(0, 10))

    notebook = ttk.Notebook(outer)
    notebook.pack(fill="both", expand=True)

    for title, template_name in (
        ("Traffic Template", "traffic"),
        ("DNS Template", "dns"),
        ("Web Template", "web"),
    ):
        frame = ttk.Frame(notebook)
        notebook.add(frame, text=title)

        text = tk.Text(frame, wrap="word", font=("Courier", 10))
        text.pack(fill="both", expand=True)

        try:
            content = load_template(template_name)
        except Exception as exc:
            content = f"Error loading template:\n\n{exc}"

        text.insert("1.0", content)
        text.config(state="disabled")


root = tk.Tk()
root.title("SPL IOC Workbench")
root.geometry("1400x900")

main = ttk.Frame(root, padding=10)
main.pack(fill="both", expand=True)

top_controls = ttk.Frame(main)
top_controls.pack(fill="x", pady=(0, 8))

ttk.Button(top_controls, text="Generate Searches", command=generate_searches).pack(side="left", padx=4)
ttk.Button(top_controls, text="Clear", command=clear_all).pack(side="left", padx=4)
ttk.Button(top_controls, text="View Templates", command=load_templates_window).pack(side="left", padx=4)

detected_type_var = tk.StringVar(value="Detected type: n/a")
ttk.Label(top_controls, textvariable=detected_type_var).pack(side="left", padx=20)

status_var = tk.StringVar(value="Paste IPs and/or domains, then click Generate Searches.")
ttk.Label(main, textvariable=status_var).pack(anchor="w", pady=(0, 8))

upper_frame = ttk.LabelFrame(main, text="IOC Input (one per line)")
upper_frame.pack(fill="x", pady=(0, 8))

items_box = tk.Text(upper_frame, height=10, font=("Courier", 10))
items_box.pack(fill="both", expand=True, padx=5, pady=5)

notebook = ttk.Notebook(main)
notebook.pack(fill="both", expand=True)

traffic_tab = ttk.Frame(notebook)
dns_tab = ttk.Frame(notebook)
web_tab = ttk.Frame(notebook)

notebook.add(traffic_tab, text="Traffic")
notebook.add(dns_tab, text="DNS")
notebook.add(web_tab, text="Web")


def build_output_tab(parent: ttk.Frame, label: str):
    controls = ttk.Frame(parent)
    controls.pack(fill="x", pady=(5, 0))

    box = tk.Text(parent, wrap="word", font=("Courier", 10))
    box.pack(fill="both", expand=True, padx=5, pady=5)

    ttk.Button(
        controls,
        text=f"Copy {label}",
        command=lambda: copy_from(box, label),
    ).pack(side="left", padx=5, pady=5)

    return box


traffic_box = build_output_tab(traffic_tab, "Traffic")
dns_box = build_output_tab(dns_tab, "DNS")
web_box = build_output_tab(web_tab, "Web")

root.mainloop()
