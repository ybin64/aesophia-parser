// ----------------------------------------------------------------------------
// Copyright (c) Nicklas Bystedt. All rights reserved.
// Licensed under the MIT License.
// See the LICENSE file in the project root for license information.
// ----------------------------------------------------------------------------

import { StrWithFullBELoc, StrWithBELoc, TokenError } from "./scanner";

/**
 * Types and functions used in yang-grammar.pegjs
 */

/**
 * Array of 3 numbers.
 * Pos[0] = 0-based offset in file
 * Pos[1] = 1-based row
 * Pos[2] = 1-based column
 */

export type Pos = number[];

/** Get the 1 based row position */
export function posRow(pos : Pos) : number {
    return pos[1]
}

/** Get the 1 based col position */
export function posCol(pos : Pos) : number {
    return pos[2]
}


export function pos2Str(pos : Pos) : string {
    return `[${pos[0]}, ${pos[1]}, ${pos[2]}]`
}


export type BeginEndPos = {
    b : Pos,
    e : Pos
}

export function bePos2Str(be : BeginEndPos) : string {
    return `{b=${pos2Str(be.b)}, e=${pos2Str(be.e)}}`
}



export type AstItemType = 
    'file' | // Syntetic
    'top-decl' | 
    'top-contract-decl' | // Syntetic
    'top-namespace-decl' | 
    'top-include-decl' |

    'top-pragma-compiler' | 'version' | 'int' |
    
    'type-decl' | 'record-decl' | 'datatype-decl' | 'entrypoint-decl' | 'function-decl' | 
    'func-decl' | 
    'type' | // Syntetic
    'domain' | 
    'stmt' | 'expr' |
    'case' | 

    'field-update' | 'lamarg' | 'path' |
    'con-decl' | 
    'generator'




// -----------------------------------------------------------------------------

export interface AstItemNoLoc {
    type  : AstItemType
    children : AstItemNoLoc[],
}

export interface AstItem extends AstItemNoLoc {
    children : AstItem[],
    loc   : BeginEndPos,
}


export interface AstItem_TopContractDecl extends AstItem {
    type    : 'top-contract-decl'
    payable : boolean
    con     : StrWithBELoc
}

export interface AstItem_TopNamespaceDecl extends AstItem {
    type    : 'top-namespace-decl'
    con     : StrWithBELoc
}


export interface AstItem_TopPragmaCompiler extends AstItem {
    type : 'top-pragma-compiler'
    op   : StrWithBELoc
    children : AstItem_Version[]
}

/**
 * Version  ::= Sep1(Int, '.')
 */
export interface AstItem_Version extends AstItem {
    type : 'version'
    children : AstItem_Int[]
}

export interface AstItem_Int extends AstItem {
    type : 'int',
    value : StrWithBELoc
    children : []
}

export interface AstItem_TopIncludeDecl extends AstItem {
    type : 'top-include-decl'
    include : StrWithFullBELoc

    /** It's a complete include string */
    validIncludeToken  : boolean
}

export interface AstItem_TypeDecl extends AstItem {
    type : 'type-decl'
    id : StrWithBELoc
    tVars : StrWithBELoc[] | null
    typeAlias : AstItem
}

// FieldType  ::= Id ':' Type
export type FieldType = {
    id       : StrWithBELoc
    colonLoc : Pos
    type     : AstItem_Type
}

/**
 * ```
 * 'record'   Id ['(' TVar* ')'] '=' RecordType
 * RecordType ::= '{' Sep(FieldType, ',') '}'
 * FieldType  ::= Id ':' Type
 * ```
 */
export interface AstItem_RecordDecl extends AstItem {
    type : 'record-decl'
    id : StrWithBELoc
    tVars : StrWithBELoc[] | null

    fieldTypes : FieldType[]
}

/**
 * 
 * ```
 * 'datatype' Id ['(' TVar* ')'] '=' DataType
 * DataType   ::= Sep1(ConDecl, '|')
 * ConDecl    ::= Con ['(' Sep1(Type, ',') ')']
 * ```
 */
export interface AstItem_DataTypeDecl extends AstItem {
    type : 'datatype-decl'
    id : StrWithBELoc
    tVars : StrWithBELoc[] | null

    children : AstItem_ConDecl[]
}

export interface AstItem_ConDecl extends AstItem {
    type : 'con-decl'
    con  : StrWithBELoc
    children : AstItem_Type[]
}

export type EModifier = 'payable' | 'stateful'

/**
 * ```text
 * (EModifier* 'entrypoint' Block(FunDecl)
 * EModifier ::= 'payable' | 'stateful'
 * FunDecl ::= Id ':' Type                             // Type signature
 *           | Id Args [':' Type] '=' Block(Stmt)      // Definition
 * ```
 */
export interface AstItem_EntrypointDecl extends AstItem {
    type : 'entrypoint-decl'
    eModifier? : StrWithBELoc

    children : AstItem_FuncDecl[]
}

export type FModifier = 'stateful' | 'private'

/**
 * ```text
 * (FModifier* 'function' Block(FunDecl)
 * FModifier ::= 'stateful' | 'private'
 * FunDecl ::= Id ':' Type                             // Type signature
 *           | Id Args [':' Type] '=' Block(Stmt)      // Definition
 * ```
 */
export interface AstItem_FunctionDecl extends AstItem {
    type : 'function-decl'
    fModifier? : StrWithBELoc

    children : AstItem_FuncDecl[]
}

// -----------------------------------------------------------------------------

export type FuncDeclType = 'type-signature' | 'definition'

/**
 * 
 * FunDecl ::= Id ':' Type                             // Type signature
 *           | Id Args [':' Type] '=' Block(Stmt)      // Definition
 * 
 */
export interface AstItem_FuncDecl extends AstItem {
    type : 'func-decl',
    funcDeclType : FuncDeclType
    id : StrWithBELoc
    args? : AstItem_Expr[]
    returnType? : AstItem_Type

    /** Children are empty for funcDeclType === 'type-signature' */
    children : AstItem_Stmt[]
}



export type SpecificType = 'function-type' | 'type-application' | 'parens' | 'tuple' |
  'id' | 'qid' | 'tvar' |

  // NOTE: 'con' isn't allowed according to grammar but found in example contracts, e.g in factorial.aes
  'con' | 
  

  // NOTE: 'pair' not found in the grammer, but found in e.g. complex_types.aes
  //
  //  map((i) => (i, i * i), up_to(n))
  'pair' |

  // 'literal' is syntetic
  'literal'   
  

export type LiteralType = 'int' | 'address' | 'bool' | 'bits' | 'bytes-8' | 'string' |
  'list' | 'tuple' | 'record' | 'map' | 'option-int' | 'state' | 'event' | 'hash' |
  'signature' | 'chain-ttl' | 'oracle' | 'oracle_query' | 'contract'


export interface AstItem_Type extends AstItem {
    type : 'type',
    specificType : SpecificType

    /** Valid for specificType = 'id' | 'qid' | 'tvar' | 'con'*/
    text? : StrWithBELoc


    /** Valid for specificType === 'literal' */
    literalType? : LiteralType

    /** Valid for specificType === 'function-type' */
    domain? : AstItem_Domain

    /** Valid for specificType === 'function-type' | 'type-application' */
    functionType?    : AstItem_Type
}

export interface AstItem_Type_FunctionType extends AstItem_Type {
    type : 'type'
    specificType : 'function-type'
    domain : AstItem_Domain
    functionType : AstItem_Type
}

export interface AstItem_Type_TypeApplication extends AstItem_Type {
    type : 'type'
    specificType : 'type-application'

    /** The Type part */
    functionType : AstItem_Type

    children : AstItem_Type[]
}

export interface AstItem_Type_Tuple extends AstItem_Type {
    type : 'type',
    specificType : 'tuple'

    /** No children means it's the 'unit' tuple */
    children : AstItem_Type[]
}

export interface AstItem_Type_Text extends AstItem_Type {
    type : 'type'
    specificType : 'id' | 'qid' | 'tvar' | 'con'
    text : StrWithBELoc
}

export interface AstItem_Type_Literal_List extends AstItem_Type {
    type : 'type'
    specificType : 'literal'
    literalType : 'list'
    listArgs : AstItem_Type[]
}

export interface AstItem_Type_Literal_Map extends AstItem_Type {
    type : 'type',
    specificType : 'literal'
    literalType : 'map'
    key : AstItem_Type
    value : AstItem_Type
}



/**
 * Domain ::= Type                       // Single argument
 *          | '(' Sep(Type, ',') ')'     // Multiple arguments
 * 
 * Children contains the type(s) 
 */
export interface AstItem_Domain extends AstItem {
    type : 'domain'  
    children : AstItem_Type[]
}

/**
 * 
 *  NOTE: 'expr' not a sub-type of AstItem_Stmt, is hoisted to its AstItem_Expr type
 *  NOTE: 'function-def' not in grammar, but I belive it should be here.
 * 
 */
export type StmtType = 'switch' | 'if' | 'elif' | 'else' | 'let' |
  'function-def'




export interface AstItem_Stmt extends AstItem {
    type : 'stmt'
    stmtType : StmtType
}

export interface AstItem_Stmt_Switch extends AstItem_Stmt {
    type : 'stmt'
    stmtType : 'switch'
    cond : AstItem_Expr
    children : AstItem_Case[]
}

export interface AstItem_Stmt_If extends AstItem_Stmt {
    type : 'stmt'
    stmtType : 'if'
    cond : AstItem_Expr
    children : AstItem_Stmt[]
}

export interface AstItem_Stmt_ElIf extends AstItem_Stmt {
    type : 'stmt'
    stmtType : 'elif'
    cond : AstItem_Expr
    children : AstItem_Stmt[]
}

export interface AstItem_Stmt_Else extends AstItem_Stmt {
    type : 'stmt'
    stmtType : 'else'
    children : AstItem_Stmt[]
}


export type LetStmtType = 'function-definition' | 'value-definition'

export interface AstItem_Stmt_Let extends AstItem_Stmt {
    type : 'stmt'
    stmtType : 'let'
    letStmtType : LetStmtType

    // FIXME: functionDef solution doesn't feel right, using it for now due to existing match function
    /** Valid if letStmtType === 'function-definition' */
    functionDef? : AstItem_Stmt_FunctionDef

    /** Valid if letStmtType === 'value-definition' */
    pattern? : AstItem_Expr

    /** children only set if letStmtType === 'value-definition' */
    children : AstItem_Stmt[]
}

/**
 * Case    ::= Pattern '=>' Block(Stmt)
 * Pattern ::= Expr
 */
export interface AstItem_Case extends AstItem {
    type : 'case'
    pattern : AstItem_Expr
    children : AstItem_Stmt[]
}

export interface AstItem_Stmt_FunctionDef extends AstItem_Stmt {
    type : 'stmt'
    stmtType : 'function-def'
    args : AstItem_Expr[]
    functionType? : AstItem_Type
}

export type BinaryOp = '||' | '&&' | '<' | '>' | '=<' | '>=' | '==' | '!=' | 
                       '::' | '++' | '+' | '-' | '*' | '/' | 'mod' | '^'

export type UnaryOp = '-' | '!'

export type ExprType = 'anonymous-function' | 'if' | 'type-annotation' | 'binary-op' | 'unary-op' |

    'application' | 
    
    'projection' | 'map-lookup' | 'record-or-map-update' | 'list' | 'list-compr' |
    'list-range' | 'record-or-map-value' | 'parens' | 'identifier' | 'literal' | 'chain-id' |

    // NOTE: 'assign' is an artificial expression type
    //
    // I didn't find it in the grammer, but default assignment exists in some 'application'
    // E.g. `let xs = worker.up_to(gas = 100000, n)` in complex_types.aes
    //
    // Putting it here for now
    'assign' |

    // NOTE: 'pair' is an artificial expression type not found in the grammar
    // Found out in the "wild", e.g. in complex_types..aes
    //
    //    entrypoint pair(x : int, y : string) = (x, y) 
    //
    // It's probably wrong but I keep it here for now
    'pair'

export type ExprLiteralType = 'int' | 'bytes' | 'string' | 'char'

export interface AstItem_Expr extends AstItem {
    type      : 'expr'
    exprType  : ExprType

    // Valid for exprType === 'identifier'
    identifier? : StrWithBELoc

    /** Valid for exprType === 'binary-op */
    binOp? : BinaryOp

    /**
     * FIXME: Not all valid types are enumerated in the comment
     * 
     * Valid for exprType === 'application' | 'record-or-map-update'
     * 
     */
    expr? : AstItem_Expr


    /** Valid for exprType === 'literal' */
    literalType? : ExprLiteralType

    /** Valid for exprType === 'literal' */
    literal?     : StrWithBELoc
}


/**
 * '(' LamArgs ')' '=>' Block(Stmt)
 * LamArgs ::= '(' Sep(LamArg, ',') ')'
 * LamArg  ::= Id [':' Type]
 */
export interface AstItem_Expr_AnonymousFunction extends AstItem_Expr {
    type : 'expr',
    exprType : 'anonymous-function'

    args : AstItem_LamArg[]
    children : AstItem_Stmt[]
}

/**
 * LamArg  ::= Id [':' Type]
 */
export interface AstItem_LamArg extends AstItem {
    type : 'lamarg'
    id : StrWithBELoc
    argType? : AstItem_Type
}

/**
 * ```text
 * if' '(' Expr ')' Expr 'else' Expr // If expression         if(x < y) y else x
 * ```
 */
export interface AstItem_Expr_If extends AstItem_Expr {
    type : 'expr'
    exprType : 'if'

    /** Contains 3 expressions */
    children : AstItem_Expr[]
}

/**
 * **Note**: children may have only one item if it's an invalid type annotation.
 * 
 * ```text
 * Expr ':' Type   // Type annotation   5 : int
 * ```
 */
export interface AstItem_Expr_TypeAnnotation extends AstItem_Expr {
    type : 'expr'
    exprType : 'type-annotation'

    /**
     * Valid type annotation
     * ```
     * children[0] = expr
     * children[1] = type
     * ```
     * 
     * An invalid type-annotation have only one child.
     * ```
     * children[0] = expr
     * ```
     */
    children : AstItem[]
}
export interface AstItem_Expr_BinaryOp extends AstItem_Expr {
    type : 'expr',
    exprType : 'binary-op',
    binOp : BinaryOp

    /** Contains two expressions */
    children : AstItem_Expr[]
}

export interface AstItem_Expr_UnaryOp extends AstItem_Expr {
    type : 'expr',
    exprType : 'unary-op',
    unaryOp : UnaryOp

    /** Contains one expressions */
    children : AstItem_Expr[]
}

/**
 * Expr '(' Sep(Expr, ',') ')'        // Application           f(x, y)
 * 
 *   children[] = arguments
 */
export interface AstItem_Expr_Application extends AstItem_Expr {
    type : 'expr',
    exprType : 'application'
    expr : AstItem_Expr
    children : AstItem_Expr[]
}

/**
 * Expr '.' Id  // Projection            state.x
 * 
 *   children[0] Expr
 *   children[1] Id
 */
export interface AstItem_Expr_Projection extends AstItem_Expr {
    type : 'expr',
    exprType : 'projection'
}

/**
 * ```
 * Expr '[' Expr ']'                  // Map lookup            map[key]
 * ```
 */
export interface AstItem_Expr_MapLookup extends AstItem_Expr {
    type : 'expr',
    exprType : 'map-lookup'
    map : AstItem_Expr
    key : AstItem_Expr
}

/**
 * ```
 * '[' Sep(Expr, ',') ']'             // List                  [1, 2, 3]
 * ```
 */
export interface AstItem_Expr_List extends AstItem_Expr {
    type : 'expr'
    exprType : 'list'

    children : AstItem_Expr[]
}

/**
 * ```
 * '[' Expr '|' Sep(Generator, ',') ']'  // List comprehension    [k | x <- [1], if (f(x)), let k = x+1]
 * Generator ::= Pattern '<-' Expr   // Generator
 *             | 'if' '(' Expr ')'   // Guard
 *             | LetDef              // Definition
 * ```
 */
export interface AstItem_Expr_ListComprehension extends AstItem_Expr {
    type : 'expr',
    exprType : 'list-compr'
    expr : AstItem_Expr
    children : AstItem_Generator[]
}

/**
 * NOTE: Error in grammar, "LetDef" should be "'let' LetDef"
 * 
 * ```
 * Generator ::= Pattern '<-' Expr   // Generator
 *             | 'if' '(' Expr ')'   // Guard
 *             | LetDef              // Definition
 * Pattern ::= Expr
 * ```
 */
export type GeneratorType = 'generator' | 'guard' | 'definition'
export interface AstItem_Generator extends AstItem {
    type : 'generator',
    generatorType : GeneratorType

    /**
     * Valid for generatorType === 'generator'
     */
    pattern? : AstItem_Expr

    /**
     * Valid for generatorType === 'generator' | 'guard'
     */
    expr? : AstItem_Expr

    /**
     * Valid for generatorType === 'definition'
     */
    letDef? : AstItem_Stmt_Let
}

/**
 * ```
 * '[' Expr '..' Expr ']'             // List range            [1..n]
 * ```
 */
export interface AstItem_Expr_ListRange extends AstItem_Expr {
    type : 'expr'
    exprType : 'list-range'

    /**
     * Two expression children
     */
    children : AstItem_Expr[]
}

export type ExprIdentifierType = 'id' | 'con' | 'qid' | 'qcon'
export interface AstItem_Expr_Identifier extends AstItem_Expr {
    type : 'expr'
    exprType : 'identifier'
    idType : ExprIdentifierType
    identifier : StrWithBELoc

    invalidToken? : TokenError
    
    children : []
}


/**
 * 
 */
export interface AstItem_FieldUpdate extends AstItem {
    type : 'field-update'

    /**
     * Contains the original alias id
     * 
     * E.g. 'value @ v = v + 1' would be the 'value' part
     */
    alias? : StrWithBELoc
}

/**
 * 
 * Path ::= Id                // Record field
 *     | '[' Expr ']'       // Map key
 *     | Path '.' Id        // Nested record field
 *     | Path '[' Expr ']'  // Nested map key
 */


// FIXME: 'nested-record-field' and 'nested-map-key' are never used, look in 'children[]' instead
export type PathType = 'record-field' | 'map-key' | 'nested-record-field' | 'nested-map-key'

export interface AstItem_Path extends AstItem {
    type : 'path'
    pathType : PathType

    /** Valid for pathType === 'record-field' | 'nested-record-field' */
    id? : StrWithBELoc

    /** Valid for pathType === 'map-key' | 'nested-map-key' */
    key? : AstItem_Expr

    /** Contains child for if it's an 'nested-record-field' | 'nested-map-key' 
     *  NOTE: The 'nested-record-field' and 'nested-map-key' values are never set in pathType
    */
    children : AstItem_Path[]
}



export type StmtErrLoc = {
    /** 0-based offset in file */
    offset : number,

    /** 1-based row position in file */
    line   : number,

    /** 1-based column position in file */
    column : number
}

export type ErrWarnLocation = {
    begin : StmtErrLoc,
    end   : StmtErrLoc
}



export type ParseErrWarn = {
    message  : string,
    location : ErrWarnLocation
}

export type ParseError = ParseErrWarn
export type ParseWarning = ParseErrWarn


export type AddIncludeArgs = {
    module?     : string,
    submodule?  : string,

    // FIXME: Change name to includeAstItem
    includeStmt : AstItem,

    loc : BeginEndPos
}

export type AddIncludeFunc = (args : AddIncludeArgs) => void;

export type ParseArgs = {
    startRule      : string

    // '-' if not from file
    filename       : string

    errors         : ParseError[]
    warnings       : ParseWarning[]
    errorCount     : number
    warningCount   : number

    addModuleInclude  : AddIncludeFunc
}