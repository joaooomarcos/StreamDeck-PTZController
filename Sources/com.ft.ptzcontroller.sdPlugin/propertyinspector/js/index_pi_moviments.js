$SD.on('connected', (jsn) => {
    console.log("connected");
    console.log(jsn);

    initToolTips()

    if (jsn.hasOwnProperty("actionInfo")) {
        let settings = Utils.getProp(jsn, "actionInfo.payload.settings", {});
        document.getElementById("camip").value = settings.camip || "http://192.168.0.123";
        document.getElementById("moviment").value = settings.moviment || "Up";
        document.getElementById("speed").value = settings.speed || "50";
        document.getElementById("authuser").value = settings.authuser || "YWRtaW4=";
        document.getElementById("authpass").value = settings.authpass || "YWRtaW4=";
    }
});

const save = function () {
    if ($SD) {
        var payload = {};
        [].forEach.call(document.querySelectorAll(".inspector"), element => {
            payload[element.id] = element.value;
            console.log(element.id);
            console.log(element.value);
        });
        $SD.api.sendToPlugin($SD.uuid, $SD.actionInfo["action"], payload);
    }
}

function initToolTips() {
    const tooltip = document.querySelector('.sdpi-info-label');
    const arrElements = document.querySelectorAll('.floating-tooltip');
    arrElements.forEach((e, i) => {
        initToolTip(e, tooltip)
    })
}

function initToolTip(element, tooltip) {

    const tw = tooltip.getBoundingClientRect().width;
    const suffix = element.getAttribute('data-suffix') || '';

    const fn = () => {
        const elementRect = element.getBoundingClientRect();
        const w = elementRect.width - tw / 2;
        const percnt = rangeToPercent(element.value, element.min, element.max);
        tooltip.textContent = suffix != "" ? `${element.value} ${suffix}` : String(element.value);
        tooltip.style.left = `${elementRect.left + Math.round(w * percnt) - tw / 4}px`;
        tooltip.style.top = `${elementRect.top - 32}px`;
    };

    if (element) {
        element.addEventListener('mouseenter', function () {
            tooltip.classList.remove('hidden');
            tooltip.classList.add('shown');
            fn();
        }, false);

        element.addEventListener('mouseout', function () {
            tooltip.classList.remove('shown');
            tooltip.classList.add('hidden');
            fn();
        }, false);
        element.addEventListener('input', fn, false);
    }
}

function rangeToPercent(value, min, max) {
    return (value / (max - min));
};