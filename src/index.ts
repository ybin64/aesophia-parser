// ----------------------------------------------------------------------------
// Copyright (c) Nicklas Bystedt. All rights reserved.
// Licensed under the MIT License.
// See the LICENSE file in the project root for license information.
// ----------------------------------------------------------------------------


// -----------------------------------------------------------------------------
// Exports for generated aggregated d.ts file

export {
    FileParseError, FileParseWarning, FileParseErrWarn
} from './parser'

export {
    ParseErrWarn, ParseError, ParseWarning, ErrWarnLocation,
    AddIncludeArgs, AddIncludeFunc,
    AstItemType,

    AstItem, 

    AstItem_TopContractDecl, AstItem_TopNamespaceDecl, AstItem_TopPragmaCompiler, AstItem_TopIncludeDecl,
    AstItem_Version, AstItem_Int,
    AstItem_TypeDecl, AstItem_RecordDecl, AstItem_DataTypeDecl, AstItem_ConDecl,
    AstItem_EntrypointDecl, AstItem_FunctionDecl, AstItem_FuncDecl,

    AstItem_Type, AstItem_Type_FunctionType, AstItem_Type_TypeApplication, AstItem_Type_Tuple,
    AstItem_Type_Text, AstItem_Type_Literal_List, AstItem_Type_Literal_Map,

    AstItem_Domain,

    AstItem_Stmt, AstItem_Stmt_Switch, AstItem_Stmt_If, AstItem_Stmt_ElIf, AstItem_Stmt_Else,
    AstItem_Stmt_Let,
    AstItem_Case, AstItem_Stmt_FunctionDef,

    AstItem_Expr,
    AstItem_Expr_AnonymousFunction, AstItem_LamArg, AstItem_Expr_If, AstItem_Expr_TypeAnnotation, AstItem_Expr_BinaryOp,
    AstItem_Expr_UnaryOp, AstItem_Expr_Application, AstItem_Expr_Projection,
    AstItem_Expr_MapLookup, AstItem_Expr_List, AstItem_Expr_ListComprehension, AstItem_Generator,
    AstItem_Expr_ListRange, AstItem_Expr_Identifier, 

    AstItem_FieldUpdate, AstItem_Path, 
} from './grammar'

export {
    parse
} from './parser-impl'

export {
    FileContentResolver,
    TextParser, TextParserResult,
    ParsedFileCache, createParsedFile
} from './parsed-file'


export {
    Scanner, Token, TokenError, TokenType
} from './scanner'

export {
    isExplicitStdlibUri,
    getExplicitStdlibContent
} from './explicit-stdlib'

export {
    CompletionItemType, CompletionItem, 
    GetCompletionItemsArgs, getCompletionItems
} from './completion'