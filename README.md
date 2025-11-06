## @hoajs/combine

Combine middleware for Hoa.

## Installation

```bash
$ npm i @hoajs/combine --save
```

## Quick Start

```js
import { Hoa } from 'hoa'
import { combine } from '@hoajs/combine'

const app = new Hoa()
app.use(combine())

app.use(async (ctx) => {
  ctx.res.body = `Hello, Hoa!`
})

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
