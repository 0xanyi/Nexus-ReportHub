# Manual Order Management - UI Guide

## Page Locations

### Church Detail Page
**URL**: `/dashboard/churches/[id]`

This is the main page where all order management happens.

## UI Components Overview

### 1. Church Detail Header
```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Churches                                      │
│                                                          │
│ St. Mary's Church                          [Export ▼]  │
│ Group A • UK Zone                          [Edit Church]│
└─────────────────────────────────────────────────────────┘
```

### 2. Financial Summary Cards
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│Total Orders  │ │Total Payments│ │Balance       │ │Total         │
│              │ │              │ │              │ │Campaigns     │
│£1,500.00    │ │£1,200.00    │ │£300.00      │ │£500.00      │
│150 copies    │ │12 payments   │ │Amount owed   │ │5 contributions│
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### 3. Order History Section (NEW)
```
┌─────────────────────────────────────────────────────────────┐
│ Order History                              [+ Add Order]    │
│ 15 orders recorded                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Search] [Year ▼] [Month ▼] [Clear Filters]              │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ 7 October 2025                    £300.00  [✏️] [🗑️] │  │
│ │ Uploaded by John Admin                              │  │
│ │ Note: September order                               │  │
│ │ ────────────────────────────────────────────────    │  │
│ │ • Rhapsody of Realities (30 × £3.00)      £90.00   │  │
│ │ • Teevo Magazine (20 × £2.50)             £50.00   │  │
│ │ • Daily Devotional (40 × £4.00)          £160.00   │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ 1 October 2025                    £450.00  [✏️] [🗑️] │  │
│ │ ...                                                 │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                             │
│ [← Previous]  [1] [2] [3] [4] [5]  [Next →]              │
└─────────────────────────────────────────────────────────────┘
```

### 4. Add/Edit Order Dialog (NEW)

#### Empty Create Form
```
┌───────────────────────────────────────────────────────────┐
│ Create New Order                                    [✕]   │
│ Create a manual order for St. Mary's Church              │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ Order Date *                                              │
│ [07/10/2025]                                              │
│                                                           │
│ Products *                              [+ Add Product]   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Product                                           │   │
│ │ [Select a product ▼                              ]│   │
│ │ Quantity          Total                          │   │
│ │ [1        ]      GBP 0.00                    [🗑️]│   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│                                      Order Total          │
│                                      GBP 0.00            │
│                                                           │
│ Notes (Optional)                                          │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Add any additional notes about this order...      │   │
│ │                                                   │   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│                              [Cancel] [Create Order]      │
└───────────────────────────────────────────────────────────┘
```

#### Filled Create Form with Multiple Products
```
┌───────────────────────────────────────────────────────────┐
│ Create New Order                                    [✕]   │
│ Create a manual order for St. Mary's Church              │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ Order Date *                                              │
│ [07/10/2025]                                              │
│                                                           │
│ Products *                              [+ Add Product]   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Product                                           │   │
│ │ [Rhapsody of Realities - GBP 3.00 ▼              ]│   │
│ │ Quantity          Total                          │   │
│ │ [30       ]      GBP 90.00                   [🗑️]│   │
│ └───────────────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Product                                           │   │
│ │ [Teevo Magazine - GBP 2.50 ▼                     ]│   │
│ │ Quantity          Total                          │   │
│ │ [20       ]      GBP 50.00                   [🗑️]│   │
│ └───────────────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Product                                           │   │
│ │ [Daily Devotional - GBP 4.00 ▼                   ]│   │
│ │ Quantity          Total                          │   │
│ │ [40       ]      GBP 160.00                  [🗑️]│   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│                                      Order Total          │
│                                      GBP 300.00          │
│                                                           │
│ Notes (Optional)                                          │
│ ┌───────────────────────────────────────────────────┐   │
│ │ September monthly order                           │   │
│ │                                                   │   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│                              [Cancel] [Create Order]      │
└───────────────────────────────────────────────────────────┘
```

#### Edit Form (Pre-populated)
```
┌───────────────────────────────────────────────────────────┐
│ Edit Order                                          [✕]   │
│ Edit order for St. Mary's Church                         │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ Order Date *                                              │
│ [07/10/2025]                                              │
│                                                           │
│ Products *                              [+ Add Product]   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Product                                           │   │
│ │ [Rhapsody of Realities - GBP 3.00 ▼              ]│   │
│ │ Quantity          Total                          │   │
│ │ [30       ]      GBP 90.00                   [🗑️]│   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│                                      Order Total          │
│                                      GBP 90.00           │
│                                                           │
│ Notes (Optional)                                          │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Updated September order                           │   │
│ │                                                   │   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│                              [Cancel] [Update Order]      │
└───────────────────────────────────────────────────────────┘
```

#### Loading State
```
┌───────────────────────────────────────────────────────────┐
│ Create New Order                                    [✕]   │
│ Create a manual order for St. Mary's Church              │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ [Form content greyed out]                                │
│                                                           │
│                              [Cancel] [⏳ Saving...]      │
└───────────────────────────────────────────────────────────┘
```

#### Error State
```
┌───────────────────────────────────────────────────────────┐
│ Create New Order                                    [✕]   │
│ Create a manual order for St. Mary's Church              │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ [Form content]                                            │
│                                                           │
│ ┌───────────────────────────────────────────────────┐   │
│ │ ⚠️ At least one product with quantity is required│   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│                              [Cancel] [Create Order]      │
└───────────────────────────────────────────────────────────┘
```

### 5. Delete Confirmation Dialog
```
┌───────────────────────────────────────────────────────────┐
│ Are you sure?                                             │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ Are you sure you want to delete this order?              │
│ This action cannot be undone.                            │
│                                                           │
│                                   [Cancel] [Delete]       │
└───────────────────────────────────────────────────────────┘
```

## Button States

### Add Order Button
- **Visible**: Only for SUPER_ADMIN and ZONE_ADMIN
- **Hidden**: For CHURCH_USER and non-authenticated users
- **Location**: Top-right of Order History card
- **Style**: Primary button with plus icon

### Edit Button (Pencil Icon)
- **Visible**: Only for admins on each order
- **Action**: Opens edit dialog with pre-filled data
- **Style**: Ghost button with edit icon

### Delete Button (Trash Icon)
- **Visible**: Only for admins on each order
- **Action**: Shows confirmation dialog
- **Style**: Ghost button with red trash icon
- **Color**: Red when hovered

### Add Product Button
- **Location**: Inside order form dialog
- **Action**: Adds new empty product line
- **Style**: Outline button with plus icon

### Remove Line Item Button (Trash Icon)
- **Visible**: On each product line in form
- **Disabled**: When only one line item exists
- **Action**: Removes that product line
- **Style**: Ghost button with trash icon

## Responsive Behavior

### Desktop (> 1024px)
- Form dialog: 700px width
- Product lines: Full width side-by-side layout
- All buttons visible with text labels

### Tablet (768px - 1024px)
- Form dialog: 90% width
- Product lines: Maintained side-by-side
- Some padding reduced

### Mobile (< 768px)
- Form dialog: Full screen with scrolling
- Product lines: Stack vertically
- Product name on one row
- Quantity and total on second row
- Buttons as icons only

## Color Scheme

### Primary Actions
- **Create/Update**: Blue primary button
- **Add Product**: Blue outline button

### Secondary Actions
- **Cancel**: Grey outline button
- **Edit**: Grey ghost button

### Destructive Actions
- **Delete**: Red ghost button
- **Delete (hover)**: Darker red

### States
- **Disabled**: Grey with reduced opacity
- **Loading**: Primary color with spinner
- **Error**: Red background with white text

## Icons Used

- ✏️ Edit (Pencil)
- 🗑️ Delete (Trash)
- ➕ Add (Plus)
- ✕ Close (X)
- ⏳ Loading (Loader2 with spin)
- ⚠️ Error/Warning

## Accessibility Features

1. **Keyboard Navigation**
   - Tab through all form fields
   - Enter to submit
   - Escape to close dialog

2. **Screen Reader Support**
   - All buttons have aria-labels
   - Form fields have associated labels
   - Error messages announced

3. **Visual Feedback**
   - Focus rings on all interactive elements
   - Hover states for buttons
   - Disabled state clearly visible

4. **Color Contrast**
   - All text meets WCAG AA standards
   - Error messages high contrast
   - Disabled elements distinguishable

## Animation/Transitions

1. **Dialog Open/Close**
   - Fade in/out
   - Scale slightly (95% to 100%)
   - Duration: 200ms

2. **Button Hover**
   - Background color transition
   - Duration: 150ms

3. **Loading Spinner**
   - Continuous rotation
   - Smooth animation

4. **Line Item Add/Remove**
   - Smooth height transition
   - Duration: 200ms

## User Feedback Messages

### Success
- "Order created successfully" (implicit - dialog closes)
- "Order updated successfully" (implicit - dialog closes)
- "Order deleted successfully" (implicit - item removed)

### Error
- "Missing required fields: churchId, transactionDate, lineItems"
- "At least one line item is required"
- "At least one product with quantity is required"
- "Church not found"
- "Product not found: [id]"
- "Failed to save order"
- "Failed to delete order"

### Validation
- "Transaction date is required"
- "Product is required"
- "Quantity must be greater than 0"

## Best Practices Implemented

1. **Optimistic UI Updates**: Page refreshes after operations
2. **Error Recovery**: Form stays open on error for corrections
3. **Confirmation Dialogs**: Delete requires confirmation
4. **Loading States**: Clear indication when saving
5. **Disabled States**: Submit disabled during loading
6. **Auto-calculation**: Totals update in real-time
7. **Smart Defaults**: Date defaults to today
8. **Clear Actions**: Cancel vs Submit clearly separated
9. **Undo Prevention**: Confirmation before destructive actions
10. **Responsive Design**: Works on all screen sizes
