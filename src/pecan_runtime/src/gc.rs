use std::cell::Cell;

use gc_arena::{Collect, DynamicRootSet, Gc, Mutation};

#[derive(Default)]
pub struct RuntimeState {
    pub allocation_counter: usize,
    pub handles: Vec<*mut u8>,
    pub registered_roots: Vec<*mut *mut u8>,
}

unsafe impl<'gc> Collect<'gc> for RuntimeState {
    fn trace<T: gc_arena::collect::Trace<'gc>>(&self, _: &mut T) {}
}

pub struct RawAllocation {
    pub data: Box<[u8]>,
}

unsafe impl<'gc> Collect<'gc> for RawAllocation {
    fn trace<T: gc_arena::collect::Trace<'gc>>(&self, _: &mut T) {}
}

#[derive(Collect)]
#[collect(no_drop)]
pub struct RuntimeRoot<'gc> {
    pub globals: Vec<Gc<'gc, RawAllocation>>,
    pub dynamic_roots: DynamicRootSet<'gc>,
    pub runtime_state: RuntimeState,
}

thread_local! {
    static CURRENT_MUTATION: Cell<*mut Mutation<'static>> = Cell::new(std::ptr::null_mut());
    static CURRENT_ROOT: Cell<*mut RuntimeRoot<'static>> = Cell::new(std::ptr::null_mut());
}

pub fn set_current_mutation(mc: *mut Mutation<'_>) {
    let ptr = mc as *mut Mutation<'static>;
    CURRENT_MUTATION.with(|cell| cell.set(ptr));
}

pub fn clear_current_mutation() {
    CURRENT_MUTATION.with(|cell| cell.set(std::ptr::null_mut()));
}

pub fn with_current_mutation<R>(f: impl FnOnce(&Mutation<'_>) -> R) -> R {
    CURRENT_MUTATION.with(|cell| {
        let ptr = cell.get();
        if ptr.is_null() {
            panic!("no active gc-arena mutation");
        }
        let mutation = unsafe { &*ptr };
        f(mutation)
    })
}

pub fn set_current_root(root: *mut RuntimeRoot<'_>) {
    let ptr = root as *mut RuntimeRoot<'static>;
    CURRENT_ROOT.with(|cell| cell.set(ptr));
}

pub fn clear_current_root() {
    CURRENT_ROOT.with(|cell| cell.set(std::ptr::null_mut()));
}

pub fn with_current_root<R>(f: impl FnOnce(&mut RuntimeRoot<'_>) -> R) -> R {
    CURRENT_ROOT.with(|cell| {
        let ptr = cell.get();
        if ptr.is_null() {
            panic!("no active gc-arena root");
        }
        let root = unsafe { &mut *ptr };
        f(root)
    })
}

pub fn with_current_mutation_and_root<R>(
    f: impl for<'gc> FnOnce(&'gc Mutation<'gc>, &'gc mut RuntimeRoot<'gc>) -> R,
) -> R {
    let mutation_ptr = CURRENT_MUTATION.with(|cell| cell.get());
    if mutation_ptr.is_null() {
        panic!("no active gc-arena mutation");
    }
    let root_ptr = CURRENT_ROOT.with(|cell| cell.get());
    if root_ptr.is_null() {
        panic!("no active gc-arena root");
    }
    unsafe { f(&*(mutation_ptr as *const Mutation<'_>), &mut *(root_ptr as *mut RuntimeRoot<'_>)) }
}

pub fn store_handle(root: &mut RuntimeRoot<'_>, ptr: *mut u8) -> u64 {
    let index = root.runtime_state.handles.len();
    root.runtime_state.handles.push(ptr);
    index as u64
}

pub fn drop_handle(root: &mut RuntimeRoot<'_>, handle: u64) {
    if let Some(slot) = root.runtime_state.handles.get_mut(handle as usize) {
        *slot = std::ptr::null_mut();
    }
}
