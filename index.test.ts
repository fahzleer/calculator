import { describe, it, expect } from 'vitest'
import { evaluate, tokenize, format } from './index'

describe('evaluate — basic arithmetic', () => {
  it('addition', () => expect(evaluate('3 + 4')).toBe(7))
  it('subtraction', () => expect(evaluate('10 - 3')).toBe(7))
  it('multiplication', () => expect(evaluate('3 * 4')).toBe(12))
  it('division', () => expect(evaluate('10 / 2')).toBe(5))
  it('remainder', () => expect(evaluate('10 % 3')).toBe(1))
})

describe('evaluate — operator precedence', () => {
  it('* before +', () => expect(evaluate('3 + 4 * 2')).toBe(11))
  it('parentheses', () => expect(evaluate('(1 + 2) * (3 + 4)')).toBe(21))
})

describe('evaluate — unary minus', () => {
  it('negation', () => expect(evaluate('-5 + 8')).toBe(3))
  it('double negation', () => expect(evaluate('--5')).toBe(5))
})

describe('evaluate — decimal', () => {
  it('22 / 7', () => expect(format(evaluate('22 / 7'))).toBe('3.142857143'))
})

describe('evaluate — errors', () => {
  it('empty input', () => expect(() => evaluate('')).toThrow(SyntaxError))
  it('division by zero', () => expect(() => evaluate('1 / 0')).toThrow(RangeError))
  it('0 % 0 has no result', () => expect(() => evaluate('0 % 0')).toThrow(RangeError))
  it('unknown token', () => expect(() => evaluate('abc')).toThrow(SyntaxError))
  it('incomplete expression', () => expect(() => evaluate('1 +')).toThrow(SyntaxError))
})

describe('tokenize', () => {
  it('numbers and operators', () =>
    expect(tokenize('3 + 4')).toEqual([
      { type: 'num', value: 3 },
      { type: 'op', value: '+' },
      { type: 'num', value: 4 },
    ]))

  it('decimal', () => expect(tokenize('3.14')).toEqual([{ type: 'num', value: 3.14 }]))

  it('parentheses', () =>
    expect(tokenize('(1)')).toEqual([
      { type: 'open' },
      { type: 'num', value: 1 },
      { type: 'close' },
    ]))

  it('unknown token', () => expect(() => tokenize('???')).toThrow(SyntaxError))
})

describe('format', () => {
  it('integer', () => expect(format(7)).toBe('7'))
  it('negative integer', () => expect(format(-5)).toBe('-5'))
  it('decimal max 10 digits', () => expect(format(1 / 3).length).toBeLessThanOrEqual(12))
})
