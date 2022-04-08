// global vars
var input = document.getElementById('input')
var input_overlay = document.getElementById('input-overlay')
var ioctx = input_overlay.getContext('2d')
var output_text = document.getElementById('log')
var demo_instructions = document.getElementById('demo-instructions')
var drop_instructions = document.getElementById('drop-instructions')
var language = document.getElementById('langsel').value
var demoStarted = false

// setting up Tesseract worker
var worker = new Tesseract.createWorker({
  logger: progressUpdate,
});

// for adjusting image dimensions on load and drop
function setUp(){
	input_overlay.width = input.naturalWidth
	input_overlay.height = input.naturalHeight

	output_text.style.height = input.height + 'px'
}

// initial demo start when page fully loads
function startDemo(){
	demoStarted = true

	async function start(){
    await worker.load();
    await worker.loadLanguage(language);
    await worker.initialize(language);
    const { data } = await worker.recognize(input);
    result(data);

		input.removeEventListener('load', start)
	}

	if(input.complete) start();
	else input.addEventListener('load', start)
}

// generates progress bars in log output (on screen)
function progressUpdate(packet){
	var log = document.getElementById('log');

	if(log.firstChild && log.firstChild.status === packet.status){
		if('progress' in packet){
			var progress = log.firstChild.querySelector('progress')
			progress.value = packet.progress
		}
	}else{
		var line = document.createElement('div');
		line.status = packet.status;
		var status = document.createElement('div')
		status.className = 'status'
		status.appendChild(document.createTextNode(packet.status))
		line.appendChild(status)

		if('progress' in packet){
			var progress = document.createElement('progress')
			progress.value = packet.progress
			progress.max = 1
			line.appendChild(progress)
		}


		if(packet.status == 'done'){
			var pre = document.createElement('pre')
			pre.appendChild(document.createTextNode(packet.data.text))
			line.innerHTML = ''
			line.appendChild(pre)

		}

		log.insertBefore(line, log.firstChild)
	}
}

// displays detected words results on screen
function result(res){
	console.log('result was:', res)

	progressUpdate({ status: 'done', data: res })

	res.words.forEach(function(w){
		var b = w.bbox;

		ioctx.strokeWidth = 2

		ioctx.strokeStyle = 'red'
		ioctx.strokeRect(b.x0, b.y0, b.x1-b.x0, b.y1-b.y0)
		ioctx.beginPath()
		ioctx.moveTo(w.baseline.x0, w.baseline.y0)
		ioctx.lineTo(w.baseline.x1, w.baseline.y1)
		ioctx.strokeStyle = 'green'
		ioctx.stroke()
	})
}

// clear log window after selecting new language
function clearOverLayAndOutput(){
	ioctx.clearRect(0,0, input_overlay.width, input_overlay.height)

	output_text.style.display = 'none'

	demo_instructions.style.display = 'block'
}

// executes Tesseract.js OCR (on click) after selecting new language
async function play(){

	demo_instructions.style.display = 'none'
	output_text.style.display = 'block'
	output_text.innerHTML = ''

  await worker.load();
  await worker.loadLanguage(language);
  await worker.initialize(language);
  const { data } = await worker.recognize(input);
  result(data);
}

// updated necessary variables/HTML text after new lang selected
function resetNewLang(){
	clearOverLayAndOutput();
	let langSel = document.getElementById('langsel');
	drop_instructions.innerHTML = langSel.options[langSel.selectedIndex].text;
	language = langSel.value;
}

// run Tesseract OCR on a dropped image
async function droppedImageOCR(e){
	 demo_instructions.style.display = 'none'
	 output_text.style.display = 'block'
	 output_text.innerHTML = ''
	 e.stopPropagation();
	 e.preventDefault();
	 var file = e.dataTransfer.files[0]
	 var reader = new FileReader();
	 reader.onload = function(e){
		 input.src = e.target.result;
		 input.onload = function(){
			 setUp();
		 }
	 };
	 reader.readAsDataURL(file);
		await worker.load();
		await worker.loadLanguage(language);
		await worker.initialize(language);
		const { data } = await worker.recognize(file);
		result(data);
}
