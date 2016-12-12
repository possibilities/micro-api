# Micro API

### Summary

Minimal routing layer for building JSON APIs with Zeit's [micro](https://github.com/zeit/micro)

### Installation

```javascript
yarn add micro micro-api
// OR
npm install micro micro-api
```

### Usage

```javascript
import microApi from 'micro-api'
import { createApp, readApp } from 'handlers'

const api = microApi([
  {
    method: 'post',
    path: '/apps',
    handler: createApp,
  },
  {
    method: 'get',
    path: '/apps/:appId',
    handler: readApp,
  },
])

export default api
```

### Run

```
micro -p 3000 index.js
```

See [micro](https://github.com/zeit/micro#documentation) documentation for complete usage.
