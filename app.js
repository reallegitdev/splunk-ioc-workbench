const CHUNK_SIZE = 50;

const iocInput = document.getElementById("iocInput");
const detectedType = document.getElementById("detectedType");
const statusMessage = document.getElementById("statusMessage");

const timeRange = document.getElementById("timeRange");
const customTimeRangeFields = document.getElementById("customTimeRangeFields");
const customEarliest = document.getElementById("customEarliest");
const customLatest = document.getElementById("customLatest");
const selectedRangeLabel = document.getElementById("selectedRangeLabel");
const matchMode = document.getElementById("matchMode");

const trafficOutput = document.getElementById("trafficOutput");
const dnsOutput = document.getElementById("dnsOutput");
const webOutput = document.getElementById("webOutput");

const totalCount = document.getElementById("totalCount");
const ipCount = document.getElementById("ipCount");
const domainCount = document.getElementById("domainCount");
const urlCount = document.getElementById("urlCount");
const unsupportedCount = document.getElementById("unsupportedCount");
const duplicateCount = document.getElementById("duplicateCount");
const rejectedCount = document.getElementById("rejectedCount");
const validationReport = document.getElementById("validationReport");

const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");

const CSV_TYPES = new Set([
  "domain", "hostname", "url", "ip", "ipv4", "ipv6", "sha256", "sha1", "md5",
  "hash", "email", "filename", "path", "scheduled task"
]);

function isIp(value) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("/")) return false;

  const ipv4Parts = trimmed.split(".");
  if (ipv4Parts.length === 4) {
    return ipv4Parts.every((part) => {
      if (!/^\d+$/.test(part)) return false;
      const num = Number(part);
      return num >= 0 && num <= 255;
    });
  }

  return /^([a-fA-F0-9:]+)$/.test(trimmed) && trimmed.includes(":");
}

function isDomain(value) {
  if (!value || value.length > 253 || value.includes(" ") || value.includes("/")) return false;
  const candidate = value.replace(/\.$/, "");
  if (!candidate.includes(".")) return false;

  return candidate.split(".").every((label) =>
    label.length > 0 &&
    label.length <= 63 &&
    /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label)
  );
}

function refang(value) {
  return value
    .replace(/^hxxps?:\/\//i, (match) =>
      match.toLowerCase().startsWith("hxxps") ? "https://" : "http://"
    )
    .replace(/\[\.\]|\(\.\)|\{\.\}/g, ".")
    .replace(/\[(dot)\]|\((dot)\)|\{(dot)\}/gi, ".");
}

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

function extractLineValue(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  if (trimmed.includes(",")) {
    const fields = parseCsvLine(trimmed);
    const typeHint = (fields[0] || "").trim();
    const normalizedHint = typeHint.toLowerCase();

    if (normalizedHint === "type" && (fields[1] || "").trim().toLowerCase() === "value") {
      return { skip: true };
    }

    if (CSV_TYPES.has(normalizedHint) && fields[1]) {
      return {
        value: fields[1].trim(),
        typeHint
      };
    }
  }

  return {
    value: trimmed.replace(/,$/, ""),
    typeHint: ""
  };
}

function parseUrl(value) {
  const refanged = refang(value.trim());
  const hasScheme = /^https?:\/\//i.test(refanged);
  const looksLikeUrl = hasScheme || (
    !refanged.includes(" ") &&
    /[/?#]/.test(refanged) &&
    !/^[A-Za-z]:[\\/]/.test(refanged)
  );

  if (!looksLikeUrl) return null;

  const candidate = hasScheme ? refanged : `http://${refanged}`;

  try {
    const parsed = new URL(candidate);
    if (!isDomain(parsed.hostname) && !isIp(parsed.hostname)) return null;

    const normalizedPath = `${parsed.pathname || "/"}${parsed.search || ""}`;
    const authorityMatch = candidate.match(/^[a-z]+:\/\/([^/?#]+)/i);
    const authority = (authorityMatch ? authorityMatch[1] : parsed.host)
      .replace(/^.*@/, "")
      .toLowerCase();

    return {
      normalized: `${parsed.protocol}//${authority}${normalizedPath}`,
      host: parsed.hostname.toLowerCase().replace(/\.$/, ""),
      webTarget: `${authority}${normalizedPath}`
    };
  } catch {
    return null;
  }
}

function classifyValue(rawValue, typeHint = "") {
  const value = refang(rawValue.trim());
  const hint = typeHint.toLowerCase();

  if (!value) return { type: "rejected", normalized: value, reason: "empty value" };

  if (hint === "scheduled task") {
    return { type: "scheduled_task", normalized: value, searchable: false };
  }

  const url = parseUrl(value);
  if (url || hint === "url") {
    if (!url) return { type: "rejected", normalized: value, reason: "invalid URL" };
    return { type: "url", normalized: url.normalized, host: url.host, webTarget: url.webTarget, searchable: true };
  }

  if (isIp(value) || hint === "ip" || hint === "ipv4" || hint === "ipv6") {
    if (!isIp(value)) return { type: "rejected", normalized: value, reason: "invalid IP address" };
    return { type: "ip", normalized: value.toLowerCase(), searchable: true };
  }

  if (/^[A-Fa-f0-9]{64}$/.test(value) || hint === "sha256") {
    return { type: "sha256", normalized: value.toLowerCase(), searchable: false };
  }

  if (/^[A-Fa-f0-9]{40}$/.test(value) || hint === "sha1") {
    return { type: "sha1", normalized: value.toLowerCase(), searchable: false };
  }

  if (/^[A-Fa-f0-9]{32}$/.test(value) || hint === "md5") {
    return { type: "md5", normalized: value.toLowerCase(), searchable: false };
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || hint === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return { type: "rejected", normalized: value, reason: "invalid email address" };
    }
    return { type: "email", normalized: value.toLowerCase(), searchable: false };
  }

  const domainValue = value.toLowerCase().replace(/\.$/, "");
  if (isDomain(domainValue) || hint === "domain" || hint === "hostname") {
    if (!isDomain(domainValue)) {
      return { type: "rejected", normalized: value, reason: "invalid domain/hostname" };
    }
    return { type: "domain", normalized: domainValue, searchable: true };
  }

  if (hint === "path" || /^[A-Za-z]:[\\/]/.test(value) || /^\/(?:[^/\0]+\/?)+$/.test(value)) {
    return { type: "path", normalized: value, searchable: false };
  }

  if (hint === "filename" || /^[^\\/:*?"<>|\s]+\.[A-Za-z0-9]{1,10}$/.test(value)) {
    return { type: "filename", normalized: value, searchable: false };
  }

  return { type: "rejected", normalized: value, reason: "unrecognized IOC format" };
}

function parseInput(text) {
  const records = [];
  const duplicates = [];
  const rejected = [];
  const seen = new Set();
  let sourceLines = 0;

  text.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;

    const extracted = extractLineValue(line);
    if (!extracted || extracted.skip) return;
    sourceLines += 1;

    const record = classifyValue(extracted.value, extracted.typeHint);
    record.original = extracted.value;
    record.lineNumber = index + 1;
    record.typeHint = extracted.typeHint;

    if (record.type === "rejected") {
      rejected.push(record);
      return;
    }

    const key = `${record.type}:${record.normalized}`;
    if (seen.has(key)) {
      duplicates.push(record);
      return;
    }

    seen.add(key);
    records.push(record);
  });

  return { records, duplicates, rejected, sourceLines };
}

function unique(items) {
  return [...new Set(items)];
}

function chunk(items, size = CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function escapeSplString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function getDnsTargets(records) {
  return unique(records.flatMap((record) => {
    if (record.type === "domain") return [record.normalized];
    if (record.type === "url") return [record.host];
    return [];
  }));
}

function getWebTargets(records, mode) {
  const urls = records.filter((record) => record.type === "url");
  const domains = records.filter((record) => record.type === "domain");
  const urlHosts = new Set(urls.map((record) => record.host));

  if (mode === "broad") {
    return unique([
      ...urls.map((record) => ({ kind: "host", value: record.host })),
      ...domains.map((record) => ({ kind: "host", value: record.normalized }))
    ].map((item) => `${item.kind}:${item.value}`))
      .map((key) => {
        const [, ...parts] = key.split(":");
        return { kind: "host", value: parts.join(":") };
      });
  }

  const targets = urls.map((record) => ({ kind: "url", value: record.webTarget }));

  domains.forEach((record) => {
    if (!urlHosts.has(record.normalized)) {
      targets.push({ kind: "host", value: record.normalized });
    }
  });

  if (mode === "include_broad") {
    urls.forEach((record) => {
      targets.push({ kind: "host", value: record.host });
    });
  }

  const seen = new Set();
  return targets.filter((target) => {
    const key = `${target.kind}:${target.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatDnsItems(items, broad) {
  return items
    .map((item, index) => {
      const target = broad ? `*${item}*` : item;
      return `        ${index ? "OR " : ""}DNS.query="${escapeSplString(target)}"`;
    })
    .join("\n");
}

function formatWebItems(items) {
  return items
    .map((item, index) =>
      `        ${index ? "OR " : ""}Web.url="*${escapeSplString(item.value)}*"`
    )
    .join("\n");
}

function formatIpItems(items) {
  return items.join(", ");
}

function renderTemplate(template, replacements) {
  let rendered = template;

  for (const [placeholder, value] of Object.entries(replacements)) {
    const token = `{{${placeholder}}}`;
    if (!rendered.includes(token)) {
      throw new Error(`Template is missing ${token} placeholder.`);
    }
    rendered = rendered.replaceAll(token, value);
  }

  return rendered;
}

function buildSearches(records, timeConfig, mode) {
  const ips = records.filter((record) => record.type === "ip").map((record) => record.normalized);
  const dnsTargets = getDnsTargets(records);
  const webTargets = getWebTargets(records, mode);

  const trafficSearches = chunk(ips).map((items) =>
    renderTemplate(window.TRAFFIC_TEMPLATE, {
      IOC_LIST: formatIpItems(items),
      TIME_RANGE: timeConfig.clause
    })
  );

  const dnsSearches = chunk(dnsTargets).map((items) =>
    renderTemplate(window.DNS_TEMPLATE, {
      IOC_LIST: formatDnsItems(items, mode === "broad"),
      TIME_RANGE: timeConfig.clause
    })
  );

  const webSearches = chunk(webTargets).map((items) =>
    renderTemplate(window.WEB_TEMPLATE, {
      IOC_LIST: formatWebItems(items),
      TIME_RANGE: timeConfig.clause
    })
  );

  return {
    trafficSearches,
    dnsSearches,
    webSearches,
    counts: {
      ips: ips.length,
      dnsTargets: dnsTargets.length,
      webTargets: webTargets.length
    }
  };
}

function renderSearchChunks(container, searches, label) {
  container.innerHTML = "";

  if (!searches.length) {
    const empty = document.createElement("div");
    empty.className = "empty-output";
    empty.textContent = `No ${label} search generated for the current IOC set.`;
    container.appendChild(empty);
    return;
  }

  searches.forEach((search, index) => {
    const card = document.createElement("div");
    card.className = "search-chunk";

    const toolbar = document.createElement("div");
    toolbar.className = "output-toolbar";

    const title = document.createElement("span");
    title.textContent = searches.length > 1
      ? `${label} Search ${index + 1} of ${searches.length}`
      : `${label} Search`;

    const copyButton = document.createElement("button");
    copyButton.className = "secondary";
    copyButton.textContent = searches.length > 1
      ? `Copy ${label} ${index + 1}`
      : `Copy ${label}`;
    copyButton.addEventListener("click", () => copyText(search, `${label} search ${index + 1}`));

    const textarea = document.createElement("textarea");
    textarea.readOnly = true;
    textarea.spellcheck = false;
    textarea.value = search;

    toolbar.append(title, copyButton);
    card.append(toolbar, textarea);
    container.appendChild(card);
  });
}

function copyText(text, label) {
  navigator.clipboard.writeText(text)
    .then(() => setStatus(`Copied ${label} to clipboard.`))
    .catch(() => setStatus(`Clipboard copy failed for ${label}.`));
}

function validateTemplates() {
  const missing = [];
  if (!window.TRAFFIC_TEMPLATE) missing.push("traffic-template.js");
  if (!window.DNS_TEMPLATE) missing.push("dns-template.js");
  if (!window.WEB_TEMPLATE) missing.push("web-template.js");

  if (missing.length) {
    throw new Error(`Missing template files: ${missing.join(", ")}`);
  }
}

function updateTimeRangeVisibility() {
  customTimeRangeFields.classList.toggle("hidden", timeRange.value !== "custom");
}

function getTimeRangeConfig() {
  const selectedText = timeRange.options[timeRange.selectedIndex].text;
  const selectedValue = timeRange.value;

  if (selectedValue === "none") {
    return { label: "None", clause: "" };
  }

  if (selectedValue === "custom") {
    const earliest = customEarliest.value.trim();
    const latest = customLatest.value.trim();

    if (!earliest || !latest) {
      throw new Error("Custom time range requires both Earliest and Latest values.");
    }

    return {
      label: `Custom (${earliest} to ${latest})`,
      clause: `earliest=${earliest} latest=${latest}`
    };
  }

  return { label: selectedText, clause: selectedValue };
}

function updateValidationSummary(parsed, searchInfo = null) {
  const records = parsed.records;
  const ips = records.filter((record) => record.type === "ip");
  const domains = records.filter((record) => record.type === "domain");
  const urls = records.filter((record) => record.type === "url");
  const unsupported = records.filter((record) => !record.searchable);

  totalCount.textContent = String(parsed.sourceLines);
  ipCount.textContent = String(ips.length);
  domainCount.textContent = String(domains.length);
  urlCount.textContent = String(urls.length);
  unsupportedCount.textContent = String(unsupported.length);
  duplicateCount.textContent = String(parsed.duplicates.length);
  rejectedCount.textContent = String(parsed.rejected.length);

  const typeCounts = records.reduce((counts, record) => {
    counts[record.type] = (counts[record.type] || 0) + 1;
    return counts;
  }, {});

  const report = [];
  report.push(`Input lines: ${parsed.sourceLines}`);
  report.push(`Recognized: ${records.length}`);
  report.push(`Searchable now: ${ips.length + domains.length + urls.length}`);
  report.push(`Duplicates removed: ${parsed.duplicates.length}`);
  report.push(`Recognized but unsupported: ${unsupported.length}`);
  report.push(`Rejected: ${parsed.rejected.length}`);

  if (searchInfo) {
    report.push("");
    report.push("Search targets after normalization:");
    report.push(`  Traffic: ${searchInfo.counts.ips}`);
    report.push(`  DNS: ${searchInfo.counts.dnsTargets}`);
    report.push(`  Web: ${searchInfo.counts.webTargets}`);
    report.push(`Chunk size: ${CHUNK_SIZE}`);
  }

  if (unsupported.length) {
    report.push("");
    report.push("Unsupported recognized types:");
    Object.entries(typeCounts)
      .filter(([type]) => !["ip", "domain", "url"].includes(type))
      .forEach(([type, count]) => report.push(`  ${type}: ${count}`));
  }

  if (parsed.duplicates.length) {
    report.push("");
    report.push("Duplicates removed:");
    parsed.duplicates.slice(0, 20).forEach((record) =>
      report.push(`  Line ${record.lineNumber}: ${record.original}`)
    );
    if (parsed.duplicates.length > 20) {
      report.push(`  ...and ${parsed.duplicates.length - 20} more`);
    }
  }

  if (parsed.rejected.length) {
    report.push("");
    report.push("Rejected input:");
    parsed.rejected.slice(0, 20).forEach((record) =>
      report.push(`  Line ${record.lineNumber}: ${record.original} (${record.reason})`)
    );
    if (parsed.rejected.length > 20) {
      report.push(`  ...and ${parsed.rejected.length - 20} more`);
    }
  }

  validationReport.textContent = report.join("\n");

  const searchableTypes = [
    ips.length ? "IP" : null,
    domains.length ? "domain/host" : null,
    urls.length ? "URL" : null
  ].filter(Boolean);

  detectedType.textContent = searchableTypes.length
    ? `Detected: ${searchableTypes.join(", ")}`
    : "Detected: no searchable IOCs";
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function clearOutputs() {
  renderSearchChunks(trafficOutput, [], "Traffic");
  renderSearchChunks(dnsOutput, [], "DNS");
  renderSearchChunks(webOutput, [], "Web");
}

function generateSearches() {
  try {
    validateTemplates();
  } catch (error) {
    setStatus(error.message);
    alert(error.message);
    return;
  }

  const parsed = parseInput(iocInput.value);

  if (!parsed.records.length && !parsed.rejected.length) {
    alert("Paste at least one IOC.");
    return;
  }

  let timeConfig;
  try {
    timeConfig = getTimeRangeConfig();
  } catch (error) {
    setStatus(error.message);
    alert(error.message);
    return;
  }

  const mode = matchMode.value;

  try {
    const searchInfo = buildSearches(parsed.records, timeConfig, mode);

    renderSearchChunks(trafficOutput, searchInfo.trafficSearches, "Traffic");
    renderSearchChunks(dnsOutput, searchInfo.dnsSearches, "DNS");
    renderSearchChunks(webOutput, searchInfo.webSearches, "Web");

    selectedRangeLabel.textContent = timeConfig.label;
    updateValidationSummary(parsed, searchInfo);

    const totalSearches =
      searchInfo.trafficSearches.length +
      searchInfo.dnsSearches.length +
      searchInfo.webSearches.length;

    setStatus(
      `Generated ${totalSearches} search${totalSearches === 1 ? "" : "es"} ` +
      `in chunks of up to ${CHUNK_SIZE} using ${timeConfig.label.toLowerCase()}.`
    );
  } catch (error) {
    setStatus(`Render error: ${error.message}`);
  }
}

function clearAll() {
  iocInput.value = "";
  customEarliest.value = "";
  customLatest.value = "";
  timeRange.value = "earliest=-30m latest=now";
  matchMode.value = "high_fidelity";

  updateTimeRangeVisibility();
  clearOutputs();

  detectedType.textContent = "Detected type: n/a";
  selectedRangeLabel.textContent = "Last 30 minutes";
  validationReport.textContent = "Generate searches to see normalization and validation details.";

  totalCount.textContent = "0";
  ipCount.textContent = "0";
  domainCount.textContent = "0";
  urlCount.textContent = "0";
  unsupportedCount.textContent = "0";
  duplicateCount.textContent = "0";
  rejectedCount.textContent = "0";
  setStatus("Cleared.");
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const panels = {
    traffic: document.getElementById("trafficPanel"),
    dns: document.getElementById("dnsPanel"),
    web: document.getElementById("webPanel")
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => item.classList.remove("active"));
      Object.values(panels).forEach((panel) => panel.classList.remove("active"));

      tab.classList.add("active");
      panels[tab.dataset.tab].classList.add("active");
    });
  });
}

timeRange.addEventListener("change", updateTimeRangeVisibility);
generateBtn.addEventListener("click", generateSearches);
clearBtn.addEventListener("click", clearAll);

setupTabs();
updateTimeRangeVisibility();
clearOutputs();
selectedRangeLabel.textContent = timeRange.options[timeRange.selectedIndex].text;
