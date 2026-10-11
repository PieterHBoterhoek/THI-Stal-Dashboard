const htmlData = document.getElementById('testData');

fetch('weerdata.json')
  .then((response) => response.json())
  .then((data) => {
    let htmlInhoud = "";

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

      htmlInhoud += datum + " -  " + datumUur + " -  " + Tout + " -  " + RHout +"<br> Tin is = " + Tin + "<br> RHin is = " + RHin + "<br> THI is = " + THI + "<br> <br>";
    }
    htmlData.innerHTML = htmlInhoud;
  })
.catch(console.error);