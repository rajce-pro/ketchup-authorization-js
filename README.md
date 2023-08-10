# authorization-js
Simple JavaScript wrapper for the ketchup-authorization-server API

## Installation
```bash
npm install --save @rajce.pro/authorization-js
```

## Usage
```javascript
import authorization from '@rajce.pro/authorization-js';

const client = authorizationn({
    baseUrl: 'http://ketchup-authorization-server:1234'
});

// Authorize using async-await
let session;

session = await client.authorize({ principal: 'username', credentials: 'password' });
session = await client.authorize('token');
session = await client.authorize(['token', 'refreshToken']);

// Is authorized? (success)
const authorized = session.authorized();
const details = session.user();
const permission = session.nodeState('permission.node.value');

// Authorize using callback
client.authorize({ principal: 'username', credentials: 'password' }, (session) => {
    console.log(session.authorized());
});
```
