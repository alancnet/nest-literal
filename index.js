/**
 * 
 * @param {string[]} callSite 
 * @param  {...any} substitutions 
 * @returns {Template}
 */
function nest(callSite, ...substitutions) {
  return new Template(callSite, ...substitutions)
}

function joinWith (delim, templates) {
  let accumulator = null
  for (let template of templates) {
    if (!(template instanceof Template)) template = nest`${template}`
    if (template instanceof Template) {
      if (!accumulator) accumulator = template
      else accumulator = delim ? nest`${accumulator}${raw(delim)}${template}` : accumulator.plus(template)
    }
  }
  return accumulator
}

function raw(string) {
  return new String(string)
}

function merge (target, ...sources) {
  for (const b of sources) {
    for (const key in b) {
      const av = target[key]
      const bv = b[key]

      if (Array.isArray(bv)) {
        if (Array.isArray(av)) {
          target[key] = [...av, ...bv]
        } else {
          target[key] = [...bv]
        }
      } else if (bv instanceof Set) {
        if (av instanceof Set) {
          target[key] = new Set([...av, ...bv])
        } else {
          target[key] = new Set([...bv])
        }
      } else if (bv instanceof Map) {
        if (av instanceof Map) {
          target[key] = new Map([...av, ...bv])
        } else {
          target[key] = new Map([...bv])
        }
      } else {
        target[key] = bv
      }
    }
  }
  return target
}
function join (...templates) {
  if (templates.length === 1 && templates[0] && templates[0][Symbol.iterator]) return joinWith('', templates[0])
  if (templates.length === 4 && typeof templates[2] === 'number' && Array.isArray(templates[3])) return joinWith('', templates.slice(0, 2))
  return joinWith('', templates)
}

join.with = (delim) => (...templates) => {
  if (templates.length === 1 && templates[0] && templates[0][Symbol.iterator]) return joinWith(delim, templates[0])  
  if (templates.length === 4 && typeof templates[2] === 'number' && Array.isArray(templates[3])) return joinWith(delim, templates.slice(0, 2))
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
  /**
   * 
   * @param {string[]} callSite 
   * @param  {...any} substitutions 
   */
  constructor(callSite, ...substitutions) {
    callSite = callSite.slice()
    substitutions = substitutions.slice()
    const metas = []
    for (let i = callSite.length - 1; i >= 0; i--) {
      let sub = substitutions[i]
      if (sub instanceof Template) {
        metas.push(sub.meta)
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

    this.meta = merge({}, ...metas.reverse())

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
  /**
   * Appends meta data accessible with .meta.
   * @param {Object<string,any>} data
   * @returns {Template}
   */
  withMeta(data) {
    const template = new Template(this.callSite, ...this.substitutions)
    template.meta = Object.assign({}, this.meta, data)
    return template
  }
}
module.exports = nest
module.exports.nest = nest
module.exports.join = join
module.exports.raw = raw
module.exports.Template = Template