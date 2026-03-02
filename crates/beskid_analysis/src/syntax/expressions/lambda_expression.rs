use pest::iterators::Pair;

use crate::parser::Rule;
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::syntax::{Expression, Identifier, SpanInfo, Spanned, Type};

use beskid_ast_derive::AstNode;

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct LambdaParameter {
    #[ast(child)]
    pub name: Spanned<Identifier>,
    #[ast(child)]
    pub ty: Option<Spanned<Type>>,
}

#[derive(AstNode, Debug, Clone, PartialEq, Eq)]
pub struct LambdaExpression {
    #[ast(children)]
    pub parameters: Vec<Spanned<LambdaParameter>>,
    #[ast(child)]
    pub body: Box<Spanned<Expression>>,
}

pub(crate) fn parse_lambda_expression(pair: Pair<Rule>) -> Result<Spanned<Expression>, ParseError> {
    if pair.as_rule() != Rule::LambdaExpression {
        return Err(ParseError::unexpected_rule(
            pair,
            Some(Rule::LambdaExpression),
        ));
    }

    let span = SpanInfo::from_span(&pair.as_span());
    let mut inner = pair.into_inner();
    let parameters_pair = inner
        .next()
        .ok_or(ParseError::missing(Rule::LambdaParameters))?;
    let body_pair = inner.next().ok_or(ParseError::missing(Rule::LambdaBody))?;

    let parameters = parse_lambda_parameters(parameters_pair)?;
    let body = parse_lambda_body(body_pair)?;

    let lambda = Spanned::new(
        LambdaExpression {
            parameters,
            body: Box::new(body),
        },
        span,
    );

    Ok(Spanned::new(Expression::Lambda(lambda), span))
}

fn parse_lambda_parameters(pair: Pair<Rule>) -> Result<Vec<Spanned<LambdaParameter>>, ParseError> {
    if pair.as_rule() != Rule::LambdaParameters {
        return Err(ParseError::unexpected_rule(
            pair,
            Some(Rule::LambdaParameters),
        ));
    }

    let mut inner = pair.into_inner();
    let Some(first) = inner.next() else {
        return Ok(Vec::new());
    };

    match first.as_rule() {
        Rule::Identifier => {
            let name = Identifier::parse(first)?;
            let span = name.span;
            Ok(vec![Spanned::new(LambdaParameter { name, ty: None }, span)])
        }
        Rule::LambdaParameterList => first.into_inner().map(parse_lambda_parameter).collect(),
        _ => Err(ParseError::unexpected_rule(
            first,
            Some(Rule::LambdaParameters),
        )),
    }
}

fn parse_lambda_parameter(pair: Pair<Rule>) -> Result<Spanned<LambdaParameter>, ParseError> {
    if pair.as_rule() != Rule::LambdaParameter {
        return Err(ParseError::unexpected_rule(
            pair,
            Some(Rule::LambdaParameter),
        ));
    }

    let span = SpanInfo::from_span(&pair.as_span());
    let mut inner = pair.into_inner();

    let name = Identifier::parse(inner.next().ok_or(ParseError::missing(Rule::Identifier))?)?;
    let ty = inner.next().map(parse_type_annotation).transpose()?;

    Ok(Spanned::new(LambdaParameter { name, ty }, span))
}

fn parse_type_annotation(pair: Pair<Rule>) -> Result<Spanned<Type>, ParseError> {
    if pair.as_rule() != Rule::TypeAnnotation {
        return Err(ParseError::unexpected_rule(
            pair,
            Some(Rule::TypeAnnotation),
        ));
    }

    let mut inner = pair.into_inner();
    let ty_pair = inner.next().ok_or(ParseError::missing(Rule::BeskidType))?;
    Type::parse(ty_pair)
}

fn parse_lambda_body(pair: Pair<Rule>) -> Result<Spanned<Expression>, ParseError> {
    if pair.as_rule() != Rule::LambdaBody {
        return Err(ParseError::unexpected_rule(pair, Some(Rule::LambdaBody)));
    }

    let inner = pair
        .into_inner()
        .next()
        .ok_or(ParseError::missing(Rule::Expression))?;
    Expression::parse(inner)
}
