const createRouter = require('uniloc')
const uuid = require('uuid')
const { json, send } = require('micro')

const sendPageNotFound = (req, res) => {
  const message = `${req.method} ${req.url} not found`
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
      // Allow a simple string or an error with message string
      const message = typeof(error) === 'string' ? error : error.message
      return send(res, 500, { message })
    }
  }
}

module.exports = microApi
