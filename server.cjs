const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.options("*", cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("CORS IS TOTALLY OPEN - V2");
});

mongoose
  .connect(
    process.env.MONGO_URI ||
      "mongodb+srv://baqarboboxidze:baqari123BB@cluster0.3ahnxqz.mongodb.net/supraMenu",
  )
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// სქემა უნდა ემთხვეოდეს შენს JSON-ს
const dishSchema = new mongoose.Schema({
  categoryId: String,
  name: {
    en: String,
    ge: String,
    de: String
  },
  description: {
    en: String,
    ge: String,
    de: String
  },
  price: Number, // აქ შეცდომა გქონდა: Number(price) არ შეიძლება სქემაში
  image: String,
  inStock: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  calories: Number,
  prepTime: String,
  badges: [String],
  allergens: [String],
  portions: [
    {
      label: { en: String, ge: String, de: String },
      weight: String,
      price: Number
    }
  ]
});

const Dish = mongoose.model("Dish", dishSchema);

// --- API ენდპოინტები ---

app.get("/api/menu", async (req, res) => {
  try {
    const menu = await Dish.find();
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/menu", async (req, res) => {
  try {
    // ამოვიღოთ _id თუ ფრონტიდან მოდის, რადგან MongoDB თავისას ქმნის
    const { _id, ...data } = req.body;
    const newItem = new Dish(data);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    console.error("Post Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// განახლება, ნახვები და წაშლა (იგივე რჩება...)
app.patch("/api/menu/:id", async (req, res) => {
  try {
    const updatedDish = await Dish.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedDish);
  } catch (err) {
    res.status(404).json({ message: "კერძი ვერ მოიძებნა" });
  }
});

app.post("/api/menu/:id/view", async (req, res) => {
  try {
    const dish = await Dish.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
    res.json({ success: true, views: dish.views });
  } catch (err) {
    res.status(404).send("Item not found");
  }
});

app.delete("/api/menu/:id", async (req, res) => {
  try {
    await Dish.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "წარმატებით წაიშალა" });
  } catch (err) {
    res.status(404).json({ success: false, message: "კერძი ვერ მოიძებნა" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
