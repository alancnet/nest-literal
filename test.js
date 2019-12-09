const nest = require('.')
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

}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})


