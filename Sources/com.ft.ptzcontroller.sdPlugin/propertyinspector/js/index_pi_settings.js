var currentCam = 'CAM1';
var allCamSettings = {};

$SD.on('connected', (jsn) => {
    initToolTips();
    if (jsn.hasOwnProperty("actionInfo")) {
        const settings = Utils.getProp(jsn, "actionInfo.payload.settings", {});
        currentCam = settings.camid || 'CAM1';
        document.getElementById("camid").value = currentCam;
    }
    $SD.api.getGlobalSettings($SD.uuid);
});

$SD.on('didReceiveGlobalSettings', (jsn) => {
    allCamSettings = jsn.payload.settings || {};
    loadCamFields(currentCam);
});

function onCamChange() {
    currentCam = document.getElementById("camid").value;
    loadCamFields(currentCam);
}

function loadCamFields(camid) {
    const cam = allCamSettings[camid] || {};
    document.getElementById("camip").value = cam.camip || "http://192.168.0.123";
    document.getElementById("speedMoviment").value = cam.speedMoviment !== undefined ? cam.speedMoviment : 40;
    document.getElementById("speedZoom").value = cam.speedZoom !== undefined ? cam.speedZoom : 5;
    document.getElementById("authuser").value = cam.authuser || "YWRtaW4=";
    document.getElementById("authpass").value = cam.authpass || "YWRtaW4=";
}

const save = function () {
    if ($SD) {
        allCamSettings[currentCam] = {
            camip:         document.getElementById("camip").value,
            speedMoviment: document.getElementById("speedMoviment").value,
            speedZoom:     document.getElementById("speedZoom").value,
            authuser:      document.getElementById("authuser").value,
            authpass:      document.getElementById("authpass").value,
        };
        $SD.api.sendToPlugin($SD.uuid, $SD.actionInfo["action"], {
            camid:   currentCam,
            cameras: allCamSettings,
        });
    }
};

function initToolTips() {
    const tooltip = document.querySelector('.sdpi-info-label');
    const arrElements = document.querySelectorAll('.floating-tooltip');
    arrElements.forEach((e) => initToolTip(e, tooltip));
}

function initToolTip(element, tooltip) {
    const tw = tooltip.getBoundingClientRect().width;
    const suffix = element.getAttribute('data-suffix') || '';
    const fn = () => {
        const r = element.getBoundingClientRect();
        const w = r.width - tw / 2;
        const pct = rangeToPercent(element.value, element.min, element.max);
        tooltip.textContent = suffix !== "" ? `${element.value} ${suffix}` : String(element.value);
        tooltip.style.left = `${r.left + Math.round(w * pct) - tw / 4}px`;
        tooltip.style.top = `${r.top - 32}px`;
    };
    if (element) {
        element.addEventListener('mouseenter', () => { tooltip.classList.remove('hidden'); tooltip.classList.add('shown'); fn(); }, false);
        element.addEventListener('mouseout',   () => { tooltip.classList.remove('shown'); tooltip.classList.add('hidden'); fn(); }, false);
        element.addEventListener('input', fn, false);
    }
}

function rangeToPercent(value, min, max) {
    return (value / (max - min));
}
