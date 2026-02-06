import snowflake from "snowflake-sdk";
import fs from "fs";

snowflake.configure({ logLevel: "ERROR" });

let connection: snowflake.Connection | null = null;
let cachedToken: string | null = null;

function getOAuthToken(): string | null {
  const tokenPath = "/snowflake/session/token";
  try {
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, "utf8");
    }
  } catch {
    // Not in SPCS environment
  }
  return null;
}

function getConfig(): snowflake.ConnectionOptions {
  const base = {
    account: process.env.SNOWFLAKE_ACCOUNT || "SFSENORTHAMERICA-LATAM_DEMO10",
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || "VW_COCO",
    database: process.env.SNOWFLAKE_DATABASE || "MG_COCO",
    schema: process.env.SNOWFLAKE_SCHEMA || "FRAUD_DETECTION",
  };

  const token = getOAuthToken();
  if (token) {
    return {
      ...base,
      host: process.env.SNOWFLAKE_HOST,
      token,
      authenticator: "oauth",
    };
  }

  return {
    ...base,
    username: process.env.SNOWFLAKE_USER || "mgalvis",
    password: process.env.SNOWFLAKE_PASSWORD || "",
  };
}

async function getConnection(): Promise<snowflake.Connection> {
  const token = getOAuthToken();

  if (connection && (!token || token === cachedToken)) {
    return connection;
  }

  if (connection) {
    console.log("OAuth token changed, reconnecting");
    connection.destroy(() => {});
  }

  console.log(token ? "Connecting with OAuth token" : "Connecting with password");
  const conn = snowflake.createConnection(getConfig());
  await conn.connectAsync(() => {});
  connection = conn;
  cachedToken = token;
  return connection;
}

function isRetryableError(err: unknown): boolean {
  const error = err as { message?: string; code?: number };
  return !!(
    error.message?.includes("OAuth access token expired") ||
    error.message?.includes("terminated connection") ||
    error.code === 407002
  );
}

export async function query<T>(sql: string, retries = 1): Promise<T[]> {
  try {
    const conn = await getConnection();
    return await new Promise<T[]>((resolve, reject) => {
      conn.execute({
        sqlText: sql,
        complete: (err, _stmt, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve((rows || []) as T[]);
          }
        },
      });
    });
  } catch (err) {
    console.error("Query error:", (err as Error).message);
    if (retries > 0 && isRetryableError(err)) {
      connection = null;
      return query(sql, retries - 1);
    }
    throw err;
  }
}

interface SessionInfo {
  token: string;
  host: string;
}

export async function getSessionInfo(): Promise<SessionInfo | null> {
  try {
    const conn = await getConnection();
    const connAny = conn as unknown as { rest?: { token?: string; host?: string } };
    const token = connAny.rest?.token;
    
    if (!token) {
      return null;
    }

    const account = getConfig().account || "";
    const host = connAny.rest?.host || `${account.toLowerCase().replace(/-/g, "_")}.snowflakecomputing.com`;

    return { token, host };
  } catch {
    return null;
  }
}
