# Design: test namespace (0.6.7)

The resolver records tests by module and name in a table of their own. A test is still an item for discovery, symbols and the language server, but it is never inserted into the item scope, so no path can refer to it and it never conflicts with a function or type.
