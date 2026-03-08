# SPL IOC Workbench

A lightweight, browser-based tool for generating Splunk SPL searches from lists of Indicators of Compromise (IOCs).

The SPL IOC Workbench allows analysts to quickly convert threat intelligence indicators such as IP addresses and domains into ready-to-run Splunk searches targeting common data models.

The application runs entirely in the browser and requires **no backend services, no installation, and no external dependencies**.

---

## Features

- Browser-based graphical interface
- Runs completely locally
- No installation required
- No backend server required
- Paste multiple IOCs at once
- Automatic IOC type detection
- Deduplicates IOC lists
- Generates searches for:
  - Network Traffic
  - DNS
  - Web
- Copy searches directly to clipboard
- Templates separated from application logic

---

## Security Model

This tool is designed to be safe to run in restricted environments.

The application:

- Runs entirely in the browser
- Does not connect to external services
- Does not modify local files
- Does not execute system commands
- Does not transmit data anywhere

All logic executes locally within the browser.

The application only performs:

1. IOC normalization
2. IOC type detection
3. Template rendering

---

## Project Structure


splunk-ioc-workbench
│
├── index.html
├── style.css
├── app.js
│
├── templates/
│ ├── traffic-template.js
│ ├── dns-template.js
│ └── web-template.js
│
└── README.md


### index.html

Defines the user interface layout.

### style.css

Handles visual styling of the application.

### app.js

Contains application logic including:

- IOC parsing
- IOC classification
- search generation
- tab handling
- clipboard functionality

### templates/

Contains the Splunk search templates used to generate output.

Each template file defines a global template variable that the application loads at runtime.

Example placeholder used in templates:


{{IOC_LIST}}


This placeholder is replaced with the formatted IOC list when generating searches.

---

## Running the Workbench

No installation is required.

Simply open the application in a browser:


index.html


Double-click the file or open it with your preferred browser.

---

## Usage

1. Paste IP addresses or domains into the IOC input field (one per line)
2. Click **Generate Searches**
3. Review generated searches in the output tabs
4. Copy searches into Splunk

Example input:


185.193.127.12
185.193.127.13
evil-domain.com


The application will generate:

- Network traffic searches for IP indicators
- DNS searches for domain indicators
- Web searches for domain indicators

---

## Editing Templates

Templates are stored in the `templates/` directory.

Example:


templates/traffic-template.js


Each template file defines the SPL used to generate searches.

Example snippet:


All_Traffic.src IN ({{IOC_LIST}})


The application replaces `{{IOC_LIST}}` with the formatted indicator list during search generation.

---

## Design Goals

This project was designed with several goals in mind:

- Reduce repetitive manual search creation
- Provide a simple interface usable by analysts at any skill level
- Keep the application transparent and auditable
- Avoid complex dependencies or backend services
- Ensure the tool can run in restricted or offline environments

---

## Future Improvements

Potential enhancements may include:

- URL IOC support
- File hash IOC support
- Customizable time ranges
- Additional Splunk data model support
- Export options
- Configurable templates

---

## Author

Developed as part of ongoing work to streamline threat intelligence operational workflows and improve IOC-driven threat hunting.
