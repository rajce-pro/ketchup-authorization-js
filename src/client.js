const DefaultAuthorizer = require('./authorizer');
const mixin = require('merge-descriptors');

exports = module.exports = {};

exports.init = function init(options) {
    Object.assign(this, options);

    mixin(this.authorizer.prototype, DefaultAuthorizer.prototype, false);

    return this;
};

exports.authorize = function authorize(principal, callback) {
    const Authorizer = this.authorizer;

    // Authorizer represents single session opened by authorizing
    // via principal.
    const inst = new Authorizer(this.baseUrl, principal, !!this.logErrors);

    if (callback === undefined) {
        return inst.authorize();
    } else {
        inst.authorize().then(() => {
            callback(inst);
        });
    }
}
