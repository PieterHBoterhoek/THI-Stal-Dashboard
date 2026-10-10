fetch('weerdata.json')
  .then((response) => response.json())
  .then((data) => {
    console.log(data)
    document.getElementById("testData").innerHTML = JSON.stringify(data[1]);
  })
.catch(console.error)