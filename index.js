const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcrypt");
const ejs=require("ejs");
Schema = mongoose.Schema

const app = express();

app.set("view engine","ejs");

app.use(
    session({
        secret:"node-js",
        resave:false,
        saveUninitialized:false
    })
)

app.use(
    express.urlencoded({
        extended:true
    })
);

app.use(express.static("public"));


mongoose.set('strictQuery',true);
mongoose.connect("mongodb://0.0.0.0:27017/blog", { useNewUrlParser: true });

const userSchema = mongoose.Schema({
    name:String,
    email:String,
    password:String,
    dob:String

});

const User =new mongoose.model("user",userSchema);

const blogSchema =mongoose.Schema({
    blog:String,
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

const Blog = new mongoose.model("blog",blogSchema);

app.get("/",async function(req,res){
    let blogs=await Blog.find().sort({_id:-1}).limit(2);

    if(req.session.email){
        let _user = await User.findOne({email:req.session.email});
        if(_user) return res.redirect("/profile");
        return res.render("home",{blogs});
    }
    return res.render("home",{blogs});
});


app.get("/login",async function(req,res){
    if(req.session.email){
        let _user = await User.findOne({email:req.session.email});
        if(_user) return res.redirect("/profile");
        return res.render("login");
    }
    return res.render("login");
});


app.get("/register",async function(req,res){
    if(req.session.email){
        let _user = await User.findOne({email:req.session.email});
        if(_user) return res.redirect("/profile");
        return res.render("register");
    }
    return res.render("register");
});


app.get("/profile",async function(req,res){
    
    if(req.session.email){
        let _user = await User.findOne({email:req.session.email});
        console.log("-----------------",_user)
        let _blogs=await Blog.find({userId:_user._id}).sort({_id:-1});
        console.log(_blogs)
        if(_user) return res.render("profile",{_user,_blogs});
        return res.redirect("/login");
    }
    return res.redirect("/login");
});

app.get("/blog",async function(req,res){
    console.log("=====================",req.session.email)
    if(req.session.email){
    return res.render("blog");
    }
    return res.redirect("/")
});


app.get("/success", async function(req,res){
    return res.render("success");
});

app.post("/blog",async function(req,res){
    const {blog }=req.body;
    if (req.session.email) {
        let _user=await User.findOne({email:req.session.email})
        let _blog = new Blog({
            blog,
            userId:_user._id
        });
        let __blog =await _blog.save();
        return res.redirect("/success")
    }

});


app.get("/logout",async function(req,res){
    if(req.session){
        req.session.destroy(function(err){
            if(err){
                console.log(err);
            }else{
                console.log("logout");
                return res.redirect("/");
            }
        })
    }
})



app.post("/login",async function (req, res) {
    const { email, password } = req.body;

  let _user = await User.findOne({ email })
            if (_user) {
               let newpass= bcrypt.compare(password,_user.password);
                if (newpass) {
                    req.session.email =_user.email;
                    console.log(_user)
                    res.redirect("/profile")
                } else {
                   return res.send("Incorrect password");
                }
            } else {
               return res.redirect("/");
            }
});


app.post("/register", async function (req, res) {
    const { name, email, password, conpassword, dob } = req.body;
     let _user=await User.findOne({ email: email })
        if (_user) {
            return res.redirect("/login");
        } else {
            let salt = await bcrypt.genSalt(10);
            let hashPass = await bcrypt.hash(password, salt);

            const newUser = new User({
                name,
                email,
                password:hashPass,
                dob
            });

            if (password === conpassword) {
                 let __user=await newUser.save();
                        
                    req.session.email = __user.email;
                    return res.redirect("/profile");
            }
        }
    
});





app.listen(5000, function (params) {
    console.log("Server");
});