pub(crate) fn next_descendant<N: Copy>(
    stack: &mut Vec<N>,
    mut collect_children: impl FnMut(N, &mut Vec<N>),
) -> Option<N> {
    let node = stack.pop()?;
    let mut children = Vec::new();
    collect_children(node, &mut children);
    stack.extend(children.into_iter().rev());
    Some(node)
}

pub(crate) fn walk_depth_first<N: Copy, C>(
    root: N,
    mut collect_children: impl FnMut(N, &mut Vec<N>),
    ctx: &mut C,
    mut on_enter: impl FnMut(&mut C, N),
    mut on_exit: impl FnMut(&mut C, N),
) {
    enum Frame<T> {
        Enter(T),
        Exit(T),
    }

    let mut stack = vec![Frame::Enter(root)];
    while let Some(frame) = stack.pop() {
        match frame {
            Frame::Enter(node) => {
                on_enter(ctx, node);
                stack.push(Frame::Exit(node));

                let mut children = Vec::new();
                collect_children(node, &mut children);
                for child in children.into_iter().rev() {
                    stack.push(Frame::Enter(child));
                }
            }
            Frame::Exit(node) => on_exit(ctx, node),
        }
    }
}
