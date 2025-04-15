import { z } from 'zod';
import { Annotation, Send } from "@langchain/langgraph";

export const setupSchema = z.object({
  uploadingPlayer: z.string(),
  opponent: z.string(),
  coinFlip: z.object({
    caller: z.string(),
    called: z.enum(["heads", "tails"]),
    result: z.enum(["win", "lose"]),
  }),
  openingHands: z.object({
    uploadingPlayer: z.object({
      size: z.number(),
      cards: z.array(z.string()),
    }),
    opponent: z.object({
      size: z.number(),
    }),
  }),
  initialSetup: z.object({
    uploadingPlayer: z.object({
      active: z.string(),
      bench: z.array(z.string()),
    }),
    opponent: z.object({
      active: z.string(),
      bench: z.array(z.string()),
    }),
  }),
});

export const turnSchema = z.object({
  turnNumber: z.number(),
  player: z.string().describe('The player id or name'), // Player ID, e.g., "Shinwrld" or "gklinsing"
  actions: z.array(z.object({
    type: z.enum(["ability", "draw", "play", "attach", "retreat", "newActivePokemon", "item", "discard", "attack", "shuffle"]),
    cardOrAction: z.string().optional(), // Card name
    cardType: z.enum(["energy", "trainer", "pokemon"]).optional(), // Optional, Type of the card
    result: z.array(z.object({
      type: z.enum(["ability", "draw", "play", "attach", "retreat", "newActivePokemon", "item", "discard", "attack", "shuffle", "knockout"]),
      cardOrAction: z.string().optional(), // Card name
      cardType: z.enum(["energy", "trainer", "pokemon"]).optional(), // Optional, Type of the card
      target: z.string().optional(), // Target Pokémon for attach or retreat
      location: z.enum(["active", "bench", "hand", "deck", "discard", "prize", "lostZone", "stadium"]).optional(), // Where the card was moved to
      player: z.string().optional(), // Player ID
    })).optional(), // Optional, describes the outcome of the action
    target: z.string().optional(), // Target Pokémon for attach or retreat
    location: z.enum(["active", "bench", "hand", "deck", "discard", "prize", "lostZone", "stadium"]).optional(), // Where the card was moved to
  })),
  attacks: z.array(z.object({
    attacker: z.string(), // The Pokémon that is attacking
    move: z.string(), // Name of the attack
    target: z.string(), // The Pokémon being attacked
    damage: z.number(), // Amount of damage dealt
    result: z.enum(["knockout", "hit"]), // Outcome of the attack
  })),
  prizeCardsTaken: z.record(z.number()).optional(), // Number of prize cards taken this turn
  newActivePokemonAfterKnockout: z.record(z.string()).optional(), // Maps player ID to their new active Pokémon
  prizeCards: z.array(z.string()).optional(), // List of prize cards taken this turn
});

// Helper function to create an Annotation with default value behavior
function AnnotationWithDefault<T>(defaultValue: T) {
  return Annotation<T>({
    value: (currentValue: T, update?: T) => update || currentValue, // Prioritize update value
    default: () => defaultValue, // Set default value
  });
}

export const MessageState = Annotation.Root({
  setup: Annotation<typeof setupSchema>(),
  setupProcessCount: AnnotationWithDefault(0),
  turnBlocks: Annotation<Array<string>>(),
  turns: Annotation<Array<typeof turnSchema>>(),
  turnsSent: Annotation<Array<Send>>(),
  winner: Annotation<string>(),
});