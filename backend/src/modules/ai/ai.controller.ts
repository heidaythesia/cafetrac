import { Request, Response, NextFunction } from 'express';
import { InventoryItem } from '../inventory/inventory.model';
import { WasteLog } from '../waste-logs/wasteLog.model';
import { buildLocationFilter } from '../../utils/locationFilter';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini SDK (Fallback to mock if API key missing)
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const getAIRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);

    // 1. Gather historical data (last 30 days of waste logs)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const wasteLogs = await WasteLog.find({ ...filter, createdAt: { $gte: thirtyDaysAgo } });

    // 2. Gather current inventory
    const inventory = await InventoryItem.find({ ...filter, isArchived: false });

    // 3. Summarize waste by item
    const wasteMap: Record<string, { qty: number, cost: number, reasons: string[] }> = {};
    wasteLogs.forEach((log: any) => {
      if (!wasteMap[log.itemName]) {
        wasteMap[log.itemName] = { qty: 0, cost: 0, reasons: [] };
      }
      wasteMap[log.itemName].qty += log.quantity;
      wasteMap[log.itemName].cost += log.totalCost;
      if (!wasteMap[log.itemName].reasons.includes(log.reason)) {
        wasteMap[log.itemName].reasons.push(log.reason);
      }
    });

    const wasteSummary = Object.keys(wasteMap).map(name => ({
      name,
      totalWasteQty: wasteMap[name].qty,
      totalWasteCost: wasteMap[name].cost,
      reasons: wasteMap[name].reasons.join(', ')
    })).sort((a, b) => b.totalWasteCost - a.totalWasteCost).slice(0, 10);

    const inventorySummary = inventory.map((item: any) => ({
      name: item.name,
      currentStock: item.currentStock,
      parLevel: item.parLevel
    }));

    // 4. Construct AI Prompt
    const prompt = `
      You are CafeTrac AI, an expert cafe operations analyst. 
      Analyze the following 30-day waste data and current inventory data for a cafe location.
      Provide highly actionable, specific recommendations to reduce waste, handle leftovers, and optimize 'par levels' (the baseline inventory target).
      
      Top Waste Items (Last 30 Days):
      ${JSON.stringify(wasteSummary, null, 2)}
      
      Current Inventory Snapshot:
      ${JSON.stringify(inventorySummary, null, 2)}
      
      Return EXACTLY a valid JSON object with the following schema:
      {
        "insights": ["insight 1", "insight 2"],
        "smartParLevelAdjustments": [
          { "itemName": "Milk", "currentPar": 20, "recommendedPar": 15, "reason": "High spoilage rate detected." }
        ],
        "leftoverHandling": ["tip 1", "tip 2"]
      }
      Do NOT include markdown block ticks like \`\`\`json. Just raw JSON.
    `;

    let aiResponseText = "";

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        aiResponseText = result.response.text();
      } catch (e) {
        console.error("Gemini AI Error:", e);
        // Fallback to mock on error
        genAI === null;
      }
    }

    if (!genAI || !aiResponseText) {
      // Mock Response if no API key or error
      const mockAdjustments = wasteSummary.slice(0, 3).map(w => {
        const invItem = inventorySummary.find((i: any) => i.name === w.name);
        return {
          itemName: w.name,
          currentPar: invItem ? invItem.parLevel : 0,
          recommendedPar: invItem ? Math.max(0, invItem.parLevel - Math.ceil(w.totalWasteQty / 4)) : 0,
          reason: `High waste detected due to ${w.reasons}. Consider reducing weekly par level by approx 25% of wasted amount.`
        };
      });

      const mockResponse = {
        insights: [
          `Your highest cost waste is from ${wasteSummary[0]?.name || 'unknown'}.`,
          `Consider tracking the exact time of day when spoilage occurs most frequently.`
        ],
        smartParLevelAdjustments: mockAdjustments,
        leftoverHandling: [
          `For perishable items like ${wasteSummary[0]?.name || 'food'}, consider end-of-day discounts (e.g., Too Good To Go integration).`,
          `Implement a stricter FIFO (First In, First Out) policy in the walk-in fridge.`
        ]
      };
      aiResponseText = JSON.stringify(mockResponse);
    }

    // Parse Response
    let data;
    try {
      // Strip out markdown if the AI mistakenly added it
      const cleanedText = aiResponseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      data = JSON.parse(cleanedText);
    } catch (err) {
      console.error("Failed to parse AI JSON:", aiResponseText);
      return res.status(500).json({ success: false, error: { message: "AI response parsing failed" } });
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
