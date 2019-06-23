"use strict"

const usage = () => {
	const usage = `
^!18SH Commands^:

Player and company information:
\t^Wholdings^ – Show player cash and share holdings.
\t^Wvalues^ – Show player cash and share values.
\t^Wcompanies^ – Show company values and share ownership.
\t^Wbank^ – Show the money remaining in the bank.

Game actions:
\t<player> ^Wbuy^ <company> <quantity> – Have player buy company shares.
\t<player> ^Wsell^ <company> <quantity> – Have player sell company shares.
\t<company> ^Wdividend^ <amount> – Have company pay a dividend to shareholders.
\t<company> ^Wvalue^ <amount> – Set company share value.
\t<player> ^Wgive^ <amount> – Give player cash.
\t<player> ^Wtake^ <amount> – Take cash from a player.
\t^Wbanksize^ <amount> – Set the bank size.

Game management:
\t^WlistGames^ – List all available games.
\t^Wopen^ <game> – Open a game.
\t^Wdelete^ <game> – Delete game permanently.
\t^Wstart^ <game> – Start a new game.

Other commands:
\t^Wquit^:, ^Wexit^ – Leave the game.
\t^Wundo^ – Undo the last game state changing command.
	`.trim()
	return `\n${usage}\n\n`
}

module.exports = usage