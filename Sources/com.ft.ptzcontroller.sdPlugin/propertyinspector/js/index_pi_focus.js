$SD.on('connected', (jsn) => {
    if (jsn.hasOwnProperty("actionInfo")) {
        let settings = Utils.getProp(jsn, "actionInfo.payload.settings", {});
        document.getElementById("camid").value = settings.camid || "CAM1";
        document.getElementById("mode").value = settings.mode || "auto";
    }
});

const save = function () {
    if ($SD) {
        var payload = {};
        [].forEach.call(document.querySelectorAll(".inspector"), element => {
            payload[element.id] = element.value;
        });
        $SD.api.sendToPlugin($SD.uuid, $SD.actionInfo["action"], payload);
    }
};
