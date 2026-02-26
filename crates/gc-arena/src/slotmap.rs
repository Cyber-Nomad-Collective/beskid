use slotmap::{Key, SlotMap};

use crate::collect::{Collect, Trace};

// SAFETY: `SlotMap<K, V>` only stores values of type `V` (keys are merely `PhantomData` and never
// stored). We trace all values, satisfying the requirement that all held `Gc` pointers are traced.
// `SlotMap` does not have a custom `Drop` and does not provide interior mutability, so requirements
// 2 and 3 of `Collect` are upheld by `V`.
unsafe impl<'gc, K: Key, V: Collect<'gc>> Collect<'gc> for SlotMap<K, V> {
    const NEEDS_TRACE: bool = V::NEEDS_TRACE;

    #[inline]
    fn trace<C: Trace<'gc>>(&self, cc: &mut C) {
        if V::NEEDS_TRACE {
            for v in self.values() {
                cc.trace(v);
            }
        }
    }
}
