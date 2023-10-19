module.exports = class Deck {
    constructor(deck) {
        this.deck = deck;
    }

    suits = ['Heart', 'Spade', 'Diamond', 'Club'];
    pictures = ['Jack', 'Queen', 'King', 'Ace'];
    cardRanks = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    orders = [0.1, 0.2, 0.3, 0.4]
    tempone = null;
    temptwo = null;
    removedCards = [];
    match = null;

    sets = [];

    discardPile = [];

    fillDeck() {
        this.suits.forEach(suit => {
            for (let i = 2; i < 11.; i++) {
                this.deck.push({
                    value: i,
                    suit: suit,
                    type: 'number',
                    img: `${i}` + suit[0],
                    order: i + this.orders[this.suits.indexOf(suit)]
                });
            };
            this.pictures.forEach(picture => {
                this.deck.push({
                    value: picture == 'Ace' ? 11 : 10,
                    suit: suit,
                    type: picture,
                    img: picture[0] + suit[0],
                    order: 10 + (this.orders[this.suits.indexOf(suit)]) + (this.orders[this.pictures.indexOf(picture)] * 10)
                });
            });
        })
        this.tempone = this.deck;
        this.temptwo = this.deck;
        this.deck = this.tempone.concat(this.temptwo);
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * i);
            let temp = this.deck[i];
            this.deck[i] = this.deck[j];
            this.deck[j] = temp;
        }
    }

    drawCard() {
        this.card = this.deck[0];
        this.deck.shift();
        return this.card;
    }

    compare(a, b) {
        let orderA = a.order;
        let orderB = b.order;

        let comparison = 0;
        if (orderA > orderB) {
            comparison = 1;
        } else if (orderA < orderB) {
            comparison = -1;
        }
        return comparison;
    }

    orderCards(hand) {
        hand.sort(this.compare)
    }

    validateSets(fiftyDown, total, sets, hand) {
        if (!fiftyDown && total < 50 || hand == 0) {
            return false;
        } else {
            sets.forEach(set => {
                if (!this.validateSet(set)) {
                    return false;
                }
            });
            return true;
        }
    }

    validateSet(set) {
        if (set.length < 3) {
            return false;
        } else if (this.sameSuit(set) || this.sameCard(set)) {
            return true;
        } else {
            return false;
        }
    }

    sameSuit(set) {
        this.setSuit = set[0].suit[0];
        this.rank = this.cardRanks.indexOf(set[0].img.slice(0, -1))

        for (let i = 1; i < set.length; i++) {
            if (set[i].suit[0] == this.setSuit && (this.rank + 1) == this.cardRanks.indexOf(set[i].img.slice(0, -1))) {
                this.rank = this.cardRanks.indexOf(set[i].img.slice(0, -1))
            } else if (set[i].joker) {
                this.rank += 1;
            } else {
                return false;
            }
        }
        return true;
    }

    sameCard(set) {
        this.rank = this.cardRanks.indexOf(set[0].img.slice(0, -1));
        this.setSuits = [set[0].suit[0]];
        
        for (let i = 1; i < set.length; i++) {
            if (!this.setSuits.includes(set[i].suit[0]) && this.rank == this.cardRanks.indexOf(set[i].img.slice(0, -1))) {
                this.setSuits.push(set[i].suit[0])
            } else if (set[i].joker) {
                this.setSuits.push(set[i].suit[0])
            }
            else {
                return false;
            }
        }
        return true;
    }

    removeFromHand(hand, cards) {
        this.removedCards = []
        hand.forEach(cardA => {
            this.match = false
            cards.forEach(cardB => {
                if (cardA.img == cardB.img) {
                    if (!this.match) {
                        this.match = true
                        this.removedCards.push(cardA);
                    }
                }
            })
        })
        // console.log(this.removedCards)
        console.log(hand.length)
        for (let i = 0; i < this.removedCards.length; i++) {
            hand.splice(hand.indexOf(this.removedCards[i]), 1);
        }
        return hand;
    }

    addSet(set, owner, total) {
        this.sets.push({
            set: set,
            owner: owner,
            points: total,
            completed: this.isCompleted(set)
        })
        // console.log(this.sets)
    }

    isCompleted(set) {
        if (this.sameSuit(set)) {
            return set.length == 13 ? true : false;
        } else if(this.sameCard(set)) {
            return set.length == 4 ? true : false;
        }
    }
}