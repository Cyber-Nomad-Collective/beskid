use beskid_analysis::Rule;
use beskid_analysis::parsing::parsable::Parsable;
use beskid_analysis::syntax::{EnumPath, PrimitiveType, Type};

use crate::parsing::util::parse_pair;
use crate::syntax::util::{
    assert_path_segments, assert_type_complex_path, assert_type_primitive, parse_path_ast,
    parse_type_ast,
};

#[test]
fn parses_primitive_type_ast() {
    let ty = parse_type_ast("i32");
    assert_type_primitive(&ty, PrimitiveType::I32);
}

#[test]
fn parses_array_type_ast() {
    let ty = parse_type_ast("i32[]");
    match &ty.node {
        Type::Array(inner) => assert_type_primitive(inner, PrimitiveType::I32),
        _ => panic!("expected array type"),
    }
}

#[test]
fn parses_ref_type_ast() {
    let ty = parse_type_ast("ref string");
    match &ty.node {
        Type::Ref(inner) => assert_type_primitive(inner, PrimitiveType::String),
        _ => panic!("expected ref type"),
    }
}

#[test]
fn parses_path_type_ast() {
    let ty = parse_type_ast("User");
    assert_type_complex_path(&ty, &["User"]);
}

#[test]
fn parses_array_of_complex_type_ast() {
    let ty = parse_type_ast("User[]");
    match &ty.node {
        Type::Array(inner) => assert_type_complex_path(inner, &["User"]),
        _ => panic!("expected array type"),
    }
}

#[test]
fn parses_ref_of_complex_type_ast() {
    let ty = parse_type_ast("ref User");
    match &ty.node {
        Type::Ref(inner) => assert_type_complex_path(inner, &["User"]),
        _ => panic!("expected ref type"),
    }
}

#[test]
fn parses_enum_path_ast() {
    let pair = parse_pair(Rule::EnumPath, "Option::Some");
    let enum_path = EnumPath::parse(pair).expect("expected enum path");
    assert_eq!(enum_path.node.type_name.node.name, "Option");
    assert_eq!(enum_path.node.variant.node.name, "Some");
}

#[test]
fn parses_path_ast() {
    let path = parse_path_ast("net.http.Client");
    assert_path_segments(&path, &["net", "http", "Client"]);
}
