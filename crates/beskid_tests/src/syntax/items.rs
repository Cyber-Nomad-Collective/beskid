use beskid_analysis::syntax::{ContractNode, EnumVariant, Node, Type, Visibility};

use crate::syntax::util::{
    assert_expression_path_segments, assert_path_segments, assert_type_complex_path,
    assert_type_primitive, parse_node_ast, parse_program_ast,
};

#[test]
fn parses_function_definition_ast() {
    let program = parse_program_ast("i32 add(a: i32, b: i32) { return a + b; }");
    assert_eq!(program.node.items.len(), 1);
    let node = &program.node.items[0];

    match &node.node {
        Node::Function(function) => {
            assert_eq!(function.node.visibility.node, Visibility::Private);
            assert_eq!(function.node.name.node.name, "add");
            assert_eq!(function.node.parameters.len(), 2);
            assert_eq!(function.node.parameters[0].node.name.node.name, "a");
            assert_eq!(function.node.parameters[1].node.name.node.name, "b");
            assert!(matches!(
                function.node.parameters[0].node.ty.node,
                Type::Primitive(_)
            ));
            assert!(matches!(
                function.node.parameters[1].node.ty.node,
                Type::Primitive(_)
            ));
            assert!(matches!(
                function.node.return_type.as_ref().map(|ty| &ty.node),
                Some(Type::Primitive(_))
            ));
            assert_eq!(function.node.body.node.statements.len(), 1);
            match &function.node.body.node.statements[0].node {
                beskid_analysis::syntax::Statement::Return(ret) => {
                    let value = ret.node.value.as_ref().expect("return value");
                    match &value.node {
                        beskid_analysis::syntax::Expression::Binary(binary) => {
                            assert_expression_path_segments(&binary.node.left, &["a"]);
                            assert_expression_path_segments(&binary.node.right, &["b"]);
                        }
                        _ => panic!("expected binary expression"),
                    }
                }
                _ => panic!("expected return statement"),
            }
        }
        _ => panic!("expected function definition"),
    }
}

#[test]
fn parses_function_with_out_parameter_modifier_ast() {
    let node = parse_node_ast("i32 write(out value: i32) { return value; }");
    match &node.node {
        Node::Function(function) => {
            assert_eq!(function.node.parameters.len(), 1);
            let param = &function.node.parameters[0].node;
            assert!(matches!(
                param.modifier.as_ref().map(|m| m.node),
                Some(beskid_analysis::syntax::ParameterModifier::Out)
            ));
            assert_eq!(param.name.node.name, "value");
            assert_type_primitive(&param.ty, beskid_analysis::syntax::PrimitiveType::I32);
        }
        _ => panic!("expected function definition"),
    }
}

#[test]
fn parses_function_with_parameter_modifier_ast() {
    let node = parse_node_ast("i32 update(ref value: i32) { return value; }");
    match &node.node {
        Node::Function(function) => {
            assert_eq!(function.node.parameters.len(), 1);
            let param = &function.node.parameters[0].node;
            assert!(matches!(
                param.modifier.as_ref().map(|m| m.node),
                Some(beskid_analysis::syntax::ParameterModifier::Ref)
            ));
            assert_eq!(param.name.node.name, "value");
            assert_type_primitive(&param.ty, beskid_analysis::syntax::PrimitiveType::I32);
        }
        _ => panic!("expected function definition"),
    }
}

#[test]
fn parses_method_definition_ast() {
    let node = parse_node_ast("i32 Point.len(self: Point) { return 0; }");

    match &node.node {
        Node::Method(method) => {
            assert_eq!(method.node.visibility.node, Visibility::Private);
            assert_eq!(method.node.name.node.name, "len");
            assert_eq!(method.node.parameters.len(), 1);
            assert_eq!(method.node.parameters[0].node.name.node.name, "self");
            assert!(method.node.parameters[0].node.modifier.is_none());
            assert_type_complex_path(&method.node.receiver_type, &["Point"]);
            assert_type_complex_path(&method.node.parameters[0].node.ty, &["Point"]);
            let return_type = method.node.return_type.as_ref().expect("return type");
            assert_type_primitive(return_type, beskid_analysis::syntax::PrimitiveType::I32);
        }
        _ => panic!("expected method definition"),
    }
}

#[test]
fn parses_method_with_primitive_receiver_ast() {
    let node = parse_node_ast("i32 i32.zero() { return 0; }");
    match &node.node {
        Node::Method(method) => {
            assert_type_primitive(
                &method.node.receiver_type,
                beskid_analysis::syntax::PrimitiveType::I32,
            );
            assert_eq!(method.node.name.node.name, "zero");
        }
        _ => panic!("expected method definition"),
    }
}

#[test]
fn parses_type_definition_ast() {
    let node = parse_node_ast("pub type User { string name, i32 age }");

    match &node.node {
        Node::TypeDefinition(ty) => {
            assert_eq!(ty.node.visibility.node, Visibility::Public);
            assert_eq!(ty.node.name.node.name, "User");
            assert_eq!(ty.node.fields.len(), 2);
            assert_eq!(ty.node.fields[0].node.name.node.name, "name");
            assert_eq!(ty.node.fields[1].node.name.node.name, "age");
            assert_type_primitive(
                &ty.node.fields[0].node.ty,
                beskid_analysis::syntax::PrimitiveType::String,
            );
            assert_type_primitive(
                &ty.node.fields[1].node.ty,
                beskid_analysis::syntax::PrimitiveType::I32,
            );
        }
        _ => panic!("expected type definition"),
    }
}

#[test]
fn parses_enum_definition_ast() {
    let node = parse_node_ast("enum Option<T> { Some(T value), None }");

    match &node.node {
        Node::EnumDefinition(enum_def) => {
            assert_eq!(enum_def.node.name.node.name, "Option");
            assert_eq!(enum_def.node.generics.len(), 1);
            assert_eq!(enum_def.node.variants.len(), 2);
            assert_enum_variant(&enum_def.node.variants[0], "Some", 1);
            assert_enum_variant(&enum_def.node.variants[1], "None", 0);
            assert_eq!(enum_def.node.generics[0].node.name, "T");
        }
        _ => panic!("expected enum definition"),
    }
}

#[test]
fn parses_contract_definition_ast() {
    let node = parse_node_ast("contract Reader { i32 read(p: u8[]); Writer; }");

    match &node.node {
        Node::ContractDefinition(contract) => {
            assert_eq!(contract.node.name.node.name, "Reader");
            assert_eq!(contract.node.items.len(), 2);
            match &contract.node.items[0].node {
                ContractNode::MethodSignature(signature) => {
                    assert_eq!(signature.node.name.node.name, "read");
                    assert_eq!(signature.node.parameters.len(), 1);
                    assert!(signature.node.return_type.is_some());
                    assert_eq!(signature.node.parameters[0].node.name.node.name, "p");
                    match &signature.node.parameters[0].node.ty.node {
                        Type::Array(inner) => {
                            assert_type_primitive(
                                inner,
                                beskid_analysis::syntax::PrimitiveType::U8,
                            );
                        }
                        _ => panic!("expected array type"),
                    }
                }
                _ => panic!("expected contract method signature"),
            }
            match &contract.node.items[1].node {
                ContractNode::Embedding(embedding) => {
                    assert_eq!(embedding.node.name.node.name, "Writer");
                }
                _ => panic!("expected contract embedding"),
            }
        }
        _ => panic!("expected contract definition"),
    }
}

#[test]
fn parses_module_and_use_declarations() {
    let program = parse_program_ast("pub mod net.http; pub use net.http.Client;");
    assert_eq!(program.node.items.len(), 2);
    match &program.node.items[0].node {
        Node::ModuleDeclaration(module) => {
            assert_eq!(module.node.visibility.node, Visibility::Public);
            assert_path_segments(&module.node.path, &["net", "http"])
        }
        _ => panic!("expected module declaration"),
    }
    match &program.node.items[1].node {
        Node::UseDeclaration(use_decl) => {
            assert_eq!(use_decl.node.visibility.node, Visibility::Public);
            assert_path_segments(&use_decl.node.path, &["net", "http", "Client"])
        }
        _ => panic!("expected use declaration"),
    }
}

fn assert_enum_variant(
    variant: &beskid_analysis::syntax::Spanned<EnumVariant>,
    name: &str,
    fields_len: usize,
) {
    assert_eq!(variant.node.name.node.name, name);
    assert_eq!(variant.node.fields.len(), fields_len);
    if fields_len > 0 {
        assert_type_complex_path(&variant.node.fields[0].node.ty, &["T"]);
    }
}
