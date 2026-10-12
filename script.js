let alleData = [];
let thiGrafiek = null;

let huidigeWeek = 1;
let huidigeDag = 1;

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
    // bereken de eerste dag van het jaar, zodat dat niet altijd een maandag is
    let eersteDatum = Object.keys(data)[0];
    let eersteDagVanJaar = new Date(data[eersteDatum].date);
    let dagIndex = eersteDagVanJaar.getUTCDay();

    setBeginDatum(dagIndex);
    laadDag();
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

// bereken de beginindex bij het laden van de website
function setBeginDatum(index) {
  let startDagIndexInWeek = index === 1 ? 7 : index;

  huidigeDag = startDagIndexInWeek;
  updateKnop(startDagIndexInWeek);
}

function laadDag() {
  // bereken de startdag door de eerste datum van de json te pakken
  //  en te bereken welke dag van de week het is, daarna update de knoppen om de niet gebruikte knoppen grijs te maken
  let eersteDagVanJaar = new Date(alleData[0].datum);
  let dagIndex = eersteDagVanJaar.getUTCDay();
  let startDag = dagIndex === 0 ? 7 : dagIndex;
  updateKnop(startDag);

  let urenPerDag = 24;
  let gekozenDag = huidigeDag;

  // bereken daarna hoeveel dagen we vermijderd zijn van jan 1 
  // dus als bijvoorbeeld donderdag de eerste dag in het jaar is wordt gekozenDag naar 4 gezet waardoor als je knop 4 drukt dat als 0 beschouwt wordt, dus de eerste dag in de week wordt
  let dagVanafStart = ((huidigeWeek - 1) * 7) + gekozenDag - startDag;

  // breken de uren die nodig zijn voor deze dag
  let startIndex = dagVanafStart * urenPerDag;
  let eindIndex = startIndex + urenPerDag;

  // check of de data bestaat en haal de data die bij deze dag hoort op en toon deze
  if (startIndex >= 0 && startIndex < alleData.length) {
    let gefilterdeData = alleData.slice(startIndex, eindIndex);
    updateGrafiek(gefilterdeData);

    let huidigeDatum = gefilterdeData[0].datum.split('T')[0];
    document.getElementById("datum").innerText = `Datum: ${huidigeDatum}`;
  } else {
    document.getElementById("datum").innerText = "Geen data";
  }

  document.getElementById("huidigeWeek").innerText = `Week ${huidigeWeek}`;
}

// kijk voor elke dag knop of het gedisabled moet worden
function updateKnop(startDagIndexInWeek) {
  let knoppen = ["ma", "di", "wo", "do", "vr", "za", "zo"];

  knoppen.forEach((id, knopIndex) => {
    let knop = document.getElementById(id);

    if (huidigeWeek === 1 && knopIndex + 1 < startDagIndexInWeek) {
      knop.disabled = true;
      knop.style.cursor = "not-allowed";
    } else {
      knop.disabled = false;
      knop.style.cursor = "pointer";
    }
  });
}

function weekVerder() {
  let maxWeken = Math.floor(alleData.length / 168);
  if (huidigeWeek < maxWeken) {
    huidigeWeek++;
    laadDag();
  }
}

function weekTerug() {
  if (huidigeWeek > 1) {
    huidigeWeek--;
    // keer altijd terug naar de laagste available datum als het terug naar week 1 gaat
    if (huidigeWeek === 1) {
      let eersteDagVanJaar = new Date(alleData[0].datum);
      let dagIndex = eersteDagVanJaar.getUTCDay();
      let startDagIndexInWeek = dagIndex === 0 ? 7 : dagIndex;
      huidigeDag = startDagIndexInWeek;
    }
    laadDag();
  }
}

function kiesDag(dagNummer) {
  huidigeDag = dagNummer;
  laadDag();
}