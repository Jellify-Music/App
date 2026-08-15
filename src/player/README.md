# Player Folder

## Purpose

This folder contains the core logic and business logic of the player, including all functions that handle user controls and player interactions. This is the central hub for all player-related functionality.

## Architecture

The player functions are implemented as utility functions rather than hooks to minimize unnecessary overhead and improve performance. Each module exports specific functionality that can be imported and used directly where needed.

## Structure

- **Functions & Logic**: Core player control functions and business logic
- **User Controls**: Logic for handling user interactions with the player
- **State Management**: Player state handling and updates

## Usage

Import player functions directly into components as needed, rather than through React hooks, to keep component logic clean and avoid performance overhead from hook re-renders.
