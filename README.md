# aesophia-parser
[Aeternity](https://aeternity.com/) blockhain [sophia](https://github.com/aeternity/aesophia) language parser, written in TypeScript.

MIT license.

Main use-case is the LSP part of the upcoming aesophia-vscode vscode plugin.

**Caveats** for now
- Not a complete parser.
- No semantic checks.
- Very limited error recovery.


## CLI

The CLI only verifies if it's a valid .aes file, no output is generated.

```
$ node_modules/.bin/aesophia-parser --help
Usage: aesophia-parser [options] <file>

Options:
  -h, --help  Show help
```