use crate::parsing::util::{assert_parse, assert_parse_fail, parse_expression_ast};
use beskid_analysis::syntax::{BinaryOp, Expression, Literal, Spanned};
use beskid_analysis::Rule;

#[test]
fn parses_arithmetic_precedence() {
    let expr = parse_expression_ast("1 + 2 * 3");
    let (left, _op, right) = expect_binary(&expr.node, BinaryOp::Add);
    expect_integer_literal(&left.node, "1");
    let (mul_left, mul_op, mul_right) = expect_binary(&right.node, BinaryOp::Mul);
    expect_binary_op(mul_op, BinaryOp::Mul);
    expect_integer_literal(&mul_left.node, "2");
    expect_integer_literal(&mul_right.node, "3");
}

#[test]
fn parses_assignment_expression() {
    let expr = parse_expression_ast("x = y + 1");
    let (target, value) = expect_assign(&expr.node);
    expect_identifier_path(&target.node, "x");
    let (_, op, right) = expect_binary(&value.node, BinaryOp::Add);
    expect_binary_op(op, BinaryOp::Add);
    expect_integer_literal(&right.node, "1");
}

#[test]
fn parses_calls_and_member_access() {
    let expr = parse_expression_ast("foo.bar(1, 2)");
    let (callee, args) = expect_call(&expr.node, 2);
    expect_path_segments(&callee.node, &["foo", "bar"]);
    expect_integer_literal(&args[0].node, "1");
    expect_integer_literal(&args[1].node, "2");
}

#[test]
fn parses_logical_binary_expression() {
    let expr = parse_expression_ast("true || false");
    let (left, op, right) = expect_binary(&expr.node, BinaryOp::Or);
    expect_binary_op(op, BinaryOp::Or);
    expect_bool_literal(&left.node, true);
    expect_bool_literal(&right.node, false);
}

#[test]
fn parses_equality_binary_expression() {
    let expr = parse_expression_ast("1 == 2");
    let (left, op, right) = expect_binary(&expr.node, BinaryOp::Eq);
    expect_binary_op(op, BinaryOp::Eq);
    expect_integer_literal(&left.node, "1");
    expect_integer_literal(&right.node, "2");
}

#[test]
fn parses_comparison_binary_expression() {
    let expr = parse_expression_ast("1 < 2");
    let (left, op, right) = expect_binary(&expr.node, BinaryOp::Lt);
    expect_binary_op(op, BinaryOp::Lt);
    expect_integer_literal(&left.node, "1");
    expect_integer_literal(&right.node, "2");
}

#[test]
fn parses_sub_and_div_binary_expression() {
    let expr = parse_expression_ast("4 - 2 / 1");
    let (left, op, right) = expect_binary(&expr.node, BinaryOp::Sub);
    expect_binary_op(op, BinaryOp::Sub);
    expect_integer_literal(&left.node, "4");
    let (div_left, div_op, div_right) = expect_binary(&right.node, BinaryOp::Div);
    expect_binary_op(div_op, BinaryOp::Div);
    expect_integer_literal(&div_left.node, "2");
    expect_integer_literal(&div_right.node, "1");
}

#[test]
fn rejects_empty_expression() {
    assert_parse_fail(Rule::Expression, "");
}

#[test]
fn rejects_expression_with_invalid_prefix() {
    assert_parse_fail(Rule::Expression, ".foo");
}

#[test]
fn parses_argument_list() {
    assert_parse(Rule::ArgumentList, "1, true, foo");
}

#[test]
fn rejects_argument_list_starting_with_comma() {
    assert_parse_fail(Rule::ArgumentList, ", 1");
}

fn expect_binary<'a>(expr: &'a Expression, op: BinaryOp) -> (&'a Spanned<Expression>, &'a Spanned<BinaryOp>, &'a Spanned<Expression>) {
    if let Expression::Binary(binary) = expr {
        assert_eq!(binary.node.op.node, op);
        return (
            &binary.node.left,
            &binary.node.op,
            &binary.node.right,
        );
    }

    panic!("expected binary expression");
}

fn expect_binary_op(op: &Spanned<BinaryOp>, expected: BinaryOp) {
    assert_eq!(op.node, expected);
}

fn expect_assign(expr: &Expression) -> (&Spanned<Expression>, &Spanned<Expression>) {
    if let Expression::Assign(assign) = expr {
        return (&assign.node.target, &assign.node.value);
    }

    panic!("expected assign expression");
}

fn expect_call<'a>(expr: &'a Expression, args_len: usize) -> (&'a Spanned<Expression>, &'a [Spanned<Expression>]) {
    if let Expression::Call(call) = expr {
        assert_eq!(call.node.args.len(), args_len);
        return (&call.node.callee, &call.node.args);
    }

    panic!("expected call expression");
}

fn expect_identifier_path(expr: &Expression, expected: &str) {
    if let Expression::Path(path) = expr {
        assert_eq!(path.node.path.node.segments.len(), 1);
        assert_eq!(path.node.path.node.segments[0].node.name.node.name.as_str(), expected);
        return;
    }

    panic!("expected path expression");
}

fn expect_path_segments(expr: &Expression, expected: &[&str]) {
    if let Expression::Path(path) = expr {
        assert_eq!(path.node.path.node.segments.len(), expected.len());
        for (segment, expected_name) in path
            .node
            .path
            .node
            .segments
            .iter()
            .zip(expected.iter())
        {
            assert_eq!(segment.node.name.node.name.as_str(), *expected_name);
        }
        return;
    }

    panic!("expected path expression");
}

fn expect_integer_literal(expr: &Expression, expected: &str) {
    if let Expression::Literal(literal) = expr {
        if let Literal::Integer(value) = &literal.node.literal.node {
            assert_eq!(value, expected);
            return;
        }
    }

    panic!("expected integer literal");
}

fn expect_bool_literal(expr: &Expression, expected: bool) {
    if let Expression::Literal(literal) = expr {
        if let Literal::Bool(value) = &literal.node.literal.node {
            assert_eq!(*value, expected);
            return;
        }
    }

    panic!("expected bool literal");
}
