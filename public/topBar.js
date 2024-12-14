async function backToAll() {
  const foodDataContainer = document.getElementById('foodDataContainer');
  const catagoryDisplay = document.getElementById('CatagoryDisplay');
  catagoryDisplay.innerHTML = "All";
  await fetchFoodType();
  window.scrollTo({top: 0,});

}