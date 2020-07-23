import 'mocha'
import assert from 'assert'
import path from 'path'
import fs from 'fs'


import * as tp from '../test-parser'
import * as parserimpl from '../../src/parser-impl'
import * as grammar from '../../src/grammar'

import * as pf from '../../src/parsed-file'

import {createParsedFile, ParsedFileCache, TextParserResult} from '../../src/parsed-file'

function _stdlibIncludeResolver(uri : string) : string | false {
    const stdlibPath = path.normalize(__dirname + '../../../stdlib')

    const filename = path.normalize(stdlibPath + '/' + uri)
    return fs.readFileSync(filename, 'utf8')

}


describe('stdlib include list', () => {
    it('stdlib-include-list 1', () => {
        const result = tp.parseRule('file',
`
include "List.aes"

contract C =
  entrypoint test() = List.map((x) => x, [1,2,3,4])
`)

        assert.deepStrictEqual(result.warnings, [])
        assert.deepStrictEqual(result.errors, [])

        const pf = createParsedFile({
            fileuri  : undefined, 
            fileAst  : result.ast!,
            warnings : result.warnings,
            errors   : result.errors
        })

        assert.strictEqual(pf.includes.size, 1)

        const cache = new ParsedFileCache()

        cache.addParsedFile(pf, _stdlibIncludeResolver, tp.textParser)
        
        assert.strictEqual(cache.getErrors().length, 0)
        assert.strictEqual(cache.getWarnings().length, 0)

        const pfs = cache.getSortedParsedFiles()

        assert.strictEqual(pfs.length, 3)
        assert.strictEqual(pfs[0].fileuri, undefined)
        assert.strictEqual(pfs[1].fileuri, 'List.aes')
        assert.strictEqual(pfs[2].fileuri, 'ListInternal.aes')
        
        
    })
})