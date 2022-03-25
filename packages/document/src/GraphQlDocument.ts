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

  public getMany(options?: GetManyOptions): readonly T[] {
    return options?.includeReferencedDocuments ? this._all : this._local;
  }
  public getOne(name: string | types.NameNode): T | undefined {
    return this._map.get(typeof name === 'string' ? name : name.value);
  }
  public getOneX(name: types.NameNode): T {
    return (
      this.getOne(name) ??
      throwGraphQlError(
        `MISSING_NAMED_NODE`,
        `Could not find ${this._name} called "${name.value}"`,
        {loc: name.loc},
      )
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

  public getDefinitions(
    options?: GetManyOptions,
  ): readonly types.DefinitionNode[] {
    return options?.includeReferencedDocuments
      ? this._allDefinitions
      : this._localDefinitions;
  }

  public getOperations(
    options?: GetManyOptions,
  ): readonly types.OperationDefinitionNode[] {
    return this._operations.getMany(options);
  }
  public getOperation(
    name: string | types.NameNode,
  ): types.OperationDefinitionNode | undefined {
    return this._operations.getOne(name);
  }
  public getOperationX(name: types.NameNode): types.OperationDefinitionNode {
    return this._operations.getOneX(name);
  }

  public getFragments(
    options?: GetManyOptions,
  ): readonly types.FragmentDefinitionNode[] {
    return this._fragments.getMany(options);
  }
  public getFragment(
    name: string | types.NameNode,
  ): types.FragmentDefinitionNode | undefined {
    return this._fragments.getOne(name);
  }
  public getFragmentX(name: types.NameNode): types.FragmentDefinitionNode {
    return this._fragments.getOneX(name);
  }

  public getInterfaceImplementations(
    interfaceDefinition: types.InterfaceTypeDefinitionNode,
  ) {
    return this.getObjectTypeDefinitions({
      includeReferencedDocuments: true,
    }).filter((obj) =>
      obj.interfaces.some((i) => i.value === interfaceDefinition.name.value),
    );
  }

  public getScalarTypeDefinitions(
    options?: GetManyOptions,
  ): readonly types.ScalarTypeDefinitionNode[] {
    return this._scalarTypeDefinitions.getMany(options);
  }
  public getScalarTypeDefinition(
    name: string | types.NameNode,
  ): types.ScalarTypeDefinitionNode | undefined {
    return this._scalarTypeDefinitions.getOne(name);
  }
  public getScalarTypeDefinitionX(
    name: types.NameNode,
  ): types.ScalarTypeDefinitionNode {
    return this._scalarTypeDefinitions.getOneX(name);
  }
  public getObjectTypeDefinitions(
    options?: GetManyOptions,
  ): readonly types.ObjectTypeDefinitionNode[] {
    return this._objectTypeDefinitions.getMany(options);
  }
  public getObjectTypeDefinition(
    name: string | types.NameNode,
  ): types.ObjectTypeDefinitionNode | undefined {
    return this._objectTypeDefinitions.getOne(name);
  }
  public getObjectTypeDefinitionX(
    name: types.NameNode,
  ): types.ObjectTypeDefinitionNode {
    return this._objectTypeDefinitions.getOneX(name);
  }
  public getInterfaceTypeDefinitions(
    options?: GetManyOptions,
  ): readonly types.InterfaceTypeDefinitionNode[] {
    return this._interfaceTypeDefinitions.getMany(options);
  }
  public getInterfaceTypeDefinition(
    name: string | types.NameNode,
  ): types.InterfaceTypeDefinitionNode | undefined {
    return this._interfaceTypeDefinitions.getOne(name);
  }
  public getInterfaceTypeDefinitionX(
    name: types.NameNode,
  ): types.InterfaceTypeDefinitionNode {
    return this._interfaceTypeDefinitions.getOneX(name);
  }
  public getUnionTypeDefinitions(
    options?: GetManyOptions,
  ): readonly types.UnionTypeDefinitionNode[] {
    return this._unionTypeDefinitions.getMany(options);
  }
  public getUnionTypeDefinition(
    name: string | types.NameNode,
  ): types.UnionTypeDefinitionNode | undefined {
    return this._unionTypeDefinitions.getOne(name);
  }
  public getUnionTypeDefinitionX(
    name: types.NameNode,
  ): types.UnionTypeDefinitionNode {
    return this._unionTypeDefinitions.getOneX(name);
  }
  public getEnumTypeDefinitions(
    options?: GetManyOptions,
  ): readonly types.EnumTypeDefinitionNode[] {
    return this._enumTypeDefinitions.getMany(options);
  }
  public getEnumTypeDefinition(
    name: string | types.NameNode,
  ): types.EnumTypeDefinitionNode | undefined {
    return this._enumTypeDefinitions.getOne(name);
  }
  public getEnumTypeDefinitionX(
    name: types.NameNode,
  ): types.EnumTypeDefinitionNode {
    return this._enumTypeDefinitions.getOneX(name);
  }
  public getInputObjectTypeDefinitions(
    options?: GetManyOptions,
  ): readonly types.InputObjectTypeDefinitionNode[] {
    return this._inputObjectTypeDefinitions.getMany(options);
  }
  public getInputObjectTypeDefinition(
    name: string | types.NameNode,
  ): types.InputObjectTypeDefinitionNode | undefined {
    return this._inputObjectTypeDefinitions.getOne(name);
  }
  public getInputObjectTypeDefinitionX(
    name: types.NameNode,
  ): types.InputObjectTypeDefinitionNode {
    return this._inputObjectTypeDefinitions.getOneX(name);
  }

  public getTypes(
    options?: GetManyOptions,
  ): readonly types.TypeDefinitionNode[] {
    return this._types.getMany(options);
  }
  public getType(
    name: string | types.NameNode,
  ): types.TypeDefinitionNode | undefined {
    return this._types.getOne(name);
  }
  public getTypeX(name: types.NameNode): types.TypeDefinitionNode {
    return this._types.getOneX(name);
  }

  public getInputTypes(
    options?: GetManyOptions,
  ): readonly types.InputTypeDefinitionNode[] {
    return this._inputTypes.getMany(options);
  }
  public getInputType(
    name: string | types.NameNode,
  ): types.InputTypeDefinitionNode | undefined {
    return this._inputTypes.getOne(name);
  }
  public getInputTypeX(name: types.NameNode): types.InputTypeDefinitionNode {
    return this._inputTypes.getOneX(name);
  }

  public getDirectives(
    options?: GetManyOptions,
  ): readonly types.DirectiveDefinitionNode[] {
    return this._directives.getMany(options);
  }
  public getDirective(
    name: string | types.NameNode,
  ): types.DirectiveDefinitionNode | undefined {
    return this._directives.getOne(name);
  }
  public getDirectiveX(name: types.NameNode): types.DirectiveDefinitionNode {
    return this._directives.getOneX(name);
  }
}
