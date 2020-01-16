function nest(callSite, ...substitutions) {
  return new Template(callSite, ...substitutions)
}

function joinWith (delim, templates) {
  let accumulator = null
  for (let template of templates) {
    if (template instanceof Template) {
      if (!accumulator) accumulator = template
      else accumulator = delim ? nest`${accumulator}${delim}${template}` : accumulator.plus(template)
    }
  }
  return accumulator
}

function raw(string) {
  return new String(string)
}

function join (...templates) {
  if (templates.length === 1 && templates[0] && templates[0][Symbol.iterator]) return joinWith('', templates[0])
  return joinWith('', templates)
}

join.with = (delim) => (...templates) => {
  if (templates.length === 1 && templates[0] && templates[0][Symbol.iterator]) return joinWith(delim, templates[0])  
  return joinWith(delim, templates)
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
    callSite = callSite.slice()
    substitutions = substitutions.slice()
    for (let i = callSite.length - 1; i >= 0; i--) {
      let sub = substitutions[i]
      if (sub instanceof Template) {
        if (sub.callSite.length === 0) {
          callSite[i] = callSite[i] + callSite[i + 1]
          callSite.splice(i + 1, 1)
          substitutions.splice(i, 1)
        }
        if (sub.callSite.length === 1) {
          callSite[i] = callSite[i] + sub.callSite[0] + callSite[i + 1]
          callSite.splice(i + 1, 1)
          substitutions.splice(i, 1)
        }
        if (sub.callSite.length === 2) {
          callSite[i] = callSite[i] + sub.callSite[0]
          substitutions[i] = sub.substitutions[0]
          callSite[i + 1] = sub.callSite[1] + callSite[i + 1]
        }
        if (sub.callSite.length > 2) {
          callSite[i] = callSite[i] + sub.callSite[0]
          callSite[i + 1] = sub.callSite[sub.callSite.length - 1] + callSite[i + 1]
          callSite.splice(i + 1, 0, ...sub.callSite.slice(1, sub.callSite.length - 1))
          substitutions.splice(i, 1, ...sub.substitutions)
        }
      } else if (sub instanceof String) {
        callSite[i] = callSite[i] + sub + callSite[i + 1]
        callSite.splice(i + 1, 1)
        substitutions.splice(i, 1)
      }
    }

    this.callSite = callSite
    this.substitutions = substitutions
    Object.defineProperty(this.callSite, 'raw', {
      get: () => callSite
    })
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
  * [Symbol.iterator]() {
    yield this.callSite
    yield* this.substitutions
  }
  plus(template) {
    return nest`${this}${template}`
  }
}
module.exports = nest
module.exports.nest = nest
module.exports.join = join
module.exports.raw = raw
