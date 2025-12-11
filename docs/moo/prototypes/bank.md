# Bank System

Electronic currency and account management for Malice.

## Structure
- **Accounts**: Each account has an owner (objref), balance, createdAt, and frozen status.
- **Ledger**: Append-only transaction log (issue, burn, transfer).
- **Idempotency**: All mutating operations take an idempotencyKey to prevent double-processing.
- **Atomicity**: Transfers and mutations are all-or-nothing.
- **Integer Only**: All amounts are positive integers (no decimals).

## Methods
- `createAccount(owner, idempotencyKey?)`: Create a new account for owner
- `getAccount(accountId)`: Get account data
- `getAccountByOwner(owner)`: Find account(s) by owner
- `getBalance(accountId)`: Get current balance
- `freezeAccount(accountId)`, `unfreezeAccount(accountId)`: Prevent/allow transactions
- `issue(accountId, amount, idempotencyKey, memo?)`: Mint money into account
- `burn(accountId, amount, idempotencyKey, memo?)`: Destroy money from account
- `transfer(from, to, amount, idempotencyKey, memo?)`: Move funds between accounts
- `getTransaction(txId)`: Get single transaction by ID
- `getAccountHistory(accountId, limit?)`: Get transactions for account
- `getRecentTransactions(limit?)`: Get most recent transactions
- `getTotalSupply()`: Total money in existence (issued - burned)
- `getSupplyStats()`: Detailed supply info (issued, burned, supply, accountTotal, balanced)
- `getAccountCount()`: Number of accounts
- `cleanupOldIdempotencyKeys(maxAgeMs?)`: Remove old processed keys

## Example Usage
```javascript
// Create account
const result = await bank.createAccount(player, 'unique-key-1');
const accountId = result.accountId;

// Issue funds
await bank.issue(accountId, 1000, 'unique-key-2', 'Initial grant');

// Transfer funds
await bank.transfer(accountId, otherAccountId, 250, 'unique-key-3', 'Payment for job');

// Get balance
const balance = await bank.getBalance(accountId);

// Burn funds (taxes, fees)
await bank.burn(accountId, 50, 'unique-key-4', 'Tax payment');

// Freeze/unfreeze account
await bank.freezeAccount(accountId);
await bank.unfreezeAccount(accountId);

// Get transaction history
const history = await bank.getAccountHistory(accountId, 10);

// Get total supply
const supply = await bank.getTotalSupply();
```

## Notes
- All operations are idempotent (safe to retry with same key)
- All amounts are positive integers
- Transfers are atomic (never partial)
- Ledger is append-only for auditability

---

# See Also
- [Security System](./security.md) - For bank terminals and lockers
- [Items](./items.md) - For currency items
