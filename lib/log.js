import moment from 'moment'

if (!('toJSON' in Error.prototype))
    Object.defineProperty(Error.prototype, 'toJSON', {
        value: function () {
            var alt = {};

            Object.getOwnPropertyNames(this).forEach(function (key) {
                alt[key] = this[key];
            }, this);

            return alt;
        },
        configurable: true,
        writable: true
    });

let log = {
    addr: "",
    info: function (msg) {
        console.info(`[${moment().format()} - ${this.addr}] | ${msg}`)
    },
    error: function (msg) {
        console.error(`[${moment().format()} - ${this.addr}] | ${msg}`)
    },
};

export default log
