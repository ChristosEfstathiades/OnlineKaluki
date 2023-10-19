// const Express = require("express");
// const Http = require("http").Server(Express);
const Socketio = require("socket.io")({
  cors: {
    origin: "*",
  },
});

const Deck = require("./deck");
const { makeid } = require("./utils");
const { initGame, baseGameState, updateScores, lastPlayerRemaining, removeLosers, resetState } = require("./game");

const state = {};
const clientRooms = {};

let n = 0;

Socketio.on("connection", (socket) => {
  socket.on("createGame", () => {
    let roomName = makeid(5);
    clientRooms[socket.id] = roomName;
    state[roomName] = initGame();

    state[roomName].players.push({
      id: socket.id,
      points: 0,
      cards: null,
      cardCount: 13,
      joker: true,
      myTurn: true,
      fiftyDown: false,
    });

    socket.join(roomName);

    socket.emit("enterLobby", roomName);
    socket.emit("playerCount", 1);
    socket.emit("host");
  });

  socket.on("joinGame", (roomName) => {
    if (state[roomName]) {
      playerCount = state[roomName].players.length;
      if (playerCount > 0 && playerCount < 7) {
        clientRooms[socket.id] = roomName;

        state[roomName].players.push({
          id: socket.id,
          points: 0,
          cards: null,
          cardCount: 13,
          joker: true,
          myTurn: false,
          fiftyDown: false,
        });

        socket.join(roomName);

        socket.emit("enterLobby", roomName);

        Socketio.in(roomName).emit(
          "playerCount",
          state[roomName].players.length
        );
      }
    }
  });

  socket.on("start", (roomName) => {
    playerCount = state[roomName].players.length;
    if (playerCount > 1 && playerCount < 7) {
      state[roomName] = baseGameState(state[roomName]);
      // socket.emit("start", {
      //   playerCount: players.length,
      //   player: players[n],
      //   discardPile: cards.discardPile,
      //   tableSets: [],
      // });
      Socketio.in(roomName).emit("start", {
        gameData: {
          playerCount: playerCount,
          discardPile: state[roomName].cards.discardPile,
          tableSets: [],
        },
        playersData: state[roomName].playersData,
      });

      state[roomName].players.forEach((player) => {
        Socketio.to(player.id).emit("playerData", player);
      });

      // Socketio.emit("otherPlayers", playersData);
    }
  });

  socket.on("drawCard", (data) => {
    const roomName = clientRooms[socket.id];
    state[roomName].players.forEach((player) => {
      if (player.number == data.id) {
        player.cardCount++;
        if (data.pile == "deck") {
          card = state[roomName].cards.drawCard();
          player.cards.push(card);
          socket.emit("newCard", card);
          Socketio.in(roomName).emit(
            "newDiscardPile",
            state[roomName].cards.discardPile
          );
        } else if (data.pile == "discard") {
          card = state[roomName].cards.discardPile[0];
          state[roomName].cards.discardPile.shift();
          player.cards.push(card);
          //TODO merge newCard with newCards or summin
          socket.emit("newCard", card);
          Socketio.in(roomName).emit(
            "newDiscardPile",
            state[roomName].cards.discardPile
          );
        }
      }
    });
  });

  socket.on("discardCard", (data) => {
    const roomName = clientRooms[socket.id];

    let cardFound = false;
    state[roomName].players.forEach((player) => {
      if (player.number == data.id) {
        player.cardCount--;
        for (let i = 0; i < player.cards.length; i++) {
          if (player.cards[i].img == data.card.img && !cardFound) {
            let discarded = player.cards.splice(i, 1);
            state[roomName].cards.discardPile.unshift(discarded[0]);
            Socketio.in(roomName).emit("newDiscardPile", state[roomName].cards.discardPile);
            socket.emit("newCards", player.cards);
            cardFound = true;
            if (player.cards.length == 0) {
              
              state[roomName] = updateScores(state[roomName]) //works
              
              if (lastPlayerRemaining(state[roomName], player)) {
                console.log("gameOver")
              } else {
                removeLosers(state[roomName], clientRooms, Socketio) // works
              }

              state[roomName] = resetState(state[roomName])

              Socketio.in(roomName).emit("start", {
                gameData: {
                  playerCount: playerCount,
                  discardPile: state[roomName].cards.discardPile,
                  tableSets: state[roomName].cards.sets,
                },
                playersData: state[roomName].playersData,
              });

              state[roomName].players.forEach((player) => {
                Socketio.to(player.id).emit("playerData", player);
              });
            }
          }
        }
      }
    });
  });

  socket.on("changeTurn", (id) => {
    const roomName = clientRooms[socket.id];
    let game = state[roomName]
    for (let i = 0; i < game.players.length; i++) {
      if (game.players[i].number == id) {
        game.players[i].myTurn = false;

        game.cards.orderCards(game.players[i].cards);
        socket.emit("newCards", game.players[i].cards);

        if (i + 1 == game.players.length) {
          game.players[0].myTurn = true;
          Socketio.in(roomName).emit("nextTurn", game.players[0].number);
        } else {
          game.players[i + 1].myTurn = true;
          Socketio.in(roomName).emit("nextTurn", game.players[i + 1].number);
        }
        break;
      }
    }
  });

  socket.on("set", (data) => {
    const roomName = clientRooms[socket.id];
    let game = state[roomName]
    game.players.forEach((player) => {
      if (player.number == data.id) {
        //TODO  remove set points because i dont fucking need them LOOOOOOL

        total = 0;
        data.sets.forEach((set) => {
          set.forEach((card) => {
            total += card.value;
          });
        });

        if (game.cards.validateSets(player.fiftyDown, total, data.sets, data.hand)) {
          player.fiftyDown = true;
          data.sets.forEach((set) => {
            setTotal = 0;
            set.forEach((card) => {
              setTotal += card.value;
            });
            game.cards.addSet(set, player.number, setTotal);
            player.cardCount -= set.length;
            player.cards = game.cards.removeFromHand(player.cards, set);
          });

          game.cards.orderCards(player.cards);
          socket.emit("newCards", player.cards);
          Socketio.in(roomName).emit("tableSets", game.cards.sets);
          // player.points += total;
          //TODO use this later when adding points
          // Socketio.emit("newPoints", {
          //     playerNumber: player.number,
          //     points: player.points
          // });
        } else {
          console.log("invalid");
        }
      }
    });
  });

  socket.on('leaveRoom', (roomCode) => {
    socket.leave(roomCode);
  })

  socket.on("disconnect", () => {
    // console.log(socket.id);
    // players.pop();
    // Socketio.emit("playerCount", players.length);
  });
});

Socketio.listen(3000);
