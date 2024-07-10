const send = require('./prices.js')

class Asset {
    constructor(name, id, digits) {
        this.name = name;
        this.id = id;
        this.digits = digits;
        this.bid;
        this.ask;
        this.history = [];
        this.diffThreshold = this.getThreshold()
    }
    getThreshold() {
        if (this.name === 'XAUUSD.b') return 15;
        if (this.name === 'GBPJPY.b') return 1;
        if (this.name === 'BTCUSD.b') return 2000;
        if (this.name === 'ETHUSD.b') return 125;
    }
    processNewPrice({timeStamp, bid}) {
        const minute = 1000;

        const lastPrice = this.history[this.history.length - 1];

        if (!lastPrice) {
            this.history.push({timeStamp, bid});
            return;
        }

        const getLatestMinute = lastPrice.timeStamp
        const priceMinute = timeStamp;


        if (!(priceMinute > getLatestMinute + minute)) return;

        const price = {
            timeStamp,
            bid
        }
        if (this.history.length === 20) this.history.shift();
        this.history.push(price);

        for (let i = this.history.length - 2; i >= 0; i--) {
            const oldPrice = this.history[i].bid;
            const diff = Math.abs(bid - oldPrice).toFixed(2);

            //const diff = Math.abs((bid - oldPrice) / oldPrice * 100).toFixed(2);

            if (diff > this.diffThreshold) {
                let msg = this.name + ' changing at ' + diff + '\n' + 'Current: ' + price.bid + '\nOld: ' + oldPrice;
                send(msg)
                console.log('Old: ' + oldPrice + ' New: ' + bid + ' Diff: ' + Math.abs(diff));
            }
        }
        /*
        const oldPrice = this.history[0].bid;
        const diff = Math.abs(bid - oldPrice)
        //const diff = Math.abs((price.bid - oldPrice) / oldPrice * 100).toFixed(2);

        console.log(this.name + ' Old: ' + oldPrice + ' New: ' + price.bid + ' Diff: ' + Math.abs(diff));
        let msg = this.name + ' changing at ' + diff + '\n' + 'Current: ' + price.bid + '\nOld: ' + oldPrice;
        send(msg)
        */
        return false;
    }
}

module.exports = Asset;