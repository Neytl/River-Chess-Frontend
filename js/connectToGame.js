"use strict";

const statusEl = get("mpStatus");
const sessionEl = get("mpSession");
const turnEl = get("mpTurn");
const logEl = get("mpLog");

const findMatchButton = get("mpFindMatch");
const leaveQueueButton = get("mpLeaveQueue");
const sendActionButton = get("mpSendAction");
const rejoinButton = get("mpRejoin");

let connection = null;

// Client-side mirror of server state. The server is authoritative; this is
// only ever updated from what the server sends us.
let sessionId = null;
let mySeat = null;
let sequence = 0;
let seatToActPlayerId = null;

function log(message, data) {
    const time = new Date().toLocaleTimeString();

    const line = data === undefined
        ? `[${time}] ${message}`
        : `[${time}] ${message} ${JSON.stringify(data)}`;

    console.log("[mp]", message, data ?? "");

    if (logEl) {
        logEl.textContent = `${line}\n${logEl.textContent}`;
    }
}

function setStatus(text) {
    if (statusEl) {
        statusEl.textContent = text;
    }
}

function applySnapshot(snapshot) {
    if (!snapshot) {
        return;
    }

    sessionId = snapshot.sessionId;
    sequence = snapshot.sequence;
    seatToActPlayerId = snapshot.seatToActPlayerId;

    const me = snapshot.players.find(p => p.playerId === guestId);
    mySeat = me ? me.seat : null;

    const opponent = snapshot.players.find(p => p.playerId !== guestId);

    if (sessionEl) {
        sessionEl.textContent =
            `${snapshot.sessionId} (${snapshot.status}) seat=${mySeat} seq=${snapshot.sequence}` +
            (opponent
                ? ` opponent=${opponent.playerId.slice(0, 8)}…` +
                `${opponent.isConnected ? "" : " [disconnected]"}`
                : "");
    }

    const myTurn = seatToActPlayerId === guestId;

    if (turnEl) {
        turnEl.textContent = snapshot.status === "Active"
            ? (myTurn ? "your turn" : "opponent's turn")
            : snapshot.status;
    }

    // Server authority means the client does not need to guess: it only
    // offers the action when the server says it is this player's turn.
    if (sendActionButton) {
        sendActionButton.disabled =
            snapshot.status !== "Active" || !myTurn;
    }
}

function clearSession(reason) {
    sessionId = null;
    mySeat = null;
    sequence = 0;
    seatToActPlayerId = null;

    if (sessionEl) {
        sessionEl.textContent = `none (${reason})`;
    }

    if (turnEl) {
        turnEl.textContent = "-";
    }

    if (sendActionButton) {
        sendActionButton.disabled = true;
    }
}

function registerHandlers() {

    connection.on("Connected", info => {
        log("connected as", info);
        setStatus(`connected as ${info.playerId.slice(0, 8)}…`);
    });

    connection.on("QueueJoined", status => {
        log("queue joined", status);
        setStatus(`in queue (${status.queueLength} waiting)`);
    });

    connection.on("QueueLeft", reason => {
        log("queue left", reason);
        setStatus(`not queued (${reason})`);
    });

    connection.on("MatchFound", snapshot => {
        log("match found", { sessionId: snapshot.sessionId });
        setStatus("in game");
        applySnapshot(snapshot);
    });

    connection.on("GameStateUpdated", broadcast => {
        log("action applied", {
            seq: broadcast.sequence,
            by: broadcast.actorSeat,
            type: broadcast.actionType,
            payload: broadcast.payload
        });

        applySnapshot(broadcast.snapshot);
    });

    connection.on("ActionRejected", rejection => {
        log("action REJECTED", rejection.reason);

        // Resync to the server's view rather than trusting local state.
        applySnapshot(rejection.snapshot);
    });

    connection.on("OpponentDisconnected", presence => {
        log("opponent disconnected; grace seconds", presence.graceSeconds);
        setStatus(`opponent away (${presence.graceSeconds}s grace)`);
        applySnapshot(presence.snapshot);
    });

    connection.on("OpponentReconnected", presence => {
        log("opponent reconnected");
        setStatus("in game");
        applySnapshot(presence.snapshot);
    });

    connection.on("SessionResumed", snapshot => {
        log("session resumed", { sessionId: snapshot.sessionId });
        setStatus("in game");
        applySnapshot(snapshot);
    });

    connection.on("SessionEnded", notice => {
        log("session ended", notice.reason);
        setStatus(`session ended (${notice.reason})`);
        applySnapshot(notice.snapshot);
        clearSession(notice.reason);
    });

    connection.onreconnecting(() => {
        setStatus("reconnecting…");
        log("reconnecting");
    });

    connection.onreconnected(async () => {
        log("reconnected; requesting resync");
        setStatus("reconnected");

        // The server already re-adds the new connection to the session
        // group in OnConnectedAsync. This is an explicit belt-and-braces
        // resync request.
        try {
            await connection.invoke("RejoinSession");
        }
        catch (error) {
            log("resync failed", String(error));
        }
    });

    connection.onclose(error => {
        setStatus("disconnected");
        log("connection closed", error ? String(error) : "");
    });
}

async function start() {
    // Wait for the guest id rather than assuming script order.
    await window.guestReady;

    //console.log("!!!!!!");
    //console.log("SignalR version:", signalR.VERSION);
    //console.log("Guest ID before connection:", guestId);

    connection = new signalR.HubConnectionBuilder()
        .withUrl(`/hubs/game?guestId=${encodeURIComponent(guestId)}`)

        //connection = new signalR.HubConnectionBuilder()
        //    .withUrl("/hubs/game", {
        //        // A browser cannot set headers on a WebSocket handshake, so
        //        // the guest id travels as the access_token query parameter.
        //        // Read lazily so a reconnect always uses the current value.
        //        accessTokenFactory: () => guestId
        //    })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Warning)
        .build();

    registerHandlers();

    await connection.start();

    if (findMatchButton) findMatchButton.disabled = false;
    if (leaveQueueButton) leaveQueueButton.disabled = false;
    if (rejoinButton) rejoinButton.disabled = false;
}

async function invoke(method, ...args) {
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        log("not connected");
        return;
    }

    try {
        await connection.invoke(method, ...args);
    }
    catch (error) {
        log(`${method} failed`, String(error));
    }
}

if (findMatchButton) {
    findMatchButton.addEventListener("click", () => {
        log("joining queue");
        invoke("JoinQueue");
    });
}

if (leaveQueueButton) {
    leaveQueueButton.addEventListener("click", () => {
        invoke("LeaveQueue");
    });
}

if (rejoinButton) {
    rejoinButton.addEventListener("click", () => {
        invoke("RejoinSession");
    });
}

if (sendActionButton) {
    sendActionButton.addEventListener("click", () => {
        // A placeholder action. No game meaning whatsoever: the payload is
        // opaque to the server, which only checks turn ownership and
        // sequence before echoing it to the group.
        invoke("SubmitAction", {
            sessionId: sessionId,
            actionType: "test",
            payload: JSON.stringify({
                note: "placeholder",
                at: new Date().toISOString()
            }),
            // Makes a retry safe: resubmitting the same id is a no-op.
            clientActionId: crypto.randomUUID(),
            // Lets the server reject a stale, out-of-order action.
            expectedSequence: sequence
        });
    });
}
