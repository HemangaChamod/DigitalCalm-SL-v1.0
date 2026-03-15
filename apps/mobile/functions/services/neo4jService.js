const neo4j = require("neo4j-driver");

// Load credentials from .env
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME,
    process.env.NEO4J_PASSWORD
  )
);

/*
Store user behaviour in graph database
*/
async function storeUsage(uid, app, screenTime) {

  const session = driver.session({
    database: process.env.NEO4J_DATABASE
  });

  try {

    await session.run(
      `
      MERGE (u:User {id:$uid})
      MERGE (a:App {name:$app})

      CREATE (u)-[:USED {
        time:$time,
        date:date()
      }]->(a)
      `,
      {
        uid: uid,
        app: app,
        time: screenTime
      }
    );

  } catch (error) {

    console.error("Neo4J storeUsage error:", error);

  } finally {

    await session.close();

  }
}

/*
Detect usage behaviour pattern
*/
async function detectPattern(uid) {

  const session = driver.session({
    database: process.env.NEO4J_DATABASE
  });

  try {

    const result = await session.run(
      `
      MATCH (u:User {id:$uid})-[r:USED]->(a:App)
      RETURN a.name AS app, r.time AS time
      ORDER BY r.time DESC
      LIMIT 1
      `,
      { uid }
    );

    if (result.records.length === 0) {
      return "No clear usage pattern";
    }

    const app = result.records[0].get("app");

    const rawTime = result.records[0].get("time");

    // Neo4j integer handling
    const time =
      typeof rawTime === "object"
        ? rawTime.low
        : rawTime;

    if (time > 7200000) {
      return `Heavy usage detected on ${app}`;
    }

    return `Normal usage detected on ${app}`;

  } catch (error) {

    console.error("Neo4J detectPattern error:", error);
    return "Unknown usage pattern";

  } finally {

    await session.close();

  }
}

module.exports = {
  storeUsage,
  detectPattern
};