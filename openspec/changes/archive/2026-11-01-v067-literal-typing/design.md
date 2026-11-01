# Design: contextual numeric literals (0.6.7)

One mechanism decides the width of every bare literal: the expected type of its position. Generic inference decides only the type parameter; the call-argument expected type maps a bare literal, or each element of a bare-integer array literal, to the specialized parameter. Lowering and the check gate read the same expected type, so a literal is typed and judged element by element.

Known gap, left to integration: when a bare literal does not fit a type parameter inferred from an exact sibling (`Same(1_u8, 300)`), inference does not bind it and the gate reports no T0905 for it.

For the conditional expression, a bare literal in one branch takes the proven type of the other branch (the same peer rule as for the operands of a binary operator). Two branches of different typed values remain a type mismatch.
