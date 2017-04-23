import 'async-to-gen/register'
import 'babel-polyfill'

import test from 'ava'
import listen from 'test-listen'

import microApi from './index'
import micro from 'micro'
import request from 'request-promise'

const testRequestOptions = {
  json: true,
  // Otherwise request-promise just gives the body
  resolveWithFullResponse: true,
  // Don't reject messages that come back with error code (e.g. 404, 500s)
  simple: false
}

test('routes based on method', async t => {
  const api = microApi([
    {
      method: 'post',
      path: '/foos',
      handler: () => ({ name: 'post-foos' })
    },
    {
      method: 'get',
      path: '/foos',
      handler: () => ({ name: 'get-foos' })
    }
  ])

  const router = micro(api)
  const url = await listen(router)

  const getResponse = await request.get(`${url}/foos`, testRequestOptions)
  const getBody = getResponse.body

  t.deepEqual(getResponse.statusCode, 200)
  t.deepEqual(getBody.name, 'get-foos')

  const postResponse = await request.post(`${url}/foos`, testRequestOptions)
  const postBody = postResponse.body

  t.deepEqual(postResponse.statusCode, 200)
  t.deepEqual(postBody.name, 'post-foos')
})

test('passes through request and response', async t => {
  const api = microApi([
    {
      method: 'get',
      path: '/echoheader',
      handler: ({ req, res }) => {
        res.setHeader('foo', req.headers.foo)
        return {}
      }
    }
  ])

  const router = micro(api)
  const url = await listen(router)

  const getResponse = await request.get(
    `${url}/echoheader`,
    {
      ...testRequestOptions,
      headers: { foo: 'bar' }
    }
  )

  t.deepEqual(getResponse.statusCode, 200)
  t.deepEqual(getResponse.headers.foo, 'bar')
})

test('routes based on path', async t => {
  const api = microApi([
    {
      method: 'get',
      path: '/foos',
      handler: () => ({ name: 'foos' })
    },
    {
      method: 'get',
      path: '/bars',
      handler: () => ({ name: 'bars' })
    }
  ])

  const router = micro(api)
  const url = await listen(router)

  const foosResponse = await request.get(`${url}/foos`, testRequestOptions)
  const foosBody = foosResponse.body

  t.deepEqual(foosResponse.statusCode, 200)
  t.deepEqual(foosBody.name, 'foos')

  const barsResponse = await request.get(`${url}/bars`, testRequestOptions)
  const barsBody = barsResponse.body

  t.deepEqual(barsResponse.statusCode, 200)
  t.deepEqual(barsBody.name, 'bars')
})

test('passes request body to handler', async t => {
  const api = microApi([
    {
      method: 'post',
      path: '/foos',
      handler: ({ body }) => body
    }
  ])

  const router = micro(api)
  const url = await listen(router)

  const foosResponse = await request.post(
    `${url}/foos`,
    {
      ...testRequestOptions,
      body: { foo: 'bar' }
    }
  )

  const foosBody = foosResponse.body

  t.deepEqual(foosResponse.statusCode, 200)
  t.deepEqual(foosBody.foo, 'bar')
})

test('passes URL params to handler', async t => {
  const api = microApi([
    {
      method: 'get',
      path: '/foos/:fooId',
      handler: ({ body, params }) => params
    }
  ])

  const router = micro(api)
  const url = await listen(router)

  const foosResponse = await request.get(`${url}/foos/1`, testRequestOptions)

  const foosBody = foosResponse.body

  t.deepEqual(foosResponse.statusCode, 200)
  t.deepEqual(foosBody.fooId, '1')
})

test('gracefully responds to non-existing routes', async t => {
  const api = microApi([])

  const router = micro(api)
  const url = await listen(router)

  const missingResponse = await request.get(`${url}/fuff`, testRequestOptions)
  const missingBody = missingResponse.body

  t.deepEqual(missingResponse.statusCode, 404)
  t.deepEqual(missingBody.message, 'GET /fuff not found')
})

test('gracefully responds to broken routes', async t => {
  const api = microApi([{
    method: 'get',
    path: '/baz',
    handler: () => { throw new Error('Broken!') }
  }])

  const router = micro(api)
  const url = await listen(router)

  const brokenResponse = await request.get(`${url}/baz`, testRequestOptions)
  const brokenBody = brokenResponse.body

  t.deepEqual(brokenResponse.statusCode, 500)
  t.deepEqual(brokenBody.code, 500)
  t.deepEqual(brokenBody.message, 'Broken!')
  t.truthy(brokenBody.stack.includes('Error: Broken!'))
})

test('raises a 404 when handler returns nothing', async t => {
  const api = microApi([{
    method: 'get',
    path: '/baz',
    handler: () => {}
  }])

  const router = micro(api)
  const url = await listen(router)

  const missingResponse = await request.get(`${url}/baz`, testRequestOptions)
  const missingBody = missingResponse.body

  t.deepEqual(missingResponse.statusCode, 404)
  t.deepEqual(missingBody.message, 'GET /baz not found')
})

test('handle custom error status code', async t => {
  const api = microApi([{
    method: 'get',
    path: '/baz',
    handler: () => {
      const e = new Error('Custom 400 error.')
      e.statusCode = 400
      throw e
    }
  }])

  const router = micro(api)
  const url = await listen(router)

  const missingResponse = await request.get(`${url}/baz`, testRequestOptions)
  const missingBody = missingResponse.body
  t.deepEqual(missingResponse.statusCode, 400)
  t.deepEqual(missingBody.message, 'Custom 400 error.')
})
