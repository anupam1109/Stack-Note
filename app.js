var express			 		= require('express'),
	mongoose		 		= require('mongoose'),
	bodyParser		 		= require('body-parser'),
	passport		 		= require('passport'),
	LocalStrategy	 		= require('passport-local'),
	methodOverride			= require('method-override'),
	passportLocalMongoose	= require('passport-local-mongoose'),
	expressSession 			= require('express-session');
	Note 					= require('./models/note'),
	flash					= require('connect-flash'),
	User					= require('./models/user');

// mongoose.connect("mongodb://localhost/notes", { useNewUrlParser: true });
mongoose.connect("mongodb://anupam:anupam11@ds245512.mlab.com:45512/stacknote", { useNewUrlParser: true });

var app = express();
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended : true}));
app.use(methodOverride("_method"));
app.use(flash());	

// PASSPORT CONFIGURATION
app.use(require("express-session")({
	secret : "One true God",
	resave : false,
	saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser  = req.user;
	res.locals.error 		= req.flash("error");
	res.locals.success	    = req.flash("success");
	next();
});


app.get("/", function(req, res){
	res.render("landing");
});

// Show all notes
app.get("/notes", isLoggedIn, function(req, res){
	User.findById(req.user._id).populate("notes").exec(function(err, user){
		if(err) {
			console.log(err)
		} else {
			res.render("index", {user : user});
		}
	});
});

// Show form to create a new note
app.get("/notes/new", isLoggedIn, function(req, res){
	res.render("new");
});

// Create a new note
app.post("/notes", isLoggedIn, function(req, res){
	Note.create(req.body.note, function(err, note){
		if(err) {
			req.flash("Error", "Something went wrong! Please try again.");
			console.log(err);
		} else {
			req.user.notes.push(note);
			req.user.save();
			req.flash("success", "Successfully added a note!");
			res.redirect("/notes");
		}
	});
});

// Show edit form
app.get("/notes/:id/edit", isLoggedIn, function(req, res){
	Note.findById(req.params.id, function(err, foundNote){
		if(err) {
			req.flash("Error", "Sorry! your note could not be found!");
			console.log(err);
		} else {
			res.render("edit", {note : foundNote});
		}
	});
});

// Edit 
app.put("/notes/:id/edit", isLoggedIn, function(req, res){
	var note = req.body.note;
	Note.findByIdAndUpdate(req.params.id, note, function(err, updatedNote){
		if(err) {
			req.flash("error", "Something went wrong! Please try again.");
			console.log(err);
		} else {
			req.flash("success", "Note updated successfully!");
			res.redirect("/notes");
		}
	});
});

// Delete note
app.delete("/notes/:id", isLoggedIn, function(req, res){
	Note.findByIdAndRemove(req.params.id, function(err){
		if(err) {
			console.log(err);
		} else {
			req.flash("success", "Note deleted successfully!");
			res.redirect("/notes");
		}
	});
});

// Authentication routes

// Show registration form
app.get("/register", function(req, res){
	res.render("register");
});

// Register a new user
app.post("/register", function(req, res){
	var user = new User ({
						username : req.body.username,
						email    : req.body.email
					});
	User.register(user, req.body.password, function(err, user){
		if(err){
			req.flash("error", err.message);
			console.log(err);
			return res.render("register");
		}
		else {
				passport.authenticate("local")(req, res, function(){
				req.flash("success", "Welcome to Notes " + user.username);
				res.redirect("/notes");
			});
		}
	});
});

// Show login form
app.get("/login", function(req, res){
	res.render("login");
});

// Login
app.post("/login", passport.authenticate("local",
	{
		successRedirect : "/notes",
		failureRedirect : "/login"
	}), function(req, res){
});

// Logout
app.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Successfully Logged out!");
	res.redirect("/");
});

// Middlewares

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "Please Login To Proceed!");
	res.redirect("/login");
}

// Listening to the server

app.listen(process.env.PORT || 8000, function(req, res){
	console.log("Server Started!");
});	