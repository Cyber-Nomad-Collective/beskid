use smallvec::{Array, SmallVec};

use crate::collect::{Collect, Trace};

// SAFETY: `SmallVec<A>` only contains values of type `A::Item`. We trace all values, satisfying the
// requirement that all held `Gc` pointers are traced. `SmallVec`'s `Drop` impl only drops contained
// values and does not access `Gc` pointers, and it does not provide interior mutability, so
// requirements 2 and 3 of `Collect` are upheld by `A::Item`.
unsafe impl<'gc, A: Array> Collect<'gc> for SmallVec<A>
where
    A::Item: Collect<'gc>,
{
    const NEEDS_TRACE: bool = A::Item::NEEDS_TRACE;

    #[inline]
    fn trace<C: Trace<'gc>>(&self, cc: &mut C) {
        if A::Item::NEEDS_TRACE {
            for v in self {
                cc.trace(v);
            }
        }
    }
}
