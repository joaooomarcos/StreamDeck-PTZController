$SD.on('connected', (jsonObj) => connected(jsonObj));

var presetTimer = null;
var globalSettings = {};
var pendingSpeedUpdate = null;
var loggedInCameras = new Set();

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

function numOr(val, def) { const n = parseFloat(val); return isNaN(n) ? def : n; }

function doLogin(camid, cam) {
    if (!cam || !cam.camip) return;
    if (loggedInCameras.has(camid)) return;
    loggedInCameras.add(camid);
    fetch(`${cam.camip}/`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: `{"Cmd":"ReqHttpLogin","Content":{"UserName":"${cam.authuser}","Userpwd":"${cam.authpass}"}}`
    }).then(
        r => console.log(`[PTZ] Login ${camid}: ${r.status}`),
        e => console.error(`[PTZ] Login error ${camid}:`, e)
    );
}

function drawTextButton(text, callback) {
    const canvas = document.createElement("canvas");
    canvas.width = 144;
    canvas.height = 144;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, 144, 144);
    ctx.fillStyle = "white";
    ctx.font = "bold 56px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 72, 72);
    callback(canvas.toDataURL("image/png"));
}

function getCamSettings(info) {
    const camid = info.camid || 'CAM1';
    const cam = globalSettings[camid] || {};
    return {
        camip:         cam.camip        || info.camip    || "",
        authuser:      cam.authuser     || info.authuser || "",
        authpass:      cam.authpass     || info.authpass || "",
        speedMoviment: numOr(cam.speedMoviment, numOr(info.speed, 40)),
        speedZoom:     numOr(cam.speedZoom,     numOr(info.speed, 5)),
    };
}

function doPresetAction(jsn) {
    const info = jsn.payload.settings;
    if (!info) { $SD.api.showAlert(jsn.context); return; }
    const cam = getCamSettings(info);
    if (!cam.camip) { $SD.api.showAlert(jsn.context); return; }

    fetch(`${cam.camip}/cmdparse`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: `ReqUserName=${cam.authuser}&ReqUserPwd=${cam.authpass}&CmdData={"Cmd":"ReqPresetCtrl","Content":{"PresetCmd":"Call","PresetID":${info.presetid},"PresetName":""}}`
    }).then(
        result => {
            if (result.status == 200) { $SD.api.showOk(jsn.context); return; }
            $SD.api.showAlert(jsn.context);
        },
        error => { console.log(error); $SD.api.showAlert(jsn.context); }
    );
}

function doSetPresetAction(jsn) {
    const info = jsn.payload.settings;
    if (!info) { $SD.api.showAlert(jsn.context); return; }
    const cam = getCamSettings(info);
    if (!cam.camip) { $SD.api.showAlert(jsn.context); return; }

    fetch(`${cam.camip}/cmdparse`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: `ReqUserName=${cam.authuser}&ReqUserPwd=${cam.authpass}&CmdData={"Cmd":"ReqPresetCtrl","Content":{"PresetCmd":"Set","PresetID":${info.presetid},"PresetName":"Preset${info.presetid}"}}`
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

    $SD.on('didReceiveGlobalSettings', (jsonObj) => {
        globalSettings = jsonObj.payload.settings || {};
        Object.keys(globalSettings).forEach(camid => doLogin(camid, globalSettings[camid]));
        if (pendingSpeedUpdate) {
            const { context, camid, delta } = pendingSpeedUpdate;
            pendingSpeedUpdate = null;
            const cam = globalSettings[camid] || {};
            const cur = numOr(cam.speedMoviment, 40);
            globalSettings[camid] = Object.assign({}, cam, {
                speedMoviment: Math.max(0, Math.min(63, cur + delta)),
            });
            $SD.api.setGlobalSettings($SD.uuid, globalSettings);
            $SD.api.showOk(context);
        }
    });

    $SD.on('com.ft.ptzcontroller.action.config.sendToPlugin', (jsonObj) => action.onConfigSendToPlugin(jsonObj));

    $SD.on('com.ft.ptzcontroller.action.moviments.keyUp',      (jsonObj) => action.onKeyUp(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.moviments.keyDown',    (jsonObj) => action.onKeyDown(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.moviments.sendToPlugin',(jsonObj) => action.onSendToPlugin(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.moviments.willAppear', (jsonObj) => action.onWillAppear(jsonObj));

    $SD.on('com.ft.ptzcontroller.action.zoom.keyUp',      (jsonObj) => action.onKeyUp(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.zoom.keyDown',    (jsonObj) => action.onKeyDown(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.zoom.sendToPlugin',(jsonObj) => action.onSendToPlugin(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.zoom.willAppear', (jsonObj) => action.onWillAppear(jsonObj));

    $SD.on('com.ft.ptzcontroller.action.preset.keyDown',    (jsonObj) => action.onPresetKeyDown(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.preset.keyUp',      (jsonObj) => action.onPresetKeyUp(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.preset.sendToPlugin',(jsonObj) => action.onSendToPlugin(jsonObj));

    $SD.on('com.ft.ptzcontroller.action.speed.keyDown',     (jsonObj) => action.onSpeedKeyDown(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.speed.sendToPlugin',(jsonObj) => action.onSpeedSendToPlugin(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.speed.willAppear',  (jsonObj) => action.onSpeedWillAppear(jsonObj));

    $SD.on('com.ft.ptzcontroller.action.focus.keyDown',     (jsonObj) => action.onFocusKeyDown(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.focus.keyUp',       (jsonObj) => action.onFocusKeyUp(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.focus.sendToPlugin',(jsonObj) => action.onFocusSendToPlugin(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.focus.willAppear',  (jsonObj) => action.onFocusWillAppear(jsonObj));
}

const action = {
    onConfigSendToPlugin: function (jsn) {
        if (jsn.payload) {
            $SD.api.setSettings(jsn.context, { camid: jsn.payload.camid });
            globalSettings = jsn.payload.cameras || {};
            $SD.api.setGlobalSettings($SD.uuid, globalSettings);
            const camid = jsn.payload.camid;
            loggedInCameras.delete(camid);
            doLogin(camid, globalSettings[camid]);
        }
    },

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
        const info = jsn.payload.settings;
        if (!info) { $SD.api.showAlert(jsn.context); return; }
        const cam = getCamSettings(info);
        if (!cam.camip) { $SD.api.showAlert(jsn.context); return; }
        const stop = info.stop || "Stop";

        fetch(`${cam.camip}/cmdparse`, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: `ReqUserName=${cam.authuser}&ReqUserPwd=${cam.authpass}&CmdData={"Cmd":"ReqPtzCtrl","Content":{"PtzCmd":"${stop}","ParamH":0,"ParamV":0}}`
        }).then(
            result => {
                if (result.status == 200) { $SD.api.showOk(jsn.context); return; }
                $SD.api.showAlert(jsn.context);
            },
            error => { console.log(error); $SD.api.showAlert(jsn.context); }
        );
    },

    onKeyDown: function (jsn) {
        const info = jsn.payload.settings;
        if (!info) { $SD.api.showAlert(jsn.context); return; }
        const cam = getCamSettings(info);
        if (!cam.camip) { $SD.api.showAlert(jsn.context); return; }
        const isZoom = jsn.action === 'com.ft.ptzcontroller.action.zoom';
        const speed = isZoom ? cam.speedZoom : cam.speedMoviment;

        fetch(`${cam.camip}/cmdparse`, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: `ReqUserName=${cam.authuser}&ReqUserPwd=${cam.authpass}&CmdData={"Cmd":"ReqPtzCtrl","Content":{"PtzCmd":"${info.moviment}","ParamH":${speed},"ParamV":${speed}}}`
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
            const moviment = jsn.payload.moviment;
            if (moviment) {
                loadImageAsDataUri(`action/images/moviment-${moviment}.png`, function (imgUrl) {
                    $SD.api.setImage(jsn.context, imgUrl, 0);
                });
            }
        }
    },

    onSpeedWillAppear: function (jsn) {
        $SD.api.getGlobalSettings($SD.uuid);
        const direction = jsn.payload && jsn.payload.settings && jsn.payload.settings.direction;
        const img = direction === '-' ? 'minus' : 'plus';
        loadImageAsDataUri(`action/images/${img}.png`, function (imgUrl) {
            $SD.api.setImage(jsn.context, imgUrl, 0);
        });
    },

    onSpeedSendToPlugin: function (jsn) {
        if (jsn.payload) {
            $SD.api.setSettings(jsn.context, jsn.payload);
            const img = jsn.payload.direction === '-' ? 'minus' : 'plus';
            loadImageAsDataUri(`action/images/${img}.png`, function (imgUrl) {
                $SD.api.setImage(jsn.context, imgUrl, 0);
            });
        }
    },

    onSpeedKeyDown: function (jsn) {
        const info = jsn.payload.settings;
        if (!info) { $SD.api.showAlert(jsn.context); return; }
        const camid = info.camid || 'CAM1';
        const step = parseInt(info.step) || 5;
        const delta = info.direction === '-' ? -step : step;
        pendingSpeedUpdate = { context: jsn.context, camid, delta };
        $SD.api.getGlobalSettings($SD.uuid);
    },

    onFocusWillAppear: function (jsn) {
        const mode = jsn.payload && jsn.payload.settings && jsn.payload.settings.mode || 'auto';
        const labels = { auto: 'AF', near: 'F+', far: 'F−' };
        drawTextButton(labels[mode] || 'AF', (img) => $SD.api.setImage(jsn.context, img, 0));
    },

    onFocusSendToPlugin: function (jsn) {
        if (jsn.payload) {
            $SD.api.setSettings(jsn.context, jsn.payload);
            const labels = { auto: 'AF', near: 'F+', far: 'F−' };
            drawTextButton(labels[jsn.payload.mode] || 'AF', (img) => $SD.api.setImage(jsn.context, img, 0));
        }
    },

    onFocusKeyDown: function (jsn) {
        const info = jsn.payload.settings;
        if (!info) { $SD.api.showAlert(jsn.context); return; }
        const cam = getCamSettings(info);
        if (!cam.camip) { $SD.api.showAlert(jsn.context); return; }
        const mode = info.mode || 'auto';
        const cmd = mode === 'near' ? 'FocusNear' : mode === 'far' ? 'FocusFar' : 'FocusAuto';

        fetch(`${cam.camip}/cmdparse`, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: `ReqUserName=${cam.authuser}&ReqUserPwd=${cam.authpass}&CmdData={"Cmd":"ReqPtzCtrl","Content":{"PtzCmd":"${cmd}","ParamH":0,"ParamV":0}}`
        }).then(
            result => {
                if (result.status == 200) { if (mode === 'auto') $SD.api.showOk(jsn.context); return; }
                $SD.api.showAlert(jsn.context);
            },
            error => { console.log(error); $SD.api.showAlert(jsn.context); }
        );
    },

    onFocusKeyUp: function (jsn) {
        const info = jsn.payload.settings;
        if (!info) return;
        const mode = info.mode || 'auto';
        if (mode === 'auto') return;
        const cam = getCamSettings(info);
        if (!cam.camip) return;

        fetch(`${cam.camip}/cmdparse`, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: `ReqUserName=${cam.authuser}&ReqUserPwd=${cam.authpass}&CmdData={"Cmd":"ReqPtzCtrl","Content":{"PtzCmd":"FocusStop","ParamH":0,"ParamV":0}}`
        }).then(
            result => { if (result.status == 200) $SD.api.showOk(jsn.context); },
            error => console.log(error)
        );
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
    },
};
