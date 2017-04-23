require('babel-polyfill')

const pathMatch = require('path-match')
const { json, send } = require('micro')

const configureRouter = routes => {
  const pathMatcher = pathMatch()

  routes = routes.map(route => {
    const matcher = pathMatcher(route.path)
    const method = route.method.toUpperCase()

    return { ...route, matcher, method }
  })

  const lookup = (url, method) => {
    method = method.toUpperCase()

    let params = false

    let route = routes.find(route => {
      if (route.method !== method) {
        return false
      }
      params = route.matcher(url)
      return !!params
    })

    if (route && params) {
      route = { ...route, params }
    }

    return route
  }

  return lookup
}

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

const microApi = routes => {
  const lookup = configureRouter(routes)

  return async (req, res) => {
    const route = lookup(req.url, req.method)

    if (!route) {
      return sendPageNotFound(req, res)
    }

    try {
      let reqBody

      try {
        reqBody = await json(req)
      } catch (error) {
        reqBody = {}
      }

      const resBody = await route.handler({
        res,
        req,
        body: reqBody,
        params: route.params,
        headers: req.headers
      })

      // If there's a response return it
      if (resBody) {
        send(res, 200, resBody)
      // If there's no response treat it as missing
      } else {
        sendPageNotFound(req, res)
      }
    } catch (error) {
      const { message, stack, statusCode } = error
      const code = statusCode || 500
      debug(error)
      send(res, code, { message, stack, code })
    }
  }
}

module.exports = microApi
