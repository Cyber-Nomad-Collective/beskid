use beskid_analysis::parsing::parsable::Parsable;
use beskid_analysis::syntax::{
    Expression, Literal, Node, Path, PrimitiveType, Program, Spanned, Statement, Type,
};
use beskid_analysis::Rule;

use crate::parsing::util::parse_pair;

pub fn parse_program_ast(input: &str) -> Spanned<Program> {
    let pair = parse_pair(Rule::Program, input);
    Program::parse(pair).expect("expected program AST")
}

pub fn parse_node_ast(input: &str) -> Spanned<Node> {
    let pair = parse_pair(Rule::Item, input);
    Node::parse(pair).expect("expected node AST")
}

pub fn parse_expression_ast(input: &str) -> Spanned<Expression> {
    let pair = parse_pair(Rule::Expression, input);
    Expression::parse(pair).expect("expected expression AST")
}

pub fn parse_statement_ast(rule: Rule, input: &str) -> Spanned<Statement> {
    let pair = parse_pair(rule, input);
    Statement::parse(pair).expect("expected statement AST")
}

pub fn parse_type_ast(input: &str) -> Spanned<Type> {
    let pair = parse_pair(Rule::BeskidType, input);
    Type::parse(pair).expect("expected type AST")
}

pub fn parse_path_ast(input: &str) -> Spanned<Path> {
    let pair = parse_pair(Rule::Path, input);
    Path::parse(pair).expect("expected path AST")
}

pub fn assert_path_segments(path: &Spanned<Path>, expected: &[&str]) {
    assert_eq!(path.node.segments.len(), expected.len());
    for (segment, expected_name) in path.node.segments.iter().zip(expected.iter()) {
        assert_eq!(segment.node.name.node.name.as_str(), *expected_name);
    }
}

pub fn assert_literal_integer(literal: &Literal, expected: &str) {
    match literal {
        Literal::Integer(value) => assert_eq!(value, expected),
        _ => panic!("expected integer literal"),
    }
}

pub fn assert_literal_float(literal: &Literal, expected: &str) {
    match literal {
        Literal::Float(value) => assert_eq!(value, expected),
        _ => panic!("expected float literal"),
    }
}

pub fn assert_literal_string(literal: &Literal, expected: &str) {
    match literal {
        Literal::String(value) => assert_eq!(value, expected),
        _ => panic!("expected string literal"),
    }
}

pub fn assert_literal_char(literal: &Literal, expected: &str) {
    match literal {
        Literal::Char(value) => assert_eq!(value, expected),
        _ => panic!("expected char literal"),
    }
}

pub fn assert_literal_bool(literal: &Literal, expected: bool) {
    match literal {
        Literal::Bool(value) => assert_eq!(*value, expected),
        _ => panic!("expected bool literal"),
    }
}

pub fn assert_expression_integer(expr: &Spanned<Expression>, expected: &str) {
    match &expr.node {
        Expression::Literal(literal) => assert_literal_integer(&literal.node.literal.node, expected),
        _ => panic!("expected literal expression"),
    }
}

pub fn assert_expression_path_segments(expr: &Spanned<Expression>, expected: &[&str]) {
    match &expr.node {
        Expression::Path(path) => assert_path_segments(&path.node.path, expected),
        _ => panic!("expected path expression"),
    }
}

pub fn assert_type_primitive(ty: &Spanned<Type>, expected: PrimitiveType) {
    match &ty.node {
        Type::Primitive(primitive) => assert!(matches!(primitive.node, value if value == expected)),
        _ => panic!("expected primitive type"),
    }
}

pub fn assert_type_complex_path(ty: &Spanned<Type>, expected: &[&str]) {
    match &ty.node {
        Type::Complex(path) => assert_path_segments(path, expected),
        _ => panic!("expected complex type"),
    }
}
