# Testing the Manual Order Management Feature

## Manual Testing Guide

### Prerequisites
1. Be logged in as SUPER_ADMIN or ZONE_ADMIN
2. Have at least one church in the system
3. Have at least one product type configured

### Test Case 1: View Church Details with Orders
1. Navigate to `/dashboard/churches`
2. Click on any church name
3. Verify you see:
   - "Add Order" button (if admin)
   - Order History section
   - Existing orders (if any)

### Test Case 2: Create a New Order
1. From church detail page, click "Add Order"
2. Dialog should appear with:
   - Order Date field
   - Products section with one empty product row
   - Notes field (optional)
3. Select today's date
4. Select a product from dropdown
5. Set quantity to 5
6. Verify total amount calculates correctly
7. Click "Add Product" to add another line
8. Add a second product with quantity 3
9. Add note: "Test order"
10. Click "Create Order"
11. Verify:
    - Success message or dialog closes
    - Page refreshes showing new order
    - Order appears in transaction history

### Test Case 3: Edit an Existing Order
1. Find an order in the transaction history
2. Click the edit (pencil) icon
3. Dialog opens with pre-filled data
4. Change the date to yesterday
5. Modify first product quantity to 10
6. Remove one line item (if multiple exist)
7. Update notes to "Updated test order"
8. Click "Update Order"
9. Verify:
    - Changes are saved
    - New total reflects quantity changes
    - Updated note displays

### Test Case 4: Delete an Order
1. Find an order in the transaction history
2. Click the delete (trash) icon
3. Confirm deletion in dialog
4. Verify:
    - Order is removed from list
    - Total orders count decreases
    - Balance updates accordingly

### Test Case 5: Add Multiple Products
1. Click "Add Order"
2. Add 3 different products:
   - Product A: 10 units
   - Product B: 5 units
   - Product C: 15 units
3. Verify:
   - Each line shows correct subtotal
   - Total at bottom is sum of all lines
4. Remove Product B line
5. Verify total recalculates
6. Save order

### Test Case 6: Validation Tests
1. Try to create order without selecting a product
   - Should show validation error
2. Try to create order with quantity = 0
   - Should prevent submission
3. Try to remove the last product line item
   - Remove button should be disabled
4. Try to create order without selecting date
   - Should show validation error

### Test Case 7: Permission Tests
1. Log out and log back in as CHURCH_USER
2. Navigate to church detail page
3. Verify:
   - "Add Order" button is NOT visible
   - Edit icons are NOT visible on orders
   - Delete icons are NOT visible on orders
   - Can still view order history

### Test Case 8: Financial Impact
Before creating order:
1. Note the church's current balance
2. Note total orders amount
3. Create new order for £100
4. Verify:
   - Total orders increases by £100
   - Balance decreases by £100 (more owed)
   - Product breakdown shows new quantities

## API Testing with curl

### 1. Create an Order
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "churchId": "YOUR_CHURCH_ID",
    "transactionDate": "2025-10-07",
    "notes": "API test order",
    "lineItems": [
      {
        "productTypeId": "YOUR_PRODUCT_ID",
        "quantity": 5
      }
    ]
  }'
```

### 2. Get Transaction Details
```bash
curl http://localhost:3000/api/transactions/YOUR_TRANSACTION_ID
```

### 3. Update an Order
```bash
curl -X PUT http://localhost:3000/api/transactions/YOUR_TRANSACTION_ID \
  -H "Content-Type: application/json" \
  -d '{
    "transactionDate": "2025-10-06",
    "notes": "Updated via API",
    "lineItems": [
      {
        "productTypeId": "YOUR_PRODUCT_ID",
        "quantity": 10
      }
    ]
  }'
```

### 4. Delete an Order
```bash
curl -X DELETE http://localhost:3000/api/transactions/YOUR_TRANSACTION_ID
```

### 5. Get Products for Dropdown
```bash
curl http://localhost:3000/api/departments
```

## Browser Console Testing

### Test Form Validation
```javascript
// Open browser console on church detail page
// Try to submit form without required fields
document.querySelector('button[type="submit"]').click()

// Should see validation messages
```

### Test Total Calculation
```javascript
// Add products and watch console for calculation logs
console.log('Testing product totals...')
```

## Edge Cases to Test

1. **Very Large Quantities**
   - Try quantity of 9999
   - Verify calculation handles it

2. **Multiple Currencies**
   - If multiple zones exist, verify correct currency displays

3. **Concurrent Editing**
   - Open church page in two browser windows
   - Edit same order in both
   - Last save should win

4. **Network Errors**
   - Disable network in dev tools
   - Try to save order
   - Should show error message

5. **Long Product Names**
   - Products with very long names should not break layout

6. **Many Line Items**
   - Add 10+ products to one order
   - Dialog should scroll properly

## Expected Results Summary

### Successful Creation
- HTTP 200 response
- Transaction ID returned
- Page refreshes with new order visible
- All calculations correct

### Successful Edit
- HTTP 200 response
- Updated data shows immediately
- Old data completely replaced

### Successful Delete
- HTTP 200 response
- Order disappears from list
- Cannot be retrieved afterwards

### Permission Denied
- HTTP 403 response
- Error message shown to user
- No data changed

### Validation Errors
- HTTP 400 response
- Clear error message
- Form remains open for corrections

## Regression Testing

Ensure existing features still work:

1. CSV upload still functions
2. Payment recording unaffected
3. Reports generate correctly
4. Church financial summary accurate
5. Export functionality works
6. Filtering and searching orders works
7. Pagination functions properly

## Performance Considerations

- Page should load in < 2 seconds
- Order creation should complete in < 1 second
- Large order lists should paginate smoothly
- No memory leaks on repeated create/edit/delete

## Accessibility Testing

1. Tab through form using keyboard only
2. Test with screen reader
3. Ensure proper ARIA labels
4. Verify color contrast meets WCAG standards
5. Test responsive design on mobile

## Browser Compatibility

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes for QA Team

- All order operations require admin privileges
- Orders cannot be created without products
- Deletion is permanent (no soft delete)
- Line items cascade delete with transaction
- Unit prices come from product master data
- Totals always calculated server-side
- Currency from church's zone
