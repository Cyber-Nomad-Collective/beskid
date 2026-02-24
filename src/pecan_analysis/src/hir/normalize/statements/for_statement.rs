use crate::hir::{
    ExpressionNode, HirAssignExpression, HirBinaryExpression, HirBinaryOp, HirExpressionStatement,
    HirForStatement, HirLetStatement, HirLiteral, HirLiteralExpression, HirPath, HirPathExpression,
    HirStatementNode, HirWhileStatement, StatementNode,
};
use crate::syntax::Spanned;

use crate::hir::normalize::core::Normalizer;
use crate::hir::normalize::normalizable::Normalize;

impl Normalize for Spanned<HirForStatement> {
    type Output = Vec<Spanned<HirStatementNode>>;

    fn normalize(mut self, normalizer: &mut Normalizer) -> Self::Output {
        let span = self.span;
        normalizer.visit_expression(&mut self.node.range.node.start);
        normalizer.visit_expression(&mut self.node.range.node.end);
        normalizer.visit_block(&mut self.node.body);

        // Desugar for loop:
        // let mut iterator = start;
        // while iterator < end {
        //     body;
        //     iterator = iterator + 1;
        // }

        let iterator_name = self.node.iterator;
        let start_expr = self.node.range.node.start;
        let end_expr = self.node.range.node.end;
        let mut while_body = self.node.body;

        let type_annotation = None;

        let init_stmt_node = HirLetStatement {
            mutable: true,
            name: iterator_name.clone(),
            type_annotation,
            value: start_expr,
        };
        let init_stmt = Spanned::new(StatementNode::LetStatement(Spanned::new(init_stmt_node, span)), span);

        let iterator_path = Spanned::new(
            ExpressionNode::PathExpression(Spanned::new(
                HirPathExpression {
                    path: Spanned::new(
                        HirPath {
                            segments: vec![iterator_name.clone()],
                        },
                        iterator_name.span,
                    ),
                },
                iterator_name.span,
            )),
            iterator_name.span,
        );

        let iterator_path_2 = Spanned::new(
            ExpressionNode::PathExpression(Spanned::new(
                HirPathExpression {
                    path: Spanned::new(
                        HirPath {
                            segments: vec![iterator_name.clone()],
                        },
                        iterator_name.span,
                    ),
                },
                iterator_name.span,
            )),
            iterator_name.span,
        );

        let iterator_path_3 = Spanned::new(
            ExpressionNode::PathExpression(Spanned::new(
                HirPathExpression {
                    path: Spanned::new(
                        HirPath {
                            segments: vec![iterator_name.clone()],
                        },
                        iterator_name.span,
                    ),
                },
                iterator_name.span,
            )),
            iterator_name.span,
        );

        let condition = Spanned::new(
            ExpressionNode::BinaryExpression(Spanned::new(
                HirBinaryExpression {
                    left: Box::new(iterator_path),
                    op: Spanned::new(HirBinaryOp::Lt, self.node.range.span),
                    right: Box::new(end_expr),
                },
                self.node.range.span,
            )),
            self.node.range.span,
        );

        let increment_expr = Spanned::new(
            ExpressionNode::AssignExpression(Spanned::new(
                HirAssignExpression {
                    target: Box::new(iterator_path_2),
                    value: Box::new(Spanned::new(
                        ExpressionNode::BinaryExpression(Spanned::new(
                            HirBinaryExpression {
                                left: Box::new(iterator_path_3),
                                op: Spanned::new(HirBinaryOp::Add, iterator_name.span),
                                right: Box::new(Spanned::new(
                                    ExpressionNode::LiteralExpression(Spanned::new(
                                        HirLiteralExpression {
                                            literal: Spanned::new(
                                                HirLiteral::Integer("1".to_string()),
                                                iterator_name.span,
                                            ),
                                        },
                                        iterator_name.span,
                                    )),
                                    iterator_name.span,
                                )),
                            },
                            iterator_name.span,
                        )),
                        iterator_name.span,
                    )),
                },
                iterator_name.span,
            )),
            iterator_name.span,
        );

        let increment_stmt = Spanned::new(
            StatementNode::ExpressionStatement(Spanned::new(
                HirExpressionStatement {
                    expression: increment_expr,
                },
                span,
            )),
            span,
        );

        while_body.node.statements.push(increment_stmt);

        let while_stmt = Spanned::new(
            StatementNode::WhileStatement(Spanned::new(
                HirWhileStatement {
                    condition,
                    body: while_body,
                },
                span,
            )),
            span,
        );

        vec![init_stmt, while_stmt]
    }
}
