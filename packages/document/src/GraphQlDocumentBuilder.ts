import assertNever from 'assert-never';
import type * as ast from 'graphql/language/ast';
import * as gt from 'graphql/type';
import {throwGraphQlError} from './errors';
import GraphQlDocument from './GraphQlDocument';
import {isValidDirectiveLocation} from './type-guards';
import type * as types from './types';

export default class GraphQlDocumentBuilder {
  private readonly _source: types.LocationSource;

  constructor(source: types.LocationSource) {
    this._source = source;
  }

  public fromDocumentNode(
    node: ast.DocumentNode,
    referencedDocuments: readonly GraphQlDocument[],
  ): GraphQlDocument {
    return new GraphQlDocument(
      {
        kind: 'Document',
        loc: this._fromLocation(node.loc),
        definitions: node.definitions.map((d) => this._fromDefinitionNode(d)),
      },
      referencedDocuments,
    );
  }

  public fromGraphQlSchema(
    schema: gt.GraphQLSchema,
    referencedDocuments: readonly GraphQlDocument[],
  ): GraphQlDocument {
    schema.getTypeMap();
    return new GraphQlDocument(
      {
        kind: 'Document',
        loc: this._source,
        definitions: [
          ...schema.getDirectives().map((d) => this._fromGraphQlDirective(d)),
          ...Object.values(schema.getTypeMap()).map((t) =>
            this._fromGraphQlNamedType(t),
          ),
        ],
      },
      referencedDocuments,
    );
  }

  private _fromLocation(loc: ast.Location | undefined): types.Location {
    return loc
      ? {
          kind: 'LocationRange',
          start: loc.start,
          end: loc.end,
          source: this._source,
        }
      : this._source;
  }

  private _fromDefinitionNode(node: ast.DefinitionNode): types.DefinitionNode {
    switch (node.kind) {
      case 'DirectiveDefinition':
        return this._fromDirectiveDefinitionNode(node);
      case 'EnumTypeDefinition':
      case 'EnumTypeExtension':
        return this._fromEnumTypeDefinitionNode(node);
      case 'FragmentDefinition':
        return this._fromFragmentDefinitionNode(node);
      case 'InputObjectTypeDefinition':
      case 'InputObjectTypeExtension':
        return this._fromInputObjectTypeDefinitionNode(node);
      case 'OperationDefinition':
        return this._fromOperationDefinitionNode(node);
      case 'ScalarTypeDefinition':
      case 'ScalarTypeExtension':
        return this._fromScalarTypeDefinitionNode(node);
      case 'ObjectTypeDefinition':
      case 'ObjectTypeExtension':
        return this._fromObjectTypeDefinitionNode(node);
      case 'InterfaceTypeDefinition':
      case 'InterfaceTypeExtension':
        return this._fromInterfaceTypeDefinitionNode(node);
      case 'UnionTypeDefinition':
      case 'UnionTypeExtension':
        return this._fromUnionTypeDefinitionNode(node);
      case 'SchemaDefinition':
      case 'SchemaExtension':
        return throwGraphQlError(`Unsupported node: ${node.kind}`, {
          node: {loc: this._fromLocation(node.loc)},
        });
      default:
        return assertNever(node);
    }
  }

  private _fromArgumentNode(node: ast.ArgumentNode): types.ArgumentNode {
    return {
      kind: 'Argument',
      loc: this._fromLocation(node.loc),
      name: this._fromNameNode(node.name),
      value: this._fromValueNode(node.value),
    };
  }
  private _fromDirectiveDefinitionNode(
    node: ast.DirectiveDefinitionNode,
  ): types.DirectiveDefinitionNode {
    return {
      kind: 'DirectiveDefinition',
      loc: this._fromLocation(node.loc),
      description: node.description
        ? this._fromStringValueNode(node.description)
        : undefined,
      name: this._fromNameNode(node.name),
      arguments:
        node.arguments?.map((a) => this._fromInputValueDefinitionNode(a)) ?? [],
      isRepeatable: node.repeatable,
      locations: node.locations.map(
        (loc): types.DirectiveLocationNode => {
          if (!isValidDirectiveLocation(loc.value)) {
            return throwGraphQlError(
              `Invalid location for directive: "${loc.value}"`,
              {node: {loc: this._fromLocation(loc.loc)}},
            );
          }
          return {
            kind: 'DirectiveLocation',
            loc: this._fromLocation(loc.loc),
            value: loc.value,
          };
        },
      ),
    };
  }
  private _fromDirectiveNode(node: ast.DirectiveNode): types.DirectiveNode {
    return {
      kind: 'Directive',
      loc: this._fromLocation(node.loc),
      name: this._fromNameNode(node.name),
      arguments: node.arguments?.map((a) => this._fromArgumentNode(a)) ?? [],
    };
  }
  private _fromFragmentDefinitionNode(
    node: ast.FragmentDefinitionNode,
  ): types.FragmentDefinitionNode {
    return {
      kind: 'FragmentDefinition',
      loc: this._fromLocation(node.loc),
      name: this._fromNameNode(node.name),
      // Note: fragment variable definitions are experimental and may be changed
      // or removed in the future.
      variableDefinitions:
        node.variableDefinitions?.map((v) =>
          this._fromVariableDefinitionNode(v),
        ) ?? [],
      typeCondition: this._fromNameNode(node.typeCondition.name),
      directives: node.directives?.map((d) => this._fromDirectiveNode(d)) ?? [],
      selectionSet: this._fromSelectionSetNode(node.selectionSet),
    };
  }
  private _fromOperationDefinitionNode(
    node: ast.OperationDefinitionNode,
  ): types.OperationDefinitionNode {
    return {
      kind: 'OperationDefinition',
      loc: this._fromLocation(node.loc),
      operation: node.operation,
      name: node.name ? this._fromNameNode(node.name) : undefined,
      variableDefinitions:
        node.variableDefinitions?.map((v) =>
          this._fromVariableDefinitionNode(v),
        ) ?? [],
      directives: node.directives?.map((d) => this._fromDirectiveNode(d)) ?? [],
      selectionSet: this._fromSelectionSetNode(node.selectionSet),
    };
  }
  private _fromVariableDefinitionNode(
    node: ast.VariableDefinitionNode,
  ): types.VariableDefinitionNode {
    return {
      kind: 'VariableDefinition',
      loc: this._fromLocation(node.loc),
      variable: this._fromVariableNode(node.variable),
      type: this._fromTypeNode(node.type),
      defaultValue: node.defaultValue
        ? this._fromValueNode(node.defaultValue)
        : undefined,
      directives: node.directives?.map((d) => this._fromDirectiveNode(d)) ?? [],
    };
  }
  private _fromNameNode(node: ast.NameNode): types.NameNode {
    return {
      kind: 'Name',
      loc: this._fromLocation(node.loc),
      value: node.value,
    };
  }
  private _fromSelectionNode(node: ast.SelectionNode): types.SelectionNode {
    switch (node.kind) {
      case 'Field':
        return this._fromFieldNode(node);
      case 'FragmentSpread':
        return this._fromFragmentSpreadNode(node);
      case 'InlineFragment':
        return this._fromInlineFragmentNode(node);
      default:
        return assertNever(node);
    }
  }
  private _fromFieldNode(node: ast.FieldNode): types.FieldNode {
    return {
      kind: 'Field',
      loc: this._fromLocation(node.loc),
      alias: this._fromNameNode(node.alias ?? node.name),
      name: this._fromNameNode(node.name),
      arguments: node.arguments?.map((a) => this._fromArgumentNode(a)) ?? [],
      directives: node.directives?.map((d) => this._fromDirectiveNode(d)) ?? [],
      selectionSet: node.selectionSet
        ? this._fromSelectionSetNode(node.selectionSet)
        : undefined,
    };
  }
  private _fromFragmentSpreadNode(
    node: ast.FragmentSpreadNode,
  ): types.FragmentSpreadNode {
    return {
      kind: 'FragmentSpread',
      loc: this._fromLocation(node.loc),
      name: this._fromNameNode(node.name),
      directives: node.directives?.map((d) => this._fromDirectiveNode(d)) ?? [],
    };
  }
  private _fromInlineFragmentNode(
    node: ast.InlineFragmentNode,
  ): types.InlineFragmentNode {
    return {
      kind: 'InlineFragment',
      loc: this._fromLocation(node.loc),
      typeCondition: node.typeCondition
        ? this._fromNameNode(node.typeCondition.name)
        : undefined,
      directives: node.directives?.map((d) => this._fromDirectiveNode(d)) ?? [],
      selectionSet: this._fromSelectionSetNode(node.selectionSet),
    };
  }
  private _fromSelectionSetNode(
    node: ast.SelectionSetNode,
  ): types.SelectionSetNode {
    return {
      kind: 'SelectionSet',
      loc: this._fromLocation(node.loc),
      selections: node.selections.map((s) => this._fromSelectionNode(s)),
    };
  }
  private _fromEnumTypeDefinitionNode(
    node: ast.EnumTypeDefinitionNode | ast.EnumTypeExtensionNode,
  ): types.EnumTypeDefinitionNode {
    return {
      kind: 'EnumTypeDefinition',
      loc: this._fromLocation(node.loc),
      description:
        node.kind === 'EnumTypeDefinition' && node.description
          ? this._fromStringValueNode(node.description)
          : undefined,
      name: this._fromNameNode(node.name),
      extend: node.kind === 'EnumTypeExtension',
      directives: node.directives?.map((d) => this._fromDirectiveNode(d)) ?? [],
      values:
        node.values?.map((v) => this._fromEnumValueDefinitionNode(v)) ?? [],
    };
  }
  private _fromEnumValueDefinitionNode(
    node: ast.EnumValueDefinitionNode,
  ): types.EnumValueDefinitionNode {
    return {
      kind: 'EnumValueDefinition',
      loc: this._fromLocation(node.loc),
      description: node.description
        ? this._fromStringValueNode(node.description)
        : undefined,
      name: this._fromNameNode(node.name),
      directives: node.directives?.map((d) => this._fromDirectiveNode(d)) ?? [],
    };
  }
  private _fromFieldDefinitionNode(
    node: ast.FieldDefinitionNode,
  ): types.FieldDefinitionNode {
    return {
      kind: 'FieldDefinition',
      loc: this._fromLocation(node.loc),
      description: node.description
        ? this._fromStringValueNode(node.description)
        : undefined,
      name: this._fromNameNode(node.name),
      arguments:
        node.arguments?.map((a) => this._fromInputValueDefinitionNode(a)) ?? [],
      type: this._fromTypeNode(node.type),
      directives: node.directives?.map((d) => this._fromDirectiveNode(d)) ?? [],
    };
  }
  private _fromInputObjectTypeDefinitionNode(
    node: ast.InputObjectTypeDefinitionNode | ast.InputObjectTypeExtensionNode,
  ): types.InputObjectTypeDefinitionNode {
    return {
      kind: 'InputObjectTypeDefinition',
      loc: this._fromLocation(node.loc),
      description:
        node.kind === 'InputObjectTypeDefinition' && node.description
          ? this._fromStringValueNode(node.description)
          : undefined,
      name: this._fromNameNode(node.name),
      extend: node.kind === 'InputObjectTypeExtension',
      directives: node.directives?.map((d) => this._fromDirectiveNode(d)) ?? [],
      fields:
        node.fields?.map((f) => this._fromInputValueDefinitionNode(f)) ?? [],
    };
  }
  private _fromInputValueDefinitionNode(
    node: ast.InputValueDefinitionNode,
  ): types.InputValueDefinitionNode {
    return {
      kind: 'InputValueDefinition',
      loc: this._fromLocation(node.loc),
      description: node.description
        ? this._fromStringValueNode(node.description)
        : undefined,
      name: this._fromNameNode(node.name),
      type: this._fromTypeNode(node.type),
      defaultValue: node.defaultValue
        ? this._fromValueNode(node.defaultValue)
        : undefined,
      directives: node.directives?.map((d) => this._fromDirectiveNode(d)) ?? [],
    };
  }
  private _fromInterfaceTypeDefinitionNode(
    node: ast.InterfaceTypeDefinitionNode | ast.InterfaceTypeExtensionNode,
  ): types.InterfaceTypeDefinitionNode {
    return {
      kind: 'InterfaceTypeDefinition',
      loc: this._fromLocation(node.loc),
      description:
        node.kind === 'InterfaceTypeDefinition' && node.description
          ? this._fromStringValueNode(node.description)
          : undefined,
      name: this._fromNameNode(node.name),
      extend: node.kind === 'InterfaceTypeExtension',
      directives: node.directives?.map((d) => this._fromDirectiveNode(d)) ?? [],
      fields: node.fields?.map((f) => this._fromFieldDefinitionNode(f)) ?? [],
    };
  }
  private _fromObjectTypeDefinitionNode(
    node: ast.ObjectTypeDefinitionNode | ast.ObjectTypeExtensionNode,
  ): types.ObjectTypeDefinitionNode {
    return {
      kind: 'ObjectTypeDefinition',
      loc: this._fromLocation(node.loc),
      description:
        node.kind === 'ObjectTypeDefinition' && node.description
          ? this._fromStringValueNode(node.description)
          : undefined,
      name: this._fromNameNode(node.name),
      extend: node.kind === 'ObjectTypeExtension',
      interfaces: node.interfaces?.map((n) => this._fromNameNode(n.name)) ?? [],
      directives: node.directives?.map((d) => this._fromDirectiveNode(d)) ?? [],
      fields: node.fields?.map((f) => this._fromFieldDefinitionNode(f)) ?? [],
    };
  }
  private _fromScalarTypeDefinitionNode(
    node: ast.ScalarTypeDefinitionNode | ast.ScalarTypeExtensionNode,
  ): types.ScalarTypeDefinitionNode {
    return {
      kind: 'ScalarTypeDefinition',
      loc: this._fromLocation(node.loc),
      description:
        node.kind === 'ScalarTypeDefinition' && node.description
          ? this._fromStringValueNode(node.description)
          : undefined,
      name: this._fromNameNode(node.name),
      extend: node.kind === 'ScalarTypeExtension',
      directives: node.directives?.map((d) => this._fromDirectiveNode(d)) ?? [],
    };
  }
  private _fromUnionTypeDefinitionNode(
    node: ast.UnionTypeDefinitionNode | ast.UnionTypeExtensionNode,
  ): types.UnionTypeDefinitionNode {
    return {
      kind: 'UnionTypeDefinition',
      loc: this._fromLocation(node.loc),
      description:
        node.kind === 'UnionTypeDefinition' && node.description
          ? this._fromStringValueNode(node.description)
          : undefined,
      name: this._fromNameNode(node.name),
      extend: node.kind === 'UnionTypeExtension',
      directives: node.directives?.map((d) => this._fromDirectiveNode(d)) ?? [],
      types: node.types?.map((t) => this._fromNameNode(t.name)) ?? [],
    };
  }
  private _fromTypeNode(node: ast.TypeNode): types.TypeNode {
    switch (node.kind) {
      case 'NonNullType':
        return this._fromNullableTypeNodeAsNotNull(node.type);
      default:
        return {
          kind: 'NullableType',
          loc: this._fromLocation(node.loc),
          ofType: this._fromNullableTypeNodeAsNotNull(node),
        };
    }
  }

  private _fromNullableTypeNodeAsNotNull(
    node: ast.NamedTypeNode | ast.ListTypeNode,
  ):
    | types.NameNode
    | types.ListTypeNode
    | types.BooleanTypeNode
    | types.FloatTypeNode
    | types.IdTypeNode
    | types.IntTypeNode
    | types.StringTypeNode {
    switch (node.kind) {
      case 'ListType':
        return {
          kind: 'ListType',
          loc: this._fromLocation(node.loc),
          ofType: this._fromTypeNode(node.type),
        };
      case 'NamedType':
        switch (node.name.value) {
          case 'Int':
            return {kind: 'IntType', loc: this._fromLocation(node.loc)};
          case 'Float':
            return {kind: 'FloatType', loc: this._fromLocation(node.loc)};
          case 'String':
            return {kind: 'StringType', loc: this._fromLocation(node.loc)};
          case 'Boolean':
            return {kind: 'BooleanType', loc: this._fromLocation(node.loc)};
          case 'ID':
            return {kind: 'IdType', loc: this._fromLocation(node.loc)};
        }
        return this._fromNameNode(node.name);
      default:
        return assertNever(node);
    }
  }
  private _fromValueNode(node: ast.ValueNode): types.ValueNode {
    switch (node.kind) {
      case 'Variable':
        return this._fromVariableNode(node);
      case 'IntValue':
        return this._fromIntValueNode(node);
      case 'FloatValue':
        return this._fromFloatValueNode(node);
      case 'StringValue':
        return this._fromStringValueNode(node);
      case 'BooleanValue':
        return this._fromBooleanValueNode(node);
      case 'NullValue':
        return this._fromNullValueNode(node);
      case 'EnumValue':
        return this._fromEnumValueNode(node);
      case 'ListValue':
        return this._fromListValueNode(node);
      case 'ObjectValue':
        return this._fromObjectValueNode(node);
      default:
        return assertNever(node);
    }
  }
  private _fromBooleanValueNode(
    node: ast.BooleanValueNode,
  ): types.BooleanValueNode {
    return {
      kind: 'BooleanValue',
      loc: this._fromLocation(node.loc),
      value: node.value,
    };
  }
  private _fromEnumValueNode(node: ast.EnumValueNode): types.EnumValueNode {
    return {
      kind: 'EnumValue',
      loc: this._fromLocation(node.loc),
      value: node.value,
    };
  }
  private _fromFloatValueNode(node: ast.FloatValueNode): types.FloatValueNode {
    return {
      kind: 'FloatValue',
      loc: this._fromLocation(node.loc),
      value: node.value,
    };
  }
  private _fromIntValueNode(node: ast.IntValueNode): types.IntValueNode {
    return {
      kind: 'IntValue',
      loc: this._fromLocation(node.loc),
      value: node.value,
    };
  }
  private _fromListValueNode(node: ast.ListValueNode): types.ListValueNode {
    return {
      kind: 'ListValue',
      loc: this._fromLocation(node.loc),
      values: node.values.map((v) => this._fromValueNode(v)),
    };
  }
  private _fromNullValueNode(node: ast.NullValueNode): types.NullValueNode {
    return {
      kind: 'NullValue',
      loc: this._fromLocation(node.loc),
    };
  }
  private _fromObjectFieldNode(
    node: ast.ObjectFieldNode,
  ): types.ObjectFieldNode {
    return {
      kind: 'ObjectField',
      loc: this._fromLocation(node.loc),
      name: this._fromNameNode(node.name),
      value: this._fromValueNode(node.value),
    };
  }
  private _fromObjectValueNode(
    node: ast.ObjectValueNode,
  ): types.ObjectValueNode {
    return {
      kind: 'ObjectValue',
      loc: this._fromLocation(node.loc),
      fields: node.fields.map((f) => this._fromObjectFieldNode(f)),
    };
  }
  private _fromStringValueNode(
    node: ast.StringValueNode,
  ): types.StringValueNode {
    return {
      kind: 'StringValue',
      loc: this._fromLocation(node.loc),
      value: node.value,
      block: node.block,
    };
  }

  private _fromVariableNode(node: ast.VariableNode): types.VariableNode {
    return {
      kind: 'Variable',
      loc: this._fromLocation(node.loc),
      name: this._fromNameNode(node.name),
    };
  }

  private _fromGraphQlDirective(
    node: gt.GraphQLDirective,
  ): types.DirectiveDefinitionNode {
    return {
      kind: 'DirectiveDefinition',
      loc: this._source,
      description: node.description
        ? this._stringValue(node.description)
        : undefined,
      name: this._nameNode(node.name),
      arguments: node.args?.map((a) => this._fromGraphQlInputField(a)) ?? [],
      isRepeatable: node.isRepeatable,
      locations: node.locations.map((value) => ({
        kind: 'DirectiveLocation',
        loc: this._source,
        value: value,
      })),
    };
  }
  private _fromGraphQlNamedType(
    node: gt.GraphQLNamedType,
  ): types.TypeDefinitionNode {
    if (gt.isScalarType(node)) {
      return this._fromGraphQlScalarType(node);
    }
    if (gt.isObjectType(node)) {
      return this._fromGraphQlObjectType(node);
    }
    if (gt.isInterfaceType(node)) {
      return this._fromGraphQlInterfaceType(node);
    }
    if (gt.isUnionType(node)) {
      return this._fromGraphQlUnionType(node);
    }
    if (gt.isEnumType(node)) {
      return this._fromGraphQlEnumType(node);
    }
    if (gt.isInputObjectType(node)) {
      return this._fromGraphQlInputObjectType(node);
    }
    return assertNever(node);
  }

  private _fromGraphQlScalarType(
    node: gt.GraphQLScalarType,
  ): types.ScalarTypeDefinitionNode {
    return {
      kind: 'ScalarTypeDefinition',
      loc: this._source,
      description: node.description
        ? this._stringValue(node.description)
        : undefined,
      name: this._nameNode(node.name),
      extend: false,
      directives: [],
    };
  }
  private _fromGraphQlObjectType(
    node: gt.GraphQLObjectType,
  ): types.ObjectTypeDefinitionNode {
    return {
      kind: 'ObjectTypeDefinition',
      loc: this._source,
      description: node.description
        ? this._stringValue(node.description)
        : undefined,
      name: this._nameNode(node.name),
      extend: false,
      interfaces: node.getInterfaces().map((n) => this._nameNode(n.name)) ?? [],
      fields: Object.values(node.getFields()).map((f) =>
        this._fromGraphQlField(f),
      ),
      directives: [],
    };
  }
  private _fromGraphQlInterfaceType(
    node: gt.GraphQLInterfaceType,
  ): types.InterfaceTypeDefinitionNode {
    return {
      kind: 'InterfaceTypeDefinition',
      loc: this._source,
      description: node.description
        ? this._stringValue(node.description)
        : undefined,
      name: this._nameNode(node.name),
      extend: false,
      fields: Object.values(node.getFields()).map((f) =>
        this._fromGraphQlField(f),
      ),
      directives: [],
    };
  }

  private _fromGraphQlUnionType(
    node: gt.GraphQLUnionType,
  ): types.UnionTypeDefinitionNode {
    return {
      kind: 'UnionTypeDefinition',
      loc: this._source,
      description: node.description
        ? this._stringValue(node.description)
        : undefined,
      name: this._nameNode(node.name),
      extend: false,
      types: node.getTypes().map((t) => this._nameNode(t.name)),
      directives: [],
    };
  }

  private _fromGraphQlEnumType(
    node: gt.GraphQLEnumType,
  ): types.EnumTypeDefinitionNode {
    return {
      kind: 'EnumTypeDefinition',
      loc: this._source,
      description: node.description
        ? this._stringValue(node.description)
        : undefined,
      name: this._nameNode(node.name),
      extend: false,
      values: node.getValues().map((v) => this._fromGraphQlEnumValue(v)),
      directives: [],
    };
  }

  private _fromGraphQlInputObjectType(
    node: gt.GraphQLInputObjectType,
  ): types.InputObjectTypeDefinitionNode {
    return {
      kind: 'InputObjectTypeDefinition',
      loc: this._source,
      description: node.description
        ? this._stringValue(node.description)
        : undefined,
      name: this._nameNode(node.name),
      extend: false,
      fields: Object.values(node.getFields()).map((f) =>
        this._fromGraphQlInputField(f),
      ),
      directives: [],
    };
  }

  private _fromGraphQlEnumValue(
    node: gt.GraphQLEnumValue,
  ): types.EnumValueDefinitionNode {
    return {
      kind: 'EnumValueDefinition',
      loc: this._source,
      description: node.description
        ? this._stringValue(node.description)
        : undefined,
      name: this._nameNode(node.name),
      directives: [],
    };
  }

  private _fromGraphQlField(
    node: gt.GraphQLField<
      any,
      any,
      {
        [key: string]: any;
      }
    >,
  ): types.FieldDefinitionNode {
    return {
      kind: 'FieldDefinition',
      loc: this._source,
      description: node.description
        ? this._stringValue(node.description)
        : undefined,
      name: this._nameNode(node.name),
      arguments: node.args?.map((a) => this._fromGraphQlInputField(a)) ?? [],
      type: this._fromGraphQlType(node.type),
      directives: [],
    };
  }

  private _fromGraphQlInputField(
    node: gt.GraphQLInputField | gt.GraphQLArgument,
  ): types.InputValueDefinitionNode {
    const type = this._fromGraphQlType(node.type);
    return {
      kind: 'InputValueDefinition',
      loc: this._source,
      description: node.description
        ? this._stringValue(node.description)
        : undefined,
      name: this._nameNode(node.name),
      type,
      defaultValue:
        node.defaultValue !== undefined && node.defaultValue !== null
          ? {
              kind: 'JavaScriptValue',
              loc: this._source,
              value: node.defaultValue,
            }
          : undefined,
      directives: [],
    };
  }

  private _fromGraphQlType(
    node: gt.GraphQLInputType | gt.GraphQLOutputType,
  ): types.TypeNode {
    if (gt.isNonNullType(node)) {
      return this._fromNullableGraphQLTypeAsNotNull(node.ofType);
    } else {
      return {
        kind: 'NullableType',
        loc: this._source,
        ofType: this._fromNullableGraphQLTypeAsNotNull(node),
      };
    }
  }
  private _fromNullableGraphQLTypeAsNotNull(
    node:
      | gt.GraphQLObjectType
      | gt.GraphQLInterfaceType
      | gt.GraphQLUnionType
      | gt.GraphQLScalarType
      | gt.GraphQLEnumType
      | gt.GraphQLInputObjectType
      | gt.GraphQLList<any>,
  ):
    | types.NameNode
    | types.ListTypeNode
    | types.BooleanTypeNode
    | types.FloatTypeNode
    | types.IdTypeNode
    | types.IntTypeNode
    | types.StringTypeNode {
    if (gt.isListType(node)) {
      return {
        kind: 'ListType',
        loc: this._source,
        ofType: this._fromGraphQlType(node.ofType),
      };
    }
    if (
      gt.isInputObjectType(node) ||
      gt.isEnumType(node) ||
      gt.isUnionType(node) ||
      gt.isObjectType(node) ||
      gt.isInterfaceType(node)
    ) {
      return this._nameNode(node.name);
    }

    switch (node.name) {
      case 'Int':
        return {kind: 'IntType', loc: this._source};
      case 'Float':
        return {kind: 'FloatType', loc: this._source};
      case 'String':
        return {kind: 'StringType', loc: this._source};
      case 'Boolean':
        return {kind: 'BooleanType', loc: this._source};
      case 'ID':
        return {kind: 'IdType', loc: this._source};
    }

    return this._nameNode(node.name);
  }

  private _stringValue(
    value: string,
    block: boolean = false,
  ): types.StringValueNode {
    return {kind: 'StringValue', loc: this._source, value, block};
  }
  private _nameNode(name: string): types.NameNode {
    return {kind: 'Name', loc: this._source, value: name};
  }
}
