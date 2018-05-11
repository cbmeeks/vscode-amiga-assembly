# Amiga Assembly for Visual Studio Code

Amiga Assembly for Visual Studio Code is a extension to support assembly language for the Amiga Motorolla 68000 machines and emulators.


## Features

### Motorola 68K Assembly Language Support
This feature is based on the work of Steve Saunders for Sublime Text m68k extension, it's available at https://github.com/stevenjs/M68k-Assembly. Some keywords have been added to be more accurate with the Amiga assembly.

### Document Formatting
The assembly language will be formatted with the standard shortcuts :
- On Windows Shift + Alt + F
- On Mac Shift + Option + F
- On Ubuntu Ctrl + Shift + I
- or Ctrl + Shift + P (or Command + Shift + P on Mac), and then search for "Format Document".
![Formatting screenshot](images/formatting.gif)

## Release Notes

### 0.2.0
- Initial release of Amiga Assembly
- Editor Highlights
- Document Formatting

## Misc credits
### Extensions used for development
- TextMate Languages from Ben Hockley : https://marketplace.visualstudio.com/items?itemName=Togusa09.tmlanguage
- Spell Right from Bartosz Antosik : https://marketplace.visualstudio.com/items?itemName=ban.spellright
- TSLint from egamma : https://marketplace.visualstudio.com/items?itemName=eg2.tslint
### Dependencies for tests
- TypeScript : https://www.typescriptlang.org/
- node : https://nodejs.org/en/
- tslint : https://palantir.github.io/tslint/
- chai : http://www.chaijs.com/
- mocha : https://mochajs.org/
### Screen capture
- licecap : https://www.cockos.com/licecap/