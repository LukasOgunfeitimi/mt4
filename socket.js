const WebSocket = require('ws');
const fetch = require('./fetch.js')
const MT4 = require('./api.js')

class bot {
    constructor(server, user_info) {
        this.server = server
        this.socket = null;
        this.api = new MT4(user_info);
        this.user_info = user_info;
        this.assets = []
        /*
        {
            key: data.key,
            token: data.token
        }
        */
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

                const password = await this.api.password()

                this.send(password)
                break
            case 1:
                break;
            case 15: // connection estiablished
                const msg = new DataView(d).getUint32(0, true);
                if (msg === 0) {
                    console.log('connection success')

                    this.send(await this.api.getData(3))
                    this.send(await this.api.getData(6))
                }
                else console.log('connection failed')
                break
            case 10: // order
                break;
            case 3: // data
                console.log(op + ' ' +data.byteLength);
                break;
            case 6: // data
                this.getAssets(d);
                setTimeout(()=>{
                    this.subscribeToAsset();
                },2000)
                console.log(op + ' ' + data.byteLength);
                break;
            case 11: // historical data
                this.getHistoricalBars(d);
            default:
        }
    }
    async subscribeToAsset() {
        this.send(await this.api.getData(11, this.api.requestAsset()));
    }
    getHistoricalBars(data) {
        const d = new DataView(data);
        const bars = [];
        for (let i = 0; i < Math.floor(d.byteLength / 28); i++) {
            const bar = this.api.getBars(d, 28 * i);
            bars.push(bar);
        }
        console.log(bars)
        return bars;
    }
    getAssets(data) {
        const d = new DataView(data);
        for (let i = 0, h = Math.floor(d.byteLength / 260); i < h; i++) {
            const asset = this.api.getString8(d, 260 * i, 12);
            this.assets.push(asset)
        }
    }

    onclose() {
        console.log('closed')
    }
    send(buf) {
        if(this.socket && this.socket.readyState === WebSocket.OPEN) {

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
}

// chart 1700325136524_graph
async function main() {
    const info = await fetch('89000015', 'EightcapLtd-Real2')

    const data = await info.json()

    console.log(data)
    
    const user_info = {
        key: data.key,
        token: data.token
    }

    new bot('wss://' + data.signal_server + '/', user_info)

}

main()


