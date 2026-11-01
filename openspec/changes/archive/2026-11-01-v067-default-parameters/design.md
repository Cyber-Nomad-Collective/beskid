# Design: default parameters (0.6.7)

The compiler passes the default value of each omitted parameter at the call site, so after this step every call has all its arguments, and later stages see no optional parameter. A caller-information parameter gets the file, line or column of the call instead of its default.

Scope. Defaults apply to functions (top-level and in inline modules), methods, contract methods, hosts and scopes. E1254 remains for hook parameters and `bulk` parameters; a default in an event parameter list is a parse error. A method that implements a contract method inherits the contract defaults; a different default is E1612. A call through a contract bound uses the defaults declared in the contract. An implementation method SHALL NOT declare a default of its own for a parameter that the contract declares.
