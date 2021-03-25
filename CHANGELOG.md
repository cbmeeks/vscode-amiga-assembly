# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

### [0.22.0] -
- [Issue #150](https://github.com/prb28/vscode-amiga-assembly/issues/150) Copper disassemble does not work with winuae 
- [Feat #149](https://github.com/prb28/vscode-amiga-assembly/issues/149) Select variable view format during debug
- [Issue #142](https://github.com/prb28/vscode-amiga-assembly/issues/142) Consider register aliases in "List used registers in selection"
- [Issue #141](https://github.com/prb28/vscode-amiga-assembly/issues/141) If there are any compile/linker errors stop the emulation from running
- [Issue #139](https://github.com/prb28/vscode-amiga-assembly/issues/139) Memory dump documentation is wrong

### [0.21.1] - 2021-01-10
- [Issue #135](https://github.com/prb28/vscode-amiga-assembly/issues/135) Regressions with 0.21 (default exceptions mask fix)

### [0.21] - 2021-01-04
- [Issue #130](https://github.com/prb28/vscode-amiga-assembly/issues/130) Builtin ADFGenerator failures
- [Feat #122](https://github.com/prb28/vscode-amiga-assembly/issues/122) Feature: Show CCR (Conditional Code Register) at debugging
- [Feat #114](https://github.com/prb28/vscode-amiga-assembly/issues/114) WinUAE GDB Support

### [0.20] - 2020-07-27
- [Issue #117](https://github.com/prb28/vscode-amiga-assembly/issues/117) _ in variable
- [Issue #116](https://github.com/prb28/vscode-amiga-assembly/issues/116) Support blitter wait in copperDisassembler
- [Issue #112](https://github.com/prb28/vscode-amiga-assembly/issues/112) Current directory wrong when debugging
- [Feat #75](https://github.com/prb28/vscode-amiga-assembly/issues/75) Better documentation with examples for ASM instructions

### [0.19.1] - 2020-01-05
- [Issue #111](https://github.com/prb28/vscode-amiga-assembly/issues/111) Setting an absolute path in amiga-assembly.tmpDir outside the workspace does not work
- [Issue #110](https://github.com/prb28/vscode-amiga-assembly/issues/110) Bug in Add Bitwise operators to calculations

### [0.19.0] - 2019-12-30
- [Feat #107](https://github.com/prb28/vscode-amiga-assembly/issues/107) Don't use hardcoded build as temp path when saving
- [Feat #106](https://github.com/prb28/vscode-amiga-assembly/issues/105) Add "step out" in debug capabilities
- [Issue #105](https://github.com/prb28/vscode-amiga-assembly/issues/105) Debugger hangs when getting back (rts) from a jsr call) 
- [Issue #102](https://github.com/prb28/vscode-amiga-assembly/issues/102) Multiple code SECTIONs cause debug output to be off
- [Feat #101](https://github.com/prb28/vscode-amiga-assembly/issues/101) Do not show the "please configure VASM" message if it is disabled in the settings
- [Feat #100](https://github.com/prb28/vscode-amiga-assembly/issues/100) Add register addresses to hover data
- [Feat #95](https://github.com/prb28/vscode-amiga-assembly/issues/95) Generate Boot Block Code
- [Feat #85](https://github.com/prb28/vscode-amiga-assembly/issues/85) Use vscode.workspace.fs instead of fs in the extension
- [Feat #79](https://github.com/prb28/vscode-amiga-assembly/issues/79) Modify market data with expression or defaults

### [0.18.2] - 2019-10-27
- [Issue #99](https://github.com/prb28/vscode-amiga-assembly/issues/99) List used registers sometimes incorrect
- [Issue #98](https://github.com/prb28/vscode-amiga-assembly/issues/98) A line containing a macro and mnemonic is badly formatted

### [0.18.1] - 2019-10-21
- [Issue #97](https://github.com/prb28/vscode-amiga-assembly/issues/97) Code builded outside the application can't be debugged 
- [Feat #87](https://github.com/prb28/vscode-amiga-assembly/issues/87) Use of Webview.toWebviewResource

### [0.18.0] - 2019-09-21
- [Feat #91](https://github.com/prb28/vscode-amiga-assembly/issues/91) Add ascii representation in popups
- [Feat #89](https://github.com/prb28/vscode-amiga-assembly/issues/89) Gdb remote protocol review
- [Feat #88](https://github.com/prb28/vscode-amiga-assembly/issues/88) Check for GUI settings edit
- [Feat #86](https://github.com/prb28/vscode-amiga-assembly/issues/86) Migrate vscode testing api to vscode-test
- [Issue #83](https://github.com/prb28/vscode-amiga-assembly/issues/83) "Format Document" indent character ; in dc.b "strings"
- [Issue #80](https://github.com/prb28/vscode-amiga-assembly/issues/80) Source file names always upper case on windows when debugging
- [Feat #78](https://github.com/prb28/vscode-amiga-assembly/issues/78) Implement supportsReadMemoryRequest and supportsDisassembleRequest
- [Feat #73](https://github.com/prb28/vscode-amiga-assembly/issues/73) Format ASM files with tabs
- [Feat #72](https://github.com/prb28/vscode-amiga-assembly/issues/72) Enhance formatting for generated data #72

### [0.17.0] - 2019-05-15
- [Issue #74](https://github.com/prb28/vscode-amiga-assembly/issues/74) Contextual documentation: not all mnemonics are recognized
- [Issue #68](https://github.com/prb28/vscode-amiga-assembly/issues/68) Presentation of the value set to a register $102 (BPLCON1) is wrong
- [Feat #66](https://github.com/prb28/vscode-amiga-assembly/issues/66) Debug C source files
- [Feat #63](https://github.com/prb28/vscode-amiga-assembly/issues/63) IntelliSense for commodore libraries
- Documentation table of contents
- Set the entry point for vlink linker
- Completion for variable and library functions in assembly

### [0.16.0] - 2019-04-21
- [Feat #40](https://github.com/prb28/vscode-amiga-assembly/issues/40) View iff/ilbm images

### [0.15.0] - 2019-04-18
- [Feat #58](https://github.com/prb28/vscode-amiga-assembly/issues/58) Name of generated ADF
- [Feat #57](https://github.com/prb28/vscode-amiga-assembly/issues/57) Feature: Sinus data generator

### [0.14.0] - 2019-04-07
- [Issue #59](https://github.com/prb28/vscode-amiga-assembly/issues/59) Missing vasm Link Error
- [Issue #56](https://github.com/prb28/vscode-amiga-assembly/issues/56) Wrong tool tip formatting of values
- [Feat #55](https://github.com/prb28/vscode-amiga-assembly/issues/55) Copper debugging

### [0.13.0] - 2019-02-09
- [Feat #54](https://github.com/prb28/vscode-amiga-assembly/issues/54) Hierarchical Outline
- [Feat #48](https://github.com/prb28/vscode-amiga-assembly/issues/48) Display used/free registers in selected codeblock

### [0.12.0] - 2019-01-15
- [Feat #46](https://github.com/prb28/vscode-amiga-assembly/issues/46) Evaluate variables values
- [Feat #45](https://github.com/prb28/vscode-amiga-assembly/issues/45) Set a preferred comment and/or instruction position while formatting a source
- [Feat #44](https://github.com/prb28/vscode-amiga-assembly/issues/44) Provide outline information

### [0.11.0] - 2019-01-02
- [Feat #37](https://github.com/prb28/vscode-amiga-assembly/issues/39) Generate adf file with the output
- [Issue #43](https://github.com/prb28/vscode-amiga-assembly/issues/43) Bad assignment formatting
- [Issue #41](https://github.com/prb28/vscode-amiga-assembly/issues/41) When running the program, the stop button should kill FS-UAE

### [0.10.2] - 2018-12-23
- [Feat #37](https://github.com/prb28/vscode-amiga-assembly/issues/37) Text format should align = or equ statements
- [Issue #38](https://github.com/prb28/vscode-amiga-assembly/issues/38) Breakpoint set before debugging session start is not sent to fs-uae 

### [0.10.1] - 2018-11-13
- Formatter fixes (macros)
- Vasm error parsing fixes

### [0.10.0] - 2018-10-28
- [Feat #32](https://github.com/prb28/vscode-amiga-assembly/issues/32) Print memory addresses in custom registries (dffxxx)
- [Issue #31](https://github.com/prb28/vscode-amiga-assembly/issues/31) Bad symbol address if it is in a different segment/sections from code
- [Issue #30](https://github.com/prb28/vscode-amiga-assembly/issues/30) Bad addresses in memory dump
- [Issue #28](https://github.com/prb28/vscode-amiga-assembly/issues/28) Working directory for emulator is invalid
- [Feat #26](https://github.com/prb28/vscode-amiga-assembly/issues/26) Copper disassembly 
- [Issue #25](https://github.com/prb28/vscode-amiga-assembly/issues/25) command 'amiga-assembly.disassemble-file' not found after update

### [0.9.0] - 2018-10-14
- [Feat #21](https://github.com/prb28/vscode-amiga-assembly/issues/21) Show disassembled code in editor for stack trace selection without source, breakpoints on disassembled code
- [Issue #24](https://github.com/prb28/vscode-amiga-assembly/issues/24) Better error messages on bad settings and launch parameters

### [0.8.0] - 2018-09-20
- [Issue #23](https://github.com/prb28/vscode-amiga-assembly/issues/23) Add a reference provider
- [Issue #22](https://github.com/prb28/vscode-amiga-assembly/issues/22) Add a definition provider
- [Issue #19](https://github.com/prb28/vscode-amiga-assembly/issues/19) * may represents the current pc in a operand symbol
- [Feat #18](https://github.com/prb28/vscode-amiga-assembly/issues/18) Accept octal numbers 
- [Feat #16](https://github.com/prb28/vscode-amiga-assembly/issues/16) Add VASM directives to documentation

### [0.7.0] - 2018-09-03
- Run and Debug with FS-UAE
- Disassemble a file

### [0.6.2] - 2018-06-28
- [Issue #3](https://github.com/prb28/vscode-amiga-assembly/issues/3) Language Packs category is for display language extensions

### [0.6.0] - 2018-06-01
- Integration of VASM : build and diagnostics in the editor
- Integration of VLINK : linking the executable
- m68k instruction set documentation (contribution from [Stephen Moody](https://github.com/SteveMoody73))
- [Issue #1](https://github.com/prb28/vscode-amiga-assembly/issues/1) Parsing error in calculator

### [0.5.0] - 2018-05-20
- Color provider
- Added documentation for CIAA and CIAB
- Shows the values set to the registers
- Show values in decimal / hexadecimal and binary
- Calculator

### [0.4.0] - 2018-05-15
- Format selection of document
- Format on typing
- Configurable default spacings

### [0.3.0] - 2018-05-14
- Documentation hover keywords (instructions and register)

### [0.2.0] - 2018-05-11
- Initial release of Amiga Assembly
- Editor Highlights
- Document Formatting
