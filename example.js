const microApi = require('./index')
const uuid = require('uuid')

const foos = []

const createFoo = foo => {
  const newFoo = Object.assign(
    {},
    foo,
    { id: uuid() }
  )

  foos.push(newFoo)

  return newFoo
}

const showFoo = (body, { fooId }) => foos.find(f => f.id === fooId)

const api = microApi([
  {
    method: 'post',
    path: '/foos',
    handler: createFoo,
  },
  {
    method: 'get',
    path: '/foos/:fooId',
    handler: showFoo,
  },
])

module.exports = api
