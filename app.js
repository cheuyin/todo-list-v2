//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-stanley:MoYqZcngVOvVJGjl@cluster0.nxcra.mongodb.net/todolistDB?retryWrites=true&w=majority");

const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Do 2 hours of web deb",
})

const item2 = new Item({
  name: "Study driving for 1 hour",
})

const item3 = new Item({
  name: "Learn more about binary trees for 1 hour",
})

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, (err, items) => {
    if (err) {
      console.log(err);
    } else {
      if (items.length === 0) {
        Item.insertMany(defaultItems, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Default items successfully added");
          }
        });
        res.redirect("/");        
      } else {
        res.render("list", {listTitle: "Today", newListItems: items});
      }
    }
  })
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({name: itemName});
  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

});

app.post("/delete", (req, res) => {
  const itemID = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove({_id: itemID}, (err) => {
      if (!err) {
        console.log("Successfully deleted item.");
      } else {
        console.log(err);
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, 
      {$pull: {items: {_id: itemID}}}, (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      })
  }
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      if (result === null) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: result.name, newListItems: result.items})
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port === null || port == "") {
  port = 3000;
} 
app.listen(port, function() {
  console.log("Server has started successfully");
});
