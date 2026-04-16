const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors({
  origin: "https://hacker-pshorr777.page.gd"
}));
app.use(express.json());

const DATA_FILE = path.join(__dirname, "menu_data.json");

// დამხმარე ფუნქციები მონაცემებთან მუშაობისთვის
const readData = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(content || "[]");
  } catch (err) {
    console.error("Error reading data:", err);
    return [];
  }
};

const writeData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing data:", err);
  }
};

// 1. ყველა კერძის წამოღება
app.get("/api/menu", (req, res) => {
  res.json(readData());
});

// 2. ახალი კერძის დამატება
app.post("/api/menu", (req, res) => {
  const menu = readData();
  const newItem = {
    ...req.body,
    _id: req.body._id || `item_${Date.now()}`, // თუ ID არ მოყვება, თავად ვქმნით
    views: 0,
  };
  menu.push(newItem);
  writeData(menu);
  res.status(201).json(newItem);
});

// 3. კერძის განახლება (ზოგადი რედაქტირება + InStock სტატუსი)
app.patch("/api/menu/:id", (req, res) => {
  const { id } = req.params;
  const menu = readData();

  // ვეძებთ ინდექსს ორივე ვარიანტით (_id ან id)
  const index = menu.findIndex((i) => i._id === id || i.id === id);

  if (index !== -1) {
    // ვაერთიანებთ ძველ და ახალ მონაცემებს
    menu[index] = { ...menu[index], ...req.body };
    writeData(menu);
    res.json(menu[index]);
  } else {
    res.status(404).json({ message: "კერძი ვერ მოიძებნა" });
  }
});

// 4. ნახვების დათვლა
app.post("/api/menu/:id/view", (req, res) => {
  const { id } = req.params;
  const menu = readData();
  const index = menu.findIndex((i) => i._id === id || i.id === id);

  if (index !== -1) {
    menu[index].views = (menu[index].views || 0) + 1;
    writeData(menu);
    res.json({ success: true, views: menu[index].views });
  } else {
    res.status(404).send("Item not found");
  }
});

// 5. წაშლა (აქ იყო მთავარი პრობლემა)
app.delete("/api/menu/:id", (req, res) => {
  const { id } = req.params;
  const originalData = readData();

  // ვფილტრავთ ისე, რომ წაიშალოს თუ ემთხვევა ან _id-ს, ან id-ს
  const filteredData = originalData.filter((item) => {
    const itemId = item._id || item.id;
    return itemId !== id;
  });

  if (originalData.length === filteredData.length) {
    return res
      .status(404)
      .json({ success: false, message: "კერძი ვერ მოიძებნა ფაილში" });
  }

  writeData(filteredData);
  res.json({ success: true, message: "წარმატებით წაიშალა" });
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));
