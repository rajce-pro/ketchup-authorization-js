module.exports = Authorizer;

function Authorizer(baseUrl, principal, logErrors) {
    Object.assign(this, { baseUrl, principal, logErrors });

    this.tokenValue = undefined;
    this.lastErr = undefined;
    return this;
}

const proto = Authorizer.prototype;

proto.authorize = async function() {
    const principal = this.principal;
    const url = this.baseUrl;

    if (!principal) {
        throw new Error("Principal is not defined");
    }

    const token = this.tokenAuth.bind(this);
    const basic = this.basicAuth.bind(this);

    let result = undefined;

    if (typeof principal === "string") {
        result = await token(url, principal);
        if (result) {
            this.tokenValue = { token: principal };
        }
    } else if (Array.isArray(principal)) {
        result = await token(url, principal[0], false);
        if (!result) {
            result = await token(url, principal[1], true);
            this.principal = result;
            if (result) {
                this.tokenValue = result;
            }
        }
    } else if (["principal", "credentials"].every(principal.hasOwnProperty.bind(principal))) {
        result = await basic(url, principal);
        this.principal = result;
        if (result) {
            this.tokenValue = result;
        }
    } else {
        throw new Error("Invalid principal");
    }

    return this;
}

proto.user = async function() {
    return this.authorizedFetch('/v1/user/details', {});
}

proto.nodeState = async function(node) {
    return this.authorizedFetch('/v1/node/checknode', {
        method: 'POST', body: JSON.stringify({ node })
    });
}

proto.authorizedFetch = async function(relative, fetchInit, retry = true) {
    validateState(this);

    const headers = fetchInit.headers || {};

    if (!headers.hasOwnProperty("Authorization")) {
        headers["Authorization"] = "Bearer " + this.principal;
    }

    fetchInit = Object.assign({}, fetchInit, { headers });

    const result = await this.doCatch(fetch(this.baseUrl + relative, fetchInit));
    if (result === undefined && retry) {
        await this.authorize();
        return await this.authorizedFetch(relative, fetchInit, false);
    }
    return result;
}

proto.tokenAuth = async function tokenAuth(
    baseUrl, principal, isRefresh = false
) {
    const doCatch = this.doCatch;

    let url = baseUrl;
    if (isRefresh) {
        url += "/v1/auth/refresh";
        const init = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken: principal })
        };

        return await doCatch(fetch(url, init));
    } else {
        url += "/v1/user/details";
        const init = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + principal,
            }
        }
        return await doCatch(fetch(url, init));
    }
}

proto.basicAuth = async function basicAuth(baseUrl, principal) {
    const doCatch = this.doCatch;
    const url = baseUrl + "/v1/auth/authenticate";
    const init = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(principal)
    };
    return await doCatch(fetch(url, init));
}

proto.authorized = function authorized() {
    return this.tokenValue !== undefined;
}

proto.token = function token() {
    validateState(this);
    return this.tokenValue.token;
}

proto.refreshToken = function refreshToken() {
    validateState(this);
    return this.tokenValue.refreshToken;
}

proto.doCatch = async function doCatch(fetch) {
    try {
        const result = await fetch.then(res => res.json());
        if (result.error) {
            this.lastErr = result.error;
            return undefined;
        }
        return result;
    } catch (error) {
        if (this.logErrors) {
            console.error(error);
        }
        return undefined;
    }
}

function validateState(inst) {
    if (!inst.authorized()) {
        throw new Error("Unauthorized");
    }
}
