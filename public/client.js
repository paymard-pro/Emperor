const socket = io('http://192.168.1.3:3000');
//
let searchbtn = document.getElementById('search');
let mainMenu = document.getElementById('main');
let waitMenu = document.getElementById('wait');
let deckME = document.getElementById('deck-me');
let deckEnemy = document.getElementById('deck-enemy');
let gameMenu = document.getElementById('game');
let activeEnemyCard = document.getElementById('active-card-enemy');
let activeMeCard = document.getElementById('active-card-me');
let nameMe = document.getElementById('name-me');
let nameEnemy = document.getElementById('name-enemy');
let scoreME = document.getElementById('score-me');
let scoreEnemy = document.getElementById('score-enemy');
let boardGame = document.getElementById('board-game');

const EMPEROR = 'yellow';
const SOLIDER = 'blue';
const BARDEH = 'red';

let name = 'unknown';
let id = '';
let enemy = '';
let room = '';
let state = {};
let emperor = false;

let selected = false ;

let specialIndex = 0 ;
let currentIndex = 0;

const scoreToCard = {1 : SOLIDER , 2: BARDEH , 4 : EMPEROR};

searchbtn.addEventListener('click' , search);

async function search(){
    socket.emit('findOpponent' , name);
}

socket.on('waiting' , () => {
    mainMenu.style.display = 'none';
    waitMenu.style.display = 'block';
})

socket.on('ready' , (data) => {
    id = socket.id;
    room = data.room;
    state = data.state;
    emperor = state[id].emperor;
    enemy = state.player1.id == id ? state.player2.id : state.player1.id;

    console.log(state);

    nameMe.innerHTML = name;
    nameEnemy.innerHTML = state[enemy].name;

    nextRound();

    mainMenu.style.display = 'none';
    waitMenu.style.display = 'none';
    gameMenu.style.display = 'block';


})


function nextRound() {

    emperor = !emperor;
    let random = Math.floor(Math.random() * 5) + 1;
    specialIndex = random;
    let html = '';
    let color = emperor ? EMPEROR : BARDEH;

    for (let i = 1; i <= 5; i++) {
        if (i == specialIndex) html += `<div class ='card' data-index = ${i} style="background-color: ${color}" onclick="selectCard()"></div>`
        else html += `<div class ='card' data-index = ${i} style="background-color: ${SOLIDER}" onclick="selectCard()"></div>`
    }


    deckME.innerHTML = html;
    deckEnemy.innerHTML = `
<div class='card' data-index='1'></div>
<div class='card' data-index='2'></div>
<div class='card' data-index='3'></div>
<div class='card' data-index='4'></div>
<div class='card' data-index='5'></div>`

}

socket.on('selected' , () => {

    selected = true;

    deckEnemy.children[0].remove();
    activeEnemyCard.style.borderColor = 'red';

})

socket.on('endRound' , (data) => {
    state = data;

    if(!selected) deckEnemy.children[0].remove();
    selected = false;

    console.log('current:' , currentIndex , '-id :' , id);
    for (let child of deckME.children) if(child.dataset.index == currentIndex) child.remove();

    activeMeCard.style.backgroundColor = scoreToCard[state[id].card];
    activeEnemyCard.style.backgroundColor = scoreToCard[state[enemy].card];

    setTimeout(renderScore , 2000);
})

function renderScore(){

    activeMeCard.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    activeEnemyCard.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    activeEnemyCard.style.borderColor = 'black';

    scoreME.innerHTML = state[id].score ;
    scoreEnemy.innerHTML = state[enemy].score;

    if(!state.draw) nextRound();
}

function selectCard(){

    let selectID = event.target.dataset.index;
    event.target.style.borderColor = 'red';
    currentIndex = selectID ;

    let card = currentIndex != specialIndex? 1 : (emperor ? 4 : 2);

    console.log('select:' , selectID , '-special:' , specialIndex , '-card:' , card );

    socket.emit('select' , {card , room});
}


function getName() {
    let localName = localStorage.getItem('name');
    if (!localName) {
        localName = prompt('اسمت رو وارد کن.');
        if (!localName || localName == "") localName = 'اسکل';
        localStorage.setItem('name', localName);
    }

    name = localName;
}


socket.on('start' , (data) => {

    waitMenu.style.display = 'none';
    gameMenu.style.display = 'block'

    room = data.room;
    let colorMe , colorEnemy ;
    if(id == data.id) [colorMe,colorEnemy] = [EMPEROR , BARDEH] ;
    else [colorMe,colorEnemy] = [BARDEH , EMPEROR];



    deckME.children.foreach( (e, index) => {
        if(index == 0) e.style.backgroundColor = colorMe;
        else e.style.backgroundColor = SOLIDER;
    })

    deckEnemy.children.foreach( (e , index) => {
        if(index == 0) e.style.backgroundColor = colorEnemy;
        else e.style.backgroundColor = SOLIDER;
    })
})

getName();

