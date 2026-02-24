use gc_arena::{Arena, DynamicRootSet, Mutation, Rootable};
use pecan_codegen::CodegenArtifact;
use pecan_runtime::{
    clear_current_mutation, clear_current_root, set_current_mutation, set_current_root,
    RuntimeRoot, RuntimeState,
};

use crate::jit_module::{JitError, PecanJitModule};

type PecanArena = Arena<Rootable![RuntimeRoot<'_>]>;

pub struct Engine {
    arena: PecanArena,
    jit: PecanJitModule,
}

impl Engine {
    pub fn new() -> Self {
        let arena = Arena::new(|mc| RuntimeRoot {
            globals: Vec::new(),
            dynamic_roots: DynamicRootSet::new(mc),
            runtime_state: RuntimeState::default(),
        });
        let jit = PecanJitModule::new().expect("failed to initialize JIT module");
        Self { arena, jit }
    }

    pub fn compile_artifact(&mut self, artifact: &CodegenArtifact) -> Result<(), JitError> {
        self.jit.compile(artifact)
    }

    pub unsafe fn entrypoint_ptr(&mut self, name: &str) -> Result<*const u8, JitError> {
        let func_id = self
            .jit
            .get_func_id(name)
            .ok_or_else(|| JitError::MissingFunction(name.to_string()))?;
        Ok(unsafe { self.jit.get_finalized_function_ptr(func_id) })
    }

    pub fn with_arena<R>(
        &mut self,
        f: impl for<'gc> FnOnce(&'gc Mutation<'gc>, &'gc mut RuntimeRoot<'gc>) -> R,
    ) -> R {
        self.arena.mutate_root(|mc, root| {
            set_current_mutation(mc as *const _ as *mut _);
            set_current_root(root as *mut _);
            struct Guard;
            impl Drop for Guard {
                fn drop(&mut self) {
                    clear_current_mutation();
                    clear_current_root();
                }
            }
            let _guard = Guard;
            f(mc, root)
        })
    }
}
