
// Service worker regisztrálása
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('Service Worker aktív ✅'))
    .catch(err => console.log('Service Worker hiba ❌', err));
}


const beleegyezett = document.querySelector(
  'input[name="studiouzenet"][value="igen"]'
).checked;




function sendToGoogle() {
  const beleegyezett = document.querySelector('input[name="studiouzenet"][value="igen"]').checked;
  const szulDatum = document.getElementById("szuletesi").value; // YYYY-MM-DD

  if(!beleegyezett) {
    alert("A stúdió értesítéséhez beleegyezés szükséges!");
    return;
  }

  fetch("https://docs.google.com/forms/d/e/1FAIpQLSeXhMhTqhyH8-gbGWo_i87c7pmklf4FfVtAFm3dcBvpbRcQRg/formResponse", {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      "entry.2036885871": document.getElementById("nev").value,
      "entry.1314725415": document.getElementById("email").value,
      "entry.177461580": szulDatum,  // egész dátum YYYY-MM-DD
      "entry.1181453253": "Igen"    // Beleegyezés
    })
  });

  alert("Adatok elküldve!");
}




(function(){
  // canvas aláírás beállítása (érintés és egér)
  const canvas = document.getElementById('sigCanvas');
  const ctx = canvas.getContext('2d');
  let drawing=false, lastX=0, lastY=0;

  function resizeCanvas(){
    // nagyobb belső felbontás a tiszta mentéshez
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    // fehér háttér
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,canvas.clientWidth,canvas.clientHeight);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function getPos(e){
    const rect = canvas.getBoundingClientRect();
    if(e.touches){
      return {x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top};
    } else {
      return {x: e.clientX - rect.left, y: e.clientY - rect.top};
    }
  }

  canvas.addEventListener('pointerdown', (e)=>{
    drawing=true;
    const p = getPos(e);
    lastX = p.x; lastY = p.y;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', (e)=>{
    if(!drawing) return;
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastX = p.x; lastY = p.y;
    e.preventDefault();
  });
  canvas.addEventListener('pointerup', ()=> drawing=false);
  canvas.addEventListener('pointerleave', ()=> drawing=false);

  // clear signature
  document.getElementById('clearSig').addEventListener('click', ()=>{
    ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
    // fehér hátteret rajzolunk újra
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,canvas.clientWidth,canvas.clientHeight);
  });

  // PDF mentés logika
  const saveBtn = document.getElementById('saveBtn');
  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modalClose');

  modalClose.addEventListener('click', ()=> {
    modal.classList.remove('show');
    // reset form
    resetForm();
  });

  function resetForm(){
    // töröljük a mezőket
    const inputs = document.querySelectorAll('#leftColumn input[type="text"], #leftColumn input[type="email"], #leftColumn input[type="date"]');
    inputs.forEach(i=> i.value='');
    const textareas = document.querySelectorAll('#leftColumn textarea');
    textareas.forEach(t=> t.value='');
    // rádiók: visszaállítjuk alapértékekre (nem)
    const radios = document.querySelectorAll('#leftColumn input[type="radio"]');
    radios.forEach(r => { if(r.value==='nem') r.checked = true; else r.checked = false; });
    document.getElementById('adatok_tarolasa').checked = false;

    // clear signature
    ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.clientWidth,canvas.clientHeight);
  }

  saveBtn.addEventListener('click', async ()=>{


    const beleegyezett = document.querySelector(
        'input[name="studiouzenet"][value="igen"]'
      ).checked;

      if (beleegyezett) {
        sendToGoogle();
      }


    // ellenőrizzük a "beleegyez" (az eredeti papíron vannak kötelezők - itt legalább aláírás)
    const name = document.getElementById('nev').value.trim();
    const date = document.getElementById('datum').value;
    const beleegyezok = document.querySelectorAll('input[name="fizetes"], input[name="garancia"]'); // példa
    // legalább név és aláírás legyen kitöltve
    // ellenőrizzük, hogy a canvason van-e rajz (aláírás)
    const blank = isCanvasBlank(canvas);
    if(!name){
      alert('Kérlek add meg a nevet!');
      return;
    }
    if(blank){
      alert('Kérlek írd alá a nyilatkozatot a dedikált helyen!');
      return;
    }

    // Készítünk egy képet a teljes "paper" elemről -> PDF
    const paper = document.getElementById('paper');
    // megváltoztatjuk a stílust ideiglenesen, hogy a canvas ne legyen túl kicsi a mentéskor
    try {
      // használjuk html2canvas-ot a paper DOM kigenerálásához
      const scale = 2;
      const rect = paper.getBoundingClientRect();
      const canvasImg = await html2canvas(paper, { scale: scale, useCORS:true, allowTaint:true, backgroundColor: '#ffffff' });
      const imgData = canvasImg.toDataURL('image/png');

      // jsPDF készítése (A4 portrait) -> méretezés, hogy jól nézzen ki
      const { jsPDF } = window.jspdf;
      // A4 mm
      const pdf = new jsPDF({
        unit: 'px',
        format: [canvasImg.width, canvasImg.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvasImg.width, canvasImg.height);

      // fájlnév: Beleegyezes_Nev_Dátum.pdf
      const safeName = name.replace(/\s+/g,'_').replace(/[^\w\-\.]/g,'');
      const fileName = `Beleegyezo_${safeName}_${Date.now()}.pdf`;

      pdf.save(fileName);

      // mutatjuk a köszönőablakot, majd reset
      modal.classList.add('show');

    } catch(err){
      console.error('PDF generálási hiba:', err);
      alert('Hiba történt a PDF készítése során. Próbáld újra.');
    }
  });

  function isCanvasBlank(c){
    const blank = document.createElement('canvas');
    blank.width = c.width; blank.height = c.height;
    const bctx = blank.getContext('2d');
    // fehér háttér
    bctx.fillStyle = '#fff';
    bctx.fillRect(0,0,blank.width,blank.height);
    // összehasonlítjuk a képadatokat
    return c.toDataURL() === blank.toDataURL();
  }

})();






