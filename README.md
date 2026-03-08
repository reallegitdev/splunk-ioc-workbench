# SPL IOC Workbench

A lightweight graphical tool for generating Splunk SPL searches from lists of Indicators of Compromise (IOCs).

The workbench allows analysts to quickly convert raw threat intelligence indicators (IP addresses and domains) into ready-to-run SPL searches targeting common Splunk data models such as:

- Network Traffic
- DNS Resolution
- Web

The goal is to reduce manual search building and make IOC pivoting faster and more consistent across analysts.

---

## Features

- GUI-based workflow (no CLI required)
- Paste multiple IOCs at once
- Automatic IOC type detection
- Generates searches for:
  - Network Traffic
  - DNS
  - Web
- Deduplicates IOC lists
- Copy searches directly to clipboard
- Templates stored externally for easy modification
- Read-only template loading for safety

---

## Why This Exists

Threat intelligence feeds often provide long lists of indicators. Analysts frequently need to pivot those indicators into Splunk searches quickly to determine:

- whether the environment has communicated with known malicious infrastructure
- whether hosts have attempted resolution of suspicious domains
- whether web traffic includes malicious URLs

Manually building these searches is repetitive and error-prone.

The SPL IOC Workbench automates the generation of these searches while keeping the logic transparent and editable.

---

## Security Design

The tool intentionally avoids modifying the local environment.

The application:

- **reads templates**
- **renders searches**
- **displays results**

It does **not**:

- modify templates
- modify configuration
- deploy searches to Splunk
- write files automatically

All permanent changes must be made manually by editing the template files.

This design keeps the tool predictable and safe to run in sensitive environments.

---

## Project Structure


splunk-ioc-workbench
│
├── workbench.py
├── templates/
│ ├── traffic.tpl
│ ├── dns.tpl
│ └── web.tpl
│
├── README.md
└── LICENSE


Templates contain the SPL used to generate searches.

Example template placeholder:


{{IOC_LIST}}


The application replaces this placeholder with formatted indicators.

---

## Requirements

Python 3.10+

Standard library only:

- tkinter
- ipaddress
- pathlib

No external dependencies are required.

---

## Running the Workbench

Clone the repository:


git clone https://github.com/YOUR_USERNAME/splunk-ioc-workbench.git

cd splunk-ioc-workbench


Run the application:


python3 workbench.py


---

## Using the Tool

1. Paste IP addresses or domains into the input box (one per line)
2. Click **Generate Searches**
3. Review the generated searches in the tabs
4. Copy searches into Splunk

Example IOC list:


185.193.127.12
185.193.127.13
evil-domain.com


The tool will automatically generate appropriate searches for:

- traffic (IP indicators)
- DNS (domain indicators)
- web activity (domain indicators)

---

## Editing Templates

Templates are stored in the `templates/` directory.

Example:


templates/traffic.tpl


If you need to modify search logic, edit the template file directly.

For example:


All_Traffic.src IN ({{IOC_LIST}})


The workbench replaces `{{IOC_LIST}}` with the formatted indicator list.

Restart the application after modifying templates.

---

## Future Improvements

Possible future enhancements:

- additional IOC types (hashes, URLs)
- configurable time ranges
- dataset selection
- additional Splunk data models
- export search bundles
- IOC enrichment

---

## Author

Built as part of ongoing work on threat hunting and IOC operationalization workflows.
