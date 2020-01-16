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

### Nested usage

You can nest templates. The resulting template is flattened.

```javascript
const nest = require('nest-literal')

async function data() {
  return 'World'
}

const templateA = nest`Hello Data`
const templateB = nest`Foo ${templateA}, ${templateA} Bar`

console.log(await template)
```

### Joining templates

If you have multiple templates, you can join them using `join` or `.plus`

```javascript
const { nest, join } = require('nest-literal')

async function data() {
  return 'World'
}

const templateA = nest`Hello Data`
const templateB = nest`Foo ${templateA}, ${templateA} Bar`


// Using join 
const templateC = join(templateA, templateB)

// Using join with a delimiter
const templateC = join.with(',')(templateA, templateB)

// Using plus
const templateC = templateA.plus(templateB)

// Using reduce
const templateC = [templateA, templateB].reduce(join, null)

// Using reduce with a delimiter
const templateC = [templateA, templateB].reduce(join.with(','))


console.log(await template)
```

### Using raw strings

If you want to manipulate your template and keep your values separate, you can use `raw`.


```javascript
const { nest, raw } = require('nest-literal')

const tableName = 'MyTable'
const name = 'Leroy'

const sql = nest`select * from ${raw(tableName)} where name = ${name}`

```