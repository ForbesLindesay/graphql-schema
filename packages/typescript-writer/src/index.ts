type ImportSpecifiers = Map<string, {importedName: string; asType: boolean}>;

export interface ITypeScriptWriter {
  addImport(i: {
    localName: string;
    importedName: string;
    packageName: string;
    asType?: boolean;
  }): void;

  addDeclaration(identifiers: string[], body: string): void;
}

function comparePackageNames(a: string, b: string) {
  if (a.startsWith('.') && !b.startsWith('.')) {
    return -1;
  }
  if (!a.startsWith('.') && b.startsWith('.')) {
    return 1;
  }
  if (a > b) {
    return -1;
  }
  if (a < b) {
    return 1;
  }
  return 0;
}

export default class TypeScriptWriter implements ITypeScriptWriter {
  private readonly _locals = new Map<string, string>();
  private readonly _imports = new Map<string, ImportSpecifiers>();
  private readonly _declarations: string[] = [];

  public addImport({
    localName,
    importedName,
    packageName,
    asType = false,
  }: {
    localName: string;
    importedName: string;
    packageName: string;
    asType?: boolean;
  }) {
    // Check for local name conflicts
    const existingUsage = this._locals.get(localName);
    const usage = `import "${importedName}" from "${packageName}"`;
    if (existingUsage && existingUsage !== usage) {
      throw new Error(
        `The name "${localName}" cannot be used for both ${usage} and ${existingUsage}. Please find a way to rename one of these.`,
      );
    }
    this._locals.set(localName, usage);

    // add this import to our map
    let specifiers: ImportSpecifiers | undefined = this._imports.get(
      packageName,
    );
    if (!specifiers) {
      specifiers = new Map();
      this._imports.set(packageName, specifiers);
    }

    let existingSpecifier = specifiers.get(localName);
    const asValue =
      asType !== true ||
      (existingSpecifier !== undefined && existingSpecifier.asType !== true);
    specifiers.set(localName, {importedName, asType: !asValue});
  }

  public importsToString({
    typeModifiers = false,
  }: {typeModifiers?: boolean} = {}) {
    return [...this._imports]
      .sort(([packageA], [packageB]) => comparePackageNames(packageA, packageB))
      .map(([packageName, specifiers]) => {
        const parts = [];
        const defaultName = [...specifiers].find(
          ([_, {importedName, asType}]) =>
            importedName === 'default' && !(typeModifiers && asType),
        );
        if (defaultName) {
          parts.push(defaultName);
        }
        const named = [...specifiers]
          .filter(
            ([_, {importedName, asType}]) =>
              importedName !== 'default' || (typeModifiers && asType),
          )
          .map(
            ([localName, {importedName, asType}]) =>
              `${typeModifiers && asType ? `type ` : ``}${
                importedName === localName
                  ? localName
                  : `${importedName} as ${localName}`
              }`,
          );
        if (named.length) {
          parts.push(`{${named.join(', ')}}`);
        }
        return `import ${parts.join(', ')} from '${packageName}';`;
      })
      .join(`\n`);
  }

  public addDeclaration(identifiers: string[], body: string) {
    // Check for local name conflicts
    for (const localName of identifiers) {
      const existingUsage = this._locals.get(localName);
      if (existingUsage) {
        throw new Error(
          `The name "${localName}" cannot be used for both ${existingUsage} and ${body}. Please find a way to rename one of these.`,
        );
      }
      this._locals.set(localName, body);
    }

    // add the declaration
    this._declarations.push(body);
  }

  public declarationsToString() {
    return this._declarations.join(`\n\n`);
  }

  public toString({typeModifiers = false}: {typeModifiers?: boolean} = {}) {
    const imports = this.importsToString({typeModifiers});
    const declarations = this.declarationsToString();
    if (imports && declarations) {
      return `${imports}\n\n${declarations}`;
    }
    return imports || declarations;
  }
}
