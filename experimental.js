const experimentalTab = document.getElementById("experimentalTab");
const experimentalPanel = document.getElementById("experimentalPanel");
const experimentalPortableOutput = document.getElementById("experimentalPortableOutput");
const experimentalCompatOutput = document.getElementById("experimentalCompatOutput");
const experimentalRawOutput = document.getElementById("experimentalRawOutput");

function experimentalChunk(items, size = 50) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function experimentalRenderTemplate(template, replacements) {
  let rendered = template;
  Object.entries(replacements).forEach(([key, value]) => {
    rendered = rendered.replaceAll(`{{${key}}}`, value);
  });
  return rendered;
}

function experimentalQuotedList(items) {
  return items.map((item) => `"${item.replace(/"/g, '\\"')}"`).join(", ");
}

function experimentalTimeRange() {
  const selected = document.getElementById("timeRange");
  if (!selected || selected.value === "none") return "";

  if (selected.value === "custom") {
    const earliest = document.getElementById("customEarliest").value.trim();
    const latest = document.getElementById("customLatest").value.trim();
    if (!earliest || !latest) return "";
    return `earliest=${earliest} latest=${latest}`;
  }

  return selected.value;
}

function experimentalExtractIps() {
  if (typeof parseInput === "function") {
    const parsed = parseInput(document.getElementById("iocInput").value);
    return parsed.records
      .filter((record) => record.type === "ip")
      .map((record) => record.normalized);
  }

  return [];
}

function experimentalCopy(text, label) {
  navigator.clipboard.writeText(text)
    .then(() => {
      const status = document.getElementById("statusMessage");
      if (status) status.textContent = `Copied ${label} to clipboard.`;
    })
    .catch(() => {
      const status = document.getElementById("statusMessage");
      if (status) status.textContent = `Clipboard copy failed for ${label}.`;
    });
}

function experimentalRenderChunks(container, searches, label) {
  container.innerHTML = "";

  if (!searches.length) {
    const empty = document.createElement("div");
    empty.className = "empty-output";
    empty.textContent = "No IP indicators available for this experiment.";
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
      ? `${label} ${index + 1} of ${searches.length}`
      : label;

    const copyButton = document.createElement("button");
    copyButton.className = "secondary";
    copyButton.textContent = searches.length > 1 ? `Copy ${index + 1}` : "Copy";
    copyButton.addEventListener("click", () => experimentalCopy(search, label));

    const textarea = document.createElement("textarea");
    textarea.readOnly = true;
    textarea.spellcheck = false;
    textarea.value = search;

    toolbar.append(title, copyButton);
    card.append(toolbar, textarea);
    container.appendChild(card);
  });
}

function generateExperimentalSearches() {
  const ips = experimentalExtractIps();
  const timeRange = experimentalTimeRange();

  const portable = experimentalChunk(ips).map((items) =>
    experimentalRenderTemplate(window.EXPERIMENTAL_PORTABLE_TRAFFIC_TEMPLATE, {
      IOC_LIST: items.join(", "),
      TIME_RANGE: timeRange
    })
  );

  const compatibility = experimentalChunk(ips).map((items) =>
    experimentalRenderTemplate(window.EXPERIMENTAL_COMPAT_TRAFFIC_TEMPLATE, {
      IOC_LIST: items.join(", "),
      TIME_RANGE: timeRange
    })
  );

  const rawFallback = experimentalChunk(ips).map((items) =>
    experimentalRenderTemplate(window.EXPERIMENTAL_RAW_TRAFFIC_TEMPLATE, {
      QUOTED_IOC_LIST: experimentalQuotedList(items),
      TIME_RANGE: timeRange
    })
  );

  experimentalRenderChunks(experimentalPortableOutput, portable, "Portable Traffic");
  experimentalRenderChunks(experimentalCompatOutput, compatibility, "Compatibility Traffic");
  experimentalRenderChunks(experimentalRawOutput, rawFallback, "Raw Fallback Prototype");
}

function showExperimentalPanel() {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
  experimentalTab.classList.add("active");
  experimentalPanel.classList.add("active");
}

function hideExperimentalPanel() {
  experimentalTab.classList.remove("active");
  experimentalPanel.classList.remove("active");
}

experimentalTab.addEventListener("click", showExperimentalPanel);
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", hideExperimentalPanel);
});

document.getElementById("generateBtn").addEventListener("click", generateExperimentalSearches);
document.getElementById("clearBtn").addEventListener("click", () => {
  experimentalRenderChunks(experimentalPortableOutput, [], "Portable Traffic");
  experimentalRenderChunks(experimentalCompatOutput, [], "Compatibility Traffic");
  experimentalRenderChunks(experimentalRawOutput, [], "Raw Fallback Prototype");
});

experimentalRenderChunks(experimentalPortableOutput, [], "Portable Traffic");
experimentalRenderChunks(experimentalCompatOutput, [], "Compatibility Traffic");
experimentalRenderChunks(experimentalRawOutput, [], "Raw Fallback Prototype");
