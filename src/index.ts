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
    ParseError, ParseWarning, ErrWarnLocation
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
    Scanner
} from './scanner'

export {
    isExplicitStdlibUri,
    getExplicitStdlibContent
} from './explicit-stdlib'

export {
    CompletionItemType, CompletionItem, 
    GetCompletionItemsArgs, getCompletionItems
} from './completion'