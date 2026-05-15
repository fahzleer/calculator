type Token =
  | { type: 'num'; value: number }
  | { type: 'op'; value: string }
  | { type: 'open' }
  | { type: 'close' }

const OPS = new Set(['+', '-', '*', '/', '%'])

export function tokenize(input: string): Token[] {
  const spaced = input.replace(/([+\-*/%()])/g, ' $1 ')
  const words = spaced.split(/\s+/).filter(Boolean)
  return words.map((word): Token => {
    if (/^\d+(\.\d+)?$/.test(word)) return { type: 'num', value: parseFloat(word) }
    if (word === '(') return { type: 'open' }
    if (word === ')') return { type: 'close' }
    if (OPS.has(word)) return { type: 'op', value: word }
    throw new SyntaxError(`Unknown token: "${word}"`)
  })
}

type State = { tokens: readonly Token[]; pos: number }

const peek = (state: State): Token | undefined => state.tokens[state.pos]
const next = (state: State): void => {
  state.pos++
}
const done = (state: State): boolean => state.pos >= state.tokens.length

const MAX_DEPTH = 200

function parseAddSub(state: State, depth = 0, left = parseTerm(state, depth)): number {
  const token = peek(state)
  if (token?.type !== 'op' || (token.value !== '+' && token.value !== '-')) return left
  next(state)
  return parseAddSub(
    state,
    depth,
    token.value === '+' ? left + parseTerm(state, depth) : left - parseTerm(state, depth),
  )
}

function parseTerm(state: State, depth = 0, left = parseUnary(state, depth)): number {
  const token = peek(state)
  if (token?.type !== 'op' || (token.value !== '*' && token.value !== '/' && token.value !== '%'))
    return left
  next(state)
  const value =
    token.value === '*'
      ? left * parseUnary(state, depth)
      : token.value === '/'
        ? left / parseUnary(state, depth)
        : left % parseUnary(state, depth)
  return parseTerm(state, depth, value)
}

function parseUnary(state: State, depth = 0): number {
  if (depth > MAX_DEPTH) throw new SyntaxError('Expression too deeply nested')
  const token = peek(state)
  if (token?.type === 'op' && token.value === '-') {
    next(state)
    return -parseUnary(state, depth + 1)
  }
  return parseAtom(state, depth)
}

function parseAtom(state: State, depth = 0): number {
  const token = peek(state)
  if (token === undefined) throw new SyntaxError('Expected a number or "("')
  if (token.type === 'num') {
    next(state)
    return token.value
  }
  if (token.type === 'open') {
    next(state)
    const inner = parseAddSub(state, depth + 1)
    if (peek(state)?.type !== 'close') throw new SyntaxError('Missing ")"')
    next(state)
    return inner
  }

  throw new SyntaxError(`Unexpected: "${token.type === 'op' ? token.value : token.type}"`)
}

export function evaluate(input: string): number {
  if (!input.trim()) throw new SyntaxError('Empty expression')

  const state = { tokens: tokenize(input), pos: 0 }
  const result = parseAddSub(state)

  if (!done(state)) {
    const token = state.tokens[state.pos]
    const display = token === undefined ? '?' : token.type === 'op' ? token.value : token.type
    throw new SyntaxError(`Unexpected token "${display}" at position ${state.pos}`)
  }
  if (Number.isNaN(result)) throw new RangeError('Result has no value (e.g. 0 % 0)')
  if (!isFinite(result)) throw new RangeError('Division by zero')
  if (Math.abs(result) > Number.MAX_SAFE_INTEGER) throw new RangeError('Result is too large')
  return result
}

export const format = (num: number): string => {
  if (Number.isInteger(num)) return num.toString()
  const precise = num.toPrecision(10)
  return precise.includes('e') ? precise : precise.replace(/\.?0+$/, '')
}

function processLines(text: string, write: (output: string) => void): void {
  const parts = text.split('\n')
  const lines = parts.at(-1) === '' ? parts.slice(0, -1) : parts

  lines.forEach((raw) => {
    const line = raw.trim()
    if (!line) {
      write('calc> ')
      return
    }
    try {
      write(`\n  = ${format(evaluate(line))}\n\ncalc> `)
    } catch (err) {
      write(`\n  Error: ${err instanceof Error ? err.message : err}\n\ncalc> `)
    }
  })
}

function start(): void {
  process.stdin.setEncoding('utf8')
  const write = (output: string): void => {
    process.stdout.write(output)
  }
  write('calc> ')
  process.stdin.on('data', (text: string) => {
    processLines(text, write)
  })
  process.stdin.on('end', () => {
    write('\nBye!\n')
    process.exit(0)
  })
}

if (import.meta.main) start()
