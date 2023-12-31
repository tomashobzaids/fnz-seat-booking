const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.weeklySeatAssignmentCheck = functions.pubsub.schedule('every sunday 00:00').timeZone('America/Los_Angeles').onRun(async (context) => {
    const db = admin.firestore();
    const SEAT_COUNT = 93;

    let seatAssignment = {
        monday: {},
        tuesday: {},
        wednesday: {},
        thursday: {},
        friday: {}
    };

    // Initialize all seats to null
    for (let i = 1; i <= SEAT_COUNT; i++) {
        for (let day in seatAssignment) {
            seatAssignment[day][i] = null;
        }
    }

    // Helper function to get an unassigned seat
    const getRandomUnassignedSeat = (day) => {
        for (let i = 1; i <= SEAT_COUNT; i++) {
            if (!seatAssignment[day][i]) {
                return i;
            }
        }
    };

    // Fetch all preferences
    const preferencesSnapshot = await db.collection('preferences').get();

    // Iterate over user preferences to assign seats
    preferencesSnapshot.forEach((doc) => {
        const userId = doc.id;
        const userPrefs = doc.data();

        for (let day in userPrefs) {
            // If the user hasn't selected a desk for the day, skip
            if (userPrefs[day].length === 0) continue;

            let seatAssigned = false;
            for (let choice of userPrefs[day]) {
                if (!choice) continue; // Skip null choices
                if (seatAssignment[day][choice] === null) {
                    seatAssignment[day][choice] = userId;
                    seatAssigned = true;
                    break;
                }
            }
            if (!seatAssigned) {
                // All user choices were taken, assign a random seat
                const randomSeat = getRandomUnassignedSeat(day);
                if (randomSeat) {
                    seatAssignment[day][randomSeat] = userId;
                }
            }
        }
    });

    // Save seat assignment to Firestore
    await db.collection('seatAssignments').doc('current').set(seatAssignment);
});