# Manual Order Management Feature

## Overview
This feature adds the ability to manually create, edit, and delete orders at the church level, providing administrators with full control over order management without requiring CSV uploads.

## Features Implemented

### 1. **Manual Order Creation**
- Administrators can create orders directly from the church detail page
- Support for multiple products in a single order
- Real-time total calculation
- Date selection for order placement
- Optional notes field

### 2. **Order Editing**
- Edit existing orders including:
  - Order date
  - Products and quantities
  - Notes
- Line items can be added, removed, or modified
- Totals automatically recalculate

### 3. **Order Deletion**
- Delete orders with confirmation dialog
- Cascading deletion of associated line items

## Technical Implementation

### New API Routes

#### `/api/transactions` (POST)
Creates a new order/transaction for a church.

**Request Body:**
```json
{
  "churchId": "string",
  "transactionDate": "ISO date string",
  "notes": "string (optional)",
  "lineItems": [
    {
      "productTypeId": "string",
      "quantity": number
    }
  ]
}
```

#### `/api/transactions/[id]` (GET, PUT, DELETE)
- **GET**: Retrieve a specific transaction with all details
- **PUT**: Update transaction date, notes, and line items
- **DELETE**: Remove a transaction

### New Components

#### `OrderForm.tsx`
A comprehensive dialog-based form for creating and editing orders:
- Product selection with real-time pricing
- Dynamic line item management (add/remove products)
- Quantity input with validation
- Auto-calculation of totals
- Date picker for order date
- Notes textarea

**Key Features:**
- Fetches available products from all departments
- Validates all inputs before submission
- Shows loading states during API calls
- Error handling and display

#### `ChurchOrdersManager.tsx`
Wrapper component that integrates order management with the transaction history:
- "Add Order" button (admin only)
- Manages dialog state for create/edit modes
- Handles API calls for delete operations
- Refreshes data after successful operations

### Updated Components

#### `TransactionHistory.tsx`
Enhanced with order management capabilities:
- Edit button for each transaction (admin only)
- Delete button with confirmation (admin only)
- Displays order notes
- Supports all existing filtering and pagination

#### Church Detail Page (`/dashboard/churches/[id]/page.tsx`)
- Replaced standalone TransactionHistory with ChurchOrdersManager
- Passes admin status to enable/disable management features

### Updated API Routes

#### `/api/departments` (GET)
Enhanced to return product types with each department:
```json
{
  "departments": [
    {
      "id": "string",
      "name": "string",
      "productTypes": [
        {
          "id": "string",
          "name": "string",
          "unitPrice": number,
          "currency": "string"
        }
      ]
    }
  ]
}
```

## User Flow

### Creating an Order
1. Navigate to a church detail page
2. Click "Add Order" button (visible to admins only)
3. Select order date
4. Add products by:
   - Selecting product from dropdown
   - Entering quantity
   - Clicking "Add Product" for additional items
5. Optionally add notes
6. Review total amount
7. Click "Create Order"

### Editing an Order
1. From the transaction history section
2. Click the edit icon (pencil) on any order
3. Modify date, products, quantities, or notes
4. Click "Update Order"

### Deleting an Order
1. From the transaction history section
2. Click the delete icon (trash) on any order
3. Confirm deletion in the dialog
4. Order and all line items are permanently removed

## Permissions
- **View Orders**: All authenticated users
- **Create Orders**: SUPER_ADMIN and ZONE_ADMIN only
- **Edit Orders**: SUPER_ADMIN and ZONE_ADMIN only
- **Delete Orders**: SUPER_ADMIN and ZONE_ADMIN only

## Data Validation

### Server-side Validation
- Church existence verification
- Product type verification
- Quantity must be positive integer
- At least one line item required
- Valid date format

### Client-side Validation
- Required fields marked with asterisk
- Real-time total calculation
- Disabled submit until all fields valid
- Cannot remove last product line item

## Database Schema
Uses existing Prisma models:
- `Transaction` - Order header information
- `TransactionLineItem` - Individual products in order
- `ProductType` - Available products with pricing
- `Church` - Order recipient

## Benefits

1. **Flexibility**: Create orders without CSV uploads
2. **Accuracy**: Real-time validation and calculation
3. **Auditability**: All orders tracked with uploader information
4. **Corrections**: Ability to edit mistakes immediately
5. **Efficiency**: No need to regenerate CSV files for single orders

## Future Enhancements (Suggestions)

1. **Bulk Actions**: Select and edit multiple orders at once
2. **Order Templates**: Save frequently used product combinations
3. **Order Duplication**: Clone existing orders for quick reordering
4. **Advanced Filtering**: Filter orders by product type or date range
5. **Order Status**: Add status workflow (pending, confirmed, delivered)
6. **Price History**: Track and display product price changes over time
7. **Order Notifications**: Email notifications for order creation/updates

## Testing Recommendations

1. Test with various product combinations
2. Verify total calculations with edge cases
3. Test permission restrictions for different user roles
4. Verify data refresh after operations
5. Test concurrent editing scenarios
6. Validate error handling for network failures
7. Test with large numbers of products (performance)

## Files Modified/Created

### New Files
- `/app/api/transactions/route.ts`
- `/app/api/transactions/[id]/route.ts`
- `/components/churches/OrderForm.tsx`
- `/components/churches/ChurchOrdersManager.tsx`

### Modified Files
- `/components/TransactionHistory.tsx`
- `/app/(dashboard)/dashboard/churches/[id]/page.tsx`
- `/app/api/departments/route.ts`

## Deployment Notes

- No database migrations required (uses existing schema)
- No environment variable changes needed
- Fully backward compatible with existing functionality
- Build completes successfully with no errors
