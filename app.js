const iocInput = document.getElementById("iocInput");
const detectedType = document.getElementById("detectedType");
const statusMessage = document.getElementById("statusMessage");

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

function normalizeItems(text) {
  const seen = new Set();
  const items = [];

  for (const line of text.split("\n")) {
    const value = line.trim().replace(/,$/, "");
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

function renderTemplate(template, replacement) {
  if (!template || !template.includes("{{IOC_LIST}}")) {
    throw new Error("Template is missing {{IOC_LIST}} placeholder.");
  }

  return template.replaceAll("{{IOC_LIST}}", replacement);
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
    alert("Paste at least one IP or domain.");
    return;
  }

  const ips = items.filter(isIp);
  const domains = items.filter((item) => !isIp(item));

  updateCounts(items, ips, domains);

  const itemType = classifyItems(items);
  detectedType.textContent = `Detected type: ${itemType}`;

  try {
    trafficOutput.value = ips.length
      ? renderTemplate(window.TRAFFIC_TEMPLATE, formatIpItems(ips))
      : "";

    dnsOutput.value = domains.length
      ? renderTemplate(window.DNS_TEMPLATE, formatDomainItems(domains))
      : "";

    webOutput.value = domains.length
      ? renderTemplate(window.WEB_TEMPLATE, formatDomainItems(domains))
      : "";
  } catch (error) {
    setStatus(`Render error: ${error.message}`);
    return;
  }

  if (ips.length && domains.length) {
    setStatus("Generated traffic for IPs and DNS/Web for domains.");
  } else if (ips.length) {
    setStatus("Generated traffic search from IP IOC list.");
  } else if (domains.length) {
    setStatus("Generated DNS and Web searches from domain IOC list.");
  } else {
    setStatus("No valid items found.");
  }
}

function clearAll() {
  iocInput.value = "";
  clearOutputs();
  detectedType.textContent = "Detected type: n/a";
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

generateBtn.addEventListener("click", generateSearches);
clearBtn.addEventListener("click", clearAll);

setupTabs();
setupCopyButtons();
updateCounts([], [], []);
