@finwo/ipfilter
===============

[![license](https://img.shields.io/github/license/finwo/ts-express-ipfilter)](https://github.com/finwo/ts-express-ipfilter/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/@finwo/ipfilter)](https://npmjs.com/package/@finwo/ipfilter)

@finwo/ipfilter is an ip filter middleware implementation built to be compatible
with both CommonJS and ESM, written in typescript. This package will allow you
to have a list of blocked IP addresses or specifically allowed IP addresses, so
you can increase the security of your express-based application.

Both single IP addresses and CIDR ranges are supported.

## Installation

To start using @finwo/ipfilter, install the package via NPM:

```sh
npm install --save @finwo/ipfilter
```

Once installed, you can implement the IP filter as follows:

```ts
import { ipfilter, defaultDeniedHandler } from '@finwo/ipfilter';
import express from 'express';

const app = express();

// Default behavior (allowList)
app.use(ipfilter([
  '127.0.0.1',
  '192.168.0.0/24',
]));

// Specify options, shown = default
app.use(ipfilter([
  '10.0.0.0/8',
], {
  deniedHandler    : defaultDeniedHandler,
  trustForwardedFor: true,
  cacheSize        : 1000,
  cacheTTL         : 1000 * 60 * 5,
  mode             : 'allowList',
}));

app.listen(5000);
```

API
---

- Constructor
  - `ipfilter(listedIPs: iplist, options: Opts = {}): middleware`
- Opts
  - `deniedHandler(req, res, next): void`<br/>
      The method that will handle sending a 'Permission denied' response to the client.
      If you want to decide to allow the request even if the IP was denied, you can call the `next` function instead of sending a response.
  - `trustForwardedFor: boolean`<br/>
      Whether or not to trust the `x-forwarded-for` header for detecting the client IP
  - `cacheSize: number`<br/>
      The maximum number of client IPs to keep in cache
  - `cacheTTL: number`<br/>
      The maximum age of a client IP to keep in cache
  - `mode: 'allowList | blockList`<br/>
      Which operating mode the filter should work in
