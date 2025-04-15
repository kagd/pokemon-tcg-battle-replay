import { Send } from "@langchain/langgraph"
import { MessageState } from "./schema.js"

export const processTurnsNode = (state: typeof MessageState.State) => {
  return {
    ...state,
    turnsSent: state.turnBlocks.map(
      (turn, idx) => new Send("processTurn", { turn, index: idx, state, attempt: 1 })
    ),
  }
}