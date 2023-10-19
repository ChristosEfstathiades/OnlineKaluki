module.exports = { initGame, baseGameState, updateScores, lastPlayerRemaining, removeLosers, resetState };

const Deck = require("./deck");

function initGame() {
  const state = createGameState();
  return state;
}

function createGameState() {
  let cards = new Deck([]);
  cards.fillDeck();
  cards.shuffle();
  cards.discardPile.push(cards.deck[0]);
  cards.deck.shift();
  cards.discardPile.push(cards.deck[0]);
  cards.deck.shift();

  return {
    players: [],
    playersData: [],
    cards: cards,
    gameStarted: false,
    n: 0,
  }

}

function baseGameState(state) {
  state.players.forEach(player => {
    newDeck = state.cards.deck.splice(13);
    state.cards.orderCards(state.cards.deck);

    player.number = state.n + 1;
    player.cards = state.cards.deck

    state.playersData.push({
      number: player.number,
      points: 0,
      myTurn: player.myTurn,
    });

    state.cards.deck = newDeck;
    state.n++;
  });

  return state;
}

function updateScores(state) {
  state.players.forEach(player => {
    player.cards.forEach(card => {
      player.points += card.value
    })
  })

  return state;
}

function lastPlayerRemaining(state, winner) {
  gameOver = true;
  state.players.forEach(player => {
    if (player != winner && player.points < 99) {
      gameOver = false
    }
  })
  return gameOver;
}

function removeLosers(state, clientRooms, Socketio) {
  state.players.forEach(player => {
    if (player.points > 99) {
      playerIndex = state.players.indexOf(player);
      state.players.splice(playerIndex, 1);
      console.log(clientRooms)      
      delete clientRooms[player.id]
      console.log(clientRooms)      

      Socketio.to(player.id).emit('boardReset');
      //reset client state
    }
  })
}

function resetState(state) {
  let cards = new Deck([]);
  cards.fillDeck();
  cards.shuffle();
  cards.discardPile.push(cards.deck[0]);
  cards.deck.shift();
  cards.discardPile.push(cards.deck[0]);
  cards.deck.shift();

  state.cards = cards
  
  state.players.forEach(player => {
    newDeck = state.cards.deck.splice(13);
    state.cards.orderCards(state.cards.deck);

    player.cards = state.cards.deck
    player.cardCount = 13
    player.joker = true
    player.fiftyDown = false

    state.playersData.push({
      number: player.number,
      points: player.points,
      myTurn: player.myTurn,
    });

    state.cards.deck = newDeck;
  });

  return state;
}

