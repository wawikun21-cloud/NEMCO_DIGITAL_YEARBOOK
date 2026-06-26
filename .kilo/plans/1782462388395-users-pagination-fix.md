# Fix Missing Users in Admin Manage Users Page

## Problem
The ManageUsersPage only shows 1,000 users even though there are 1,110 in the database.

## Root Cause
Supabase has a default limit of 1,000 rows per query. The `getUsers` function in `server\src\services\userService.js:3` does not use `.range()` to paginate through results, causing rows beyond 1,000 to be excluded.

## Solution
Modify `getUsers` in `server\src\services\userService.js` to fetch users in batches of 1,000 until all records are retrieved.

## Changes Required

### 1. `server/src/services/userService.js`
- Update the `getUsers` function to loop through results using `.range()` until all users are fetched
- Use batch size of 1,000 (Supabase's max per query)
- Accumulate all users into an array and return them

## Implementation Steps
1. Modify the query to use `range()` in a loop
2. Fetch in batches (0-999, 1000-1999, etc.)
3. Stop when a batch returns fewer than 1,000 records
4. Return the combined array of all users

## Validation
- Verify that all 1,110 users are now returned when calling the API endpoint
- Confirm pagination still works correctly in the frontend