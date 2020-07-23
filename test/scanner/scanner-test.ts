
import 'mocha'
import assert from 'assert'

import * as scanner from '../../src/scanner'

import {TokenType, TokenError, Scanner} from '../../src/scanner'


const TestScanner = scanner.Test.TestScanner


describe('scanner', function() {

    it('nextCh() - 1', function() {
        let scanner = new Scanner('abc')

        assert.deepStrictEqual(scanner.pos(), {
            pos  : 0,
            line : 1,
            col  : 1
        })

        assert.strictEqual(scanner.nextCh(), 'a')
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 1,
            line : 1,
            col  : 2
         })

        assert.strictEqual(scanner.nextCh(), 'b')
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 2,
            line : 1,
            col  : 3
        })

        assert.strictEqual(scanner.nextCh(), 'c')
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 3,
            line : 1,
            col  : 4
        })

        assert.strictEqual(scanner.nextCh(), false)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 3,
            line : 1,
            col  : 4
        })

        assert.strictEqual(scanner.nextCh(), false)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 3,
            line : 1,
            col  : 4
        })
    })

    it('peekCh() - 1', function() {
        let scanner = new Scanner('abc')

        assert.deepStrictEqual(scanner.pos(), {
            pos  : 0,
            line : 1,
            col  : 1
        })

        assert.strictEqual(scanner.peekCh(), 'a')
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 0,
            line : 1,
            col  : 1
        })

        assert.strictEqual(scanner.peekCh(1), 'a')
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 0,
            line : 1,
            col  : 1
        })

        assert.strictEqual(scanner.peekCh(2), 'b')
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 0,
            line : 1,
            col  : 1
        })

        assert.strictEqual(scanner.peekCh(3), 'c')
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 0,
            line : 1,
            col  : 1
        })

        assert.strictEqual(scanner.peekCh(4), false)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 0,
            line : 1,
            col  : 1
        })
    })

    it('tryMatch() - 1', function() {
        let scanner = new Scanner('foo bar')
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 0,
            line : 1,
            col  : 1
        })

        assert.strictEqual(scanner.tryMatch(''), false)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 0,
            line : 1,
            col  : 1
        })

        assert.strictEqual(scanner.tryMatch('bar'), false)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 0,
            line : 1,
            col  : 1
        })

        assert.strictEqual(scanner.tryMatch('foo'), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 3,
            line : 1,
            col  : 4
        })

        assert.strictEqual(scanner.peekCh(), ' ')

        assert.strictEqual(scanner.tryMatch(' '), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 4,
            line : 1,
            col  : 5
         })

        assert.strictEqual(scanner.tryMatch('bar'), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 7,
            line : 1,
            col  : 8
        })

        assert.strictEqual(scanner.peekCh(), false)
        assert.strictEqual(scanner.nextCh(), false)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 7,
            line : 1,
            col  : 8
        })

    })

    it('tryMatchWSP - 1', function() {
        let text = ' \t\x09'
        let scanner = new Scanner(text)

        assert.strictEqual(text.length, 3)
        assert.strictEqual(text.charCodeAt(0), 32)
        assert.strictEqual(text.charCodeAt(1), 9)
        assert.strictEqual(text.charCodeAt(2), 9)

        assert.deepStrictEqual(scanner.pos(), {
            pos  : 0,
            line : 1,
            col  : 1
        })

        assert.strictEqual(scanner.tryMatchWSP(), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 1,
            line : 1,
            col  : 2
        })

        assert.strictEqual(scanner.tryMatchWSP(), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 2,
            line : 1,
            col  : 3
        })

        assert.strictEqual(scanner.tryMatchWSP(), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 3,
            line : 1,
            col  : 4
        })

        assert.strictEqual(scanner.tryMatchWSP(), false)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 3,
            line : 1,
            col  : 4
        })
    })


    it('tryMatchWSP /* */ comment - 1', function() {
        //                         01234567890123456
        let scanner = new Scanner('/* foo bar */ ')

        assert.strictEqual(scanner.tryMatchWSP(), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 14,
            line : 1,
            col  : 15
        })


        assert.strictEqual(scanner.tryMatchWSP(), false)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 14,
            line : 1,
            col  : 15
        })


        // Multiple comments
        //                     01234567890123456789012345
        scanner = new Scanner('/* foo bar *//* foo */ ')

        assert.strictEqual(scanner.tryMatchWSP(), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 23,
            line : 1,
            col  : 24
        })
    })

    it('tryMatchWSP // comment - 1', function() {
        //                         01234567890   123456
        let scanner = new Scanner('// foo bar \x0A ')

        assert.strictEqual(scanner.tryMatchWSP(), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 13,
            line : 2,
            col  : 2
        })


        assert.strictEqual(scanner.tryMatchWSP(), false)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 13,
            line : 2,
            col  : 2
        })


        // Multiple comments
        //                     01234567890   1234567   8   901234567890
        scanner = new Scanner('// foo bar \x0A// foo\x0D\x0A ')

        assert.strictEqual(scanner.tryMatchWSP(), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 21,
            line : 3,
            col  : 2
        })
    })

    it('tryMatchLineBreak - 1', function() {
        let text = '\r\n\n'
        let scanner = new Scanner(text)

        assert.strictEqual(text.length, 3)
        assert.strictEqual(text.charCodeAt(0), 13)
        assert.strictEqual(text.charCodeAt(1), 10)
        assert.strictEqual(text.charCodeAt(2), 10)

        assert.deepStrictEqual(scanner.pos(), {
            pos  : 0,
            line : 1,
            col  : 1
        })

        assert.strictEqual(scanner.tryMatchLineBreak(), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 2,
            line : 2,
            col  : 1
        })

        assert.strictEqual(scanner.tryMatchLineBreak(), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 3,
            line : 3,
            col  : 1
        })

        assert.strictEqual(scanner.tryMatchWSP(), false)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 3,
            line : 3,
            col  : 1
        })

    })

    it('isAlpha() - 1', function() {
        let scanner = new Scanner('')

        assert.strictEqual(scanner.isAlpha('@'), false)
        assert.strictEqual(scanner.isAlpha('A'), true)
        assert.strictEqual(scanner.isAlpha('Z'), true)
        assert.strictEqual(scanner.isAlpha('['), false)


        assert.strictEqual(scanner.isAlpha('`'), false)
        assert.strictEqual(scanner.isAlpha('a'), true)
        assert.strictEqual(scanner.isAlpha('z'), true)
        assert.strictEqual(scanner.isAlpha('{'), false)
    })

    it('isDigit() - 1', function() {
        let scanner = new Scanner('')

        assert.strictEqual(scanner.isDigit('/'), false)
        assert.strictEqual(scanner.isDigit('0'), true)
        assert.strictEqual(scanner.isDigit('9'), true)
        assert.strictEqual(scanner.isDigit(':'), false)
    })

})

// Using the TestScanner to expose test functions
describe('scanner - comments', function() {
    it('// - 1', function() {

        // EOF
        let scanner = new TestScanner(
// 01234567890
  '// foo')

        assert.strictEqual(scanner.tryMatchSlashSlashComment(), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 6,
            line : 1,
            col  : 7
        })

        // EOL \n
        scanner = new TestScanner(
// 012345   67890
  '// foo\x0A')

        assert.strictEqual(scanner.tryMatchSlashSlashComment(), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 7,
            line : 2,
            col  : 1
        })

        // EOL \r\n
        scanner = new TestScanner(
// 012345   6   7890
  '// foo\x0D\x0A')

        assert.strictEqual(scanner.tryMatchSlashSlashComment(), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 8,
            line : 2,
            col  : 1
        })
    })

    it('/* */ - valid - 1', function() {

        // EOF
        let scanner = new TestScanner(
// 01234567890
  '/* foo */')

        assert.strictEqual(scanner.tryMatchSlashStarComment(), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 9,
            line : 1,
            col  : 10
        })


        // Single \n
        scanner = new TestScanner(
// Line  1          2
// Col   1          123
//       0123456   7890
        '/* foo \x0A*/')

        assert.strictEqual(scanner.tryMatchSlashStarComment(), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 10,
            line : 2,
            col  : 3
        })

        // Two \n
        scanner = new TestScanner(
// Line  1          2    3
// Col   1          123  1234
//       0123456   78   90123456
        '/* foo \x0A \x0A */')

        assert.strictEqual(scanner.tryMatchSlashStarComment(), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 13,
            line : 3,
            col  : 4
        })

        // Single \r\n
        scanner = new TestScanner(
// Line  1              2
// Col   1              1234
//       0123456   7   8901
        '/* foo \x0D\x0A*/')

        assert.strictEqual(scanner.tryMatchSlashStarComment(), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 11,
            line : 2,
            col  : 3
        })


        // Two \r\n
        scanner = new TestScanner(
// Line  1              2            3
// Col   1              1234         12345
//       0123456   7   890123   4   567890
        '/* foo \x0D\x0A fooo\x0D\x0A  */')

        assert.strictEqual(scanner.tryMatchSlashStarComment(), true)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 20,
            line : 3,
            col  : 5
        })
    })

    it('/* */ - invalid - 1', function() {

        // Missing ending /
        let scanner = new TestScanner(
// 01234567890
  '/* foo *')

        assert.deepStrictEqual(scanner.pos(), {
            pos  : 0,
            line : 1,
            col  : 1
        })


        assert.strictEqual(scanner.tryMatchSlashStarComment(), false)
        assert.deepStrictEqual(scanner.pos(), {
            pos  : 0,
            line : 1,
            col  : 1
        })

    })

})


describe('scanner token', () => {
    it('scanner-token id 1', () => {
        // 'foo'
        const scanner = new Scanner('foo')

        const result = scanner.nextToken()
        assert.deepStrictEqual(result, {
            type : TokenType.Id,
            s : {
                text : 'foo',
                loc : {
                    b : [0, 1, 1],
                    e : [2, 1, 3]
                },
                fullLoc : {
                    b : [0, 1, 1],
                    e : [2, 1, 3]
                },  
            }
        })

        assert.deepStrictEqual(false, scanner.nextToken())
    })

    it('scanner-token id 2', () => {
        const scanner = new Scanner('foo ')
        const result = scanner.nextToken()
        

        assert.deepStrictEqual(result, {
            type : TokenType.Id,
            s : {
                text : 'foo',
                loc : {
                    b : [0, 1, 1],
                    e : [2, 1, 3]
                },
                fullLoc : {
                    b : [0, 1, 1],
                    e : [2, 1, 3]
                },  
            }
        })

        assert.deepStrictEqual(false, scanner.nextToken())
    })

    it('scanner-token id 3', () => {
        const scanner = new Scanner(' bar ')
        const result = scanner.nextToken()
        

        assert.deepStrictEqual(result, {
            type : TokenType.Id,
            s : {
                text : 'bar',
                loc : {
                    b : [1, 1, 2],
                    e : [3, 1, 4]
                },
                fullLoc : {
                    b : [1, 1, 2],
                    e : [3, 1, 4]
                },  
            }
        })

        assert.deepStrictEqual(false, scanner.nextToken())
    })

    it('scanner-token con 1', () => {
        // 'foo'
        const scanner = new Scanner('Foo')

        const result = scanner.nextToken()
        assert.deepStrictEqual(result, {
            type : TokenType.Con,
            s : {
                text : 'Foo',
                loc : {
                    b : [0, 1, 1],
                    e : [2, 1, 3]
                },
                fullLoc : {
                    b : [0, 1, 1],
                    e : [2, 1, 3]
                },  
            }
        })

        assert.deepStrictEqual(false, scanner.nextToken())
    })

    it('scanner-token qid 1', () => {
        //                           0123456
        const scanner = new Scanner('Foo.bar')

        const result = scanner.nextToken()
        assert.deepStrictEqual(result, {
            type : TokenType.QId,
            s : {
                text : 'Foo.bar',
                loc : {
                    b : [0, 1, 1],
                    e : [6, 1, 7]
                },
                fullLoc : {
                    b : [0, 1, 1],
                    e : [6, 1, 7]
                },  
            }
        })

        assert.deepStrictEqual(false, scanner.nextToken()) 
    })
  
    
    it('scanner-token qcon 1', () => {
        //                           0123456
        const scanner = new Scanner('Foo.Bar')

        const result = scanner.nextToken()
        assert.deepStrictEqual(result, {
            type : TokenType.QCon,
            s : {
                text : 'Foo.Bar',
                loc : {
                    b : [0, 1, 1],
                    e : [6, 1, 7]
                },
                fullLoc : {
                    b : [0, 1, 1],
                    e : [6, 1, 7]
                },  
            }
        })

        assert.deepStrictEqual(false, scanner.nextToken()) 
    })
})

describe('scanner token string', () => {
    it('scanner-token-string ok 1', () => {
        //                           01234
        const scanner = new Scanner('"one"')
        const result = scanner.nextToken()

        
        assert.deepStrictEqual(result, {
            type : TokenType.String,
            s : {
                text : 'one',
                loc : {
                    b : [1, 1, 2],
                    e : [3, 1, 4]
                },
                fullLoc : {
                    b : [0, 1, 1],
                    e : [4, 1, 5]
                },  
            }
        })       
    })

    it('scanner-token-string missing right quote', () => {
        // EOF

        //                         01234
        let scanner = new Scanner('"one')
        let result = scanner.nextToken()
 
        assert.deepStrictEqual(result, {
            type : TokenType.String,
            error : TokenError.MissingRightStringQuote,
            s : {
                text : 'one',
                loc : {
                    b : [1, 1, 2],
                    e : [3, 1, 4]
                },
                fullLoc : {
                    b : [0, 1, 1],
                    e : [3, 1, 4]
                },  
            }
        })
        
        // CR
        scanner = new Scanner('"two\r!')
        result = scanner.nextToken()
 
        assert.deepStrictEqual(result, {
            type : TokenType.String,
            error : TokenError.MissingRightStringQuote,
            s : {
                text : 'two',
                loc : {
                    b : [1, 1, 2],
                    e : [3, 1, 4]
                },
                fullLoc : {
                    b : [0, 1, 1],
                    e : [3, 1, 4]
                },  
            }
        })

        // LF
        scanner = new Scanner('"thr\n!')
        result = scanner.nextToken()

        assert.deepStrictEqual(result, {
            type : TokenType.String,
            error : TokenError.MissingRightStringQuote,
            s : {
                text : 'thr',
                loc : {
                    b : [1, 1, 2],
                    e : [3, 1, 4]
                },
                fullLoc : {
                    b : [0, 1, 1],
                    e : [3, 1, 4]
                },  
            }
        })

        // CRLF
        scanner = new Scanner('"fou\r\n!')
        result = scanner.nextToken()

        assert.deepStrictEqual(result, {
            type : TokenType.String,
            error : TokenError.MissingRightStringQuote,
            s : {
                text : 'fou',
                loc : {
                    b : [1, 1, 2],
                    e : [3, 1, 4]
                },
                fullLoc : {
                    b : [0, 1, 1],
                    e : [3, 1, 4]
                },  
            }
        })

    })


})




