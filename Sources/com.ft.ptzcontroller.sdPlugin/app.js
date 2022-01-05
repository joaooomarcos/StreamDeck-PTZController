$SD.on('connected', (jsonObj) => connected(jsonObj));

function connected(jsn) {
    // Subscribe to the willAppear and other events
    $SD.on('com.ft.ptzcontroller.action.willAppear', (jsonObj) => action.onWillAppear(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.keyUp', (jsonObj) => action.onKeyUp(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.sendToPlugin', (jsonObj) => action.onSendToPlugin(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.didReceiveSettings', (jsonObj) => action.onDidReceiveSettings(jsonObj));
    $SD.on('com.ft.ptzcontroller.action.propertyInspectorDidAppear', (jsonObj) => {
        console.log('%c%s', 'color: white; background: black; font-size: 13px;', '[app.js]propertyInspectorDidAppear:');
    });
    $SD.on('com.ft.ptzcontroller.action.propertyInspectorDidDisappear', (jsonObj) => {
        console.log('%c%s', 'color: white; background: red; font-size: 13px;', '[app.js]propertyInspectorDidDisappear:');
    });
    $SD.on('com.ft.ptzcontroller.action.keyDown', (jsonObj) => action.onKeyDown(jsonObj));

};

const action = {
    onWillAppear: function (jsn) {
        console.log(`[onWillAppear] ${JSON.stringify(jsn)}`);
    },

    onKeyUp: function (jsn) {
        console.log(`[onKeyUp] ${JSON.stringify(jsn)}`);

        if(!jsn.payload.settings || !jsn.payload.settings.camip) {
            $SD.api.showAlert(jsn.context);
            return;
        }

        let url = `${jsn.payload.settings.camip}/cmdparse`
        let info = jsn.payload.settings

        fetch(url, {
            "method": "POST",
            "headers": {
                "Content-Type": "text/plain"
            },
            "body": `ReqUserName=${info.authuser}&ReqUserPwd=${info.authpass}&CmdData={"Cmd":"ReqPtzCtrl","Content":{"PtzCmd":"Stop","ParamH":${info.speed},"ParamV":${info.speed}}}`
        }).then(
            result => {
                if (result.status == 200) {
                    $SD.api.showOk(jsn.context)
                    return;
                }
                $SD.api.showAlert(jsn.context);
            }, 
            error => {
                console.log(error);
                $SD.api.showAlert(jsn.context);
        });
    },

    onKeyDown: function (jsn) {
        console.log(`[onKeyDown] ${JSON.stringify(jsn)}`);

        if(!jsn.payload.settings || !jsn.payload.settings.camip) {
            $SD.api.showAlert(jsn.context);
            return;
        }

        let url = `${jsn.payload.settings.camip}/cmdparse`
        let info = jsn.payload.settings

        fetch(url, {
            "method": "POST",
            "headers": {
                "Content-Type": "text/plain"
            },
            "body": `ReqUserName=${info.authuser}&ReqUserPwd=${info.authpass}&CmdData={"Cmd":"ReqPtzCtrl","Content":{"PtzCmd":"${info.moviment}","ParamH":${info.speed},"ParamV":${info.speed}}}`
        }).then(
            result => {
                if (result.status == 200) {
                    $SD.api.showOk(jsn.context)
                    return;
                }
                $SD.api.showAlert(jsn.context);
            }, 
            error => {
                console.log(error);
                $SD.api.showAlert(jsn.context);
        });
    },

    onSendToPlugin: function (jsn) {
        console.log(`[onSendToPlugin] ${JSON.stringify(jsn)}`);

        if(jsn.payload) {
            $SD.api.setSettings(jsn.context, jsn.payload);
        }
    },
};

