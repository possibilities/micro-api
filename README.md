# Micro API

### Summary

Minimal routing layer for building JSON APIs with [micro](https://github.com/zeit/micro)

### Installation

```javascript
yarn add micro-api
// OR
npm install micro-api
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
