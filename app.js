const iocInput = document.getElementById("iocInput");
const detectedType = document.getElementById("detectedType");
const statusMessage = document.getElementById("statusMessage");

const timeRange = document.getElementById("timeRange");
const customTimeRangeFields = document.getElementById("customTimeRangeFields");
const customEarliest = document.getElementById("customEarliest");
const customLatest = document.getElementById("customLatest");
const selectedRangeLabel = document.getElementById("selectedRangeLabel");

const trafficOutput = document.getElementById("trafficOutput");
const dnsOutput = document.getElementById("dnsOutput");
const webOutput = document.getElementById("webOutput");

const totalCount = document.getElementById("totalCount");
const ipCount = document.getElementById("ipCount");
const domainCount = document.getElementById("domainCount");

const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");

function isIp(value) {
  const trimmed = value.trim();

  if (!trimmed) return false;
  if (trimmed.includes("/")) return false;

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

function parseUrlHost(value) {
  const raw = value.trim();
  if (!raw || isIp(raw)) return null;

  const defanged = raw
    .replace(/^hxxps?:\/\//i, (match) => match.toLowerCase().startsWith("hxxps") ? "https://" : "http://")
    .replace(/\[\.\]/g, ".");

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(defanged);
  const shouldTryAsUrl = hasScheme || /[/?#]/.test(defanged) || (defanged.includes(":") && !defanged.includes(" "));

  if (!shouldTryAsUrl) return null;

  const candidate = hasScheme ? defanged : `http://${defanged}`;

  try {
    const parsed = new URL(candidate);
    return parsed.hostname.replace(/\.$/, "");
  } catch {
    return null;
  }
}

function normalizeItems(text) {
  const seen = new Set();
  const items = [];

  for (const line of text.split("\n")) {
    const cleaned = line.trim().replace(/,$/, "");
    const value = parseUrlHost(cleaned) || cleaned;
    if (!value) continue;

    if (!seen.has(value)) {
      seen.add(value);
      items.push(value);
    }
  }

  return items;
}

function classifyItems(items) {
  if (!items.length) return "unknown";

  const ips = items.filter(isIp).length;
  const domains = items.length - ips;

  if (ips === items.length) return "ip";
  if (domains === items.length) return "domain";
  if (ips >= domains) return "mixed_ip";
  return "mixed_domain";
}

function formatIpItems(items) {
  return items.join(", ");
}

function formatDomainItems(items) {
  return items.map((item) => `"*${item}*"`).join(", ");
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

function updateCounts(items, ips, domains) {
  totalCount.textContent = String(items.length);
  ipCount.textContent = String(ips.length);
  domainCount.textContent = String(domains.length);
}

function clearOutputs() {
  trafficOutput.value = "";
  dnsOutput.value = "";
  webOutput.value = "";
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function copyOutput(targetId, label) {
  const source = document.getElementById(targetId);

  if (!source.value.trim()) {
    setStatus(`No ${label} search has been generated yet.`);
    return;
  }

  navigator.clipboard.writeText(source.value)
  .then(() => setStatus(`Copied ${label} search to clipboard.`))
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
  const selectedValue = timeRange.value;

  if (selectedValue === "custom") {
    customTimeRangeFields.classList.remove("hidden");
  } else {
    customTimeRangeFields.classList.add("hidden");
  }
}

function getTimeRangeConfig() {
  const selectedText = timeRange.options[timeRange.selectedIndex].text;
  const selectedValue = timeRange.value;

  if (selectedValue === "none") {
    return {
      label: "None",
      clause: ""
    };
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

  return {
    label: selectedText,
    clause: selectedValue
  };
}

function generateSearches() {
  try {
    validateTemplates();
  } catch (error) {
    setStatus(error.message);
    alert(error.message);
    return;
  }

  const raw = iocInput.value;
  const items = normalizeItems(raw);

  if (!items.length) {
    alert("Paste at least one IP, domain, or URL.");
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

  const ips = items.filter(isIp);
  const domains = items.filter((item) => !isIp(item));

  updateCounts(items, ips, domains);

  const itemType = classifyItems(items);
  detectedType.textContent = `Detected type: ${itemType}`;
  selectedRangeLabel.textContent = timeConfig.label;

  try {
    trafficOutput.value = ips.length
    ? renderTemplate(window.TRAFFIC_TEMPLATE, {
      IOC_LIST: formatIpItems(ips),
                     TIME_RANGE: timeConfig.clause
    })
    : "";

    dnsOutput.value = domains.length
    ? renderTemplate(window.DNS_TEMPLATE, {
      IOC_LIST: formatDomainItems(domains),
                     TIME_RANGE: timeConfig.clause
    })
    : "";

    webOutput.value = domains.length
    ? renderTemplate(window.WEB_TEMPLATE, {
      IOC_LIST: formatDomainItems(domains),
                     TIME_RANGE: timeConfig.clause
    })
    : "";
  } catch (error) {
    setStatus(`Render error: ${error.message}`);
    return;
  }

  if (ips.length && domains.length) {
    setStatus(`Generated traffic for IPs and DNS/Web for domains/URLs using ${timeConfig.label.toLowerCase()}.`);
  } else if (ips.length) {
    setStatus(`Generated traffic search from IP IOC list using ${timeConfig.label.toLowerCase()}.`);
  } else if (domains.length) {
    setStatus(`Generated DNS and Web searches from domain/URL IOC list using ${timeConfig.label.toLowerCase()}.`);
  } else {
    setStatus("No valid items found.");
  }
}

function clearAll() {
  iocInput.value = "";
  customEarliest.value = "";
  customLatest.value = "";
  timeRange.value = "earliest=-30m latest=now";

  updateTimeRangeVisibility();
  clearOutputs();

  detectedType.textContent = "Detected type: n/a";
  selectedRangeLabel.textContent = "Last 30 minutes";

  updateCounts([], [], []);
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
      tabs.forEach((t) => t.classList.remove("active"));
      Object.values(panels).forEach((panel) => panel.classList.remove("active"));

      tab.classList.add("active");
      panels[tab.dataset.tab].classList.add("active");
    });
  });
}

function setupCopyButtons() {
  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.copyTarget;
      const label = button.textContent.replace("Copy ", "");
      copyOutput(targetId, label);
    });
  });
}

timeRange.addEventListener("change", updateTimeRangeVisibility);

generateBtn.addEventListener("click", generateSearches);
clearBtn.addEventListener("click", clearAll);

setupTabs();
setupCopyButtons();
updateCounts([], [], []);
updateTimeRangeVisibility();
selectedRangeLabel.textContent = timeRange.options[timeRange.selectedIndex].text;
