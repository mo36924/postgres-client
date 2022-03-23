import pg, { PoolClient, PoolConfig } from "pg";

export const rawSymbol = Symbol();
export const raw = (value: string) => ({ [rawSymbol]: value });
export const clientEscapeIdentifier = pg.Client.prototype.escapeIdentifier;
export const escapeIdentifier = (identifier: string) => {
  const escapedIdentifier = clientEscapeIdentifier(identifier);
  const escapedIdentifierString = new String(escapedIdentifier) as String & { [rawSymbol]: string };
  escapedIdentifierString[rawSymbol] = escapedIdentifier;
  return escapedIdentifierString;
};
export const postgres = (config?: PoolConfig) => {
  const pool = new pg.Pool(config);
  const sql = (strings: TemplateStringsArray, ...values: any[]) => {
    const _values: any[] = [];
    const sql = strings.reduce((previousValue, currentValue, currentIndex) => {
      const value = values[currentIndex - 1];
      return (
        previousValue + (value && rawSymbol in value ? value[rawSymbol] : "$" + _values.push(value)) + currentValue
      );
    });
    return pool.query(sql, _values);
  };
  sql.transaction = async <T>(
    fn: (sql: {
      (strings: TemplateStringsArray, ...values: any[]): Promise<pg.QueryResult<any>>;
      client: PoolClient;
    }) => Promise<T>,
  ) => {
    const client = await pool.connect();
    const sql = (strings: TemplateStringsArray, ...values: any[]) => {
      const _values: any[] = [];
      const sql = strings.reduce((previousValue, currentValue, currentIndex) => {
        const value = values[currentIndex - 1];
        return (
          previousValue + (value && rawSymbol in value ? value[rawSymbol] : "$" + _values.push(value)) + currentValue
        );
      });
      return client.query(sql, _values);
    };
    sql.client = client;
    try {
      await client.query("BEGIN");
      const result = await fn(sql);
      await client.query("COMMIT");
      return result;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  };
  sql.pool = pool;
  return sql;
};
