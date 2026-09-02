/*
 * Multiplayer debug client.
 *
 * This is deliberately a test harness, not game UI: a few buttons and a log
 * pane, enough to prove the server-side flow end to end. The real game UI is
 * a separate, later piece of work.
 *
 * The handler names registered below must match the C# IGameClient interface.
 */
(function () {
    "use strict";

    let connection = null;
    let startPromise = null;

    let sessionId = null;
    let mySeat = null;
    let sequence = 0;
    let seatToActPlayerId = null;

    let currentSnapshot = null;
    let pendingSessionLoad = null;
    let gameStateUpdatedHandler = null;

    function log(message, data) {
        const time = new Date().toLocaleTimeString();

        const line = data === undefined
            ? `[${time}] ${message}`
            : `[${time}] ${message} ${JSON.stringify(data)}`;

        console.log("[mp]", message, data ?? "");
    }

    function setStatus(text) {
        console.log("[status]", text);
    }

    function applySnapshot(snapshot) {
        if (!snapshot) {
            return;
        }

        currentSnapshot = snapshot;

        sessionId = snapshot.sessionId;
        sequence = snapshot.sequence;
        seatToActPlayerId = snapshot.seatToActPlayerId;

        const me = snapshot.players.find(p => p.playerId === guestId);
        mySeat = me ? me.seat : null;

        const opponent = snapshot.players.find(p => p.playerId !== guestId);

        const myTurn = seatToActPlayerId === guestId;
    }

    function clearSession(reason) {
        sessionId = null;
        mySeat = null;
        sequence = 0;
        seatToActPlayerId = null;
    }

    async function connectToSession() {

        // Make sure the SignalR connection exists.
        await start();

        // This is the session created when matchmaking succeeded.
        const storedSessionId =
            sessionStorage.getItem("currentSessionId");

        if (!storedSessionId) {
            throw new Error(
                "No multiplayer session was found in sessionStorage."
            );
        }

        console.log(
            "[mp] Connecting to existing session:",
            storedSessionId
        );

        /*
         * If this client instance has already received the correct
         * session snapshot, we can immediately return it.
         */
        if (
            currentSnapshot &&
            currentSnapshot.sessionId === storedSessionId
        ) {
            console.log(
                "[mp] Session is already loaded."
            );

            return currentSnapshot.gameState;
        }

        /*
         * RejoinSession sends its result asynchronously through the
         * SessionResumed SignalR event.
         *
         * Create the promise BEFORE invoking RejoinSession so we cannot
         * miss a very fast server response.
         */
        const sessionLoadPromise = new Promise(
            (resolve, reject) => {

                pendingSessionLoad = {
                    sessionId: storedSessionId,
                    resolve,
                    reject
                };
            }
        );

        try {
            await connection.invoke("RejoinSession");

            console.log(
                "[mp] RejoinSession requested."
            );

            const snapshot = await sessionLoadPromise;

            console.log(
                "[mp] Session successfully loaded:",
                snapshot
            );

            return snapshot.gameState;
        }
        finally {
            pendingSessionLoad = null;
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

            if (reason == "no-active-session") {
                goHome();
            }
        });

        connection.on("MatchFound", async snapshot => {
            log("match found", { sessionId: snapshot.sessionId });

            sessionStorage.setItem(
                "currentSessionId",
                snapshot.sessionId
            );

            window.location.href = "/play";
        });

        connection.on("GameStateUpdated", broadcast => {
            log("action applied", {
                seq: broadcast.sequence,
                by: broadcast.actorSeat,
                type: broadcast.actionType,
                payload: broadcast.payload
            });

            applySnapshot(broadcast.snapshot);

            if (gameStateUpdatedHandler) {
                gameStateUpdatedHandler(broadcast);
            }
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

            if (
                pendingSessionLoad &&
                snapshot.sessionId === pendingSessionLoad.sessionId
            ) {
                pendingSessionLoad.resolve(snapshot);
            }
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
        // Already connected.
        if (connection &&
            connection.state === signalR.HubConnectionState.Connected) {
            return;
        }

        // If a connection is already being started, wait for that same attempt.
        if (startPromise) {
            return startPromise;
        }

        startPromise = startConnection();

        try {
            await startPromise;
        }
        finally {
            startPromise = null;
        }
    }

    async function startConnection() {
        await window.guestReady;

        connection = new signalR.HubConnectionBuilder()
            .withUrl(`/hubs/game?guestId=${encodeURIComponent(guestId)}`)
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        registerHandlers();

        await connection.start();

        console.log("[mp] Multiplayer connection started.");
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

    async function joinQueue() {
        await start();
        await connection.invoke("JoinQueue");
    }

    async function leaveQueue() {
        if (
            !connection ||
            connection.state !== signalR.HubConnectionState.Connected
        ) {
            return;
        }

        await connection.invoke("LeaveQueue");
    }

    async function sendAction(type, payload) {
        // A placeholder action. No game meaning whatsoever: the payload is
        // opaque to the server, which only checks turn ownership and
        // sequence before echoing it to the group.
        invoke("SubmitAction", {
            sessionId: sessionId,
            actionType: type,
            payload: JSON.stringify(payload),
            // Makes a retry safe: resubmitting the same id is a no-op.
            clientActionId: crypto.randomUUID(),
            // Lets the server reject a stale, out-of-order action.
            expectedSequence: sequence
        });
    }

    async function getLegalMoves(square) {
        if (!connection ||
            connection.state !== signalR.HubConnectionState.Connected) {

            throw new Error("Not connected to the multiplayer server.");
        }

        try {
            const legalMoves = await connection.invoke(
                "GetLegalMoves",
                square
            );

            return legalMoves;
        }
        catch (error) {
            log("GetLegalMoves failed", String(error));
            throw error;
        }
    }

    // Public methods
    window.multiplayerClient = {
        connectToSession,
        joinQueue,
        leaveQueue,
        sendAction,
        getLegalMoves,

        getSessionId: () => sessionId,

        getSnapshot: () => currentSnapshot,

        getGameState: () => {
            return currentSnapshot
                ? currentSnapshot.gameState
                : null;
        },

        onGameStateUpdated: handler => {
            gameStateUpdatedHandler = handler;
        }
    };
})();
