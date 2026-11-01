# Design: string escapes (0.6.7)

The decoder replaces each escape with one Unicode scalar value before UTF-8 encoding. `\0` is U+0000. `\u{...}` has one to six hexadecimal digits and denotes the scalar value they spell. A value in the surrogate range U+D800 to U+DFFF, or above U+10FFFF, is an error. The formatter keeps the spelling of the author. Tree-sitter and TextMate grammars highlight the new escapes.
