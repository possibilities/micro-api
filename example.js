const microApi = require('./index')
const uuid = require('uuid')

const foos = []

const createFoo = ({ body }) => {
  const newFoo = Object.assign({}, body, { id: uuid() })
  foos.push(newFoo)
  return newFoo
}

const showFoo = ({ params: { fooId } }) => foos.find(f => f.id === fooId)

const api = microApi([
  {
    method: 'post',
    path: '/foos',
    handler: createFoo
  },
  {
    method: 'get',
    path: '/foos/:fooId',
    handler: showFoo
  }
])

module.exports = api
