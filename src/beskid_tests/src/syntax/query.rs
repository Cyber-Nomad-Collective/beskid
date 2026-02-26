use beskid_analysis::syntax::*;
use beskid_analysis::query::*;
use crate::syntax::util::parse_program_ast;

#[test]
fn test_query_descendants_count() {
    let input = "
        unit main() {
            let x = 1;
            let y = 2;
            return x + y;
        }
    ";
    let program = parse_program_ast(input);
    let query = Query::from(&program.node);
    
    // Program -> Node -> FunctionDefinition -> Visibility, Identifier, Block -> Statement (Let) -> ...
    let count = query.descendants().count();
    assert!(count > 10, "Expected many nodes in descendants, got {}", count);
}

#[test]
fn test_query_of_type() {
    let input = "
        unit main() {
            let x = 1;
            let y = 2;
        }
        unit other() {}
    ";
    let program = parse_program_ast(input);
    let query = Query::from(&program.node);
    
    let functions: Vec<&FunctionDefinition> = query.of::<FunctionDefinition>().collect();
    assert_eq!(functions.len(), 2);
    assert_eq!(functions[0].name.node.name, "main");
    assert_eq!(functions[1].name.node.name, "other");
}

#[test]
fn test_query_filter_typed() {
    let input = "
        unit main() {
            let x = 1;
            i32 mut y = 2;
        }
    ";
    let program = parse_program_ast(input);
    let query = Query::from(&program.node);
    
    let mutable_lets: Vec<&LetStatement> = query.filter_typed::<LetStatement>(|l| l.mutable).collect();
    assert_eq!(mutable_lets.len(), 1);
    assert_eq!(mutable_lets[0].name.node.name, "y");
}

#[test]
fn test_query_find_first() {
    let input = "
        unit main() {
            let x = 42;
        }
    ";
    let program = parse_program_ast(input);
    let query = Query::from(&program.node);
    
    let first_ident = query.find_first::<Identifier>().expect("Expected at least one identifier");
    assert_eq!(first_ident.name, "main");
}

#[test]
fn test_query_binary_expressions() {
    let input = "
        unit test() {
            let x = 1 + 2 * 3;
        }
    ";
    let program = parse_program_ast(input);
    let query = Query::from(&program.node);
    
    let bin_exprs: Vec<&BinaryExpression> = query.of::<BinaryExpression>().collect();
    // 1 + (2 * 3) -> 2 binary expressions
    assert_eq!(bin_exprs.len(), 2);
}

#[test]
fn test_node_kind() {
    let input = "unit main() {}";
    let program = parse_program_ast(input);
    let query = Query::from(&program.node);
    
    let func = query.find_first::<FunctionDefinition>().unwrap();
    assert_eq!(func.node_kind(), NodeKind::FunctionDefinition);
    
    let ident = query.find_first::<Identifier>().unwrap();
    assert_eq!(ident.node_kind(), NodeKind::Identifier);
}

#[test]
fn test_complex_traversal() {
    let input = "
        contract MyContract {
            i32 method(x: i32);
        }
        unit main() {
            i32 x = 1;
        }
    ";
    let program = parse_program_ast(input);
    let query = Query::from(&program.node);
    
    // Find all i32 types
    let i32_types: Vec<&PrimitiveType> = query.filter_typed::<PrimitiveType>(|t| matches!(t, PrimitiveType::I32)).collect();
    // 1 in method param, 1 in method return, 1 in main let annotation
    assert_eq!(i32_types.len(), 3);
}

#[test]
fn test_ast_walker() {
    let input = "
        unit main() {
            let x = 1;
            if x > 0 {
                return 42;
            }
        }
    ";
    let program = parse_program_ast(input);
    
    use std::cell::RefCell;
    use std::rc::Rc;

    struct IdentCollector {
        names: Rc<RefCell<Vec<String>>>,
    }
    impl Visit for IdentCollector {
        fn enter(&mut self, node: NodeRef) {
            if let Some(ident) = node.of::<Identifier>() {
                self.names.borrow_mut().push(ident.name.clone());
            }
        }
    }
    
    let names = Rc::new(RefCell::new(Vec::new()));
    let collector = IdentCollector { names: names.clone() };
    let mut walker = AstWalker::new().with_visitor(Box::new(collector));
    walker.walk(NodeRef::from(&program.node));
    
    let names = names.borrow();
    assert!(names.contains(&"main".to_string()));
    assert!(names.contains(&"x".to_string()));
}
