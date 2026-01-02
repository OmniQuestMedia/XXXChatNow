# Model Performance Menu Specification

## Overview
The Model Performance Menu is a versatile, real-time sales tool designed to enhance model-broadcast interactions on XXXChatNow. It allows models to offer and customize purchasable actions, services, or interactive experiences using platform tokens. This document outlines the comprehensive specification based on recent updates and decisions.

## Key Features

### General Requirements
- **Mandatory Menu**: Each model must have at least one active menu to broadcast.
- **Minimum Items**: At least one menu item must be fully populated with:
  - Item Name
  - Optional Description
  - Token Value
- **Menu Capacity**:
  - Up to 8 menus per model.
  - Maximum 50 items per menu.

### Item Controls
- **Required Fields**:
  - Item Name: Up to 65 characters.
  - Description (optional): Up to 200 characters.
  - Token Value: Up to five integer digits.
  - Optional Bonus Loyalty Points (default: 0).
  - Status Toggle (enabled/disabled).
- **Ordering Options**:
  - Sort by Item Name.
  - Sort by Token Value (ascending/descending).
  - Insert rows above or below existing items.

### Visual Customization
- **Text Settings**:
  - Font Size: Small (10pt), Medium (12pt, default), Large (14pt).
  - Font Style: Bold or Regular (default).
  - Font Family: Arial (default).
- **Color Settings**:
  - Customize using Hex Color Selectors for:
    - Font Color
    - Background Color
    - Frame and Line Colors
  - Default Themes:
    - **Pink**: Frame `#FF009D`, Background `#000000`, Text `#FFFFFF`.
    - **Blue**: Frame `#5170FF`, Background `#000000`, Text `#FFFFFF`.

### Promo Pricing
- Enable percentage-based adjustments:
  - `+XX%` for price increases.
  - `-XX%` for price decreases.

### Persistence and Defaults
- Menu settings persist across sessions.
- User can duplicate entire menus with the "Duplicate Menu" button.

## Purchase Workflows
- **Active Broadcast Display**:
  - Menus are only visible when the model is live.
  - Any change must retain at least one active item to keep the broadcast running.

- **Performance Queue Integration**:
  - Existing items in the queue retain their original price, unaffected by menu changes.

## Data & Reporting
- **Metrics**:
  - Menu Usage: Total items sold per menu and per item.
  - Summaries: Overall averages and aggregates per session.
- **PDF Generation**:
  - Models and Admins can download session-specific performance reports.
  - Includes per-menu sales breakdown, overall totals, and averages.
  - PDF is retained for Admins for 90 days, then deleted.
  - Standardized timestamps (EST) for session tracking.

## Integration & APIs
- **Menu State Logging**:
  - Track all changes and assign unique IDs for disputes.
- **Red Room Rewards**:
  - Send payloads for loyalty points transfer.

## Accessibility & Localization
- Full-spectrum Hex color selectors.
- ARIA labels for screen readers.
- Translation supported via i18n.
- Mobile-friendly design including touch-controlled menu interactions.

---