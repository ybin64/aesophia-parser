// ----------------------------------------------------------------------------
// Copyright (c) Nicklas Bystedt. All rights reserved.
// Licensed under the MIT License.
// See the LICENSE file in the project root for license information.
// ----------------------------------------------------------------------------

import {
    AstItemType, AstItem, AstItem_Type,
    Pos, posRow, posCol,
    BeginEndPos, ParseError, ParseWarning,

    AddIncludeFunc, AddIncludeArgs,
} from './grammar'

import * as grammar from './grammar'

import {
    beginEndPos2ErrorLocation
} from './parser-lib'

import {
    Token, tokenToStrWithBELoc, tokenToStrWithFullBELoc,
    Scanner, ScannerPos, StrWithBELoc, 
    TokenType, TokenError
} from './scanner'


// ----------------------------------------------------------------------------

export type ParseResult = {
    ast : AstItem | undefined
    errors : ParseError[]
    warnings : ParseWarning[]
}

export function parse(scanner : Scanner) : ParseResult {
    return parseAstItem('file', scanner)
}

export function parseAstItem(type : AstItemType, scanner : Scanner) : ParseResult {
    const ps = _initParseState(scanner)
 
    let ast = _parse(ps, [type])
 
    return {
        ast : ast,
        errors : ps.errors,
        warnings : ps.warnings
    }   
}

function _initParseState(scanner : Scanner) : _ParseState {
    return {
        scanner : scanner,
        errors  : [],
        warnings : [],
        argOpaque : undefined,
        blocks : []
    }        
}


// -----------------------------------------------------------------------------
// Private function

function _scannerPos2Pos(scannerPos : ScannerPos) : Pos {
    return [scannerPos.pos, scannerPos.line, scannerPos.col]
}

function _scannerPos2BEPos(scannerPos : ScannerPos) : BeginEndPos {
    return {
        b : _scannerPos2Pos(scannerPos),
        e : _scannerPos2Pos(scannerPos)
    }
}

function _pos2BEPos(pos : Pos) : BeginEndPos {
    return {
        b : pos,
        e : pos
    }
}

function _astBEPos(astBegin : AstItem, astEnd : AstItem) : BeginEndPos {
    return {
        b : astBegin.loc.b,
        e : astEnd.loc.e
    }
}

function _tokenBEPos(tBegin : Token, tEnd : Token) : BeginEndPos {
    return {
        b : tBegin.s.fullLoc.b,
        e : tEnd.s.fullLoc.e
    }
}

type _ParseBlockInfo = {
    parentRefPos : BeginEndPos
    astCount : number
    firstChildPos? : BeginEndPos
}

type _ParseState = {
    scanner : Scanner

    // FIXME: Replace errors with immutable.List
    errors  : ParseError[]
    warnings : ParseWarning[]

    // Statment specific argument parsing data
    argOpaque : any

    kwEndPos? : ScannerPos | undefined

    blocks : _ParseBlockInfo[]
}

type _SavedParseState = {
    scannerPos : ScannerPos
    errors : ParseError[]
}

function _getSavedParseState(ps : _ParseState) : _SavedParseState {
    return {
        scannerPos : ps.scanner.pos(),

        // FIXME: Inefficient, use immutable.List instead
        errors : ps.errors.slice()
    }
}

function _setSavedParseState(ps : _ParseState, sps : _SavedParseState) {
    ps.scanner.setPos(sps.scannerPos)
    ps.errors = sps.errors
}




function _pushParseBlock(ps : _ParseState, parentRefPos : BeginEndPos) : _ParseBlockInfo {
    const ret : _ParseBlockInfo = {
        parentRefPos : parentRefPos,
        astCount : 0
    }

    ps.blocks.push(ret)
    return ret
}

function _popParseBlock(ps : _ParseState) : void {
    ps.blocks.pop()
}



const _zeroPos : Pos = [0, 1, 1]

function _addPos(p1 : Pos, p2 : Pos) : Pos {
    return [
        p1[0] + p2[0],
        p1[1] + p2[1] - 1,
        p1[2] + p2[2] - 1
    ]
}

function _addParseErrorRaw(errors : ParseError[], offset : Pos, text : string, beLoc : BeginEndPos) {
    errors.push({
        message : text,
        location : beginEndPos2ErrorLocation({
            b : _addPos(offset, beLoc.b),
            e : _addPos(offset, beLoc.e)
        })
    })
}


function _addParseError(ps : _ParseState, text : string, beLoc : BeginEndPos) {
    _addParseErrorRaw(ps.errors, _zeroPos, text, beLoc)
}

function _addUnexpectedTokenError(ps : _ParseState, token : string, pos : BeginEndPos) {
    _addParseErrorRaw(ps.errors, _zeroPos, `Unexpected token '${token}'`, pos)
}

function _parse(ps : _ParseState, rules : AstItemType[]) : AstItem | undefined {
    for (let rule of rules) {
        let scanPos = ps.scanner.pos()

        try {
            let ast = _parseAst(ps, rule)
            return ast

        } catch (e) {

            // e.name
            // e.message
            if (e.name === 'TypeError') {
                //console.error('e=', e)
                throw new Error(`Unknown Sophia statement "${rule}"`)
            }

            if (e instanceof NoMatchError) {
            } else {
                console.error('parser-impl.ts : _parse : e=', e)
            }

            ps.scanner.setPos(scanPos)
        }
    }

    return undefined
}

type _LiteralWithPosLoc = {
    text : string
    loc  : Pos
}


class NoMatchError extends Error {
    constructor() {
        super('no-match')
    }
}


function _initAstLoc(scanner : Scanner) : BeginEndPos {
    return {
        b : scanner.location(),
        e : [-1, -1, -1]
    }
}

function _matchNextChToken(ps : _ParseState, ch : string) : Token {
    const t = ps.scanner.nextToken()
    if (t && (t.type === TokenType.char) && (t.s.text === ch)) {
        return t
    }

    throw new NoMatchError()
}


function _matchNextToken(ps : _ParseState, kw : string) : Token {
    const t = ps.scanner.nextToken()
    if (t === false) {
        throw new NoMatchError()
    }

    if (t.s.text === kw) {
        return t
    }

    throw new NoMatchError()
}


function _isToken(t : Token | false, ch : string) : boolean {
    return (t && (t.s.text === ch))
}

function _isCharToken(t : Token | false, ch : string) : boolean {
    return (t && (t.type === TokenType.char) && (t.s.text === ch))
}

function _isOpToken(t : Token | false, text : string) : boolean {
    return (t && (t.type === TokenType.op) && (t.s.text === text))
}

function _buildAst<T extends AstItem>(type : AstItemType, children : AstItem[], stmtLoc : BeginEndPos) : T {
    return {
        type  : type,
        children : children,
        loc : stmtLoc
    } as T
}

function _checkValidStringToken(ps : _ParseState, t : Token) {
    if (t.error === TokenError.MissingRightStringQuote) {
        _addParseError(ps, "Missing string end quote", t.s.fullLoc)    
    }
}

// -----------------------------------------------------------------------------
// Match functions


function _tryMatchValidToken(ps: _ParseState, tt : TokenType) : Token | false {
    const orgPos = ps.scanner.pos()
    const t = ps.scanner.nextToken()
    if (t && (t.type === tt)) {
        return t
    }

    ps.scanner.setPos(orgPos)
    return false
}

function _matchId(ps: _ParseState) : Token {
    const id = ps.scanner.nextToken()

    if (id === false) {
        throw new NoMatchError()
    }

    if (id.type !== TokenType.Id) {
        throw new NoMatchError()
    }

    return id
}

function _matchIdCheckValid(ps: _ParseState) : Token {
    const id = ps.scanner.nextToken()

    if (id === false) {
        throw new NoMatchError()
    }

    if (id.type !== TokenType.Id) {
        _addParseError(ps, "Invalid identifier, format is [a-z_][A-Za-z0-9_']*", id.s.loc)
    }

    return id
}

function _matchConCheckValid(ps: _ParseState) : Token {
    const id = ps.scanner.nextToken()

    if (id === false) {
        throw new NoMatchError()
    }

    if (id.type !== TokenType.Con) {
        _addParseError(ps, "Invalid con, format is [A-Z][A-Za-z0-9_']* ", id.s.loc)
    }

    return id
}



function _matchChToken(ps : _ParseState, ch : string) : Token {
    const t = ps.scanner.nextToken()

    if (t && (t.type === TokenType.char) && (t.s.text === ch)) {
        return t
    }
    
    throw new NoMatchError()
}
function _tryMatchChToken(ps : _ParseState, ch : String) : Token | false {
    const orgPos = ps.scanner.pos()
    const t = ps.scanner.nextToken()

    if (t && (t.type === TokenType.char) && (t.s.text === ch)) {
        return t
    }

    ps.scanner.setPos(orgPos)
    return false
}


function _tryMatchNextToken(ps : _ParseState, matches : string[]) : Token | false {
    const pos = ps.scanner.pos()
    const t = ps.scanner.nextToken()

    if (t) {
        for (let m of matches) {
            if (m === t.s.text) {
                return t
            }
        }
    }

    ps.scanner.setPos(pos)
    return false
}


function _tryMatchBinOp(ps : _ParseState) : Token | false {

    const orgPos = ps.scanner.pos()
    const t = ps.scanner.nextToken()

    if (t && (t.type === TokenType.op)) {
        return t
    }

    ps.scanner.setPos(orgPos)
    return false
}

// -----------------------------------------------------------------------------
// Match <keyword> Id ['(' TVar* ')'] '='
// -----------------------------------------------------------------------------

type _MatchKwIdOptTVarEqResult = {
    kwt     : Token
    id      : Token
    tVars   : StrWithBELoc[] | null
    eq      : Token
}

function _matchKwIdOptTVarEq(ps : _ParseState, keyword : string) : _MatchKwIdOptTVarEqResult {
    const kwt = _matchNextToken(ps, keyword)
   
    const id = _matchIdCheckValid(ps)
    
    let tVars : StrWithBELoc[] | null = null

   
    if (_isCharToken(ps.scanner.peekToken(), '(')) {
        ps.scanner.nextToken()

        let pt = ps.scanner.peekToken()

        while ((pt !== false) && !_isCharToken(pt, ')')) {
            const orgPos = ps.scanner.pos()
            const tVar = ps.scanner.nextToken()
            //const tVar = _getTVar(ps)

            if (!tVar || (tVar.type !== TokenType.TVar)) {
              
                if (tVar) {
                    _addParseError(ps, 'Invalid type variable', tVar.s.fullLoc)
                } else {
                    // FIXME: Better error recovery
                    ps.scanner.setPos(orgPos)
                    break
                }
            } else {
                if (tVars === null) {
                    tVars = [tokenToStrWithBELoc(tVar)]
                } else {
                    tVars.push(tokenToStrWithBELoc(tVar))
                }
            }

            
            pt = ps.scanner.peekToken()

            if (_isCharToken(pt, ',')) {
                ps.scanner.nextToken()

                pt = ps.scanner.peekToken()

                if (_isCharToken(pt, ')')) {
                    _addUnexpectedTokenError(ps, ')', (pt as Token).s.fullLoc)
                }
            }
        }
 
        // Consume ')'
        ps.scanner.nextToken()
    }

    const eq = _matchChToken(ps, '=')

    return {
        kwt      : kwt,
        id      : id,
        tVars   : tVars,
        eq      : eq
    }
}


// -----------------------------------------------------------------------------


type _MatchFunc<T extends AstItem> = (ps : _ParseState) => T
type _MatchFunc2<T extends AstItem, U extends AstItem> = (ps : _ParseState, v : U) => T

function _tryMatch<T extends AstItem>(ps : _ParseState, pf : _MatchFunc<T>) : false | T {
    const sps = _getSavedParseState(ps)
    
    try {
        return pf(ps)
    } catch {
        _setSavedParseState(ps, sps)
        return false
    }
}

function _tryMatch2<T extends AstItem, U extends AstItem>(ps : _ParseState, mf : _MatchFunc2<T, U>, v : U) : false | T {
    const sps = _getSavedParseState(ps)
    
    try {
        return mf(ps, v)
    } catch {
        _setSavedParseState(ps, sps)
        return false
    }
}


// FIXME: Remove use of _tryParse with _tryMatch instead
function _tryParse<T extends AstItem>(ps : _ParseState, pf : _MatchFunc<T>) : false | T {
    return _tryMatch(ps, pf)
}


// FIXME: Remove _pushParseBlock/_popParseBlock dependency
function _parseBlock<T extends AstItem>(ps : _ParseState, refPos : BeginEndPos, mf : _MatchFunc<T>) : T[] {
    //console.log('')
    //console.log(`_parseBlock : 00 : ${ps.blocks.length} : refPos.b=`, refPos.b)
    let ret : T[] = []

    const pbi = _pushParseBlock(ps, refPos)

    let ast = _tryMatch(ps, mf)

    while (ast !== false) {
        //ts-ignore
        //console.log(`_parseBlock : 20 :   ${pbi.astCount} : ${ast.type} ${ast.exprType} :  ${ast.loc.b}`)
        //console.log('_parseBlock : 21 : pos=', ps.scanner.pos())
        //console.log('ast=', ast)

        if (pbi.astCount === 0) {
            pbi.firstChildPos = ast.loc

            /* FIXME: Weird indentation logic removed
            if ((pos) && (posCol(ast.loc.stmt.b) <= posCol(refPos.b)) {
                // We should be indented here
                console.log('///  Error')
                _addParseError(ps, 'Unexpected indentation', ast.loc.stmt)
            }
            */

            pbi.astCount++
        } 

        ret.push(ast)


        const t = ps.scanner.peekToken()
       
        if (
                (t === false) 
                || 
                (posCol(t.s.fullLoc.b) < posCol(ret[0].loc.b))         
        ) {
            break;
        }
    
        ast = _tryMatch(ps, mf)
    }

    _popParseBlock(ps)
    //console.log(`_parseBlock : 80 : ${ps.blocks.length} : ret.length=${ret.length}`)
    //console.log('')

    return ret
}


function _checkSameLine(ps: _ParseState, refPos : Pos, items : Pos[]) {
    for (let item of items) {
        if (posRow(refPos) !== posRow(item)) {
            _addParseError(ps, 'Unexpected indentation', {
                b : item,
                e : item
            })
            break
        }
    }
}

/**
 * 
 * Sep(X, S) is short for [X (S X)*], i.e. a possibly empty sequence of Xs separated by Ss.
 * 
 * @param ps 
 * @param beginCh 
 * @param endCh 
 * @param sepCh 
 * @param matchF 
 * @param trailingSepError 
 */
function _matchSepList<T extends AstItem>(ps: _ParseState, beginCh: string, endCh: string, sepCh: string, matchF : (ps : _ParseState) => T, trailingSepError : string)  
    : {
        beginChT : Token,
        endChT   : Token,
        children : T[]
    }  {

    const children : T[] = []

    const bCh = _matchNextChToken(ps, beginCh)
  
    let eCh  : Token | false = false
    let sep : Token | false = false

    while (ps.scanner.peekCh() !== false) {
        eCh = _tryMatchChToken(ps, endCh)

        if (eCh) {
            break
        }

        const astChild = matchF(ps)
        children.push(astChild)

        sep = _tryMatchChToken(ps, sepCh)
    }

    if (sep) {
        _addParseError(ps, trailingSepError, sep.s.loc)
    }

    return {
        beginChT : bCh,
        endChT  : eCh as Token,
        children : children
    }
}

/**
 * ```
 * Sep1(X, S) is short for X (S X)*, i.e. same as Sep, but must not be empty.
 * ```
 * @param ps 
 * @param sepCh 
 * @param matchF 
 */
function _matchSep1List<T extends AstItem>(ps: _ParseState, sepCh: string, matchF : (ps : _ParseState) => T) : T[] {
    const ret : T[] = [matchF(ps)]

    while (_tryMatchNextToken(ps, [sepCh])) {
        ret.push(matchF(ps))
    }

    return ret
}  



// -----------------------------------------------------------------------------
// AstItem parser functions

function _parseAst(ps: _ParseState, type : AstItemType) : AstItem {

    switch (type) {
        case 'file'              : return _parseFile(ps)
        case 'top-decl'          : return _parseTopDecl(ps)
        case 'top-include-decl'  : return _matchInclude(ps)
        case 'top-contract-decl' : return _matchContract(ps)
        case 'type-decl'         : return _parseTypeDecl(ps)
        case 'record-decl'       : return _matchRecordDecl(ps)
        case 'datatype-decl'     : return _matchDataTypeDecl(ps)
        case 'entrypoint-decl'   : return _parseEntrypointDecl(ps)
        case 'function-decl'     : return _parseFunctionDecl(ps)
        case 'stmt'              : return _parseStmt(ps)
        case 'type'              : return _parseType(ps)
        case 'expr'              : return _parseExpr(ps)
        case 'path'              : return _matchExprPath(ps)

        default : {
            throw new Error(`_parseAst : Unsupported ast type ${type}`)
        }
    }
}

function _checkTrailingContent(ps : _ParseState) {
    ps.scanner.skipWSAndComments()
    if (ps.scanner.peekCh() !== false) {
        // Trailing content

        const rest = ps.scanner.getRestOfLineBE()
        _addParseError(ps, `Trailing content "${rest.text}"`, rest.loc)
    }
}

function _parseFile(ps: _ParseState) : AstItem {
    //console.log('_parseFile : 00 :')
    var children : AstItem[] = []


    while ((ps.scanner.peekCh() !== false)) {
        //console.log('_parseFile : 20 : ps.scanner.pos()=', ps.scanner.pos())
        const ast = _tryParse(ps, _parseTopDecl)
        //console.log('_parseFile : 21 : ast=', ast)
        
        if (ast) {
            children.push(ast)
        } else {
            break
        }
    }

    _checkTrailingContent(ps)
    
    if (children.length > 0) {
        //console.log('_parseFile : 80 :')
        return _buildAst('file', children, _astBEPos(children[0], children[children.length-1]))
    }

    //console.log('_parseFile : 90 :')
 

    throw new NoMatchError()
}

function _parseTopDecl(ps: _ParseState) : AstItem {
    let ret : AstItem | false = false


    const _try = (f : (ps: _ParseState) => AstItem) => {
        if (ret === false) {
            ret = _tryParse(ps, f)
        }
    }

    //const contract = _tryParse(ps, _parseContract)  
  
    
    _try(_matchContract)
    _try(_matchNamespace)
    _try(_matchInclude)

    if (ret) {
        return ret
    }

    throw new NoMatchError()
}



function _matchContract(ps : _ParseState) : grammar.AstItem_TopContractDecl {
    const t = _matchNextToken(ps, 'contract') 
    let con = _matchConCheckValid(ps)
   
    _matchNextChToken(ps, '=')
   
    const children = _parseBlock(ps, t.s.loc, _matchDecl)
 
    return {..._buildAst('top-contract-decl', children, t.s.loc) as grammar.AstItem_TopContractDecl,
        payable : false,
        con     : tokenToStrWithBELoc(con)
    }
}

function _matchNamespace(ps : _ParseState) : grammar.AstItem_TopNamespaceDecl {
    const t = _matchNextToken(ps, 'namespace') 
    let con = _matchConCheckValid(ps)
   
    _matchNextChToken(ps, '=')
   
    const children = _parseBlock(ps, t.s.loc, _matchDecl)

    const ret = _buildAst<grammar.AstItem_TopNamespaceDecl>('top-namespace-decl', children, {
        b : t.s.fullLoc.b,
        e : children[children.length - 1].loc.e
    })

    ret.con = tokenToStrWithBELoc(con)

    return ret
}

function _matchInclude(ps : _ParseState) : grammar.AstItem_TopIncludeDecl {
    const t = _matchNextToken(ps, 'include')
    const s = ps.scanner.nextToken()

    if (s && (s.type === TokenType.String)) {
        _checkValidStringToken(ps, s)
        const ret = _buildAst<grammar.AstItem_TopIncludeDecl>('top-include-decl', [], {
            b : t.s.fullLoc.b,
            e : s.s.fullLoc.e
        })

        ret.include = tokenToStrWithFullBELoc(s)
        ret.validIncludeToken = s.error === undefined
        return ret
    }

    throw new NoMatchError()
}

function _matchDecl(ps: _ParseState) : AstItem {
    const typeDecl = _tryParse(ps, _parseTypeDecl)

    if (typeDecl) {
        return typeDecl
    } 

    const recordDecl = _tryMatch(ps, _matchRecordDecl)
    if (recordDecl) {
        return recordDecl
    }

    const dataTypeDecl = _tryMatch(ps, _matchDataTypeDecl)
    if (dataTypeDecl) {
        return dataTypeDecl
    }

    const entrypointDecl = _tryParse(ps, _parseEntrypointDecl)
    if (entrypointDecl) {
        return entrypointDecl
    }

    const functionDecl = _tryParse(ps, _parseFunctionDecl)
    if (functionDecl) {
        return functionDecl
    }

    throw new NoMatchError()
}

function _parseTypeDecl(ps: _ParseState) : grammar.AstItem_TypeDecl {
    const prefix = _matchKwIdOptTVarEq(ps, 'type')
 
    let typeAlias = _matchTypeAlias(ps)

    // FIXME: Use _parseBlock
    //_checkSameLine(ps, prefix.stmtLoc.b, [prefix.kw.loc, prefix.id.loc.b, prefix.eq, typeAlias.loc.stmt.b])
    _checkSameLine(ps, prefix.kwt.s.loc.b, [prefix.kwt.s.loc.b, prefix.id.s.loc.b, prefix.eq.s.loc.b, typeAlias.loc.b])

    return {..._buildAst('type-decl', [], prefix.kwt.s.loc) as grammar.AstItem_TypeDecl,
        id : tokenToStrWithBELoc(prefix.id),
        tVars : prefix.tVars,
        typeAlias : typeAlias
    }
}

function _matchRecordDecl(ps: _ParseState) : grammar.AstItem_RecordDecl {
    const prefix = _matchKwIdOptTVarEq(ps, 'record')

    let recordType = _matchRecordType(ps)

    // FIXME: Use _parseBlock
    _checkSameLine(ps, prefix.kwt.s.loc.b, [prefix.kwt.s.loc.b, prefix.id.s.loc.b, prefix.eq.s.loc.b, recordType.lCurly.s.loc.b])

    return {..._buildAst('record-decl', [], prefix.kwt.s.loc) as grammar.AstItem_RecordDecl,
        id : tokenToStrWithBELoc(prefix.id),
        tVars : prefix.tVars,
        fieldTypes : recordType.fieldTypes
    }
}

/**
 * 
 * ```
 * 'datatype' Id ['(' TVar* ')'] '=' DataType
 * DataType   ::= Sep1(ConDecl, '|')
 * ConDecl    ::= Con ['(' Sep1(Type, ',') ')']
 * ```
 */
function _matchDataTypeDecl(ps: _ParseState) : grammar.AstItem_DataTypeDecl {
    const prefix = _matchKwIdOptTVarEq(ps, 'datatype')

    const children = _matchSep1List(ps, '|', _matchConDecl)

    const ret = _buildAst<grammar.AstItem_DataTypeDecl>('datatype-decl', children, {
        b : prefix.id.s.fullLoc.b,
        e : children[children.length - 1].loc.e
    })

    ret.id = tokenToStrWithBELoc(prefix.id)
    ret.tVars = prefix.tVars

    return ret
}

function _matchConDecl(ps: _ParseState) : grammar.AstItem_ConDecl {
    const con = _matchConCheckValid(ps)

    let children : grammar.AstItem_Type[] = []

    let rp : Token | false = false
    if (_tryMatchChToken(ps, '(')) {
        children = _matchSep1List(ps, ',', _matchType)
        rp = _matchChToken(ps, ')')
    }

    let endPos = con.s.fullLoc.e

    if (rp) {
        endPos = rp.s.fullLoc.e
    }

    const ret = _buildAst<grammar.AstItem_ConDecl>('con-decl', children, {
        b : con.s.fullLoc.b,
        e : endPos
    })

    ret.con = tokenToStrWithBELoc(con)

    return ret
}



/**
 * EModifier* 'entrypoint' Block(FunDecl)
 * EModifier ::= 'payable' | 'stateful'
 * FunDecl ::= Id ':' Type                             // Type signature
 *           | Id Args [':' Type] '=' Block(Stmt)      // Definition
 * Args ::= '(' Sep(Pattern, ',') ')'
 * Pattern ::= Expr
 * @param ps 
 */
function _parseEntrypointDecl(ps : _ParseState) : grammar.AstItem_EntrypointDecl {
    let eModifier = _tryMatchNextToken(ps, ['payable', 'stateful'])
    const kwt = _matchNextToken(ps, 'entrypoint')

    const children = _parseBlock(ps, kwt.s.loc, _matchFuncDecl)

    // FIXME: Verify same children names
    // FIXME: Add id and extract it from the first child
    // FIXME: Correct location
    const ret =_buildAst<grammar.AstItem_EntrypointDecl>('entrypoint-decl', children, kwt.s.loc) 

    if (eModifier) {
        ret.eModifier = tokenToStrWithBELoc(eModifier)   
    }

    return ret
}

/**
 * FModifier* 'function' Block(FuncDecl)
 * FModifier ::= 'stateful' | 'private'
 * FunDecl ::= Id ':' Type                             // Type signature
 *           | Id Args [':' Type] '=' Block(Stmt)      // Definition
 * Args ::= '(' Sep(Pattern, ',') ')'
 * Pattern ::= Expr
 * @param ps 
 */
function _parseFunctionDecl(ps : _ParseState) : grammar.AstItem_FunctionDecl {
    let fModifier = _tryMatchNextToken(ps, ['stateful', 'private'])
    const kwt = _matchNextToken(ps, 'function')

    let beginPos = kwt.s.fullLoc.b
    if (fModifier) {
        beginPos = fModifier.s.fullLoc.b
    }

    const children = _parseBlock(ps, kwt.s.loc, _matchFuncDecl)
 
    // FIXME: Verify same children names
    // FIXME: Add id and extract it from the first child

    const ret = _buildAst<grammar.AstItem_FunctionDecl>('function-decl', children, {
        b : beginPos,
        e : children[children.length - 1].loc.e
    }) 

    if (fModifier) {
        ret.fModifier = tokenToStrWithBELoc(fModifier)
    }

    return ret
}

/**
 * FunDecl ::= Id ':' Type                             // Type signature
 *           | Id Args [':' Type] '=' Block(Stmt)      // Definition
 *
 */

function _matchFuncDecl(ps : _ParseState) : grammar.AstItem_FuncDecl {
    const idt = _matchIdCheckValid(ps)
    const id = tokenToStrWithBELoc(idt)

    let colon = _tryMatchChToken(ps, ':')
   
    if (colon) {
        // Type signature
        const returnType = _matchType(ps)

        const ret = _buildAst<grammar.AstItem_FuncDecl>('func-decl', [], {
            b : id.loc.b,
            e : returnType.loc.e
        })

        ret.funcDeclType = 'type-signature'
        ret.id = id
        ret.returnType = returnType

        return ret
    }

    // Definition

    let returnType : grammar.AstItem_Type | undefined = undefined
    
    const args = _matchArgs(ps)
    
    colon = _tryMatchChToken(ps, ':')

    if (colon) {
        returnType = _matchType(ps)
    }

    const eq = _matchChToken(ps, '=')

    const missingStmtPos = _scannerPos2BEPos(ps.scanner.pos())
 
    //console.log('###### _matchFuncDecl : id.loc=', id.loc)
    //console.log('###### returnType=', returnType)
    const children = _parseBlock(ps, id.loc, _parseStmt)
    
    let endPos : Pos = eq.s.fullLoc.e

    if (children.length === 0) {
        _addParseError(ps, 'Missing stmt', missingStmtPos)
    } else {
        endPos  = children[children.length - 1].loc.e
    }  
    
    const ret = _buildAst<grammar.AstItem_FuncDecl>('func-decl', children, {
        b : id.loc.b,
        e : endPos
    })

    ret.funcDeclType = 'definition'
    ret.id = id
    ret.args = args
    
    if (returnType) {
        ret.returnType = returnType
    }

    return ret
}


function _parseType(ps : _ParseState) : AstItem {
    return _matchType(ps)
}


function _matchTypeAlias(ps: _ParseState) : AstItem {
    return _matchType(ps)
}


type _MatchRecordTypeResult = {
    lCurly : Token
    rCurly : Token | false
    fieldTypes : grammar.FieldType[]
}

function _matchRecordType(ps: _ParseState) : _MatchRecordTypeResult {
    const ret : AstItem[] = []

    const lCurly = _matchChToken(ps, '{')
    let rCurly : Token | false = false
    let comma : Token | false = false

    const fieldTypes : grammar.FieldType[] = []

    // FIXME: Use _matchSepList instead
    while (ps.scanner.peekCh() !== false) {
        rCurly = _tryMatchChToken(ps, '}')
        if (rCurly) {
            break
        }


        // FieldType ::= Id ':' Type

        const id = _matchIdCheckValid(ps)
        const colon = _matchChToken(ps, ':')
        const type = _matchType(ps)


        fieldTypes.push({
            id : tokenToStrWithBELoc(id),
            colonLoc : colon.s.loc.b,
            type  : type
        })
        comma = _tryMatchChToken(ps, ',')
    }

    if (comma) {
        _addParseError(ps, `Expected a field type`, comma.s.loc)
    }

    return {
        lCurly : lCurly,
        rCurly : rCurly,
        fieldTypes : fieldTypes
    }
}



/**
 * Type ::= Domain '=>' Type             // Function type
 *        | Type '(' Sep(Type, ',') ')'  // Type application
 *        | '(' Type ')'                 // Parens
 *        | 'unit' | Sep(Type, '*')      // Tuples
 *        | Id | QId | TVar
 *
 * Domain ::= Type                       // Single argument
 *      | '(' Sep(Type, ',') ')'     // Multiple arguments
 * @param ps 
 */

// FIXME: Implement correctly
function _matchType(ps: _ParseState) : AstItem_Type {
    const orgPos = ps.scanner.pos()

    let ret : AstItem_Type | false

    const _checkTypeText = (specificType : 'id' | 'qid' | 'tvar' | 'con', tryF : (ps : _ParseState) => Token | false) => {
        if (!ret) {
            const text = tryF(ps)
            if (text) {
                ret = _buildAst('type', [], text.s.loc) as grammar.AstItem_Type_Text
                ret.specificType = specificType
                ret.text = tokenToStrWithBELoc(text)
            }
        }
    }

    ret = _tryMatch(ps, _matchTypeLiteral) as AstItem_Type

    const _tryTokenF = (tt : TokenType) => {
        return (ps : _ParseState) => {
            return _tryMatchValidToken(ps, tt)
        }
    }

    
    // Try Id
    _checkTypeText('id', _tryTokenF(TokenType.Id))

    if (ret && (ret.specificType === 'id') && (ret.text!.text === 'unit')) {
        // 'unit' tuple
        const tuple = _buildAst<grammar.AstItem_Type_Tuple>('type', [], ret.loc)
        tuple.specificType = 'tuple'

        ret = tuple
    }


    // Try Qid
    _checkTypeText('qid', _tryTokenF(TokenType.QId))

    
    // Try TVar
    _checkTypeText('tvar', _tryTokenF(TokenType.TVar))

    // Try Con
    // NOTE: This isn't valid according to sophia grammer, but found in example contracts, e.g in factorial.aes
    _checkTypeText('con', _tryTokenF(TokenType.Con))



    if (!ret) {
        ps.scanner.setPos(orgPos)

        const pt = ps.scanner.peekToken()

        if (_isCharToken(pt, '(')) {
            const typeFunction = _tryMatch(ps, _matchTypeFunctionType) as AstItem_Type
            if (typeFunction) {
                ret = typeFunction
            }
        }
    }

    if (!ret) {
        const pt = ps.scanner.peekToken()
        if (_isCharToken(pt, '(')) {
            const result = _matchSepList(ps, '(', ')', ',', _matchType, 'Expecting type')
            ret = _buildAst<AstItem_Type>('type', result.children, _tokenBEPos(result.beginChT, result.endChT))
            if (result.children.length === 1) {
                ret.specificType = 'parens'
            } else {
                // Not in grammar
                ret.specificType = 'pair'
            }
        }
        /*
        const lp = _tryMatchChToken(ps, '(')
        if (lp) {
            const t = _matchType(ps)
            const rp = _matchChToken(ps, ')')

            ret = _buildAst('type', [t], _tokenBEPos(lp, rp)) as AstItem_Type
            ret.specificType = 'parens'
        }
        */
    }

    if (ret) {      
        const typeFunction = _tryMatch2<grammar.AstItem_Type_FunctionType, AstItem_Type>(ps, _matchTypeFunctionType, ret)

        if (typeFunction) {
            ret = typeFunction
        }  
    } 

    if (ret) {
        const typeApplication = _tryMatch2<grammar.AstItem_Type_TypeApplication, AstItem_Type>(ps, _matchTypeTypeApplication, ret)

        if (typeApplication) {
            ret = typeApplication
        }
    }

    if (ret) {
        const tuple = _tryMatch2<grammar.AstItem_Type_Tuple, grammar.AstItem_Type>(ps, _matchTypeTuple, ret)

        if (tuple) {
            ret = tuple
        }
    }


    if (ret) {
        return ret
    }

    throw new NoMatchError()
}

function _matchTypeLiteral(ps: _ParseState) : AstItem_Type {
    const t = ps.scanner.nextToken()

    if (t !== false) {
        const ret = _buildAst('type', [], t.s.loc) as AstItem_Type
        ret.specificType = 'literal'

        switch (t.s.text) {
            case 'int'    : ret.literalType = t.s.text; break
            case 'string' : ret.literalType = t.s.text; break
            case 'bool'   : ret.literalType = t.s.text; break

            case 'list' : {
                const l : grammar.AstItem_Type_Literal_List = ret as grammar.AstItem_Type_Literal_List
                ret.literalType = t.s.text
                l.listArgs = _matchTypeListArgs(ps)
            }
            break

            case 'map' : {
                const m : grammar.AstItem_Type_Literal_Map = ret as grammar.AstItem_Type_Literal_Map
                ret.literalType = t.s.text

                const {key, value} = _matchTypeMapArgs(ps)

                m.key = key
                m.value = value
            }
            break
            
            default:
                throw new Error(`_matchType Unsupported type <<${t.s.text}>>`)
                break
        }

        return ret
    }

    throw new NoMatchError()
}

/**
 * Domain '=>' Type             // Function type
 * Domain ::= Type                       // Single argument
 *          | '(' Sep(Type, ',') ')'     // Multiple arguments
 * @param ps 
 */
function _matchTypeFunctionType(ps : _ParseState, singleDomainType? : AstItem_Type) : grammar.AstItem_Type_FunctionType {
    const domain = _matchDomain(ps, singleDomainType)

    _matchNextToken(ps, "=>")

    const type = _matchType(ps)

    const ret = _buildAst<grammar.AstItem_Type_FunctionType>('type', [], _astBEPos(domain, type)) 

    ret.specificType = 'function-type'
    ret.domain = domain
    ret.functionType = type

    return ret
}

/**
 * Type '(' Sep(Type, ',') ')'  // Type application
 * @param ps 
 * @param type
 */
function _matchTypeTypeApplication(ps : _ParseState, type : AstItem_Type) : grammar.AstItem_Type_TypeApplication {
    const msl = _matchSepList<grammar.AstItem_Type>(ps, '(', ')', ',', _matchType, 'Missing type')

    const ret = _buildAst<grammar.AstItem_Type_TypeApplication>('type', msl.children, {
        b : type.loc.b,
        e : msl.endChT.s.fullLoc.e
    }) 

    ret.specificType = 'type-application'
    ret.functionType = type

    return ret
}
function _matchTypeTuple(ps : _ParseState, type1 : grammar.AstItem_Type) : grammar.AstItem_Type_Tuple {
    _matchNextToken(ps, "*")

    const type2 = _matchType(ps)

    let children : grammar.AstItem_Type[] = []

    if (type2.specificType === 'tuple') {
        // Hoist tuple children to this tuple to get all tuple children in top tuple ast item
        children = [type1].concat(type2.children as grammar.AstItem_Type[]  )
    } else {
        children = [type1, type2]
    }

    
    const ret = _buildAst<grammar.AstItem_Type_Tuple>('type', children, _astBEPos(type1, type2))
    ret.specificType = 'tuple'

    return ret
}

/**
 * Domain ::= Type                       // Single argument
 *          | '(' Sep(Type, ',') ')'     // Multiple arguments
 * @param ps 
 */
function _matchDomain(ps : _ParseState, singleDomainType? : AstItem_Type) : grammar.AstItem_Domain {
    let children : grammar.AstItem_Type[] = []

    let beginPos : Pos
    let endPos   : Pos

    if (singleDomainType) {
        beginPos = singleDomainType.loc.b
        endPos   = singleDomainType.loc.e
        children.push(singleDomainType)
    } else {
        const sep = _matchSepList<grammar.AstItem_Type>(ps, '(', ')', ',', _matchType, 'Expected type')
        children = sep.children

        beginPos = sep.beginChT.s.loc.b
        endPos = sep.endChT.s.loc.e
    }
 
    return _buildAst<grammar.AstItem_Domain>('domain', children, {
        b : beginPos,
        e : endPos
    })
}

/**
 * Args ::= '(' Sep(Pattern, ',') ')'
 * Pattern ::= Expr
 * 
 * @param ps 
 */
function _matchArgs(ps : _ParseState) : grammar.AstItem_Expr[] {
    return _matchSepList(ps, '(', ')', ',', _matchPattern, 'Expected expression').children as grammar.AstItem_Expr[]
}

function _matchTypeListArgs(ps: _ParseState) : AstItem_Type[] {
    const ret : AstItem_Type[] = []
  
    const lp = _matchChToken(ps, '(')
    let rp : Token | false = false
    let comma : Token | false = false

    // FIXME: Use _matchSepList
    while (ps.scanner.peekCh() !== false) {
   
        rp = _tryMatchChToken(ps, ')')
        if (rp) {
            break
        }
     
        const t = _matchType(ps)
    
        comma = _tryMatchChToken(ps, ',')
        ret.push(t)
    }


    if (comma) {
        _addParseError(ps, `Expected type`, comma.s.loc)
    }

    return ret
}


function _matchTypeMapArgs(ps: _ParseState) : {
    key : AstItem_Type,
    value : AstItem_Type
} {
    const lParen = _matchChToken(ps, '(')

    const key  = _matchType(ps)

    const comma = _matchChToken(ps, ',')

    const value = _matchType(ps)

    const rParen = _matchChToken(ps, ')')

    return {
        key : key,
        value : value
    }
}

// -----------------------------------------------------------------------------
// _parseStmt

function _parseStmt(ps : _ParseState) : grammar.AstItem_Stmt | grammar.AstItem_Expr {
    return _matchStmt(ps)
}

/**
 * Stmt ::= 'switch' '(' Expr ')' Block(Case)
 *        | 'if' '(' Expr ')' Block(Stmt)
 *        | 'elif' '(' Expr ')' Block(Stmt)
 *        | 'else' Block(Stmt)
 *        | 'let' LetDef
 *        | Expr
 * 
 * FIXME: Implement complete _parseStmt
 * @param ps 
 */
function _matchStmt(ps : _ParseState) : grammar.AstItem_Stmt | grammar.AstItem_Expr {
    //console.log('_matchStmt : 00 : ps.scanner.pos()=', ps.scanner.pos())
    let ret : grammar.AstItem_Stmt | false = false

    ret = _tryMatch(ps, _matchStmtSwitch)
    if (ret) {
        return ret
    }

    ret = _tryMatch(ps, _matchStmtIf)
    if (ret) {
        return ret
    }

    ret = _tryMatch(ps, _matchStmtElIf)
    if (ret) {
        return ret
    }

    ret = _tryMatch(ps, _matchStmtElse)
    if (ret) {
        return ret
    }

    ret = _tryMatch(ps, _matchStmtLet)
    //console.log('_matchStmt : 30 : let : ret=', !!ret, ps.scanner.pos())
    if (ret) {
        return ret
    }
    
    ret = _tryMatch(ps, _matchFunctionDef)

    if (ret) {
        return ret
    } else {
        const expr = _matchExpr(ps)
        return expr
    }
}

/**
 * 'switch' '(' Expr ')' Block(Case)
 * 
 * Case    ::= Pattern '=>' Block(Stmt)
 * Pattern ::= Expr
 * 
 * @param ps 
 */
function _matchStmtSwitch(ps : _ParseState) : grammar.AstItem_Stmt_Switch {
    const kw = _matchNextToken(ps, 'switch')

    const lp = _matchNextChToken(ps, '(')
    const cond = _matchExpr(ps)
    const rp = _matchNextChToken(ps, ')')


  
    const children = _parseBlock(ps, kw.s.fullLoc, _matchCase)

    const ret = _buildAst<grammar.AstItem_Stmt_Switch>('stmt', children, {
        b : kw.s.fullLoc.b, 
        e : children[children.length - 1].loc.e
    })

    ret.stmtType = 'switch'
    ret.cond = cond

    return ret
}

/**
 * 'if' '(' Expr ')' Block(Stmt)
 * @param ps 
 */
function _matchStmtIf(ps : _ParseState) : grammar.AstItem_Stmt_If {
    const kw = _matchNextToken(ps, 'if')

    const lp = _matchNextChToken(ps, '(')
    const cond = _matchExpr(ps)
    const rp = _matchNextChToken(ps, ')')

    const children = _parseBlock(ps, kw.s.fullLoc, _matchStmt)

    const ret = _buildAst<grammar.AstItem_Stmt_If>('stmt', children, {
        b : kw.s.fullLoc.b, 
        e : children[children.length - 1].loc.e
    })

    ret.stmtType = 'if'
    ret.cond = cond

    return ret
}

/**
 * 'elif' '(' Expr ')' Block(Stmt)
 * @param ps 
 */
function _matchStmtElIf(ps : _ParseState) : grammar.AstItem_Stmt_ElIf {
    const kw = _matchNextToken(ps, 'elif')

    const lp = _matchNextChToken(ps, '(')
    const cond = _matchExpr(ps)
    const rp = _matchNextChToken(ps, ')')

    const children = _parseBlock(ps, kw.s.fullLoc, _matchStmt)

    const ret = _buildAst<grammar.AstItem_Stmt_ElIf>('stmt', children, {
        b : kw.s.fullLoc.b, 
        e : children[children.length - 1].loc.e
    })

    ret.stmtType = 'elif'
    ret.cond = cond

    return ret
}

/**
 * 'else'  Block(Stmt)
 * @param ps 
 */
function _matchStmtElse(ps : _ParseState) : grammar.AstItem_Stmt_Else {
    const kw = _matchNextToken(ps, 'else')
    const children = _parseBlock(ps, kw.s.fullLoc, _matchStmt)

    const ret = _buildAst<grammar.AstItem_Stmt_Else>('stmt', children, {
        b : kw.s.fullLoc.b, 
        e : children[children.length - 1].loc.e
    })

    ret.stmtType = 'else'

    return ret
}

/**
 * 'let' LetDef
 * 
 * LetDef ::= Id Args [':' Type] '=' Block(Stmt)   // Function definition
 *          | Pattern '=' Block(Stmt)              // Value definition
 *
 * 
 * @param ps 
 */
function _matchStmtLet(ps : _ParseState) : grammar.AstItem_Stmt_Let {
    //console.log('_matchStmtLet : 00 : ')
    let kw = _matchNextToken(ps, 'let')
    //console.log('_matchStmtLet : 10 : ', kw.s.loc.b)

    let endPos = kw.s.fullLoc.e

    const functionDef = _tryMatch(ps, _matchFunctionDef)
    //console.log('_matchStmtLet : 20 : functionDef=', !!functionDef)
    const ret = _buildAst<grammar.AstItem_Stmt_Let>('stmt', [], {
        b : kw.s.fullLoc.b,
        e : endPos
    })

    ret.stmtType = 'let'

    if (functionDef) {
        ret.letStmtType = 'function-definition'
        ret.functionDef = functionDef
    } else {
        //console.log('_matchStmtLet : 50 : ')
        const pattern = _matchPattern(ps)
        
        //console.log('_matchStmtLet : 52 : ')
        const eq = _matchChToken(ps, '=')

        //console.log('_matchStmtLet : 54 : ')
        const children = _parseBlock(ps, kw.s.fullLoc, _matchStmt)
        //console.log('_matchStmtLet : 60 : children=', !!children)
        ret.letStmtType = 'value-definition'
        ret.pattern = pattern
        ret.children = children as grammar.AstItem_Stmt[]
    }

    return ret
}


/**
 * Case    ::= Pattern '=>' Block(Stmt)
 * Pattern ::= Expr
 * 
 * @param ps 
 */
function _matchCase(ps : _ParseState) : grammar.AstItem_Case {
    /**
     * Anonymous function is '(' LamArgs ')' '=>' Block(Stmt)
     * NOTE: Ignoring anonymous function in pattern, ok expr,  fixes
     *       '(x, _) => n' in e.g. Pair.exs.
     * 
     * FIXME : Not a correct solution but it will do for now
     */
    const pattern = _matchPatternNoAnonymousFunction(ps)
    
    _matchNextToken(ps, '=>')
    const children = _parseBlock(ps, pattern.loc, _matchStmt)

    const ret = _buildAst<grammar.AstItem_Case>('case', children, _astBEPos(pattern, children[children.length - 1]))
    ret.pattern = pattern

    return ret
}

/**
 * NOTE: 'function-def' stmt is an artificial construct, I didn't find it in the grammar
 * but I believe it's a variant of the LetDef function definition in Stmt.
 * @param ps 
 */
function _matchFunctionDef(ps : _ParseState) : grammar.AstItem_Stmt_FunctionDef {
    const id = _matchIdCheckValid(ps)
    const args = _matchArgs(ps)
   
    const colon = _tryMatchChToken(ps, ':')
    let type : grammar.AstItem_Type | undefined = undefined

    if (colon) {
        type = _matchType(ps)
    }

    const eq = _matchChToken(ps, '=')

    const children = _parseBlock(ps, id.s.loc, _parseStmt)

    const ret = _buildAst('stmt', children, {
        b : id.s.loc.b,
        e : children[children.length-1].loc.e
    }) as grammar.AstItem_Stmt_FunctionDef

    ret.stmtType = 'function-def'
    ret.args = args

    if (type) {
        ret.functionType = type
    }

    return ret
}

// -----------------------------------------------------------------------------
//

function _matchPattern(ps: _ParseState) : grammar.AstItem_Expr {
    return _matchExpr(ps)
}

function _matchPatternNoAnonymousFunction(ps: _ParseState) : grammar.AstItem_Expr {
    return _matchExprArgs(ps, {
        ignoreAnonymousFunction : true
    })
}

// -----------------------------------------------------------------------------
// _parseExpr

function _parseExpr(ps : _ParseState) : grammar.AstItem_Expr {
    return _matchExpr(ps)
}

function _matchExpr(ps : _ParseState) : grammar.AstItem_Expr {
    return _matchExprArgs(ps, {
    })
}

function _matchExprAllowAssign(ps : _ParseState) : grammar.AstItem_Expr {
    return _matchExprArgs(ps, {
        allowAssign : true
    })
}

type _MatchExprArg = {
    ignoreAnonymousFunction? : true
    allowAssign? : true
}

const _createAstExpr = <T extends grammar.AstItem_Expr>(exprType : grammar.ExprType, children: grammar.AstItem[], loc : BeginEndPos) => {
    const ret = _buildAst('expr', children, loc) as T
    ret.exprType = exprType

    return ret
}

function _matchExprArgs(ps : _ParseState, args : _MatchExprArg) : grammar.AstItem_Expr {


    const _createIdExpr = (id : Token, idType : grammar.ExprIdentifierType) => {
        const ret = _createAstExpr<grammar.AstItem_Expr_Identifier>('identifier', [], id.s.loc)
        ret.idType = idType
        ret.identifier = tokenToStrWithBELoc(id)
        return ret
    }


    let expr1 : false | grammar.AstItem_Expr = false

    // Record or map value
    //

    let pt = ps.scanner.peekToken()


    if (!expr1 && _isCharToken(pt, '{')) {
         expr1 = _matchExprSepList(ps, 'record-or-map-value', '{', '}', _matchExprFieldUpdate, 'Expected record or map value')
    } 

    // List, list comprehension or list range
    if (!expr1 && _isCharToken(pt, '[')) {

        expr1 = _tryMatch(ps, _matchExprListComprehension)

        if (!expr1) {
            expr1 = _tryMatch(ps, _matchExprListRange)
        }

        if (!expr1) {
            expr1 = _matchExprSepList<grammar.AstItem_Expr_List, grammar.AstItem_Expr>(ps, 'list', '[', ']', _matchExpr, 'Expected an expression')
        }
    }

    if (!expr1 && _isCharToken(pt, '(')) {   
        if (args.ignoreAnonymousFunction !== true) {
            const af = _tryMatch(ps, _matchExprAnonymousFunction)
            if (af) {
                expr1 = af
            }
        }

        if (!expr1) {
            expr1 = _matchExprSepList(ps, 'pair', '(', ')', _matchExpr, 'Expected and expression')
            //console.log('####### list=', expr1.children)
        }
    }

    if (!expr1 && _isToken(pt, 'if')) {
        expr1 = _matchExprIf(ps)
    }

    const _checkUnaryOp = (ch : grammar.UnaryOp) => {
        if (!expr1) {
            if (_isOpToken(pt, ch)) {
            
                ps.scanner.nextToken()
                const e = _matchExpr(ps)
        
                const unary = _createAstExpr<grammar.AstItem_Expr_UnaryOp>('unary-op', [e], {
                    b : (pt as Token).s.fullLoc.b,
                    e : e.loc.e
                })
        
                unary.unaryOp = ch
                
                expr1 = unary
            }
        }
    }

    _checkUnaryOp('-')
    _checkUnaryOp('!')
    

    // Identifier
    //

    const _checkIdentifier = (tt : TokenType, idType : grammar.ExprIdentifierType) => {
        if (!expr1) {
            const id = _tryMatchValidToken(ps, tt)

            if (id) {
                const exprId = _createIdExpr(id, idType)
                if (id.error !== undefined) {
                    exprId.invalidToken = id.error

                    _addParseError(ps, 'Invalid identifier', exprId.identifier.loc)
                }

                expr1 = exprId
            }
        }
    }

    _checkIdentifier(TokenType.Id, 'id')
    _checkIdentifier(TokenType.Con, 'con')
    _checkIdentifier(TokenType.QId, 'qid')
    _checkIdentifier(TokenType.QCon, 'qcon')

    
    if (!expr1) {
        const orgPos = ps.scanner.pos()

        const t = ps.scanner.nextToken()

        if (t && (t.type === TokenType.Int)) {
            expr1 = _createAstExpr('literal', [], t.s.loc)
            expr1.literalType = 'int'
            expr1.literal = tokenToStrWithBELoc(t) 
        } else if (t && (t.type === TokenType.String)) {
            _checkValidStringToken(ps, t)
            expr1 = _createAstExpr('literal', [], t.s.loc)
            expr1.literalType = 'string'
            expr1.literal = tokenToStrWithBELoc(t) 
        } else {
            ps.scanner.setPos(orgPos)
        }
    }

    if (expr1) {
        let ret = expr1

        while (true) {
            let orgPos = ps.scanner.pos()
            //ps.scanner.skipWSAndComments()

            const binOp = _tryMatchBinOp(ps) 
            if (binOp) {
                const expr2 = _tryMatch(ps, _matchExpr)

                if (expr2) {
                    // FIXME: Operator precedence
                    const bo = _createAstExpr<grammar.AstItem_Expr_BinaryOp>('binary-op', [ret, expr2], _astBEPos(ret, expr2))
                    bo.binOp = binOp.s.text as grammar.BinaryOp
                    ret = bo
                    continue
                } else {
                    // FIXME: Add real error and return
                    _addParseError(ps, 'Missing expression', binOp.s.loc)
                    break
                }
            }

            let colon = _tryMatchChToken(ps, ':')
            if (colon) {
                // Type annotation
                const type = _tryParse(ps, _parseType)

                if (type) {
                    ret = _createAstExpr('type-annotation', [ret, type], _astBEPos(expr1, type))
                    continue
                } else {
                    // FIXME : Add real error and return 
                    _addParseError(ps, 'Missing type', colon.s.loc)
                    ret = _createAstExpr('type-annotation', [ret], _astBEPos(expr1, expr1))
                    break
                }
            }

            let dot = _tryMatchChToken(ps, '.') 
            if (dot) {
                // Projection

                //const id = _tryMatchValidId(ps)
                const id = _tryMatchValidToken(ps, TokenType.Id)
                if (id) {
                    const ide = _createIdExpr(id, 'id')
                    ret = _createAstExpr<grammar.AstItem_Expr_Projection>('projection', [ret, ide], _astBEPos(expr1, ide))
                    continue

                } else {
                    // FIXME: Correct error
                    _addParseError(ps, `Missing projection id "Expr '.' Id"`, dot.s.loc)

                    // FIXME: Add second dummy expression since projection assumes two children
                    ret = _createAstExpr('projection', [ret], _astBEPos(expr1, expr1))
                    break
                }
            }

            if (args.allowAssign) {
                const eq = _tryMatchChToken(ps, '=')
                if (eq) {
                    // 'assign' is artificial, see grammar.ts for more info

                    const value = _matchExpr(ps)

                    ret = _createAstExpr<grammar.AstItem_Expr>('assign', [ret, value], _astBEPos(ret, value))
                    continue 
                }
            }


            pt = ps.scanner.peekToken()

            if (_isCharToken(pt, '(')) {
                if (posRow((pt as Token).s.fullLoc.b) > posRow(ret.loc.e)) {
                    // Application must start at the same line ast the first expression
                    break
                }

                // Application
                const result = _matchSepList(ps, '(', ')', ',', _matchExprAllowAssign, 'FIXME: Correct expr application error')

                const expr = ret

                ret = _createAstExpr<grammar.AstItem_Expr_Application>('application', result.children, {
                    b : expr1.loc.b,
                    e : result.endChT.s.loc.e
                })

                ret.expr = expr
                continue
            } else if (_isCharToken(pt, '[')) {

                if (posRow((pt as Token).s.fullLoc.b) > posRow(ret.loc.e)) {
                    // Map lookup must start at the same line ast the first expression
                    break
                }

                _matchNextChToken(ps, '[')

                const key = _matchExpr(ps)
                const rb = _matchNextChToken(ps, ']')

                const map = ret

                const ml = _createAstExpr<grammar.AstItem_Expr_MapLookup>('map-lookup', [], {
                    b : map.loc.b,
                    e : rb.s.fullLoc.e
                })

                ml.map = map
                ml.key = key

                ret = ml

                continue
            }


            // FIXME: I belive this should be handled by the _parseBlock function, but I don't know how
            // 
            // Without the posRow check the following will lead to one child instead of two
            //
            //   let t = 1
            //   { label = "answer:", result = t }

            if (_isCharToken(pt, '{') && (posRow(ret.loc.b) === posRow((pt as Token).s.fullLoc.b))) {
                const update = _matchExprSepList(ps, 'record-or-map-update', '{', '}', _matchExprFieldUpdate, 'Expected record or map update')
                update.expr = ret
                ret = update
                continue
            }


            ps.scanner.setPos(orgPos)
            break
        }

        
        return ret  
    }

    throw new NoMatchError()
}

/**
 * '(' LamArgs ')' '=>' Block(Stmt)
 * LamArgs ::= '(' Sep(LamArg, ',') ')'
 * LamArg  ::= Id [':' Type]
 */
function _matchExprAnonymousFunction(ps : _ParseState) : grammar.AstItem_Expr_AnonymousFunction {
    const args = _matchSepList(ps, '(', ')', ',', _matchLamArg, 'Expected LamArg')
    
    _matchNextToken(ps, "=>")

    const children = _parseBlock(ps, args.endChT.s.fullLoc, _matchStmt)

    const ret = _buildAst<grammar.AstItem_Expr_AnonymousFunction>('expr', children, {
        b : args.beginChT.s.fullLoc.b,
        e : children[children.length - 1].loc.e
    })

    ret.exprType = 'anonymous-function'
    ret.args = args.children

    return ret
}

/**
 * if' '(' Expr ')' Expr 'else' Expr // If expression         if(x < y) y else x
 */
function _matchExprIf(ps : _ParseState) : grammar.AstItem_Expr_If {
    const tIf = _matchNextToken(ps, 'if')

    _matchNextChToken(ps, '(')
    const expr1 = _matchExpr(ps)
    _matchNextChToken(ps, ')')

    const expr2 = _matchExpr(ps)

    _matchNextToken(ps, 'else')

    const expr3 = _matchExpr(ps)

    return _createAstExpr<grammar.AstItem_Expr_If>('if', [expr1, expr2, expr3], {
        b : tIf.s.fullLoc.b,
        e : expr3.loc.e
    })
}

/**
 * ```
 * '[' Expr '|' Sep(Generator, ',') ']'  // List comprehension    [k | x <- [1], if (f(x)), let k = x+1]
 * Generator ::= Pattern '<-' Expr   // Generator
 *             | 'if' '(' Expr ')'   // Guard
 *             | LetDef              // Definition
 * ```
 */
function _matchExprListComprehension(ps : _ParseState) : grammar.AstItem_Expr_ListComprehension {
    const lb = _matchChToken(ps, '[')
    const expr = _matchExpr(ps)
    
    _matchNextToken(ps, '|')

    // NOTE: Sep, not Sep1, according to grammar, I'll go with Sep1
    const children = _matchSep1List(ps, ',',  _matchGenerator)
    const rb = _matchChToken(ps, ']')

    const ret = _buildAst<grammar.AstItem_Expr_ListComprehension>('expr', children, {
        b : lb.s.fullLoc.b,
        e : rb.s.fullLoc.e
    })

    ret.exprType = 'list-compr'
    ret.expr = expr

    return ret
}

/** 
* ```
* Generator ::= Pattern '<-' Expr   // Generator
*             | 'if' '(' Expr ')'   // Guard
*             | LetDef              // Definition
* ```
*/
function _matchGenerator(ps : _ParseState) : grammar.AstItem_Generator {
    //console.log('_matchGenerator : 00 : ', ps.scanner.peekToken())
    let ret : grammar.AstItem_Generator | false = false

    const letDef = _tryMatch(ps, _matchStmtLet)
    if (letDef) {
        ret = _buildAst<grammar.AstItem_Generator>('generator', [], letDef.loc)
        
        ret.generatorType = 'definition'
        ret.letDef = letDef
    }

    if (!ret) {
        const pt = _tryMatchNextToken(ps, ['if'])

        if (pt) {
            _matchNextChToken(ps, '(')
            const expr = _matchExpr(ps)
            const rp = _matchNextChToken(ps, ')')

            ret = _buildAst<grammar.AstItem_Generator>('generator', [], {
                b : pt.s.fullLoc.b,
                e : rp.s.fullLoc.e
            })

            ret.generatorType = 'guard'
            ret.expr = expr
        }
    }

    if (!ret) {
        const pattern = _matchPattern(ps)        
        _matchNextToken(ps, '<-')
        const expr = _matchExpr(ps)

        ret = _buildAst<grammar.AstItem_Generator>('generator', [], {
            b : pattern.loc.b,
            e : expr.loc.e
        })
        
        ret.generatorType = 'generator'
        ret.pattern = pattern
        ret.expr = expr
    }

    return ret
}

/**
 * ```
 * '[' Expr '..' Expr ']'             // List range            [1..n]
 * ```
 */
function _matchExprListRange(ps : _ParseState) : grammar.AstItem_Expr_ListRange {
    const lb = _matchChToken(ps, '[')
    const expr1 = _matchExpr(ps)
    const dotdot = _matchNextToken(ps, '..')
    const expr2 = _matchExpr(ps)
    const rb = _matchChToken(ps, ']')

    const ret = _buildAst<grammar.AstItem_Expr_ListRange>('expr', [expr1, expr2], {
        b : lb.s.fullLoc.b,
        e : rb.s.fullLoc.e
    })

    ret.exprType = 'list-range'
    return ret
}

/**
 * LamArg  ::= Id [':' Type]
 */
function _matchLamArg(ps : _ParseState) : grammar.AstItem_LamArg {
    const id = _matchId(ps)

    const ret = _buildAst<grammar.AstItem_LamArg>('lamarg', [], id.s.fullLoc)

    if (_isCharToken(ps.scanner.peekToken(), ':')) {
        const type = _matchType(ps)
        ret.argType = type
        ret.loc.e = type.loc.e
    }

    ret.id = tokenToStrWithBELoc(id)

    return ret
}

function _matchExprSepList<T extends grammar.AstItem_Expr, U extends AstItem>(ps: _ParseState, exprType : grammar.ExprType, beginCh: string, endCh: string, matchF : (ps : _ParseState) => U, trailingCommaError : string) : T {
    const result = _matchSepList(ps, beginCh, endCh, ',', matchF, trailingCommaError)

    return _createAstExpr(exprType, result.children, {
            b : result.beginChT.s.loc.b,
            e : result.endChT.s.loc.e
        })
}

/**
 * Used by expression types 'record-or-map-value' and 'record-or-map-update'
 * FIXME: Investigate if the @ alias update syntax is valid for 'record-or-map-value'
 * @param ps 
 */
function _matchExprFieldUpdate(ps: _ParseState) : grammar.AstItem_FieldUpdate {
    const checkUpdateAlias = true
    let tAlias : Token | false = false

    if (checkUpdateAlias) {
        const orgPos = ps.scanner.pos()

        tAlias = ps.scanner.nextToken()
        const tAt = ps.scanner.nextToken()

        if (tAlias && (tAlias.type === TokenType.Id) && _isCharToken(tAt, '@')) {

        } else {
            ps.scanner.setPos(orgPos)
            tAlias = false
        }

    }
    const path = _matchExprPath(ps)
    const eq = _matchChToken(ps, '=')   
    const expr = _matchExpr(ps)

    const ret = _buildAst<grammar.AstItem_FieldUpdate>('field-update', [path, expr], _astBEPos(path, expr))

    if (tAlias) {
        ret.alias = tokenToStrWithBELoc(tAlias)
    }

    return ret
}


/**
 * FIXME: Implement completely
 * Path ::= Id                // Record field
 *     | '[' Expr ']'       // Map key
 *     | Path '.' Id        // Nested record field
 *     | Path '[' Expr ']'  // Nested map key
 * @param ps 
 */

 // FIXME: location for nested path isn't correct
function _matchExprPath(ps: _ParseState) : grammar.AstItem_Path {
    let ret : grammar.AstItem_Path | false = false

    let pt = ps.scanner.peekToken()

    const _astPath = (pathType : grammar.PathType, loc : BeginEndPos) : grammar.AstItem_Path => {
        const ret = _buildAst<grammar.AstItem_Path>('path', [], loc)

        ret.pathType = pathType
        return ret
    }

    if (_isCharToken(pt, '[')) {
        const lb = _matchNextChToken(ps, '[')
        const key = _matchExpr(ps)
        const rb = _matchNextChToken(ps, ']')

        ret = _astPath('map-key', {
            b : lb.s.fullLoc.b,
            e : rb.s.fullLoc.e
        })

        ret.key = key
    } else { 
        const id = _tryMatchValidToken(ps, TokenType.Id)
        if (id) {
            ret = _astPath('record-field', id.s.fullLoc)
            ret.id  = tokenToStrWithBELoc(id)
        }
    }

    if (ret && _isCharToken(ps.scanner.peekToken(), '.')) {
        // Consume '.'
        ps.scanner.nextToken()

        const child = _matchExprPath(ps)

        ret.children = [child]
    } else if (ret && _isCharToken(ps.scanner.peekToken(), '[')) {
        const child = _matchExprPath(ps)
        ret.children = [child] 
    }

    if (ret) {
        return ret
    }

    throw new NoMatchError()
}