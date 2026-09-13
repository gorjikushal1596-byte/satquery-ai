/* TerraQ / PQ application controller */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const views = {
    overview: "overviewView",
    map: "mapView",
    compare: "compareView",
    chat: "chatView"
};

function showView(viewName) {
    $$(".view").forEach((view) => view.classList.remove("active"));

    const selectedView = document.getElementById(views[viewName]);

    if (selectedView) {
        selectedView.classList.add("active");
    }

    $$(".nav-item").forEach((button) => {
        button.classList.toggle("active", button.dataset.view === viewName);
    });

    if (viewName === "map" && typeof mainMap !== "undefined") {
        setTimeout(() => mainMap.invalidateSize(), 150);
    }
}

$$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
});

$$('[data-view-target]').forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.viewTarget));
});

$$('[data-action="ask"]').forEach((button) => {
    button.addEventListener("click", () => showView("chat"));
});

$$('[data-action="satellite"]').forEach((button) => {
    button.addEventListener("click", () => showView("map"));
});

$$('[data-action="compare"]').forEach((button) => {
    button.addEventListener("click", () => {
        showView("compare");
    });
});

$("#themeToggle")?.addEventListener("click", () => {
    document.body.classList.toggle("light");
});

let previousImageUrl = "";
let currentImageUrl = "";
let previousImageFile = null;
let currentImageFile = null;
let compareAnalysisToken = 0;

const compareFiles = {
    previous: {
        input: $("#previousImage"),
        preview: $("#previousPreviewImage"),
        name: $("#previousImageName")
    },
    current: {
        input: $("#currentImage"),
        preview: $("#currentPreview"),
        name: $("#currentImageName")
    }
};

function syncPreviousPreview() {
    const stage = $("#compareStage");
    const previousPreviewImage = $("#previousPreviewImage");

    if (!stage || !previousPreviewImage) {
        return;
    }

    previousPreviewImage.style.width = `${stage.clientWidth}px`;
    previousPreviewImage.style.height = `${stage.clientHeight}px`;
}

function updateCompareState() {
    const compareStage = $("#compareStage");
    const compareSummary = $("#compareSummary");

    if (!compareStage || !compareSummary) {
        return;
    }

    const ready = Boolean(previousImageUrl && currentImageUrl);
    compareStage.classList.toggle("ready", ready);
    syncPreviousPreview();

    compareSummary.textContent = ready
        ? `Comparison ready: ${previousImageFile.name} versus ${currentImageFile.name}. Move the slider to inspect visual differences.`
        : "Upload two images to generate a visual comparison summary.";

    if (ready) {
        analyzeCompareImages();
    } else {
        compareAnalysisToken += 1;
    }
}

function analyzeCompareImages() {
    const token = ++compareAnalysisToken;
    const imageSize = 256;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    canvas.width = imageSize;
    canvas.height = imageSize;

    const loadImage = (source) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = source;
    });

    Promise.all([loadImage(previousImageUrl), loadImage(currentImageUrl)])
        .then(([previousImage, currentImage]) => {
            if (token !== compareAnalysisToken) {
                return;
            }

            context.clearRect(0, 0, imageSize, imageSize);
            context.drawImage(previousImage, 0, 0, imageSize, imageSize);
            const previousPixels = context.getImageData(0, 0, imageSize, imageSize).data;

            context.clearRect(0, 0, imageSize, imageSize);
            context.drawImage(currentImage, 0, 0, imageSize, imageSize);
            const currentPixels = context.getImageData(0, 0, imageSize, imageSize).data;

            let totalDifference = 0;

            for (let index = 0; index < previousPixels.length; index += 4) {
                totalDifference += Math.abs(previousPixels[index] - currentPixels[index]);
                totalDifference += Math.abs(previousPixels[index + 1] - currentPixels[index + 1]);
                totalDifference += Math.abs(previousPixels[index + 2] - currentPixels[index + 2]);
            }

            const maximumDifference = imageSize * imageSize * 3 * 255;
            const differencePercent = ((totalDifference / maximumDifference) * 100).toFixed(1);

            $("#compareSummary").textContent =
                `Comparison ready: estimated visual difference is ${differencePercent}%. Use the slider to inspect the changed areas.`;
        })
        .catch(() => {
            $("#compareSummary").textContent =
                "Both images are ready. Use the slider to inspect visual differences.";
        });
}

function setCompareFile(file, imageType) {
    if (!file || !file.type.startsWith("image/")) {
        return;
    }

    const compareFile = compareFiles[imageType];
    const imageUrl = URL.createObjectURL(file);

    if (imageType === "previous") {
        if (previousImageUrl) {
            URL.revokeObjectURL(previousImageUrl);
        }

        previousImageUrl = imageUrl;
        previousImageFile = file;
    } else {
        if (currentImageUrl) {
            URL.revokeObjectURL(currentImageUrl);
        }

        currentImageUrl = imageUrl;
        currentImageFile = file;
    }

    compareFile.preview.src = imageUrl;
    compareFile.name.textContent = file.name;
    updateCompareState();
}

function loadCompareImage(imageType) {
    const compareFile = compareFiles[imageType];

    compareFile.input?.addEventListener("change", () => {
        setCompareFile(compareFile.input.files?.[0], imageType);
    });
}

loadCompareImage("previous");
loadCompareImage("current");

$$('.compare-upload').forEach((uploadArea) => {
    const imageType = uploadArea.htmlFor === "previousImage" ? "previous" : "current";

    uploadArea.addEventListener("dragover", (event) => {
        event.preventDefault();
        uploadArea.classList.add("dragging");
    });

    uploadArea.addEventListener("dragleave", () => {
        uploadArea.classList.remove("dragging");
    });

    uploadArea.addEventListener("drop", (event) => {
        event.preventDefault();
        uploadArea.classList.remove("dragging");
        setCompareFile(event.dataTransfer.files[0], imageType);
    });
});

$("#compareRange")?.addEventListener("input", (event) => {
    $("#previousPreview").style.width = `${event.target.value}%`;
    syncPreviousPreview();
});

$("#resetCompare")?.addEventListener("click", () => {
    $("#compareRange").value = 50;
    $("#previousPreview").style.width = "50%";
    syncPreviousPreview();
});

$("#swapCompare")?.addEventListener("click", () => {
    if (!previousImageUrl || !currentImageUrl) {
        return;
    }

    [previousImageUrl, currentImageUrl] = [currentImageUrl, previousImageUrl];
    [previousImageFile, currentImageFile] = [currentImageFile, previousImageFile];

    $("#previousPreviewImage").src = previousImageUrl;
    $("#currentPreview").src = currentImageUrl;
    $("#previousImageName").textContent = previousImageFile.name;
    $("#currentImageName").textContent = currentImageFile.name;
    updateCompareState();
});

$("#clearCompare")?.addEventListener("click", () => {
    if (previousImageUrl) {
        URL.revokeObjectURL(previousImageUrl);
    }

    if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl);
    }

    previousImageUrl = "";
    currentImageUrl = "";
    previousImageFile = null;
    currentImageFile = null;

    Object.values(compareFiles).forEach((compareFile) => {
        compareFile.input.value = "";
        compareFile.preview.removeAttribute("src");
        compareFile.name.textContent = "No image selected";
    });

    $("#compareRange").value = 50;
    $("#previousPreview").style.width = "50%";
    updateCompareState();
});

window.addEventListener("resize", syncPreviousPreview);

const satelliteLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 19, attribution: "Tiles © Esri" }
);

const streetsLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { maxZoom: 19, attribution: "© OpenStreetMap contributors" }
);

const terrainLayer = L.tileLayer(
    "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    { maxZoom: 17, attribution: "© OpenTopoMap contributors" }
);

const mainMap = L.map("mainMap", { zoomControl: true });
mainMap.setView([15.9129, 79.7400], 6);
satelliteLayer.addTo(mainMap);

const miniMapElement = $("#miniMap");
let miniMap;

if (miniMapElement) {
    miniMap = L.map("miniMap", {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false
    });

    miniMap.setView([15.9129, 79.7400], 5);
    satelliteLayer.addTo(miniMap);
}

$("#layerSelect")?.addEventListener("change", (event) => {
    [satelliteLayer, streetsLayer, terrainLayer].forEach((layer) => {
        if (mainMap.hasLayer(layer)) {
            mainMap.removeLayer(layer);
        }
    });

    const layers = {
        satellite: satelliteLayer,
        street: streetsLayer,
        terrain: terrainLayer
    };

    layers[event.target.value].addTo(mainMap);

    if ($("#activeLayer")) {
        $("#activeLayer").textContent =
            event.target.options[event.target.selectedIndex].text.replace(" Imagery", "");
    }
});

let vegetationLayer;
let builtupLayer;
let waterLayer;
let geologyLayer;

function createVegetationOverlay() {
    return L.circle([16.5062, 80.6480], {
        radius: 7000,
        fillColor: "#55efad",
        fillOpacity: 0.20,
        color: "#55efad",
        weight: 1
    }).bindPopup(
        "<strong>Vegetation Change</strong><br>" +
        "AI detected vegetation variation."
    );
}

function createBuiltupOverlay() {
    return L.rectangle([[16.48, 80.61], [16.54, 80.69]], {
        fillColor: "#ffb45e",
        fillOpacity: 0.20,
        color: "#ffb45e",
        weight: 1
    }).bindPopup(
        "<strong>Built-up Change</strong><br>" +
        "Potential urban expansion detected."
    );
}

function createWaterOverlay() {
    return L.circle([16.52, 80.62], {
        radius: 4500,
        fillColor: "#40e7ff",
        fillOpacity: 0.20,
        color: "#40e7ff",
        weight: 1
    }).bindPopup(
        "<strong>Water Change</strong><br>" +
        "Potential water-body variation detected."
    );
}

function createGeologyOverlay() {
    return L.polygon([
        [16.47, 80.60],
        [16.52, 80.66],
        [16.48, 80.72],
        [16.44, 80.65]
    ], {
        fillColor: "#b36cff",
        fillOpacity: 0.20,
        color: "#b36cff",
        weight: 1
    }).bindPopup(
        "<strong>Geological Feature</strong><br>" +
        "Potential geological region identified."
    );
}

function bindOverlayCheckbox(id, createLayer, layerName) {
    const checkbox = $(id);

    checkbox?.addEventListener("change", function () {
        if (this.checked) {
            window[layerName] = createLayer();
            window[layerName].addTo(mainMap);
        } else if (window[layerName]) {
            mainMap.removeLayer(window[layerName]);
        }
    });
}

bindOverlayCheckbox("#vegetationOverlay", createVegetationOverlay, "vegetationLayer");
bindOverlayCheckbox("#builtupOverlay", createBuiltupOverlay, "builtupLayer");
bindOverlayCheckbox("#waterOverlay", createWaterOverlay, "waterLayer");
bindOverlayCheckbox("#geologyOverlay", createGeologyOverlay, "geologyLayer");

const shortcutLocations = {
    "Andhra Pradesh": [15.9129, 79.7400],
    Hyderabad: [17.3850, 78.4867],
    "New Delhi": [28.6139, 77.2090],
    India: [20.5937, 78.9629]
};

function moveMap(latitude, longitude, name) {
    mainMap.flyTo([latitude, longitude], 10, { duration: 1.2 });

    L.marker([latitude, longitude])
        .addTo(mainMap)
        .bindPopup(`<strong>${name}</strong><br>TerraQ target region`)
        .openPopup();

    if ($("#coordinates")) {
        $("#coordinates").textContent =
            `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`;
    }

    miniMap?.setView([latitude, longitude], 6);
}

function locateAndhraPradesh() {
    moveMap(15.9129, 79.7400, "Andhra Pradesh");
}

$$('.location-shortcuts button').forEach((button) => {
    button.addEventListener("click", () => {
        const location = shortcutLocations[button.dataset.location];

        if (location) {
            showView("map");
            moveMap(location[0], location[1], button.dataset.location);
        }
    });
});

$("#locationSearchButton")?.addEventListener("click", () => {
    const query = $("#locationSearch").value.trim();
    const location = shortcutLocations[query];

    if (location) {
        moveMap(location[0], location[1], query);
    }
});

$("#locationSearch")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        $("#locationSearchButton").click();
    }
});

function addMessage(content, isUser = false) {
    const messages = $("#chatMessages");

    if (!messages) {
        return;
    }

    const message = document.createElement("div");
    message.className = `message ${isUser ? "user-message" : "assistant-message"}`;
    message.innerHTML = `
        <div class="message-avatar">${isUser ? "YOU" : "PQ"}</div>
        <div class="message-bubble"><p>${content}</p></div>
    `;

    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
}

function botResponse(query) {
    const normalizedQuery = query.toLowerCase();

    if (normalizedQuery.includes("vegetation")) {
        return "I can inspect vegetation patterns and highlight likely change areas on the map.";
    }

    if (normalizedQuery.includes("geolog")) {
        return "I can identify geological feature candidates and show the analysis overlay on the map.";
    }

    if (normalizedQuery.includes("water")) {
        return "I can inspect water-body variation and highlight the relevant analysis area.";
    }

    return "Query received. I can help explore satellite layers, locations, vegetation, geology, water, and built-up change.";
}

function askSatQuery(query) {
    if (!query.trim()) {
        return;
    }

    addMessage(query, true);

    if ($("#chatInput")) {
        $("#chatInput").value = "";
    }

    if ($("#typingIndicator")) {
        $("#typingIndicator").style.display = "block";
    }

    setTimeout(() => {
        if ($("#typingIndicator")) {
            $("#typingIndicator").style.display = "none";
        }

        addMessage(botResponse(query));
    }, 500);
}

$("#chatSendButton")?.addEventListener("click", () => {
    askSatQuery($("#chatInput").value);
});

$("#chatInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        askSatQuery($("#chatInput").value);
    }
});

$("#overviewAskButton")?.addEventListener("click", () => {
    const query = $("#overviewQuery").value.trim();

    if (query) {
        showView("chat");
        setTimeout(() => askSatQuery(query), 150);
    }
});

$$('[data-prompt]').forEach((button) => {
    button.addEventListener("click", () => {
        showView("chat");
        setTimeout(() => askSatQuery(button.dataset.prompt), 150);
    });
});

$$('.chat-hints button, .recent-queries button').forEach((button) => {
    button.addEventListener("click", () => {
        showView("chat");
        askSatQuery(button.textContent.trim());
    });
});

$("#activeLayer") && ($("#activeLayer").textContent = "Satellite");
$("#analysisMode") && ($("#analysisMode").textContent = "NLP + Vision");

console.log("TerraQ / PQ initialized.");
