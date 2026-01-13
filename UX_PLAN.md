# Order Inquiry System Fixes - Implementation Plan

## Problem Summary

The order inquiry email system has several critical issues:

1. **Customer Name Shows "Customer"**: User schema missing `firstName`, `lastName`, `company`, `phone`, `businessLicense` fields
2. **Unit Price Shows $0.00**: Pre-bagging creates custom weights (2g, 3.5g, 10g) that don't match fixed pricing tiers (7g, 14g, 28g)
3. **Admin Email Hardcoded**: Falls back to `admin@bcflame.com` (working as intended via env var)

## Root Causes

### Issue 1: Missing User Profile Fields
- **Location**: `/backend/src/extensions/users-permissions/content-types/user/schema.json`
- **Current fields**: username, email, password, confirmed, blocked, role, reseller_logo
- **Missing fields**: firstName, lastName, company, phone, businessLicense
- **Impact**: Email templates fallback to username or "Customer"

### Issue 2: Pricing Model Mismatch
- **Pricing Schema**: `/backend/src/components/product/pricing.json` - Fixed enum `['7g', '14g', '28g']`
- **Order Weights**: Pre-bagging selections create arbitrary weights (e.g., 2g × 5 = 10g)
- **Price Lookup**: `/backend/src/api/order-inquiry/content-types/order-inquiry/lifecycles.ts:19-31` - String match fails when weight not in enum
- **Result**: `unitPrice = 0` for non-standard weights

### Issue 3: Email Configuration
- **Status**: Working as designed via `EMAIL_ADMIN_RECIPIENTS` env var
- **No changes needed**

## Solution: Price-Per-Weight Model + Profile Collection

### Design Decision: Price Per Unit Weight
Based on user selection, we'll implement a **price-per-gram** model:
- Products have a single `base_price_per_gram` field (decimal)
- Order total = `total_weight × base_price_per_gram`
- Works for any pre-bagging combination
- Simple, flexible, and aligns with cannabis industry pricing norms

### Design Decision: Registration-Time Profile Collection
Based on user selection, we'll collect customer profile during registration:
- Extend registration form with profile fields (firstName, lastName, company, phone, businessLicense)
- All fields required before portal access
- Ensures complete data for first order
- Better UX than interrupting order flow

## Implementation Plan

### Phase 1: Extend User Schema & Registration Form

#### 1.1 Update User Schema
**File**: `/backend/src/extensions/users-permissions/content-types/user/schema.json`

**Changes**:
- Add `firstName` (string, required)
- Add `lastName` (string, required)
- Add `company` (string, required) - B2B business name
- Add `phone` (string, required) - Contact phone number
- Add `businessLicense` (string, required) - Cannabis license or tax ID

**Verification**:
- Restart backend to apply schema changes
- Check Strapi admin panel → Users → Schema updated

#### 1.2 Update Registration API & Frontend Form
**Backend File**: `/backend/src/api/auth/controllers/auth.ts` (may need to extend default controller)
**Frontend Files**:
- `/frontend/src/app/(auth)/register/page.tsx` (create if doesn't exist)
- `/frontend/src/components/auth/RegisterForm.tsx` (create)

**Changes**:
- Add form fields: First Name, Last Name, Company, Phone, Business License
- Add validation: All fields required, phone format, email format
- Update register API call to include new fields
- Add success redirect to login page

**Verification**:
- Test registration flow with new fields
- Verify user created in Strapi admin with all fields populated
- Test validation (required fields, phone format)

### Phase 2: Migrate to Price-Per-Gram Model

#### 2.1 Update Product Schema
**File**: `/backend/src/api/product/content-types/product/schema.json`

**Changes**:
- Add `base_price_per_gram` field (decimal, required)
- Keep existing `pricing` component array for backward compatibility (can deprecate later)
- Add `pricing_model` enum field: `['per_gram', 'tiered']` (default: 'per_gram')

**Migration Strategy**:
- Existing products with tiered pricing: Calculate average price per gram from lowest tier
- Example: If 7g = $50, set `base_price_per_gram = 50/7 = 7.14`
- Manually review pricing in admin panel after migration

**Verification**:
- Restart backend
- Check product schema in admin panel
- Add `base_price_per_gram` to existing products

#### 2.2 Update Price Calculation Logic
**File**: `/backend/src/api/order-inquiry/content-types/order-inquiry/lifecycles.ts`

**Current Logic (lines 19-31)**:
```typescript
const orderWeight = `${inquiry.total_weight}${inquiry.weight_unit}`
let unitPrice = 0
if (product.pricing && Array.isArray(product.pricing)) {
  const matchingPrice = product.pricing.find(p => p.weight === orderWeight)
  if (matchingPrice) {
    unitPrice = matchingPrice.amount || 0
  }
}
```

**New Logic**:
```typescript
// Calculate unit price from base_price_per_gram
let unitPrice = 0
if (product.base_price_per_gram) {
  // Convert weight to grams if needed
  let weightInGrams = inquiry.total_weight
  if (inquiry.weight_unit === 'oz') {
    weightInGrams = inquiry.total_weight * 28.35
  } else if (inquiry.weight_unit === 'lb') {
    weightInGrams = inquiry.total_weight * 453.592
  }

  unitPrice = product.base_price_per_gram * weightInGrams
}

// Fallback to tiered pricing if base_price_per_gram not set (backward compatibility)
if (unitPrice === 0 && product.pricing && Array.isArray(product.pricing)) {
  const orderWeight = `${inquiry.total_weight}${inquiry.weight_unit}`
  const matchingPrice = product.pricing.find(p => p.weight === orderWeight)
  if (matchingPrice) {
    unitPrice = matchingPrice.amount || 0
  }
}
```

**Verification**:
- Create test order with custom weight (e.g., 10g)
- Verify unit price calculated correctly in email
- Test with different weight units (g, oz, lb)

#### 2.3 Update Frontend Product Display
**Files**:
- `/frontend/src/components/products/ProductCard.tsx`
- `/frontend/src/types/product.ts`

**Changes**:
- Add `base_price_per_gram` to Product type
- Update ProductCard to show price per gram instead of price range
- Display: "Starting at $X.XX/gram" or similar
- Update API fetch to include `base_price_per_gram` field

**Verification**:
- Products page shows price per gram
- Price display format is clear and professional

### Phase 3: Update Email Templates

#### 3.1 Update Email Data Formatting
**File**: `/backend/src/api/order-inquiry/content-types/order-inquiry/lifecycles.ts` (lines 35-37)

**Current Logic**:
```typescript
customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.username || 'Customer',
customerEmail: customer.email || 'Not provided',
customerCompany: customer.company || 'N/A',
```

**New Logic**:
```typescript
customerName: `${customer.firstName} ${customer.lastName}`.trim(),
customerEmail: customer.email,
customerCompany: customer.company,
customerPhone: customer.phone || 'Not provided',
customerBusinessLicense: customer.businessLicense || 'Not provided',
```

**Rationale**: All fields now required at registration, so no fallbacks needed (except optional phone/license)

#### 3.2 Update Email Templates
**File**: `/backend/src/templates/order-email.ts`

**Changes**:
- Add phone number row to customer info section
- Add business license row to customer info section
- Update pricing display to show calculated price (already shows unit price, just verify formatting)
- Ensure all customer fields properly displayed

**Verification**:
- Send test order inquiry
- Verify admin email shows: full name, company, phone, business license
- Verify customer confirmation email shows correct info
- Verify pricing displays correctly with new calculation

### Phase 4: Database Seeding & Migration

#### 4.1 Update User Seeder
**File**: `/backend/database/seeders/user-seeder.ts` (may need to create)

**Changes**:
- Add sample users with new profile fields
- Include diverse test data (different companies, phone formats, etc.)

#### 4.2 Update Product Seeder
**File**: `/backend/database/seeders/product-seeder.ts`

**Changes**:
- Add `base_price_per_gram` to all seeded products
- Use realistic pricing (e.g., $7-15/gram depending on quality)
- Set `pricing_model: 'per_gram'`

**Verification**:
- Run `npm run db:reset` and re-seed
- Verify products have `base_price_per_gram`
- Verify users have complete profiles

### Phase 5: Testing & Validation

#### 5.1 Unit Tests
**Files to Update**:
- `/backend/src/api/order-inquiry/content-types/order-inquiry/lifecycles.test.ts`
- `/frontend/src/lib/api/customization.test.ts`
- `/frontend/src/components/auth/RegisterForm.test.tsx` (create)

**Test Cases**:
- Price calculation with per-gram model (various weights)
- Price calculation fallback to tiered pricing (backward compatibility)
- Email data formatting with new customer fields
- Registration form validation (all fields required)
- Weight unit conversion (g, oz, lb)

#### 5.2 Integration Testing
**Test Scenarios**:
1. **New User Registration**: Register with complete profile → Login → Browse products
2. **Order Submission**: Select product → Customize → Choose pre-bagging → Submit → Verify email
3. **Email Content**: Check admin email has correct customer info and pricing
4. **Customer Confirmation**: Check customer email has correct order summary
5. **Edge Cases**: Test with 0g weight, very large weights, different weight units

#### 5.3 Manual Testing Checklist
- [ ] Register new user with all fields
- [ ] Login with new user
- [ ] Browse products (verify price display)
- [ ] Customize product with multiple pre-bagging selections
- [ ] Submit order inquiry
- [ ] Verify admin email received with:
  - [ ] Correct customer name (first + last)
  - [ ] Correct company name
  - [ ] Correct phone number
  - [ ] Correct business license
  - [ ] Correct unit price (calculated from total weight)
  - [ ] Correct total price
- [ ] Verify customer confirmation email received
- [ ] Check Strapi admin panel for order inquiry entry

## Files to Modify

### Backend Files
1. `/backend/src/extensions/users-permissions/content-types/user/schema.json` - Add profile fields
2. `/backend/src/api/product/content-types/product/schema.json` - Add base_price_per_gram
3. `/backend/src/api/order-inquiry/content-types/order-inquiry/lifecycles.ts` - Update price calculation and email data
4. `/backend/src/templates/order-email.ts` - Update email templates with new fields
5. `/backend/database/seeders/product-seeder.ts` - Add pricing to seeded products
6. `/backend/database/seeders/user-seeder.ts` - Add profile fields to seeded users

### Frontend Files
7. `/frontend/src/app/(auth)/register/page.tsx` - Create registration page
8. `/frontend/src/components/auth/RegisterForm.tsx` - Create registration form component
9. `/frontend/src/types/product.ts` - Add base_price_per_gram to Product type
10. `/frontend/src/components/products/ProductCard.tsx` - Update price display

### Test Files
11. `/backend/src/api/order-inquiry/content-types/order-inquiry/lifecycles.test.ts` - Update tests
12. `/frontend/src/components/auth/RegisterForm.test.tsx` - Create tests
13. `/frontend/src/lib/api/customization.test.ts` - Update tests

## Risk Mitigation

### Backward Compatibility
- Keep `pricing` component array for existing products
- Price calculation checks `base_price_per_gram` first, falls back to tiered pricing
- Gradual migration path for existing products

### Data Migration
- Existing users without profile fields: Will need to update profile manually in admin panel
- Option: Create migration script to set default values or mark for profile completion
- Option: Add "Complete Your Profile" banner in portal for users with missing fields

### Validation
- Frontend validation prevents incomplete registrations
- Backend validation ensures data integrity
- Phone format validation (international support?)
- Business license format validation (varies by jurisdiction)

## UX Flow Assessment

### Current Flow: ✅ Good Structure, Needs Fixes
The current UX flow is **on the right track**:

**Strengths**:
- Clear 4-step customization wizard (Photos → Bud Styles → Design → Pre-Bagging)
- Visual product selection with images
- Flexible pre-bagging configuration
- Automatic email notifications
- Confirmation emails for customers

**Issues Fixed by This Plan**:
- ❌ Incomplete customer data → ✅ Full profile at registration
- ❌ $0.00 pricing → ✅ Dynamic price calculation
- ❌ Generic "Customer" name → ✅ Real names in emails

**Recommended Enhancements** (Future):
- Add order inquiry status tracking page in portal
- Show price preview in pre-bagging step (calculate as user selects)
- Add order history page
- Email status change notifications (approved/rejected)

### Post-Implementation Flow
1. **Registration**: User provides full profile (name, company, phone, license)
2. **Login**: Access portal with complete profile
3. **Browse Products**: See price per gram for each product
4. **Customize**: Select photos, bud styles, design, pre-bagging
5. **Preview**: See total weight and calculated price before submit
6. **Submit**: Order inquiry created with correct pricing
7. **Email Notifications**: Admin and customer receive accurate emails
8. **Follow-up**: Status updates sent as order progresses

## Verification Steps

### After Implementation:
1. Register new test user with profile fields
2. Create order inquiry with custom pre-bagging (e.g., 2g × 5 = 10g)
3. Check emails:
   - Admin email shows full name, company, phone, license
   - Unit price shows calculated amount (e.g., $7.14/g × 10g = $71.40)
   - Total price accurate
4. Verify order in Strapi admin panel has all data
5. Run test suite: `npm run test` (frontend & backend)
6. Check test coverage: `npm run test:coverage`

## Timeline Considerations

This is a **moderate complexity** implementation involving:
- Schema changes (backend restart required)
- Database migrations/seeding
- Frontend form creation
- Price calculation logic
- Email template updates
- Comprehensive testing

**Estimated Scope**: ~10-15 files to modify/create, ~500-800 lines of code

## Questions for Follow-up

1. **Phone Format**: Support international phone numbers or US-only?
2. **Business License**: Any specific format validation required?
3. **User Migration**: How to handle existing users without profile fields?
4. **Price Display**: Show total price preview in pre-bagging step?
5. **Price Precision**: Round to 2 decimals or allow more precision?

## Summary

This plan fixes all three issues:
1. ✅ Customer name/info by extending user schema and collecting at registration
2. ✅ Unit price calculation by implementing price-per-gram model
3. ✅ Email configuration already correct (no changes needed)

The solution is **production-ready**, **backward-compatible**, and **follows industry standards** for cannabis product pricing. The UX flow is solid and only needs these data/pricing fixes to work correctly.
