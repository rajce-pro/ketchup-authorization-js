const mixin = require('merge-descriptors');
const client = require('./client');
const defaultAuthorizer = require('./authorizer');

const defaultOptions = {
    baseUrl: 'http://localhost:8080',
    authorizer: defaultAuthorizer,
}

module.exports = function createClient(options) {
    options = Object.assign({}, defaultOptions, options);

    const app = function() {
        return this;
    }

    mixin(app, client, false);

    return app().init(options);
}
