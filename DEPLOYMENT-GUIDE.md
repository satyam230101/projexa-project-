# 🚀 DEPLOYMENT GUIDE - Medi+ Application

## Current Status

✅ **Frontend**: COMPLETE & RUNNING
- Development server: http://localhost:5173/
- HealthReportUpload: Connected to API ✓
- AIChat: Connected to API ✓

✅ **Backend Code**: READY
- File: `supabase/functions/server/index.tsx`
- All endpoints implemented and tested

---

## 📋 Deployment Steps

### Step 1: Install Supabase CLI (if not already installed)
```bash
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```
- Opens browser, authorize with your Supabase account
- Confirm in terminal

### Step 3: Deploy Edge Functions
```bash
supabase functions deploy server
```

That's it! Your API will be live at:
```
https://imsdbgjyvetadbgjpxse.supabase.co/functions/v1/make-server-21d26442/
```

---

## 📡 API Endpoints (After Deployment)

### AI Chat (Public)
```
POST /make-server-21d26442/ai/chat
Content-Type: application/json

{
  "message": "I have a fever"
}
```

### Health Reports Upload (Authenticated)
```
POST /make-server-21d26442/health-reports
Authorization: Bearer {auth_token}
Content-Type: application/json

{
  "fileName": "report.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024,
  "category": "Blood Test",
  "notes": "Fasting blood test"
}
```

### Get User's Health Reports (Authenticated)
```
GET /make-server-21d26442/health-reports/my
Authorization: Bearer {auth_token}
```

---

## 🧪 Testing After Deployment

### Test AI Chat (PowerShell)
```powershell
$payload = '{"message":"I have a fever"}' | ConvertTo-Json
Invoke-RestMethod `
  -Uri "https://imsdbgjyvetadbgjpxse.supabase.co/functions/v1/make-server-21d26442/ai/chat" `
  -Method Post `
  -ContentType "application/json" `
  -Body $payload
```

### Test Health Check
```bash
curl https://imsdbgjyvetadbgjpxse.supabase.co/functions/v1/make-server-21d26442/health
```

---

## 🛠️ Troubleshooting

**Issue**: "supabase: command not found"
- **Solution**: Install globally: `npm install -g supabase`

**Issue**: "Not authenticated"
- **Solution**: Run `supabase login` first

**Issue**: API returns 401 Unauthorized
- **Solution**: Check your Authorization header has valid JWT token from login

**Issue**: Health Reports upload fails
- **Solution**: Ensure you're authenticated. Use token from browser localStorage after login

---

## 📁 Project Structure
```
/
├── src/
│   └── app/
│       ├── components/
│       │   ├── HealthReportUpload.tsx ✓ CONNECTED
│       │   └── AIChat.tsx ✓ CONNECTED
│       └── context/
│           └── AuthContext.tsx (Handles all API calls)
├── supabase/
│   └── functions/
│       └── server/
│           └── index.tsx ✓ READY TO DEPLOY
└── package.json
```

---

## 🎯 Features Implemented

✅ User Authentication  
✅ Health Report Upload  
✅ AI Health Chat Assistant  
✅ Doctor Consultation Booking  
✅ User Profile Management  
✅ Admin Dashboard  
✅ Contact Form  
✅ KV Store for data persistence  

---

## 📞 Support

For issues:
1. Check browser console for errors (F12)
2. Check Supabase dashboard for function logs
3. Verify auth token is valid
4. Ensure Content-Type headers are set correctly

---

**Last Updated**: 2026-03-10
**Project ID**: imsdbgjyvetadbgjpxse
