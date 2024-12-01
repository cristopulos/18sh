# 18SH – an 18xx shell | cristopulos fork from [18SH](https://github.com/msaari/18sh)

18SH is designed as a replacement for the spreadsheets used to calculate end of
game scores in 18xx games. Spreadsheets are fine, especially if they're well
designed with formulas to avoid entering the same data twice, but I wanted to
try how an interactive shell would work.

The design philosophy behind 18SH is to not support game rules, but just offer
a simple and effective way of recording the financial transactions of the game.
18SH aims to support different ways money and shares are handled, it has tools
that make life easier for both full cap and incremental cap games, for example,
but it cannot track company value automatically or enforce certificate limit.

18SH follows semantic versioning; the biggest catch is that save file
compatibility is only guaranteed within major versions. If the first number
changes in the version number, your saved games won't work anymore.

This fork adds more restrictive subject checking (so no more accidental player creation mid-game because of a typo), support for shorting, variable company sizes (for games like 18USA, 1817 etc.) and validation for share count (only set number of shares of a given company can exist simultaneously defined by the company share size). It also exposes some additional information for the [18SH-Display](https://github.com/cristopulos/18sh-display) and therefore this app is NOT compatible with display project maintained by [msaari](https://github.com/msaari/18sh-display).

## Installing & requirements

Clone from GitHub or download the files. The GitHub `master` is the current
state of development and not always stable. For stable releases, get the
[tagged release packages](https://github.com/cristopulos/18sh/releases). Then
install the Node modules with

	npm install

and you're ready to go. 18SH requires [Node.js](https://nodejs.org/en/download/).

You also need a xterm-compatible terminal. On Linux, there are plenty of
options. On Mac OS, I highly recommend [iTerm2](https://www.iterm2.com/). On
Windows, if the regular command line does not work, you can use
[Terminator](https://github.com/software-jessies-org/jessies/wiki/Terminator).

## Upgrading

If you use a stable release package, just download the new package and use
that.

If you clone from GitHub, you can upgrade to the latest version with

	git pull

Note that the latest `master` may be unstable. However, major version
development generally happens in a separate branch, so `master` will have the
latest version of the current major version.

## Usage

Run 18SH with Node:

	node 18sh.js

If there isn't an active game in the Configstore storage, a new game will be
created and assigned a name. If you quit and then restart 18SH, it will
continue with the same game. You can also switch between two games.

Shares can be bought by issuing the right commands (see below for a list),
company values can be set and with the command

	values

you'll finally see the end results.

## Commands

### BUY
	<player|company> buys <count> <company> [@<price> [from <source>]]

To use any of the transactional commands involved entities must be defined beforehand (either by `player` or `float` for companies). 18SH will enforce this refusing to process commands involving undefined entities. The names are case insensitive (and always
converted to upper case anyway).

If you specify a price, that amount of money will be reducted from the buyer.
Price is the price for single share, so it will be multiplied by the number of
shares bought. If you specify a source, the money will be paid to the source,
and the share will be removed from the source. When buying from pool, do not
specify the source; this is mostly useful in partical cap games like 1846,
where companies own their own shares and are paid for share purchases.

You can't specify source without a price.

Companies can also buy shares, either their own or from other companies.

You can abbreviate the command to `b`, `bu` or `buy`. Count can be omitted,
in which case it's assumed to be 1. You can drop the `@` from the price, if you
prefer, and adding the `from` is optional.

All of these commands have Mikko buy two LNWR shares:

	Mikko buys 2 LNWR
	Mikko buy 2 LNWR
	Mikko b 2 LNWR

In a game of 1846, you will see something like this. These commands have the
same effect:

	Mikko buys 1 GT @100 from GT
	Mikko b GT 100 GT

### SELL
	<player|company> sells <count> <company> [@<price>]

The opposite of buying shares. The same principles apply to `sell`: you can
abbreviate the command. If you specify the price, the seller will be given that
much money from the bank.

If you try to sell more than you have, 18SH will return an error. You can't sell
to someone; for transactions like that, you always have to `buy`.

### SHORT
	<player> short <count> <company> [@price]
 This command is identical to the `sell` one however it allows the player to sell to negative values and only if the player does not own any of the stock that they try to short. This command will leave player with negative shares that will have two effects:
 - Number of shares that can be owned by players can exceed the `sharesize` limit as shorting creates "virtual" share
 - Player owning short shares (negative number of shares) will be obliged to pay the bank amount of money that shorted company distributes as dividends

Player then can get rid of negative shares by simply buying a share of shorted company at which point both of them will nulliify each other (effectively disintegrating the share bought).

### CASH
	<player|company> cash <amount>

Adjusts the player or company cash. If `<amount>` is positive, the money is
added and if it's negative, the money is removed. All transactions happen
between the player or the company and the bank.

Company must be floated before its cash can be handled (see `float` below).

### GIVE
	<player|company> give <amount> to <player|company>

Has the player or company move the specific amount of money to the target.

A company or player must be defined before its cash can be handled (see `float` and `player` below).

Doing one of these:

	GT give 60 to Mikko
	GT g 60 Mikko

is the same as doing

	GT cash -60
	Mikko cash 60

### DIVIDENDS
	<company> dividends <number>

This command has the company distribute `<number>` as a dividend. Use the
total dividend (this is important to mention because original version of this command requires per-share value): if there are ten shares as usual and
the total sum is £200, the command is

	GER dividends 200

18SH will take care of properly distributing the dividend among share owners according to set company size - so 10-share company will yield £20 per share while 5-share company would £40. If for whatever reson amount of money to distribute is not a multiple of a sharesize 18SH will round down the amount to the integer value. This command can be abbreviated up to `d`
and it also has an alias, `pays`. These are all identical to the command above:

	GER d 200
	GER pays 200
	GER pay 200
	GER pa 200
	GER p 200

### HALF DIVIDENDS
	<company> halfdividends <number>

Distributes half dividends where half the sum is paid to the company and the
rest is distributed to shares, rounded up for the benefit of the shareholders.
The `<number>` is not the per-share dividend, but the total sum to distribute.
Thus if you do

	NYC halfdividends 290

NYC will retain 140 and each NYC share is paid 15 (assuming 10-share company).

If you want to change the default setting for half dividend rounding, 18SH
supports two other methods. To round in favour of company, use the command

	rounding up

and in order to round like it's done in 1837 (calculate exact sum per share,
then round share payments down – paying 50 would net 25 in company treasury and
a 30% owner would get 7.5 that rounds down to 7), use

	rounding 1837

### FLOAT
	<company> float <number> <sharesize>

Starts up a company and sets its cash to `<number>`, with optional share size `<sharesize>` if it's not provided it is assumed to be regular 10-share company. This needs to be done
first if you want to track company cash, because otherwise `<company> cash
<amount>` will return an error as app is making sure that names of entites handling cash and shares are explicitly defined

	NYC float 630

In partial-cap games like 1846, you generally want to float companies like
this:

	GT float 0 // or GT float 0 10 - both will define GT as 10-share company
	GT buys 10 GT @0

Now 18SH knows GT exists and GT has 10 shares. Then the president can determine
the price of one share and then buy the initial shares:

	Mikko buys 2 GT @100 from GT

Now GT would have $200 and Mikko has 2 GT shares.

### CLOSE
	close <company>

Closes the company, removing it from play completely (all shares and cash in
company treasury gone).

	close BIG4

### SHARESIZE
	<company> sharesize <sharesize>

 Changes specified company sharesize to the provided number. So transforming 5-share NYC to 10-share company will look like this

  	NYC sharesize 10
   
Upsizing the company will just increase the share limit, so if new shares should be created in the company you need to "buy" them the same way as it is shown in the `float` example so resulting commands would look like this:

	NYC sharesize 10
 	NYC buys 5 NYC
 
However be aware that downsizing the company (although I'm not aware of any 18xx that does that) will not enforce the number of shares to the new limit. Alternative command name - `size`

### PLAYER
	<playername> player <cash>
 
 Creates a player with the specified amount of cash. This is required to later use this player name as a subject of transactions, as this version of 18SH requires players/companies to be defined before they can perform actions.
 
### REMOVE
	remove <player>

Removes a player from the game, removing their cash and share holdings.

	remove Mikko

### NEXT
	next <SR|OR>

Moves the game to next SR or OR. The current round is shown in the status bar.

### INCOME
	<player|company> income <amount>

Sets the player or company income to the specified amount. This income is
automatically paid in the beginning of each OR and happens whenever the command
`next OR` is used.

	Mikko income 25

### VALUE
	<company> value <number>

This sets the company share price value to `<number>`. This is required so that
18SH can report the final values for players. Again, all of these are
equivalent:

	SECR value 67
	SECR val 67
	SECR v 67

### BANKSIZE
	banksize <currency symbol><number>

Sets the game bank size to the specified value. Once this is set, the status
bar will show the money remaining in the bank (calculated as bank size minus
the cash players have).

The default currency is dollars, but you can specify any one-letter currency
symbol when setting the bank size in order to change currency, like this:

	banksize £2500 // P, GBP, POUND also work as prefixes
	banksize €2500 // E, EUR, EURO
	banksize $2500 // S, DLR, DOLLAR 
 	banksize ¥2500 // Y, YEN

If you wish to use 1825 style company credits where company money is not
included in the bank, you can set that up with

	companycredits

### BANK
	bank

Shows the remaining cash in bank.

### HOLDINGS
	holdings

This command prints out a list of share and cash holdings for all players.

### VALUES
	values

This command prints out a list of player net worth values. All share holdings
are multiplied by the share values and the cash holdings are added to that. In
order for this command to work, the values need to be set using `value`.

### COMPANIES
	companies

This command prints out a list of companies with their share values and the
share ownership.

### UNDO
	undo

Undoes the previous game state altering command (commands that just show the
game state like `holdings` or `values` are not considered for `undo`). 18SH has
a history of commands entered, and `undo` simply removes the last command from
the list and then resets the game state to that.

### STYLE
	style <style-name>

Sets proper css styling for a game, as some games use defferent company colors, this options 
aims to prevent clashes. This requires [18SH-Display](https://github.com/cristopulos/18sh-display) browser refresh.

Currently suported styles:
- default (most games)
- 18usa
- 18mex

### OPEN
	open <game-name>

Opens the specified game and closes the current game (game state is saved to
the file after each command, so nothing is lost).

### LIST
	list

Lists all the games that are saved at the moment.

### DELETE
	delete <game-name>

Deletes the saved game with a given name. This is permanent and cannot be
undone.

### HELP
	help

A list of these commands.

### QUIT
	quit

Alias `exit`. Exits the 18SH shell. The game state is automatically saved after
every command in the local configstore (`~/.config/configstore/18sh.json`).

## Comments
	# <comment>
	<command> # <comment>

Anything after a # is considered a comment and is ignored by parser, but is
stored in the command history. You can use comments to keep a log of game
events, for example, or to explain why cash is moved from place to place
for future reference.

## Cash Display

The biggest problem with 18SH is that the cash situation is not visible to
other players. This can be rectified with [18SH Cash Display](https://github.com/cristopulos/18sh-display).
If you have a cash display server running up, you can connect 18SH to it and
display the cash status on another screen.

For further instructions on setting up the Cash Display, refer to the Cash
Display GitHub page. 18SH will send the status information automatically to the
server whenever things change, all you need to to is to tell where the server
is. This is done by setting an environmental variable that points to the
server. The exact method depends on your system ([see this helpful guide](https://www.schrodinger.com/kb/1842)).
In Windows PowerShell this should look like this:

	$Env:DISPLAY18SH="https://example.com/18sh/"

In any case, the name of the environmental variable is `DISPLAY18SH`. Make sure
you add the `18sh/` to the end of the URL of the server.

See Cash Display GitHub page for version compatibility information: 18SH and
the server must have compatible version numbers.

![Example image](https://github.com/cristopulos/18sh-display/raw/master/sample-game.jpg)

## Dependencies

18SH doesn't have many dependencies:

- [terminal-kit](https://github.com/cronvel/terminal-kit) is used to handle the user interface.
- [cli-table](https://github.com/Automattic/cli-table) is used to print out pretty tables.
- [configstore](https://github.com/yeoman/configstore) stores the game data.
- [axios](https://github.com/axios/axios) is used to send the data to the cash display server.

During development, [eslint](https://github.com/eslint/eslint) and
[prettier](https://github.com/prettier/prettier) are used and the testing and
code coverage is done with a combo of [mocha](https://github.com/mochajs/mocha),
[chai](https://github.com/chaijs/chai) and [nyc](https://github.com/istanbuljs/nyc).


## License

Copyright 2020 [Mikko Saari](https://github.com/msaari/) mikko@mikkosaari.fi

See [license information](LICENSE).
