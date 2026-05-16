const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("CORS IS TOTALLY OPEN - V2");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

const dishSchema = new mongoose.Schema({
  categoryId: String,
  name: {
    en: { type: String, default: "" },
    ge: { type: String, default: "" },
    de: { type: String, default: "" },
    ru: { type: String, default: "" },
  },
  description: {
    en: { type: String, default: "" },
    ge: { type: String, default: "" },
    de: { type: String, default: "" },
    ru: { type: String, default: "" },
  },
  price: Number,
  image: String,
  inStock: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  calories: Number,
  prepTime: String,
  badges: [String],
  allergens: [String],
  portions: [
    {
      label: {
        en: { type: String, default: "" },
        ge: { type: String, default: "" },
        de: { type: String, default: "" },
        ru: { type: String, default: "" },
      },
      weight: String,
      price: Number,
    },
  ],
});

const categorySchema = new mongoose.Schema({
  id: String,
  name: {
    en: { type: String, default: "" },
    ge: { type: String, default: "" },
    de: { type: String, default: "" },
    ru: { type: String, default: "" },
  },
  icon: String,
});

const Dish = mongoose.model("Dish", dishSchema);
const Category = mongoose.model("Category", categorySchema);

// ---- MENU ENDPOINTS ----
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
    const { _id, ...data } = req.body;
    data.name = { en: "", ge: "", de: "", ru: "", ...data.name };
    data.description = { en: "", ge: "", de: "", ru: "", ...data.description };
    const newItem = new Dish(data);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    console.error("Post Error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/menu/:id", async (req, res) => {
  try {
    const { _id, __v, ...data } = req.body;
    const flatData = {};
    for (const [key, value] of Object.entries(data)) {
      if (
        value !== null &&
        value !== undefined &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        for (const [subKey, subValue] of Object.entries(value)) {
          flatData[`${key}.${subKey}`] = subValue ?? "";
        }
      } else {
        flatData[key] = value;
      }
    }
    const updatedDish = await Dish.findByIdAndUpdate(
      req.params.id,
      { $set: flatData },
      { returnDocument: "after" },
    );
    res.json(updatedDish);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/menu/:id/view", async (req, res) => {
  try {
    const dish = await Dish.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true },
    );
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

// ---- CATEGORY ENDPOINTS ----
app.get("/api/categories", async (req, res) => {
  try {
    const cats = await Category.find();
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const cat = new Category(req.body);
    await cat.save();
    res.status(201).json(cat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/categories/:id", async (req, res) => {
  try {
    const updated = await Category.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true },
    );
    res.json(updated);
  } catch (err) {
    res.status(404).json({ message: "კატეგორია ვერ მოიძებნა" });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    await Category.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ success: false });
  }
});

const ReviewSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

app.post("/api/reviews", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "ტექსტი ცარიელია" });
    }
    const newReview = await Review.create({ text });
    res.status(201).json({ success: true, data: newReview });
  } catch (error) {
    res.status(500).json({ error: "სერვერის შეცდომა" });
  }
});

app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: "სერვერის შეცდომა" });
  }
});

app.delete("/api/reviews/:id", async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "წაიშალა წარმატებით" });
  } catch (error) {
    res.status(500).json({ error: "ვერ წაიშალა" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
