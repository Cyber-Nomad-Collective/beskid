# Design: default parameters (0.6.7)

The compiler passes the default value of each omitted parameter at the call site, so after this step every call has all its arguments, and later stages see no optional parameter. A caller-information parameter gets the file, line or column of the call instead of its default.

Target scope. The owner extends defaults to methods, contract methods, functions in inline modules, and host, scope and hook parameters. The implementation of slice defaults first covered top-level functions only. This change specifies the target; E1254 remains only where a default cannot apply. A call through a contract bound uses the defaults declared in the contract. An implementation method SHALL NOT declare a default of its own for a parameter that the contract declares.
