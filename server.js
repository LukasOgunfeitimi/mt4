const https = require('https');
const fs = require('fs');
const options = {
    //key: fs.readFileSync('/etc/ssl/araxy_key.key'),
    //cert: fs.readFileSync('/etc/ssl/araxy_cert.cer'),
};

function GetPrice() { return 5; }

function GetIntervals() { 
	return Object.keys(alerter.wantedAssets).map(asset => {
		const currAsset = alerter.assets.find(a => a.name === asset);
		if (!asset) return {message: "err"};
		return {
			'asset': currAsset.name,
			'interval': currAsset.historyInterval,
			'maxHistory': currAsset.historyMaxLength,
		}
	})
 }
function ChangeFrequency(asset, interval) { 
	const currAsset = alerter.assets.find(a => a.name === asset);
	if (!currAsset) return {message: "err"};
	currAsset.history = [];
	currAsset.historyInterval = interval
	return {message : asset + ": interval changed to " + (interval * 60) + ' minutes'} 
}

function ChangeMaxHistoryLength(asset, length) {
	const currAsset = alerter.assets.find(a => a.name === asset);
	if (!currAsset) return {err};
	currAsset.history = [];
	currAsset.historyMaxLength = length
	return {message : asset + ": Now storing " + length + " prices before updating"}; 
}

const GET = {
    GetPrice,
	GetIntervals
}
const POST = {
    ChangeFrequency,
	ChangeMaxHistoryLength
}

const methods = {
    GET,
    POST,
}
const req = {
    method: "POST",
    url: "ChangeIntervl"
}

function error() { return 0; }
const result = methods[req.method][req.url]?.() ?? error(req.url);

console.log(result)

const server = https.createServer(options, (req, res) => {
    if (req.method === 'POST' && req.url === '/submit') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            console.log('Received body:', body);
            try {
                const data = JSON.parse(body);
                console.log('Parsed data:', data);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Data received', received: data }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else {
        // Handle other requests (e.g., GET)
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Start the server on port 443 for HTTPS
//server.listen(3500, () => {
  //  console.log('Server is running on https://localhost');
//});