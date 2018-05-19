

var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var request = require("request");


mongoose.connect("mongodb://localhost/gallery");
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

var gallerySchema = new mongoose.Schema({
  title: String,
  url: String,
  category:String,
});

var categorySchema = new mongoose.Schema({
  name:String,
  images:[{
    type:String,
  }],
});

var Gallery = mongoose.model("gallery",gallerySchema);
var Category = mongoose.model("category",categorySchema);

app.get("/",function(req,res){
  res.render("home");
});

app.get("/gallery",function(req,res){
  var allGalleries=[];
  Category.find({},function(err,categories){

    categories.forEach(function(category){

      console.log("Category: "+category.name);
      Gallery.find({category:category.name},function(err,images){
        var gallery={name:category.name, images:images};
        allGalleries.push(gallery);
        console.log(gallery);
        if(allGalleries.length == categories.length)
          res.render("gallery",{galleries:allGalleries});
      });

    });
  });
});

app.post("/gallery",function(req,res){
  var title = req.body.title;
  var url = req.body.url;
  if(title=="" || url==""){
    res.redirect("/");
    return;
  }
  var category;
  var newCategory=false;
  if(req.body.category=="Select Category"){
    res.redirect("/");
    return;
  }
  else if(req.body.newCategory=="" || req.body.newCategory==undefined)
    category = (req.body.category).toLowerCase();
  else{
    category = (req.body.newCategory).toLowerCase();
    newCategory=true;
  }

  // Creating new category in database
  if(newCategory==true){
    Category.create({name:category},function(){
      console.log("[+] New category created: "+category);
    });
  }

  Gallery.create({
    title:title,
    url:url,
    category:category,
  },function(err,gallery){
      // Push the new image url to the category
    Category.update(
      {name:category},
      {$push: {images:url}},function(err,raw){
        console.log(err);
      }
    );
    if(err)
      console.log(err);
    else
      res.redirect("/gallery");
  });
});

// submit new image
app.get("/gallery/new",function(req,res){
  // get all categories from database
  Category.find({},function(err,categories){
    if(err)
      console.log(err);
    else 
      res.render("newImage",{categories:categories});
  })
});


app.listen(80, function(){
  console.log("[!] Server is listeniing on port 80");
});