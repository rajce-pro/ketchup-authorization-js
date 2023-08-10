module.exports = Authorizer;

function Authorizer(baseUrl, principal, logErrors) {
    Object.assign(this, { baseUrl, principal, logErrors });

    this.authorizedState = false;
    return this;
}

const proto = Authorizer.prototype;

proto.authorize = async function authorize() {
    const principal = this.principal;
    const url = this.baseUrl;

    if (!principal) {
        throw new Error("Principal is not defined");
    }

    const token = this.token.bind(this);
    const basic = this.basic.bind(this);

    var result = undefined;

    if (typeof principal === "string") {
        result = await token(url, principal);
    } else if (Array.isArray(principal)) {
        result = await token(url, principal[0], false);
        if (!result) {
            result = await token(url, principal[1], true);
            this.principal = result;
        }
    } else if (["principal", "credentials"].every(principal.hasOwnProperty.bind(principal))) {
        result = await basic(url, principal);
        this.principal = result;
    } else {
        throw new Error("Invalid principal");
    }

    this.authorizedState = result !== undefined;

    return this;
}

proto.token = async function token(
    baseUrl, principal, isRefresh = false
) {
    const doCatch = this.doCatch;

    let url = baseUrl;
    if (isRefresh) {
        url += "/v1/auth/refresh";
        const init = {
            method: "POST",
            body: JSON.stringify({ refreshToken: principal })
        };

        return await doCatch(fetch(url, init));
    } else {
        url += "/v1/user/details";
        const init = {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + principal,
            }
        }
        return await doCatch(fetch(url, init));
    }
}

proto.basic = async function basic(baseUrl, principal) {
    const doCatch = this.doCatch;
    const url = baseUrl + "/v1/auth/authenticate";
    const init = {
        method: "POST",
        body: JSON.stringify(principal)
    };
    return await doCatch(fetch(url, init));
}

proto.authorized = function authorized() {
    return this.authorizedState;
}

proto.doCatch = async function doCatch(fetch) {
    try {
        return await fetch;
    } catch (error) {
        if (this.logErrors) {
            console.error(error);
        }
        return undefined;
    }
}
