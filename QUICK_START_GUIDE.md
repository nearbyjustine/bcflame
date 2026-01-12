# BC Flame Customization - Quick Start Guide

**System Status:** ✅ Backend Running | ✅ Frontend Ready | ⚠️ 2 Manual Steps Needed

---

## 🚀 Quick Start (5 Minutes)

### 1. Add User Logo Field (2 minutes)
```
1. Open: http://localhost:1337/admin
2. Go to: Settings → Users & Permissions → User
3. Click: "Add another field"
4. Select: "Media" (single file)
5. Name: "reseller_logo"
6. Type: Images only
7. Save
8. Run: docker-compose restart strapi
```

### 2. Create Sample Data (3 minutes minimum)
```
Via Strapi Admin (http://localhost:1337/admin):

Create at least:
- 1 BudStyle
- 1 BackgroundStyle
- 1 FontStyle
- 1 PreBaggingOption (with unit_size like 3.5)
- Upload 5 photos to a Product's available_photos field
```

### 3. Test the System
```
1. Open: http://localhost:3000/login
2. Login with your credentials
3. Go to Products
4. Click "Customize & Order"
5. Complete 4-step wizard
6. Check Orders page for inquiry
```

---

## 📋 Current URLs

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:3000 | ✅ Ready |
| Strapi Admin | http://localhost:1337/admin | ✅ Running |
| Strapi API | http://localhost:1337/api | ✅ Running |
| Products Page | http://localhost:3000/products | ✅ Ready |
| Orders Page | http://localhost:3000/orders | ✅ Ready |
| Settings Page | http://localhost:3000/settings | ✅ Ready |

---

## 🎯 What You Can Do Now

### ✅ Working Features
- User authentication (login/logout)
- Browse product catalog
- Customize products (4-step wizard)
- Submit order inquiries
- View order history
- Upload reseller logo (after manual setup)
- Batch order submission (backend ready)

### ⚠️ Needs Manual Setup First
- Logo upload (needs reseller_logo field)
- Full customization wizard (needs sample data)

---

## 📝 Key Files Created This Session

### Frontend
```
src/lib/api/user.ts                  ✅ NEW - User profile & logo API
src/app/(portal)/settings/page.tsx   ✅ NEW - Settings page
src/stores/authStore.ts              ✅ UPDATED - Logo upload
src/lib/api/customization.ts         ✅ UPDATED - Batch endpoint
```

### Backend
```
src/api/order-inquiry/routes/custom.ts         ✅ NEW - Batch route
src/api/order-inquiry/routes/order-inquiry.ts  ✅ FIXED - Simplified
```

### Documentation
```
SESSION_COMPLETE_SUMMARY.md   ✅ Full implementation details
BACKEND_FIXED.md              ✅ Backend fix details
QUICK_START_GUIDE.md          ✅ This file
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs strapi

# Restart services
docker-compose down
docker-compose up -d
```

### Frontend errors
```bash
# Restart dev server
cd frontend
npm run dev
```

### "Cannot upload logo" error
- Complete Manual Step 1 (add reseller_logo field)
- Restart Strapi after adding field

### "No customization options" error
- Complete Manual Step 2 (seed sample data)
- Refresh the page

---

## 📞 Support

- Check: `SESSION_COMPLETE_SUMMARY.md` for full details
- Check: `BACKEND_FIXED.md` for backend specifics
- Check: `IMPLEMENTATION_STATUS.md` for progress tracking
- Check: `CLAUDE.md` for development commands

---

**Last Updated:** 2026-01-12 14:20 UTC+8
**System Status:** 🟢 Ready for Testing (after 2 manual steps)
