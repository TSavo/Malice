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

const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  strict: false,
  esModuleInterop: true,
  skipLibCheck: true,
};

const bootstrapRoot = path.join(process.cwd(), 'src/database/bootstrap');

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

const extractStringLiteral = (node: ts.Expression): string | null => {
  if (ts.isStringLiteral(node)) {
    return node.text;
  }
  if (ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
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

const formatDiagnostic = (code: string, diagnostic: ts.Diagnostic): string => {
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
  return `Line ${line + 1}:${character + 1} - ${message}`;
};

const compileMethod = (method: MethodSource): MethodIssue[] => {
  const result = ts.transpileModule(method.code, { compilerOptions });
  if (!result.diagnostics || result.diagnostics.length === 0) {
    return [];
  }
  return result.diagnostics.map((diagnostic) => ({
    filePath: method.filePath,
    methodName: method.methodName,
    message: formatDiagnostic(method.code, diagnostic),
  }));
};

const run = (): void => {
  const files = listTsFiles(bootstrapRoot);
  const issues: MethodIssue[] = [];

  for (const filePath of files) {
    const methods = collectMethodsFromFile(filePath);
    for (const method of methods) {
      issues.push(...compileMethod(method));
    }
  }

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
