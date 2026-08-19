# 🏛️ DharoharAI

## AI-Powered Heritage Monument Inspection & Preservation

     for live demo :- http://localhost:3000/

> **Preserving the past with the intelligence of AI.**

**Team:** Legacy Forge

DharoharAI is an AI-powered heritage conservation platform designed to help identify, document, and monitor the physical condition of historical monuments.

The platform analyzes monument images to detect visible deterioration, assess monument condition, maintain digital inspection records, track changes over time, and provide AI-assisted conservation recommendations.

---

## 🌟 Why DharoharAI?

Heritage monuments are continuously exposed to environmental conditions, aging, biological growth, and physical deterioration. Regular inspection is essential, but manual assessment can be time-consuming and difficult to scale.

DharoharAI supports heritage inspection through AI-assisted visual analysis and digital condition monitoring.

### Our Approach

**Detect Early → Assess Condition → Recommend Action → Monitor Changes → Preserve Heritage**

---

## ✨ Key Features

### 🔍 AI Physical Damage Detection

DharoharAI analyzes monument images for multiple types of visible deterioration:

- 🕸️ **Crack Detection**
- 🟤 **Corrosion Detection**
- 🎨 **Discoloration Detection**
- 🧱 **Building Damage Detection**
- 🪨 **Spalling Detection**
- 🌿 **Vegetation Growth Detection**

Multiple specialized computer-vision models are combined into a unified inspection workflow.

---

### 📊 Heritage Dashboard

A centralized dashboard provides an overview of monument conditions and inspection activity.

**Key information includes:**

- Overall condition status
- Detected damage categories
- Inspection history
- Monument information
- Recent assessments

---

### 🗂️ Digital Documentation

Create structured digital records for heritage inspections.

Records can include:

- Monument name
- Location
- Inspection date
- Inspector details
- Monument images
- Detected conditions
- Inspection notes
- Condition assessment
- Recommendations

This creates a consistent digital record for future reference.

---

### 📈 Deterioration Timeline

DharoharAI enables comparison of inspection records across different periods.

The timeline can help identify whether a monument's condition is:

- 🟢 **Stable**
- 🔵 **Improving**
- 🔴 **Deteriorating**

Historical inspection records support better long-term conservation planning.

---

### 🛠️ Inspection Recommendations

Based on detected conditions, the platform provides AI-assisted recommendations to help prioritize further inspection and maintenance.

Examples include:

- Structural inspection for significant cracks or damage
- Vegetation removal and monitoring
- Corrosion assessment
- Investigation of possible moisture-related discoloration
- Professional assessment of severe surface deterioration

> **AI recommendations are intended to support conservation professionals and do not replace expert structural assessment.**

---

## 🧠 AI Detection Pipeline

```text
                 Monument Image
                       │
                       ▼
                Image Processing
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
      Crack        Corrosion     Discoloration
        │              │              │
        ├──────────────┼──────────────┤
        ▼              ▼              ▼
 Building Damage    Spalling      Vegetation
        │              │              │
        └──────────────┼──────────────┘
                       ▼
               Detection Results
                       │
                       ▼
              Condition Assessment
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
       Digital Record      Recommendations
             │
             ▼
       Heritage Timeline
