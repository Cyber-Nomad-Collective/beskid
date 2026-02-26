use super::core::Normalizer;

pub trait Normalize {
    type Output;
    fn normalize(self, normalizer: &mut Normalizer) -> Self::Output;
}
