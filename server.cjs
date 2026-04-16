const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// ყველაფრის გამხსნელი CORS
app.use(cors());
app.options("*", cors());
app.use(express.json());

// ტესტ როუტი - რომ დავრწმუნდეთ რომ ეს კოდი მუშაობს
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

const Dish = mongoose.model(
  "Dish",
  new mongoose.Schema({
    name: String,
    price: Number,
    description: String,
    image: String,
    inStock: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
  }),
);

app.get("/api/menu", async (req, res) => {
  try {
    res.json(await Dish.find());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/menu", async (req, res) => {
  try {
    const newItem = new Dish(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. კერძის განახლება
app.patch("/api/menu/:id", async (req, res) => {
  try {
    const updatedDish = await Dish.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }, // დააბრუნოს უკვე განახლებული ვერსია
    );
    res.json(updatedDish);
  } catch (err) {
    res.status(404).json({ message: "კერძი ვერ მოიძებნა" });
  }
});

// 4. ნახვების დათვლა
app.post("/api/menu/:id/view", async (req, res) => {
  try {
    const dish = await Dish.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } }, // $inc ზრდის მნიშვნელობას 1-ით
      { new: true },
    );
    res.json({ success: true, views: dish.views });
  } catch (err) {
    res.status(404).send("Item not found");
  }
});

// 5. წაშლა
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
