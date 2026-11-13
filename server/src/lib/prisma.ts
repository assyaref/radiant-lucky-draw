/**
 * Prisma-compatible database client (Supabase edition)
 *
 * The backend now runs as a Supabase Edge Function (Deno), where the Prisma
 * query engine cannot run. This module implements the subset of the Prisma
 * Client API the codebase uses, on top of the `postgres` driver, so the
 * repositories and services keep working unchanged.
 *
 * Supported:
 *   model.findMany / findFirst / findUnique / count
 *   model.create / createMany / update / updateMany / upsert / delete / deleteMany
 *   where: equals, null, in, notIn, lt, lte, gt, gte, not, contains/startsWith/
 *          endsWith (+ mode: 'insensitive'), AND / OR / NOT, relation some/none/every/is
 *   orderBy, skip, take, select, include (nested), _count
 *   data: increment / decrement / multiply / set
 *   $transaction(fn | promise[]), $queryRaw``, $queryRawUnsafe, $executeRaw``, $executeRawUnsafe
 *
 * Model metadata is generated from prisma/schema.prisma (scripts/gen-db-meta.ts).
 */

import postgres from 'postgres';
import { DB_META } from './db-meta';

type Sql = postgres.Sql<any> | postgres.TransactionSql<any>;
type AnyObj = Record<string, any>;

interface FieldMeta {
  column: string;
  type: string;
  optional: boolean;
  defaultUuid?: boolean;
  defaultNow?: boolean;
  updatedAt?: boolean;
}
interface RelationMeta {
  model: string;
  list: boolean;
  fields?: readonly string[];
  references?: readonly string[];
  foreignFields?: readonly string[];
  foreignReferences?: readonly string[];
}
interface ModelMeta {
  table: string;
  fields: Record<string, FieldMeta>;
  relations: Record<string, RelationMeta>;
}

const META = DB_META as unknown as Record<string, ModelMeta>;

const q = (ident: string) => `"${ident.replace(/"/g, '""')}"`;
const lowerFirst = (s: string) => s[0].toLowerCase() + s.slice(1);

// ─── Errors ─────────────────────────────────────────────────────────────

export class PrismaClientKnownRequestError extends Error {
  code: string;
  meta?: AnyObj;
  constructor(message: string, code: string, meta?: AnyObj) {
    super(message);
    this.name = 'PrismaClientKnownRequestError';
    this.code = code;
    this.meta = meta;
  }
}

function mapError(err: any): never {
  if (err && typeof err === 'object' && err.code) {
    if (err.code === '23505') {
      throw new PrismaClientKnownRequestError(err.message, 'P2002', {
        target: err.constraint_name ?? err.constraint,
      });
    }
    if (err.code === '23503') {
      throw new PrismaClientKnownRequestError(err.message, 'P2003', {
        field_name: err.constraint_name ?? err.constraint,
      });
    }
  }
  throw err;
}

// ─── Value serialisation ────────────────────────────────────────────────

function toDb(field: FieldMeta, value: any): any {
  if (value === null || value === undefined) return null;
  if (field.type === 'Json') return JSON.stringify(value);
  if (field.type === 'DateTime') {
    const d = value instanceof Date ? value : new Date(value);
    return d.toISOString();
  }
  return value;
}

function castFor(field: FieldMeta): string {
  switch (field.type) {
    case 'Json':
      return '::jsonb';
    case 'DateTime':
      return '::timestamptz::timestamp';
    default:
      return '';
  }
}

function fromDb(field: FieldMeta, value: any): any {
  if (value === null || value === undefined) return null;
  if (field.type === 'DateTime') {
    if (value instanceof Date) return value;
    // timestamp without time zone — stored as UTC by convention
    return new Date(String(value).replace(' ', 'T') + (String(value).match(/Z|[+-]\d\d:?\d\d$/) ? '' : 'Z'));
  }
  if (field.type === 'Int') return typeof value === 'number' ? value : parseInt(value, 10);
  if (field.type === 'Float') return typeof value === 'number' ? value : parseFloat(value);
  if (field.type === 'Json' && typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function rowToRecord(meta: ModelMeta, row: AnyObj): AnyObj {
  const rec: AnyObj = {};
  for (const [name, f] of Object.entries(meta.fields)) {
    if (f.column in row) rec[name] = fromDb(f, row[f.column]);
  }
  return rec;
}

// ─── Query builder ──────────────────────────────────────────────────────

class Params {
  values: any[] = [];
  add(v: any, cast = ''): string {
    this.values.push(v);
    return `$${this.values.length}${cast}`;
  }
}

const SCALAR_OPS = new Set([
  'equals', 'in', 'notIn', 'lt', 'lte', 'gt', 'gte', 'not',
  'contains', 'startsWith', 'endsWith', 'mode',
]);

function compileScalar(field: FieldMeta, col: string, cond: any, p: Params): string {
  const cast = castFor(field);
  if (cond === null) return `${col} IS NULL`;
  if (cond === undefined) return 'TRUE';
  const isOpObj =
    typeof cond === 'object' &&
    !(cond instanceof Date) &&
    !Array.isArray(cond) &&
    Object.keys(cond).length > 0 &&
    Object.keys(cond).every((k) => SCALAR_OPS.has(k));
  if (!isOpObj) return `${col} = ${p.add(toDb(field, cond), cast)}`;

  const parts: string[] = [];
  const insensitive = cond.mode === 'insensitive';
  const like = insensitive ? 'ILIKE' : 'LIKE';
  const esc = (s: string) => String(s).replace(/[\\%_]/g, (c) => '\\' + c);
  for (const [op, v] of Object.entries(cond)) {
    if (v === undefined || op === 'mode') continue;
    switch (op) {
      case 'equals':
        parts.push(v === null ? `${col} IS NULL` : `${col} = ${p.add(toDb(field, v), cast)}`);
        break;
      case 'not':
        if (v === null) parts.push(`${col} IS NOT NULL`);
        else if (typeof v === 'object' && !(v instanceof Date))
          parts.push(`NOT (${compileScalar(field, col, v, p)})`);
        else parts.push(`${col} IS DISTINCT FROM ${p.add(toDb(field, v), cast)}`);
        break;
      case 'in':
      case 'notIn': {
        const arr = (v as any[]).map((x) => toDb(field, x));
        if (arr.length === 0) {
          parts.push(op === 'in' ? 'FALSE' : 'TRUE');
          break;
        }
        const list = arr.map((x) => p.add(x, cast)).join(', ');
        parts.push(op === 'in' ? `${col} IN (${list})` : `${col} NOT IN (${list})`);
        break;
      }
      case 'lt':
        parts.push(`${col} < ${p.add(toDb(field, v), cast)}`);
        break;
      case 'lte':
        parts.push(`${col} <= ${p.add(toDb(field, v), cast)}`);
        break;
      case 'gt':
        parts.push(`${col} > ${p.add(toDb(field, v), cast)}`);
        break;
      case 'gte':
        parts.push(`${col} >= ${p.add(toDb(field, v), cast)}`);
        break;
      case 'contains':
        parts.push(`${col} ${like} ${p.add('%' + esc(v as string) + '%')}`);
        break;
      case 'startsWith':
        parts.push(`${col} ${like} ${p.add(esc(v as string) + '%')}`);
        break;
      case 'endsWith':
        parts.push(`${col} ${like} ${p.add('%' + esc(v as string))}`);
        break;
    }
  }
  return parts.length ? parts.join(' AND ') : 'TRUE';
}

let aliasCounter = 0;

function compileWhere(model: string, where: AnyObj | undefined, alias: string, p: Params): string {
  if (!where) return 'TRUE';
  const meta = META[model];
  const parts: string[] = [];
  for (const [key, val] of Object.entries(where)) {
    if (val === undefined) continue;
    if (key === 'AND') {
      const arr = Array.isArray(val) ? val : [val];
      parts.push(arr.map((w) => `(${compileWhere(model, w, alias, p)})`).join(' AND ') || 'TRUE');
      continue;
    }
    if (key === 'OR') {
      const arr = val as AnyObj[];
      parts.push(arr.length ? '(' + arr.map((w) => `(${compileWhere(model, w, alias, p)})`).join(' OR ') + ')' : 'FALSE');
      continue;
    }
    if (key === 'NOT') {
      const arr = Array.isArray(val) ? val : [val];
      parts.push(arr.map((w) => `NOT (${compileWhere(model, w, alias, p)})`).join(' AND ') || 'TRUE');
      continue;
    }
    const field = meta.fields[key];
    if (field) {
      parts.push(compileScalar(field, `${alias}.${q(field.column)}`, val, p));
      continue;
    }
    const rel = meta.relations[key];
    if (rel) {
      parts.push(compileRelationFilter(model, rel, val, alias, p));
      continue;
    }
    // Compound unique input, e.g. { drawId_participantId: { drawId, participantId } }
    if (val && typeof val === 'object') {
      parts.push(compileWhere(model, val, alias, p));
      continue;
    }
    throw new Error(`[db] Unknown field ${model}.${key}`);
  }
  return parts.length ? parts.join(' AND ') : 'TRUE';
}

function joinCondition(rel: RelationMeta, parentModel: string, parentAlias: string, childAlias: string): string {
  const parent = META[parentModel];
  const child = META[rel.model];
  if (rel.fields && rel.references) {
    // parent holds FK
    return rel.fields
      .map((f, i) => `${childAlias}.${q(child.fields[rel.references![i]].column)} = ${parentAlias}.${q(parent.fields[f].column)}`)
      .join(' AND ');
  }
  return rel.foreignFields!
    .map((f, i) => `${childAlias}.${q(child.fields[f].column)} = ${parentAlias}.${q(parent.fields[rel.foreignReferences![i]].column)}`)
    .join(' AND ');
}

function compileRelationFilter(model: string, rel: RelationMeta, val: any, alias: string, p: Params): string {
  const child = META[rel.model];
  const a = `r${++aliasCounter}`;
  const join = joinCondition(rel, model, alias, a);
  const from = `${q(child.table)} ${a}`;
  if (rel.list) {
    const out: string[] = [];
    if (val.some !== undefined)
      out.push(`EXISTS (SELECT 1 FROM ${from} WHERE ${join} AND ${compileWhere(rel.model, val.some, a, p)})`);
    if (val.none !== undefined)
      out.push(`NOT EXISTS (SELECT 1 FROM ${from} WHERE ${join} AND ${compileWhere(rel.model, val.none, a, p)})`);
    if (val.every !== undefined)
      out.push(`NOT EXISTS (SELECT 1 FROM ${from} WHERE ${join} AND NOT (${compileWhere(rel.model, val.every, a, p)}))`);
    return out.join(' AND ') || 'TRUE';
  }
  if (val === null || val?.is === null) return `NOT EXISTS (SELECT 1 FROM ${from} WHERE ${join})`;
  if (val?.isNot === null) return `EXISTS (SELECT 1 FROM ${from} WHERE ${join})`;
  const inner = val?.is ?? val;
  return `EXISTS (SELECT 1 FROM ${from} WHERE ${join} AND ${compileWhere(rel.model, inner, a, p)})`;
}

function compileOrderBy(model: string, orderBy: any, alias: string): string {
  if (!orderBy) return '';
  const meta = META[model];
  const list = Array.isArray(orderBy) ? orderBy : [orderBy];
  const parts: string[] = [];
  for (const o of list) {
    for (const [k, dir] of Object.entries(o)) {
      const f = meta.fields[k];
      if (!f) continue;
      const d = typeof dir === 'object' ? (dir as any).sort : dir;
      const nulls = typeof dir === 'object' && (dir as any).nulls ? ` NULLS ${(dir as any).nulls.toUpperCase()}` : '';
      parts.push(`${alias}.${q(f.column)} ${String(d).toLowerCase() === 'desc' ? 'DESC' : 'ASC'}${nulls}`);
    }
  }
  return parts.length ? ` ORDER BY ${parts.join(', ')}` : '';
}

// ─── Relation loading (include / select) ────────────────────────────────

async function loadRelations(sql: Sql, model: string, records: AnyObj[], spec: AnyObj): Promise<void> {
  if (!records.length) return;
  const meta = META[model];
  for (const [key, opt] of Object.entries(spec)) {
    if (!opt) continue;
    if (key === '_count') {
      await loadCounts(sql, model, records, (opt as AnyObj).select ?? opt);
      continue;
    }
    const rel = meta.relations[key];
    if (!rel) continue;
    const sub: AnyObj = opt === true ? {} : (opt as AnyObj);
    const child = META[rel.model];
    let localKeys: readonly string[];
    let remoteKeys: readonly string[];
    if (rel.fields) {
      localKeys = rel.fields;
      remoteKeys = rel.references!;
    } else {
      localKeys = rel.foreignReferences!;
      remoteKeys = rel.foreignFields!;
    }
    // single-column keys only (all relations in this schema are single-column)
    const lk = localKeys[0];
    const rk = remoteKeys[0];
    const ids = [...new Set(records.map((r) => r[lk]).filter((v) => v !== null && v !== undefined))];
    if (!ids.length) {
      for (const r of records) r[key] = rel.list ? [] : null;
      continue;
    }
    const where = { AND: [{ [rk]: { in: ids } }, ...(sub.where ? [sub.where] : [])] };
    const needKey = sub.select && !sub.select[rk];
    const children = await findManyImpl(sql, rel.model, {
      where,
      orderBy: sub.orderBy,
      include: sub.include,
      select: needKey ? { ...sub.select, [rk]: true } : sub.select,
    });
    const groups = new Map<any, AnyObj[]>();
    for (const c of children) {
      const k = c[rk];
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(c);
    }
    for (const r of records) {
      let g = groups.get(r[lk]) ?? [];
      if (rel.list && (sub.skip || sub.take)) g = g.slice(sub.skip ?? 0, (sub.skip ?? 0) + (sub.take ?? g.length));
      if (needKey) g = g.map((c) => {
        const { [rk]: _drop, ...rest } = c;
        return rest;
      });
      r[key] = rel.list ? g : g[0] ?? null;
    }
    void child;
  }
}

async function loadCounts(sql: Sql, model: string, records: AnyObj[], select: AnyObj): Promise<void> {
  const meta = META[model];
  for (const r of records) r._count = r._count ?? {};
  for (const [key, on] of Object.entries(select)) {
    if (!on) continue;
    const rel = meta.relations[key];
    if (!rel || !rel.list) continue;
    const child = META[rel.model];
    const fk = child.fields[rel.foreignFields![0]].column;
    const pk = rel.foreignReferences![0];
    const ids = records.map((r) => r[pk]);
    const rows = await run(
      sql,
      `SELECT ${q(fk)} AS k, COUNT(*)::int AS c FROM ${q(child.table)} WHERE ${q(fk)}::text = ANY($1::text[]) GROUP BY ${q(fk)}`,
      [ids],
    );
    const map = new Map(rows.map((x: AnyObj) => [x.k, x.c]));
    for (const r of records) r._count[key] = map.get(r[pk]) ?? 0;
  }
}

// ─── Core operations ────────────────────────────────────────────────────

async function run(sql: Sql, text: string, params: any[]): Promise<AnyObj[]> {
  try {
    return (await (sql as any).unsafe(text, params)) as AnyObj[];
  } catch (e) {
    mapError(e);
  }
}

function applySelect(meta: ModelMeta, rec: AnyObj, select?: AnyObj): AnyObj {
  if (!select) return rec;
  const out: AnyObj = {};
  for (const [k, v] of Object.entries(select)) {
    if (v && meta.fields[k]) out[k] = rec[k];
  }
  return out;
}

async function findManyImpl(sql: Sql, model: string, args: AnyObj = {}): Promise<AnyObj[]> {
  const meta = META[model];
  const p = new Params();
  const alias = 't';
  let text = `SELECT ${alias}.* FROM ${q(meta.table)} ${alias} WHERE ${compileWhere(model, args.where, alias, p)}`;
  text += compileOrderBy(model, args.orderBy, alias);
  if (args.take !== undefined && args.take !== null) text += ` LIMIT ${Math.max(0, Number(args.take) | 0)}`;
  if (args.skip) text += ` OFFSET ${Math.max(0, Number(args.skip) | 0)}`;
  const rows = await run(sql, text, p.values);
  const full = rows.map((r) => rowToRecord(meta, r));

  // relations requested via include or via select
  const relSpec: AnyObj = {};
  if (args.include) Object.assign(relSpec, args.include);
  if (args.select) {
    for (const [k, v] of Object.entries(args.select)) if (!meta.fields[k] && v) relSpec[k] = v;
  }
  await loadRelations(sql, model, full, relSpec);

  if (!args.select) return full;
  return full.map((r) => {
    const out = applySelect(meta, r, args.select);
    for (const k of Object.keys(relSpec)) out[k] = r[k];
    return out;
  });
}

function buildInsert(meta: ModelMeta, data: AnyObj, p: Params): { cols: string[]; vals: string[] } {
  const cols: string[] = [];
  const vals: string[] = [];
  const now = new Date();
  for (const [name, f] of Object.entries(meta.fields)) {
    let v = data[name];
    if (v === undefined) {
      if (f.defaultUuid) v = crypto.randomUUID();
      else if (f.updatedAt || (f.defaultNow && f.type === 'DateTime')) v = now;
      else continue;
    }
    cols.push(q(f.column));
    vals.push(p.add(toDb(f, v), castFor(f)));
  }
  for (const k of Object.keys(data)) {
    if (data[k] !== undefined && !meta.fields[k]) throw new Error(`[db] Unsupported create field ${k}`);
  }
  return { cols, vals };
}

function buildSet(meta: ModelMeta, data: AnyObj, p: Params): string {
  const sets: string[] = [];
  let touchedUpdatedAt = false;
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    const f = meta.fields[k];
    if (!f) throw new Error(`[db] Unsupported update field ${k}`);
    const col = q(f.column);
    if (f.updatedAt) touchedUpdatedAt = true;
    if (v && typeof v === 'object' && !(v instanceof Date) && f.type !== 'Json') {
      if ('increment' in v) sets.push(`${col} = ${col} + ${p.add(v.increment)}`);
      else if ('decrement' in v) sets.push(`${col} = ${col} - ${p.add(v.decrement)}`);
      else if ('multiply' in v) sets.push(`${col} = ${col} * ${p.add(v.multiply)}`);
      else if ('divide' in v) sets.push(`${col} = ${col} / ${p.add(v.divide)}`);
      else if ('set' in v) sets.push(`${col} = ${p.add(toDb(f, v.set), castFor(f))}`);
      continue;
    }
    sets.push(`${col} = ${p.add(toDb(f, v), castFor(f))}`);
  }
  if (!touchedUpdatedAt) {
    const ua = Object.values(meta.fields).find((f) => f.updatedAt);
    if (ua) sets.push(`${q(ua.column)} = (now() AT TIME ZONE 'utc')`);
  }
  return sets.join(', ');
}

function notFound(model: string): never {
  throw new PrismaClientKnownRequestError(
    `An operation failed because it depends on one or more records that were required but not found. (${model})`,
    'P2025',
  );
}

function makeDelegate(sql: Sql, model: string) {
  const meta = META[model];
  const finish = async (rec: AnyObj, args: AnyObj) => {
    const relSpec: AnyObj = { ...(args.include ?? {}) };
    if (args.select) for (const [k, v] of Object.entries(args.select)) if (!meta.fields[k] && v) relSpec[k] = v;
    await loadRelations(sql, model, [rec], relSpec);
    if (!args.select) return rec;
    const out = applySelect(meta, rec, args.select);
    for (const k of Object.keys(relSpec)) out[k] = rec[k];
    return out;
  };

  return {
    findMany: (args: AnyObj = {}) => findManyImpl(sql, model, args),
    findFirst: async (args: AnyObj = {}) => (await findManyImpl(sql, model, { ...args, take: 1 }))[0] ?? null,
    findUnique: async (args: AnyObj) => (await findManyImpl(sql, model, { ...args, take: 1 }))[0] ?? null,
    findFirstOrThrow: async (args: AnyObj = {}) =>
      (await findManyImpl(sql, model, { ...args, take: 1 }))[0] ?? notFound(model),
    findUniqueOrThrow: async (args: AnyObj) =>
      (await findManyImpl(sql, model, { ...args, take: 1 }))[0] ?? notFound(model),

    count: async (args: AnyObj = {}) => {
      const p = new Params();
      const rows = await run(
        sql,
        `SELECT COUNT(*)::int AS c FROM ${q(meta.table)} t WHERE ${compileWhere(model, args.where, 't', p)}`,
        p.values,
      );
      return rows[0].c as number;
    },

    create: async (args: AnyObj) => {
      const p = new Params();
      const { cols, vals } = buildInsert(meta, args.data, p);
      const rows = await run(
        sql,
        `INSERT INTO ${q(meta.table)} (${cols.join(', ')}) VALUES (${vals.join(', ')}) RETURNING *`,
        p.values,
      );
      return finish(rowToRecord(meta, rows[0]), args);
    },

    createMany: async (args: AnyObj) => {
      const list: AnyObj[] = Array.isArray(args.data) ? args.data : [args.data];
      let count = 0;
      for (const data of list) {
        const p = new Params();
        const { cols, vals } = buildInsert(meta, data, p);
        const rows = await run(
          sql,
          `INSERT INTO ${q(meta.table)} (${cols.join(', ')}) VALUES (${vals.join(', ')})` +
            (args.skipDuplicates ? ' ON CONFLICT DO NOTHING' : '') +
            ' RETURNING 1',
          p.values,
        );
        count += rows.length;
      }
      return { count };
    },

    update: async (args: AnyObj) => {
      const p = new Params();
      const set = buildSet(meta, args.data, p);
      const rows = await run(
        sql,
        `UPDATE ${q(meta.table)} t SET ${set} WHERE ${compileWhere(model, args.where, 't', p)} RETURNING t.*`,
        p.values,
      );
      if (!rows.length) notFound(model);
      return finish(rowToRecord(meta, rows[0]), args);
    },

    updateMany: async (args: AnyObj) => {
      const p = new Params();
      const set = buildSet(meta, args.data, p);
      const rows = await run(
        sql,
        `UPDATE ${q(meta.table)} t SET ${set} WHERE ${compileWhere(model, args.where, 't', p)} RETURNING 1`,
        p.values,
      );
      return { count: rows.length };
    },

    upsert: async (args: AnyObj) => {
      const existing = (await findManyImpl(sql, model, { where: args.where, take: 1 }))[0];
      const d = makeDelegate(sql, model);
      if (existing) return d.update({ where: args.where, data: args.update, include: args.include, select: args.select });
      return d.create({ data: args.create, include: args.include, select: args.select });
    },

    delete: async (args: AnyObj) => {
      const p = new Params();
      const rows = await run(
        sql,
        `DELETE FROM ${q(meta.table)} t WHERE ${compileWhere(model, args.where, 't', p)} RETURNING t.*`,
        p.values,
      );
      if (!rows.length) notFound(model);
      return rowToRecord(meta, rows[0]);
    },

    deleteMany: async (args: AnyObj = {}) => {
      const p = new Params();
      const rows = await run(
        sql,
        `DELETE FROM ${q(meta.table)} t WHERE ${compileWhere(model, args.where, 't', p)} RETURNING 1`,
        p.values,
      );
      return { count: rows.length };
    },
  };
}

// ─── Client ─────────────────────────────────────────────────────────────

function rawFromTemplate(strings: TemplateStringsArray, values: any[]): [string, any[]] {
  let text = strings[0];
  for (let i = 0; i < values.length; i++) text += `$${i + 1}` + strings[i + 1];
  return [text, values.map((v) => (v instanceof Date ? v.toISOString() : v))];
}

export type PrismaClient = any;

function makeClient(sql: Sql, root: postgres.Sql<any>): any {
  const client: AnyObj = {
    $connect: async () => {},
    $disconnect: async () => {
      if (sql === root) await root.end({ timeout: 5 });
    },
    $queryRaw: (strings: TemplateStringsArray, ...values: any[]) => run(sql, ...rawFromTemplate(strings, values)),
    $executeRaw: async (strings: TemplateStringsArray, ...values: any[]) =>
      (await run(sql, ...rawFromTemplate(strings, values))).length,
    $queryRawUnsafe: (text: string, ...params: any[]) => run(sql, text, params),
    $executeRawUnsafe: async (text: string, ...params: any[]) => (await run(sql, text, params)).length,
    $transaction: async (arg: any) => {
      if (Array.isArray(arg)) return Promise.all(arg);
      if ('begin' in sql) return (sql as postgres.Sql<any>).begin((tx) => arg(makeClient(tx, root)));
      // already inside a transaction
      return arg(client);
    },
  };
  for (const name of Object.keys(META)) client[lowerFirst(name)] = makeDelegate(sql, name);
  return client;
}

function databaseUrl(): string {
  const g = globalThis as any;
  const fromDeno = g.Deno?.env?.get?.('SUPABASE_DB_URL') || g.Deno?.env?.get?.('DATABASE_URL');
  const fromNode = typeof process !== 'undefined' ? process.env.SUPABASE_DB_URL || process.env.DATABASE_URL : undefined;
  const url = fromDeno || fromNode;
  if (!url) throw new Error('[db] DATABASE_URL / SUPABASE_DB_URL is not set');
  return url;
}

const globalForDb = globalThis as unknown as { __radiantDb?: any };

function createClient(): any {
  const root = postgres(databaseUrl(), {
    prepare: false, // compatible with Supavisor transaction pooling
    max: 5,
    idle_timeout: 20,
    connect_timeout: 15,
    connection: { TimeZone: 'UTC' } as any, // timestamps are stored as UTC wall-clock
    types: {
      // keep timestamp-without-time-zone as raw strings; fromDb() treats them as UTC
      timestamp: {
        to: 1114,
        from: [1114],
        serialize: (x: any) => (x instanceof Date ? x.toISOString() : x),
        parse: (x: string) => x,
      },
    } as any,
  });
  return makeClient(root, root);
}

export const prisma: any = globalForDb.__radiantDb ?? (globalForDb.__radiantDb = createClient());

export const Prisma = { PrismaClientKnownRequestError };

export default prisma;
