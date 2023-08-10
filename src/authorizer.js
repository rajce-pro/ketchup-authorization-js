module.exports = Authorizer;

function Authorizer(baseUrl, principal) {
    this.baseUrl = baseUrl;
    this.principal = principal;
    return this;
}

const proto = Authorizer.prototype;

proto.authorize = async function authorize() {
    const principal = this.principal;
    const url = this.baseUrl;

    let result = undefined;
    if (typeof principal === "string") {
        result = await token(url, principal);
    } else if (Array.isArray(principal)) {
        result = await token(url, principal[0], false);
        if (!result) {
            result = await token(url, principal[1], true);
            this.principal = result;
        }
    } else if (["username", "password"].every(principal.hasOwnProperty)) {
        result = await basic(url, principal);
        this.principal = result;
    }

    this.authorizedState = result !== undefined;
    return this;
}

async function token(
    baseUrl, principal, isRefresh = false
) {
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

async function basic(baseUrl, principal) {
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

async function doCatch(fetch) {
    try {
        return await fetch();
    } catch (error) {
        console.error(error);
        return undefined;
    }
}
