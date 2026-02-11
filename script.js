class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }

    getNumericValue() {
        if (this.value === "A") return 14;
        if (this.value === "K") return 13;
        if (this.value === "Q") return 12;
        if (this.value === "J") return 11;
        return parseInt(this.value);
    }

    toString() {
        return this.value + this.suit;
    }
}

class Deck {
    constructor() {
        this.suits = ["♠","♥","♦","♣"];
        this.values = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
        this.cards = [];
        this.create();
    }

    create() {
        this.cards = [];
        for (let s of this.suits) {
            for (let v of this.values) {
                this.cards.push(new Card(s,v));
            }
        }
    }

    shuffle() {
        this.cards.sort(() => Math.random() - 0.5);
    }

    deal() {
        return this.cards.pop();
    }
}

class Player {
    constructor(name) {
        this.name = name;
        this.hand = [];
    }

    draw(deck) {
        this.hand.push(deck.deal());
    }

    reset() {
        this.hand = [];
    }
}

class Game {
    constructor() {
        this.deck = new Deck();
        this.player = new Player("You");
        this.dealer = new Player("Dealer");
        this.tokens = 100;
    }

    startRound() {
        this.deck.create();
        this.deck.shuffle();
        this.player.reset();
        this.dealer.reset();

        for (let i = 0; i < 5; i++) {
            this.player.draw(this.deck);
            this.dealer.draw(this.deck);
        }
    }

    evaluate(hand) {
        const values = hand.map(c => c.getNumericValue()).sort((a,b)=>b-a);
        const suits = hand.map(c => c.suit);

        const counts = {};
        values.forEach(v => counts[v] = (counts[v]||0)+1);

        const uniqueValues = Object.keys(counts).map(Number).sort((a,b)=>b-a);
        const countValues = Object.values(counts).sort((a,b)=>b-a);

        const isFlush = suits.every(s => s === suits[0]);

        const sortedAsc = [...values].sort((a,b)=>a-b);
        const isStraight = sortedAsc.every((v,i,a)=> i===0 || v===a[i-1]+1);

        if (isFlush && sortedAsc.toString() === "10,11,12,13,14")
            return [10, values, "Royal Flush"];

        if (isFlush && isStraight)
            return [9, values, "Straight Flush"];

        if (countValues[0] === 4) {
            const four = uniqueValues.find(v => counts[v] === 4);
            const kicker = uniqueValues.find(v => counts[v] === 1);
            return [8, [four, kicker], "Four of a Kind"];
        }

        if (countValues[0] === 3 && countValues[1] === 2) {
            const three = uniqueValues.find(v => counts[v] === 3);
            const pair = uniqueValues.find(v => counts[v] === 2);
            return [7, [three, pair], "Full House"];
        }

        if (isFlush) return [6, values, "Flush"];
        if (isStraight) return [5, values, "Straight"];

        if (countValues[0] === 3) {
            const three = uniqueValues.find(v => counts[v] === 3);
            const kickers = uniqueValues.filter(v => counts[v] === 1);
            return [4, [three, ...kickers], "Three of a Kind"];
        }

        if (countValues[0] === 2 && countValues[1] === 2) {
            const pairs = uniqueValues.filter(v => counts[v] === 2);
            const kicker = uniqueValues.find(v => counts[v] === 1);
            return [3, [...pairs, kicker], "Two Pair"];
        }

        if (countValues[0] === 2) {
            const pair = uniqueValues.find(v => counts[v] === 2);
            const kickers = uniqueValues.filter(v => counts[v] === 1);
            return [2, [pair, ...kickers], "One Pair"];
        }

        return [1, values, "High Card"];
    }

    compareHands() {
        const pEval = this.evaluate(this.player.hand);
        const dEval = this.evaluate(this.dealer.hand);

        if (pEval[0] > dEval[0]) return ["win", pEval[2]];
        if (pEval[0] < dEval[0]) return ["lose", dEval[2]];

        for (let i = 0; i < pEval[1].length; i++) {
            if (pEval[1][i] > dEval[1][i]) return ["win", pEval[2]];
            if (pEval[1][i] < dEval[1][i]) return ["lose", dEval[2]];
        }

        return ["tie", pEval[2]];
    }
}

/* ================= UI FLOW ================= */

let game = new Game();

const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");

const revealBtn = document.getElementById("revealBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");

const playerDiv = document.getElementById("playerCards");
const dealerDiv = document.getElementById("dealerCards");
const statusDiv = document.getElementById("status");
const tokenSpan = document.getElementById("tokens");
const betInput = document.getElementById("betInput");

startBtn.addEventListener("click", () => {
    startScreen.style.display = "none";
    gameScreen.style.display = "block";
    startNewRound();
});

function startNewRound() {
    game.startRound();
    tokenSpan.textContent = game.tokens;
    betInput.value = "";
    statusDiv.textContent = "";
    nextBtn.disabled = true;
    revealBtn.disabled = false;

    displayPlayerCards();
    displayDealerHidden();
}

revealBtn.addEventListener("click", () => {
    const bet = parseInt(betInput.value);

    if (!bet || bet <= 0 || bet > game.tokens) {
        alert("Invalid bet.");
        return;
    }

    displayDealerCards();

    const result = game.compareHands();

    if (result[0] === "win") {
        game.tokens += bet;
        statusDiv.textContent = `You win with ${result[1]}!`;
    } else if (result[0] === "lose") {
        game.tokens -= bet;
        statusDiv.textContent = `Dealer wins with ${result[1]}!`;
    } else {
        statusDiv.textContent = `Tie with ${result[1]}!`;
    }

    tokenSpan.textContent = game.tokens;

    revealBtn.disabled = true;
    nextBtn.disabled = false;
});

nextBtn.addEventListener("click", startNewRound);

restartBtn.addEventListener("click", () => {
    game = new Game();
    startNewRound();
});

function displayPlayerCards() {
    playerDiv.innerHTML = "";
    game.player.hand.forEach(card => {
        const div = document.createElement("div");
        div.classList.add("card");
        div.textContent = card.toString();
        playerDiv.appendChild(div);
    });
}

function displayDealerHidden() {
    dealerDiv.innerHTML = "";
    for (let i = 0; i < 5; i++) {
        const div = document.createElement("div");
        div.classList.add("card");
        div.textContent = "🂠";
        dealerDiv.appendChild(div);
    }
}

function displayDealerCards() {
    dealerDiv.innerHTML = "";
    game.dealer.hand.forEach(card => {
        const div = document.createElement("div");
        div.classList.add("card");
        div.textContent = card.toString();
        dealerDiv.appendChild(div);
    });
}
