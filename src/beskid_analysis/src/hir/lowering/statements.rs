use crate::hir::{
    HirBlock, HirBreakStatement, HirContinueStatement, HirExpressionStatement, HirForStatement,
    HirIfStatement, HirLetStatement, HirReturnStatement, HirStatementNode, HirWhileStatement,
};
use crate::syntax::{self, Spanned};

use super::Lowerable;

impl Lowerable for Spanned<syntax::Block> {
    type Output = Spanned<HirBlock>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirBlock {
                statements: self.node.statements.iter().map(Lowerable::lower).collect(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::Statement> {
    type Output = Spanned<HirStatementNode>;

    fn lower(&self) -> Self::Output {
        let node = match &self.node {
            syntax::Statement::Let(let_stmt) => HirStatementNode::LetStatement(let_stmt.lower()),
            syntax::Statement::Return(return_stmt) => {
                HirStatementNode::ReturnStatement(return_stmt.lower())
            }
            syntax::Statement::Break(_) => {
                HirStatementNode::BreakStatement(Spanned::new(HirBreakStatement, self.span))
            }
            syntax::Statement::Continue(_) => {
                HirStatementNode::ContinueStatement(Spanned::new(HirContinueStatement, self.span))
            }
            syntax::Statement::While(while_stmt) => {
                HirStatementNode::WhileStatement(while_stmt.lower())
            }
            syntax::Statement::For(for_stmt) => HirStatementNode::ForStatement(for_stmt.lower()),
            syntax::Statement::If(if_stmt) => HirStatementNode::IfStatement(if_stmt.lower()),
            syntax::Statement::Expression(expr_stmt) => {
                HirStatementNode::ExpressionStatement(expr_stmt.lower())
            }
        };
        Spanned::new(node, self.span)
    }
}

impl Lowerable for Spanned<syntax::LetStatement> {
    type Output = Spanned<HirLetStatement>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirLetStatement {
                mutable: self.node.mutable,
                name: self.node.name.lower(),
                type_annotation: self.node.type_annotation.as_ref().map(Lowerable::lower),
                value: self.node.value.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::ReturnStatement> {
    type Output = Spanned<HirReturnStatement>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirReturnStatement {
                value: self.node.value.as_ref().map(Lowerable::lower),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::WhileStatement> {
    type Output = Spanned<HirWhileStatement>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirWhileStatement {
                condition: self.node.condition.lower(),
                body: self.node.body.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::ForStatement> {
    type Output = Spanned<HirForStatement>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirForStatement {
                iterator: self.node.iterator.lower(),
                range: self.node.range.lower(),
                body: self.node.body.lower(),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::IfStatement> {
    type Output = Spanned<HirIfStatement>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirIfStatement {
                condition: self.node.condition.lower(),
                then_block: self.node.then_block.lower(),
                else_block: self.node.else_block.as_ref().map(Lowerable::lower),
            },
            self.span,
        )
    }
}

impl Lowerable for Spanned<syntax::ExpressionStatement> {
    type Output = Spanned<HirExpressionStatement>;

    fn lower(&self) -> Self::Output {
        Spanned::new(
            HirExpressionStatement {
                expression: self.node.expression.lower(),
            },
            self.span,
        )
    }
}
