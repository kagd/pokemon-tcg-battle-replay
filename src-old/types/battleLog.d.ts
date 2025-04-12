declare namespace PCTGLBattleLog {
  type BattleLog = {
    setup: Setup;
    turns: Turn[];
    outcome: {
      winner: string; // Player ID of the winner
      finalScore: {
        [playerId: string]: number; // Final score for each player
      };
    };
  };

  type Turn = {
    turnNumber: number;
    player: string; // Player ID, e.g., "Shinwrld" or "gklinsing"
    cardsInHandEndOfTurn: {
      [playerId: string]: number; // Number of cards in hand at the end of the turn
    }; 
    actions: Array<{
      type: ActionType; // Type of action taken
      cardOrAction?: string; // Card name
      cardType?: ActionCardType; // Optional, Type of the card
      result?: ActionEffectResult[]; // Optional, describes the outcome of the action
      target?: string; // Target Pokémon for attach or retreat
      location?: ActionLocation; // Where the card was moved to
    }>;
    attacks: Array<{
      attacker: string; // The Pokémon that is attacking
      move: string; // Name of the attack
      target: string; // The Pokémon being attacked
      damage: number; // Amount of damage dealt
      result: "knockout" | "hit"; // Outcome of the attack
    }>;
    prizeCardsTaken: {
      [playerId: string]: number; // Number of prize cards taken this turn
    } 
    newActivePokemonAfterKnockout: {
      [playerId: string]: string; // Maps player ID to their new active Pokémon
    };
    prizeCards?: string[]; // List of prize cards taken this turn
  };

  enum ActionType {
    Ability = 'ability', // An ability is used
    Draw = "draw", // A card is drawn from the deck
    Play = "play", // A card is played from the hand
    Attach = "attach", // An energy or tool card is attached to a Pokémon
    Retreat = "retreat", // A Pokémon is retreated to the bench
    NewActivePokemon = "newActivePokemon", // A Pokémon is moved to the active position
    Item = "item", // An item card is played
    Discard = "discard", // A card is discarded
    Attack = "attack", // An attack is performed
    Shuffle = "shuffle", // The deck is shuffled
  }

  enum EffectType {
    Ability = 'ability', // An ability is used
    Draw = "draw", // A card is drawn from the deck
    Play = "play", // A card is played from the hand
    Attach = "attach", // An energy or tool card is attached to a Pokémon
    Retreat = "retreat", // A Pokémon is retreated to the bench
    NewActivePokemon = "newActivePokemon", // A Pokémon is moved to the active position
    Item = "item", // An item card is played
    Discard = "discard", // A card is discarded
    Attack = "attack", // An attack is performed
    Shuffle = "shuffle", // The deck is shuffled
  }

  enum ActionLocation {
    Active = "active", // The active Pokémon
    Bench = "bench", // The bench Pokémon
    Hand = "hand", // The player's hand
    Deck = "deck", // The player's deck
    Discard = "discard", // The discard pile
    Prize = "prize", // The prize cards
    LostZone = "lostZone", // The lost zone
  }

  enum ActionCardType {
    Energy = "energy", // Basic or Special Energy card
    Trainer = "trainer", // Trainer card - Item, Supporter, Tool or Stadium
    Pokémon = "pokemon", // Pokémon card
  }

  type Setup = {
    uploadingPlayer: string; // Player who uploaded the battle
    coinFlip: {
      caller: string; // Player who called the coin flip
      called: "heads" | "tails"; // The side called by the player
      result: "win" | "lose"; // Result of the coin flip
      firstPlayer: string; // The player who goes first based on the coin flip
    };
    openingHands: {
      [playerId: string]: {
        size: number; // Number of cards in the opening hand
        cards: string[]; // List of card names in the opening hand
      };
    };
    initialSetup: {
      [playerId: string]: {
        active: string; // The active Pokémon of the player
        bench: string[]; // List of Pokémon on the bench
      };
    };
  };

  type ActionEffectResult = {
    type: EffectType; // Type of action taken
    cardOrAction?: string; // Card name
    cardType?: ActionCardType; // Optional, Type of the card
    target?: string; // Target Pokémon for attach or retreat
    location?: ActionLocation; // Where the card was moved to
    player?: string; // Player ID
  }
}