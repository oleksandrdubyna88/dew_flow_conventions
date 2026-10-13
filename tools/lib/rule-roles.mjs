import {clean,parseRoleTable} from "./role-table.mjs";

/** The role table of a rule file as rows `{role, model}` (lower-cased), read from the worktree being judged. */
export const roleRowsOf=markdown=>parseRoleTable(markdown);

/** The role a launch declares: its `description` up to the first colon, cleaned like a table cell; `""` without a colon. */
export function declaredRole(description) {
  const text=String(description??""),colon=text.indexOf(":");
  return colon<0?"":clean(text.slice(0,colon));
}

function modelFailures(launches,rows) {
  const table=new Map(rows.map(row=>[row.role,row.model]));
  return launches.flatMap(({launch,role,number})=> {
    if(!table.has(role))return [`launch ${number} declared no role from the table (description "${launch.description}")`];
    const want=table.get(role)==="main session or sonnet"?"sonnet":table.get(role);
    return launch.model===want?[]:[`launch ${number} (role "${role}") ran on ${launch.model??"no model"}, the table says ${table.get(role)}`];
  });
}

function structureFailures(tagged,spec) {
  const byRole=name=>tagged.filter(item=>item.role===name);
  const [scouts,coders,judges]=["scout","coder","judge"].map(byRole);
  const reasons=tagged.filter(item=>!["scout","coder","judge"].includes(item.role))
    .map(item=>`launch ${item.number} (role "${item.role}"): unexpected role for this task`);
  const minimum=(name,items,min)=>items.length<min?[`${items.length} ${name} launch(es), at least ${min} expected`]:[];
  reasons.push(...minimum("scout",scouts,spec.scouts?.min??0),...minimum("coder",coders,spec.coders?.min??0),...minimum("judge",judges,spec.judges?.min??0));
  const focus=spec.scouts?.focus??[];
  const missing=focus.filter(token=>!scouts.some(item=>item.launch.prompt.includes(token)));
  if(missing.length)reasons.push(`scouts together do not cover: ${missing.join(", ")}`);
  if(spec.judges?.afterCoder&&coders.length&&!judges.some(item=>item.number>coders[0].number))reasons.push("no judge launched after the first coder (no review)");
  return reasons;
}

/**
 * Failures of the role model: every launch declares a role from the table, runs the table's model for it, and the
 * counts by declared role meet the minimums of `spec` (`{scouts:{min,focus}, coders:{min}, judges:{min,afterCoder}}`).
 */
export function roleFailures(launches,rows,spec) {
  const tagged=launches.map((launch,index)=>({launch,number:index+1,role:declaredRole(launch.description)}));
  return [...modelFailures(tagged,rows),...structureFailures(tagged.filter(item=>rows.some(row=>row.role===item.role)),spec)];
}
