const mixin = require('merge-descriptors');
const client = require('./client');
const defaultAuthorizer = require('./authorizer');

const defaultOptions = {
    authorizer: defaultAuthorizer,
    logErrors: false,
}

module.exports = function createClient(options) {
    options = Object.assign({}, defaultOptions, options);

    validateOptions(options, ["baseUrl", "authorizer", "logErrors"]);

    const makeApp = function() {
        return this;
    }

    const app = makeApp();

    mixin(app, client, false);

    return app.init(options);
}

function validateOptions(options, required) {
    const missing = required.filter(key => !options.hasOwnProperty(key));
    if (missing.length > 0) {
        throw new Error(`Missing required options: ${missing.join(", ")}`);
    }
}
