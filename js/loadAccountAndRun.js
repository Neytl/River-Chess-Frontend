// ******************************************
//  Load Account
// ******************************************
let guestId = null;

// Which localStorage key holds this tab's guest id.
// Stays "guestId" for the normal flow; only the development-only override
// below ever changes it.
let guestStorageKey = "guestId";

// Lets other scripts (multiplayer.js) await the guest id instead of guessing
// when it becomes available. Resolves with the guest id, rejects if guest
// initialization fails.
const guestReady = new Promise((resolve, reject) => {

    document.addEventListener(
        "DOMContentLoaded",
        async () => {

            try {
                await configureGuestStorage();
                await initializeGuest();
            }
            catch (error) {
                console.error(
                    "Failed to initialize guest:",
                    error
                );

                reject(error);
                if (!isOnHomePage) goHome();
                return;
            }

            resolve(guestId);

            // Run state is independent of multiplayer, so a failure here must
            // not stop the multiplayer client from connecting.
            try {
                // Try to load an existing run.
                await loadRunState();

                // Either display the run or the New Run button.
                displayRunState();
            }
            catch (error) {
                console.error(
                    "Failed to load run state:",
                    error
                );
            }
        }
    );
});

window.guestReady = guestReady;

/**
 * Development-only support for driving two different players from one
 * machine, and even one browser.
 *
 * Two browser tabs share localStorage, so without this they would share a
 * single guest id and matchmaking would try to pair a player with themselves.
 *
 *   ?player=b     use a separate guest slot (localStorage key "guestId:b")
 *   ?newGuest=1   discard this slot's guest and mint a fresh one
 *
 * Both are gated on a development-only endpoint, so they silently do nothing
 * in any other environment. With no query parameters present this function
 * makes no request at all, leaving the normal guest flow byte-for-byte
 * unchanged.
 */
async function configureGuestStorage() {
    const params = new URLSearchParams(window.location.search);
    const slot = params.get("player");
    const forceNewGuest = params.get("newGuest") === "1";

    if (!slot && !forceNewGuest) {
        return;
    }

    // This endpoint only exists in the Development environment.
    let overridesAllowed = false;

    try {
        const response = await fetch("/api/multiplayer/debug/config");
        overridesAllowed = response.ok;
    }
    catch {
        overridesAllowed = false;
    }

    if (!overridesAllowed) {
        console.warn(
            "Guest overrides are development-only and were ignored."
        );
        return;
    }

    if (slot) {
        guestStorageKey = `guestId:${slot}`;

        console.log(
            `Using development guest slot "${slot}" (${guestStorageKey}).`
        );
    }

    if (forceNewGuest) {
        localStorage.removeItem(guestStorageKey);

        console.log("Discarded the stored guest for this slot.");
    }
}

async function initializeGuest() {
    guestId = localStorage.getItem(guestStorageKey);

    // No saved guest.
    if (!guestId) {
        if (!isOnHomePage) goHome();
        await createGuest();
        return;
    }

    // Verify that the saved guest still exists.
    const response = await fetch(`/api/guests/${guestId}`);

    if (!response.ok) {
        if (!isOnHomePage) goHome();
        console.log("Saved guest no longer exists. Creating new guest.");
        localStorage.removeItem(guestStorageKey);
        await createGuest();
        return;
    }

    const guest = await response.json();
    console.log("Restored guest:", guest);
}

async function createGuest() {
    const response = await fetch("/api/guests", {
        method: "POST"
    });

    if (!response.ok) {
        throw new Error("Failed to create guest.");
    }

    const guest = await response.json();
    guestId = guest.guestId;
    localStorage.setItem(guestStorageKey, guestId);
    console.log("Created new guest:", guest);
}


// ******************************************
//  Load Run
// ******************************************

async function loadRunState() {

    if (!guestId) {
        throw new Error("Cannot load run state without a guest ID.");
    }

    const response = await fetch(
        `/api/run-state/${encodeURIComponent(guestId)}`
    );

    // A 404 simply means this player has not started a run yet.
    if (response.status === 404) {
        runState = null;
        return null;
    }

    if (!response.ok) {
        throw new Error(
            `Failed to load run state: ${response.status}`
        );
    }

    runState = await response.json();

    console.log("Loaded run state:", runState);

    return runState;
}
