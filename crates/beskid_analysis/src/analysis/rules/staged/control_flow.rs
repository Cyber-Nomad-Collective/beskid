use super::SemanticPipelineRule;
use crate::analysis::Severity;
use crate::analysis::rules::RuleContext;
use crate::hir::{
    HirBlock, HirExpressionNode, HirItem, HirMatchArm, HirPattern, HirProgram, HirStatementNode,
};
use crate::syntax::Spanned;
use std::collections::{HashMap, HashSet};

impl SemanticPipelineRule {
    pub(super) fn stage3_control_flow_and_patterns(
        &self,
        ctx: &mut RuleContext,
        hir: &Spanned<HirProgram>,
    ) {
        let enum_variants = self.collect_enum_variants(hir);
        let variant_to_enum = self.collect_variant_to_enum(hir);

        for item in &hir.node.items {
            match &item.node {
                HirItem::FunctionDefinition(definition) => {
                    self.check_block(ctx, &definition.node.body, 0, &enum_variants, &variant_to_enum);
                }
                HirItem::MethodDefinition(definition) => {
                    self.check_block(ctx, &definition.node.body, 0, &enum_variants, &variant_to_enum);
                }
                _ => {}
            }
        }
    }

    fn collect_variant_to_enum(&self, hir: &Spanned<HirProgram>) -> HashMap<String, String> {
        let mut result = HashMap::new();
        for item in &hir.node.items {
            let HirItem::EnumDefinition(definition) = &item.node else {
                continue;
            };
            let enum_name = definition.node.name.node.name.clone();
            for variant in &definition.node.variants {
                result.insert(variant.node.name.node.name.clone(), enum_name.clone());
            }
        }
        result
    }

    fn collect_enum_variants(
        &self,
        hir: &Spanned<HirProgram>,
    ) -> HashMap<String, HashMap<String, usize>> {
        let mut result = HashMap::new();

        for item in &hir.node.items {
            let HirItem::EnumDefinition(definition) = &item.node else {
                continue;
            };

            let mut variants = HashMap::new();
            for variant in &definition.node.variants {
                variants.insert(variant.node.name.node.name.clone(), variant.node.fields.len());
            }
            result.insert(definition.node.name.node.name.clone(), variants);
        }

        result
    }

    fn check_block(
        &self,
        ctx: &mut RuleContext,
        block: &Spanned<HirBlock>,
        loop_depth: usize,
        enum_variants: &HashMap<String, HashMap<String, usize>>,
        variant_to_enum: &HashMap<String, String>,
    ) {
        let mut terminated = false;

        for statement in &block.node.statements {
            if terminated {
                ctx.emit_simple(
                    statement.span,
                    "W1403",
                    "unreachable code",
                    "unreachable statement",
                    Some("remove this statement or move it before the terminating statement".to_string()),
                    Severity::Warning,
                );
                continue;
            }

            if self.is_terminating_statement(ctx, statement, loop_depth, enum_variants, variant_to_enum) {
                terminated = true;
            }
        }
    }

    fn is_terminating_statement(
        &self,
        ctx: &mut RuleContext,
        statement: &Spanned<HirStatementNode>,
        loop_depth: usize,
        enum_variants: &HashMap<String, HashMap<String, usize>>,
        variant_to_enum: &HashMap<String, String>,
    ) -> bool {
        match &statement.node {
            HirStatementNode::LetStatement(let_statement) => {
                self.check_expression(ctx, &let_statement.node.value, loop_depth, enum_variants, variant_to_enum);
                false
            }
            HirStatementNode::ReturnStatement(return_statement) => {
                if let Some(value) = &return_statement.node.value {
                    self.check_expression(ctx, value, loop_depth, enum_variants, variant_to_enum);
                }
                true
            }
            HirStatementNode::BreakStatement(_) => {
                if loop_depth == 0 {
                    ctx.emit_simple(
                        statement.span,
                        "E1401",
                        "break used outside loop",
                        "break outside loop",
                        None,
                        Severity::Error,
                    );
                    return false;
                }
                true
            }
            HirStatementNode::ContinueStatement(_) => {
                if loop_depth == 0 {
                    ctx.emit_simple(
                        statement.span,
                        "E1402",
                        "continue used outside loop",
                        "continue outside loop",
                        None,
                        Severity::Error,
                    );
                    return false;
                }
                true
            }
            HirStatementNode::WhileStatement(while_statement) => {
                self.check_expression(
                    ctx,
                    &while_statement.node.condition,
                    loop_depth,
                    enum_variants,
                    variant_to_enum,
                );
                self.check_block(ctx, &while_statement.node.body, loop_depth + 1, enum_variants, variant_to_enum);
                false
            }
            HirStatementNode::ForStatement(for_statement) => {
                self.check_expression(
                    ctx,
                    &for_statement.node.range.node.start,
                    loop_depth,
                    enum_variants,
                    variant_to_enum,
                );
                self.check_expression(
                    ctx,
                    &for_statement.node.range.node.end,
                    loop_depth,
                    enum_variants,
                    variant_to_enum,
                );
                self.check_block(ctx, &for_statement.node.body, loop_depth + 1, enum_variants, variant_to_enum);
                false
            }
            HirStatementNode::IfStatement(if_statement) => {
                self.check_expression(
                    ctx,
                    &if_statement.node.condition,
                    loop_depth,
                    enum_variants,
                    variant_to_enum,
                );
                self.check_block(ctx, &if_statement.node.then_block, loop_depth, enum_variants, variant_to_enum);
                if let Some(else_block) = &if_statement.node.else_block {
                    self.check_block(ctx, else_block, loop_depth, enum_variants, variant_to_enum);
                }
                false
            }
            HirStatementNode::ExpressionStatement(expression_statement) => {
                self.check_expression(
                    ctx,
                    &expression_statement.node.expression,
                    loop_depth,
                    enum_variants,
                    variant_to_enum,
                );
                false
            }
        }
    }

    fn check_expression(
        &self,
        ctx: &mut RuleContext,
        expression: &Spanned<HirExpressionNode>,
        loop_depth: usize,
        enum_variants: &HashMap<String, HashMap<String, usize>>,
        variant_to_enum: &HashMap<String, String>,
    ) {
        match &expression.node {
            HirExpressionNode::MatchExpression(match_expression) => {
                self.check_expression(
                    ctx,
                    &match_expression.node.scrutinee,
                    loop_depth,
                    enum_variants,
                    variant_to_enum,
                );
                for arm in &match_expression.node.arms {
                    self.check_match_arm(ctx, arm, loop_depth, enum_variants, variant_to_enum);
                }
                self.check_match_semantics(ctx, match_expression, enum_variants);
            }
            HirExpressionNode::AssignExpression(assign_expression) => {
                self.check_expression(
                    ctx,
                    &assign_expression.node.target,
                    loop_depth,
                    enum_variants,
                    variant_to_enum,
                );
                self.check_expression(
                    ctx,
                    &assign_expression.node.value,
                    loop_depth,
                    enum_variants,
                    variant_to_enum,
                );
            }
            HirExpressionNode::BinaryExpression(binary_expression) => {
                self.check_expression(
                    ctx,
                    &binary_expression.node.left,
                    loop_depth,
                    enum_variants,
                    variant_to_enum,
                );
                self.check_expression(
                    ctx,
                    &binary_expression.node.right,
                    loop_depth,
                    enum_variants,
                    variant_to_enum,
                );
            }
            HirExpressionNode::UnaryExpression(unary_expression) => {
                self.check_expression(ctx, &unary_expression.node.expr, loop_depth, enum_variants, variant_to_enum);
            }
            HirExpressionNode::CallExpression(call_expression) => {
                if let HirExpressionNode::PathExpression(path_expression) = &call_expression.node.callee.node {
                    if path_expression.node.path.node.segments.len() == 1 {
                        if let Some(name) = path_expression.node.path.node.segments.first() {
                            let name_value = &name.node.name.node.name;
                            if let Some(enum_name) = variant_to_enum.get(name_value) {
                                ctx.emit_simple(
                                    path_expression.node.path.span,
                                    "E1303",
                                    format!(
                                        "unqualified enum constructor `{}`; use `{}::{}`",
                                        name_value, enum_name, name_value
                                    ),
                                    "unqualified enum constructor",
                                    None,
                                    Severity::Error,
                                );
                            }
                        }
                    }
                }
                self.check_expression(ctx, &call_expression.node.callee, loop_depth, enum_variants, variant_to_enum);
                for arg in &call_expression.node.args {
                    self.check_expression(ctx, arg, loop_depth, enum_variants, variant_to_enum);
                }
            }
            HirExpressionNode::MemberExpression(member_expression) => {
                self.check_expression(
                    ctx,
                    &member_expression.node.target,
                    loop_depth,
                    enum_variants,
                    variant_to_enum,
                );
            }
            HirExpressionNode::StructLiteralExpression(struct_literal) => {
                for field in &struct_literal.node.fields {
                    self.check_expression(ctx, &field.node.value, loop_depth, enum_variants, variant_to_enum);
                }
            }
            HirExpressionNode::EnumConstructorExpression(constructor_expression) => {
                let enum_name = constructor_expression.node.path.node.type_name.node.name.clone();
                let variant_name = constructor_expression.node.path.node.variant.node.name.clone();
                let Some(variants) = enum_variants.get(&enum_name) else {
                    ctx.emit_simple(
                        constructor_expression.node.path.span,
                        "E1301",
                        format!("unknown enum path `{enum_name}::{variant_name}`"),
                        "unknown enum path",
                        None,
                        Severity::Error,
                    );
                    return;
                };

                let Some(expected_arity) = variants.get(&variant_name) else {
                    ctx.emit_simple(
                        constructor_expression.node.path.span,
                        "E1301",
                        format!("unknown enum path `{enum_name}::{variant_name}`"),
                        "unknown enum path",
                        None,
                        Severity::Error,
                    );
                    return;
                };

                if constructor_expression.node.args.len() != *expected_arity {
                    ctx.emit_simple(
                        constructor_expression.span,
                        "E1302",
                        format!(
                            "enum constructor arity mismatch: expected {}, got {}",
                            expected_arity,
                            constructor_expression.node.args.len()
                        ),
                        "enum constructor arity mismatch",
                        None,
                        Severity::Error,
                    );
                }

                for arg in &constructor_expression.node.args {
                    self.check_expression(ctx, arg, loop_depth, enum_variants, variant_to_enum);
                }
            }
            HirExpressionNode::BlockExpression(block_expression) => {
                self.check_block(ctx, &block_expression.node.block, loop_depth, enum_variants, variant_to_enum);
            }
            HirExpressionNode::GroupedExpression(grouped_expression) => {
                self.check_expression(ctx, &grouped_expression.node.expr, loop_depth, enum_variants, variant_to_enum);
            }
            HirExpressionNode::LiteralExpression(_) | HirExpressionNode::PathExpression(_) => {}
        }
    }

    fn check_match_arm(
        &self,
        ctx: &mut RuleContext,
        arm: &Spanned<HirMatchArm>,
        loop_depth: usize,
        enum_variants: &HashMap<String, HashMap<String, usize>>,
        variant_to_enum: &HashMap<String, String>,
    ) {
        let mut names = HashSet::new();
        self.collect_pattern_bindings(ctx, &arm.node.pattern, &mut names, enum_variants);

        if let Some(guard) = &arm.node.guard {
            self.check_expression(ctx, guard, loop_depth, enum_variants, variant_to_enum);
        }
        self.check_expression(ctx, &arm.node.value, loop_depth, enum_variants, variant_to_enum);
    }

    fn check_match_semantics(
        &self,
        ctx: &mut RuleContext,
        match_expression: &Spanned<crate::hir::HirMatchExpression>,
        enum_variants: &HashMap<String, HashMap<String, usize>>,
    ) {
        let mut arm_kind: Option<&'static str> = None;
        let mut wildcard_seen = false;
        let mut enum_name: Option<String> = None;
        let mut covered_variants = HashSet::new();

        for arm in &match_expression.node.arms {
            if let Some(guard) = &arm.node.guard {
                if !self.is_boolean_like_guard(guard) {
                    ctx.emit_simple(
                        guard.span,
                        "E1308",
                        "match guard must be boolean",
                        "guard type mismatch",
                        None,
                        Severity::Error,
                    );
                }
            }

            if let Some(kind) = self.literal_kind(&arm.node.value) {
                if let Some(previous_kind) = arm_kind {
                    if previous_kind != kind {
                        ctx.emit_simple(
                            arm.node.value.span,
                            "E1305",
                            "match arm type mismatch",
                            "match arm type mismatch",
                            Some(format!("expected `{previous_kind}`, got `{kind}`")),
                            Severity::Error,
                        );
                    }
                } else {
                    arm_kind = Some(kind);
                }
            }

            match &arm.node.pattern.node {
                HirPattern::Wildcard => wildcard_seen = true,
                HirPattern::Enum(enum_pattern) => {
                    let current_enum = enum_pattern.node.path.node.type_name.node.name.clone();
                    let current_variant = enum_pattern.node.path.node.variant.node.name.clone();
                    covered_variants.insert(current_variant);
                    if let Some(existing) = &enum_name {
                        if existing != &current_enum {
                            enum_name = None;
                        }
                    } else {
                        enum_name = Some(current_enum);
                    }
                }
                _ => {
                    enum_name = None;
                }
            }
        }

        if wildcard_seen {
            return;
        }
        let Some(enum_name) = enum_name else {
            return;
        };
        let Some(variants) = enum_variants.get(&enum_name) else {
            return;
        };
        if variants.keys().all(|variant| covered_variants.contains(variant)) {
            return;
        }

        ctx.emit_simple(
            match_expression.span,
            "E1304",
            format!("non-exhaustive match on enum `{enum_name}`"),
            "match non-exhaustive",
            None,
            Severity::Error,
        );
    }

    fn is_boolean_like_guard(&self, expression: &Spanned<HirExpressionNode>) -> bool {
        match &expression.node {
            HirExpressionNode::LiteralExpression(literal) => {
                matches!(literal.node.literal.node, crate::hir::HirLiteral::Bool(_))
            }
            HirExpressionNode::UnaryExpression(unary_expression) => {
                self.is_boolean_like_guard(&unary_expression.node.expr)
            }
            HirExpressionNode::BinaryExpression(binary_expression) => {
                self.is_boolean_like_guard(&binary_expression.node.left)
                    || self.is_boolean_like_guard(&binary_expression.node.right)
            }
            HirExpressionNode::GroupedExpression(grouped_expression) => {
                self.is_boolean_like_guard(&grouped_expression.node.expr)
            }
            _ => true,
        }
    }

    fn literal_kind(&self, expression: &Spanned<HirExpressionNode>) -> Option<&'static str> {
        match &expression.node {
            HirExpressionNode::LiteralExpression(literal) => match &literal.node.literal.node {
                crate::hir::HirLiteral::Integer(_) => Some("int"),
                crate::hir::HirLiteral::Float(_) => Some("float"),
                crate::hir::HirLiteral::String(_) => Some("string"),
                crate::hir::HirLiteral::Char(_) => Some("char"),
                crate::hir::HirLiteral::Bool(_) => Some("bool"),
            },
            HirExpressionNode::GroupedExpression(grouped_expression) => {
                self.literal_kind(&grouped_expression.node.expr)
            }
            _ => None,
        }
    }

    fn collect_pattern_bindings(
        &self,
        ctx: &mut RuleContext,
        pattern: &Spanned<HirPattern>,
        names: &mut HashSet<String>,
        enum_variants: &HashMap<String, HashMap<String, usize>>,
    ) {
        match &pattern.node {
            HirPattern::Identifier(identifier) => {
                let name = identifier.node.name.clone();
                if names.insert(name.clone()) {
                    return;
                }

                ctx.emit_simple(
                    identifier.span,
                    "E1306",
                    format!("duplicate pattern binding `{name}`"),
                    "duplicate pattern binding",
                    None,
                    Severity::Error,
                );
            }
            HirPattern::Enum(enum_pattern) => {
                let enum_name = enum_pattern.node.path.node.type_name.node.name.clone();
                let variant_name = enum_pattern.node.path.node.variant.node.name.clone();
                let Some(variants) = enum_variants.get(&enum_name) else {
                    ctx.emit_simple(
                        enum_pattern.node.path.span,
                        "E1301",
                        format!("unknown enum path `{enum_name}::{variant_name}`"),
                        "unknown enum path",
                        None,
                        Severity::Error,
                    );
                    return;
                };

                let Some(expected_arity) = variants.get(&variant_name) else {
                    ctx.emit_simple(
                        enum_pattern.node.path.span,
                        "E1301",
                        format!("unknown enum path `{enum_name}::{variant_name}`"),
                        "unknown enum path",
                        None,
                        Severity::Error,
                    );
                    return;
                };

                if enum_pattern.node.items.len() != *expected_arity {
                    ctx.emit_simple(
                        enum_pattern.span,
                        "E1307",
                        format!(
                            "pattern arity mismatch: expected {}, got {}",
                            expected_arity,
                            enum_pattern.node.items.len()
                        ),
                        "pattern arity mismatch",
                        None,
                        Severity::Error,
                    );
                }

                for item in &enum_pattern.node.items {
                    self.collect_pattern_bindings(ctx, item, names, enum_variants);
                }
            }
            HirPattern::Wildcard | HirPattern::Literal(_) => {}
        }
    }
}
