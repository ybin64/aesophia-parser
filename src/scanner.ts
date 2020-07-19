// ----------------------------------------------------------------------------
// Copyright (c) Nicklas Bystedt. All rights reserved.
// Licensed under the MIT License.
// See the LICENSE file in the project root for license information.
// ----------------------------------------------------------------------------

import {
    Pos, BeginEndPos
} from './grammar'

export type ScannerPos = {
    /**
     * Zero-based character position in text
     */
    pos  : number

    /**
     * One-based line number in text
     */
    line : number

    /**
     * One-base column number in the current line
     */
    col  : number
}



export type StrWithFullBELoc = {
    text : string

    /**
     * String content location range, excluding quoutes if it's a qouted string
     */
    loc  : BeginEndPos

    /**
     * Full location range, including single-/double-qoutes if it's a qouted string
     */
    fullLoc : BeginEndPos
}

export type StrWithBELoc = {
    text : string
    loc  : BeginEndPos
}


export const enum TokenType {
    Id = 1,
    Con = 2,
    QId = 3,
    QCon = 4, 
    TVar = 5,
    Int = 6,
    Bytes = 7, // FIXME: Implement
    String = 8, // FIXME: Implement
    Char   = 9, // FIXME: Implement

    AccountAddress = 20, // FIXME: Implement
    ContractAddress = 21, // FIXME: Implement
    OracleAddress = 22, // FIXME: Implement
    OracleQueryId = 23, // FIXME: Implement

    char = 100,
    op   = 101,
    misc = 199
}

export type Token = {
    type : TokenType
    s    : StrWithFullBELoc
}

export function tokenToStrWithBELoc(t : Token) : StrWithBELoc {
    return {
        text : t.s.text,
        loc  : t.s.loc
    }
}

export function tokenToStrWithFullBELoc(t : Token) : StrWithFullBELoc {
    return {
        text : t.s.text,
        loc  : t.s.loc,
        fullLoc : t.s.fullLoc
    }
}


// -----------------------------------------------------------------------------

function _isDigitCh(ch : string) : boolean {
    let c = ch.charCodeAt(0)
    return (48 <= c) && (c <= 57)
}


function _isWS(ch : string) : boolean {
    let c = ch.charCodeAt(0)
    return (c === 32) || (c == 9) || (c == 10) || (c == 13)
}

/**
 * Check if it's a valid Sophia identifier
 * 
 * Id = [a-z_][A-Za-z0-9_']*
 * 
 * @param s 
 */
export function isValidId(s : string) : boolean {
    if (s === '') {
        return false
    }

    let ix = 0
    if (!(_isLowerCaseAlphaCh(s[ix]) || (s[ix] === '_'))) {
        return false
    }

    ix++
    
    while (ix < s.length) {
        const ch = s[ix++]

        if (!(_isAlphaCh(ch) || _isDigitCh(ch) || (ch === '_') || (ch === "'"))) {
            return false
        }
    }

    return true
}

/**
 * Check if it's a valid qualified identifier 
 * 
 * ```
 * QId = (Con\.)+Id qualified identifiers (e.g. Map.member)
 * ```
 * 
 * @param s 
 */
export function isValidQId(s: string) : boolean {
    const items = s.split('.')
    return (items.length === 2) && isValidCon(items[0]) && isValidId(items[1])
}

/**
 * Check if it's a valid Sophia constructor
 * 
 * Con = [A-Z][A-Za-z0-9_']*
 * 
 * @param s 
 */
export function isValidCon(s : string) : boolean {
    if (s === '') {
        return false
    }

    let ix = 0
    if (!_isUpperCaseAlphaCh(s[ix++])) {
        return false
    }

    while (ix < s.length) {
        const ch = s[ix++]

        if (!(_isAlphaCh(ch) || _isDigitCh(ch) || (ch === '_') || (ch === "'"))) {
            return false
        }
    }

    return true
}

/**
 * Check if it's a valid qualified constructor
 * 
 * ```
 * QCon = (Con\.)+Con qualified constructor
 * ```
 * 
 * @param s 
 */
export function isValidQCon(s: string) : boolean {
    const items = s.split('.')
    return (items.length === 2) && isValidCon(items[0]) && isValidCon(items[1])
}

/**
 * Check if it a valid Sophia type variable
 * 
 * TVar = 'Id type variable (e.g 'a, 'b)
 * 
 * @param s 
 */
export function isValidTVar(s : string) : boolean {
    if (s.length < 2) {
        return false
    }

    if (s[0] !== "'") {
        return false
    }

    return isValidId(s.slice(1))
}

/**
 * [A-Z]
 * @param s 
 */
function _isUpperCaseAlphaCh(s : string) : boolean {
    let ch = s.charCodeAt(0)
    return ((0x41 <= ch) && (ch <= 0x5A)) 
}

/**
 * [a-z]
 * @param s 
 */
function _isLowerCaseAlphaCh(s : string) {
    let ch = s.charCodeAt(0)
   return  ((0x61 <= ch) && (ch <= 0x7A))
}

function _isAlphaCh(s : string) : boolean {
    let ch = s.charCodeAt(0)
    return ((0x41 <= ch) && (ch <= 0x5A)) || ((0x61 <= ch) && (ch <= 0x7A))
}

function _isDecimalCh(s : string) : boolean {
    let ch = s.charCodeAt(0)
    return (0x30 <= ch) && (ch <= 0x39)
}


export function isIntegerValue(s : string) : boolean {
    if (s.length > 0) {
        let v = parseInt(s, 10)
        return (v !== NaN) && (v === Math.floor(v))
    }

    return false
}


export function isNonNegativeIntegerValue(s : string) : boolean {
    if (s.length > 0) {
        let v = parseInt(s, 10)
        return (v !== NaN) && (v >= 0) && (v === Math.floor(v))
    }

    return false
}


function _isNumber(s : string) : boolean {
   if (s.length > 0) {
        let v = parseFloat(s)
        return (v !== NaN)
    }

    return false
}

function _scannerPos2Pos(sp : ScannerPos) : Pos {
    return [sp.pos, sp.line, sp.col]
}

// -----------------------------------------------------------------------------

export class Scanner {

    private _text : string
    private _pos = 0

    private _line = 1

    private _col = 1

    public constructor(text : string) {
        this._text = text
    }

    /**
     * Return current scanner position
     */
    public pos() : ScannerPos {
        return {
            pos : this._pos,
            line : this._line,
            col  : this._col
        }
    }

    /**
     * Set current scanner position
     * @param pos 
     */
    public setPos(pos : ScannerPos) : void {
        this._pos = pos.pos
        this._line = pos.line
        this._col  = pos.col
    }

    public location() : Pos {
        return [this._pos, this._line, this._col]
    }

    public prevLocation() : Pos {
        // FIXME: Should actually save these positions in nextCh() but this will do for now
        return [this._pos - 1, this._line, this._col - 1]
    }

    /**
     * @return false End of file
     * @return string Next character
     */
    public nextCh() : string | false {
        if (this._pos <= this._text.length - 1) {
            this._col++
            return this._text[this._pos++]
        } else {
            //this._pos = this._text.length
            return false
        }
    }

    /**
     * @return false End of file
     * @return string Next character
     */
    public peekCh(ix? : number) : string | false {
        if (ix === undefined) {
            ix = 1
        }

        if ((this._pos + ix) <= this._text.length) {
            return this._text[this._pos + ix - 1]
        } else {
            return false
        }
    }


    public nextToken() : Token | false {
        this.skipWSAndComments()

        let pch = this.peekCh()
        if (pch === false) {
            return false
        }
      
        const beginPos = this.pos()
        let endPos = beginPos
        let text = pch
        this.nextCh()

        const _token = (type : TokenType, text : string, beginPos : ScannerPos, endPos: ScannerPos) : Token => {
            const loc : BeginEndPos = {
                b : _scannerPos2Pos(beginPos),
                e : _scannerPos2Pos(endPos)
            }

            return {
                type : type,
                s : {
                    text : text,
                    loc : loc,
                    fullLoc : loc
                }
            }
        }

        const _token2 = (type : TokenType, text : string, beginPos : ScannerPos, endPos: Pos) : Token => {
            const loc : BeginEndPos = {
                b : _scannerPos2Pos(beginPos),
                e : endPos
            }

            return {
                type : type,
                s : {
                    text : text,
                    loc : loc,
                    fullLoc : loc
                }
            }
        }

        if (_isLowerCaseAlphaCh(pch) || (pch === '_')) {
            // TokenType.Id
            
            pch = this.peekCh()
            while (pch && (_isLowerCaseAlphaCh(pch) || _isUpperCaseAlphaCh(pch) || _isDecimalCh(pch) || (pch === '_') || (pch === "'"))) {
                endPos = this.pos()
                text += pch
                this.nextCh()

                pch = this.peekCh()  
            }

            if (text === 'mod') {
                return _token(TokenType.op, text, beginPos, endPos)
            }

            return _token(TokenType.Id, text, beginPos, endPos)
        } else if (_isUpperCaseAlphaCh(pch)) {
            // TokenType.Con

            pch = this.peekCh()
            while (pch && (_isLowerCaseAlphaCh(pch) || _isUpperCaseAlphaCh(pch) || _isDecimalCh(pch) || (pch === '_') || (pch === "'"))) {
                endPos = this.pos()
                text += pch
                this.nextCh()

                pch = this.peekCh()  
            }

            if (this.peekCh() === '.') {
                const orgPos = this.pos()
                this.nextCh()

                const idt = this.nextToken()
                if (idt && (idt.type === TokenType.Id)) {
                    // QId
                    return _token2(TokenType.QId, text + "." + idt.s.text, beginPos, idt.s.loc.e)
                } else if (idt && (idt.type === TokenType.Con)) {
                    // QCon
                    return _token2(TokenType.QCon, text + "." + idt.s.text, beginPos, idt.s.loc.e)                   
                } else {
                    // Con
                    this.setPos(orgPos)
                    return _token(TokenType.Con, text, beginPos, endPos)
                }
            }

            return _token(TokenType.Con, text, beginPos, endPos)  
        } else if (_isDigitCh(pch)) {
            // FIXME: Implement Int correctly

            // TokenType.Int

            pch = this.peekCh()
            while (pch && (_isDigitCh(pch) ||  (pch === '_'))) {
                endPos = this.pos()
                text += pch
                this.nextCh()
   
                pch = this.peekCh()  
            }
            return _token(TokenType.Int, text, beginPos, endPos)  
        } else if (pch === '"') {
            const str = this._tryMatchString()
          
            if (str) {
                // FIXME: fullLoc and loc should be different here
                return _token(TokenType.String, str.text, str.lQ, str.rQ)
            }

        } 
        
        {
         
            const _twoChOpToken = () => {
                endPos = this.pos()
                text += this.nextCh()
                return _token(TokenType.op, text, beginPos, endPos)
            }

            if ((text === '+') && (this.peekCh() === '+')) {
                return _twoChOpToken()  
            }

            if ((text === ':') && (this.peekCh() === ':')) {
                return _twoChOpToken()  
            } 

            if ((text === '|') && (this.peekCh() === '|')) {
                return _twoChOpToken()
            }
            if ((text === '&') && (this.peekCh() === '&')) {
                return _twoChOpToken()
            }

            if ((text === '=') && (this.peekCh() === '=')) {
                return _twoChOpToken()
            }

            if ((text === '=') && (this.peekCh() === '<')) {
                return _twoChOpToken()
            }

            // Domain '=>' Type
            if ((text === '=') && (this.peekCh() === '>')) {
                const t = _twoChOpToken()
                t.type = TokenType.misc
                return t
            }

            if ((text === '>') && (this.peekCh() === '=')) {
                return _twoChOpToken()
            }

            if ((text === '!') && (this.peekCh() === '=')) {
                return _twoChOpToken()
            }

            if (text === '.' && (this.peekCh()) === '.') {
                const t = _twoChOpToken()
                t.type = TokenType.misc
                return t
            }
            
            if ((text === '<') && (this.peekCh()) === '-') {
                const t = _twoChOpToken()
                t.type = TokenType.misc
                return t
            }
            if ('+-*/^><!'.indexOf(text) >= 0) {
                return _token(TokenType.op, text, beginPos, endPos)
            }
            

            const pch = this.peekCh()
          
            if ((text === "'") && pch && (_isLowerCaseAlphaCh(pch) || (pch === '_'))) {
                // Check if it's a TVar
                const orgPos = this.pos()
                const idt = this.nextToken()

                if (idt && (idt.type === TokenType.Id)) {
                    return _token2(TokenType.TVar, "'" + idt.s.text, beginPos, idt.s.loc.e)
                }

                this.setPos(orgPos)
            }

            return _token(TokenType.char, text, beginPos, endPos)
        }
    }

    public peekToken() : Token | false {
        const orgPos = this.pos()

        const ret = this.nextToken()

        this.setPos(orgPos)

        return ret
    }

    private _tryLocB : Pos
    private _tryLocE : Pos
    private _tryText : string

    public tryMatch(text : string) : boolean {
        let ix = 0

        this._tryLocB = this.location()

        while (ix < text.length) {
            if (this.peekCh(ix + 1) !== text[ix]) {
                break
            }
            ix += 1
        }

        if ((text.length > 0) && (ix === text.length)) {
            this._pos += ix
            this._col += ix

            this._tryText = text
            this._tryLocE = this.location()
            this._tryLocE[0] -= 1
            this._tryLocE[2] -= 1

            return true
        }

        return false
    }

    public tryMatchBE(text : string) : StrWithBELoc | false {
        if (this.tryMatch(text)) {
            return this.getLastTryMatchBE()
        }
        
        return false
    }

    /**
     * Get the last valid tryMatch() as a StrWithBELoc
     *
     * NOTE: The result is only valid when called after a "tryMatch(...) === true" result
     */
    public getLastTryMatchBE() : StrWithBELoc {
        return {
            text : this._tryText,
            loc : {
                b : this._tryLocB,
                e : this._tryLocE
            }
        }
    }

    public getRestOfLineBE() : StrWithBELoc {
        const locB = this.location()
        let   locE = locB
        let   text = ''

        while ((this.peekCh() !== false) && !this.tryMatchLineBreak()) {
            text += this.nextCh()
            locE = this.location()
        }

        return {
            text : text,
            loc : {
                b : locB,
                e : locE
            }
        }
    }
    

    
    public tryMatchLineBreak() : boolean {
        if (this.tryMatch('\x0D\x0A') || this.tryMatch('\x0A')) {
            this._line += 1
            this._col  = 1

            return true
        }

        return false
    }

    
    // FIXME: Remove this
    public tryMatchWSP() : boolean {
        this._tryMatchComments()

        if (this.tryMatch(' ') || this.tryMatch('\x09')) {
            return true
        }

        return false
    }
    

    private _samePosOrEof(pos1 : ScannerPos, pos2 : ScannerPos) {
        if (this.peekCh() === false) {
            return true
        }

        return pos1.pos === pos2.pos
    }

    public skipWSAndComments() {
        while (true) {
            this.skipWS()
    
            const refPos = this.pos()
            this._tryMatchComments()

            if (this._samePosOrEof(refPos, this.pos())) {
                return
            }
        }
    }


    // FIXME: implement for real, very simple right now just for test-cases
    public skipWS() {
        let pch = this.peekCh()
        while ((pch === ' ') || (pch === '\t') || (pch === '\r') || (pch === '\n')) {
            if (pch === '\r') {
                this._line += 1
                this._col   = 0

                if (this.peekCh() === '\n') {
                    this.nextCh()
                }

                console.log('crlf')
            } else if (pch === '\n') {
                this._line += 1
                this._col   = 0

                //console.log(`lf _line=${this._line} : _col=${this._col}`)
            }

            
            this.nextCh()
            pch = this.peekCh()
        }
    }

    /**
     *
     * ALPHA               = %x41-5A / %x61-7A
     *                       ; A-Z / a-z
     */
    public isAlpha(s : string) : boolean {
        return _isAlphaCh(s)
    }

    public isDigit(s : string) : boolean {
        return _isDigitCh(s)
    }

    private _isDigit(s : string | false) {
        if (s === false) {
            return false
        } else {
            return this.isDigit(s)
        }
    }

    public tryMatchNumber(allowSign : boolean, allowDecimal : boolean) : string | false {
        let s = ''
        let decimalFound = false

        this._tryLocB = this.location()

        let pch = this.peekCh()

        if (allowSign === true) {
            if ((pch === '+') || (pch === '-')) {
                s += this.nextCh()
                pch = this.peekCh()
            }
        }

        if (allowDecimal) {
            if ((pch === '.') && this._isDigit(this.peekCh(2))) {
                decimalFound = true
                s += this.nextCh()
            }
        }

        while (pch && this.isDigit(pch)) {
            s += this.nextCh()
            pch = this.peekCh()

            if (allowDecimal) {
                if (pch === '.') {
                    if (decimalFound === true) {
                        break
                    }

                    decimalFound = true

                    s += this.nextCh()
                    pch = this.peekCh()

                    if (!this._isDigit(pch)) {
                        return false
                    }
                }
            }
        }

        if (s === '') {
            return false
        } else {
            this._tryText = s
            this._tryLocE = this.location()
            this._tryLocE[0] -= 1
            this._tryLocE[2] -= 1

            return s
        }
    }

    private _tryMatchComments() : void {
        while (this._tryMatchSlashStarComment() || this._tryMatchSlashSlashComment()) {
        }
    }

    // FIXME : Handle nested /* comments
    protected _tryMatchSlashStarComment() : boolean {
        if ((this.peekCh(1) !== '/') || (this.peekCh(2) !== '*')) {
            return false
        }

        let pos = this.pos()
        let found = false

        while (!found && (this.peekCh(1) !== false)) {
            if ((this.peekCh(1) === '*') && (this.peekCh(2) === '/')) {
                found = true
            } else if (!this.tryMatchLineBreak()) {
                this.nextCh()
            }
        }

        if (found) {
            this.nextCh() // *
            this.nextCh() // /

            return true
        } else {
            this.setPos(pos)
            return false
        }
    }

    protected _tryMatchSlashSlashComment() : boolean {
        if ((this.peekCh(1) !== '/') || (this.peekCh(2) !== '/')) {
            return false
        }

        while (this.peekCh(1) !== false) {
            if (this.tryMatchLineBreak()) {
                break
            } else {
                this.nextCh()
            }
        }

        return true
    }

    private _tryMatchString() : false | {
        lQ : ScannerPos,
        rQ : ScannerPos,
        text : string
    } {
        // The first " is already consumed here
        const orgPos = this.pos()

        let text = ''
        let pch = this.peekCh()
        let rQ : ScannerPos = this.pos()

        while ((pch !== false) && (pch !== '"')) {
            text += this.nextCh()
            rQ = this.pos()
            pch = this.peekCh()
        }

        if (pch === false) {
            this.setPos(orgPos)
            return false
        }

        // Consume last "
        this.nextCh()

        return {
            lQ : orgPos,
            rQ : rQ,
            text : text
        }
    }
}



export namespace Test {

export class TestScanner extends Scanner {

    /**
     * Expose _tryMatchSlashStartComment for test
     */
    public tryMatchSlashStarComment() : boolean {
        return this._tryMatchSlashStarComment()
    }

    /**
     * Expose _tryMatchSlashSlashComment for test
     */
    public tryMatchSlashSlashComment() : boolean {
        return this._tryMatchSlashSlashComment()
    }
}


} // namespace Test


/*
export type ValidIdentifierError = {
    error : 'empty' | 'bad-identifier' | 'xml-start'
    loc   : BeginEndPos
}
*/

