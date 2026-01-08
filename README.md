
# 🌿 NatureDexUI

![Expo](https://img.shields.io/badge/Expo-49-blue)
![React%20Native](https://img.shields.io/badge/React%20Native-0.73-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

NatureDexUI is the **mobile frontend** for **NatureDex**, a real-world species identification system inspired by the Pokédex.  
Capture a photo of a plant and instantly receive its **scientific name, common name, and description** using **NatureDexAPI**.

---

## Features

- 📸 Capture plant photos using the device camera  
- 🌱 Identify species via **NatureDexAPI**  
- 📖 View scientific name, common name, and description  
- 🎨 Pokédex-inspired UI with smooth animations  
- 📱 Optimized for Android (iOS-ready)

---

## Tech Stack

- **Expo**
- **React Native**
- **TypeScript**
- **expo-camera**
- **expo-file-system**
- **NatureDexAPI (FastAPI backend)**

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:
```
EXPO_PUBLIC_API_BASE_URL=http://YOUR_BACKEND_IP:8000` 
```
Example (local backend):
```
EXPO_PUBLIC_API_BASE_URL=http://[IP address]:8000` 
```

 >⚠️ `localhost` will not work on physical devices.  
 >Always use your machine’s local IP address.

### 3. Start the app

`npx expo start` 

Open the app using:

-   📱 **Expo Go** (recommended)
    
-   🤖 Android Emulator
    
-   🍎 iOS Simulator (macOS only)
---
## Usage

1.  Launch the app
    
2.  Grant camera permission
    
3.  Take a photo of a plant
    
4.  Wait for identification
    
5.  View species details in the result panel
---
## Backend Integration

NatureDexUI depends on **NatureDexAPI** for plant identification and data enrichment.

**NatureDexAPI features:**

-   Hugging Face plant classification
    
-   Species enrichment via **iNaturalist** and **Wikipedia**
    
-   Confidence thresholding for reliable predictions
    

🔗 Backend repository:  
👉 [https://github.com/rainyDayssss/NatureDexAPI](https://github.com/rainyDayssss/NatureDexAPI)

---
## License

MIT © 2026 Jhon Rosell B. Talisic