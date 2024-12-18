const WebSocket = require('ws');
const fetch = require('./fetch.js')
const MT4 = require('./api.js')
const send = require('./webhook.js')
const Asset = require('./asset.js')
const Coinbase = require('./coinbase.js');
class bot {
    constructor(server, user_info, password) {
        this.server = server
        this.socket = null;
        this.api = new MT4(user_info, password);
        this.user_info = user_info;
        this.wantedAssets = {
            'XAUUSD': 15,
            'GBPJPY': 1,
            'BTCUSD': 2000,
            'ETHUSD': 125,
            'US30'  : 250
        };
        this.assets = [];
        this.encryption = false;
        this.connect()
    }
    async connect() {
        await this.api.loadKeys();

        this.socket = new WebSocket(this.server)
        this.socket.binaryType = 'arraybuffer'
        this.socket.onopen = this.onopen.bind(this)
        this.socket.onmessage = this.onmessage.bind(this)
        this.socket.onclose = this.onclose.bind(this)
    }
    async onopen() {
        console.log('connected')

        const token = await this.api.token();

        this.send(token)
        
    }
    async onmessage(message) { 
        const msg = await this.api.decrypt(message.data.slice(8))
        const data = new DataView(msg);
        const op = data.getUint16(2, true);
        const f = data.getUint8(4, true);
        const d = msg.slice(5);
        switch (op) {
            case 0: // Tk
                const id = data.getUint16(0, true);
                console.log('Recieved ID: ' + id)

                this.encryption = true;

                const password = await this.api.getPassword()

                this.send(password)
                break
            case 1:
                this.send(await this.api.init(3))
                break;
            case 15: // connection estiablished
                const msg = new DataView(d).getUint32(0, true);
                if (msg === 0) {
                    console.log('connection success')

                    this.send(await this.api.init(6))
                }
                else console.log('connection failed')
                break
            case 10: // order
                break;
            case 3: // data
                break;
            case 6: // data
                this.processAllAssets(d);
                this.subscribeToAsset();
                break;
            case 8:
                this.processPriceUpdate(d);
                break;
            case 11: // historical data
                //this.getHistoricalBars(d);
            default:
        }
    }
    processPriceUpdate(data) {
        const d = new DataView(data);
        const prices = []; 
        for (let i = 0; i < Math.floor(d.byteLength / 14); i++) {
            const price = this.getPriceInfo(d, i * 14);
            if (!price) continue;
            const asset = this.assets.find(asset => asset.id === price.id);

            if (!(Object.keys(this.wantedAssets).includes(asset.name))) continue;
            
            asset.processNewPrice(price);
        }
        return prices;
    }
    getPriceInfo(data) {
        const priceInfo = {};
        let offset = 0;
        priceInfo.id = data.getInt16(offset, true);
        
        const asset = this.assets.find(asset => asset.id === priceInfo.id);
        if (!asset) return;

        priceInfo.name = asset.name;
        priceInfo.timeStamp = data.getInt32(offset += 2, true) * 1000;

        let type = priceInfo.timeStamp === 0 ? 'Int' : 'Float';

        priceInfo.bid = data['get' + type + '32'](offset += 4, true).toFixed(asset.digits);
        priceInfo.ask = data['get' + type + '32'](offset += 4, true).toFixed(asset.digits);

        if (type === 'Int') {
            priceInfo.bid /= Math.pow(10, asset.digits);
            priceInfo.ask /= Math.pow(10, asset.digits);
        }
        return priceInfo
    }
    async subscribeToAsset() {
        const assets = Object.keys(this.wantedAssets).map(asset => this.assets.find(a => a.name === asset).id)

        const buffer = new DataView(new ArrayBuffer(2 * assets.length + 2));

        let offset = 0;
        buffer.setInt16(offset, assets.length, true);

        for (let i = 0; i < assets.length; i++) {
            buffer.setInt16(offset += 2, assets[i], true)
        }
        
        send("listening for " + Object.keys(this.wantedAssets).length + " assets", JSON.stringify(this.wantedAssets));
        console.log(this.wantedAssets);
        
        this.send(await this.api.init(7, buffer.buffer));
    }
    processAllAssets(data) {
        const d = new DataView(data);
        for (let i = 0; i < Math.floor(d.byteLength / 260); i++) {
            let offset = 260 * i; 
            const asset = new Asset();
            asset.name = this.api.getString8(d, offset, 12);

            if (!Object.keys(this.wantedAssets).includes(asset.name)) continue;

            asset.diffThreshold = this.wantedAssets[asset.name]; 

            this.api.getString8(d, offset += 12, 64); // long name
            this.api.getString8(d, offset += 64, 12); // margin currency
            d.getInt32(offset += 12, true);           // idk

            asset.digits = d.getInt32(offset += 4, true);

            d.getInt32(offset += 4, true);            // idk
            offset += 4                               // HEX colour

            asset.id = d.getInt16(offset += 4, true);

            this.assets.push(asset);
        }
        console.log(this.assets)
    }
    async getHistoricalAsset() {
        this.send(await this.api.init(11, this.requestAsset()));
    }
    getHistoricalBars(data) {
        const d = new DataView(data);
        const bars = [];
        for (let i = 0; i < Math.floor(d.byteLength / 28); i++) {
            const bar = this.getBars(d, 28 * i);
            bars.push(bar);
        }
        //send(bars.toString().substring(0,100))
        return bars;
    }
    getBars(data, offset) {
        const d = [];
        d[0] = 1000 * data.getInt32(offset, true);
        d[1] = data.getInt32(offset += 4, true);
        d[2] = data.getInt32(offset += 4, true);
        d[3] = data.getInt32(offset += 4, true);
        d[4] = data.getInt32(offset += 4, true);
        d[5] = data.getFloat64(offset + 4, true);

        // Maintains precision 
        const digits = Math.pow(10, 3);
        d[2] += d[1];
        d[3] += d[1];
        d[4] += d[1];

        d[1] /= digits;
        d[2] /= digits;
        d[3] /= digits;
        d[4] /= digits;
        return d
    }
    requestAsset(q) {
        const test_data = {
            asset: "GBPJPY.b",
            period: 1,
            from: 0,
            to: Date.now(),
        }
        const {asset, period, from, to} = test_data
        let offset = 0;
        const data = new DataView(new ArrayBuffer(24))

        for (let i = 0; i < asset.length; i++) {
            data.setInt8(i, asset.charCodeAt(i), true)
        }

        data.setInt32(offset += 12, period, true); // period (minutes) eg 1
        data.setInt32(offset += 4, from / 1000, true); // from
        data.setInt32(offset + 4, to ? to / 1000 : 2147483647, true); // to
        return data.buffer; 
    }
    onclose(e) {
        console.log('closed')
        send("connection closed attempting reconneciton :\n" + e);
        setTimeout(this.connect, 2500);
    }

    async send(buf) {
        if(!this.socket && this.socket.readyState === WebSocket.OPEN) return;

        if (this.encryption) {
            buf = await this.api.encrypt(buf);
        }

        const offsetByteLength = 8; // extra memory to store message length
        const msgLength = buf.byteLength || 0;
    
        var dataAlias = new Uint8Array(offsetByteLength + msgLength);
        dataAlias.set(new Uint8Array(buf), offsetByteLength);
        dataAlias = dataAlias.buffer;
    
        const data = new DataView(dataAlias);
        data.setUint32(0, msgLength, true);
        data.setUint32(4, 1, true);

        this.socket.send(data.buffer);
    }
}

// todo:
// http server:
//  alerts
//  being able to change frequency
let alerter;
// chart 1700325136524_graph
async function main({username, password, server}) {
    const info = await fetch(username, server)

    const data = await info.json()

    console.log(data)
    
    const user_info = {
        key: data.key,
        token: data.token
    }
    
    alerter = new bot('wss://' + data.signal_server + '/', user_info, password)
}
//setTimeout(()=> {
//    const a = alerter.assets.find(a => a.name === "BTCUSD");
//	
//    a.diffPriceThreshold = 1;
//    a.historyInterval = 10;
//    console.log("changed to fast interval");
//}, 5000)
const creds = {
    username: '12686389',
    password: 'jycf51',
    server: 'ICMarketsSC-Demo01'
}

let checkInterval = 1000 * 60 * 60; // check every hour
let previousProfit = undefined;
let thresholdAlerter = 250; // alert every time the profit jumps this amount

async function CheckCoinbase() {
    const data = await Coinbase();

    if (!data) return;

    const profit = data.profit;

    if (!previousProfit) {
        previousProfit = profit;
        return;
    }

    const diff = previousProfit - profit;

    if (Math.abs(diff) >= thresholdAlerter) {
        const direction = diff > 0 ? 'increasing' : 'decreasing';
        previousProfit = profit;
        send(2, "Profit " + direction, '£' + profit);
    }
}

setInterval(CheckCoinbase, checkInterval);
//main(creds)


