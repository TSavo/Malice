import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

type MethodSource = {
  filePath: string;
  methodName: string;
  code: string;
};

type MethodIssue = {
  filePath: string;
  methodName: string;
  message: string;
};

type MethodFile = {
  filePath: string;
  prefixLines: number;
};

const bootstrapRoot = path.join(process.cwd(), 'src/database/bootstrap');
const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');

const listTsFiles = (dir: string): string[] => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTsFiles(fullPath));
    } else if (entry.isFile() && fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
};

const unescapeTemplateLiteral = (value: string): string => {
  return value
    .replace(/\\\${/g, '${')
    .replace(/\\`/g, '`')
    .replace(/\\\\/g, '\\');
};

const extractStringLiteral = (node: ts.Expression): string | null => {
  if (ts.isStringLiteral(node)) {
    return node.text;
  }
  if (ts.isNoSubstitutionTemplateLiteral(node)) {
    const raw = node.rawText ?? node.text;
    return unescapeTemplateLiteral(raw);
  }
  return null;
};

const getPropertyName = (name: ts.PropertyName): string | null => {
  if (ts.isIdentifier(name)) {
    return name.text;
  }
  if (ts.isStringLiteral(name)) {
    return name.text;
  }
  if (ts.isNumericLiteral(name)) {
    return name.text;
  }
  return null;
};

const isValidIdentifier = (name: string): boolean => {
  return /^[A-Za-z_$][\w$]*$/.test(name);
};

const loadCompilerOptions = (): ts.CompilerOptions => {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    process.cwd(),
  );

  return {
    ...parsed.options,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    strict: false,
    noImplicitAny: false,
    noImplicitReturns: false,
    noUnusedLocals: false,
    noUnusedParameters: false,
    skipLibCheck: true,
    types: [],
    noEmit: true,
  };
};

const collectMethodsFromFile = (filePath: string): MethodSource[] => {
  const contents = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    contents,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
  const methods: MethodSource[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const callExpression = node.expression;
      if (
        ts.isPropertyAccessExpression(callExpression) &&
        callExpression.name.text === 'setMethod'
      ) {
        const args = node.arguments;
        if (args.length >= 2) {
          const methodName = extractStringLiteral(args[0]);
          const code = extractStringLiteral(args[1]);
          if (methodName && code !== null) {
            methods.push({ filePath, methodName, code });
          }
        }
      }
    }

    if (ts.isPropertyAssignment(node)) {
      const propName = getPropertyName(node.name);
      if (propName === 'methods' && ts.isObjectLiteralExpression(node.initializer)) {
        for (const prop of node.initializer.properties) {
          if (!ts.isPropertyAssignment(prop)) {
            continue;
          }
          const methodName = getPropertyName(prop.name);
          if (!methodName) {
            continue;
          }
          const code = extractStringLiteral(prop.initializer as ts.Expression);
          if (code !== null) {
            methods.push({ filePath, methodName, code });
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return methods;
};

const collectAliasesFromFile = (filePath: string): string[] => {
  const contents = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    contents,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
  const aliases: string[] = [];

  const collectProvides = (initializer?: ts.Expression): void => {
    if (initializer && ts.isArrayLiteralExpression(initializer)) {
      for (const element of initializer.elements) {
        const aliasName = extractStringLiteral(element as ts.Expression);
        if (aliasName) {
          aliases.push(aliasName);
        }
      }
    }
  };

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const callExpression = node.expression;
      if (ts.isPropertyAccessExpression(callExpression)) {
        const methodName = callExpression.name.text;
        if (
          methodName === 'addAlias' ||
          methodName === 'define' ||
          methodName === 'registerAlias' ||
          methodName === 'registerAliasById'
        ) {
          const args = node.arguments;
          if (args.length >= 1) {
            const aliasName = extractStringLiteral(args[0]);
            if (aliasName) {
              aliases.push(aliasName);
            }
          }
        }

        if (methodName === 'call') {
          const args = node.arguments;
          if (args.length >= 2) {
            const commandName = extractStringLiteral(args[0]);
            if (commandName === 'addAlias') {
              const aliasName = extractStringLiteral(args[1]);
              if (aliasName) {
                aliases.push(aliasName);
              }
            }
          }
        }
      }
    }

    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      const left = node.left;
      if (ts.isPropertyAccessExpression(left) && ts.isIdentifier(left.expression)) {
        if (left.expression.text === 'aliases') {
          aliases.push(left.name.text);
        }
      }
      if (ts.isElementAccessExpression(left) && ts.isIdentifier(left.expression)) {
        if (left.expression.text === 'aliases') {
          const aliasName = extractStringLiteral(left.argumentExpression);
          if (aliasName) {
            aliases.push(aliasName);
          }
        }
      }
    }

    if (ts.isPropertyAssignment(node)) {
      const propName = getPropertyName(node.name);
      if (propName === 'alias') {
        const aliasName = extractStringLiteral(node.initializer as ts.Expression);
        if (aliasName) {
          aliases.push(aliasName);
        }
      }
      if (propName === 'provides') {
        collectProvides(node.initializer);
      }
    }

    if (ts.isPropertyDeclaration(node)) {
      const propName = node.name && getPropertyName(node.name);
      if (propName === 'provides') {
        collectProvides(node.initializer ?? undefined);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return aliases;
};

const buildContextDts = (aliasNames: string[]): string => {
  const aliasDeclarations = aliasNames
    .filter((alias) => isValidIdentifier(alias))
    .map((alias) => `  const $${alias}: any;`)
    .join('\n');

  return `export {};

declare global {
  const $: any;
  const self: any;
  const args: any[];
  const context: unknown;
  const player: any | null;
  const command: string;
  const pass: (...args: unknown[]) => Promise<unknown>;
  const methodName: string;
  const _aliases: Record<string, any>;
  const $load: (...args: unknown[]) => Promise<unknown>;
  const $create: (...args: unknown[]) => Promise<unknown>;
  const $query: (...args: unknown[]) => Promise<unknown>;
  const $aiQuery: (...args: unknown[]) => Promise<unknown>;
  const $addAlias: (...args: unknown[]) => Promise<unknown>;
  const $removeAlias: (...args: unknown[]) => Promise<unknown>;
  const $getAlias: (...args: unknown[]) => Promise<unknown>;
  const $clearAliasesForObject: (...args: unknown[]) => Promise<unknown>;
  const $aliases: Record<string, any>;
  const $db: unknown;
  const $evictFromCache: (...args: unknown[]) => void;
  const $getInheritanceChain: (...args: unknown[]) => Promise<unknown>;
${aliasDeclarations}
}
`;
};

const formatDiagnostic = (
  code: string,
  diagnostic: ts.Diagnostic,
  prefixLines: number,
): string => {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  const position = diagnostic.start ?? 0;
  const methodFile = ts.createSourceFile(
    'method.ts',
    code,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
  const { line, character } = methodFile.getLineAndCharacterOfPosition(position);
  const adjustedLine = Math.max(0, line - prefixLines) + 1;
  const adjustedCharacter = character + 1;
  return `Line ${adjustedLine}:${adjustedCharacter} - ${message}`;
};

const shouldReportDiagnostic = (diagnostic: ts.Diagnostic): boolean => {
  const code = diagnostic.code;
  const isSyntaxError = code >= 1000 && code < 2000;
  const allowedCodes = new Set([2304, 2307, 2552]);
  return isSyntaxError || allowedCodes.has(code);
};

const compileMethods = (
  methods: MethodSource[],
  aliasNames: string[],
): MethodIssue[] => {
  const compilerOptions = loadCompilerOptions();
  const virtualFiles = new Map<string, string>();
  const methodFiles = new Map<string, MethodFile>();

  const virtualRoot = path.join(process.cwd(), '.moo-virtual');
  const contextFile = path.join(virtualRoot, 'moo-context.d.ts');
  virtualFiles.set(contextFile, buildContextDts(aliasNames));

  methods.forEach((method, index) => {
    const prefix = `async function __moo_method_${index}() {\n`;
    const suffix = '\n}\n';
    const filePath = path.join(virtualRoot, `method-${index}.ts`);
    virtualFiles.set(filePath, `${prefix}${method.code}${suffix}`);
    methodFiles.set(filePath, {
      filePath: method.filePath,
      prefixLines: prefix.split('\n').length - 1,
    });
  });

  const extraRoots: string[] = [];
  const maliceDir = path.join(process.cwd(), '.malice');
  if (fs.existsSync(maliceDir)) {
    const maliceFiles = listTsFiles(maliceDir).filter((file) =>
      file.endsWith('.d.ts'),
    );
    extraRoots.push(...maliceFiles);
  }

  const rootNames = [...virtualFiles.keys(), ...extraRoots];
  const host = ts.createCompilerHost(compilerOptions, true);

  const defaultFileExists = host.fileExists.bind(host);
  host.fileExists = (fileName): boolean => {
    if (virtualFiles.has(fileName)) {
      return true;
    }
    return defaultFileExists(fileName);
  };

  const defaultReadFile = host.readFile.bind(host);
  host.readFile = (fileName): string | undefined => {
    if (virtualFiles.has(fileName)) {
      return virtualFiles.get(fileName);
    }
    return defaultReadFile(fileName);
  };

  const defaultGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (
    fileName,
    languageVersion,
    onError,
    shouldCreateNewSourceFile,
  ): ts.SourceFile | undefined => {
    if (virtualFiles.has(fileName)) {
      const contents = virtualFiles.get(fileName) ?? '';
      return ts.createSourceFile(fileName, contents, languageVersion, true);
    }
    return defaultGetSourceFile(
      fileName,
      languageVersion,
      onError,
      shouldCreateNewSourceFile,
    );
  };

  const program = ts.createProgram({
    rootNames,
    options: compilerOptions,
    host,
  });

  const diagnostics = ts.getPreEmitDiagnostics(program);
  const issues: MethodIssue[] = [];

  for (const diagnostic of diagnostics) {
    if (!shouldReportDiagnostic(diagnostic)) {
      continue;
    }
    const fileName = diagnostic.file?.fileName;
    if (!fileName) {
      continue;
    }
    const methodInfo = methodFiles.get(fileName);
    if (!methodInfo) {
      continue;
    }
    const methodIndex = Number(path.basename(fileName).match(/method-(\d+)\.ts/)?.[1]);
    const method = methods[methodIndex];
    if (!method) {
      continue;
    }
    issues.push({
      filePath: method.filePath,
      methodName: method.methodName,
      message: formatDiagnostic(method.code, diagnostic, methodInfo.prefixLines),
    });
  }

  return issues;
};

const run = (): void => {
  const files = listTsFiles(bootstrapRoot);
  const methods: MethodSource[] = [];
  const aliases = new Set<string>();

  for (const filePath of files) {
    methods.push(...collectMethodsFromFile(filePath));
    for (const alias of collectAliasesFromFile(filePath)) {
      aliases.add(alias);
    }
  }

  const issues = compileMethods(methods, [...aliases]);

  if (issues.length > 0) {
    console.error('MOO method compilation failed with errors:');
    for (const issue of issues) {
      console.error(
        `- ${issue.filePath} [${issue.methodName}]: ${issue.message}`,
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log('MOO method compilation check passed.');
};

run();
