import {isInputTypeDefinitionNode, isTypeDefinitionNode, nodeKind} from '.';
import {throwGraphQlError} from './errors';
import type * as types from './types';

export interface GetManyOptions {
  includeReferencedDocuments?: boolean;
}

class FilteredDefinitions<T extends types.DefinitionNode> {
  private readonly _name: string;
  private readonly _all: readonly T[];
  private readonly _local: readonly T[];
  private readonly _map: ReadonlyMap<string, T>;
  constructor(
    name: string,
    allDefinitions: readonly types.DefinitionNode[],
    localDefinitions: readonly types.DefinitionNode[],
    filter: (node: types.DefinitionNode) => node is T,
  ) {
    this._name = name;
    this._all = allDefinitions.filter(filter);
    this._local = localDefinitions.filter(filter);
    this._map = new Map(
      this._all
        .filter((o) => o.name !== undefined)
        .map((o) => [o.name!.value, o]),
    );
  }

  getMany(options?: GetManyOptions): readonly T[] {
    return options?.includeReferencedDocuments ? this._all : this._local;
  }
  getOne(name: string | types.NameNode): T | undefined {
    return this._map.get(typeof name === 'string' ? name : name.value);
  }
  getOneX(name: types.NameNode): T {
    return (
      this.getOne(name) ??
      throwGraphQlError(`Could not find ${this._name} called "${name.value}"`, {
        node: name,
      })
    );
  }
}
export default class GraphQlDocument {
  private readonly _allDefinitions: readonly types.DefinitionNode[];
  private readonly _localDefinitions: readonly types.DefinitionNode[];

  private readonly _operations: FilteredDefinitions<types.OperationDefinitionNode>;
  private readonly _fragments: FilteredDefinitions<types.FragmentDefinitionNode>;
  private readonly _types: FilteredDefinitions<types.TypeDefinitionNode>;
  private readonly _inputTypes: FilteredDefinitions<types.InputTypeDefinitionNode>;

  private readonly _scalarTypeDefinitions: FilteredDefinitions<types.ScalarTypeDefinitionNode>;
  private readonly _objectTypeDefinitions: FilteredDefinitions<types.ObjectTypeDefinitionNode>;
  private readonly _interfaceTypeDefinitions: FilteredDefinitions<types.InterfaceTypeDefinitionNode>;
  private readonly _unionTypeDefinitions: FilteredDefinitions<types.UnionTypeDefinitionNode>;
  private readonly _enumTypeDefinitions: FilteredDefinitions<types.EnumTypeDefinitionNode>;
  private readonly _inputObjectTypeDefinitions: FilteredDefinitions<types.InputObjectTypeDefinitionNode>;

  private readonly _directives: FilteredDefinitions<types.DirectiveDefinitionNode>;

  constructor(
    document: types.DocumentNode,
    referencedDocuments: readonly GraphQlDocument[],
  ) {
    this._localDefinitions = document.definitions
      .slice()
      .sort((a, b) =>
        !a.name ? -1 : !b.name ? 1 : a.name.value < b.name.value ? -1 : 1,
      );

    const seen = new Set();
    this._allDefinitions = referencedDocuments
      .flatMap((d) => d._allDefinitions)
      .concat(this._localDefinitions)
      .filter((definition) => {
        if (seen.has(definition)) {
          return false;
        }
        return true;
      });

    this._operations = new FilteredDefinitions(
      `an Operation`,
      this._allDefinitions,
      this._localDefinitions,
      nodeKind('OperationDefinition'),
    );
    this._fragments = new FilteredDefinitions(
      `a Fragment`,
      this._allDefinitions,
      this._localDefinitions,
      nodeKind('FragmentDefinition'),
    );

    this._types = new FilteredDefinitions(
      `a Type`,
      this._allDefinitions,
      this._localDefinitions,
      isTypeDefinitionNode,
    );
    this._inputTypes = new FilteredDefinitions(
      `an InputType`,
      this._types.getMany({includeReferencedDocuments: true}),
      this._types.getMany({includeReferencedDocuments: false}),
      isInputTypeDefinitionNode,
    );

    this._scalarTypeDefinitions = new FilteredDefinitions(
      `a ScalarType`,
      this._types.getMany({includeReferencedDocuments: true}),
      this._types.getMany({includeReferencedDocuments: false}),
      nodeKind(`ScalarTypeDefinition`),
    );
    this._objectTypeDefinitions = new FilteredDefinitions(
      `an ObjectType`,
      this._types.getMany({includeReferencedDocuments: true}),
      this._types.getMany({includeReferencedDocuments: false}),
      nodeKind(`ObjectTypeDefinition`),
    );
    this._interfaceTypeDefinitions = new FilteredDefinitions(
      `an InterfaceType`,
      this._types.getMany({includeReferencedDocuments: true}),
      this._types.getMany({includeReferencedDocuments: false}),
      nodeKind(`InterfaceTypeDefinition`),
    );
    this._unionTypeDefinitions = new FilteredDefinitions(
      `a UnionType`,
      this._types.getMany({includeReferencedDocuments: true}),
      this._types.getMany({includeReferencedDocuments: false}),
      nodeKind(`UnionTypeDefinition`),
    );
    this._enumTypeDefinitions = new FilteredDefinitions(
      `an EnumType`,
      this._types.getMany({includeReferencedDocuments: true}),
      this._types.getMany({includeReferencedDocuments: false}),
      nodeKind(`EnumTypeDefinition`),
    );
    this._inputObjectTypeDefinitions = new FilteredDefinitions(
      `an InputObjectType`,
      this._types.getMany({includeReferencedDocuments: true}),
      this._types.getMany({includeReferencedDocuments: false}),
      nodeKind(`InputObjectTypeDefinition`),
    );

    this._directives = new FilteredDefinitions(
      `a Directive`,
      this._allDefinitions,
      this._localDefinitions,
      nodeKind('DirectiveDefinition'),
    );
  }

  getDefinitions(options?: GetManyOptions): readonly types.DefinitionNode[] {
    return options?.includeReferencedDocuments
      ? this._allDefinitions
      : this._localDefinitions;
  }

  getOperations(
    options?: GetManyOptions,
  ): readonly types.OperationDefinitionNode[] {
    return this._operations.getMany(options);
  }
  getOperation(
    name: string | types.NameNode,
  ): types.OperationDefinitionNode | undefined {
    return this._operations.getOne(name);
  }
  getOperationX(name: types.NameNode): types.OperationDefinitionNode {
    return this._operations.getOneX(name);
  }

  getFragments(
    options?: GetManyOptions,
  ): readonly types.FragmentDefinitionNode[] {
    return this._fragments.getMany(options);
  }
  getFragment(
    name: string | types.NameNode,
  ): types.FragmentDefinitionNode | undefined {
    return this._fragments.getOne(name);
  }
  getFragmentX(name: types.NameNode): types.FragmentDefinitionNode {
    return this._fragments.getOneX(name);
  }

  getInterfaceImplementations(
    interfaceDefinition: types.InterfaceTypeDefinitionNode,
  ) {
    return this.getObjectTypeDefinitions({
      includeReferencedDocuments: true,
    }).filter((obj) =>
      obj.interfaces.some((i) => i.value === interfaceDefinition.name.value),
    );
  }

  getScalarTypeDefinitions(
    options?: GetManyOptions,
  ): readonly types.ScalarTypeDefinitionNode[] {
    return this._scalarTypeDefinitions.getMany(options);
  }
  getScalarTypeDefinition(
    name: string | types.NameNode,
  ): types.ScalarTypeDefinitionNode | undefined {
    return this._scalarTypeDefinitions.getOne(name);
  }
  getScalarTypeDefinitionX(
    name: types.NameNode,
  ): types.ScalarTypeDefinitionNode {
    return this._scalarTypeDefinitions.getOneX(name);
  }
  getObjectTypeDefinitions(
    options?: GetManyOptions,
  ): readonly types.ObjectTypeDefinitionNode[] {
    return this._objectTypeDefinitions.getMany(options);
  }
  getObjectTypeDefinition(
    name: string | types.NameNode,
  ): types.ObjectTypeDefinitionNode | undefined {
    return this._objectTypeDefinitions.getOne(name);
  }
  getObjectTypeDefinitionX(
    name: types.NameNode,
  ): types.ObjectTypeDefinitionNode {
    return this._objectTypeDefinitions.getOneX(name);
  }
  getInterfaceTypeDefinitions(
    options?: GetManyOptions,
  ): readonly types.InterfaceTypeDefinitionNode[] {
    return this._interfaceTypeDefinitions.getMany(options);
  }
  getInterfaceTypeDefinition(
    name: string | types.NameNode,
  ): types.InterfaceTypeDefinitionNode | undefined {
    return this._interfaceTypeDefinitions.getOne(name);
  }
  getInterfaceTypeDefinitionX(
    name: types.NameNode,
  ): types.InterfaceTypeDefinitionNode {
    return this._interfaceTypeDefinitions.getOneX(name);
  }
  getUnionTypeDefinitions(
    options?: GetManyOptions,
  ): readonly types.UnionTypeDefinitionNode[] {
    return this._unionTypeDefinitions.getMany(options);
  }
  getUnionTypeDefinition(
    name: string | types.NameNode,
  ): types.UnionTypeDefinitionNode | undefined {
    return this._unionTypeDefinitions.getOne(name);
  }
  getUnionTypeDefinitionX(name: types.NameNode): types.UnionTypeDefinitionNode {
    return this._unionTypeDefinitions.getOneX(name);
  }
  getEnumTypeDefinitions(
    options?: GetManyOptions,
  ): readonly types.EnumTypeDefinitionNode[] {
    return this._enumTypeDefinitions.getMany(options);
  }
  getEnumTypeDefinition(
    name: string | types.NameNode,
  ): types.EnumTypeDefinitionNode | undefined {
    return this._enumTypeDefinitions.getOne(name);
  }
  getEnumTypeDefinitionX(name: types.NameNode): types.EnumTypeDefinitionNode {
    return this._enumTypeDefinitions.getOneX(name);
  }
  getInputObjectTypeDefinitions(
    options?: GetManyOptions,
  ): readonly types.InputObjectTypeDefinitionNode[] {
    return this._inputObjectTypeDefinitions.getMany(options);
  }
  getInputObjectTypeDefinition(
    name: string | types.NameNode,
  ): types.InputObjectTypeDefinitionNode | undefined {
    return this._inputObjectTypeDefinitions.getOne(name);
  }
  getInputObjectTypeDefinitionX(
    name: types.NameNode,
  ): types.InputObjectTypeDefinitionNode {
    return this._inputObjectTypeDefinitions.getOneX(name);
  }

  getTypes(options?: GetManyOptions): readonly types.TypeDefinitionNode[] {
    return this._types.getMany(options);
  }
  getType(name: string | types.NameNode): types.TypeDefinitionNode | undefined {
    return this._types.getOne(name);
  }
  getTypeX(name: types.NameNode): types.TypeDefinitionNode {
    return this._types.getOneX(name);
  }

  getInputTypes(options?: GetManyOptions): readonly types.TypeDefinitionNode[] {
    return this._inputTypes.getMany(options);
  }
  getInputType(
    name: string | types.NameNode,
  ): types.TypeDefinitionNode | undefined {
    return this._inputTypes.getOne(name);
  }
  getInputTypeX(name: types.NameNode): types.TypeDefinitionNode {
    return this._inputTypes.getOneX(name);
  }

  getDirectives(
    options?: GetManyOptions,
  ): readonly types.DirectiveDefinitionNode[] {
    return this._directives.getMany(options);
  }
  getDirective(
    name: string | types.NameNode,
  ): types.DirectiveDefinitionNode | undefined {
    return this._directives.getOne(name);
  }
  getDirectiveX(name: types.NameNode): types.DirectiveDefinitionNode {
    return this._directives.getOneX(name);
  }
}
