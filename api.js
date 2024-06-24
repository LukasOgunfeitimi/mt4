const { subtle } = require('crypto').webcrypto;
// seeds
const pE = "13ef13b2b76dd8:5795gdcfb2fdc1ge85bf768f54773d22fff996e3ge75g5:75"
const nn = ":e4dd535gf:ddg7361613d6885fc6841ffd:4g:g498g8266dg:eff33886f738c"
const $k = "bfddfd:b:c5b5bdd976fbc::86dec9b:bfbc:685cgc7115389"
const IC = "987264ef98b:159fe89dd9bf986fc97ggcd7:27dg95dd28173b45f48b:d8e397"

class MT4 {
    constructor(user_info) {
        this.user_info = user_info;
        this.algo = {
            name: 'AES-CBC',
            iv: new Uint8Array(16)
        };
        this.cipher = {
            name: "AES-CBC"
        }
        this.op_codes = {
            init: 0,
            password: 1,
        }
        this.encryption_keys = {
            first: null,     // 2,222,2,161,166,92,199,148,104,79,203,234,30,203,15,215,74,230,87,228,54,98,193,30,238,136,93,47,214,79,73,100
            second: null,    // 157,60,196,36,254,156,207,98,80,80,44,87,116,235,87,48,238,201,63,159,56,127,113,85,207,157,238,34,119,94,98,123
            third_data: null,// 81,136,66,98,1,88,174,204,236,154,155,74,74,204,134,94,171,153,117,205,184,169,174,171,149,116,191,182,0,66,120 // seed for generating 'forth', this is not an encryption key
            third: null,     // 25,238,172,118,133,113,32,145,159,203,56,49,142,48,114,56,80,23,178,215,59,233,12,236,193,220,6,203,233,178,229,141
            forth: null,     // 135,97,83,222,135,169,4,142,215,140,200,174,135,94,184,111,251,198,145,108,248,76,193,112,98,163,78,55,169,199,210,134
            main: null,      // recieve from fetch()
        }
    }
    async loadKeys() {
        this.encryption_keys.first = await subtle.importKey('raw', this.normalizeKey(this.createKey(pE)), this.cipher, true, ["encrypt", "decrypt"])
    
        this.encryption_keys.second = await subtle.importKey('raw', this.normalizeKey(this.createKey(nn)), this.cipher, true, ["encrypt", "decrypt"])
    
        this.encryption_keys.third_data = await subtle.encrypt(this.algo, this.encryption_keys.second, this.normalizeKey(["518842620158" + this.createKey($k)].join("")))
        this.encryption_keys.third = await subtle.importKey('raw', this.encryption_keys.third_data, this.cipher, true, ["encrypt", "decrypt"])
    
        this.encryption_keys.forth = await subtle.importKey('raw', this.normalizeKey(this.createKey(IC)), this.cipher, true, ["encrypt", "decrypt"])
        
        this.encryption_keys.main = await subtle.importKey('raw', this.normalizeKey(this.user_info.key), this.cipher, true, ["encrypt", "decrypt"])

        console.log("Encryption keys initialised")
    }
    async token() {
        const token = this.write8(this.user_info.token)
        const token_buf = this.init(this.op_codes.init, token)
        const token_data = await subtle.encrypt(this.algo, this.encryption_keys.first, token_buf)

        return token_data
    }
    async getData(op, data) {
        return await subtle.encrypt(this.algo, this.encryption_keys.main, this.init(op, data))
    }
    //Ze()
    init(op, data) {
        var bufAlias = new Uint8Array(4 + 0)
        if (data) {
            bufAlias = new Uint8Array(4 + data.byteLength)
            bufAlias.set(new Uint8Array(data), 4)
        }
        
        const buffer = new DataView(bufAlias.buffer);
        buffer.setUint8(0, Math.floor(0xFF * Math.random()), true);
        buffer.setUint8(1, Math.floor(0xFF * Math.random()), true);
        buffer.setUint8(2, op, true);
        return buffer.buffer
    
    }
    //Xf()
    createKey(key) {
        var result = [];
    
        for (var index = 0; index < key.length; index++) {
            var charCode = key.charCodeAt(index);
    
            if (charCode === 28) {
                result.push("&");
            } else if (charCode === 23) {
                result.push("!");
            } else {
                result.push(String.fromCharCode(charCode - 1));
            }
        }
    
        return result.join("");
    }
    //ad()
    normalizeKey(key) {
        var result = [];
        var halfLength = key.length / 2;
    
        for (var index = 0; index < halfLength; index++) {
            var hexSubstring = key.substr(2 * index, 2);
    
            if (hexSubstring) {
                result.push(Number("0x" + hexSubstring));
            }
        }
    
        return (new Uint8Array(result));
    }
    async password() {
        const password = this.write16('TU6sIxL', 64 + 16);
        const window_spec = this.normalizeKey('67068786ddd67fb402e56d865f299372'); // ['518842620158', 'Win32', 'WebKit', '0', 'en-GB', '2560x1440']
        const pw_buf = this.init(this.op_codes.password, this.pw_window_Js(password, window_spec))

        const pw_data = await subtle.encrypt(this.algo, this.encryption_keys.main, pw_buf)

        return pw_data
    }
    //Js()
    pw_window_Js(password, window) {
        const data = new Uint8Array(password)
    
        data.set(window, 64);
        return data.buffer;
    }
    write8(string, len) {
        if (!string) return;
    
        const buf = new DataView(new ArrayBuffer(len || string.length))
    
        for (var i = 0; i < string.length; i++) {
            buf.setInt8(i, string.charCodeAt(i), true)
        }
    
        return buf.buffer
    }
    write16(string, len) {
        if (!string) return;
    
        const buf = new DataView(new ArrayBuffer(len || string.length))
    
        var offset = 0
    
        for (var i = 0; i < string.length; i++) {
            buf.setInt16(offset, string.charCodeAt(i), true)
            offset += 2
        }
    
        return buf.buffer
    }
    getString8(data, offset, index) {
        let string = ''
        for (let i = offset; i < (offset + index); i++) {
            const char = data.getUint8(i, true);
            if (char === 0) break;
            string += String.fromCharCode(char);
        }
        return string;
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
        const digits = Math.pow(10, 5);
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
            asset: "NZDCHF.b",
            period: 1,
            from: 0,
            to: Date.now(),
        }
        const {asset, period, from, to} = test_data
        let offset = 0;
        let data = new DataView(new ArrayBuffer(24))

        for (let i = 0; i < asset.length; i++) {
            data.setInt8(i, asset.charCodeAt(i), true)
        }

        data.setInt32(offset += 12, period, true); // period (minutes) eg 1
        data.setInt32(offset += 4, from / 1000, true); // from
        data.setInt32(offset + 4, to ? to / 1000 : 2147483647, true); // to
        return data.buffer; 
    }
    async decrypt(message) {
        return await subtle.decrypt(this.algo, this.encryption_keys.main, message)
    }
}
 
module.exports = MT4