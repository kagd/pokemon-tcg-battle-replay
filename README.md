# Pokémon TCG Battle Replay Parser

A TypeScript-based tool that parses and analyzes Pokémon Trading Card Game Live battle logs, converting them into structured JSON data for analysis and replay purposes.

## Features

- Parses detailed battle logs from Pokémon TCG Live matches
- Converts battle data into structured JSON format
- Tracks:
  - Game setup and coin flip
  - Player actions and card plays
  - Attack damage and effects
  - Prize card tracking
  - Turn-by-turn progression
  - Game outcome and final score

## Technical Details

- Built with TypeScript
- Uses Azure OpenAI for advanced text processing
- Supports detailed battle analysis including:
  - Card plays and attachments
  - Pokemon evolution chains
  - Energy attachments
  - Trainer card usage
  - Battle outcomes
  - Prize card tracking

## Getting Started

1. Clone the repository
2. Copy `src/config.example.ts` to `src/config.ts` and fill in your Azure OpenAI credentials
3. Install dependencies:
```bash
npm install
```
4. Run the parser:
```bash
npm start
```

## Input Format

The tool accepts battle logs in text format and converts them into structured JSON data. Sample battle logs can be found in the `sampleBattleReplays` directory.

## Output Format

The parser generates two JSON files:
- `battle.json`: Contains a summary of the battle including players, Pokémon used, and outcome
- `battle.battle-by-turn.json`: Detailed turn-by-turn breakdown of all actions and events

## TODO

Update parser to go turn by turn due to JSON truncation during output by AI model.