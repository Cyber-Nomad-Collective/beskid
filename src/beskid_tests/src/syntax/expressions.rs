use beskid_analysis::syntax::{Expression, Literal, Pattern};

use crate::syntax::util::{
    assert_expression_integer, assert_expression_path_segments, assert_literal_integer,
    assert_literal_bool, assert_literal_char, assert_literal_float, assert_literal_string,
    assert_path_segments, parse_expression_ast,
};

#[test]
fn parses_binary_expression_ast() {
    let expr = parse_expression_ast("1 + 2 * 3");
    match &expr.node {
        Expression::Binary(binary) => {
            assert!(matches!(binary.node.op.node, beskid_analysis::syntax::BinaryOp::Add));
            assert_expression_integer(&binary.node.left, "1");
            match &binary.node.right.node {
                Expression::Binary(right_binary) => {
                    assert!(matches!(
                        right_binary.node.op.node,
                        beskid_analysis::syntax::BinaryOp::Mul
                    ));
                    assert_expression_integer(&right_binary.node.left, "2");
                    assert_expression_integer(&right_binary.node.right, "3");
                }
                _ => panic!("expected nested binary expression"),
            }
        }
        _ => panic!("expected binary expression"),
    }
}

#[test]
fn parses_identifier_and_literal_patterns_ast() {
    let expr = parse_expression_ast("match x { value => value, 1 => 2, }");
    match &expr.node {
        Expression::Match(match_expr) => {
            assert_eq!(match_expr.node.arms.len(), 2);
            let first = &match_expr.node.arms[0];
            match &first.node.pattern.node {
                Pattern::Identifier(identifier) => {
                    assert_eq!(identifier.node.name, "value");
                }
                _ => panic!("expected identifier pattern"),
            }
            assert_expression_path_segments(&first.node.value, &["value"]);

            let second = &match_expr.node.arms[1];
            match &second.node.pattern.node {
                Pattern::Literal(literal) => assert_literal_integer(&literal.node, "1"),
                _ => panic!("expected literal pattern"),
            }
            assert_expression_integer(&second.node.value, "2");
        }
        _ => panic!("expected match expression"),
    }
}

#[test]
fn parses_enum_pattern_items_ast() {
    let expr = parse_expression_ast("match x { Foo::Bar(1, _) => 1, }");
    match &expr.node {
        Expression::Match(match_expr) => {
            assert_eq!(match_expr.node.arms.len(), 1);
            let arm = &match_expr.node.arms[0];
            match &arm.node.pattern.node {
                Pattern::Enum(pattern) => {
                    assert_eq!(pattern.node.items.len(), 2);
                    match &pattern.node.items[0].node {
                        Pattern::Literal(literal) => {
                            assert_literal_integer(&literal.node, "1");
                        }
                        _ => panic!("expected literal pattern"),
                    }
                    assert!(matches!(pattern.node.items[1].node, Pattern::Wildcard));
                }
                _ => panic!("expected enum pattern"),
            }
            assert_expression_integer(&arm.node.value, "1");
        }
        _ => panic!("expected match expression"),
    }
}

#[test]
fn parses_path_expression_ast() {
    let expr = parse_expression_ast("foo.bar");
    match &expr.node {
        Expression::Path(path) => {
            assert_path_segments(&path.node.path, &["foo", "bar"]);
        }
        _ => panic!("expected path expression"),
    }
}

#[test]
fn parses_struct_literal_expression_ast() {
    let expr = parse_expression_ast("User { name: \"Ada\", age: 42 }");
    match &expr.node {
        Expression::StructLiteral(literal) => {
            assert_path_segments(&literal.node.path, &["User"]);
            assert_eq!(literal.node.fields.len(), 2);
            assert_eq!(literal.node.fields[0].node.name.node.name, "name");
            match &literal.node.fields[0].node.value.node {
                Expression::Literal(value) => match &value.node.literal.node {
                    Literal::String(text) => assert_eq!(text, "\"Ada\""),
                    _ => panic!("expected string literal"),
                },
                _ => panic!("expected literal expression"),
            }
            assert_eq!(literal.node.fields[1].node.name.node.name, "age");
            assert_expression_integer(&literal.node.fields[1].node.value, "42");
        }
        _ => panic!("expected struct literal"),
    }
}

#[test]
fn parses_enum_constructor_expression_ast() {
    let expr = parse_expression_ast("Option::Some(1)");
    match &expr.node {
        Expression::EnumConstructor(constructor) => {
            assert_eq!(constructor.node.path.node.type_name.node.name, "Option");
            assert_eq!(constructor.node.path.node.variant.node.name, "Some");
            assert_eq!(constructor.node.args.len(), 1);
            assert_expression_integer(&constructor.node.args[0], "1");
        }
        _ => panic!("expected enum constructor"),
    }
}

#[test]
fn parses_enum_constructor_without_args_ast() {
    let expr = parse_expression_ast("Option::None()");
    match &expr.node {
        Expression::EnumConstructor(constructor) => {
            assert_eq!(constructor.node.path.node.type_name.node.name, "Option");
            assert_eq!(constructor.node.path.node.variant.node.name, "None");
            assert!(constructor.node.args.is_empty());
        }
        _ => panic!("expected enum constructor"),
    }
}

#[test]
fn parses_match_expression_ast() {
    let expr = parse_expression_ast("match x { Foo::Bar when x > 0 => 1, _ => 0, }");
    match &expr.node {
        Expression::Match(match_expr) => {
            assert_eq!(match_expr.node.arms.len(), 2);
            assert!(matches!(match_expr.node.scrutinee.node, Expression::Path(_)));
            let first = &match_expr.node.arms[0];
            match &first.node.pattern.node {
                Pattern::Enum(pattern) => {
                    assert_eq!(pattern.node.path.node.type_name.node.name, "Foo");
                    assert_eq!(pattern.node.path.node.variant.node.name, "Bar");
                }
                _ => panic!("expected enum pattern"),
            }
            match first.node.guard.as_ref() {
                Some(guard) => match &guard.node {
                    Expression::Binary(binary) => {
                        assert!(matches!(binary.node.op.node, beskid_analysis::syntax::BinaryOp::Gt));
                        assert_expression_path_segments(&binary.node.left, &["x"]);
                        assert_expression_integer(&binary.node.right, "0");
                    }
                    _ => panic!("expected binary guard expression"),
                },
                None => panic!("expected match guard"),
            }
            assert_expression_integer(&first.node.value, "1");

            let second = &match_expr.node.arms[1];
            assert!(matches!(second.node.pattern.node, Pattern::Wildcard));
            assert!(second.node.guard.is_none());
            assert_expression_integer(&second.node.value, "0");
        }
        _ => panic!("expected match expression"),
    }
}

#[test]
fn parses_literal_expression_ast() {
    let expr = parse_expression_ast("42");
    match &expr.node {
        Expression::Literal(literal) => {
            assert_literal_integer(&literal.node.literal.node, "42");
        }
        _ => panic!("expected literal expression"),
    }
}

#[test]
fn parses_literal_variants_ast() {
    let float_expr = parse_expression_ast("3.14");
    match &float_expr.node {
        Expression::Literal(literal) => {
            assert_literal_float(&literal.node.literal.node, "3.14");
        }
        _ => panic!("expected float literal"),
    }

    let string_expr = parse_expression_ast("\"hello\"");
    match &string_expr.node {
        Expression::Literal(literal) => {
            assert_literal_string(&literal.node.literal.node, "\"hello\"");
        }
        _ => panic!("expected string literal"),
    }

    let char_expr = parse_expression_ast("'a'");
    match &char_expr.node {
        Expression::Literal(literal) => {
            assert_literal_char(&literal.node.literal.node, "'a'");
        }
        _ => panic!("expected char literal"),
    }

    let bool_expr = parse_expression_ast("true");
    match &bool_expr.node {
        Expression::Literal(literal) => {
            assert_literal_bool(&literal.node.literal.node, true);
        }
        _ => panic!("expected bool literal"),
    }
}

#[test]
fn parses_assign_expression_ast() {
    let expr = parse_expression_ast("x = 1");
    match &expr.node {
        Expression::Assign(assign) => {
            match &assign.node.target.node {
                Expression::Path(path) => assert_path_segments(&path.node.path, &["x"]),
                _ => panic!("expected path expression"),
            }
            assert_expression_integer(&assign.node.value, "1");
        }
        _ => panic!("expected assign expression"),
    }
}

#[test]
fn parses_unary_expression_ast() {
    let expr = parse_expression_ast("-1");
    match &expr.node {
        Expression::Unary(unary) => {
            assert!(matches!(unary.node.op.node, beskid_analysis::syntax::UnaryOp::Neg));
            assert_expression_integer(&unary.node.expr, "1");
        }
        _ => panic!("expected unary expression"),
    }
}

#[test]
fn parses_call_expression_ast() {
    let expr = parse_expression_ast("foo(1, 2)");
    match &expr.node {
        Expression::Call(call) => {
            assert_eq!(call.node.args.len(), 2);
            match &call.node.callee.node {
                Expression::Path(path) => assert_path_segments(&path.node.path, &["foo"]),
                _ => panic!("expected path expression"),
            }
            assert_expression_integer(&call.node.args[0], "1");
            assert_expression_integer(&call.node.args[1], "2");
        }
        _ => panic!("expected call expression"),
    }
}

#[test]
fn parses_member_access_after_call_ast() {
    let expr = parse_expression_ast("foo().bar");
    match &expr.node {
        Expression::Member(member) => {
            assert_eq!(member.node.member.node.name, "bar");
            match &member.node.target.node {
                Expression::Call(call) => {
                    match &call.node.callee.node {
                        Expression::Path(path) => assert_path_segments(&path.node.path, &["foo"]),
                        _ => panic!("expected path expression"),
                    }
                    assert!(call.node.args.is_empty());
                }
                _ => panic!("expected call expression"),
            }
        }
        _ => panic!("expected member expression"),
    }
}

#[test]
fn parses_member_expression_ast() {
    let expr = parse_expression_ast("foo.bar");
    match &expr.node {
        Expression::Path(path) => {
            assert_path_segments(&path.node.path, &["foo", "bar"]);
        }
        _ => panic!("expected path expression"),
    }
}

#[test]
fn parses_grouped_expression_ast() {
    let expr = parse_expression_ast("(1)");
    match &expr.node {
        Expression::Grouped(grouped) => {
            assert_expression_integer(&grouped.node.expr, "1");
        }
        _ => panic!("expected grouped expression"),
    }
}

#[test]
fn parses_block_expression_ast() {
    let expr = parse_expression_ast("{ return 1; }");
    match &expr.node {
        Expression::Block(block_expr) => {
            assert_eq!(block_expr.node.block.node.statements.len(), 1);
            match &block_expr.node.block.node.statements[0].node {
                beskid_analysis::syntax::Statement::Return(ret) => {
                    let value = ret.node.value.as_ref().expect("return value");
                    assert_expression_integer(value, "1");
                }
                _ => panic!("expected return statement"),
            }
        }
        _ => panic!("expected block expression"),
    }
}
