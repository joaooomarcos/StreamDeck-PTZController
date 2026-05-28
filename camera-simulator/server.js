const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 8765;

// ANSI colors for terminal output
const C = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
};

function log(label, value, color = C.cyan) {
    console.log(`  ${C.dim}${label.padEnd(12)}${C.reset} ${color}${value}${C.reset}`);
}

function parseBody(bodyStr) {
    // Body format: ReqUserName=...&ReqUserPwd=...&CmdData={JSON}
    const params = {};
    bodyStr.split('&').forEach(part => {
        const eqIdx = part.indexOf('=');
        if (eqIdx === -1) return;
        const key = part.slice(0, eqIdx);
        const value = decodeURIComponent(part.slice(eqIdx + 1).replace(/\+/g, ' '));
        params[key] = value;
    });
    return params;
}

function handleCmdparse(req, res) {
    let body = '';

    req.on('data', chunk => { body += chunk; });

    req.on('end', () => {
        console.log(`\n${C.bold}${C.green}▶ ${new Date().toLocaleTimeString()} — POST /cmdparse${C.reset}`);

        const params = parseBody(body);

        log('User', params.ReqUserName || '(none)');
        log('Password', params.ReqUserPwd ? '****' : '(none)');

        let cmdData = null;
        try {
            cmdData = JSON.parse(params.CmdData || '{}');
        } catch (e) {
            log('CmdData', `Parse error: ${e.message}`, C.red);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'invalid CmdData JSON' }));
            return;
        }

        const cmd = cmdData.Cmd;
        const content = cmdData.Content || {};

        log('Cmd', cmd, C.yellow);

        if (cmd === 'ReqPtzCtrl') {
            log('PtzCmd', content.PtzCmd, C.bold);
            if (content.PtzCmd !== 'Stop') {
                log('Speed H', content.ParamH);
                log('Speed V', content.ParamV);
            }
        } else if (cmd === 'ReqPresetCtrl') {
            log('PresetCmd', content.PresetCmd, C.bold);
            log('PresetID', content.PresetID);
        } else {
            log('Content', JSON.stringify(content));
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ result: 'ok', cmd }));
    });
}

const server = http.createServer((req, res) => {
    const pathname = url.parse(req.url).pathname;

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end();
        return;
    }

    if (req.method === 'POST' && pathname === '/cmdparse') {
        handleCmdparse(req, res);
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`${C.red}Porta ${PORT} já está em uso. Tente: PORT=9000 node server.js${C.reset}`);
    } else {
        console.error(`${C.red}Erro: ${err.message}${C.reset}`);
    }
    process.exit(1);
});

server.listen(PORT, () => {
    console.log(`${C.bold}${C.green}PTZ Camera Simulator${C.reset}`);
    console.log(`${C.dim}Listening on http://localhost:${PORT}${C.reset}`);
    console.log(`${C.dim}Use http://localhost:${PORT} as Camera IP in Stream Deck${C.reset}\n`);
});
