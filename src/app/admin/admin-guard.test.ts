import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import ts from "typescript";

// Server Actions are public POST endpoints: the proxy does not reliably guard them (see requireAdminSession in
// src/lib/auth.ts), so every exported action must check the session before it does anything else.
const SOURCE_ROOT = path.join(process.cwd(), "src");
const PROTECTED_ROOT = path.join(SOURCE_ROOT, "app/admin/(protected)");

/** Actions that must work without a session, with the reason. Paths are relative to src/. */
const INTENTIONALLY_PUBLIC: Record<string, string> = {
  "app/admin/login/actions.ts": "the login action is what creates the session",
};

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts"))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

function isUseServerDirective(statement: ts.Statement) {
  return ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression) && statement.expression.text === "use server";
}

function isGuardCall(statement: ts.Statement | undefined) {
  return (
    statement !== undefined &&
    ts.isExpressionStatement(statement) &&
    ts.isAwaitExpression(statement.expression) &&
    ts.isCallExpression(statement.expression.expression) &&
    statement.expression.expression.expression.getText() === "requireAdminSession"
  );
}

function hasExportModifier(node: ts.Node) {
  return ts.canHaveModifiers(node) && (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

/** Returns "file: name" for each exported action whose first statement is not `await requireAdminSession()`. */
function findUnguardedActions(file: string): { checked: number; problems: string[] } {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const relative = path.relative(SOURCE_ROOT, file);
  const problems: string[] = [];
  let checked = 0;

  const check = (name: string, body: ts.ConciseBody | undefined) => {
    checked += 1;
    if (!body || !ts.isBlock(body) || !isGuardCall(body.statements[0])) problems.push(`${relative}: ${name}`);
  };

  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && hasExportModifier(statement)) {
      check(statement.name?.text ?? "default", statement.body);
    } else if (ts.isVariableStatement(statement) && hasExportModifier(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const initializer = declaration.initializer;
        const body = initializer && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) ? initializer.body : undefined;
        check(declaration.name.getText(), body);
      }
    } else if (ts.isExportDeclaration(statement) || ts.isExportAssignment(statement)) {
      // Re-exported or default-assigned actions cannot be checked here; write them as exported functions instead.
      problems.push(`${relative}: unsupported export form "${statement.getText().slice(0, 40)}"`);
    }
  }
  return { checked, problems };
}

test("every admin Server Action checks the session first", () => {
  const serverActionFiles = listSourceFiles(SOURCE_ROOT).filter((file) => /["']use server["']/.test(readFileSync(file, "utf8")));

  const problems: string[] = [];
  let checkedFunctions = 0;
  let checkedFiles = 0;
  for (const file of serverActionFiles) {
    const relative = path.relative(SOURCE_ROOT, file);
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    // An inline "use server" inside a component would create actions this scan cannot see.
    if (!source.statements.some(isUseServerDirective)) {
      problems.push(`${relative}: "use server" is only allowed as a file-level directive`);
      continue;
    }
    if (relative in INTENTIONALLY_PUBLIC) continue;
    assert.ok(file.startsWith(PROTECTED_ROOT + path.sep), `${relative}: Server Actions outside admin/(protected) need an entry in INTENTIONALLY_PUBLIC`);
    const result = findUnguardedActions(file);
    checkedFunctions += result.checked;
    checkedFiles += 1;
    problems.push(...result.problems);
  }

  assert.deepEqual(problems, []);
  // Guards against the scan silently finding nothing after a move or rename.
  assert.ok(checkedFiles >= 13 && checkedFunctions >= 36, `checked ${checkedFunctions} actions in ${checkedFiles} files`);
});

test("intentional exceptions still exist", () => {
  for (const relative of Object.keys(INTENTIONALLY_PUBLIC)) {
    assert.match(readFileSync(path.join(SOURCE_ROOT, relative), "utf8"), /["']use server["']/);
  }
});
