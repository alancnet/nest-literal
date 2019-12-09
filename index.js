module.exports = function(callSite, ...substitutions) {
  return new Template(callSite, ...substitutions)
}

async function toStringAsync(value) {
  value = await value
  if (typeof value === 'string') return value
  if (typeof value === 'function') return await toStringAsync(await value())
  if (Array.isArray(value)) {
    let ret = []
    for (let v of value) {
      ret.push(await toStringAsync(v))
    }
    return ret.join(',')
  }
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  return value.toString()
}
function toStringSync(value) {
  if (typeof value === 'string') return value
  if (typeof value === 'function') return toStringSync(value())
  if (Array.isArray(value)) {
    let ret = []
    for (let v of value) {
      ret.push(toStringSync(v))
    }
    return ret.join(',')
  }
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  return value.toString()
}

class Template {
  constructor(callSite, ...substitutions) {
    this.callSite = callSite
    this.substitutions = substitutions
  }
  toString() {
    const string = []
    for (let i = 0; i < this.callSite.length; i++) {
      if (i) string.push(toStringSync(this.substitutions[i - 1]))
      string.push(toStringSync(this.callSite[i]))
    }
    return string.join('')
  }
  async then(resolve, reject) {
    try {
      const string = []
      for (let i = 0; i < this.callSite.length; i++) {
        if (i) string.push(await toStringAsync(this.substitutions[i - 1]))
        string.push(await toStringAsync(this.callSite[i]))
      }
      resolve(string.join(''))
    } catch (err) {
      reject(err)
    }
  }
}