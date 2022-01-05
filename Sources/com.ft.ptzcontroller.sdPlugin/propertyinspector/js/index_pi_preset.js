$SD.on('connected', (jsn) => {
    console.log("connected");
    console.log(jsn);

    if (jsn.hasOwnProperty("actionInfo")) {
        let settings = Utils.getProp(jsn, "actionInfo.payload.settings", {});
        document.getElementById("presetid").value = settings.presetid || "0";
        document.getElementById("camip").value = settings.camip || "http://192.168.0.123";
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