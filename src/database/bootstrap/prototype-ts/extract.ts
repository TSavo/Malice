import * as ts from 'typescript';

export type PrototypeDecoratorInfo = {
  alias: string;
  parent: string;
};

export type ExtractedPrototypeMethod = {
  name: string;
  code: string;
};

export type ExtractedPrototypeSpec = {
  alias: string;
  parent: string;
  properties: Record<string, unknown>;
  methods: Record<string, ExtractedPrototypeMethod>;
  sourceFile?: string;
};

export type ExtractOptions = {
  decoratorName?: string;
  defaultsPropertyName?: string;
  requiredPrefixParams?: string[];
};

const DEFAULT_OPTIONS: Required<ExtractOptions> = {
  decoratorName: 'prototype',
  defaultsPropertyName: 'defaults',
  requiredPrefixParams: ['self', '$', 'pass'],
};

export function extractPrototypeSpecFromSourceText(
  sourceText: string,
  fileName = 'prototype.ts',
  options: ExtractOptions = {},
): ExtractedPrototypeSpec {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };

  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TS,
  );

  const exportedClass = findExportedDecoratedClass(
    sourceFile,
    resolvedOptions.decoratorName,
  );
  if (!exportedClass) {
    throw new Error(
      `No exported class decorated with @${resolvedOptions.decoratorName} found in ${fileName}`,
    );
  }

  const decoratorInfo = getPrototypeDecoratorInfo(
    exportedClass,
    resolvedOptions.decoratorName,
  );

  const defaults = getStaticDefaultsObjectLiteral(
    exportedClass,
    resolvedOptions.defaultsPropertyName,
  );

  const properties = parseObjectLiteralToJsonish(defaults);

  const methods = extractMethods(
    sourceFile,
    exportedClass,
    resolvedOptions.requiredPrefixParams,
  );

  return {
    alias: decoratorInfo.alias,
    parent: decoratorInfo.parent,
    properties,
    methods,
    sourceFile: fileName,
  };
}

function findExportedDecoratedClass(
  sourceFile: ts.SourceFile,
  decoratorName: string,
): ts.ClassDeclaration | null {
  const matches: ts.ClassDeclaration[] = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isClassDeclaration(statement)) continue;

    const hasExport =
      statement.modifiers?.some(
        (modifier) =>
          modifier.kind === ts.SyntaxKind.ExportKeyword ||
          modifier.kind === ts.SyntaxKind.DefaultKeyword,
      ) ?? false;

    if (!hasExport) continue;

    const decorators = ts.getDecorators(statement) ?? [];
    const isMatch = decorators.some((decorator) =>
      isDecoratorCallNamed(decorator, decoratorName),
    );
    if (isMatch) matches.push(statement);
  }

  if (matches.length === 0) return null;
  if (matches.length > 1) {
    throw new Error(
      `Multiple exported classes decorated with @${decoratorName} found in ${sourceFile.fileName}; only one is supported`,
    );
  }

  return matches[0];
}

function isDecoratorCallNamed(
  decorator: ts.Decorator,
  decoratorName: string,
): boolean {
  const expr = decorator.expression;
  if (!ts.isCallExpression(expr)) return false;
  if (!ts.isIdentifier(expr.expression)) return false;
  return expr.expression.text === decoratorName;
}

function getPrototypeDecoratorInfo(
  classDecl: ts.ClassDeclaration,
  decoratorName: string,
): PrototypeDecoratorInfo {
  const decorators = ts.getDecorators(classDecl) ?? [];
  const decorator = decorators.find((d) =>
    isDecoratorCallNamed(d, decoratorName),
  );
  if (!decorator) {
    throw new Error(`Class is missing @${decoratorName} decorator`);
  }

  const callExpr = decorator.expression as ts.CallExpression;
  const arg0 = callExpr.arguments[0];
  if (!arg0 || !ts.isObjectLiteralExpression(arg0)) {
    throw new Error(
      `@${decoratorName} must be called with an object literal argument`,
    );
  }

  const alias = readRequiredStringProperty(arg0, 'alias');
  const parent = readRequiredStringProperty(arg0, 'parent');

  return { alias, parent };
}

function readRequiredStringProperty(
  obj: ts.ObjectLiteralExpression,
  key: string,
): string {
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    if (!ts.isIdentifier(prop.name) && !ts.isStringLiteral(prop.name)) continue;

    const name = ts.isIdentifier(prop.name) ? prop.name.text : prop.name.text;
    if (name !== key) continue;

    if (!ts.isStringLiteral(prop.initializer)) {
      throw new Error(`@prototype.${key} must be a string literal`);
    }

    return prop.initializer.text;
  }

  throw new Error(`@prototype is missing required '${key}' field`);
}

function getStaticDefaultsObjectLiteral(
  classDecl: ts.ClassDeclaration,
  defaultsPropertyName: string,
): ts.ObjectLiteralExpression {
  for (const member of classDecl.members) {
    if (!ts.isPropertyDeclaration(member)) continue;

    const isStatic =
      member.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword) ??
      false;
    if (!isStatic) continue;

    if (
      !member.name ||
      (!ts.isIdentifier(member.name) && !ts.isStringLiteral(member.name))
    )
      continue;
    const name = ts.isIdentifier(member.name)
      ? member.name.text
      : member.name.text;
    if (name !== defaultsPropertyName) continue;

    if (
      !member.initializer ||
      !ts.isObjectLiteralExpression(member.initializer)
    ) {
      throw new Error(
        `static ${defaultsPropertyName} must be an object literal`,
      );
    }

    return member.initializer;
  }

  throw new Error(
    `Missing static ${defaultsPropertyName} object literal on prototype class`,
  );
}

function parseObjectLiteralToJsonish(
  obj: ts.ObjectLiteralExpression,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) {
      throw new Error('defaults object must contain only property assignments');
    }

    if (!ts.isIdentifier(prop.name) && !ts.isStringLiteral(prop.name)) {
      throw new Error(
        'defaults object keys must be identifiers or string literals',
      );
    }

    const key = ts.isIdentifier(prop.name) ? prop.name.text : prop.name.text;
    result[key] = parseJsonishExpression(prop.initializer);
  }

  return result;
}

function parseJsonishExpression(expr: ts.Expression): unknown {
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
    return expr.text;
  }

  if (ts.isNumericLiteral(expr)) {
    return Number(expr.text);
  }

  // Support negative numbers like `-1`
  if (ts.isPrefixUnaryExpression(expr)) {
    if (expr.operator === ts.SyntaxKind.PlusToken) {
      return parseJsonishExpression(expr.operand);
    }

    if (expr.operator === ts.SyntaxKind.MinusToken) {
      const value = parseJsonishExpression(expr.operand);
      if (typeof value !== 'number') {
        throw new Error(
          'Unary minus in defaults is only supported for numbers',
        );
      }
      return -value;
    }
  }

  if (expr.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (expr.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (expr.kind === ts.SyntaxKind.NullKeyword) return null;

  if (ts.isArrayLiteralExpression(expr)) {
    return expr.elements.map((el) => {
      if (el.kind === ts.SyntaxKind.OmittedExpression) {
        throw new Error('defaults array elements may not be omitted');
      }

      if (ts.isSpreadElement(el)) {
        throw new Error('defaults array elements may not use spread');
      }

      if (!ts.isExpression(el)) {
        throw new Error('defaults array elements must be expressions');
      }

      return parseJsonishExpression(el);
    });
  }

  if (ts.isObjectLiteralExpression(expr)) {
    return parseObjectLiteralToJsonish(expr);
  }

  // Allow `foo as string[]` and other assertions in defaults
  if (ts.isAsExpression(expr) || ts.isTypeAssertionExpression(expr)) {
    return parseJsonishExpression(expr.expression);
  }

  throw new Error(
    `Unsupported defaults expression kind: ${ts.SyntaxKind[expr.kind]}`,
  );
}

function extractMethods(
  sourceFile: ts.SourceFile,
  classDecl: ts.ClassDeclaration,
  requiredPrefixParams: string[],
): Record<string, ExtractedPrototypeMethod> {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const methods: Record<string, ExtractedPrototypeMethod> = {};

  for (const member of classDecl.members) {
    if (!ts.isMethodDeclaration(member)) continue;

    // Ignore constructor
    if (
      member.name &&
      ts.isIdentifier(member.name) &&
      member.name.text === 'constructor'
    )
      continue;

    const isStatic =
      member.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword) ??
      false;
    if (isStatic) continue;

    if (
      !member.name ||
      (!ts.isIdentifier(member.name) && !ts.isStringLiteral(member.name))
    ) {
      throw new Error('Method name must be identifier or string literal');
    }

    const methodName = ts.isIdentifier(member.name)
      ? member.name.text
      : member.name.text;

    const params = member.parameters.map((p) => {
      if (p.dotDotDotToken) {
        throw new Error(
          `Method '${methodName}' rest parameters are not supported`,
        );
      }

      if (!ts.isIdentifier(p.name)) {
        throw new Error(
          `Method '${methodName}' parameter must be an identifier`,
        );
      }

      return p.name.text;
    });

    for (let i = 0; i < requiredPrefixParams.length; i++) {
      if (params[i] !== requiredPrefixParams[i]) {
        throw new Error(
          `Method '${methodName}' must declare prefix params (${requiredPrefixParams.join(', ')}) in order`,
        );
      }
    }

    if (!member.body) {
      throw new Error(`Method '${methodName}' must have a body`);
    }

    const mappedArgs = params.slice(requiredPrefixParams.length);
    const argBindings = mappedArgs
      .map((name, index) => `let ${name} = args[${index}];`)
      .join('\n');

    const bodyStatements = member.body.statements
      .map((stmt) =>
        printer.printNode(ts.EmitHint.Unspecified, stmt, sourceFile),
      )
      .join('\n');

    const code = [argBindings, bodyStatements].filter(Boolean).join('\n\n');

    methods[methodName] = { name: methodName, code };
  }

  return methods;
}
