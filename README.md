# SPL IOC Workbench

A small browser-based tool for turning IOC lists into ready-to-run Splunk searches.

**Live version:** https://reallegitdev.github.io/splunk-ioc-workbench/

It runs entirely in the browser with no backend, no installation, and no external dependencies.

## What it does

- Accepts IPs, domains, hostnames, URLs, and raw `Type,Value,...` CSV text
- Refangs common defanged domains and URLs
- Recognizes unsupported IOC types instead of silently dropping them
- Deduplicates normalized indicators
- Generates searches for Network Traffic, DNS, and Web data models
- Preserves full URLs for higher-fidelity Web searches
- Extracts hostnames from URLs for DNS searches
- Splits large searches into chunks of up to 50 indicators
- Supports preset and custom time ranges

## Search Scope

The **Search Scope** option controls how broadly domain, hostname, and URL indicators are searched.

- **Exact indicators only** — uses the IOC as provided. Full URLs stay full URLs; domains and hostnames are searched exactly.
- **Exact indicators + related host** — keeps the exact IOC and also adds the related hostname as a broader Web search.
- **Broad domain/host search** — uses wildcard host/domain matching for wider coverage.

Exact indicators only is the default.

## Input

The simplest format is one IOC per line:

```text
185.193.127.12
evil-domain.com
https://another-domain.net/login
```

Raw CSV text is also supported when the first columns contain an IOC type and value:

```text
Type,Value,Description
Domain,evil-domain.com,Example domain
URL,https://another-domain.net/login,Example URL
```

For CSV input, paste the raw CSV text. Copying cells directly from Excel may not preserve the original CSV format.

The Workbench currently generates searches from IPs, domains/hostnames, and URLs. Hashes, email addresses, filenames, paths, and scheduled-task values can be recognized and shown in validation results, but are not yet used to generate searches.

## Using it

1. Open `index.html` in a browser.
2. Paste IOC values or raw CSV text.
3. Choose a time range and search scope.
4. Click **Generate Searches**.
5. Review the validation summary and copy the generated SPL into Splunk.

If a search has more than 50 targets, the Workbench creates multiple numbered searches automatically.

## Validation

The validation summary shows input counts, supported and unsupported IOC types, duplicates, rejected values, and the number of search targets left after normalization.

## Project structure

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

The SPL templates are kept separate from the application logic so they can be adjusted without rewriting the parser or UI.

## Security

All parsing and SPL generation happens locally in the browser. The Workbench does not send IOC data to external services, run system commands, or modify local files.
