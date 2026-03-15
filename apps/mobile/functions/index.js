require("dotenv").config();
const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

setGlobalOptions({ maxInstances: 10 });

const admin = require("firebase-admin");
admin.initializeApp();

const { storeUsage, detectPattern } = require("./services/neo4jService");
const { generateNudge } = require("./services/aiService");

async function storeUsageHistory(uid, screenTime, mostUsedApp) {

  const today = new Date().toISOString().split("T")[0];

  await admin.firestore()
    .collection("users")
    .doc(uid)
    .collection("usageHistory")
    .doc(today)
    .set({
      screenTime,
      mostUsedApp,
      createdAt: new Date()
    }, { merge: true });
}

async function getUsageHistory(uid) {

  const snapshot = await admin.firestore()
    .collection("users")
    .doc(uid)
    .collection("usageHistory")
    .orderBy("createdAt", "desc")
    .limit(7)
    .get();

  const history = [];

  snapshot.forEach(doc => {
    history.push(doc.data());
  });

  return history;
}

function detectTrend(history) {

  if (history.length < 2) {
    return "No clear trend";
  }

  const latest = history[0].screenTime;
  const previous = history[1].screenTime;

  if (latest > previous) {
    return "Screen time increasing";
  }

  if (latest < previous) {
    return "Screen time decreasing";
  }

  return "Screen time stable";
}

exports.generateMindfulnessNudge = onRequest(async (req, res) => {

  try {

    const { uid, screenTime, mostUsedApp, timeOfDay } = req.body;

    /* Store Neo4j behaviour */
    await storeUsage(uid, mostUsedApp, screenTime);

    const pattern = await detectPattern(uid);

    /* Store daily usage history */
    await storeUsageHistory(uid, screenTime, mostUsedApp);

    /* Fetch last 7 days usage */
    const history = await getUsageHistory(uid);

    const trend = detectTrend(history);

    /* Build context */
    const context = `
    Screen time today: ${screenTime} ms
    Most used app: ${mostUsedApp}
    Time of day: ${timeOfDay}

    Usage trend: ${trend}
    `;

    /* Generate AI nudge */
    const nudge = await generateNudge(pattern, context);

    const today = new Date().toISOString().split("T")[0];

    await admin.firestore()
      .collection("users")
      .doc(uid)
      .collection("nudges")
      .doc(today)
      .set({
        content: nudge,
        createdAt: new Date()
      });

    res.send({ success: true });

  } catch (error) {

    console.error(error);

    res.status(500).send("Error generating nudge");

  }

});