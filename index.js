const createRouter = require('uniloc')
const uuid = require('uuid')
const { json, send, createError } = require('micro')

const debug = message => {
  if (process.env.NODE_ENV === 'development') {
    console.error(message)
  }
}

const sendPageNotFound = (req, res) => {
  const message = `${req.method} ${req.url} not found`
  debug(message)
  return send(res, 404, { message })
}

const microApi = routeConfigs => {
  let routes = {}
  let handlers = {}

  routeConfigs.forEach(routeConfig => {
    const id = uuid()
    const method = routeConfig.method.toUpperCase()
    routes = Object.assign(
      routes,
      { [id]: `${method} ${routeConfig.path}` }
    )

    handlers = Object.assign(
      handlers,
      { [id]: routeConfig.handler }
    )
  })

  const router = createRouter(routes)

  return async (req, res) => {
    const route = router.lookup(req.url, req.method)
    const handler = handlers[route.name]

    if (!handler) return sendPageNotFound(req, res)

    try {
      let reqBody

      try {
        reqBody = await json(req)
      } catch(error) {
        reqBody = {}
      }

      const resBody = await handler({
        res,
        req,
        body: reqBody,
        params: route.options,
        headers: req.headers
      })

      // If there's a response return it
      if (resBody) {
        send(res, 200, resBody)
      // If there's no response treat it as missing
      } else {
        sendPageNotFound(req, res)
      }
    } catch(error) {
      const code = 500
      const { message, stack } = error
      debug(error)
      send(res, code, { message, stack, code })
    }
  }
}

module.exports = microApi
