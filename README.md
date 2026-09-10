# SPL IOC Workbench

A lightweight, browser-based tool for turning IOC lists into ready-to-run Splunk SPL searches.

SPL IOC Workbench is designed for analysts who need to move quickly from threat intelligence to hunting without manually rebuilding the same searches over and over. Paste indicators, choose a time range and search scope, and the Workbench generates searches for common Splunk data models.

The application runs entirely in the browser and requires **no backend services, no installation, and no external dependencies**.

---

## Features

- Browser-based graphical interface
- Runs completely locally
- No installation or backend server required
- Accepts one IOC per line or raw `Type,Value,...` CSV rows
- Refangs common defanged domains and URLs
- Recognizes IP addresses, domains/hostnames, URLs, hashes, email addresses, filenames, paths, and scheduled-task values
- Separates searchable indicators from recognized-but-unsupported values and rejected input
- Deduplicates normalized indicators
- Preserves full URL paths for higher-fidelity Web searches
- Extracts hostnames from URLs for DNS searching
- Provides three analyst-friendly Search Scope options:
  - **Exact indicators only**
  - **Exact indicators + related host**
  - **Broad domain/host search**
- Supports preset and custom time ranges
- Automatically splits large searches into chunks of up to 50 indicators
- Generates searches for:
  - Network Traffic
  - DNS
  - Web
- Displays validation and normalization details before the analyst runs the search
- Provides independent copy controls for each generated search chunk
- Keeps SPL templates separate from application logic

---

## Security Model

This tool is designed to be safe to run in restricted environments.

The application:

- Runs entirely in the browser
- Does not connect to external services
- Does not modify local files
- Does not execute system commands
- Does not transmit IOC data anywhere

All parsing, normalization, validation, and SPL generation happens locally in the browser.

---

## Supported Input

The simplest input format is one IOC per line:

```text
185.193.127.12
evil-domain.com
https://another-domain.net/login
```

The Workbench also accepts raw CSV text when the first columns contain an IOC type and value, for example:

```text
Type,Value,Description
Domain,evil-domain.com,Example domain
URL,https://another-domain.net/login,Example URL
SHA256,0123456789abcdef...,Example hash
```

For CSV input, paste the **raw CSV text** rather than a range of cells copied from Excel. Spreadsheet applications may place tabular clipboard data on the clipboard instead of the original comma-separated text.

The Workbench currently generates searches from:

- IP addresses
- Domains and hostnames
- URLs

Other recognized IOC types are reported in validation results but are not yet included in generated searches. These include hashes, email addresses, filenames, paths, and scheduled-task values.

---

## Search Scope

The **Search Scope** control determines how broadly the Workbench expands domain, hostname, and URL indicators.

### Exact indicators only

Uses the highest-fidelity IOC available. Full URLs remain full URL targets for Web searches, while domains and hostnames are searched exactly. This is the default mode.

### Exact indicators + related host

Keeps the exact IOC search and also adds the related hostname as a broader Web pivot.

### Broad domain/host search

Uses wildcard host/domain matching to increase coverage when the analyst intentionally wants a wider search.

For DNS searches, hostnames are derived from URLs because DNS telemetry does not contain URL paths.

---

## Large IOC Lists

Generated searches are automatically split into chunks of up to **50 indicators**.

Each chunk is rendered as a separate valid Splunk search with its own copy button. This keeps large campaign IOC sets manageable and avoids producing one oversized SPL statement.

---

## Validation

After generation, the Workbench reports:

- Input lines
- IP count
- Domain/hostname count
- URL count
- Recognized but unsupported values
- Duplicates removed
- Rejected input
- Search targets remaining after normalization
- Selected time range

Validation details also identify rejected entries and unsupported IOC types so indicators do not silently disappear from the workflow.

---

## Running the Workbench

No installation is required.

Open:

```text
index.html
```

in a modern browser.

Because the application is entirely client-side, it can also be copied to an offline or restricted workstation and run locally.

---

## Usage

1. Paste IOC values or raw CSV text into the **IOC Input** field.
2. Select the desired **Time Range**.
3. Select the desired **Search Scope**.
4. Click **Generate Searches**.
5. Review the validation summary.
6. Open the Traffic, DNS, or Web tab as appropriate.
7. Copy the generated search into Splunk.

When more than 50 search targets are present for a data model, the Workbench automatically creates multiple numbered searches.

---

## Generated Searches

### Network Traffic

IP indicators generate searches against the `Network_Traffic` data model.

### DNS

Domains, hostnames, and hostnames derived from URL indicators generate searches against the `Network_Resolution.DNS` data model.

### Web

Domain, hostname, and URL indicators generate searches against the `Web.Web` data model.

In the default Search Scope, full URLs retain their path and port information where available so higher-fidelity indicators are searched before broader host-level pivots.

---

## Time Ranges

The Workbench includes the following built-in ranges:

- None
- Last 15 minutes
- Last 30 minutes
- Last 24 hours
- Last 7 days
- Last 30 days
- Last 90 days
- Custom

Custom ranges allow analysts to provide Splunk-compatible earliest and latest values.

---

## Project Structure

```text
splunk-ioc-workbench/
├── index.html
├── style.css
├── app.js
├── templates/
│   ├── traffic-template.js
│   ├── dns-template.js
│   └── web-template.js
├── LICENSE
└── README.md
```

### `index.html`

Defines the user interface and controls.

### `style.css`

Handles the visual layout and styling.

### `app.js`

Contains application logic including:

- IOC parsing and refanging
- CSV row handling
- IOC classification and validation
- URL normalization and hostname extraction
- Deduplication
- Search-scope handling
- 50-indicator chunking
- SPL generation
- Tab and clipboard behavior

### `templates/`

Contains the Splunk search templates used to generate output.

Templates use placeholders such as:

```text
{{IOC_LIST}}
{{TIME_RANGE}}
```

The application replaces these placeholders with normalized indicator predicates and the selected time range.

---

## Editing Templates

Templates are stored in the `templates/` directory and can be adjusted without rewriting the input or UI logic.

The current templates target Splunk CIM data models for Network Traffic, DNS, and Web activity.

---

## Design Goals

The Workbench is intentionally small and focused. Its goals are to:

- Reduce repetitive manual SPL creation
- Preserve high-fidelity threat intelligence wherever possible
- Make input handling transparent rather than silently dropping indicators
- Keep the interface simple and approachable for analysts who were not involved in the tool's development
- Produce readable, practical searches for real threat-hunting workflows
- Keep the application transparent and auditable
- Avoid backend services, external dependencies, and unnecessary platform complexity
- Remain usable in restricted or offline environments

---

## Future Improvements

Possible future enhancements include:

- File-hash search support
- Additional Splunk data models
- Additional IOC types
- Environment or client-specific search presets
- Additional export options
- Further template customization

The project is intended to remain a lightweight analyst utility rather than become a full threat-intelligence platform.

---

## Author

Developed as part of ongoing work to streamline threat intelligence operational workflows and improve IOC-driven threat hunting.
