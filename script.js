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
          borderWidth: 1,
          pointBackgroundColor: context => {
            const value = context.raw;
            if (value > 68)
              return 'red';
            if (value > 60)
              return 'orange';
            else
              return 'green';
          },
          pointRadius: 6
        }]
      },
      options: {
        scales: {
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            beginAtZero: true,
            suggestedMax: 90
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            }
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
  updateDagKnop(startDagIndexInWeek);
}

function laadDag() {
  // bereken de startdag door de eerste datum van de json te pakken
  //  en te bereken welke dag van de week het is, daarna update de knoppen om de niet gebruikte knoppen grijs te maken
  let eersteDagVanJaar = new Date(alleData[0].datum);
  let dagIndex = eersteDagVanJaar.getUTCDay();
  let startDag = dagIndex === 0 ? 7 : dagIndex;
  updateDagKnop(startDag);

  let urenPerDag = 24;
  let gekozenDag = huidigeDag;

  // bereken daarna hoeveel dagen we vermijderd zijn van jan 1 
  // dus als bijvoorbeeld donderdag de eerste dag in het jaar is wordt gekozenDag naar 4 gezet waardoor als je knop 4 drukt dat als 0 beschouwt wordt, dus de eerste dag in de week wordt
  let dagVanafStart = ((huidigeWeek - 1) * 7) + gekozenDag - startDag;

  // breken de uren die nodig zijn voor deze dag
  let startIndex = dagVanafStart * urenPerDag;
  let eindIndex = startIndex + urenPerDag;

  // check of de data bestaat en haal de data die bij deze dag hoort op en toon deze // en check de thi values en geef aan of het te heet is
  if (startIndex >= 0 && startIndex < alleData.length) {
    let gefilterdeData = alleData.slice(startIndex, eindIndex);
    updateGrafiek(gefilterdeData);

    let huidigeDatum = gefilterdeData[0].datum.split('T')[0];
    document.getElementById("datum").innerText = ` ${huidigeDatum}`;

    // check alle thi waarden en geef een waarschuwing als de hittegrens is bereikt
    let aantalHitteGrensUren = gefilterdeData.filter(item => item.thi > 68);
    let waarschuwElement = document.getElementById("waarschuwing");

    if (aantalHitteGrensUren.length > 0) {
      waarschuwElement.style.backgroundColor = "#d31515";
      waarschuwElement.innerHTML = `<strong>Waarschuwing:</strong> Op deze dag komt de THI ${aantalHitteGrensUren.length} keer boven de grens van 68`;
    } else {
      waarschuwElement.style.backgroundColor = "#004210";
      waarschuwElement.innerHTML = `Geen hittestress gedetecteerd op deze dag`;
    }
  } else {
    document.getElementById("datum").innerText = "Geen data";
  }

  document.getElementById("huidigeWeek").innerText = `Week ${huidigeWeek}`;
  updateWeekKnoppen();
}

// kijk voor elke dag knop of het gedisabled moet worden en welke actief is
function updateDagKnop(startDagIndexInWeek) {
  let knoppen = ["ma", "di", "wo", "do", "vr", "za", "zo"];

  knoppen.forEach((id, knopIndex) => {
    let knop = document.getElementById(id);
    let dagNummerVanKnop = knopIndex + 1;

    // check of de knop gedisabled moet worden alleen voor week 1
    if (huidigeWeek === 1 && dagNummerVanKnop < startDagIndexInWeek) {
      knop.disabled = true;
      knop.style.cursor = "not-allowed";
      knop.style.opacity = "0.4";
      knop.classList.remove('active');
    } else {
      knop.disabled = false;
      knop.style.cursor = "pointer";
      knop.style.opacity = "1";

      // check of de knop momenteel geselecteerd is
      if (dagNummerVanKnop === huidigeDag) {
        knop.classList.add('active');
      } else {
        knop.classList.remove('active');
      }
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

// update de weekknoppen hun visueel als je niet meer een week terug kan of verder
function updateWeekKnoppen() {
  let maxWeken = Math.floor(alleData.length / 168);
  let weekTerug = document.getElementById("weekKnopTerug");
  let weekVerder = document.getElementById("weekKnopVerder");

  if (huidigeWeek <= 1) {
    weekTerug.disabled = true;
    weekTerug.style.opacity = "0.4";
    weekTerug.style.cursor = "not-allowed";
  } else {
    weekTerug.disabled = false;
    weekTerug.style.opacity = "1";
    weekTerug.style.cursor = "pointer";
  }

  if (huidigeWeek >= maxWeken) {
    weekVerder.disabled = true;
    weekVerder.style.opacity = "0.4";
    weekVerder.style.cursor = "not-allowed";
  } else {
    weekVerder.disabled = false;
    weekVerder.style.opacity = "1";
    weekVerder.style.cursor = "pointer";
  }
}

function kiesDag(dagNummer) {
  huidigeDag = dagNummer;
  laadDag();
}