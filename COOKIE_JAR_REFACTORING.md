# Cookie Jar Refactoring Plan

## Problem
- Single global `CookieJar` shared between goldtech and megatech accounts
- When one account logs in, it overwrites the cookies for the other account
- `clearCookies()` wipes cookies for BOTH accounts
- This causes authentication failures and session conflicts

## Current Flow (BROKEN)
```
Webhook receives invoice 1037275494 (goldtech)
→ Uses shared cookie jar
→ Logs in as goldtech
→ Processes invoice

Webhook receives invoice 9xxxxxxx (megatech)
→ clearCookies() wipes goldtech session!
→ Logs in as megatech
→ Processes invoice

Webhook receives invoice 1037275495 (goldtech)
→ Uses jar with megatech cookies ❌
→ FAIL: Wrong session!
```

## Solution
**Per-User Cookie Jars**: Each userId gets its own `CookieJar` and axios `client` instance

## Implementation Status

###  ✅ ApplicationService Changes
- Created `userClients: Map<number, { jar: CookieJar, client: AxiosInstance }>`
- Added `getClientForUser(userId)` method
- Updated methods:
  - `sendXRequest(params, userId)` ✅
  - `sendYRequest(..., userId)` ✅
  - `clearCookies(userId)` ✅
  - `handleCookie(response, userId)` ✅
  - `sendBRequest(params, endpoint, userId)` ✅
  - `sendARequest()` - uses separate non-cookie client ✅

### ⏳ ApplicationFacade Changes (IN PROGRESS)
Need to add `userId` parameter to:
- `searchInvoice(id, userId)` - PARTIAL
- `getTempItem(id, itemId, userId)`
- `addTempItem(id, itemId, tempInvoiceId, newPrice, tempItem, userId)`
- `addInvoice(id, invoice, userId)`
- `getTinyCookieById(id)` - already has userId ✅
- `getTinyCookie(login, password, userId)`
- `updateItemsOperation(id, tempInvoiceId, operationId, operationName, userId)`
- `calcTax(id, tempInvoiceId, userId)`

### ⏳ WebhookService Changes (PENDING)
Need to pass `userKeys.userId` to all facade calls:
- Line 103: `searchInvoice(id, userKeys.userId)`
- Line 109: `searchInvoice(id, userKeys.userId)`
- Line 126: `getTempItem(id, item.id, userKeys.userId)`
- Line 134-168: All `addTempItem()` calls
- Line 186: `updateItemsOperation(..., userKeys.userId)`
- Line 207, 211: `addInvoice(..., userKeys.userId)` - invoice already has userId in it
- Line 209: `searchInvoice(id, userKeys.userId)`

## Expected Result After Fix
```
Webhook receives invoice 1037275494 (goldtech, userId=651045595)
→ Uses cookieJar[651045595]
→ Logs in as goldtech → stores in jar[651045595]
→ Processes invoice

Webhook receives invoice 9xxxxxxx (megatech, userId=651045596)
→ Uses cookieJar[651045596] ✅ Separate jar!
→ Logs in as megatech → stores in jar[651045596]
→ Processes invoice

Webhook receives invoice 1037275495 (goldtech, userId=651045595)
→ Uses cookieJar[651045595] ✅ Still has goldtech session!
→ No need to re-login!
→ Processes invoice successfully ✅
```

## Testing
After deployment, watch logs for:
- `Creating new cookie jar for user 651045595`
- `Creating new cookie jar for user 651045596`
- Fewer authentication errors
- No more session conflicts between accounts

## Notes
- `sendARequest()` doesn't need cookies (uses API key), so it uses a shared non-cookie client
- `sendBRequest()` scrapes the web interface and needs separate cookies per user
- The userId is available in `userKeys.userId` in webhook.service.ts
