# nest-literal

Use string literals with functions and promises.

## Usage

### Synchronous usage

Substitutions used in `nest` string literals will be evaluated lazily, thus if they reference objects or functions, the value may be different at the time the template is stringified. 

```javascript
const nest = require('nest-literal')

function data() {
  return 'World'
}

const template = nest`Hello ${data}`

console.log(template.toString())
```

### Asynchronous usage

If a substitution is a Promise, or a function that returns a promise, the promise can be resolved before the template is stringified if the template is used as a promise.

```javascript
const nest = require('nest-literal')

async function data() {
  return 'World'
}

const template = nest`Hello ${data}`

console.log(await template)
```
