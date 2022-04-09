// global vars
var input = document.getElementById('input');
var input_overlay = document.getElementById('input-overlay');
var ioctx = input_overlay.getContext('2d');
var output_text = document.getElementById('log');
var demo_instructions = document.getElementById('demo-instructions');
var drop_instructions = document.getElementById('drop-instructions');
var language = document.getElementById('langsel').value;

// setting up Tesseract worker
var worker = new Tesseract.createWorker({
  // function that gets passed the updates from Tesseract.js progress
  logger: progressUpdate,
  errorHandler: progressError,
});

// for adjusting image dimensions on load and drop
function setUp(){
  input_overlay.width = input.naturalWidth;
  input_overlay.height = input.naturalHeight;
  output_text.style.height = input.height + 'px';
}

// initial demo start when page fully loads
function startDemo(){
  // Tesseract OCR engine call
  async function start(){
    // setup Tesseract worker
    await worker.load();
    await worker.loadLanguage(language);
    await worker.initialize(language);

    // now attempt to recognize text
    const { data } = await worker.recognize(input);

    // display progress and recognize text in "log" window
    result(data);

    // stop listening
    input.removeEventListener('load', start);
  }

  // if loaded start the demo otherwise listen for load
  if(input.complete) start();
  else input.addEventListener('load', start);
}

// log error message when Tesseract fails
function progressError(error){
  // get html element for log output
  var log = document.getElementById('log');

  // creating new div element to "contain" error message
  var line = document.createElement('div');
  line.title = 'error';

  // creating inner "status" element
  var status = document.createElement('div');

  // now insert error message into "status" div inside of "line"
  status.appendChild(document.createTextNode(`
    Uh oh! An error occured in the previous step.
    Check the console for more detail.
  `));
  line.appendChild(status);

  // finally insert into top of log window and write error to console
  log.insertBefore(line, log.firstChild);
  console.error(error);
}

// generates progress bars in log output (on screen)
function progressUpdate(packet){
  // get html element for log output
  var log = document.getElementById('log');

  // check for progress
  if(log.firstChild && log.firstChild.title === packet.status){
    if('progress' in packet){
      // get first progress bar and update its value
      let progress = log.firstChild.querySelector('progress');
      progress.value = packet.progress;
    }
  } else{
    // make sure to finish previous progress bar
    if(log.firstChild){
      // get progress element and set value to max
      let progress = log.firstChild.querySelector('progress');
      progress.value = progress.max;
    }

    // creating new div element to "contain" the progress status
    var line = document.createElement('div');
    line.title = packet.status;

    // creating inner "status" element
    var status = document.createElement('div');
    status.className = 'status';

    // now append inner "status" class element to "container" element
    status.appendChild(document.createTextNode(packet.status));
    line.appendChild(status);

    // progress update available (and no element exists for it yet)
    if('progress' in packet){
      // create progress element and set its values to Tessaract's progress
      let progress = document.createElement('progress');
      progress.value = packet.progress;
      progress.max = 1;

      // finally add it to "container" element in "log" element for displaying
      line.appendChild(progress);
    }

    // when Tesseract is done
    if(packet.status == 'done'){
      // create element to display recognized image text
      var pre = document.createElement('pre');
      pre.appendChild(document.createTextNode(packet.data.text));

      // add recognized image text to "container" element
      line.innerHTML = '';
      line.appendChild(pre);
    }

    // finally insert element (progress bar or image text) at top of log window
    log.insertBefore(line, log.firstChild);
  }
}

// displays detected words results on screen
function result(res){
  // print Tesseract output to browser console
  console.log('result was:', res);

  // one final progress update showing the final Tesseract output
  progressUpdate({ status: 'done', data: res });

  // iterate through "recognized" text and draw box
  res.words.forEach(function(w){
    var b = w.bbox;
    ioctx.strokeWidth = 2;
    ioctx.strokeStyle = 'red';
    ioctx.strokeRect(b.x0, b.y0, b.x1-b.x0, b.y1-b.y0);
    ioctx.beginPath();
    ioctx.moveTo(w.baseline.x0, w.baseline.y0);
    ioctx.lineTo(w.baseline.x1, w.baseline.y1);
    ioctx.strokeStyle = 'green';
    ioctx.stroke();
  })
}

// clear log window after selecting new language
function clearOverLayAndOutput(){
  // clear all the boxes drawn around detected text of image
  ioctx.clearRect(0,0, input_overlay.width, input_overlay.height);

  // hiding progress and recognized text output
  output_text.style.display = 'none';

  // showing demo instructions
  demo_instructions.style.display = 'block';
}

// reset to normal log output (no demo instructions)
function resetLogOutput(){
  // hide demo instructions
  demo_instructions.style.display = 'none';

  // show output text (for progress bars and recognized text)
  output_text.style.display = 'block';
  output_text.innerHTML = '';
}

// executes Tesseract.js OCR (on click) after selecting new language
async function play(){
  // reset
  resetLogOutput();

  // call Tesseract OCR on "input" image
  await worker.load();
  await worker.loadLanguage(language);
  await worker.initialize(language);

  // now attempt to recognize text
  const { data } = await worker.recognize(input);

  // display progress and recognize text in "log" window
  result(data);
}

// updated necessary variables/HTML text after new lang selected
function resetNewLang(){
  // clear any existing output (progress bars or recognized text)
  clearOverLayAndOutput();

  // get selector element for languages
  let langSel = document.getElementById('langsel');

  // update necessary elements/variables with new language
  drop_instructions.innerHTML = langSel.options[langSel.selectedIndex].text;
  language = langSel.value;
}

// run Tesseract on file system uploaded image
function displayUploadImage(){
  // clear any existing output (progress bars or recognized text)
  clearOverLayAndOutput();

  // get dropped image file
  var file = document.getElementById('os-upload').files[0];

  // setup file reader for new image
  var reader = new FileReader();
  reader.onload = function(e){
    input.src = e.target.result;
    input.onload = function(){
      setUp();
    };
  };

  // read new image and display/setup in window
  reader.readAsDataURL(file);
}

// run Tesseract OCR on a dropped image
async function droppedImageOCR(e){
  //reset
  resetLogOutput();

  // stop elements normal reaction
  e.stopPropagation();
  e.preventDefault();

  // get dropped image file
  var file = e.dataTransfer.files[0];

  // setup file reader for new image
  var reader = new FileReader();
  reader.onload = function(e){
    input.src = e.target.result;
    input.onload = function(){
      setUp();
    };
  };

  // wipe any remaing os uploaded files
  document.getElementById('os-upload').value = '';

  // read new image and display/setup in window
  reader.readAsDataURL(file);

  // run Tesseract OCR engine on dropped image "file"
  await worker.load();
  await worker.loadLanguage(language);
  await worker.initialize(language);

  // now attempt to recognize text
  const { data } = await worker.recognize(file);

  // display progress and recognize text in "log" window
  result(data);
}
