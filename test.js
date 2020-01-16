const {nest, join} = require('.')
const assert = require('assert')

async function main() {
  const data = {
    value: 1,
    toString() {
      return this.value.toString()
    }
  }

  function getDataSync() {
    return data.value
  }

  const template1 = nest`[${data}]`
  assert.strictEqual(template1.toString(), '[1]')
  data.value = 2
  assert.strictEqual(template1.toString(), '[2]')
  const template2 = nest`{${template1},${data},${getDataSync},${getDataSync()},${data},${null},${undefined},${[1,2,3]}}`
  assert.strictEqual(template2.toString(), '{[2],2,2,2,2,null,undefined,1,2,3}')
  data.value = 3
  assert.strictEqual(template2.toString(), '{[3],3,3,2,3,null,undefined,1,2,3}')

  async function getDataAsync() {
    return data.value
  }

  const template3 = nest`[${getDataAsync}]`
  assert.strictEqual(await template3, '[3]')
  data.value = 4
  assert.strictEqual(await template3, '[4]')
  const template4 = nest`{${template3},${getDataAsync},${getDataAsync()},${data},${null},${undefined},${[1,2,3]}}`
  assert.strictEqual(await template4, '{[4],4,4,4,null,undefined,1,2,3}')


  await testFlatten()

  console.log(nest`hello ${join([1,2,3].map(x => nest`[${x}]`))} world`)
  console.log(template3.plus(template4))

  console.log(await [template1, template2, template3].reduce(join.with('---'), null))
}

async function testFlatten() {
  const a = nest`hello ${nest`foo`} world`
  assert.deepStrictEqual(a.callSite, ['hello foo world'])
  assert.deepStrictEqual(a.substitutions, [])

  const b = nest`hello ${nest`foo ${1 + 2} bar`} world`
  assert.deepStrictEqual(b.callSite, ['hello foo ', ' bar world'])
  assert.deepStrictEqual(b.substitutions, [3])

  const c = nest`hello ${nest`foo ${1 + 2} bar ${3 + 4} baz`} world ${new nest([])}${new nest([])}${new nest([])}`
  assert.deepStrictEqual(c.callSite, ['hello foo ', ' bar ', ' baz world '])
  assert.deepStrictEqual(c.substitutions, [3, 7])


  const d = nest`hello ${nest`foo ${nest`leroy ${1 + 2} jenkins`} bar`} world`
  assert.deepStrictEqual(d.callSite, ['hello foo leroy ', ' jenkins bar world'])
  assert.deepStrictEqual(d.substitutions, [3])


  console.log(String.raw(...d))
  console.log(...d)
  
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})

