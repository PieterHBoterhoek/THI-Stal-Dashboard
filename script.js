fetch('/weerdata.json')
  .then((response) => response.json())
  .then((data) => {
    console.log(data)
  })
.catch(console.error)