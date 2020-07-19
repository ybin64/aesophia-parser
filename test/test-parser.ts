import {AstItemType, AstItemNoLoc, AstItem, ParseError} from '../src/grammar'

import * as grammar from '../src/grammar'

import * as parser from '../src/parser'
import * as scanner from '../src/scanner'
import * as mp from '../src/parser-impl'
import { List } from 'immutable'

export type ParseRuleResult = {
    ast? : AstItem
    errors : parser.ParserParseError[]
    warnings : parser.ParserParseWarning[]
    scanner : scanner.Scanner
}
function _manualParserParse(text : string, type : AstItemType) : ParseRuleResult {
    let _scanner = new scanner.Scanner(text)
    let parser = new mp.ParserImpl()

    //rule = rule.replace(/_stmt$/, '')

 

    let args = {
        addModuleImport  : () => {},
        addModuleInclude : () => {}
    }

    const result = parser.parseAstItem(args, type, _scanner)
    

    let ast = result.stmt
    let errors : parser.ParserParseError[] = []
    let warnings : parser.ParserParseWarning[] = []

    for (let e of result.errors) {
        errors.push({
            filename : undefined,
            err : e
        })
    }

    return {
        ast : ast,
        errors : errors,
        warnings : warnings,
        scanner : _scanner
    }
}

// -----------------------------------------------------------------------------

export type SimpleItem = {
    type : AstItemType
    children? : SimpleItem[]
}

/**
 * Convert an AstItem hierarchy to a SimpleItem hierarchy.
 * Simplifies assertions when comparing parsed structure
 * 
 * **Note:** If there are no children, a children key is **NOT** created
 * @param ast 
 */
export function simpleResult(ast: AstItemNoLoc | AstItem) : SimpleItem {
    const ret : SimpleItem = {
        type : ast.type
    }

    if (ast.children && ast.children.length > 0) {
        ret.children = (ast.children as AstItemNoLoc[]).map(child => simpleResult(child))
    }

    return ret
}



/**
 * 
 * @param type 
 * @param text 
 */
export function parseRule(type : AstItemType, text : string) : ParseRuleResult {
    return _manualParserParse(text, type)
}

/**
 * Parse the text and return the ast.
 * If there are parse errors an exception is thrown
 * 
 * @param type Start ast type 
 * @param text 
 */
function parseRuleAstNoErrors(type : AstItemType, text : string) : AstItem | undefined{
   let result = _manualParserParse(text, type)

   if (result.errors.length > 0) {
       //throw new Error(result.errors);
       // NOTE: Throwing the errors array to get a more expicit error message,
       // even though node prefer an Error instance to be thrown.
       throw result.errors;
   }

   if (!!result.ast && (result.scanner.peekToken() !== false)) {
       throw new Error('Not all tokens are consumed')
   }

   return result.ast;
}

function parseRuleAstAllowError(rule : AstItemType, text : string) {
   // var result = parser.yangParse(text, rule);
   let result = _manualParserParse(text, rule);
   return result.ast;
}


function removeFilenameFromErrors(errors : parser.ParserParseError[]) {
    for (var c = 0; c < errors.length; c++) {
       delete errors[c].filename;
    }

    return errors;
}

function removeFilenameAndLocationFromErrors(errors : parser.ParserParseError[]) {
    for (var c = 0; c < errors.length; c++) {
       delete errors[c].filename;
       delete errors[c].err!.location
    }

    return errors;
}

export function removeLocationOffsetFromErrors(errors : parser.ParserParseError[]) {
    return errors.map(e => {
        delete e.err!.location.begin.offset
        delete e.err!.location.end.offset

        return e
    })
}


/**
 * Return a ast where the location information has been striped for
 * the ast and it's children
 * @param ast 
 */
export function removeLocation(ast : AstItem | undefined) : AstItemNoLoc {
    return _deepRemoveLocation(ast)
}


/**
 * Return a ast where the location information and empty children arrays has been striped for
 * the ast and it's children
 * @param ast 
 */
export function removeLocationAndEmptyChildren(ast : AstItem | undefined) : AstItemNoLoc {
    return _deepRemoveEmptyChildren(_deepRemoveLocation(ast), 0)
}

// FIXME: Type definitions, remove removeId parameter
function _deepRemoveLocation(obj : any, removeId? : boolean) : any {
    if (typeof obj !== 'object') {
        return obj;
    }

    if (obj === null) {
        return null
    }

    if (obj instanceof Array) {
        var ret = [];

        for (var c = 0; c < obj.length; c++) {
            ret.push(_deepRemoveLocation(obj[c], removeId));
        }

        return ret;
    } else {

        // @ts-ignore FIXME
        var ret : any = {};

        for (var key in obj) {
        
            if ((key !== 'loc') && (key !== 'fullLoc' && (key !== 'colonLoc'))) {
                if ((removeId === true) && (key === '_id')) {
                    // Ignore
                } else {
                    // @ts-ignore FIXME: 
                    ret[key] = _deepRemoveLocation(obj[key], removeId);
                }
            }
        }
    }

    return ret;
}



function _deepRemoveEmptyChildren(ast : any, level : number) : any {
    if (typeof ast !== 'object') {
        return ast
    }

    if (ast === null) {
        return null
    }

    let ret

    if (Array.isArray(ast)) {
        ret = ast.slice()
    } else {
        ret = {...ast}
    }

    if (ret.children) {
        if (ret.children.length === 0) {
            delete ret.children
        } else {
            ret.children = ret.children.map((child : any) => _deepRemoveEmptyChildren(child, level + 1))
        }
    }

    let ret2 : any

    if (Array.isArray(ret)) {
        ret2 = ret.slice()
    } else {
        ret2 = {...ret}
    }

    for (var key in ret) {
        if (key === 'children') {
            continue
        }

        let v = ret2[key]

        v = _deepRemoveEmptyChildren(v, level + 1)

        ret2[key] = v
    }

  
    return ret2
}


/*

function _deepRemoveExpandedStmtLocation(obj, removeId) {
    if (typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Array) {
        var ret = [];

        for (var c = 0; c < obj.length; c++) {
            ret.push(_deepRemoveExpandedStmtLocation(obj[c], removeId));
        }

        return ret;
    } else {
        obj.srcStmt = _deepRemoveLocation(obj.srcStmt, removeId)

        if (obj.stmts) {
            obj.stmts = _deepRemoveExpandedStmtLocation(obj.stmts, removeId)
        }

        if (obj.leafInfo) {
            if (obj.leafInfo.resolvedTypeStmt) {
                obj.leafInfo.resolvedTypeStmt = _deepRemoveExpandedStmtLocation(obj.leafInfo.resolvedTypeStmt, removeId)
            }
        }

        ret = obj
    }

    return ret;
}
*/

function removeAstLocation(obj : any) {
    return _deepRemoveLocation(obj, false);
}

function removeAstLocationAndStmtId(obj : any) {
    return _deepRemoveLocation(obj, true);
}

/*
function removeExpandedAstLocationAndStmtId(obj) {
    return _deepRemoveExpandedStmtLocation(obj, true);
}
*/

/**
 * Parse the text and return the ast.
 * If there are parse errors an exception is thrown
 * 
 * @param rule 
 * @param text 
 */
export function parseRuleNoLocation(rule : AstItemType, text : string) : AstItemNoLoc | undefined {
    var ret = parseRuleAstNoErrors(rule, text)
    return _deepRemoveLocation(ret, false)
}

export function parseRuleNoLocationNoEmptyChildren(rule : AstItemType, text : string) : AstItemNoLoc | undefined {
    var ret = parseRuleAstNoErrors(rule, text)
    return _deepRemoveEmptyChildren(_deepRemoveLocation(ret, false), 0)
}





export function parseRuleErrorsNoAstLocation(rule : AstItemType, text : string) {
    let result = _manualParserParse(text, rule)
    return {
        ast    : _deepRemoveLocation(result.ast),
        errors : removeFilenameFromErrors(result.errors)
    }
}

export function parseRuleErrorsNoLocation(rule : AstItemType, text : string) {
    let result = _manualParserParse(text, rule)

    return {
        ast    : _deepRemoveLocation(result.ast),
        errors : removeFilenameAndLocationFromErrors(result.errors)
    }
}

function parseRuleErrors(rule : AstItemType, text : string) {
    let result = _manualParserParse(text, rule)
    return {
        ast    : result.ast,
        errors : removeFilenameFromErrors(result.errors)
    }
}



// -----------------------------------------------------------------------------
//


/**
 * Either text or ast must be provided, not both
 *
 * args.modules = [{
 *      module : <module name>,
 *      text   : <module text>
 *      ast    : <module ast>
 *      uri    : <module uri> (optional)
 *  }, {...}]
 *
 *  args.statementCache : StatementCach (optional)
 *  args.noStatementCacheAdd : boolean (optional)
 *  args.resolvedStatementCache : ResolvedStmtCache (optional)
 */
/*
function parseModules(args) {
    let sc = new yang_statements.StatementCache()
    let rsc = new yang_statements.ResolvedStmtCache()
    let parsedModules = jsyang_lib.Test.parsedModules()
    let parsedSubmodules = jsyang_lib.Test.parsedSubmodules()


    if (args.statementCache) {
        sc = args.statementCache
    }

    if (args.resolvedStatementCache) {
        rsc = args.resolvedStatementCache
    }

    // --- Modules
    for (let m of args.modules) {
        let ast;

        if (m.text) {
            ast = parseRuleAstAllowError('start', m.text)
        } else {
            ast = m.ast
        }

        let uri = m.module

        if (m.uri) {
            uri = m.uri
        }

        if (args.noStatementCacheAdd !== true) {
            if (ast === undefined) {
                throw new Error('Parse or semantic step failed')
            }
            sc.addModuleOrSubmodule(uri, ast)
        }

        parsedModules = jsyang_lib.Test.addParsedModule(parsedModules, m.module, ast, uri)
    }

    // --- Submodules

    if (args.submodules) {
        for(let sm of args.submodules) {
            let ast = parseRuleAstAllowError('start', sm.text)
            let uri = sm.submodule
            if (sm.uri) {
                uri = sm.uri
            }

            sc.addModuleOrSubmodule(uri, ast)
            parsedSubmodules = jsyang_lib.Test.addParsedSubmodule(parsedSubmodules, sm.submodule, ast, uri)
        }
    }


    let semanticModuleName = args.semanticModule
    if (semanticModuleName === undefined) {
        semanticModuleName = args.modules[0].module
    }

    let semanticModule = parsedModules.get(semanticModuleName)
    let semanticResult = yang_semantics.checkSemantics(semanticModule.ast, sc, rsc, parsedModules, parsedSubmodules)

    let completionParseResult = {
        prefixNames     : [],
        typeNames       : [],
        definedPrefixes : {},
        semanticResult  : semanticResult
    }

    return {
        semanticModuleName      : semanticModuleName,
        expandedSemanticModule  : completionParseResult.semanticResult.expandedModules[semanticModuleName],

        // FIXME: Rename to statementCache eventually
        docs                    : sc,

        rsc                     : rsc,
        semanticResult          : semanticResult,
        completionParseResult   : completionParseResult,
        parsedModules           : parsedModules
    }
}
*/

// -----------------------------------------------------------------------------

/**
 * pms - Result from parseModules
 * moduleName - Module or submodule name
 * stmtPath   - Path (in the specified module/submodule)
 * arg        - Statment argument
 *
 */
/*
function findStmtInParsedModules(pms, moduleName, stmtPath, arg) {
    let ast = pms.docs.getModuleOrSubmoduleAst(moduleName)
    let stmt = yang_parser_lib.Testing.getStmtFromPathAndArg(ast, stmtPath, arg)

    return stmt
}

function findStmtInParsedModulesNoLoc(pms, moduleName, stmtPath, arg) {
    return removeAstLocationAndStmtId(findStmtInParsedModules(pms, moduleName, stmtPath, arg))
}

function findExpandedStmtInParsedModules(pms, moduleName, stmtPath, arg) {
    let em = pms.semanticResult.expandedModules.get(moduleName)

    assert.notEqual(em, undefined)

    let ast = em.ast
    let stmt = yang_expanded_stmt.Testing.getExpandedStmtFromPathAndArg(ast, stmtPath, arg)

    return stmt
}

function findExpandedStmtInParsedModulesNoLoc(pms, moduleName, stmtPath, arg) {
    return removeExpandedAstLocationAndStmtId(findExpandedStmtInParsedModules(pms, moduleName, stmtPath, arg))
}
*/



