let apiUrl = (window.location.origin.includes("local") ? "" : "https://river-chess-bqa4a7f0cgaadghv.canadacentral-01.azurewebsites.net");
const stonesContainer = get("stonesContainer");

window.addEventListener("load", () => {
    fetch(apiUrl + "/api/data/stonesData").then(response => response.json()).then(responseJson => {
        responseJson.forEach(group => {
            let title = group[0].points + " Point Stones";
            if (group[0].isBurden) title = "Burdens";
            else if (group[0].points == 0) title = "Special Stones";
            stonesContainer.appendChild(createElement(`
                <h2>${title}</h2>
            `));

            let container = createElement("<div></div>");
            stonesContainer.appendChild(container);
            container = stonesContainer.lastChild;
            container.classList.add("stone-group");
            displayStones(group, container, { isFlipped: true });
        });

    });

    // fetch(apiUrl + "/api/data/stonesData").then(response => response.json()).then(responseJson => {
    //     let stones = [];

    //     responseJson.forEach(group => {
    //         group.forEach(stone => stones.push(stone));
    //     });

    //     stones = shuffle(stones);

    //     displayStones(stones, stonesContainer, { isFlipped: true });
    // });

}); 

// function shuffle(array) {
//     for (let i = array.length - 1; i > 0; i--) {
//         const j = Math.floor(Math.random() * (i + 1));
//         [array[i], array[j]] = [array[j], array[i]];
//     }
//     return array;
// }
