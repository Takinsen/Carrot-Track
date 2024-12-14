const apiUrl = 'http://localhost:80/api';
const Url = 'http://localhost:80';
// production url pieboard.thddns.net:6990
// Fetch and display all messages when the page loads
let selectedgroup = "default";
let selectedgroupid = 0;
let currentUser = "guest"

let selectedCal = 0;
let selectedNum = 0;

const selectedDataSet = new Set();
const selectedTypeSet = new Set();
const selectedCatSet  = new Set();

window.onload = async function() {
    // Start listening for server-sent events (SSE)
    fetchFoodType();
    fetchFoodTag();
    //fetchFoodData();
    //listenForUpdates(); 
};


// Function to listen for SSE updates
function listenForUpdates() {
    let eventSource = new EventSource(`${apiUrl}/notify`);

    // Handle incoming messages
    eventSource.onmessage = function(event) {
        if (event.data === 'fetch') {
          fetchFoodData(); // Trigger fetch when notified by the server
        } else if (event.data === 'clientUpdate') {
            fetchUserCount();
        }
    };

    // Error handler (optional)
    eventSource.onerror = function(error) {
        console.error('EventSource encountered an error: ', error);
    };

    // Periodically check the connection status every 3.5 seconds
    setInterval(() => {
        if (eventSource.readyState !== 1) { // 1 means connection is open
            console.warn('SSE connection lost. Reconnecting...');
            eventSource.close();  // Close the existing connection
            eventSource = new EventSource(`${apiUrl}/notify`);  // Reconnect

              // Handle the new connection
              eventSource.onopen = function() {
                // Only fetch messages when the new connection is open
                fetchFoodData();
                fetchUserCount();
            };

               // Handle incoming messages
            eventSource.onmessage = function(event) {
                if (event.data === 'fetch') {
                  fetchFoodData(); // Trigger fetch when notified by the server
                } else if (event.data === 'clientUpdate') {
                    fetchUserCount();
                }
            };
            
            
        }
    }, 3500); // Check every 10 seconds
}


// Fetch user count
async function fetchUserCount() {
    const response = await fetch(`${apiUrl}/userCount`);
    const userCount = await response.json();
    //console.log(userCount)
    document.getElementById("userCount").innerHTML = `on&nbsp;&nbsp;${userCount.count}`

}


// Fetch messages and display them / scroll to bottom
async function fetchFoodData(search) {
    //const search = document.getElementById('searchField').value;
    const response = await fetch(`${apiUrl}/foodData?search=${search}`);
    console.log(response)
    const foodData = await response.json();
    const nameText = currentUser
 
    displayFoodData(foodData);
    //window.scroll(0, document.body.scrollHeight);
    //console.log(messages);
}

async function fetchFoodType() {
    const search = document.getElementById('searchField').value;
    const response = await fetch(`${apiUrl}/foodType?search=${search}`);
    console.log(response)
    const foodData = await response.json();
    const nameText = currentUser
 
    displayFoodTypes(foodData);
    //window.scroll(0, document.body.scrollHeight);
    //console.log(messages);
}


// Display messages in colorful blocks
function displayFoodData(foodData, clearEnable = true) {
    const foodDataContainer = document.getElementById('foodDataContainer');
    if (clearEnable){
        foodDataContainer.innerHTML = ''; // Clear previous messages
    }
    const documentFragment = document.createDocumentFragment();
            foodData.forEach(msg => {
                const foodDataDiv = document.createElement('div');
                foodDataDiv.className = 'foods';
                foodDataDiv.id = msg.imagePath;
                foodDataDiv.dataset.select = '0';
                console.log(msg.name)
                foodDataDiv.innerHTML = `${drawImage(Url + msg.imagePath, "foodDataImage")} 
                <div class="foodnameLable">${msg.name}</div>  
                ${drawImage("ui-image/carrot@5x.png", "foodTypeCalImage")}
                <div class="foodcalLable">${msg.cal}</div>
                <img class="foodTypeLocImage" src="ui-image/location.app@5x.png">
                <div class="foodLocLable" id="FoodLocPreview">${msg.loc}</div>
                <div class="foodTagLable" id="foodTagPreview"># ${msg.tag}</div>
                <div class="selectTypeButton">
                ${drawImage("ui-image/plus@5x.png", "selectTypeIcon")}
                </div>
                `;

                const index = 7;
                if (selectedDataSet.has(msg.imagePath)){
                        foodDataDiv.children[index].style.rotate = '45deg';
                        foodDataDiv.children[index].style.backgroundColor = 'rgb(255, 116, 36)';
                        foodDataDiv.dataset.select = '1';
                }

                foodDataDiv.children[index].addEventListener('click', function(){
                    const selectedCalContainer = document.getElementById('selectedCalContainer');
                    const selectedNumContainer = document.getElementById('selectedNumContainer');
                    if (foodDataDiv.dataset.select == '0'){
                        //foodDataDiv.children[3].innerHTML = ` ${drawImage("ui-image/plus@5x.png", "selectTypeIcon")}`
                        foodDataDiv.children[index].style.rotate = '45deg';
                        foodDataDiv.children[index].style.backgroundColor = 'rgb(255, 116, 36)';
                        foodDataDiv.dataset.select = '1';
                        
                        selectedCal += msg.cal;
                        selectedNum += 1;
                        selectedCalContainer.innerHTML = selectedCal;
                        selectedNumContainer.innerHTML = selectedNum;
                        selectedDataSet.add(msg.imagePath);
                        selectedCatSet.add(msg.tag)
                        updateSelectedBox();
                    }
                    else{
                        //foodDataDiv.children[3].innerHTML = ` ${drawImage("ui-image/plus@5x.png", "selectTypeIcon")}`
                        foodDataDiv.children[index].style.rotate = '0deg';
                        foodDataDiv.children[index].style.backgroundColor = 'rgb(39, 39, 39)';
                        foodDataDiv.dataset.select = '0';

                        selectedCal -= msg.cal;
                        selectedNum -= 1;
                        selectedCalContainer.innerHTML = selectedCal;
                        selectedNumContainer.innerHTML = selectedNum;
                        selectedDataSet.delete(msg.imagePath);
                        selectedCatSet.delete(msg.tag);
                        updateSelectedBox();
                    }
                    checkSelect();
                })
                documentFragment.appendChild(foodDataDiv)
            });

            foodDataContainer.appendChild(documentFragment);
}

// Display food types
function displayFoodTypes(foodData, clearEnable = true) {
    const foodDataContainer = document.getElementById('foodDataContainer');
    if (clearEnable){
        foodDataContainer.innerHTML = ''; // Clear previous messages
    }
    const documentFragment = document.createDocumentFragment();
            foodData.forEach(msg => {
                const foodDataDiv = document.createElement('div');
                foodDataDiv.className = 'foodTypes';
                foodDataDiv.id = msg.imagePath;
                foodDataDiv.dataset.select = '0';
                console.log(msg.name)
                foodDataDiv.innerHTML = `${drawImage(Url + msg.imagePath, "foodTypeImage")} 
                <div class="foodTypenameLable">${msg.name}</div>  
                ${drawImage("ui-image/carrot@5x.png", "foodTypeCalImage")}
                <div class="foodTypecalLable">${msg.avgCal}</div>
                <div class="selectTypeButton">
                ${drawImage("ui-image/plus@5x.png", "selectTypeIcon")}
                </div>
                ${drawImage("ui-image/xmark.triangle.circle.square@5x.png", "foodTypeCountImage")}
                <div class="foodTypeCountLable">${msg.num}</div>
                `;

                const index = 4;
                if (selectedTypeSet.has(msg.name)){
                    foodDataDiv.children[index].style.rotate = '45deg';
                    foodDataDiv.children[index].style.backgroundColor = 'rgb(255, 116, 36)';
                    foodDataDiv.dataset.select = '1';
                }

                foodDataDiv.children[0].addEventListener('click', async function(){
                    const catagoryDisplay = document.getElementById('CatagoryDisplay');
                    catagoryDisplay.innerHTML = msg.name;
                    await fetchFoodData(msg.name);
                    window.scrollTo({top: 0,});

                })

                foodDataDiv.children[index].addEventListener('click', function(){
                    const selectedCalContainer = document.getElementById('selectedCalContainer');
                    const selectedNumContainer = document.getElementById('selectedNumContainer');
                    if (foodDataDiv.dataset.select == '0'){
                        //foodDataDiv.children[3].innerHTML = ` ${drawImage("ui-image/plus@5x.png", "selectTypeIcon")}`
                        foodDataDiv.children[index].style.rotate = '45deg';
                        foodDataDiv.children[index].style.backgroundColor = 'rgb(255, 116, 36)';
                        foodDataDiv.dataset.select = '1';

                        selectedCal += msg.avgCal;
                        selectedNum += 1;
                        selectedCalContainer.innerHTML = selectedCal;
                        selectedNumContainer.innerHTML = selectedNum;
                        selectedTypeSet.add(msg.name);
                        selectedCatSet.add(msg.name);
                        updateSelectedBox();
                    }
                    else{
                        //foodDataDiv.children[3].innerHTML = ` ${drawImage("ui-image/plus@5x.png", "selectTypeIcon")}`
                        foodDataDiv.children[index].style.rotate = '0deg';
                        foodDataDiv.children[index].style.backgroundColor = 'rgb(39, 39, 39)';
                        foodDataDiv.dataset.select = '0';

                        selectedCal -= msg.avgCal;
                        selectedNum -= 1;
                        selectedCalContainer.innerHTML = selectedCal;
                        selectedNumContainer.innerHTML = selectedNum;
                        selectedTypeSet.delete(msg.name);
                        selectedCatSet.delete(msg.name);
                        updateSelectedBox();
                    }
                    checkSelect();
                })
                documentFragment.appendChild(foodDataDiv)
            });

            foodDataContainer.appendChild(documentFragment);
}


// draw sticker
function drawImage(image, Class){
    return `<img class = "${Class}" src="${image}">`
}

// refresh name
document.getElementById('nameInput').addEventListener('click', async function() {
    await fetchMessages();
});

// refresh header
function titleChange(titleText) {
    const title = document.querySelector(".title");
    title.innerHTML = `<img id="mainIcon" src="ui-image/PIE board logo.png">
    <div id="userCount">on&nbsp;&nbsp;0</div>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${titleText}&nbsp;`;
}

// sticker and attatchment system
let moreButtonStat = 0;
document.getElementById("moreButton").addEventListener('click', function() {
    const messageForm = document.getElementById("messageForm");
    if (moreButtonStat == 0){
        messageForm.style.bottom = "-30px";
        moreButtonStat = 1;
    }
    else{
        messageForm.style.bottom = "-310px";
        moreButtonStat = 0;
    }
    
})

// add sticker button in moreBoard
const stickerNum = 12;
const moreBoard = document.getElementById("moreBoard");
for(let i = 0; i < stickerNum; i++){
    const stickerDiv = document.createElement('div');
    stickerDiv.className = 'stickerButton';
    stickerDiv.innerHTML = drawSticker(`st${i}`, 50, 60)
    stickerDiv.addEventListener('click', async function(e){
        e.preventDefault();
        const nameText = currentUser
        const messageText = `*_st${i}`

        // Post the new message to the server
        await fetch(`${apiUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: {
                    text: messageText,
                    name: nameText
                }, 
                group: selectedgroupid
            })
        });
    })

    moreBoard.appendChild(stickerDiv)
}

// display groups selection page
document.querySelector(".title").addEventListener('click', function() {
    document.querySelector('.groupsPage').style.display = "block";
});

// display name userPage
document.getElementById("nameInput").addEventListener('click', function(){
    document.getElementById('userPage').style.display = "block";
})

// submit username and password
document.getElementById("submitUser").addEventListener('click', async function(e) {
    e.preventDefault();
    const username = document.getElementById("usernameIn").value;
    const password = document.getElementById("passwordIn").value;

    let userPassword = JSON.stringify({
                                name: username,
                                password: password
                                 });
    const response = await fetch(`${apiUrl}/userPassword?userPassword=${userPassword}`);
    const check  = await response.json();
    //console.log(check.pass);
    if (check.pass == "yes"){
        document.getElementById("nameDisplay").innerText = username;
        currentUser = username
        document.getElementById("userPage").style.display = "none";
        document.getElementById("usernameIn").value = "";
        document.getElementById("passwordIn").value = "";
        fetchMessages();
    }
    else if (check.pass == "no"){
        document.getElementById("nameDisplay").value = "guest";
        currentUser = "guest";
        document.getElementById("passwordIn").value = "";
        fetchMessages();
    }
    else if (check.pass == "new"){
        document.getElementById("nameDisplay").innerText = username;
        currentUser = username
        document.getElementById("userPage").style.display = "none";
        document.getElementById("usernameIn").value = "";
        document.getElementById("passwordIn").value = "";
        fetchMessages();
    }
    
   
})

// fetch on interval
/*
setInterval(function (){
    fetchMessages(); use when sse not working
    fetchUserCount();
}, 5500)
*/