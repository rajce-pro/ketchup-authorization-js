const DefaultAuthorizer = require('./authorizer');
const mixin = require('merge-descriptors');

exports = module.exports = {};

exports.init = function init(options) {
    Object.assign(this, options);

    mixin(this.authorizer.prototype, DefaultAuthorizer.prototype, false);

    return this;
};

exports.authorize = function authorize(principal, callback) {
    const inst = new this.authorizer(this.baseUrl, principal);

    if (callback === undefined) {
        return inst.authorize();
    } else {
        inst.authorize().then(() => {
            callback(inst);
        });
    }
}
