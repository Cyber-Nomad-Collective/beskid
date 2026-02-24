use indexmap::{IndexMap, IndexSet};

use crate::collect::{Collect, Trace};

// SAFETY: `IndexMap<K, V, S>` only stores keys and values of types `K` and `V`. We trace all keys
// and values, satisfying the requirement that all held `Gc` pointers are traced. `IndexMap` does
// not have a custom `Drop` and does not provide interior mutability, so requirements 2 and 3 of
// `Collect` are upheld by `K` and `V`.
unsafe impl<'gc, K, V, S> Collect<'gc> for IndexMap<K, V, S>
where
    K: Collect<'gc>,
    V: Collect<'gc>,
    S: 'static,
{
    const NEEDS_TRACE: bool = K::NEEDS_TRACE || V::NEEDS_TRACE;

    #[inline]
    fn trace<C: Trace<'gc>>(&self, cc: &mut C) {
        if Self::NEEDS_TRACE {
            for (k, v) in self {
                cc.trace(k);
                cc.trace(v);
            }
        }
    }
}

// SAFETY: `IndexSet<T, S>` only stores values of type `T`. We trace all values, satisfying the
// requirement that all held `Gc` pointers are traced. `IndexSet` does not have a custom `Drop` and
// does not provide interior mutability, so requirements 2 and 3 of `Collect` are upheld by `T`.
unsafe impl<'gc, T, S> Collect<'gc> for IndexSet<T, S>
where
    T: Collect<'gc>,
    S: 'static,
{
    const NEEDS_TRACE: bool = T::NEEDS_TRACE;

    #[inline]
    fn trace<C: Trace<'gc>>(&self, cc: &mut C) {
        if T::NEEDS_TRACE {
            for v in self {
                cc.trace(v);
            }
        }
    }
}
