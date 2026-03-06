document.addEventListener("DOMContentLoaded", () => {
   
/* =========================================================
   CONFIG KEYS
========================================================= */

const CONTENT_KEY = "fmcsaEmployeeContentCompleted";
const QUIZ_KEY = "fmcsaEmployeeQuizPassed";
const COMPLETED_KEY = "fmcsaEmployeeCompleted";

const ATTEMPTS_KEY = "fmcsaEmployeeAttempts";
const COOLDOWN_KEY = "fmcsaEmployeeCooldown";

const CERT_ID_KEY = "fmcsaEmployeeCertificateId";
const CERT_DATE_KEY = "fmcsaEmployeeDate";

/* =========================================================
   QUIZ SETTINGS
========================================================= */

const PASS_PERCENT = 80;
const MAX_ATTEMPTS = 3;
const COOLDOWN_MINUTES = 15;

/* =========================================================
   PDF CONFIG
========================================================= */

const url = "../assets/FMCSA - fmcsa-employee-drug-alcohol-regulations.pdf";

const pdfContainer = document.getElementById("pdfContainer");
const completeBtn = document.getElementById("completeContentBtn");

const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");

const currentPageEl = document.getElementById("currentPage");
const totalPagesEl = document.getElementById("totalPages");

let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;

/* =========================================================
   PDF LOADER
========================================================= */

if(pdfContainer){

pdfjsLib.getDocument(url).promise.then(pdf => {

pdfDoc = pdf;
totalPages = pdf.numPages;

if(totalPagesEl) totalPagesEl.textContent = totalPages;

renderPage(currentPage);

});

}

function renderPage(num){

pdfDoc.getPage(num).then(page => {

let containerWidth = pdfContainer.clientWidth || 800;

const viewport = page.getViewport({scale:1});
const scale = containerWidth / viewport.width;

const scaledViewport = page.getViewport({scale});

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");

canvas.height = scaledViewport.height;
canvas.width = scaledViewport.width;

pdfContainer.innerHTML="";
pdfContainer.appendChild(canvas);

page.render({
canvasContext:context,
viewport:scaledViewport
});

if(currentPageEl) currentPageEl.textContent=num;

if(prevPageBtn) prevPageBtn.disabled = num === 1;
if(nextPageBtn) nextPageBtn.disabled = num === totalPages;

if(completeBtn){
completeBtn.disabled = num !== totalPages;
}

});

}

/* =========================================================
   PDF NAVIGATION
========================================================= */

if(prevPageBtn){

prevPageBtn.addEventListener("click",()=>{

if(currentPage > 1){

currentPage--;
renderPage(currentPage);

}

});

}

if(nextPageBtn){

nextPageBtn.addEventListener("click",()=>{

if(currentPage < totalPages){

currentPage++;
renderPage(currentPage);

}

});

}

/* =========================================================
   CONTENT COMPLETE
========================================================= */

if(completeBtn){

completeBtn.addEventListener("click",()=>{

localStorage.setItem(CONTENT_KEY,"true");

document.getElementById("contentSection").classList.add("hidden");
document.getElementById("quizSection").classList.remove("hidden");

});

}

if(localStorage.getItem(CONTENT_KEY)==="true"){

document.getElementById("contentSection").classList.add("hidden");
document.getElementById("quizSection").classList.remove("hidden");

}

/* =========================================================
   QUIZ QUESTIONS
========================================================= */

const questions = [

{
q:"DOT drug and alcohol testing regulations apply to safety-sensitive transportation employees.",
a:{A:"True",B:"False"},
correct:"A"
},

{
q:"Employees are allowed to refuse a DOT drug test without consequence.",
a:{A:"True",B:"False"},
correct:"B"
},

{
q:"Alcohol misuse can impact job safety and performance.",
a:{A:"True",B:"False"},
correct:"A"
},

{
q:"A positive drug test may lead to removal from safety-sensitive duties.",
a:{A:"True",B:"False"},
correct:"A"
},

{
q:"DOT regulations are optional for transportation employers.",
a:{A:"True",B:"False"},
correct:"B"
}

];

let currentQuestionIndex = 0;
let selectedAnswers = JSON.parse(
localStorage.getItem("fmcsaEmployeeAnswers") || "{}"
);

let attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY)||"0",10);

const quizContainer = document.getElementById("quizContainer");
const prevQuestionBtn = document.getElementById("prevQuestionBtn");
const nextQuestionBtn = document.getElementById("nextQuestionBtn");
const submitBtn = document.getElementById("submitQuizBtn");

const resultBox = document.getElementById("quizResult");

const currentQuestionEl = document.getElementById("currentQuestion");
const totalQuestionsEl = document.getElementById("totalQuestions");

if(totalQuestionsEl) totalQuestionsEl.textContent = questions.length;

if(submitBtn) submitBtn.disabled=true;

if(quizContainer) initQuiz();

/* =========================================================
   QUIZ INIT
========================================================= */

function initQuiz(){

checkCooldown();

if(localStorage.getItem(QUIZ_KEY)==="true"){

window.location.href="fmcsa-certificates.html";
return;

}

renderQuestion();

}

/* =========================================================
   RENDER QUESTION
========================================================= */

function renderQuestion(){

const question = questions[currentQuestionIndex];

quizContainer.innerHTML = `
<p><strong>${question.q}</strong></p>

${Object.entries(question.a).map(([key,value])=>`

<label>
<input type="radio" name="answer" value="${key}"
${selectedAnswers[currentQuestionIndex]===key?"checked":""}>
${key}. ${value}
</label>

`).join("")}

`;

if(currentQuestionEl) currentQuestionEl.textContent=currentQuestionIndex+1;

if(prevQuestionBtn) prevQuestionBtn.disabled=currentQuestionIndex===0;
if(nextQuestionBtn) nextQuestionBtn.disabled=currentQuestionIndex===questions.length-1;

document.querySelectorAll("input[name='answer']").forEach(input=>{

input.addEventListener("change",e=>{

selectedAnswers[currentQuestionIndex] = e.target.value;

localStorage.setItem(
"fmcsaEmployeeAnswers",
JSON.stringify(selectedAnswers)
);
updateSubmitState();

});

});

}

/* =========================================================
   QUIZ NAV
========================================================= */

if(prevQuestionBtn){

prevQuestionBtn.addEventListener("click",()=>{

if(currentQuestionIndex>0){

currentQuestionIndex--;
renderQuestion();

}

});

}

if(nextQuestionBtn){

nextQuestionBtn.addEventListener("click",()=>{

if(currentQuestionIndex < questions.length-1){

currentQuestionIndex++;
renderQuestion();

}

});

}

/* =========================================================
   ENABLE SUBMIT
========================================================= */

function updateSubmitState(){

if(!submitBtn) return;

submitBtn.disabled = Object.keys(selectedAnswers).length !== questions.length;

}

/* =========================================================
   QUIZ SUBMIT
========================================================= */

if(submitBtn){

submitBtn.addEventListener("click",()=>{

let correct=0;

questions.forEach((q,i)=>{

if(selectedAnswers[i]===q.correct){
correct++;
}

});

const scorePercent = Math.round((correct/questions.length)*100);

if(scorePercent>=PASS_PERCENT){

/* PASS */

localStorage.setItem(COMPLETED_KEY,"true");
localStorage.setItem(QUIZ_KEY,"true");

localStorage.setItem("paid_employee_fmcsa","true");

let certId = localStorage.getItem(CERT_ID_KEY);

if(!certId){

certId = "AMS-E-" + Date.now().toString().slice(-8);

localStorage.setItem(CERT_ID_KEY,certId);

}

localStorage.setItem(CERT_DATE_KEY,Date.now());

localStorage.removeItem(ATTEMPTS_KEY);
localStorage.removeItem(COOLDOWN_KEY);
localStorage.removeItem("fmcsaEmployeeAnswers");   

resultBox.innerHTML=`
<div class="result-box pass">
You passed! Generating certificate...
</div>
`;

setTimeout(()=>{

window.location.href="fmcsa-certificates.html";

},2000);

}else{

/* FAIL */

attempts++;
localStorage.setItem(ATTEMPTS_KEY,attempts);

if(attempts>=MAX_ATTEMPTS){

const cooldownUntil = Date.now() + (COOLDOWN_MINUTES*60000);

localStorage.setItem(COOLDOWN_KEY,cooldownUntil);

alert("Maximum attempts reached. 15 minute cooldown.");

window.location.reload();

return;

}

resultBox.innerHTML=`
<div class="result-box fail">
Score: ${scorePercent}% <br>
Attempt ${attempts} of ${MAX_ATTEMPTS}
</div>
`;

}

});

}

/* =========================================================
   COOLDOWN CHECK
========================================================= */

function checkCooldown(){

const cooldownUntil = parseInt(localStorage.getItem(COOLDOWN_KEY)||"0",10);

if(Date.now()<cooldownUntil){

const minutesLeft = Math.ceil((cooldownUntil-Date.now())/60000);

alert(`Quiz locked. Try again in ${minutesLeft} minutes.`);

window.location.href="dashboard.html";

}

}

/* =========================================================
   INITIALIZE MODULE
========================================================= */

if(localStorage.getItem(CONTENT_KEY)==="true"){

document.getElementById("contentSection").classList.add("hidden");
document.getElementById("quizSection").classList.remove("hidden");

initQuiz();

}

if(pdfContainer){

pdfjsLib.getDocument(url).promise.then(pdf => {

pdfDoc = pdf;
totalPages = pdf.numPages;

if(totalPagesEl) totalPagesEl.textContent = totalPages;

renderPage(currentPage);

});

}

});
