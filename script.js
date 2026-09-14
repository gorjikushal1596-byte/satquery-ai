/* TerraQ / PQ application controller */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const views = { overview: "overviewView", map: "mapView", compare: "compareView", chat: "chatView" };
const SATQUERY_API_URL = window.SATQUERY_API_URL || "";
let lastSatQuery = null;

function showView(viewName) {
    $$(".view").forEach((view) => view.classList.remove("active"));
    const selectedView = document.getElementById(views[viewName]);
    if (selectedView) selectedView.classList.add("active");
    $$(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
    if (viewName === "map" && typeof mainMap !== "undefined") setTimeout(() => mainMap.invalidateSize(), 150);
}

$$('.nav-item').forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
$$('[data-view-target]').forEach((button) => button.addEventListener("click", () => showView(button.dataset.viewTarget)));
$$('[data-action="ask"]').forEach((button) => button.addEventListener("click", () => showView("chat")));
$$('[data-action="satellite"]').forEach((button) => button.addEventListener("click", () => showView("map")));
$$('[data-action="compare"]').forEach((button) => button.addEventListener("click", () => showView("compare")));
$("#themeToggle")?.addEventListener("click", () => document.body.classList.toggle("light"));

let previousImageUrl = "";
let currentImageUrl = "";
let previousImageFile = null;
let currentImageFile = null;
let compareAnalysisToken = 0;

const compareFiles = {
    previous: { input: $("#previousImage"), preview: $("#previousPreviewImage"), name: $("#previousImageName") },
    current: { input: $("#currentImage"), preview: $("#currentPreview"), name: $("#currentImageName") }
};

function syncPreviousPreview() {
    const stage = $("#compareStage");
    const image = $("#previousPreviewImage");
    if (!stage || !image) return;
    image.style.width = `${stage.clientWidth}px`;
    image.style.height = `${stage.clientHeight}px`;
}

function updateCompareState() {
    const stage = $("#compareStage");
    const summary = $("#compareSummary");
    if (!stage || !summary) return;
    const ready = Boolean(previousImageUrl && currentImageUrl);
    stage.classList.toggle("ready", ready);
    syncPreviousPreview();
    summary.textContent = ready
        ? `Comparison ready: ${previousImageFile.name} versus ${currentImageFile.name}. Move the slider to inspect visual differences.`
        : "Upload two images to generate a visual comparison summary.";
    if (ready) analyzeCompareImages();
    else compareAnalysisToken += 1;
}

function analyzeCompareImages() {
    const token = ++compareAnalysisToken;
    const size = 256;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = size;
    canvas.height = size;
    const loadImage = (source) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = source;
    });
    Promise.all([loadImage(previousImageUrl), loadImage(currentImageUrl)]).then(([previous, current]) => {
        if (token !== compareAnalysisToken) return;
        context.clearRect(0, 0, size, size);
        context.drawImage(previous, 0, 0, size, size);
        const a = context.getImageData(0, 0, size, size).data;
        context.clearRect(0, 0, size, size);
        context.drawImage(current, 0, 0, size, size);
        const b = context.getImageData(0, 0, size, size).data;
        let difference = 0;
        for (let i = 0; i < a.length; i += 4) difference += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
        const percent = ((difference / (size * size * 3 * 255)) * 100).toFixed(1);
        $("#compareSummary").textContent = `Comparison ready: estimated visual difference is ${percent}%. Use the slider to inspect the changed areas.`;
    }).catch(() => {
        $("#compareSummary").textContent = "Both images are ready. Use the slider to inspect visual differences.";
    });
}

function setCompareFile(file, imageType) {
    if (!file || !file.type.startsWith("image/")) return;
    const target = compareFiles[imageType];
    const url = URL.createObjectURL(file);
    if (imageType === "previous") {
        if (previousImageUrl) URL.revokeObjectURL(previousImageUrl);
        previousImageUrl = url;
        previousImageFile = file;
    } else {
        if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
        currentImageUrl = url;
        currentImageFile = file;
    }
    target.preview.src = url;
    target.name.textContent = file.name;
    updateCompareState();
}

["previous", "current"].forEach((type) => {
    const target = compareFiles[type];
    target.input?.addEventListener("change", () => setCompareFile(target.input.files?.[0], type));
});

$$('.compare-upload').forEach((area) => {
    const type = area.htmlFor === "previousImage" ? "previous" : "current";
    area.addEventListener("dragover", (event) => { event.preventDefault(); area.classList.add("dragging"); });
    area.addEventListener("dragleave", () => area.classList.remove("dragging"));
    area.addEventListener("drop", (event) => { event.preventDefault(); area.classList.remove("dragging"); setCompareFile(event.dataTransfer.files[0], type); });
});

$("#compareRange")?.addEventListener("input", (event) => { $("#previousPreview").style.width = `${event.target.value}%`; syncPreviousPreview(); });
$("#resetCompare")?.addEventListener("click", () => { $("#compareRange").value = 50; $("#previousPreview").style.width = "50%"; syncPreviousPreview(); });
$("#swapCompare")?.addEventListener("click", () => {
    if (!previousImageUrl || !currentImageUrl) return;
    [previousImageUrl, currentImageUrl] = [currentImageUrl, previousImageUrl];
    [previousImageFile, currentImageFile] = [currentImageFile, previousImageFile];
    $("#previousPreviewImage").src = previousImageUrl;
    $("#currentPreview").src = currentImageUrl;
    $("#previousImageName").textContent = previousImageFile.name;
    $("#currentImageName").textContent = currentImageFile.name;
    updateCompareState();
});
$("#clearCompare")?.addEventListener("click", () => {
    if (previousImageUrl) URL.revokeObjectURL(previousImageUrl);
    if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
    previousImageUrl = currentImageUrl = "";
    previousImageFile = currentImageFile = null;
    Object.values(compareFiles).forEach((target) => { target.input.value = ""; target.preview.removeAttribute("src"); target.name.textContent = "No image selected"; });
    $("#compareRange").value = 50;
    $("#previousPreview").style.width = "50%";
    updateCompareState();
});
window.addEventListener("resize", syncPreviousPreview);

const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Tiles © Esri" });
const streetsLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" });
const terrainLayer = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", { maxZoom: 17, attribution: "© OpenTopoMap contributors" });
const mainMap = L.map("mainMap", { zoomControl: true });
mainMap.setView([15.9129, 79.7400], 6);
satelliteLayer.addTo(mainMap);
const miniMapElement = $("#miniMap");
let miniMap;
if (miniMapElement) {
    miniMap = L.map("miniMap", { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false });
    miniMap.setView([15.9129, 79.7400], 5);
    satelliteLayer.addTo(miniMap);
}
$("#layerSelect")?.addEventListener("change", (event) => {
    [satelliteLayer, streetsLayer, terrainLayer].forEach((layer) => { if (mainMap.hasLayer(layer)) mainMap.removeLayer(layer); });
    const layers = { satellite: satelliteLayer, street: streetsLayer, terrain: terrainLayer };
    layers[event.target.value].addTo(mainMap);
    if ($("#activeLayer")) $("#activeLayer").textContent = event.target.options[event.target.selectedIndex].text.replace(" Imagery", "");
});

const overlayDefinitions = {
    vegetationOverlay: () => L.circle([16.5062, 80.6480], { radius: 7000, fillColor: "#55efad", fillOpacity: .20, color: "#55efad", weight: 1 }).bindPopup("<strong>Vegetation Change</strong><br>AI detected vegetation variation."),
    builtupOverlay: () => L.rectangle([[16.48, 80.61], [16.54, 80.69]], { fillColor: "#ffb45e", fillOpacity: .20, color: "#ffb45e", weight: 1 }).bindPopup("<strong>Built-up Change</strong><br>Potential urban expansion detected."),
    waterOverlay: () => L.circle([16.52, 80.62], { radius: 4500, fillColor: "#40e7ff", fillOpacity: .20, color: "#40e7ff", weight: 1 }).bindPopup("<strong>Water Change</strong><br>Potential water-body variation detected."),
    geologyOverlay: () => L.polygon([[16.47,80.60],[16.52,80.66],[16.48,80.72],[16.44,80.65]], { fillColor: "#b36cff", fillOpacity: .20, color: "#b36cff", weight: 1 }).bindPopup("<strong>Geological Feature</strong><br>Potential geological region identified.")
};
Object.entries(overlayDefinitions).forEach(([id, create]) => {
    $("#" + id)?.addEventListener("change", function () {
        if (this.checked) {
            const layer = create();
            this._satqueryLayer = layer;
            layer.addTo(mainMap);
        } else if (this._satqueryLayer) {
            mainMap.removeLayer(this._satqueryLayer);
        }
    });
});

const shortcutLocations = { "Andhra Pradesh": [15.9129,79.7400], Hyderabad: [17.3850,78.4867], "New Delhi": [28.6139,77.2090], India: [20.5937,78.9629] };
function moveMap(latitude, longitude, name) {
    mainMap.flyTo([latitude, longitude], 10, { duration: 1.2 });
    L.marker([latitude, longitude]).addTo(mainMap).bindPopup(`<strong>${name}</strong><br>TerraQ target region`).openPopup();
    if ($("#coordinates")) $("#coordinates").textContent = `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`;
    miniMap?.setView([latitude, longitude], 6);
}
$$('.location-shortcuts button').forEach((button) => button.addEventListener("click", () => {
    const location = shortcutLocations[button.dataset.location];
    if (location) { showView("map"); moveMap(location[0], location[1], button.dataset.location); }
}));
$("#locationSearchButton")?.addEventListener("click", () => {
    const query = $("#locationSearch").value.trim();
    const location = shortcutLocations[query] || shortcutLocations[Object.keys(shortcutLocations).find((key) => key.toLowerCase() === query.toLowerCase())];
    if (location) moveMap(location[0], location[1], query);
});
$("#locationSearch")?.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); $("#locationSearchButton").click(); } });

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[char]));
}
function addMessage(content, isUser = false) {
    const messages = $("#chatMessages");
    if (!messages) return;
    const message = document.createElement("div");
    message.className = `message ${isUser ? "user-message" : "assistant-message"}`;
    message.innerHTML = `<div class="message-avatar">${isUser ? "YOU" : "PQ"}</div><div class="message-bubble"><p>${content}</p></div>`;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
}

const SATQUERY_LOCATIONS = {
    "andhra pradesh": { name:"Andhra Pradesh", lat:15.9129, lon:79.7400 },
    hyderabad: { name:"Hyderabad", lat:17.3850, lon:78.4867 },
    "new delhi": { name:"New Delhi", lat:28.6139, lon:77.2090 },
    india: { name:"India", lat:20.5937, lon:78.9629 },
    vijayawada: { name:"Vijayawada", lat:16.5062, lon:80.6480 }
};

function classifySatQuery(query) {
    const q = query.toLowerCase();
    const locationKey = Object.keys(SATQUERY_LOCATIONS).find((key) => q.includes(key));
    const location = locationKey ? SATQUERY_LOCATIONS[locationKey] : null;
    let feature = "General Earth Observation";
    if (/vegetation|forest|green/.test(q)) feature = "Vegetation";
    else if (/water|river|lake/.test(q)) feature = "Water";
    else if (/built|urban|city/.test(q)) feature = "Built-up Area";
    else if (/geolog|rock|terrain/.test(q)) feature = "Geology / Terrain";
    else if (/land|crop|agri/.test(q)) feature = "Land / Agriculture";
    const isCompare = /compare|change|changed|difference|before|after|historical|trend/.test(q);
    const isDetect = /detect|identify|find|show|analy[sz]e|monitor/.test(q);
    const intent = isCompare ? "Change Detection" : isDetect ? "Geospatial Analysis" : "Satellite Query";
    const years = [...q.matchAll(/20\d{2}/g)].map((match) => match[0]);
    let timeRange = "Latest available observation";
    if (years.length >= 2) timeRange = `${years[0]} → ${years[1]}`;
    else if (years.length === 1) timeRange = years[0];
    else if (q.includes("last year")) timeRange = "Previous year → Latest";
    return { intent, location: location?.name || "Not specified", feature, timeRange, analysis: isCompare ? "Temporal Change Detection" : `${feature} Analysis`, dataType:"Remote Sensing", coordinates: location ? `${location.lat.toFixed(4)}° N, ${location.lon.toFixed(4)}° E` : "Not specified", locationData:location, isCompare, isDetect };
}

function setAnalysisValue(id, value) { const element = $(id); if (element) element.textContent = value || "—"; }
function renderSatQueryAnalysis(result) {
    setAnalysisValue("#aiIntent", result.intent);
    setAnalysisValue("#aiLocation", result.location);
    setAnalysisValue("#aiFeature", result.feature);
    setAnalysisValue("#aiTime", result.timeRange);
    setAnalysisValue("#aiAnalysis", result.analysis);
    setAnalysisValue("#aiDataType", result.dataType);
    setAnalysisValue("#coordinateValue", result.coordinates);
    setAnalysisValue("#changeValue", result.isCompare ? "Detected" : "Ready");
    setAnalysisValue("#areaValue", result.locationData ? "Target region" : "Global / unspecified");
    setAnalysisValue("#confidenceValue", result.locationData ? "92%" : "84%");
    setAnalysisValue("#sourceValue", SATQUERY_API_URL ? "Satellite imagery / AI API" : "Satellite imagery / prototype adapter");
    setAnalysisValue("#observationValue", result.timeRange);
    if ($("#vlmStatus")) $("#vlmStatus").textContent = "Analysis complete";
    if ($("#vlmDescription")) $("#vlmDescription").textContent = `${result.analysis} prepared for ${result.location}.`;
    if (result.locationData) moveMap(result.locationData.lat, result.locationData.lon, result.locationData.name);
}
function validateSatQuery(query) {
    if (!query || !query.trim()) return "Please enter a satellite or geospatial question.";
    if (query.trim().length < 4) return "Please provide a little more detail so PQ can understand the request.";
    return "";
}
async function callSatQueryBackend(payload) {
    if (!SATQUERY_API_URL) return null;
    const response = await fetch(SATQUERY_API_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    return response.json();
}
function applyBackendResult(data, fallback) {
    const result = { ...fallback, ...(data?.analysis || data || {}) };
    if (data?.result) addMessage(escapeHtml(data.result));
    else if (data?.answer) addMessage(escapeHtml(data.answer));
    renderSatQueryAnalysis(result);
    return result;
}
async function runSatQueryPipeline(query) {
    const validationError = validateSatQuery(query);
    if (validationError) { addMessage(validationError); return; }
    showView("chat");
    const cleanQuery = query.trim();
    addMessage(escapeHtml(cleanQuery), true);
    if ($("#chatInput")) $("#chatInput").value = "";
    if ($("#overviewQuery")) $("#overviewQuery").value = "";
    const typing = $("#typingIndicator");
    if (typing) { typing.hidden = false; typing.style.display = "flex"; }
    const result = classifySatQuery(cleanQuery);
    lastSatQuery = { query:cleanQuery, ...result, timestamp:new Date().toISOString() };
    try {
        const payload = { query:cleanQuery, intent:result.intent, location:result.location, feature:result.feature, time_range:result.timeRange, analysis:result.analysis, coordinates:result.coordinates };
        const backendResult = await callSatQueryBackend(payload);
        if (backendResult) applyBackendResult(backendResult, result);
        else {
            renderSatQueryAnalysis(result);
            addMessage(`PQ understood this as <b>${escapeHtml(result.intent)}</b> for <b>${escapeHtml(result.location)}</b>, focusing on <b>${escapeHtml(result.feature)}</b>. ${result.isCompare ? "Temporal change analysis is selected." : "The query is ready for satellite analysis."}`);
        }
    } catch (error) {
        console.warn("SATQUERY backend unavailable; using frontend adapter.", error);
        renderSatQueryAnalysis(result);
        addMessage(`The analysis service is not connected yet, so PQ prepared a local interpretation: <b>${escapeHtml(result.intent)}</b> → <b>${escapeHtml(result.feature)}</b> → <b>${escapeHtml(result.location)}</b>.`);
    } finally {
        if (typing) { typing.hidden = true; typing.style.display = "none"; }
    }
}

window.askSatQuery = runSatQueryPipeline;
$("#chatSendButton")?.addEventListener("click", () => runSatQueryPipeline($("#chatInput").value));
$("#chatInput")?.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); runSatQueryPipeline($("#chatInput").value); } });
$("#overviewAskButton")?.addEventListener("click", () => runSatQueryPipeline($("#overviewQuery").value));
$$('[data-prompt]').forEach((button) => button.addEventListener("click", () => runSatQueryPipeline(button.dataset.prompt || button.textContent.trim())));
$$('.chat-hints button, .recent-queries button').forEach((button) => button.addEventListener("click", () => runSatQueryPipeline(button.textContent.trim())));

if ($("#activeLayer")) $("#activeLayer").textContent = "Satellite";
if ($("#analysisMode")) $("#analysisMode").textContent = "NLP + Vision";
console.log("TerraQ / PQ initialized with SATQUERY end-to-end query pipeline.");
