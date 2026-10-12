let alleData = [];
let thiGrafiek = null;

fetch('weerdata.json')
  .then((response) => response.json())
  .then((data) => {
    for (var uur in data) {
      let datum = data[uur].date;
      let datumUur = data[uur].hour;
      let Tout = data[uur].T / 10; // haal de temperatuur op en deel het door 10 omdat de KNMI de temperatuur x10 doet
      let RHout = data[uur].U; // binnen-luchtvochtigheid

      // bereken de binnentemperatuur en binnen-luchtvochtigheid
      let Tin = 0.879 * Tout + 4.68;
      let RHin = 0.651 * RHout + 0.239 * Tout + 15.40;

      // bereken de NRC THI-formule
      let THI = (1.8 * Tin + 32) - (0.55 - 0.0055 * RHin) * (1.8 * Tin - 26);

      // push alleen de benodige data
      alleData.push({
        datum: datum,
        uur: datumUur,
        thi: THI
      });
    }
    laadDag(1); // laad de grafiek met altijd maandag als eerste dag
  })
.catch(console.error);

function updateGrafiek(dataLijst) {
  const ctx = document.getElementById('THI-Chart');

  // zet de correcte labels en waarden
  let labels = dataLijst.map(item => 'uur ' + item.uur);
  let thiWaarden = dataLijst.map(item => item.thi);

  // check of er al een chart bestaat anders maak er 1 aan en vul de gegevens
  if (thiGrafiek) {
    thiGrafiek.data.labels = labels;
    thiGrafiek.data.datasets[0].data = thiWaarden;
    thiGrafiek.update();
  } else {
    thiGrafiek = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'binnen-THI',
          data: thiWaarden,
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
  }
}

function laadDag(dagNummer) {
    // stel de maximale uren per dag in
    let urenPerDag = 24;
    let startIndex = (dagNummer - 1) * urenPerDag;
    let eindIndex = startIndex + urenPerDag;

    // pak alleen de gewenste data uit alleData
    let gefilterdeData = alleData.slice(startIndex, eindIndex);

    updateGrafiek(gefilterdeData);
}