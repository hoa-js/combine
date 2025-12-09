## @hoajs/combine

Combine middleware for Hoa.

## Installation

```bash
$ npm i @hoajs/combine --save
```

## Quick Start

```js
import { Hoa } from 'hoa'
import { every, some } from '@hoajs/combine'
import { RateLimiter } from '@hoajs/cloudflare-rate-limit'
import { basicAuth } from '@hoajs/basic-auth'
import { ip } from '@hoajs/ip'

const app = new Hoa()

app.use(
  some(
    every(
      ip({ allowList: ['192.168.0.2'] }),
      basicAuth({ username: 'admin', password: '123456' })
    ),
    // If both conditions are met, RateLimiter will not execute.
    RateLimiter(...)
  )
)

export default app
```

## Documentation

The documentation is available on [hoa-js.com](https://hoa-js.com/middleware/combine.html)

## Test (100% coverage)

```sh
$ npm test
```

## License

MIT
