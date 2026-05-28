$SD.on('connected', (jsonObj) => connected(jsonObj));

var presetTimer = null;

function loadImageAsDataUri(url, callback) {
    var image = new Image();
    image.onload = function () {
        var canvas = document.createElement("canvas");
        canvas.width = this.naturalWidth;
        canvas.height = this.naturalHeight;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(this, 0, 0);
        callback(canvas.toDataURL("image/png"));
    };
    image.src = url;
}

function doPresetAction(jsn) {
    if (!jsn.payload.settings || !jsn.payload.settings.camip) {
        $SD.api.showAlert(jsn.context);
        return;
    }

    let url = `${jsn.payload.settings.camip}/cmdparse`;
    let info = jsn.payload.settings;

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: `ReqUserName=${info.authuser}&ReqUserPwd=${info.authpass}&CmdData={"Cmd":"ReqPresetCtrl","Content":{"PresetCmd":"Call","PresetID":${info.presetid},"PresetName":""}}`
    }).then(
        result => {
            if (result.status == 200) { $SD.api.showOk(jsn.context); return; }
            $SD.api.showAlert(jsn.context);
        },
        error => { console.log(error); $SD.api.showAlert(jsn.context); }
    );
}

function flashSaved(context) {
    const canvas = document.createElement("canvas");
    canvas.width = 144;
    canvas.height = 144;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#27AE60";
    ctx.fillRect(0, 0, 144, 144);
    ctx.fillStyle = "white";
    ctx.font = "bold 80px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✓", 72, 72);
    $SD.api.setImage(context, canvas.toDataURL("image/png"), 0);
    setTimeout(() => $SD.api.setImage(context, "", 0), 1500);
}

function doSetPresetAction(jsn) {
    if (!jsn.payload.settings || !jsn.payload.settings.camip) {
        $SD.api.showAlert(jsn.context);
        return;
    }

    let url = `${jsn.payload.settings.camip}/cmdparse`;
    let info = jsn.payload.settings;

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: `ReqUserName=${info.authuser}&ReqUserPwd=${info.authpass}&CmdData={"Cmd":"ReqPresetCtrl","Content":{"PresetCmd":"Set","PresetID":${info.presetid},"PresetName":"Preset${info.presetid}"}}`
    }).then(
        result => {
            if (result.status == 200) { flashSaved(jsn.context); return; }
            $SD.api.showAlert(jsn.context);
        },
        error => { console.log(error); $SD.api.showAlert(jsn.context); }
    );
}

function connected(jsn) {
    $SD.api.getGlobalSettings($SD.uuid);

    $SD.on('com.ft.ptzcontroller.action.moviments.keyUp', (jsonObj) => action.onKeyUp(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.moviments.keyDown', (jsonObj) => action.onKeyDown(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.moviments.sendToPlugin', (jsonObj) => action.onSendToPlugin(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.moviments.willAppear', (jsonObj) => action.onWillAppear(jsonObj));

    $SD.on('com.ft.ptzcontroller.action.zoom.keyUp', (jsonObj) => action.onKeyUp(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.zoom.keyDown', (jsonObj) => action.onKeyDown(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.zoom.sendToPlugin', (jsonObj) => action.onSendToPlugin(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.zoom.willAppear', (jsonObj) => action.onWillAppear(jsonObj));

    $SD.on('com.ft.ptzcontroller.action.preset.keyDown', (jsonObj) => action.onPresetKeyDown(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.preset.keyUp', (jsonObj) => action.onPresetKeyUp(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.preset.sendToPlugin', (jsonObj) => action.onSendToPlugin(jsonObj));
}

const action = {
    onWillAppear: function (jsn) {
        $SD.api.getGlobalSettings($SD.uuid);
        const moviment = jsn.payload && jsn.payload.settings && jsn.payload.settings.moviment;
        if (moviment) {
            loadImageAsDataUri(`action/images/moviment-${moviment}.png`, function (imgUrl) {
                $SD.api.setImage(jsn.context, imgUrl, 0);
            });
        }
    },

    onKeyUp: function (jsn) {
        if (!jsn.payload.settings || !jsn.payload.settings.camip) {
            $SD.api.showAlert(jsn.context);
            return;
        }

        let url = `${jsn.payload.settings.camip}/cmdparse`;
        let info = jsn.payload.settings;
        // Zoom uses "ZoomStop" instead of "Stop"
        let stop = info.stop || "Stop";

        fetch(url, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: `ReqUserName=${info.authuser}&ReqUserPwd=${info.authpass}&CmdData={"Cmd":"ReqPtzCtrl","Content":{"PtzCmd":"${stop}","ParamH":${info.speed},"ParamV":${info.speed}}}`
        }).then(
            result => {
                if (result.status == 200) { $SD.api.showOk(jsn.context); return; }
                $SD.api.showAlert(jsn.context);
            },
            error => { console.log(error); $SD.api.showAlert(jsn.context); }
        );
    },

    onKeyDown: function (jsn) {
        if (!jsn.payload.settings || !jsn.payload.settings.camip) {
            $SD.api.showAlert(jsn.context);
            return;
        }

        let url = `${jsn.payload.settings.camip}/cmdparse`;
        let info = jsn.payload.settings;

        fetch(url, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: `ReqUserName=${info.authuser}&ReqUserPwd=${info.authpass}&CmdData={"Cmd":"ReqPtzCtrl","Content":{"PtzCmd":"${info.moviment}","ParamH":${info.speed},"ParamV":${info.speed}}}`
        }).then(
            result => {
                if (result.status == 200) { $SD.api.showOk(jsn.context); return; }
                $SD.api.showAlert(jsn.context);
            },
            error => { console.log(error); $SD.api.showAlert(jsn.context); }
        );
    },

    onSendToPlugin: function (jsn) {
        if (jsn.payload) {
            $SD.api.setSettings(jsn.context, jsn.payload);
            $SD.api.setGlobalSettings($SD.uuid, jsn.payload);
            const moviment = jsn.payload.moviment;
            if (moviment) {
                loadImageAsDataUri(`action/images/moviment-${moviment}.png`, function (imgUrl) {
                    $SD.api.setImage(jsn.context, imgUrl, 0);
                });
            }
        }
    },

    onPresetKeyDown: function (jsn) {
        presetTimer = setTimeout(() => {
            presetTimer = null;
            doSetPresetAction(jsn);
        }, 2500);
    },

    onPresetKeyUp: function (jsn) {
        if (presetTimer !== null) {
            clearTimeout(presetTimer);
            presetTimer = null;
            doPresetAction(jsn);
        }
        // long press: action already fired by the setTimeout
    },
};
