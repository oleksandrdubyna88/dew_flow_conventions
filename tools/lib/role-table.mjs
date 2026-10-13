/**
 * The role table of `common/subagent-models.md`, read as data.
 *
 * <p>The subagent-model hook carries a digest of that table and reads no file. This module is how a test
 * (and later the smoke) compares the digest with the rule it was written from, so the two cannot drift
 * apart unnoticed. The hook never imports it.</p>
 */

const MODELS = ['sonnet', 'opus', 'fable', 'main session or sonnet'];

/** A cell reduced to comparable text: links to their text, emphasis and code marks gone, lowercase. */
export function clean(cell) {
  return String(cell)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replaceAll('**', '')
    .replaceAll('*', '')
    .replaceAll('`', '')
    .replaceAll('\\|', '|')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** The cells of one table row: split on unescaped pipes, the empty outer pieces dropped. */
function cellsOf(line) {
  const pieces = line.trim().split(/(?<!\\)\|/);

  return pieces.slice(1, pieces.at(-1).trim() === '' ? -1 : undefined);
}

const isSeparator = line => /^\|[\s|:-]+\|?\s*$/.test(line.trim()) && line.includes('-');

/** Every GFM table in the text: a run of `|` lines whose second line is a separator. */
function tablesIn(markdown) {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n');
  const tables = [];
  let run = [];
  for (const line of [...lines, '']) {
    if (line.trimStart().startsWith('|')) {
      run.push(line);
      continue;
    }
    if (run.length >= 2 && isSeparator(run[1])) tables.push(run);
    run = [];
  }

  return tables;
}

/**
 * The rule's role table as `{ role, model }` rows.
 *
 * @throws {Error} when no table's header has `Model` as its second cell, or a body row has one cell.
 */
export function parseRoleTable(markdown) {
  const table = tablesIn(markdown).find(rows => clean(cellsOf(rows[0])[1] ?? '') === 'model');
  if (!table) throw new Error('no role table in the rule: no table whose header\'s second cell is "Model"');

  return table.slice(2).map(line => {
    const cells = cellsOf(line);
    if (cells.length < 2) throw new Error(`role table row has fewer than two cells: ${line}`);

    return { role: clean(cells[0]), model: clean(cells[1]) };
  });
}

/** Roles that appear more than once, by cleaned name. */
const duplicates = entries => {
  const seen = new Set();

  return [...new Set(entries.map(entry => clean(entry.role)).filter(role => seen.size === seen.add(role).size))];
};

/** The differences between the hook's digest and the rule's rows, as sentences; `[]` when they agree. */
export function digestMismatches(digest, rows) {
  const hook = new Map(digest.map(entry => [clean(entry.role), entry.model]));
  const rule = new Map(rows.map(row => [clean(row.role), row.model]));
  const out = [
    ...duplicates(rows).map(role => `duplicate role "${role}" in the rule`),
    ...duplicates(digest).map(role => `duplicate role "${role}" in the hook`),
  ];
  for (const [role, model] of rule) {
    if (!MODELS.includes(model)) out.push(`rule row "${role}": model "${model}" is not one of ${MODELS.join(', ')}`);
    if (!hook.has(role)) out.push(`rule row "${role}" (${model}) is missing from the hook's ROLE_DIGEST`);
    else if (hook.get(role) !== model) out.push(`"${role}": rule says ${model}, hook says ${hook.get(role)}`);
  }
  for (const role of hook.keys()) {
    if (!rule.has(role)) out.push(`hook entry "${role}" is not in the rule's table`);
  }

  return out;
}
