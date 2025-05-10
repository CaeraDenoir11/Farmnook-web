export default function handler (req, res) {
    if (req.method !== 'GET') {
        return res.status(405).end(`Method ${req.method} Not Allowed`);
       
    }
 const pricing_rules = pricing_rules = {
  "Motorcycle with Box":         { "base_fee": 80,   "weight_fee": 1.0,  "pickup_fee": 6.0,   "delivery_fee": 7.0, "base_km": 2 }, 
  "Tricycle":                    { "base_fee": 80,   "weight_fee": 0.8,  "pickup_fee": 6.0,   "delivery_fee": 9.0, "base_km": 2 },  
  "Small Multicab":              { "base_fee": 100,  "weight_fee": 1.0,  "pickup_fee": 7.0,   "delivery_fee": 12.0, "base_km": 3 },  
  "Large Multicab":              { "base_fee": 115,  "weight_fee": 0.9,  "pickup_fee": 8.0,   "delivery_fee": 14.0, "base_km": 3 }, 
  "Small Delivery Van":          { "base_fee": 200,  "weight_fee": 0.8,  "pickup_fee": 9.0,   "delivery_fee": 16.0, "base_km": 5 },  
  "Large Delivery Van":          { "base_fee": 240,  "weight_fee": 0.7,  "pickup_fee": 10.0,  "delivery_fee": 18.0, "base_km": 5 },
  "Small Pickup Truck":          { "base_fee": 280,  "weight_fee": 0.7,  "pickup_fee": 10.0,  "delivery_fee": 17.0, "base_km": 5 }, 
  "Medium Pickup Truck":         { "base_fee": 940,  "weight_fee": 0.6,  "pickup_fee": 11.0,  "delivery_fee": 18.0, "base_km": 5 },
  "Large Pickup Truck":          { "base_fee": 1040, "weight_fee": 0.5,  "pickup_fee": 12.0,  "delivery_fee": 20.0, "base_km": 5 },
  "Heavy Duty Pickup Truck":     { "base_fee": 1450, "weight_fee": 0.4,  "pickup_fee": 13.0,  "delivery_fee": 22.0, "base_km": 5 },
  "Dropside Truck":              { "base_fee": 4420, "weight_fee": 0.3,  "pickup_fee": 14.0,  "delivery_fee": 23.0, "base_km": 5 }, 
  "Elf Truck":                   { "base_fee": 1040, "weight_fee": 0.35, "pickup_fee": 13.0,  "delivery_fee": 22.0, "base_km": 5 },
  "10 Wheeler Cargo Truck":      { "base_fee": 7200, "weight_fee": 0.2,  "pickup_fee": 30.0,  "delivery_fee": 45.0, "base_km": 5 }, 
  "10 Wheeler Dump Truck":       { "base_fee": 7500, "weight_fee": 0.2,  "pickup_fee": 32.0,  "delivery_fee": 48.0, "base_km": 5 },
  "Small Refrigerated Van":      { "base_fee": 200,  "weight_fee": 0.8,  "pickup_fee": 9.0,   "delivery_fee": 18.0, "base_km": 5 },
  "Medium Refrigerated Van":     { "base_fee": 240,  "weight_fee": 0.7,  "pickup_fee": 10.0,  "delivery_fee": 19.0, "base_km": 5 }, 
  "Large Refrigerated Van":      { "base_fee": 280,  "weight_fee": 0.6,  "pickup_fee": 11.0,  "delivery_fee": 20.0, "base_km": 5 }, 
  "Small Refrigerated Truck":    { "base_fee": 940,  "weight_fee": 0.5,  "pickup_fee": 11.0,  "delivery_fee": 21.0, "base_km": 5 }, 
  "Medium Refrigerated Truck":   { "base_fee": 1450, "weight_fee": 0.4,  "pickup_fee": 12.0,  "delivery_fee": 22.0, "base_km": 5 }, 
  "Large Refrigerated Truck":    { "base_fee": 4420, "weight_fee": 0.3,  "pickup_fee": 13.0,  "delivery_fee": 24.0, "base_km": 5 },
  "10 Wheeler Reefer Truck":     { "base_fee": 7200, "weight_fee": 0.2,  "pickup_fee": 35.0,  "delivery_fee": 50.0, "base_km": 5 }, 
  "Small Livestock Truck":       { "base_fee": 240,  "weight_fee": 0.7,  "pickup_fee": 10.0,  "delivery_fee": 18.0, "base_km": 5 },
  "Medium Livestock Truck":      { "base_fee": 1040, "weight_fee": 0.5,  "pickup_fee": 11.0,  "delivery_fee": 21.0, "base_km": 5 }, 
  "Large Livestock Truck":       { "base_fee": 1450, "weight_fee": 0.3,  "pickup_fee": 13.0,  "delivery_fee": 24.0, "base_km": 5 }, 
  "10 Wheeler Livestock Truck":  { "base_fee": 7200, "weight_fee": 0.2,  "pickup_fee": 33.0,  "delivery_fee": 46.0, "base_km": 5 }  
}

res.status(200).json(pricing_rules);
}


