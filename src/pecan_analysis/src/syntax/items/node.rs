use pest::iterators::Pair;

use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::parser::Rule;
use crate::syntax::items::InlineModule;
use crate::syntax::{
    ContractDefinition, EnumDefinition, FunctionDefinition, MethodDefinition, ModuleDeclaration,
    SpanInfo, Spanned, TypeDefinition, UseDeclaration,
};

use pecan_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub enum Node {
    #[ast(child)]
    Function(Spanned<FunctionDefinition>),
    #[ast(child)]
    Method(Spanned<MethodDefinition>),
    #[ast(child)]
    TypeDefinition(Spanned<TypeDefinition>),
    #[ast(child)]
    EnumDefinition(Spanned<EnumDefinition>),
    #[ast(child)]
    ContractDefinition(Spanned<ContractDefinition>),
    #[ast(child)]
    ModuleDeclaration(Spanned<ModuleDeclaration>),
    #[ast(child)]
    InlineModule(Spanned<InlineModule>),
    #[ast(child)]
    UseDeclaration(Spanned<UseDeclaration>),
}

impl Parsable for Node {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        parse_node(pair)
    }
}

fn parse_node(pair: Pair<Rule>) -> Result<Spanned<Node>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());

    match pair.as_rule() {
        Rule::Item => {
            let inner = pair
                .into_inner()
                .next()
                .ok_or(ParseError::missing(Rule::Item))?;
            parse_node(inner)
        }
        Rule::FunctionDefinition => {
            let node = FunctionDefinition::parse(pair)?;
            Ok(Spanned::new(Node::Function(node), span))
        }
        Rule::MethodDefinition => {
            let node = MethodDefinition::parse(pair)?;
            Ok(Spanned::new(Node::Method(node), span))
        }
        Rule::TypeDefinition => {
            let node = TypeDefinition::parse(pair)?;
            Ok(Spanned::new(Node::TypeDefinition(node), span))
        }
        Rule::EnumDefinition => {
            let node = EnumDefinition::parse(pair)?;
            Ok(Spanned::new(Node::EnumDefinition(node), span))
        }
        Rule::ContractDefinition => {
            let node = ContractDefinition::parse(pair)?;
            Ok(Spanned::new(Node::ContractDefinition(node), span))
        }
        Rule::ModuleDeclaration => {
            let node = ModuleDeclaration::parse(pair)?;
            Ok(Spanned::new(Node::ModuleDeclaration(node), span))
        }
        Rule::InlineModule => {
            let node = InlineModule::parse(pair)?;
            Ok(Spanned::new(Node::InlineModule(node), span))
        }
        Rule::UseDeclaration => {
            let node = UseDeclaration::parse(pair)?;
            Ok(Spanned::new(Node::UseDeclaration(node), span))
        }
        _ => Err(ParseError::unexpected_rule(pair, Some(Rule::Item))),
    }
}
