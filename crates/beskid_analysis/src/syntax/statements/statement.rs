use pest::iterators::Pair;

use crate::parser::Rule;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::syntax::{
    BreakStatement, ContinueStatement, ExpressionStatement, ForStatement, IfStatement,
    LetStatement, ReturnStatement, SpanInfo, Spanned, WhileStatement,
};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub enum Statement {
    #[ast(child)]
    Let(Spanned<LetStatement>),
    #[ast(child)]
    Return(Spanned<ReturnStatement>),
    #[ast(child)]
    Break(Spanned<BreakStatement>),
    #[ast(child)]
    Continue(Spanned<ContinueStatement>),
    #[ast(child)]
    While(Spanned<WhileStatement>),
    #[ast(child)]
    For(Spanned<ForStatement>),
    #[ast(child)]
    If(Spanned<IfStatement>),
    #[ast(child)]
    Expression(Spanned<ExpressionStatement>),
}

impl Parsable for Statement {
    fn parse(pair: Pair<Rule>) -> Result<Spanned<Self>, ParseError> {
        parse_statement(pair)
    }
}

fn parse_statement(pair: Pair<Rule>) -> Result<Spanned<Statement>, ParseError> {
    let span = SpanInfo::from_span(&pair.as_span());

    match pair.as_rule() {
        Rule::Statement => {
            let inner = pair
                .into_inner()
                .next()
                .ok_or(ParseError::missing(Rule::Statement))?;
            parse_statement(inner)
        }
        Rule::LetStatement => {
            let statement = LetStatement::parse(pair)?;
            Ok(Spanned::new(Statement::Let(statement), span))
        }
        Rule::ReturnStatement => {
            let statement = ReturnStatement::parse(pair)?;
            Ok(Spanned::new(Statement::Return(statement), span))
        }
        Rule::BreakStatement => {
            let statement = BreakStatement::parse(pair)?;
            Ok(Spanned::new(Statement::Break(statement), span))
        }
        Rule::ContinueStatement => {
            let statement = ContinueStatement::parse(pair)?;
            Ok(Spanned::new(Statement::Continue(statement), span))
        }
        Rule::WhileStatement => {
            let statement = WhileStatement::parse(pair)?;
            Ok(Spanned::new(Statement::While(statement), span))
        }
        Rule::ForStatement => {
            let statement = ForStatement::parse(pair)?;
            Ok(Spanned::new(Statement::For(statement), span))
        }
        Rule::IfStatement => {
            let statement = IfStatement::parse(pair)?;
            Ok(Spanned::new(Statement::If(statement), span))
        }
        Rule::ExpressionStatement => {
            let statement = ExpressionStatement::parse(pair)?;
            Ok(Spanned::new(Statement::Expression(statement), span))
        }
        _ => Err(ParseError::unexpected_rule(pair, Some(Rule::Statement))),
    }
}
