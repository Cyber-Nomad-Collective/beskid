use crate::syntax::Spanned;

use super::{item::Item, phase::Phase};

pub struct Module<P: Phase> {
    pub items: Vec<Spanned<Item<P>>>,
}
