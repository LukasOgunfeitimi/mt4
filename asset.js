const send = require('./prices.js')

class Asset {
    constructor(name, id, digits) {
        this.name = name;
        this.id = id;
        this.digits = digits;
        this.bid;
        this.ask;
        this.history = [];
        this.diffThreshold;
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
        if (this.history.length === 60) this.history.shift();
        this.history.push(price);

        for (let i = this.history.length - 2; i >= 0; i--) {
            const oldPrice = this.history[i].bid;

            const diff = bid - oldPrice;
            //const diff = Math.abs((bid - oldPrice) / oldPrice * 100).toFixed(2); // % diff

            if (Math.abs(diff) >= this.diffThreshold) {
                let msg = this.name + ' changing at ' + diff + '\n' + 'Current: ' + price.bid + '\nOld: ' + oldPrice;
                send(msg)
                console.log('Old: ' + oldPrice + ' New: ' + bid + ' Diff: ' + Math.abs(diff));
                this.history = [];
                break;
            }
        }
        /*
        const oldPrice = this.history[0].bid;
        const diff = Math.abs(bid - oldPrice).toFixed(5);
        //const diff = Math.abs((price.bid - oldPrice) / oldPrice * 100).toFixed(2);

        console.log(this.name + ' Old: ' + oldPrice + ' New: ' + price.bid + ' Diff: ' + Math.abs(diff));
        //let msg = this.name + ' changing at ' + diff + '\n' + 'Current: ' + price.bid + '\nOld: ' + oldPrice;
        //send(msg)
        */
        
    }
}

module.exports = Asset;