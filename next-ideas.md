- Transactions page to have filter to filter data based on individual account
- Insights first chart, will show all days of week trend if week is selected, all weeks trend of the current month if month is selected, all months of the year trend if year is selected. Period break down to show data for current week/month/year based on selection.
- Replace Savings Rate section with comparison for Income and Expense for selected period.
- Merge Budget and Analysis page into single page and also single icon in Bottom Nav.
- Weekly / Monthly spending chart in home page to have rounded borders for bars, with a line separator betweens sections. 

- SwipeableCardStack changes:
The SwipeableCardStack design we did, works well, but was not what the original requirement requested. Just to repeat the requirement (refer image above)

The cards container (the card which has the toggle()) should look like a card holder / pouch (like in attached image) where it seems to be holding all the child accounts as cards within itself. This should show the Account types on top left (Bank / Wallet / Credit Card / Cash), Open Close icon on top right. The total balance of all child accounts should be shown  in a bit larger text just below, with some generous spacing.

When not toggled, the child cards wont be visible at all., When toggled, the child cards should expand upwards, like coming out of the pouch, with each of them visible partially, just showing the Account name on top left and Balance on top right, while still preserving their selected bg-color styles.

