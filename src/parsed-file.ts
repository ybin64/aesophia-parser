
import {List, Map} from 'immutable'


import {
    AstItem, AstItem_TopIncludeDecl, BeginEndPos, AstItem_TopNamespaceDecl
} from './grammar'

import {
    ParseError, ParseWarning, ParseErrWarn
} from './grammar'

import {
    FileParseError, FileParseWarning, FileParseErrWarn, createBeginEndPosError
} from './parser'

/**
 * Used when the parser returns no Ast
 */
const _NoTopFileAst : AstItem = {
    type : 'file',
    children : [],
    loc : {
        b : [-1, -1, -1],
        e : [-1, -1, -1]
    }
}
export type Include = {
    path : string
    ast  : AstItem_TopIncludeDecl
}

export type Namespace = {
    ast : AstItem_TopNamespaceDecl
}

export type IncludeList = List<Include>
export type NamespaceMap = Map<string, Namespace>

export type ParsedFile = {
    fileuri : string | undefined
    ast     : AstItem
    includes : IncludeList
    namespaces : NamespaceMap
    warnings : FileParseWarning[]
    errors   : FileParseError[]
}


function _parseErrWarn2FileParseErrWarn(fileuri : string | undefined, ews : ParseErrWarn[]) : FileParseErrWarn[] {
    return ews.map(ew => {
        return {
            message : ew.message,
            location : ew.location,
            filename : fileuri
        }
    })
}

export function createParsedFile(args : {
    fileuri  : string | undefined, 
    fileAst  : AstItem,
    warnings : ParseWarning[],
    errors   : ParseError[]
}) : ParsedFile {

    const topItems = _getTopItems(args.fileAst)
  
    const ret : ParsedFile = {
        fileuri : args.fileuri,
        ast : args.fileAst,
        includes : topItems.includes,
        namespaces : topItems.namespaces,
        warnings : _parseErrWarn2FileParseErrWarn(args.fileuri, args.warnings),
        errors   : _parseErrWarn2FileParseErrWarn(args.fileuri, args.errors)
    }

    return ret
}


/**
 * Return the file content
 * @returns string - File content
 * @returns file - Couldn't resolve file
 */
export type FileContentResolver = (fileuri : string) => string | false

export type TextParserResult = {
    ast : AstItem | undefined
    warnings : ParseWarning[]
    errors   : ParseError[]
}

export type TextParser = (text : string) => TextParserResult

export class ParsedFileCache {
    private _cache = Map<string | undefined, ParsedFile>()

    public addParsedFile(pf : ParsedFile, fileResolver : FileContentResolver, textParser : TextParser) {

        if (this._cache.has(pf.fileuri)) {
            throw new Error(`Parsed file "${pf.fileuri}" already in cache`)
        }

        this._addParsedFile(pf, fileResolver, textParser)
    }

    public removeCachedFile(fileuri : string) {
        this._cache = this._cache.remove(fileuri)
    }

    public getFile(fileuri : string) : ParsedFile | undefined {
        return this._cache.get(fileuri)
    }

    public getNamespace(con : string) : Namespace | undefined {
        let ret : Namespace | undefined = undefined

        this._cache.forEach(c => {
            ret = c.namespaces.get(con)
            if (ret) {
                return false
            }
        })

        return ret
    }

    getErrors() : FileParseError[] {
        let ret : FileParseError[] = []
        this._cache.forEach(ci => {
            ret = ret.concat(ci.errors)
        })
        return ret
    }

    getWarnings() : FileParseWarning[] {
        let ret : FileParseWarning[] = []
        this._cache.forEach(ci => {
            ret = ret.concat(ci.warnings)
        })
        return ret
    }

    
    getParsedFiles() : ParsedFile[] {
        return Array.from(this._cache.values())
    }

    getSortedParsedFiles() : ParsedFile[] {
        return this.getParsedFiles().sort((a, b) => {
            if (a === undefined) {
                return -1
            }

            if (b === undefined) {
                return 1
            }


            if ((a.fileuri as string) < (b.fileuri as string)) {
                return -1
            } else if ((a.fileuri as string) > (b.fileuri as string)) {
                return 1
            }

            return 0
        })
    }
    
    
    private _addParsedFile(pf : ParsedFile, fileResolver : FileContentResolver, textParser : TextParser) {
        if (this._cache.has(pf.fileuri)) {
            // Already in cache
            return
        }
        
        this._cache = this._cache.set(pf.fileuri, pf)

        /*
        this._setErrWarnUri(pf.errors, pf.fileuri)
        this._setErrWarnUri(pf.warnings, pf.fileuri)
        */

        // Resolve and parse include files
        pf.includes.forEach((inc) => {
            const content = fileResolver(inc.path)

            if (content === false) {
                this._addError(pf.errors, pf.fileuri,`Can't find include "${inc.path}"`, inc.ast.include.loc)
            } else {
                const result = textParser(content)

                this._addParsedFile(createParsedFile({
                    fileuri : inc.path,
                    fileAst : result.ast ? result.ast : _NoTopFileAst,
                    warnings : result.warnings, 
                    errors : result.errors
                }), fileResolver, textParser)
            }
        })
    }

    /*
    private _setErrWarnUri(ew : FileParseErrWarn[], uri: string | undefined) {
        ew.forEach(item => {
            item.filename = uri
        })
    }
    */
    
    private _addError(errors : FileParseError[], fileuri : string | undefined, errorText : string, errorLoc : BeginEndPos) {
        errors.push(createBeginEndPosError(errorText, errorLoc, fileuri))
    }
    
}

// -----------------------------------------------------------------------------
// Private functions

function _getTopItems(fileAst : AstItem) : {
    includes : IncludeList 
    namespaces : NamespaceMap
} {
    let includes = List<Include>()
    let namespaces = Map<string, Namespace>()

    for (let top of fileAst.children) {      
        if (top.type === 'top-include-decl') {
            const inc = top as AstItem_TopIncludeDecl
            includes = includes.push({
                path : inc.include.text,
                ast  : inc
            })
        } else if (top.type === 'top-namespace-decl') {
            const ns = top as AstItem_TopNamespaceDecl
     
            if (!namespaces.has(ns.con.text)) {
                namespaces = namespaces.set(ns.con.text, {
                    ast : ns
                })
            }
        }
    }

    return {
        includes : includes,
        namespaces : namespaces
    }
}