# Quick Demo Testing Guide

## ✅ Services Status

All services are running successfully:
- ✅ Frontend: http://localhost:3000 (Ready in 11.6s)
- ✅ Strapi: http://localhost:1337 (Healthy)
- ✅ PostgreSQL: localhost:5432 (Healthy)

## 🎯 Quick 5-Minute Test

### Step 1: Access the Demo (30 seconds)

**Option A - Direct Access:**
```
http://localhost:3000/products/demo/customize
```

**Option B - Via Products Page:**
1. Go to: http://localhost:3000/products
2. Look for orange button "View Image Customization Demo" (top right)
3. Click it

### Step 2: Test Core Flow (4 minutes)

**Product Selection Screen (10 seconds):**
- ✅ See 2 products: "Gas Gummies" and "Purple Haze"
- ✅ See "DEMO PROTOTYPE" orange badge
- ✅ Click "Customize Packaging" on Gas Gummies

**Customization Studio (2 minutes):**

1. **Bud Selection (30 seconds):**
   - ✅ Scroll horizontal bud picker at bottom
   - ✅ Click 5 different bud images
   - ✅ Watch 5 slot tabs fill automatically
   - ✅ See checkmark on selected images
   - ✅ Try clicking 6th image (should be disabled)

2. **Background Selection (30 seconds):**
   - ✅ Look at right sidebar (2-column grid)
   - ✅ Click "Midnight Fire" (dark gradient)
   - ✅ Watch all 5 previews update instantly
   - ✅ Notice text background color adapts
   - ✅ Try "Cool Ice" (blue) and "Forest Green"
   - ✅ Try "Smoke Texture" (image background)

3. **Font Selection (30 seconds):**
   - ✅ Look at left sidebar
   - ✅ Click "Bebas Neue" font
   - ✅ Watch text style change across all previews
   - ✅ Try "Anton" and "Oswald"
   - ✅ Click "Small", "Medium", "Large" size buttons
   - ✅ See text size change in real-time

4. **Navigation & Preview (30 seconds):**
   - ✅ Click slot tabs (1, 2, 3, 4, 5) to switch variations
   - ✅ See different bud image in each slot
   - ✅ Click "Preview Fullscreen" button
   - ✅ See large 600x900px preview
   - ✅ Use left/right arrows to navigate
   - ✅ See "Image X of 5" indicator
   - ✅ Click X to close modal

**Checkout Screen (1 minute):**
- ✅ Click "Checkout & Download" button
- ✅ See grid of all 5 variations (small previews)
- ✅ See product name "Gas Gummies"
- ✅ See count: "5 variations"
- ✅ See pricing: "$125.00" (5 × $25)
- ✅ See mock payment form (card, expiry, CVC)
- ✅ Click "Pay $125.00" button

**Success Screen (30 seconds):**
- ✅ See green checkmark icon
- ✅ See "Payment Successful!" message
- ✅ See 5 download items listed
- ✅ Each item shows small preview thumbnail
- ✅ Each has "Download" button
- ✅ Click "Create Another Pack"
- ✅ Verify it returns to products page

### Step 3: Edge Cases (30 seconds)

**Test Remove Function:**
1. Go back to demo customize page
2. Select 5 bud images
3. Click small X on any slot tab
4. ✅ Verify image is removed
5. ✅ Verify you can select a new image

**Test Slot Navigation:**
1. Fill 5 slots with different images
2. Click each slot tab (1-5)
3. ✅ Verify main preview shows correct bud image
4. ✅ Verify all have same background/font

**Test Empty Checkout:**
1. Refresh page (clears state)
2. Don't select any images
3. ✅ Verify "Checkout & Download" is disabled

## 🎨 Visual Quality Checklist

**Animations & Transitions:**
- ✅ Smooth hover effects (scale + shadow)
- ✅ Smooth color transitions
- ✅ No jerky movements
- ✅ No visual glitches

**Selected States:**
- ✅ Orange border on selected items
- ✅ Checkmark badge on selected buds
- ✅ Checkmark icon on selected background
- ✅ Clear visual feedback

**Typography:**
- ✅ Product names use selected Google Font
- ✅ Font changes apply instantly
- ✅ Size changes work correctly
- ✅ Text is readable on all backgrounds

**Layout:**
- ✅ Left sidebar: Fonts
- ✅ Center: Preview + Bud Picker
- ✅ Right sidebar: Backgrounds
- ✅ Top: Navigation + Progress
- ✅ No overlapping elements

## 🐛 Common Issues & Fixes

### Issue: "Page not found"
**Fix:** Verify URL is correct:
- ✅ http://localhost:3000/products/demo/customize
- ❌ http://localhost:3000/demo/customize (wrong)

### Issue: "Cannot read property of undefined"
**Fix:** Check browser console for errors:
```bash
# Check frontend logs
docker-compose logs -f frontend
```

### Issue: Images not loading
**Fix:** Check network tab in browser DevTools
- Unsplash URLs should load fine
- If blocked, check firewall/proxy settings

### Issue: Fonts not changing
**Fix:** Google Fonts might be loading
- Wait 2-3 seconds after page load
- Check Network tab for Google Fonts requests
- Try different font to verify

### Issue: "Checkout" button disabled
**Fix:** Select at least 1 bud image
- Button enables when filledSlotsCount > 0

## 📹 Ready for CEO Demo Video?

**Pre-Recording Checklist:**
- ✅ Services running (check above)
- ✅ Browser cache cleared
- ✅ No console errors
- ✅ Tested full flow 2-3 times
- ✅ Screen resolution: 1920x1080
- ✅ Browser extensions disabled
- ✅ Unnecessary tabs closed

**Recording Flow (30 seconds):**
1. Start at products page
2. Click demo button
3. Click "Customize" on Gas Gummies
4. Rapid-fire: Select 5 bud images (5 clicks)
5. Click 2-3 different backgrounds (watch updates)
6. Click 2-3 different fonts (watch updates)
7. Navigate carousel (click tabs 1→2→3→4→5)
8. Fullscreen preview (open → arrows → close)
9. Checkout (show summary)
10. Success (show downloads)

**Expected Result:**
- Smooth, professional, no errors
- CEO sees complete flow
- Validates UX concept
- Ready for approval

## ✨ Success Criteria

**Demo Passes If:**
- ✅ No console errors during flow
- ✅ All interactions work smoothly
- ✅ Previews update in real-time
- ✅ Visual quality is professional
- ✅ Flow is intuitive (no confusion)
- ✅ Performance is fast (no lag)

**Demo Fails If:**
- ❌ Console errors appear
- ❌ Buttons don't respond
- ❌ Previews don't update
- ❌ Visual glitches occur
- ❌ User gets confused
- ❌ Noticeable lag/jank

## 🔧 Troubleshooting Commands

**Restart frontend:**
```bash
docker-compose restart frontend
```

**View frontend logs:**
```bash
docker-compose logs -f frontend
```

**Clean restart all services:**
```bash
docker-compose down
docker-compose up -d
```

**Check service status:**
```bash
docker-compose ps
```

## 📊 Performance Expectations

**Load Times:**
- Initial page load: < 2 seconds
- Preview updates: Instant (< 100ms)
- Navigation: Instant (< 50ms)
- Modal open/close: Smooth (200ms transition)

**Interactions:**
- Bud selection: Immediate visual feedback
- Background change: All 5 previews update together
- Font change: Text re-renders instantly
- Slot navigation: No delay

## 🎯 Next Steps After Demo

**If CEO Approves:**
1. Backend integration (product API, bud images)
2. Image generation service (Sharp/Canvas)
3. Real download functionality
4. Production polish (tests, responsive, a11y)
5. Deploy to staging
6. User acceptance testing
7. Production rollout

**If CEO Requests Changes:**
1. Note specific feedback
2. Iterate on demo (easy - frontend only)
3. Re-demo updated version
4. Repeat until approved

**Estimated Timeline:**
- Backend integration: 2-3 days
- Production polish: 1-2 days
- Testing & QA: 1 day
- **Total: 1 week to production** (after approval)

## 📞 Support

**Something not working?**
1. Check this guide's troubleshooting section
2. Check browser console for errors
3. Check `docker-compose logs -f frontend`
4. Try clean restart
5. Verify you're on correct URL

**Everything working?**
🎉 **You're ready to record the demo!** 🎉

---

**Created:** 2026-02-11
**Status:** ✅ Ready for CEO Demo
**Time Investment:** ~6 hours
**Next Milestone:** Backend Integration (post-approval)
