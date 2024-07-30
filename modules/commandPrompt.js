"use strict"

const parser = require("./parser")
const term = require("terminal-kit").terminal
const gameState = require("./gameState")
const statusBar = require("./statusBar")
const updateDisplay = require("./display")
const usage = require("./usage")
const stockHoldings = require("./stockHoldings")

var updateMode = false

const _getNumberOfAvailableStocks = (company, source) => {
	if (source) {
		const portfolio = stockHoldings.getSharesOwned(source)
		if (portfolio[company] !== undefined)
			return portfolio[company];
		else
			return 0;
	}
	else {
		return gameState.getShareSize(company) - stockHoldings.getNumberOfOwnedStocks(company);
	}
}

const initialize = () => {
	term.fullscreen()
	term.nextLine(term.height - 4)
	const response = gameState.createOrLoadGame()
	if (response.mode === "load") {
		_updateGameState(gameState.getCommandHistory())
	}
	term(response.feedback)
	updateStatusBar()
}

const updateStatusBar = () => {
	statusBar(gameState.statusBarContent())
	updateDisplay(gameState.getName(), gameState.displayContent())
}

const _updateGameState = commandHistoryArray => {
	gameState.resetGameState()
	const silent = true
	if (commandHistoryArray) {
		commandHistoryArray.map(command => perform(command, silent))
	}
}

const _getGameState = () => gameState

const undo = () => {
	var commandHistoryArray = gameState.getCommandHistory()
	var undid = commandHistoryArray.pop()
	_updateGameState(commandHistoryArray)
	gameState.setCommandHistory(commandHistoryArray)
	return undid
}

const commandPrompt = () => {
	var commandHistory = gameState.getCommandHistory()

	term("> ")

	term.inputField(
		{
			history: commandHistory
		},
		(error, input) => {
			term("\n")
			if (error) {
				term("An error occurred.\n")
				throw new Error("Something bad happened!")
			}
			switch (input) {
				case "undo":
					var undid = undo()
					term(`Undid ^y"${undid}"^\n`)
					commandPrompt()
					break
				case "q":
				case "qu":
				case "qui":
				case "quit":
				case "e":
				case "ex":
				case "exi":
				case "exit":
					term("Bye!\n")
					/* eslint-disable no-process-exit */
					process.exit()
					break
				case "help":
					term(usage())
					commandPrompt()
					break
				default:
					if (gameState.getName() ||
						/* Opening a stored game should always be possible */
						input.startsWith("o") ||
						/* Starting a new game should always be possible */
						input.startsWith("start") ||
						/* Listing existing games should always be possible */
						input.startsWith("l")) {
						perform(input)
					} else {
						term("^rNo active game!\n")
					}
					commandPrompt()
			}
		}
	)
}

/**
 * Takes in the raw command string, parses it, then performs the required
 * action by calling the gameState method that changes the game state and
 * then prints out the results to the terminal.
 *
 * @param {string} command The raw command string.
 * @param {boolean} silent If true, no output to terminal.
 *
 * @returns {void}
 */
const perform = (command, silent = false) => {
	updateMode = silent
	const action = parser(command)

	if (!action.verb && action.comment) action.verb = "comment"

	var addToHistory = false
	let normalizedCommand = ""
	switch (action.verb) {
		case "holdings":
			term(gameState.getHoldingsTable() + "\n")
			addToHistory = false
			break
		case "values":
			term(gameState.getValuesTable() + "\n")
			addToHistory = false
			break
		case "listGames":
			echoToTerm(gameState.listGames())
			addToHistory = false
			break
		case "open":
			echoToTerm(gameState.open(action.object.toLowerCase()))
			_updateGameState(gameState.getCommandHistory())
			addToHistory = false
			break
		case "delete":
			echoToTerm(gameState.deleteGame(action.object.toLowerCase()))
			addToHistory = false
			break
		case "start":
			echoToTerm(gameState.newGame(action.object.toLowerCase()))
			addToHistory = false
			break
		case "buy":
			if (gameState.is_company(action.object)) {
				if (gameState.is_entity(action.subject)) {
					if (_getNumberOfAvailableStocks(action.object, action.source) >= action.quantity) {
						echoToTerm(
							gameState.buyShares(
								action.subject,
								action.object,
								action.quantity,
								action.price,
								action.source
							)
						)

						normalizedCommand = `${action.subject} ${action.verb} ${action.quantity} ${action.object}`
						if (action.price) normalizedCommand += ` @${action.price}`
						if (action.source) normalizedCommand += ` from ${action.source}`
						addToHistory = true
					}
					else {
						const source = action.source ? action.source : "market";
						echoToTerm(`^rThere is no ${action.quantity} stocks of ${action.subject} left in the ${source}^\n`)
					}
				}
				else {
					echoToTerm(`^r${action.subject} is not an entity^\n`)
				}
			}
			else {
				echoToTerm(`^r${action.object} is not a company^\n`)
			}
			break
		case "sell":
			if (gameState.is_company(action.object)) {
				if (gameState.is_entity(action.subject)) {
					if (stockHoldings.getSharesOwned(action.subject) !== undefined && stockHoldings.getSharesOwned(action.subject)[action.object] !== undefined && stockHoldings.getSharesOwned(action.subject)[action.object] >= action.quantity) {
						echoToTerm(
							gameState.sellShares(
								action.subject,
								action.object,
								action.quantity,
								action.price
							)
						)
						normalizedCommand = `${action.subject} ${action.verb} ${action.quantity} ${action.object}`
						if (action.price) normalizedCommand += ` @${action.price}`
						addToHistory = true
					}
					else {
						echoToTerm(`^r${action.subject} does not have at least ${action.quantity} of ${action.object} shares ^\n`)
					}
				}
				else {
					echoToTerm(`^r${action.subject} is not an entity^\n`)
				}
			}
			else {
				echoToTerm(`^r${action.object} is not a company^\n`)
			}
			break
		case "short":
			if (gameState.is_company(action.object)) {
				if (gameState.is_entity(action.subject)) {
					if (stockHoldings.getSharesOwned(action.subject) === undefined || stockHoldings.getSharesOwned(action.subject)[action.object] === undefined || stockHoldings.getSharesOwned(action.subject)[action.object] <= 0) {
						echoToTerm(
							gameState.shortShares(
								action.subject,
								action.object,
								action.quantity,
								action.price
							)
						)
						normalizedCommand = `${action.subject} ${action.verb} ${action.quantity} ${action.object}`
						if (action.price) normalizedCommand += ` @${action.price}`
						addToHistory = true
					}
					else {
						echoToTerm(`^r${action.subject} can't short ${action.quantity} of ${action.object} when owning those stocks ^\n`)
					}
				}
				else {
					echoToTerm(`^r${action.subject} is not an entity^\n`)
				}
			}
			else {
				echoToTerm(`^r${action.object} is not a company^\n`)
			}
			break
		case "sharesize":
			if (gameState.is_company(action.subject)) {
				if(action.quantity > 0 && !isNaN(action.quantity)){
					echoToTerm(gameState.setShareSize(action.subject, action.quantity))
					normalizedCommand = `${action.subject} ${action.verb} ${action.quantity}`
					addToHistory = true
				}
				else {
					echoToTerm(`^rSharesize needs to be greater than 0^\n`)
				}
			}
			else {
				echoToTerm(`^r${action.subject} is not a company^\n`)
			}
			break
		case "dividend":
			if (gameState.is_company(action.subject)) {
				echoToTerm(gameState.payDividends(action.subject, action.quantity))
				normalizedCommand = `${action.subject} ${action.verb} ${action.quantity}`
				addToHistory = true
			}
			else {
				echoToTerm(`^r${action.subject} is not a company^\n`)
			}
			break
		case "halfdividend":
			if (gameState.is_company(action.subject)) {
				echoToTerm(gameState.payHalfDividends(action.subject, action.quantity))
				normalizedCommand = `${action.subject} ${action.verb} ${action.quantity}`
				addToHistory = true
			}
			else {
				echoToTerm(`^r${action.subject} is not a company^\n`)
			}
			break
		case "value":
			if (gameState.is_company(action.subject)) {
				echoToTerm(gameState.setValue(action.subject, action.quantity))
				normalizedCommand = `${action.subject} ${action.verb} ${action.quantity}`
				addToHistory = true
			}
			else {
				echoToTerm(`^r${action.subject} is not a company^\n`)
			}
			break
		case "give":
			if (gameState.is_entity(action.subject)) {
				if (gameState.is_entity(action.object)) {
					echoToTerm(
						gameState.moveCash(action.subject, action.object, action.quantity)
					)
					normalizedCommand = `${action.subject} ${action.verb} ${action.quantity} to ${action.object}`
					addToHistory = true
				}
				else {
					echoToTerm(`^r${action.object} is not an entity^\n`)
				}
			}
			else {
				echoToTerm(`^r${action.subject} is not an entity^\n`)
			}
			break
		case "cash":
			if (gameState.is_entity(action.subject)) {
				echoToTerm(gameState.changeCash(action.subject, action.quantity))
				normalizedCommand = `${action.subject} ${action.verb} ${action.quantity}`
				addToHistory = true
			}
			else {
				echoToTerm(`^r${action.subject} is not an entity^\n`)
			}
			break
		case "float":
			echoToTerm(gameState.float(action.subject, action.quantity, action.price)) // price in this context is the size of a company 10-share, 5-share etc.
			normalizedCommand = `${action.subject} ${action.verb} ${action.quantity} ${action.price}`
			addToHistory = true
			break
		case "player":
			echoToTerm(gameState.add(action.subject, action.quantity));
			normalizedCommand = `${action.subject} ${action.verb} ${action.quantity}`
			addToHistory = true
			break
		case "close":
			echoToTerm(gameState.close(action.object))
			normalizedCommand = `${action.verb} ${action.object}`
			addToHistory = true
			break
		case "remove":
			echoToTerm(gameState.remove(action.object))
			normalizedCommand = `${action.verb} ${action.object}`
			addToHistory = true
			break
		case "banksize":
			echoToTerm(gameState.setBankSize(action.quantity, action.object))
			normalizedCommand = `${action.verb} `
			if (action.object) normalizedCommand += `${action.object}`
			normalizedCommand += `${action.quantity}`
			addToHistory = action.quantity
			break
		case "bank":
			echoToTerm(gameState.getBankRemains())
			addToHistory = false
			break
		case "companies":
			term(gameState.getCompanyTable() + "\n")
			addToHistory = false
			break
		case "next":
			echoToTerm(gameState.nextRound(action.object))
			normalizedCommand = `${action.verb} ${action.object}`
			addToHistory = true
			break
		case "rounding":
			setParameter("rounding", action.object)
			normalizedCommand = `${action.verb} ${action.object}`
			addToHistory = true
			break
		case "companycredits":
			setParameter("companycredits", true)
			normalizedCommand = `${action.verb}`
			addToHistory = true
			break
		case "income":
			echoToTerm(gameState.setIncome(action.subject, action.quantity))
			normalizedCommand = `${action.subject} ${action.verb} ${action.quantity}`
			addToHistory = true
			break
		case "comment":
			addToHistory = true
			break
		default:
			term("^rUnrecognized command!^\n")
			addToHistory = false
	}

	if (updateMode) addToHistory = false

	if (addToHistory) {
		if (action.comment) normalizedCommand += ` # ${action.comment}`
		gameState.addToHistory(normalizedCommand.trim())
	}
	if (!updateMode) updateStatusBar()
}

const setParameter = (parameter, value) => {
	echoToTerm(gameState.setParameter(parameter, value))
}

const echoToTerm = feedback => {
	if (!updateMode) {
		term(feedback)
	}
}

module.exports = {
	initialize,
	commandPrompt,
	perform,
	_updateGameState,
	_getGameState
}
