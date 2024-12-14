// Convert sets to arrays

let selectMode = false;

const selectedBoxNumItem = document.getElementById('selectedBoxNumItem');
const selectedBoxNumType = document.getElementById('selectedBoxNumType');
const foodDataContainer = document.getElementById('foodDataContainer');
const calBarValue = document.getElementById('calBarValue');

function selectBoxMode(){
  const filterSelectButton = document.getElementById('filterSelectButton');
  const selectedInfoBox = document.getElementById('selectedInfoBox');
  const catagoryDisplay = document.getElementById('CatagoryDisplay');

    if (!selectMode && selectedNum > 0){
      fetchSelected();
      selectedInfoBox.style.bottom = "70px";
      selectedInfoBox.style.scale = 1;
      selectedInfoBox.style.filter = "";
      selectedInfoBox.style.opacity= 1;
      selectedInfoBox.style.pointerEvents = "all";

      foodDataContainer.style.paddingBottom = '240px';
      catagoryDisplay.innerHTML = "Selected";
      updateSelectedBox();
      selectMode = true;

      filterSelectButton.children[0].style.scale = 1.1;
      filterSelectButton.style.scale = 0.95;
      filterSelectButton.style.opacity = 0.7;
      setTimeout(function(){
        filterSelectButton.children[0].style.scale = 1;
        filterSelectButton.style.scale = 1;
        filterSelectButton.style.opacity = 1;
      },550)
    }
    else {
      fetchFoodType();
      selectedInfoBox.style.bottom = "-600px";
      selectedInfoBox.style.scale = 0.8;
      selectedInfoBox.style.filter = "blur(60px)";
      selectedInfoBox.style.opacity= 0;
      selectedInfoBox.style.pointerEvents = "none";

      foodDataContainer.style.paddingBottom = '80px';
      catagoryDisplay.innerHTML = "All";
      
      selectMode = false;

      filterSelectButton.children[0].style.scale = 1.1;
      filterSelectButton.style.scale = 0.95;
      filterSelectButton.style.opacity = 0.7;
      setTimeout(function(){
        filterSelectButton.children[0].style.scale = 1;
        filterSelectButton.style.scale = 1;
        filterSelectButton.style.opacity = 1;
       },550)
    }
}

function updateSelectedBox(){
      selectedBoxNumItem.innerHTML = selectedNum;
      selectedBoxNumType.innerHTML = selectedCatSet.size;
      const selectedBoxMessage = document.getElementById('selectedBoxMessage');
      const idb1 = document.getElementById('idb1');
      const idb2 = document.getElementById('idb2');
      const idb3 = document.getElementById('idb3');

      let calLength = (selectedCal/4600) * 100;
      calBarValue.style.width = `${calLength}%`;

      if (selectedCal < 1600){
        calBarValue.style.backgroundColor = 'rgba(183, 183, 183, 0.8)';
        selectedBoxMessage.innerHTML = lowCalMessage[getRandomInt(0, lowCalMessage.length -1)];
       
        idb1.classList.add('idealBarsActive');
        idb2.classList.remove('idealBarsActive');
        idb3.classList.remove('idealBarsActive');
      }
      if (selectedCal >= 1600 && selectedCal <= 3000){
        calBarValue.style.backgroundColor = 'rgb(255, 116, 36)';
        selectedBoxMessage.innerHTML = medCalMessage[getRandomInt(0, medCalMessage.length -1)];
        
        idb1.classList.remove('idealBarsActive');
        idb2.classList.add('idealBarsActive');
        idb3.classList.remove('idealBarsActive');
      }
      if (selectedCal > 3000){
        calBarValue.style.backgroundColor = 'red';
        selectedBoxMessage.innerHTML = higCalMessage[getRandomInt(0, higCalMessage.length -1)];

        idb1.classList.remove('idealBarsActive');
        idb2.classList.remove('idealBarsActive');
        idb3.classList.add('idealBarsActive');
      }
}

function fetchSelected(){
    const payload = {
      selectedDataSet: Array.from(selectedDataSet),
      selectedTypeSet: Array.from(selectedTypeSet)
    };
    fetch('/api/selectedItems', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Matched items:', data);
        displaySelected(data.set1Matches, data.set2Matches)
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function displaySelected(foodDatas, foodTypes){
  const foodDataContainer = document.getElementById('foodDataContainer');

  foodDataContainer.innerHTML = '';
    displayFoodData(foodDatas, false);
    displayFoodTypes(foodTypes,false);
}

function checkSelect(){
  const filterSelectButton = document.getElementById('filterSelectButton');
  if (selectedNum == 0){
    filterSelectButton.style.backgroundColor = 'rgb(152, 152, 152)';
  }
  else {
    filterSelectButton.style.backgroundColor = 'rgb(255, 116, 36)';
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let lowCalMessage = [`You’re eating so little, even the carrot feels underdressed.`, 
  `The carrot is concerned and considering a wellness check. Call it dinner and grab a snack.`,
  `Trying to survive on air? Bold strategy. Let’s rethink that.`,
  `Calories are energy, not the enemy. Your stomach agrees.`,
  `You eat any less, and Big Orange Mascot will officially declare a famine in your kitchen.`
];
let medCalMessage = [`Look at you, nailing the perfect balance. Keep it up!`,
  `Your choices are so balanced, even the scales are impressed.`,
  `That’s what we call peak nutrition excellence!`,
  `You’re absolutely crushing this healthy lifestyle thing.`
];
let higCalMessage = [`At this rate, you’ll turn into a giant carrot yourself. Bold move.`, 
  `Your eating habit is alarming, and Big Orange Mascot is already halfway to your house with a nutrition manual.`,
  `Big Orange Mascot just applied for a roommate lease at your fridge. It seems like you’re stocking up for a food festival!`,
  ];